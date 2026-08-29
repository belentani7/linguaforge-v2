export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
} as const;

const REQUIRED_IN_PRODUCTION = [
  ["JWT_SECRET", ENV.cookieSecret],
  ["DATABASE_URL", ENV.databaseUrl],
  ["OAUTH_SERVER_URL", ENV.oAuthServerUrl],
] as const;

/**
 * Fail fast when production is missing a secret it cannot run without.
 * Kept explicit instead of a zod schema so a missing variable surfaces a
 * readable name instead of a generic "Required" message.
 */
export function assertEnv(): void {
  if (ENV.isProduction) {
    const missing = REQUIRED_IN_PRODUCTION.filter(([, value]) => !value).map(
      ([name]) => name,
    );
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables in production: ${missing.join(", ")}`,
      );
    }
  }
  if (!ENV.cookieSecret) {
    console.warn(
      "[Env] JWT_SECRET is empty — session tokens cannot be signed or verified.",
    );
  }
}
