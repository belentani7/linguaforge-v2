import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import {
  finishAutomationRun,
  getAutomationJobByTaskUid,
  getGrowthSummary,
  startAutomationRun,
  updateAutomationJobRun,
} from "./db";

export function buildExecutionKey(
  taskUid: string,
  runHeader: string | undefined,
  nowMs = Date.now(),
) {
  return runHeader || `${taskUid}:${Math.floor(nowMs / 60000)}`;
}

type ScheduledDependencies = {
  authenticate: (
    req: Request,
  ) => Promise<{ isCron?: boolean; taskUid?: string }>;
  getJob: (
    taskUid: string,
  ) => Promise<
    | {
        id: number;
        ownerUserId: number;
        status: "draft" | "paused" | "active" | "failed";
      }
    | undefined
  >;
  startRun: (jobId: number, executionKey: string) => Promise<boolean>;
  updateRun: (
    taskUid: string,
    status: string,
    error?: string | null,
    result?: string | null,
  ) => Promise<void>;
  finishRun: (
    executionKey: string,
    status: "completed" | "failed" | "duplicate",
    error?: string | null,
  ) => Promise<void>;
  growthSummary: (
    userId: number,
  ) => Promise<{
    diagnosticsCompleted: number;
    lessonsCompleted: number;
    feedbackSubmitted: number;
  }>;
};

const defaultDependencies: ScheduledDependencies = {
  authenticate: (req) => sdk.authenticateRequest(req),
  getJob: getAutomationJobByTaskUid,
  startRun: startAutomationRun,
  updateRun: updateAutomationJobRun,
  finishRun: finishAutomationRun,
  growthSummary: getGrowthSummary,
};

export async function handleAutomationHeartbeat(
  req: Request,
  res: Response,
  dependencies: ScheduledDependencies = defaultDependencies,
) {
  const timestamp = new Date().toISOString();
  let executionKey: string | undefined;
  let taskUid: string | undefined;
  try {
    const user = await dependencies.authenticate(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }
    taskUid = user.taskUid;
    const runHeader = req.header("x-manus-run-uid") ?? req.header("x-run-uid");
    executionKey = buildExecutionKey(taskUid, runHeader);

    const job = await dependencies.getJob(taskUid);
    if (!job) return res.json({ ok: true, skipped: "orphan" });
    const started = await dependencies.startRun(job.id, executionKey);
    if (!started) return res.json({ ok: true, duplicate: true, executionKey });
    if (job.status !== "active") {
      await dependencies.updateRun(taskUid, "skipped-paused");
      await dependencies.finishRun(executionKey, "completed");
      return res.json({ ok: true, skipped: job.status, executionKey });
    }

    const report = await dependencies.growthSummary(job.ownerUserId);
    const serializedReport = JSON.stringify(report);
    await dependencies.updateRun(taskUid, "completed", null, serializedReport);
    await dependencies.finishRun(executionKey, "completed");
    return res.json({
      ok: true,
      jobId: job.id,
      status: "completed",
      executionKey,
      report,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown scheduled job error";
    if (taskUid) {
      try {
        await dependencies.updateRun(taskUid, "failed", message);
        if (executionKey)
          await dependencies.finishRun(executionKey, "failed", message);
      } catch {
        // Preserve the original 500 response without leaking auth details.
      }
    }
    return res.status(500).json({ error: message, timestamp });
  }
}
