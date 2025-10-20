# Repository Guidelines

## Project Structure & Module Organization
- `index.html` is the single entry point, wiring the toolbar, panels, and theme assets; keep new UI elements consistent with existing `id` patterns so `app.js` picks them up automatically.
- `app.js` is a self-invoking module; group related helpers, prefer reusing shared utility functions, and avoid introducing global state outside the closure.
- `styles.css` controls theming with CSS custom properties and 2-space indentation; update or add themes by extending the existing `body[data-theme="…"]` blocks.
- Third-party bundles live under `vendor/mammoth`, `vendor/pdfjs`, and `vendor/turndown`; replace them in-place to preserve relative paths consumed by `index.html`.

## Build, Test, and Development Commands
- The project is static—no build step. Serve it locally to unlock the File System Access API and avoid CORS issues:
```bash
python3 -m http.server 8000
# or
npx http-server .
```
- You can open `index.html` directly for quick checks, but expect limited save/open features in browsers without the File System Access API.

## Coding Style & Naming Conventions
- JavaScript sticks to ES2015+, 2-space indentation, `'use strict'`, and descriptive camelCase (e.g., `ollamaModelSelect`); expand menus by reusing the existing `*Btn`/`*Menu` naming.
- CSS prefers kebab-case class names, logical property grouping, and lightweight comments explaining theme variables; keep layout tweaks close to their components.
- HTML ids remain unique and descriptive; update associated query selectors in `app.js` whenever you rename or add elements.

## Testing Guidelines
- There are no automated tests yet. Run manual passes in Chromium, Firefox, and Safari covering Markdown editing, AI providers, imports/exports, theme switching, and PDF/docx conversions.
- Watch the browser console for errors, especially after touching vendor scripts or asynchronous API flows; verify the status bar updates as expected.

## Commit & Pull Request Guidelines
- Follow the current history: concise (≤72 characters) imperative subjects, occasionally bilingual when appropriate—e.g., `Add split view toolbar focus states`.
- Pull requests should summarize the change, list manual test browsers, link related issues, and attach screenshots or short clips for UI updates.
- Call out bundled vendor upgrades explicitly and reference upstream versions or changelog links to ease future reviews.

## Security & Configuration Tips
- Keep API keys out of version control; the app stores provider settings in `localStorage`. Document new configuration steps in `README.md` and provide safe defaults for reviewers.
