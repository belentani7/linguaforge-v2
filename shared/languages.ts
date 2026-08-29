export const LANGUAGE_CATALOG = [
  {
    code: "es",
    iso639_2: "spa",
    name: "Español",
    nativeName: "Español",
    script: "Latina",
  },
  {
    code: "en",
    iso639_2: "eng",
    name: "Inglés",
    nativeName: "English",
    script: "Latina",
  },
  {
    code: "zh",
    iso639_2: "zho",
    name: "Mandarín",
    nativeName: "中文",
    script: "Han",
  },
  {
    code: "hi",
    iso639_2: "hin",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari",
  },
  {
    code: "ar",
    iso639_2: "ara",
    name: "Árabe",
    nativeName: "العربية",
    script: "Árabe",
  },
  {
    code: "pt",
    iso639_2: "por",
    name: "Portugués",
    nativeName: "Português",
    script: "Latina",
  },
  {
    code: "bn",
    iso639_2: "ben",
    name: "Bengalí",
    nativeName: "বাংলা",
    script: "Bengalí",
  },
  {
    code: "ru",
    iso639_2: "rus",
    name: "Ruso",
    nativeName: "Русский",
    script: "Cirílica",
  },
  {
    code: "ja",
    iso639_2: "jpn",
    name: "Japonés",
    nativeName: "日本語",
    script: "Kanji/kana",
  },
  {
    code: "fr",
    iso639_2: "fra",
    name: "Francés",
    nativeName: "Français",
    script: "Latina",
  },
] as const;

export const CEFR_LEVELS = [
  {
    code: "A1",
    title: "Descubrimiento",
    description: "Frases cotidianas y bases esenciales",
    sortOrder: 1,
  },
  {
    code: "A2",
    title: "Fundamentos",
    description: "Interacciones sencillas con confianza",
    sortOrder: 2,
  },
  {
    code: "B1",
    title: "Independencia",
    description: "Conversaciones sobre temas familiares",
    sortOrder: 3,
  },
  {
    code: "B2",
    title: "Fluidez",
    description: "Ideas complejas y conversación natural",
    sortOrder: 4,
  },
  {
    code: "C1",
    title: "Dominio",
    description: "Comunicación flexible y precisa",
    sortOrder: 5,
  },
  {
    code: "C2",
    title: "Maestría",
    description: "Comprensión y expresión experta",
    sortOrder: 6,
  },
] as const;

export function buildBidirectionalPaths(
  codes = LANGUAGE_CATALOG.map((language) => language.code),
) {
  return codes.flatMap((sourceLanguage) =>
    codes
      .filter((targetLanguage) => targetLanguage !== sourceLanguage)
      .map((targetLanguage) => ({ sourceLanguage, targetLanguage })),
  );
}
