# LinguaForge

> **Uma plataforma open source para aprender línguas com progressão CEFR, repetição espaçada e conteúdo com proveniência verificável.**
>
> **Una plataforma open source para aprender idiomas con progresión MCER, repetición espaciada y contenido con procedencia verificable.**
>
> **An open-source language learning platform with CEFR progression, spaced repetition, and traceable content provenance.**

**Projeto criado e assinado por Pedro Belentani · [belentani.eu](https://belentani.eu) · [noiacore.com](https://noiacore.com) · [@belentani\_](https://github.com/belentani7) · belentani7studio@proton.me**

---

# Português

## A minha visão

Eu sou Pedro Belentani e criei o LinguaForge como uma base aberta, auditável e evolutiva para aprender línguas com clareza, prática frequente e respeito pela procedência do conteúdo. Quero construir uma ferramenta útil sem publicidade invasiva e sem pagamentos obrigatórios no início, mantendo o código, as decisões e os limites visíveis para a comunidade.

O catálogo atual suporta espanhol, inglês, mandarim, hindi, árabe, português, bengali, russo, japonês e francês. As rotas são bidirecionais entre os idiomas disponíveis: uma pessoa pode estudar português→espanhol, espanhol→português, português→inglês e outras combinações do catálogo. A progressão usa CEFR/MCER A1, A2, B1, B2, C1 e C2; isso organiza a experiência, mas não substitui certificação oficial.

## O que existe hoje

| Área           | Estado verificável                                                                  |
| -------------- | ----------------------------------------------------------------------------------- |
| Rotas          | Origem→destino persistidas e bidirecionais para dez idiomas                         |
| Progressão     | Diagnóstico inicial, recomendação de nível e níveis A1–C2                           |
| Lições         | Módulos de vocabulário, gramática, pronúncia e conversação                          |
| Exercícios     | Completar frases, relacionar elementos, tradução e múltipla escolha                 |
| Memória        | Flashcards e repetição espaçada SRS com progresso persistido                        |
| Painel         | Racha, XP, lições concluídas, nível e resumo por idioma                             |
| Conteúdo       | Lotes piloto Tatoeba com licença, URL, versão e atribuição                          |
| Qualidade      | TypeScript, Vitest, build de produção e auditorias reproduzíveis                    |
| Acessibilidade | Keyboard, foco, ARIA, contraste e estados locais verificados no inventário de rotas |
| Avisos         | Notificações locais opcionais, com permissão explícita, sem e-mail externo          |

O banco de conteúdo ainda está em expansão. Os lotes piloto não são a meta de mais de 1000 entradas por par. A importação em escala exige export oficial completo, licença confirmada, deduplicação, revisão linguística e manifest de cobertura.

## Código, conteúdo e licenças

O código deste repositório é distribuído sob a **MIT License**, salvo indicação diferente em um arquivo específico. Conteúdo, datasets, áudio, modelos, pesos, plugins e fontes de terceiros conservam as suas licenças próprias. Uma licença permissiva do código não autoriza automaticamente redistribuir um modelo, uma voz ou um dataset.

Os pilotos textuais de Tatoeba conservam atribuição e procedência conforme a licença indicada no lote. O áudio não é importado automaticamente porque cada gravação pode ter condições próprias. Consulte [CREDITS.md](CREDITS.md), [docs/content-import.md](docs/content-import.md) e [docs/compliance-readiness.md](docs/compliance-readiness.md) antes de reutilizar material.

## IA, voz, imagem e vídeo

Avaliei recursos open source para uma evolução futura: [Kokoro](https://github.com/hexgrad/kokoro) e [Coqui TTS](https://github.com/coqui-ai/TTS) para comparação de voz, [Whisper](https://github.com/openai/whisper) para reconhecimento opt-in, [Ollama](https://github.com/ollama/ollama) para ferramentas internas e [Diffusers](https://github.com/huggingface/diffusers), [ComfyUI](https://github.com/Comfy-Org/ComfyUI) e [Wan2.1](https://github.com/Wan-Video/Wan2.1) para produção editorial isolada. A prioridade é uma voz natural, mas essa qualidade deve ser medida por idioma, frase, prosódia e revisão humana; não é uma promessa automática do nome do modelo.

Não se clonam vozes de terceiros sem consentimento documentado. Modelos pesados devem executar fora do runtime web, com limites, metadados, revisão, armazenamento controlado e fallback textual. Nenhum recurso externo é ativado apenas por ser popular.

## Arquitetura

O frontend utiliza React 19, Tailwind CSS 4 e componentes acessíveis. O backend utiliza Express, tRPC 11 e Drizzle ORM sobre MySQL/TiDB, com autenticação Manus e contratos tipados. O conteúdo persistido é servido pelo backend; arquivos devem usar referências de armazenamento controladas, não blobs no banco. Jobs e automações ficam pausáveis, idempotentes e sem efeitos externos por padrão.

## Desenvolvimento local

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

Não faça commit de `.env`, tokens, chaves privadas ou credenciais. As variáveis são fornecidas pelo ambiente de desenvolvimento. Os validadores e auditores ficam em `scripts/`; a explicação das fontes, licenças, QA e operação está em `docs/`.

## Contribuição

Pull requests são bem-vindos quando mantêm acessibilidade, responsividade, procedência, segurança, custos mínimos e testes reproduzíveis. Antes de adicionar frases, imagens, áudio, vídeo, modelos ou datasets, informe fonte, autor, licença, URL, versão, alcance de uso e método de revisão. Consulte [CONTRIBUTING.md](CONTRIBUTING.md) e [CREDITS.md](CREDITS.md).

## Publicação e contacto

O repositório GitHub e o site publicado são sistemas diferentes. O site deve ser publicado pelo botão **Publish** do ambiente WebDev e depois validado com tráfego real. E-mail automático, pagamentos, analítica externa, cron externo e integrações de fornecedores continuam desativados até existirem configuração segura, consentimento, limites, base legal e revisão profissional.

Eu sou Pedro Belentani. Acompanhe o projeto em [belentani.eu](https://belentani.eu), [noiacore.com](https://noiacore.com) e [@belentani\_](https://github.com/belentani7).

---

# Español

## Mi visión

Soy Pedro Belentani y creé LinguaForge como una base abierta, auditable y evolutiva para aprender idiomas con claridad, práctica frecuente y respeto por la procedencia del contenido. Quiero construir una herramienta útil sin publicidad invasiva y sin pagos obligatorios al principio, manteniendo visibles el código, las decisiones y los límites del proyecto.

El catálogo actual soporta español, inglés, mandarín, hindi, árabe, portugués, bengalí, ruso, japonés y francés. Las rutas son bidireccionales entre los idiomas disponibles: una persona puede estudiar portugués→español, español→portugués, portugués→inglés y otras combinaciones del catálogo. La progresión utiliza MCER/CEFR A1, A2, B1, B2, C1 y C2; organiza la experiencia, pero no sustituye una certificación oficial.

## Lo que existe hoy

| Área          | Estado verificable                                                                     |
| ------------- | -------------------------------------------------------------------------------------- |
| Rutas         | Origen→destino persistidas y bidireccionales para diez idiomas                         |
| Progresión    | Diagnóstico inicial, nivel recomendado y niveles A1–C2                                 |
| Lecciones     | Módulos de vocabulario, gramática, pronunciación y conversación                        |
| Ejercicios    | Completar frases, relacionar elementos, traducción y opción múltiple                   |
| Memoria       | Flashcards y repetición espaciada SRS con progreso persistido                          |
| Panel         | Racha, XP, lecciones completadas, nivel y resumen por idioma                           |
| Contenido     | Lotes piloto de Tatoeba con licencia, URL, versión y atribución                        |
| Calidad       | TypeScript, Vitest, build de producción y auditorías reproducibles                     |
| Accesibilidad | Teclado, foco, ARIA, contraste y estados locales verificados en el inventario de rutas |
| Avisos        | Notificaciones locales opcionales, con permiso explícito, sin correo externo           |

El banco de contenido todavía está en expansión. Los lotes piloto no representan la meta de más de 1000 entradas por par. La importación masiva exige un export oficial completo, licencia confirmada, deduplicación, revisión lingüística y un manifest de cobertura.

## Código, contenido y licencias

El código de este repositorio se distribuye bajo la **MIT License**, salvo indicación diferente en un archivo concreto. El contenido, datasets, audio, modelos, pesos, plugins y fuentes de terceros conservan sus licencias propias. Una licencia permisiva del código no autoriza automáticamente redistribuir un modelo, una voz o un dataset.

Los pilotos textuales de Tatoeba conservan atribución y procedencia conforme a la licencia indicada en cada lote. El audio no se importa automáticamente porque cada grabación puede tener condiciones propias. Consulta [CREDITS.md](CREDITS.md), [docs/content-import.md](docs/content-import.md) y [docs/compliance-readiness.md](docs/compliance-readiness.md) antes de reutilizar material.

## IA, voz, imagen y vídeo

He evaluado recursos open source para una evolución futura: [Kokoro](https://github.com/hexgrad/kokoro) y [Coqui TTS](https://github.com/coqui-ai/TTS) para comparar voz, [Whisper](https://github.com/openai/whisper) para reconocimiento opt-in, [Ollama](https://github.com/ollama/ollama) para herramientas internas y [Diffusers](https://github.com/huggingface/diffusers), [ComfyUI](https://github.com/Comfy-Org/ComfyUI) y [Wan2.1](https://github.com/Wan-Video/Wan2.1) para producción editorial aislada. La prioridad es una voz natural, pero esa calidad debe medirse por idioma, frase, prosodia y revisión humana; no es una promesa automática del nombre del modelo.

No se clonan voces de terceros sin consentimiento documentado. Los modelos pesados deben ejecutarse fuera del runtime web, con límites, metadatos, revisión, almacenamiento controlado y fallback textual. Ningún recurso externo se activa solo por ser popular.

## Arquitectura

El frontend utiliza React 19, Tailwind CSS 4 y componentes accesibles. El backend utiliza Express, tRPC 11 y Drizzle ORM sobre MySQL/TiDB, con autenticación Manus y contratos tipados. El contenido persistido se sirve desde el backend; los archivos deben usar referencias controladas, no blobs en la base de datos. Los jobs y automatizaciones son pausables, idempotentes y no tienen efectos externos por defecto.

## Desarrollo local

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

No hagas commit de `.env`, tokens, claves privadas ni credenciales. Las variables las proporciona el entorno de desarrollo. Los validadores y auditores están en `scripts/`; las fuentes, licencias, QA y operación se explican en `docs/`.

## Contribución

Las pull requests son bienvenidas cuando mantienen accesibilidad, responsive, procedencia, seguridad, coste mínimo y pruebas reproducibles. Antes de añadir frases, imágenes, audio, vídeo, modelos o datasets, indica fuente, autoría, licencia, URL, versión, alcance de uso y método de revisión. Consulta [CONTRIBUTING.md](CONTRIBUTING.md) y [CREDITS.md](CREDITS.md).

## Publicación y contacto

El repositorio GitHub y el sitio publicado son sistemas diferentes. El sitio debe publicarse mediante el botón **Publish** del entorno WebDev y validarse después con tráfico real. El correo automático, pagos, analítica externa, cron externo e integraciones con proveedores siguen desactivados hasta disponer de configuración segura, consentimiento, límites, base legal y revisión profesional.

Soy Pedro Belentani. Sigue el proyecto en [belentani.eu](https://belentani.eu), [noiacore.com](https://noiacore.com) y [@belentani\_](https://github.com/belentani7).

---

# English

## My vision

I am Pedro Belentani, and I created LinguaForge as an open, auditable and evolvable foundation for language learning with clarity, frequent practice and respect for content provenance. I want to build a useful tool without intrusive advertising or mandatory payments at the beginning, while keeping the code, decisions and limitations visible.

The current catalog supports Spanish, English, Mandarin Chinese, Hindi, Arabic, Portuguese, Bengali, Russian, Japanese and French. Routes are bidirectional across available languages: a learner can study Portuguese→Spanish, Spanish→Portuguese, Portuguese→English and other catalog combinations. Progression uses CEFR A1, A2, B1, B2, C1 and C2; it organizes the experience but does not replace official certification.

## What exists today

| Area          | Verifiable status                                                                   |
| ------------- | ----------------------------------------------------------------------------------- |
| Routes        | Persisted source→target routes, bidirectional across ten languages                  |
| Progression   | Initial diagnostic, recommended level and A1–C2 progression                         |
| Lessons       | Vocabulary, grammar, pronunciation and conversation modules                         |
| Exercises     | Sentence completion, matching, translation and multiple choice                      |
| Memory        | Persisted flashcards and spaced repetition (SRS) reviews                            |
| Dashboard     | Streak, XP, completed lessons, level and per-language summary                       |
| Content       | Tatoeba pilot batches with license, URL, version and attribution                    |
| Quality       | TypeScript, Vitest, production build and reproducible audits                        |
| Accessibility | Keyboard, focus, ARIA, contrast and local-state checks across the route inventory   |
| Notices       | Optional local browser notifications with explicit permission and no external email |

The content bank is still expanding. Pilot batches do not represent the goal of more than 1,000 entries per pair. A large import requires a complete official export, license validation, deduplication, linguistic review and a coverage manifest.

## Code, content and licenses

The code in this repository is distributed under the **MIT License**, unless a specific file states otherwise. Third-party content, datasets, audio, models, weights, plugins and sources keep their own licenses. A permissive code license does not automatically authorize redistribution of a model, voice or dataset.

Pilot Tatoeba text keeps the attribution and provenance recorded in each batch. Audio is not imported automatically because each recording may have separate terms. Read [CREDITS.md](CREDITS.md), [docs/content-import.md](docs/content-import.md) and [docs/compliance-readiness.md](docs/compliance-readiness.md) before reusing material.

## AI, voice, image and video

I evaluated open-source resources for future work: [Kokoro](https://github.com/hexgrad/kokoro) and [Coqui TTS](https://github.com/coqui-ai/TTS) for voice comparison, [Whisper](https://github.com/openai/whisper) for opt-in speech recognition, [Ollama](https://github.com/ollama/ollama) for internal tools, and [Diffusers](https://github.com/huggingface/diffusers), [ComfyUI](https://github.com/Comfy-Org/ComfyUI) and [Wan2.1](https://github.com/Wan-Video/Wan2.1) for isolated editorial production. Natural voice quality must be measured by language, sentence, prosody and human review; it is not an automatic promise made by a model name.

Third-party voices are not cloned without documented consent. Heavy models must run outside the web runtime with limits, metadata, review, controlled storage and a text fallback. No external resource is activated merely because it is popular.

## Architecture

The frontend uses React 19, Tailwind CSS 4 and accessible components. The backend uses Express, tRPC 11 and Drizzle ORM on MySQL/TiDB, with Manus authentication and typed contracts. Persisted content is served by the backend; files must use controlled references rather than database blobs. Jobs and automations are pausable, idempotent and have no external effects by default.

## Local development

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

Do not commit `.env` files, tokens, private keys or credentials. Environment variables are supplied by the development environment. Validators and auditors live under `scripts/`; sources, licenses, QA and operations are documented under `docs/`.

## Contributing

Pull requests are welcome when they preserve accessibility, responsiveness, provenance, security, minimum cost and reproducible tests. Before adding sentences, images, audio, video, models or datasets, provide source, authorship, license, URL, version, scope of use and review method. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CREDITS.md](CREDITS.md).

## Publication and contact

The GitHub repository and the deployed website are different systems. The website must be published with the **Publish** button in the WebDev environment and then validated with real traffic. Automatic email, payments, external analytics, external cron and provider integrations remain disabled until secure configuration, consent, limits, legal basis and professional review are available.

I am Pedro Belentani. Follow the project at [belentani.eu](https://belentani.eu), [noiacore.com](https://noiacore.com) and [@belentani7](https://github.com/belentani7).

---

## References

[1]: https://github.com/hexgrad/kokoro "Kokoro"
[2]: https://github.com/coqui-ai/TTS "Coqui TTS"
[3]: https://github.com/openai/whisper "Whisper"
[4]: https://github.com/ollama/ollama "Ollama"
[5]: https://github.com/huggingface/diffusers "Diffusers"
[6]: https://github.com/Comfy-Org/ComfyUI "ComfyUI"
[7]: https://github.com/Wan-Video/Wan2.1 "Wan2.1"
[8]: https://tatoeba.org/en/downloads "Tatoeba downloads"
[9]: https://en.wiki.tatoeba.org/articles/show/using-the-tatoeba-corpus "Using the Tatoeba corpus"
