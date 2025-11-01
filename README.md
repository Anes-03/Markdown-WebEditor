# Markdown WebEditor

[![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://anes-03.github.io/Markdown-WebEditor/)

Ein leichter, rein clientseitiger Markdown‑Editor mit:

- Editor‑Ansicht, geteilte Ansicht und reine Reader‑Ansicht
- Toolbar (Menüband) zum Einfügen von Überschriften, Listen, Links, Code, Tabellen, Trennlinien u.v.m.
- Live‑Vorschau mit Syntax‑Highlighting (highlight.js)
- Einfügen von Bildern per Datei‑Dialog, Drag & Drop oder Einfügen (Paste). Bilder werden als Data‑URL im Markdown eingebettet.
- Öffnen/Speichern lokaler `.md`‑Dateien über die File System Access API (Chrome/Edge) mit Fallback (Download) für andere Browser
- Export als HTML und PDF (PDF mit html2pdf.js; exportiert nur die Vorschau)
- Import-Menü für PDF-Dateien (Text plus Seitenabbildungen) und Word-Dokumente (`.docx` via Mammoth.js → Markdown) – inklusive automatischer Überschriften-Erkennung, soweit möglich; alle benötigten Bibliotheken liegen gebündelt bei und funktionieren dadurch auch offline
- Themes per Dropdown: Light, Dark, Pitch Black, High Contrast, Sepia, Solarized Light/Dark (Auswahl wird gespeichert)
- Autosave in `localStorage`

## Diagramm-Unterstützung

- Codeblöcke mit <code>```mermaid</code> werden automatisch in der Vorschau als Diagramm gerendert.
- Über den Toolbar-Button „Mermaid“ öffnet sich ein Dialog, in dem Diagrammtyp, Flussrichtung und Code vor dem Einfügen angepasst werden können.
- Für alle Diagrammtypen steht ein grafischer Editor bereit: Flowcharts bieten Tabellen für Knoten/Verbindungen, andere Diagrammarten werden über strukturierte Formulare gepflegt und der Mermaid‑Code aktualisiert sich automatisch.
- Eine Live-Vorschau innerhalb des Dialogs rendert das Diagramm fortlaufend, bevor es in den Editor übernommen wird.
- Mermaid wird per CDN (`https://cdn.jsdelivr.net/npm/mermaid`) geladen. Offline steht die Bibliothek daher nicht zur Verfügung, die Diagramme erscheinen dann als reiner Codeblock.

## Ollama Chat

- Öffne den Chat rechts oben über „Chat“.
- Trage deine Ollama‑URL (z. B. `http://localhost:11434`) und das gewünschte Modell ein.
- „Verbindung testen“ prüft die Erreichbarkeit und füllt die Modellauswahlliste (CORS muss ggf. erlaubt sein).
- Senden mit Enter (Shift+Enter für Zeilenumbruch). Optionales Streaming.
- Streaming abbrechen: „Abbrechen“ stoppt eine laufende Antwort.

Hinweis zu CORS: Wenn die Seite lokal läuft (file:// oder anderer Origin), muss Ollama Cross‑Origin‑Zugriffe erlauben, z. B. mit Umgebungsvariable `OLLAMA_ORIGINS=*` oder passender Konfiguration. Alternativ die Seite über `http://localhost` hosten.

## Weitere KI‑Anbieter

- OpenAI
  - In den Einstellungen unter „KI‑Anbieter“ → „OpenAI“ API‑Key, Basis‑URL (optional) und Modell setzen.
  - „Verbindung testen“ ruft `GET /models` auf und füllt die Auswahlliste.
  - API‑Keys erstellen: https://platform.openai.com/api-keys
- Anthropic Claude
  - API‑Key und optional Basis‑URL eintragen, Modelle z. B. `claude-3-5-sonnet-latest` auswählen.
  - Beim Test werden `https://api.anthropic.com/v1/models` geladen.
  - API‑Keys erstellen: https://console.anthropic.com/settings/keys
- Google Gemini
  - API‑Key hinterlegen, Modell per Dropdown wählen oder manuell eintragen.
  - „Verbindung testen“ ruft `https://generativelanguage.googleapis.com/v1beta/models` auf.
- Neu: Trage im Feld **Bild-Proxy-Endpunkt** die URL eines Backend-Proxys ein. Der Proxy nimmt Prompts entgegen, ruft Googles kostenloses Imagen-Modell `imagen-3.0-generate-001` (Free Tier laut [Gemini-Doku](https://ai.google.dev/gemini-api/docs/image-generation?hl=de)) auf und liefert ein Base64-Bild zurück. So bleibt dein API-Key verborgen und du vermeidest CORS-Fehler. Ohne Proxy versucht der Editor weiterhin den direkten Browser-Aufruf – das setzt allerdings erlaubte Origins und einen nicht eingeschränkten API-Key voraus.

- Mistral AI
  - API‑Key hinterlegen und Modell wählen.
  - „Verbindung testen“ nutzt `https://api.mistral.ai/v1/models`.

> **Hinweis:** Alle genannten Cloud‑Anbieter werden direkt aus dem Browser angesprochen. Prüfe ggf. CORS‑Beschränkungen des Dienstes und teile nur Inhalte, die dort verarbeitet werden dürfen.

## KI-Bilder generieren

- Über die Toolbar-Schaltfläche **Bild Generieren** öffnest du den KI-Bilddialog direkt neben der Textgenerierung.
- Gib eine Beschreibung ein, starte die Generierung und warte auf die Vorschau.
- Gefällt dir das Ergebnis, kannst du es mit einem Klick in den Editor einfügen (das Bild wird als Data-URL im Markdown gespeichert).
- Die Funktion ruft (falls konfiguriert) zuerst den Backend-Proxy aus den Gemini-Einstellungen auf und erwartet JSON mit Base64-Bilddaten (`image_base64`, `imageBase64`, `dataUrl` …). Ohne Proxy nutzt der Editor weiterhin Googles offiziellen Imagen-Endpunkt [`models/imagetext:generate`](https://ai.google.dev/api/rest/v1beta/models.imagetext/generate) mit dem Free-Tier-Modell `imagen-3.0-generate-001` und greift bei Fehlern auf `imagegeneration@001:generateImage` zurück.
- Beispiel für einen Minimal-Proxy (Node.js + Express + `@google/generative-ai`):
  ```js
  import express from 'express';
  import { GoogleGenerativeAI } from '@google/generative-ai';

  const app = express();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-001' });

  app.use(express.json());

  app.post('/api/generate-image', async (req, res) => {
    try {
      const prompt = String(req.body?.prompt || '').trim();
      if (!prompt) return res.status(400).json({ error: 'Prompt fehlt' });
      const result = await model.generateImages({ prompt, numberOfImages: 1, outputMimeType: 'image/png' });
      const image = result?.images?.[0];
      if (!image?.inlineData?.data) throw new Error('Keine Bilddaten erhalten');
      res.json({ image_base64: image.inlineData.data, mime_type: image.inlineData.mimeType || 'image/png' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Bildgenerierung fehlgeschlagen' });
    }
  });

  app.listen(3000);
  ```
- Der Proxy antwortet mit Base64-Daten (`image_base64` + optional `mime_type`), die der Editor automatisch in Data-URLs umwandelt und in Markdown einbettet.

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
