import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocalCompletionNotice } from "@/hooks/useLocalCompletionNotice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Bell,
  BellOff,
  Check,
  ChevronRight,
  CircleUserRound,
  Flame,
  Globe2,
  Headphones,
  Languages,
  LayoutDashboard,
  LockKeyhole,
  Moon,
  PencilLine,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Volume2,
  WandSparkles,
  Zap,
} from "lucide-react";

const LANGUAGE_VISUALS: Record<string, { flag: string; tone: string }> = {
  es: { flag: "ES", tone: "coral" },
  en: { flag: "EN", tone: "blue" },
  zh: { flag: "中", tone: "red" },
  hi: { flag: "हि", tone: "gold" },
  ar: { flag: "ع", tone: "green" },
  pt: { flag: "PT", tone: "purple" },
  bn: { flag: "বাং", tone: "teal" },
  ru: { flag: "РУ", tone: "indigo" },
  ja: { flag: "日", tone: "rose" },
  fr: { flag: "FR", tone: "amber" },
};
type CatalogLanguage = {
  code: string;
  name: string;
  native: string;
  flag: string;
  tone: string;
};

const LEVELS = [
  {
    code: "A1",
    label: "Descubrimiento",
    desc: "Frases cotidianas y bases esenciales",
    progress: 100,
  },
  {
    code: "A2",
    label: "Fundamentos",
    desc: "Interacciones sencillas con confianza",
    progress: 68,
  },
  {
    code: "B1",
    label: "Independencia",
    desc: "Conversaciones sobre temas familiares",
    progress: 24,
  },
  {
    code: "B2",
    label: "Fluidez",
    desc: "Ideas complejas y conversación natural",
    progress: 0,
  },
  {
    code: "C1",
    label: "Dominio",
    desc: "Comunicación flexible y precisa",
    progress: 0,
  },
  {
    code: "C2",
    label: "Maestría",
    desc: "Comprensión y expresión experta",
    progress: 0,
  },
];

const MODULE_VISUALS = {
  vocabulary: { label: "Vocabulario", icon: BookOpen, color: "bg-teal" },
  grammar: { label: "Gramática", icon: PencilLine, color: "bg-indigo" },
  pronunciation: { label: "Pronunciación", icon: Volume2, color: "bg-coral" },
  conversation: { label: "Conversación", icon: Headphones, color: "bg-gold" },
} as const;
const LESSONS = [
  {
    title: "Presentarte con naturalidad",
    module: "Conversación",
    time: "8 min",
    xp: "+25 XP",
    icon: Headphones,
    color: "bg-coral",
  },
  {
    title: "Los verbos esenciales",
    module: "Gramática",
    time: "12 min",
    xp: "+35 XP",
    icon: PencilLine,
    color: "bg-indigo",
  },
  {
    title: "Tu rutina diaria",
    module: "Vocabulario",
    time: "10 min",
    xp: "+30 XP",
    icon: BookOpen,
    color: "bg-teal",
  },
];

type PracticeExercise = {
  type: string;
  question: string;
  answer: string;
  options: string[];
};

const EXERCISES = [
  {
    type: "Completar frase",
    question: "I ___ learning Spanish every day.",
    answer: "am",
    options: ["is", "am", "are", "be"],
  },
  {
    type: "Traducción",
    question: "Traduce: “Nos vemos mañana”",
    answer: "See you tomorrow",
    options: [
      "See you tomorrow",
      "Good night",
      "I see you today",
      "Until later",
    ],
  },
  {
    type: "Opción múltiple",
    question: "¿Qué significa “to improve”?",
    answer: "Mejorar",
    options: ["Empezar", "Mejorar", "Recordar", "Escuchar"],
  },
];

function LanguageMark({
  language,
  size = "md",
}: {
  language: CatalogLanguage;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={`language-mark ${size} tone-${language.tone}`}
      aria-label={language.name}
    >
      {language.flag}
    </span>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: typeof Flame;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${accent}`}>
        <Icon size={18} />
      </div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function MediaShelf({
  assets,
}: {
  assets: Array<{
    id: number;
    kind: string;
    title: string;
    publicUrl: string;
    mimeType: string;
    license: string;
  }>;
}) {
  if (!assets.length) return null;
  return (
    <section className="media-shelf" aria-labelledby="media-shelf-title">
      <div>
        <p className="eyebrow">Recursos verificados</p>
        <h2 id="media-shelf-title">Escucha y observa en contexto</h2>
      </div>
      <div className="media-grid">
        {assets.map((asset) => (
          <article className="media-card" key={asset.id}>
            <div className="media-card-head">
              <Volume2 size={18} />
              <span>{asset.kind}</span>
            </div>
            <h3>{asset.title}</h3>
            {asset.kind === "video" ? (
              <video controls preload="metadata" src={asset.publicUrl}>
                {asset.title}
              </video>
            ) : (
              <audio controls preload="metadata" src={asset.publicUrl}>
                {asset.title}
              </audio>
            )}
            <small>Licencia: {asset.license}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Home({
  initialSection = "dashboard",
  initialTarget = "es",
  initialNative = "es",
  initialDark = false,
}: {
  initialSection?: string;
  initialTarget?: string;
  initialNative?: string;
  initialDark?: boolean;
}) {
  const { user, isAuthenticated } = useAuth();
  const localNotice = useLocalCompletionNotice();
  const [active, setActive] = useState(initialSection);
  const [profileName, setProfileName] = useState("");
  const [target, setTarget] = useState(initialTarget);
  const [nativeLanguage, setNativeLanguage] = useState(initialNative);
  const [targetCodes, setTargetCodes] = useState<string[]>(["es"]);
  const { data: backendLanguages = [] } = trpc.languages.list.useQuery();
  const { data: profilePreferences } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  useEffect(() => {
    const persistedTargets = profilePreferences?.targetLanguageCodes ?? [];
    if (user?.name) setProfileName(user.name);
    if (profilePreferences?.nativeLanguageCode)
      setNativeLanguage(profilePreferences.nativeLanguageCode);
    if (persistedTargets.length) {
      setTargetCodes(persistedTargets);
      setTarget((current) =>
        persistedTargets.includes(current) ? current : persistedTargets[0],
      );
    }
  }, [profilePreferences, user?.name]);
  const { data: progressSummary } = trpc.progress.summary.useQuery(
    { targetLanguageCode: target },
    { enabled: isAuthenticated },
  );
  const [sourceLanguage, setSourceLanguage] = useState(initialNative);
  useEffect(() => {
    if (profilePreferences?.nativeLanguageCode)
      setSourceLanguage(profilePreferences.nativeLanguageCode);
  }, [profilePreferences?.nativeLanguageCode]);
  const { data: learningModules = [] } = trpc.learning.modules.useQuery(
    { targetLanguageCode: target, sourceLanguageCode: sourceLanguage },
    { enabled: Boolean(target && sourceLanguage) },
  );
  const progressLevels = useMemo(() => {
    const completed = progressSummary?.lessonsCompleted ?? 0;
    const currentIndex = Math.max(
      0,
      LEVELS.findIndex((level) => level.code === progressSummary?.currentLevel),
    );
    return LEVELS.map((level, index) => ({
      ...level,
      progress:
        index < currentIndex
          ? 100
          : index === currentIndex
            ? Math.min(99, completed * 10)
            : 0,
    }));
  }, [progressSummary?.currentLevel, progressSummary?.lessonsCompleted]);
  const featuredLesson = learningModules.find(
    (lesson) => lesson.lessonId !== null,
  );
  const { data: srsQueue } = trpc.srs.queue.useQuery(
    { targetLanguageCode: target, limit: 24 },
    { enabled: isAuthenticated },
  );
  const { data: publishedMedia = [] } = trpc.media.published.useQuery({
    languageCode: target,
  });
  const feedbackMutation = trpc.growth.feedback.useMutation({
    onSuccess: () => toast.success("Gracias: feedback guardado para revisión"),
    onError: (error) =>
      toast.error("No se pudo guardar el feedback", {
        description: error.message,
      }),
  });
  const srsReview = trpc.srs.review.useMutation({
    onSuccess: () => toast.success("Repaso guardado"),
  });
  const availableLanguages = useMemo<CatalogLanguage[]>(
    () =>
      backendLanguages.map((language) => ({
        code: language.code,
        name: language.name,
        native: language.nativeName,
        ...(LANGUAGE_VISUALS[language.code] ?? {
          flag: language.code.toUpperCase(),
          tone: "blue",
        }),
      })),
    [backendLanguages],
  );
  const { data: availablePaths = [] } = trpc.languages.paths.useQuery({
    sourceCode: sourceLanguage,
    targetCode: target,
  });
  const activePath = availablePaths[0];
  const [dark, setDark] = useState(initialDark);
  const [diagnosticStep, setDiagnosticStep] = useState(-1);
  const [exerciseStep, setExerciseStep] = useState(0);
  const [exerciseChoice, setExerciseChoice] = useState<string | null>(null);
  const [practiceFilter, setPracticeFilter] = useState("Todos");
  const practiceLevel = (practiceFilter === "Todos" ? "A1" : practiceFilter) as
    | "A1"
    | "A2"
    | "B1"
    | "B2"
    | "C1"
    | "C2";
  const { data: practiceExercises = [] } = trpc.practice.random.useQuery(
    { targetLanguageCode: target, level: practiceLevel, limit: 10 },
    { enabled: isAuthenticated },
  );
  const profileUpdate = trpc.profile.update.useMutation();
  const diagnosticStart = trpc.diagnostic.start.useMutation();
  const diagnosticComplete = trpc.diagnostic.complete.useMutation({
    onSuccess: (result) => {
      setDiagnosticStep(-1);
      toast.success(`Nivel recomendado: ${result.recommendedLevel}`);
      localNotice.notifyCompletion(
        "Diagnóstico completado",
        `Nivel recomendado: ${result.recommendedLevel}`,
      );
    },
  });

  const selectedLanguage = useMemo(
    () =>
      availableLanguages.find((language) => language.code === target) ??
      availableLanguages[0],
    [availableLanguages, target],
  );
  const backendExercise =
    practiceExercises[exerciseStep % Math.max(practiceExercises.length, 1)];
  const currentExercise: PracticeExercise | null = backendExercise
    ? {
        type: backendExercise.kind,
        question: backendExercise.prompt,
        answer: backendExercise.answer,
        options: Array.isArray(backendExercise.options)
          ? backendExercise.options.filter(
              (option): option is string => typeof option === "string",
            )
          : [],
      }
    : null;

  const goTo = (next: string) => setActive(next);
  const selectExercise = (choice: string) => {
    setExerciseChoice(choice);
    if (currentExercise && choice === currentExercise.answer)
      toast.success("Respuesta correcta", {
        description: "+10 XP añadidos a tu progreso",
      });
    else toast.error("Casi. Revisa la explicación y vuelve a intentarlo.");
  };

  return (
    <div className={dark ? "app-shell dark-mode" : "app-shell"}>
      <header className="topbar">
        <button
          type="button"
          className="brand"
          onClick={() => goTo("dashboard")}
        >
          <div className="brand-mark">
            <Languages size={21} />
          </div>
          <span>
            Lingua<span>Forge</span>
          </span>
        </button>
        <div className="topbar-actions">
          <button
            className="icon-button"
            aria-label="Cambiar tema"
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {localNotice.supported && (
            <button
              type="button"
              className="icon-button"
              aria-label={
                localNotice.enabled
                  ? "Desactivar avisos locales"
                  : "Activar avisos locales"
              }
              title={
                localNotice.enabled
                  ? "Avisos locales activos"
                  : "Activar avisos locales"
              }
              onClick={() => {
                if (localNotice.enabled) localNotice.disable();
                else void localNotice.requestPermission();
              }}
            >
              {localNotice.enabled ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
          )}
          {isAuthenticated ? (
            <button className="profile-chip" onClick={() => goTo("profile")}>
              <span className="avatar">{(user?.name ?? "A").slice(0, 1)}</span>
              <span>{user?.name ?? "Mi perfil"}</span>
            </button>
          ) : (
            <Button onClick={() => startLogin()} className="button-dark">
              Entrar
            </Button>
          )}
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="Navegación principal">
          <div className="sidebar-section">
            <span className="sidebar-label">APRENDER</span>
            <button
              className={
                active === "dashboard" ? "nav-item active" : "nav-item"
              }
              onClick={() => goTo("dashboard")}
            >
              <LayoutDashboard size={18} />
              Resumen
            </button>
            <button
              className={
                active === "languages" ? "nav-item active" : "nav-item"
              }
              onClick={() => goTo("languages")}
            >
              <Globe2 size={18} />
              Mis idiomas{" "}
              <span className="nav-count">{targetCodes.length}</span>
            </button>
            <button
              className={active === "practice" ? "nav-item active" : "nav-item"}
              onClick={() => goTo("practice")}
            >
              <WandSparkles size={18} />
              Práctica libre
            </button>
            <button
              className={active === "review" ? "nav-item active" : "nav-item"}
              onClick={() => goTo("review")}
            >
              <BrainCircuit size={18} />
              Repaso SRS <span className="nav-dot" />
            </button>
          </div>
          <div className="sidebar-section">
            <span className="sidebar-label">TU CUENTA</span>
            <button
              className={active === "profile" ? "nav-item active" : "nav-item"}
              onClick={() => goTo("profile")}
            >
              <CircleUserRound size={18} />
              Perfil y preferencias
            </button>
          </div>
          <div className="sidebar-bottom">
            <div className="sidebar-tip">
              <Sparkles size={17} />
              <div>
                <strong>Un poco cada día</strong>
                <span>La constancia vence al talento.</span>
              </div>
            </div>
            <div className="open-source-note">
              Código y contenido abierto
              <br />
              <span>Hecho para aprender juntos.</span>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="content-wrap">
            {active === "dashboard" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">MI ESPACIO DE APRENDIZAJE</p>
                    <h1>
                      Buenos días. <em>Sigamos.</em>
                    </h1>
                    <p className="subheading">
                      Tu próxima conversación empieza con una pequeña práctica.
                    </p>
                  </div>
                  <Button
                    onClick={() => goTo("practice")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        goTo("practice");
                      }
                    }}
                    className="button-coral"
                  >
                    <Play size={16} fill="currentColor" />
                    Continuar aprendiendo
                  </Button>
                </div>
                <div className="metric-grid">
                  <Metric
                    icon={Flame}
                    value={`${progressSummary?.streakDays ?? 0} días`}
                    label="Racha actual"
                    accent="coral"
                  />
                  <Metric
                    icon={Zap}
                    value={(progressSummary?.xp ?? 0).toLocaleString("es-ES")}
                    label="XP acumulada"
                    accent="gold"
                  />
                  <Metric
                    icon={BookOpen}
                    value={String(progressSummary?.lessonsCompleted ?? 0)}
                    label="Lecciones hechas"
                    accent="indigo"
                  />
                  <Metric
                    icon={Target}
                    value={progressSummary?.currentLevel ?? "A1"}
                    label={`Nivel actual · ${(selectedLanguage?.code ?? target).toUpperCase()}`}
                    accent="teal"
                  />
                </div>
                <div className="dashboard-grid">
                  <Card className="progress-card">
                    <CardHeader>
                      <div className="card-heading-row">
                        <div>
                          <p className="eyebrow">
                            TU RUTA ·{" "}
                            {(selectedLanguage?.name ?? "Idioma").toUpperCase()}
                          </p>
                          <CardTitle>Mapa de progreso</CardTitle>
                        </div>
                        <Select value={target} onValueChange={setTarget}>
                          <SelectTrigger className="language-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLanguages.map((language) => (
                              <SelectItem
                                key={language.code}
                                value={language.code}
                              >
                                {language.native}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="level-list">
                        {progressLevels.map((level, index) => (
                          <div
                            className={`level-row ${level.progress > 0 ? "unlocked" : "locked"}`}
                            key={level.code}
                          >
                            <div className="level-badge">
                              {level.progress === 100 ? (
                                <Check size={16} />
                              ) : level.progress > 0 ? (
                                level.code
                              ) : (
                                <LockKeyhole size={14} />
                              )}
                            </div>
                            <div className="level-copy">
                              <div>
                                <strong>
                                  {level.code} · {level.label}
                                </strong>
                                <span>{level.desc}</span>
                              </div>
                              {level.progress > 0 && (
                                <div className="level-progress">
                                  <Progress value={level.progress} />
                                  <small>{level.progress}%</small>
                                </div>
                              )}
                            </div>
                            <ChevronRight size={18} className="level-arrow" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="today-card">
                    <CardHeader>
                      <p className="eyebrow">PARA HOY</p>
                      <CardTitle>Tu siguiente paso</CardTitle>
                      <CardDescription>
                        Una sesión breve para mantener el ritmo.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {featuredLesson ? (
                        <>
                          <div className="today-lesson">
                            <div className="today-icon">
                              <Headphones size={22} />
                            </div>
                            <div>
                              <Badge variant="secondary">
                                {
                                  MODULE_VISUALS[featuredLesson.moduleType]
                                    .label
                                }{" "}
                                · {featuredLesson.levelCode}
                              </Badge>
                              <h3>{featuredLesson.lessonTitle}</h3>
                              <p>
                                {featuredLesson.lessonSummary ??
                                  "Una lección persistida para avanzar en tu ruta."}
                              </p>
                              <div className="lesson-meta">
                                <span>
                                  {featuredLesson.estimatedMinutes} minutos
                                </span>
                                <span>+{featuredLesson.xpReward} XP</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            className="button-dark full-button"
                            onClick={() => goTo("lesson")}
                          >
                            Empezar lección <ArrowRight size={16} />
                          </Button>
                        </>
                      ) : (
                        <div className="today-lesson">
                          <div className="today-icon">
                            <BookOpen size={22} />
                          </div>
                          <div>
                            <Badge variant="outline">CONTENIDO PENDIENTE</Badge>
                            <h3>Tu siguiente lección aparecerá aquí.</h3>
                            <p>
                              Importa contenido con licencia para activar la
                              ruta.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">CONTINÚA TU RUTA</p>
                    <h2>Lecciones recomendadas</h2>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => goTo("languages")}
                  >
                    Ver mapa completo <ArrowRight size={15} />
                  </button>
                </div>
                <div className="lesson-grid">
                  {learningModules
                    .filter((lesson) => lesson.lessonId !== null)
                    .slice(0, 6)
                    .map((lesson) => {
                      const visual = MODULE_VISUALS[lesson.moduleType];
                      const Icon = visual.icon;
                      return (
                        <button
                          type="button"
                          className="lesson-card"
                          key={lesson.lessonId}
                          onClick={() => goTo("lesson")}
                        >
                          <div className={`lesson-card-icon ${visual.color}`}>
                            <Icon size={20} />
                          </div>
                          <div className="lesson-card-body">
                            <Badge variant="outline">
                              {visual.label} · {lesson.levelCode}
                            </Badge>
                            <h3>{lesson.lessonTitle}</h3>
                            <p>
                              {lesson.estimatedMinutes} min · +{lesson.xpReward}{" "}
                              XP
                            </p>
                          </div>
                          <ChevronRight size={18} className="lesson-arrow" />
                        </button>
                      );
                    })}
                  {!learningModules.some(
                    (lesson) => lesson.lessonId !== null,
                  ) && (
                    <div className="empty-content-state">
                      <Badge variant="outline">CONTENIDO PENDIENTE</Badge>
                      <p>
                        Las lecciones recomendadas aparecerán aquí cuando se
                        importe contenido validado para esta ruta.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {active === "languages" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">MIS IDIOMAS</p>
                    <h1>
                      Elige tu <em>próximo mundo.</em>
                    </h1>
                    <p className="subheading">
                      Cada idioma abre una nueva forma de mirar.
                    </p>
                  </div>
                  <div className="pair-route">
                    <span>
                      {activePath
                        ? `${activePath.sourceName} → ${activePath.targetName}`
                        : "Ruta bidireccional"}
                    </span>
                    <Select
                      value={sourceLanguage}
                      onValueChange={setSourceLanguage}
                    >
                      <SelectTrigger aria-label="Idioma de origen">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLanguages.map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            {language.native}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <ArrowRight size={15} />
                    <Select value={target} onValueChange={setTarget}>
                      <SelectTrigger aria-label="Idioma de destino">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLanguages
                          .filter(
                            (language) => language.code !== sourceLanguage,
                          )
                          .map((language) => (
                            <SelectItem
                              key={language.code}
                              value={language.code}
                            >
                              {language.native}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <small>
                      {activePath
                        ? `${activePath.entryCount ?? 0} entradas`
                        : "Preparando ruta"}
                    </small>
                  </div>
                </div>
                <div className="language-grid">
                  {availableLanguages.map((language, index) => (
                    <button
                      type="button"
                      className={`language-card ${index < 2 ? "selected" : ""}`}
                      key={language.code}
                      onClick={() => {
                        setTarget(language.code);
                        goTo("dashboard");
                      }}
                    >
                      <div className="language-card-top">
                        <LanguageMark language={language} size="lg" />
                        {index < 2 ? (
                          <Badge className="status-badge">En curso</Badge>
                        ) : (
                          <Badge variant="outline">Explorar</Badge>
                        )}
                      </div>
                      <h3>{language.native}</h3>
                      <p>
                        {language.name} · {language.code.toUpperCase()}
                      </p>
                      {index < 2 ? (
                        <>
                          <div className="language-card-progress">
                            <Progress value={index === 0 ? 62 : 18} />
                            <span>{index === 0 ? "B1" : "A1"}</span>
                          </div>
                          <small>
                            {index === 0
                              ? "62% del nivel actual"
                              : "Comenzando"}
                          </small>
                        </>
                      ) : (
                        <div className="language-cta">
                          Iniciar diagnóstico <ArrowRight size={15} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <Card className="diagnostic-banner">
                  <div className="diagnostic-illustration">
                    <Target size={32} />
                  </div>
                  <div>
                    <p className="eyebrow">NUEVO IDIOMA</p>
                    <h2>Empieza con una evaluación que te entiende.</h2>
                    <p>
                      El diagnóstico adapta la ruta a lo que ya sabes, sin
                      hacerte repetir lo obvio.
                    </p>
                  </div>
                  <Button
                    className="button-dark"
                    onClick={() => setDiagnosticStep(0)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        setDiagnosticStep(0);
                      }
                    }}
                  >
                    Hacer diagnóstico <ArrowRight size={16} />
                  </Button>
                </Card>
              </>
            )}

            {active === "practice" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">PRÁCTICA LIBRE</p>
                    <h1>
                      Entrena lo que <em>necesitas.</em>
                    </h1>
                    <p className="subheading">
                      Sesiones aleatorias para reforzar cualquier área de tu
                      ruta.
                    </p>
                  </div>
                  <div className="practice-streak">
                    <Flame size={18} />
                    {progressSummary?.streakDays ?? 0} días de racha
                  </div>
                </div>
                <Card className="practice-panel">
                  <div className="practice-filters">
                    <div>
                      <label htmlFor="practice-language">Idioma</label>
                      <Select value={target} onValueChange={setTarget}>
                        <SelectTrigger id="practice-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLanguages.map((language) => (
                            <SelectItem
                              key={language.code}
                              value={language.code}
                            >
                              {language.native}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="practice-level">Nivel</label>
                      <Select
                        value={practiceFilter}
                        onValueChange={setPracticeFilter}
                      >
                        <SelectTrigger id="practice-level">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Todos", ...LEVELS.map((level) => level.code)].map(
                            (level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="practice-topic">Tema</label>
                      <Select defaultValue="Todos">
                        <SelectTrigger id="practice-topic">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Todos",
                            "Vida cotidiana",
                            "Viajes",
                            "Trabajo",
                            "Conversación",
                          ].map((topic) => (
                            <SelectItem key={topic} value={topic}>
                              {topic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="practice-divider" />
                  <div className="practice-start">
                    <div className="practice-orbit">
                      <BrainCircuit size={33} />
                    </div>
                    <div>
                      <h2>Una práctica hecha para hoy</h2>
                      <p>
                        {practiceExercises.length} ejercicios · Vocabulario y
                        conversación ·{" "}
                        {practiceFilter === "Todos"
                          ? "Todos los niveles"
                          : practiceFilter}
                      </p>
                    </div>
                    <Button
                      className="button-coral"
                      onClick={() => goTo("exercise")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          goTo("exercise");
                        }
                      }}
                    >
                      Comenzar <ArrowRight size={16} />
                    </Button>
                  </div>
                </Card>
                <div className="section-heading compact">
                  <div>
                    <p className="eyebrow">FORMATOS</p>
                    <h2>Entrena cada destreza</h2>
                  </div>
                </div>
                <div className="skill-grid">
                  {[
                    {
                      icon: BookOpen,
                      title: "Vocabulario",
                      desc: "Palabras que se quedan",
                      color: "teal",
                    },
                    {
                      icon: PencilLine,
                      title: "Gramática",
                      desc: "Estructuras que fluyen",
                      color: "indigo",
                    },
                    {
                      icon: Volume2,
                      title: "Pronunciación",
                      desc: "Sonar con naturalidad",
                      color: "coral",
                    },
                    {
                      icon: Headphones,
                      title: "Conversación",
                      desc: "Usar el idioma de verdad",
                      color: "gold",
                    },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.title}
                      className="skill-card"
                      onClick={() => goTo("exercise")}
                    >
                      <div className={`skill-icon ${item.color}`}>
                        <item.icon size={20} />
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.desc}</p>
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {active === "review" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">REPETICIÓN ESPACIADA</p>
                    <h1>
                      Recuerda más, <em>esfúerzate menos.</em>
                    </h1>
                    <p className="subheading">
                      Tu memoria tiene un ritmo. Nosotros lo seguimos.
                    </p>
                  </div>
                  <div className="review-count">
                    <strong>{srsQueue?.dueCount ?? 0}</strong>
                    <span>tarjetas pendientes</span>
                  </div>
                </div>
                <Card className="review-hero">
                  <div className="review-hero-icon">
                    <BrainCircuit size={28} />
                  </div>
                  <div>
                    <p className="eyebrow">SESIÓN DE HOY</p>
                    <h2>
                      {srsQueue?.dueCount ?? 0} tarjetas listas para repasar
                    </h2>
                    <p>
                      Una sesión de 8 minutos mantiene activas tus palabras más
                      importantes.
                    </p>
                    <div className="review-stats">
                      <span>
                        <strong>
                          {Math.ceil((srsQueue?.dueCount ?? 0) / 2)}
                        </strong>{" "}
                        nuevas
                      </span>
                      <span>
                        <strong>
                          {Math.floor((srsQueue?.dueCount ?? 0) / 2)}
                        </strong>{" "}
                        para reforzar
                      </span>
                    </div>
                  </div>
                  <Button
                    className="button-dark"
                    onClick={() => goTo("review-session")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        goTo("review-session");
                      }
                    }}
                  >
                    Repasar ahora <ArrowRight size={16} />
                  </Button>
                </Card>
                <div className="section-heading compact">
                  <div>
                    <p className="eyebrow">TU RITMO</p>
                    <h2>Memoria en movimiento</h2>
                  </div>
                </div>
                <div className="memory-grid">
                  <Card>
                    <CardHeader>
                      <CardTitle>Retención estimada</CardTitle>
                      <CardDescription>Últimos 30 días</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="empty-content-state">
                        <Badge variant="outline">DATOS PENDIENTES</Badge>
                        <p>
                          La retención aparecerá después de acumular revisiones
                          SRS reales.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Próximas revisiones</CardTitle>
                      <CardDescription>Distribución de tu cola</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="empty-content-state">
                        <Badge variant="outline">COLA VACÍA</Badge>
                        <p>
                          La distribución se calculará cuando existan tarjetas
                          persistidas.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {active === "lesson" && (
              <LessonView
                lesson={featuredLesson}
                onBack={() => goTo("dashboard")}
                onDone={() => {
                  toast.success("Lección completada", {
                    description: "+25 XP y progreso actualizado",
                  });
                  localNotice.notifyCompletion(
                    "Lección completada",
                    "+25 XP y progreso actualizado",
                  );
                  goTo("dashboard");
                }}
              />
            )}
            {active === "exercise" && (
              <ExerciseView
                exercise={currentExercise}
                choice={exerciseChoice}
                onChoice={selectExercise}
                onNext={() => {
                  setExerciseStep((step) => step + 1);
                  setExerciseChoice(null);
                }}
                onBack={() => goTo("practice")}
              />
            )}
            {active === "review-session" && (
              <ReviewView
                language={selectedLanguage}
                cards={srsQueue?.cards ?? []}
                onReview={(cardId, rating) =>
                  srsReview.mutate({ cardId, rating })
                }
                onBack={() => goTo("review")}
              />
            )}
            {active === "profile" && (
              <ProfileView
                userName={profileName || user?.name || "Alex"}
                onUserNameChange={setProfileName}
                nativeLanguage={nativeLanguage}
                onNativeLanguageChange={setNativeLanguage}
                target={target}
                targetCodes={targetCodes}
                languages={availableLanguages}
                onTargetChange={(code) => {
                  setTarget(code);
                  setTargetCodes((current) =>
                    current.includes(code) ? current : [...current, code],
                  );
                }}
                onTargetsChange={setTargetCodes}
                onSave={() =>
                  profileUpdate.mutate(
                    {
                      name: profileName || user?.name || "Alex",
                      nativeLanguageCode: nativeLanguage,
                      targetLanguageCodes: targetCodes,
                    },
                    {
                      onSuccess: (result) => {
                        setTargetCodes(result.targetLanguageCodes);
                        toast.success("Preferencias guardadas");
                      },
                    },
                  )
                }
                onFeedback={async (category, message) => {
                  await feedbackMutation.mutateAsync({ category, message });
                }}
                feedbackPending={feedbackMutation.isPending}
                feedbackError={feedbackMutation.error?.message}
              />
            )}
          </div>
        </main>
        <MediaShelf assets={publishedMedia} />
        <footer className="app-footer">
          LinguaForge · Proyecto firmado por Pedro Belentani ·{" "}
          <a href="https://belentani.eu" target="_blank" rel="noreferrer">
            belentani.eu
          </a>
        </footer>
      </div>
      {diagnosticStep >= 0 && active === "languages" && (
        <DiagnosticModal
          language={selectedLanguage}
          step={diagnosticStep}
          onClose={() => setDiagnosticStep(-1)}
          onStart={() => {
            diagnosticStart.mutate({ targetLanguageCode: target });
            setDiagnosticStep(1);
            toast("Diagnóstico preparado", {
              description:
                "Valora cuatro habilidades para estimar tu punto de partida.",
            });
          }}
          onComplete={(scores) =>
            diagnosticComplete.mutate({ targetLanguageCode: target, scores })
          }
        />
      )}
    </div>
  );
}

function LessonView({
  lesson,
  onBack,
  onDone,
}: {
  lesson?: {
    lessonTitle: string | null;
    lessonSummary: string | null;
    moduleType: string;
    levelCode: string;
    estimatedMinutes: number | null;
    xpReward: number | null;
  } | null;
  onBack: () => void;
  onDone: () => void;
}) {
  if (!lesson)
    return (
      <div className="lesson-view">
        <button className="back-link" onClick={onBack}>
          ← Volver al resumen
        </button>
        <Card className="lesson-activity">
          <Badge variant="outline">CONTENIDO PENDIENTE</Badge>
          <h1>No hay una lección disponible.</h1>
          <p className="subheading">
            La lección aparecerá cuando exista contenido importado y validado
            para este idioma.
          </p>
        </Card>
      </div>
    );
  return (
    <div className="lesson-view">
      <button className="back-link" onClick={onBack}>
        ← Volver al resumen
      </button>
      <div className="lesson-progress-head">
        <span>{lesson.estimatedMinutes ?? 0} minutos</span>
        <span>+{lesson.xpReward ?? 0} XP</span>
      </div>
      <Progress value={25} />
      <div className="lesson-intro">
        <Badge>
          {lesson.moduleType.toUpperCase()} · {lesson.levelCode}
        </Badge>
        <h1>{lesson.lessonTitle ?? "Lección sin título"}</h1>
        <p>
          {lesson.lessonSummary ??
            "Una lección persistida para avanzar en tu ruta."}
        </p>
      </div>
      <Card className="lesson-activity">
        <div className="activity-top">
          <span>01 / 04</span>
          <Badge variant="outline">Escucha y repite</Badge>
        </div>
        <div className="listen-card">
          <button className="play-circle" aria-label="Reproducir audio">
            <Volume2 size={24} />
          </button>
          <div>
            <strong>My name is Alex.</strong>
            <span>Mi nombre es Alex.</span>
          </div>
          <button className="small-icon" aria-label="Repetir audio">
            <RotateCcw size={16} />
          </button>
        </div>
        <div className="activity-question">
          <p>Escucha la frase y selecciona su significado.</p>
          <div className="answer-grid">
            <Button variant="outline">Me llamo Alex.</Button>
            <Button variant="outline">Vivo con Alex.</Button>
            <Button variant="outline">Conozco a Alex.</Button>
            <Button variant="outline">Alex es mi amigo.</Button>
          </div>
        </div>
        <Button className="button-coral full-button" onClick={onDone}>
          Comprobar respuesta <Check size={16} />
        </Button>
      </Card>
    </div>
  );
}

function ExerciseView({
  exercise,
  choice,
  onChoice,
  onNext,
  onBack,
}: {
  exercise: PracticeExercise | null;
  choice: string | null;
  onChoice: (choice: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  if (!exercise)
    return (
      <div className="exercise-view">
        <button className="back-link" onClick={onBack}>
          ← Volver a práctica libre
        </button>
        <Card className="exercise-card">
          <div className="exercise-label">
            <Badge variant="outline">CONTENIDO PENDIENTE</Badge>
          </div>
          <h1>Aún no hay ejercicios importados.</h1>
          <p className="subheading">
            La práctica se activará cuando exista contenido con licencia para
            este idioma y nivel.
          </p>
        </Card>
      </div>
    );
  return (
    <div className="exercise-view">
      <button className="back-link" onClick={onBack}>
        ← Volver a práctica libre
      </button>
      <div className="exercise-progress">
        <Progress value={52} />
        <span>Pregunta 3 de 10</span>
      </div>
      <Card className="exercise-card">
        <div className="exercise-label">
          <Badge>{exercise.type}</Badge>
          <span>+10 XP</span>
        </div>
        <h1>{exercise.question}</h1>
        <div className="option-list">
          {exercise.type === "fill_blank" || exercise.type === "translation" ? (
            <Input
              value={choice ?? ""}
              onChange={(event) => onChoice(event.target.value)}
              aria-label={
                exercise.type === "fill_blank"
                  ? "Completa la frase"
                  : "Escribe la traducción"
              }
              placeholder={
                exercise.type === "fill_blank"
                  ? "Escribe la palabra que falta"
                  : "Escribe tu traducción"
              }
            />
          ) : exercise.type === "matching" ? (
            <div className="matching-grid" role="list">
              {exercise.options.map((option, index) => (
                <button
                  type="button"
                  key={option}
                  className={`option-button matching-option ${choice === option ? (option === exercise.answer ? "correct" : "wrong") : ""}`}
                  onClick={() => onChoice(option)}
                >
                  <span aria-hidden="true">{index + 1}</span>
                  {option}
                  {choice === option && option === exercise.answer && (
                    <Check size={18} />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="option-list">
              {exercise.options.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`option-button ${choice === option ? (option === exercise.answer ? "correct" : "wrong") : ""}`}
                  onClick={() => onChoice(option)}
                >
                  {option}
                  {choice === option && option === exercise.answer && (
                    <Check size={18} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {choice && (
          <div
            className={`answer-feedback ${choice === exercise.answer ? "success" : "error"}`}
          >
            <strong>
              {choice === exercise.answer ? "Muy bien." : "Aún no."}
            </strong>
            <span>
              {choice === exercise.answer
                ? "Tu respuesta es correcta."
                : `La respuesta correcta es “${exercise.answer}”.`}
            </span>
          </div>
        )}
        <Button
          className="button-dark full-button"
          disabled={!choice}
          onClick={onNext}
        >
          {choice ? "Siguiente ejercicio" : "Elige una respuesta"}{" "}
          <ArrowRight size={16} />
        </Button>
      </Card>
    </div>
  );
}

function ReviewView({
  language,
  cards,
  onReview,
  onBack,
}: {
  language?: CatalogLanguage;
  cards: Array<{
    id: number;
    sourceText: string;
    targetText: string;
    dueAt: Date;
    intervalDays: number;
  }>;
  onReview: (
    cardId: number,
    rating: "again" | "hard" | "good" | "easy",
  ) => void;
  onBack: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const card = cards[0];
  if (!card)
    return (
      <div className="review-view">
        <button className="back-link" onClick={onBack}>
          ← Volver a repaso
        </button>
        <Card className="flashcard">
          <div className="flashcard-top">
            <Badge variant="outline">COLA VACÍA</Badge>
            <span>Repaso SRS</span>
          </div>
          <div className="flashcard-word">
            <span>No hay tarjetas pendientes.</span>
          </div>
          <p className="subheading">
            Las nuevas tarjetas aparecerán cuando exista contenido importado y
            una sesión de aprendizaje registrada.
          </p>
        </Card>
      </div>
    );
  return (
    <div className="review-view">
      <button className="back-link" onClick={onBack}>
        ← Volver a repaso
      </button>
      <div className="exercise-progress">
        <Progress value={cards.length ? 18 : 0} />
        <span>
          {cards.length
            ? `1 de ${cards.length} tarjetas`
            : "No hay tarjetas pendientes"}
        </span>
      </div>
      <Card className="flashcard">
        <div className="flashcard-top">
          <Badge variant="outline">
            {language ? `${language.native} · A2` : "Nivel A2"}
          </Badge>
          <span>Repaso SRS</span>
        </div>
        <div className="flashcard-word">
          <span>{card.sourceText}</span>
          {revealed && <strong>{card.targetText}</strong>}
        </div>
        {!revealed ? (
          <Button className="button-coral" onClick={() => setRevealed(true)}>
            Mostrar respuesta <EyeIcon />
          </Button>
        ) : (
          <div className="rating-row">
            <span>¿Qué tan fácil fue?</span>
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  if (card) onReview(card.id, "again");
                  setRevealed(false);
                }}
              >
                Otra vez
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (card) onReview(card.id, "hard");
                  setRevealed(false);
                }}
              >
                Difícil
              </Button>
              <Button
                className="button-dark"
                onClick={() => {
                  if (card) onReview(card.id, "good");
                  setRevealed(false);
                }}
              >
                Bien
              </Button>
              <Button
                className="button-coral"
                onClick={() => {
                  if (card) onReview(card.id, "easy");
                  setRevealed(false);
                }}
              >
                Fácil
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
function EyeIcon() {
  return <Search size={16} />;
}

function ProfileView({
  userName,
  onUserNameChange,
  nativeLanguage,
  onNativeLanguageChange,
  target,
  targetCodes,
  languages,
  onTargetChange,
  onTargetsChange,
  onSave,
  onFeedback,
  feedbackPending,
  feedbackError,
}: {
  userName: string;
  onUserNameChange: (value: string) => void;
  nativeLanguage: string;
  onNativeLanguageChange: (value: string) => void;
  target: string;
  targetCodes: string[];
  languages: CatalogLanguage[];
  onTargetChange: (value: string) => void;
  onTargetsChange: (values: string[]) => void;
  onSave: () => void;
  onFeedback: (
    category: "lesson" | "exercise" | "accessibility" | "content" | "general",
    message: string,
  ) => Promise<void>;
  feedbackPending: boolean;
  feedbackError?: string;
}) {
  const [feedbackCategory, setFeedbackCategory] = useState<
    "lesson" | "exercise" | "accessibility" | "content" | "general"
  >("general");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  return (
    <div className="profile-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TU CUENTA</p>
          <h1>
            Tu perfil, <em>a tu medida.</em>
          </h1>
          <p className="subheading">Configura tu experiencia de aprendizaje.</p>
        </div>
      </div>
      <Card className="profile-card">
        <div className="profile-avatar">{userName.slice(0, 1)}</div>
        <div className="profile-fields">
          <label htmlFor="profile-name">Nombre visible</label>
          <Input
            id="profile-name"
            value={userName}
            onChange={(event) => onUserNameChange(event.target.value)}
          />
          <label htmlFor="profile-native">Idioma nativo</label>
          <Select value={nativeLanguage} onValueChange={onNativeLanguageChange}>
            <SelectTrigger id="profile-native">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  {language.native}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label htmlFor="profile-target">Idioma objetivo principal</label>
          <Select value={target} onValueChange={onTargetChange}>
            <SelectTrigger id="profile-target">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  {language.native}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <fieldset className="target-language-options">
            <legend>Idiomas objetivo guardados</legend>
            <p id="profile-target-help">
              Selecciona uno o varios idiomas para conservar sus rutas y
              progreso.
            </p>
            {languages.map((language) => (
              <label key={language.code} className="target-language-option">
                <input
                  id={`target-${language.code}`}
                  type="checkbox"
                  aria-label={language.native}
                  aria-describedby="profile-target-help"
                  checked={targetCodes.includes(language.code)}
                  onChange={(event) => {
                    if (event.target.checked)
                      onTargetsChange(
                        Array.from(new Set([...targetCodes, language.code])),
                      );
                    else if (targetCodes.length > 1)
                      onTargetsChange(
                        targetCodes.filter((code) => code !== language.code),
                      );
                  }}
                />
                <span>{language.native}</span>
              </label>
            ))}
          </fieldset>
          <Button className="button-coral" onClick={onSave}>
            Guardar cambios
          </Button>
        </div>
      </Card>
      <Card className="feedback-card">
        <CardHeader>
          <CardTitle>Ayúdanos a mejorar</CardTitle>
          <CardDescription>
            Tu comentario se guarda para revisión del producto y del contenido.
          </CardDescription>
        </CardHeader>
        <CardContent className="feedback-form">
          <label htmlFor="feedback-category">Área</label>
          <Select
            value={feedbackCategory}
            onValueChange={(value) =>
              setFeedbackCategory(value as typeof feedbackCategory)
            }
          >
            <SelectTrigger id="feedback-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="lesson">Lección</SelectItem>
              <SelectItem value="exercise">Ejercicio</SelectItem>
              <SelectItem value="accessibility">Accesibilidad</SelectItem>
              <SelectItem value="content">Contenido</SelectItem>
            </SelectContent>
          </Select>
          <label htmlFor="feedback-message">Comentario</label>
          <Textarea
            id="feedback-message"
            value={feedbackMessage}
            onChange={(event) => setFeedbackMessage(event.target.value)}
            maxLength={2000}
            placeholder="¿Qué mejorarías?"
          />
          {feedbackError && (
            <p className="feedback-error" role="alert">
              {feedbackError}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={feedbackPending || feedbackMessage.trim().length < 8}
            onClick={async () => {
              await onFeedback(feedbackCategory, feedbackMessage.trim());
              setFeedbackMessage("");
            }}
          >
            {feedbackPending ? "Guardando…" : "Enviar feedback"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DiagnosticModal({
  language,
  step,
  onClose,
  onStart,
  onComplete,
}: {
  language?: CatalogLanguage;
  step: number;
  onClose: () => void;
  onStart: () => void;
  onComplete: (scores: {
    vocabulary: number;
    grammar: number;
    comprehension: number;
    communication: number;
  }) => void;
}) {
  const [scores, setScores] = useState({
    vocabulary: 50,
    grammar: 50,
    comprehension: 50,
    communication: 50,
  });
  const labels = {
    vocabulary: "Vocabulario",
    grammar: "Gramática",
    comprehension: "Comprensión",
    communication: "Comunicación",
  } as const;
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnostic-title"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <Card className="diagnostic-modal">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className="modal-icon">
          <Target size={24} />
        </div>
        <p className="eyebrow">DIAGNÓSTICO INICIAL</p>
        {step === 0 ? (
          <>
            <h2 id="diagnostic-title">Empieza desde donde estás.</h2>
            <p>
              Valora cuatro habilidades para estimar tu nivel actual de{" "}
              {language?.name ?? "el idioma elegido"}. No es un examen: es el
              punto de partida de una ruta que se adapta a ti.
            </p>
            <div className="diagnostic-details">
              <span>
                <ClockIcon />4 minutos
              </span>
              <span>
                <Target size={15} />4 habilidades
              </span>
              <span>
                <Trophy size={15} />
                Sin presión
              </span>
            </div>
            <Button className="button-coral full-button" onClick={onStart}>
              Comenzar diagnóstico <ArrowRight size={16} />
            </Button>
          </>
        ) : (
          <>
            <h2 id="diagnostic-title">¿Cómo te sitúas?</h2>
            <p>
              Indica una puntuación aproximada de 0 a 100 en cada habilidad.
            </p>
            <div className="diagnostic-score-list">
              {(Object.keys(labels) as Array<keyof typeof labels>).map(
                (key) => (
                  <label key={key} htmlFor={`diagnostic-${key}`}>
                    {labels[key]}
                    <Input
                      id={`diagnostic-${key}`}
                      type="number"
                      min={0}
                      max={100}
                      value={scores[key]}
                      onChange={(event) =>
                        setScores((current) => ({
                          ...current,
                          [key]: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                ),
              )}
            </div>
            <Button
              className="button-coral full-button"
              onClick={() => onComplete(scores)}
            >
              Guardar diagnóstico <Check size={16} />
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
function ClockIcon() {
  return <span className="clock-icon">◷</span>;
}
