# Markdown WebEditor

[![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://anes-03.github.io/Markdown-WebEditor/)

Ein leichter, rein clientseitiger Markdown‑Editor mit:

- Editor‑Ansicht, geteilte Ansicht und reine Reader‑Ansicht
- Toolbar (Menüband) zum Einfügen von Überschriften, Listen, Links, Code, Tabellen, Trennlinien u.v.m.
- Live‑Vorschau mit Syntax‑Highlighting (highlight.js)
- Einfügen von Bildern per Datei‑Dialog, Drag & Drop oder Einfügen (Paste). Bilder werden als Data‑URL im Markdown eingebettet.
- Öffnen/Speichern lokaler `.md`‑Dateien über die File System Access API (Chrome/Edge) mit Fallback (Download) für andere Browser
- Export als HTML und PDF (PDF mit html2pdf.js; exportiert nur die Vorschau)
- Themes per Dropdown: Light, Dark, Pitch Black, Sepia, Solarized Light/Dark (Auswahl wird gespeichert)
- Autosave in `localStorage`

## Ollama Chat

- Öffne den Chat rechts oben über „Chat“.
- Trage deine Ollama‑URL (z. B. `http://localhost:11434`) und das gewünschte Modell ein.
- „Verbindung testen“ prüft die Erreichbarkeit und füllt die Modellauswahlliste (CORS muss ggf. erlaubt sein).
- Senden mit Enter (Shift+Enter für Zeilenumbruch). Optionales Streaming.
- Streaming abbrechen: „Abbrechen“ stoppt eine laufende Antwort.

Hinweis zu CORS: Wenn die Seite lokal läuft (file:// oder anderer Origin), muss Ollama Cross‑Origin‑Zugriffe erlauben, z. B. mit Umgebungsvariable `OLLAMA_ORIGINS=*` oder passender Konfiguration. Alternativ die Seite über `http://localhost` hosten.

## Starten

- Öffne die Datei `index.html` direkt im Browser, oder
- starte einen lokalen Server (empfohlen):
  - Python: `python3 -m http.server 8000` und dann `http://localhost:8000` öffnen

## Live‑Demo (GitHub Pages)

- Online: https://anes-03.github.io/Markdown-WebEditor/
- Falls der Link noch nicht aktiv ist: In GitHub unter Repository → Settings → Pages → Build and deployment „Deploy from a branch“ wählen, Branch `main`, Ordner `/ (root)`, speichern. Optional `.nojekyll` liegt bei, um Jekyll‑Verarbeitung zu deaktivieren.

## Hinweise zu Datei‑Zugriff

- In Chrome/Edge (Desktop) wird die File System Access API genutzt: "Öffnen", "Speichern" und "Speichern unter" arbeiten dabei direkt mit echten Dateien.
- In Firefox/Safari wird beim Speichern ein Download (Fallback) ausgelöst. Öffnen funktioniert über Dateiauswahl/Drag‑&‑Drop.

## Tastaturkürzel

- Cmd/Ctrl+N: Neu
- Cmd/Ctrl+O: Öffnen
- Cmd/Ctrl+S: Speichern
- Shift+Cmd/Ctrl+S: Speichern unter
- Cmd/Ctrl+B: Fett
- Cmd/Ctrl+I: Kursiv
- Cmd/Ctrl+K: Link

## Lizenz

Ohne Gewähr. Frei nutzbar.
