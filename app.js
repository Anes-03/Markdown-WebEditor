// Markdown WebEditor - main logic
(function () {
  'use strict';

  // Elements
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const statusEl = document.getElementById('status');
  const cursorPosEl = document.getElementById('cursorPos');
  const wordCountEl = document.getElementById('wordCount');
  const fileNameEl = document.getElementById('fileName');
  const appTitleEl = document.getElementById('appTitle');
  const hiddenFile = document.getElementById('hiddenFile');
  const hiddenImage = document.getElementById('hiddenImage');
  const hiddenAudio = document.getElementById('hiddenAudio');
  const hiddenVideo = document.getElementById('hiddenVideo');
  const hiddenPdf = document.getElementById('hiddenPdf');
  const hiddenDocx = document.getElementById('hiddenDocx');
  const importBtn = document.getElementById('importBtn');
  const importMenu = document.getElementById('importMenu');
  const learningBtn = document.getElementById('learningBtn');
  const learningMenu = document.getElementById('learningMenu');
  const videoMenuBtn = document.getElementById('videoMenuBtn');
  const videoMenu = document.getElementById('videoMenu');
  const headingMoreBtn = document.getElementById('headingMoreBtn');
  const headingMenu = document.getElementById('headingMenu');
  const hljsThemeLink = document.getElementById('hljs-theme');
  /** @type {HTMLElement | null} */
  const updatesPanel = document.getElementById('updatesPanel');
  /** @type {HTMLOListElement | null} */
  const updatesList = document.getElementById('updatesList');
  /** @type {HTMLSpanElement | null} */
  const updatesStatus = document.getElementById('updatesStatus');
  /** @type {HTMLButtonElement | null} */
  const updatesReloadBtn = document.getElementById('updatesReloadBtn');
  const versionsOverlay = document.getElementById('versionsOverlay');
  const versionsPanel = document.getElementById('versionsPanel');
  const versionsToggleBtn = document.getElementById('versionsToggleBtn');
  const versionsCloseBtn = document.getElementById('versionsCloseBtn');
  const versionsList = document.getElementById('versionsList');
  const versionsEmptyHint = document.getElementById('versionsEmptyHint');
  const versionsDiff = document.getElementById('versionsDiff');
  const versionsDiffMeta = document.getElementById('versionsDiffMeta');
  const versionsSnapshotBtn = document.getElementById('versionsSnapshotBtn');
  const versionsRestoreBtn = document.getElementById('versionsRestoreBtn');
  const versionsNoteInput = document.getElementById('versionsNoteInput');
  const versionsStatusEl = document.getElementById('versionsStatus');

  // Buttons
  const newBtn = document.getElementById('newBtn');
  const openBtn = document.getElementById('openBtn');
  const saveBtn = document.getElementById('saveBtn');
  const saveAsBtn = document.getElementById('saveAsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const exportMenu = document.getElementById('exportMenu');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  const editViewBtn = document.getElementById('editViewBtn');
  const splitViewBtn = document.getElementById('splitViewBtn');
  const readerViewBtn = document.getElementById('readerViewBtn');
  const readAloudBtn = document.getElementById('readAloudBtn');
  const readAloudIcon = readAloudBtn?.querySelector('iconify-icon') || null;
  const readAloudLabel = readAloudBtn?.querySelector('.btn-label') || null;
  const workspace = document.getElementById('workspace');

  const SANITIZE_MARKDOWN_OPTIONS = {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['video', 'source', 'iframe', 'details', 'summary'],
    ADD_ATTR: [
      'allow',
      'allowfullscreen',
      'class',
      'controls',
      'frameborder',
      'loading',
      'playsinline',
      'poster',
      'preload',
      'src',
      'title',
      'open',
      'data-media-ref',
    ],
    ADD_URI_SAFE_LIST: ['media', 'data'],
  };

  const MEDIA_AUTOSAVE_KEY = 'md-autosave-media';
  const MEDIA_PLACEHOLDER_PREFIX = 'media://';
  const embeddedMediaStore = new Map();

  if (window.DOMPurify?.addHook) {
    window.DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
      if (
        data.attrName === 'src' &&
        typeof data.attrValue === 'string' &&
        data.attrValue.startsWith(MEDIA_PLACEHOLDER_PREFIX)
      ) {
        data.keepAttr = true;
      }
    });
  }

  const themeSelect = null; // removed select dropdown
  const themeCycleBtn = document.getElementById('themeCycleBtn');
  const themeMenu = document.getElementById('themeMenu');
  const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
  // Inline AI elements
  const aiInline = document.getElementById('aiInline');
  const aiPromptInput = document.getElementById('aiPromptInput');
  const aiUseSelection = document.getElementById('aiUseSelection');
  const aiGenStartBtn = document.getElementById('aiGenStartBtn');
  const aiGenAbortBtn = document.getElementById('aiGenAbortBtn');
  const aiGenResetBtn = document.getElementById('aiGenResetBtn');
  const aiGenInfo = document.getElementById('aiGenInfo');
  const aiPresetSettingsBtn = document.getElementById('aiPresetSettingsBtn');

  const PRESET_CATEGORIES = {
    summary: { id: 'summary', label: 'Zusammenfassen & Länge', icon: 'lucide:file-text' },
    style: { id: 'style', label: 'Stil & Stimme', icon: 'lucide:sparkles' },
    structure: { id: 'structure', label: 'Struktur & Format', icon: 'lucide:files' },
    explain: { id: 'explain', label: 'Erklären & Analysieren', icon: 'lucide:brain' },
    translate: { id: 'translate', label: 'Übersetzen', icon: 'mdi:translate' },
    visuals: { id: 'visuals', label: 'Diagramme & Visualisierung', icon: 'mdi:chart-timeline-variant' },
    custom: { id: 'custom', label: 'Eigene Presets', icon: 'lucide:star' },
  };
  const PRESET_CATEGORY_ORDER = ['summary', 'style', 'structure', 'explain', 'translate', 'visuals', 'custom'];
  const CUSTOM_PRESET_CATEGORY = 'custom';

  const BUILT_IN_PRESETS = [
    {
      name: 'Zusammenfassen',
      category: 'summary',
      description: 'Fasst den Inhalt in 3–5 Sätzen zusammen.',
      prompt: 'Fasse den Text prägnant in 3–5 Sätzen zusammen. Nur Markdown-Ausgabe.',
    },
    {
      name: 'Kürzen',
      category: 'summary',
      description: 'Reduziert Inhalte auf die Kernaussagen.',
      prompt: 'Kürze den Text deutlich (ca. 30–50%), entferne Füllwörter und Redundanzen und erhalte die Kernaussagen. Struktur möglichst beibehalten. Nur das gekürzte Ergebnis in Markdown ausgeben.',
    },
    {
      name: 'Verlängern',
      category: 'summary',
      description: 'Erweitert den Text mit Beispielen und Übergängen.',
      prompt: 'Erweitere den Text behutsam um erläuternde Details, Beispiele und klarere Übergänge. Erhalte Ton und Intention; keine neuen Fakten erfinden. Nur das erweiterte Ergebnis in Markdown ausgeben.',
    },
    {
      name: 'Verbessern',
      category: 'style',
      description: 'Optimiert Stil, Klarheit und Grammatik.',
      prompt: 'Verbessere Stil, Klarheit und Grammatik des Textes, ohne Inhalt zu ändern. Nur Ergebnis in Markdown.',
    },
    {
      name: 'Freundlich umformulieren',
      category: 'style',
      description: 'Formuliert wertschätzend und inklusiv.',
      prompt: 'Formuliere den Text in einem freundlichen, respektvollen und wertschätzenden Ton neu. Erhalte die inhaltliche Aussage, entschärfe harsche Formulierungen, nutze inklusive Sprache. Nur das umformulierte Ergebnis in Markdown ausgeben.',
    },
    {
      name: 'Professionell umschreiben',
      category: 'style',
      description: 'Schreibt sachlich, präzise und strukturiert.',
      prompt: 'Schreibe den Text in einem professionellen, sachlichen und klar strukturierten Stil um. Vermeide Umgangssprache, optimiere Präzision und Lesbarkeit, behalte den Kerninhalt bei. Nur das Ergebnis in Markdown ausgeben.',
    },
    {
      name: 'Locker umformulieren',
      category: 'style',
      description: 'Macht den Ton locker und alltagstauglich.',
      prompt: 'Formuliere den Text locker, natürlich und umgangssprachlich neu. Erhalte die Aussage, vereinfache komplexe Sätze und nutze alltagstaugliche Wörter. Nur das umformulierte Ergebnis in Markdown ausgeben.',
    },
    {
      name: 'Neutralisieren',
      category: 'style',
      description: 'Entfernt Wertungen und emotionale Sprache.',
      prompt: 'Formuliere den Text neutral und wertfrei um. Entferne emotionale oder wertende Sprache und behalte den Inhalt bei. Nur das neutralisierte Ergebnis in Markdown ausgeben.',
    },
    {
      name: 'Technisch erklären',
      category: 'explain',
      description: 'Bereitet Inhalte für Fachpublikum auf.',
      prompt: 'Erkläre den Text technisch präzise für ein fachkundiges Publikum. Nutze korrekte Terminologie, klare Struktur (Markdown-Überschriften/Listen) und Beispiele, falls sinnvoll. Nur die Erklärung in Markdown ausgeben.',
    },
    {
      name: 'Stichpunkte',
      category: 'structure',
      description: 'Verdichtet Inhalte zu Bullet-Points.',
      prompt: 'Konvertiere den Text in eine prägnante ungeordnete Liste (Markdown). Nur die Liste ausgeben.',
    },
    {
      name: 'Nummerierte Schritte',
      category: 'structure',
      description: 'Strukturiert Abläufe als Schrittfolge.',
      prompt: 'Konvertiere den Text in eine nummerierte Schritt-für-Schritt Liste (Markdown). Nur die Liste ausgeben.',
    },
    {
      name: 'Aufgabenliste',
      category: 'structure',
      description: 'Erstellt eine Taskliste mit Checkboxen.',
      prompt: 'Konvertiere den Text in eine Aufgabenliste in Markdown mit - [ ] Einträgen. Nur die Liste ausgeben.',
    },
    {
      name: 'Tabelle aus Text',
      category: 'structure',
      description: 'Überführt Inhalte in eine Markdown-Tabelle.',
      prompt: 'Erzeuge aus dem Text eine konsistente Markdown-Tabelle mit sinnvollen Spalten. Keine Erklärungen, nur Tabelle.',
    },
    {
      name: 'Zitat',
      category: 'structure',
      description: 'Wandelt Text in ein Blockzitat.',
      prompt: 'Wandle den Text in ein Markdown-Blockzitat (> ...) um. Nur das Zitat ausgeben.',
    },
    {
      name: 'Codeblock',
      category: 'structure',
      description: 'Formatiert den Inhalt als Codeblock.',
      prompt: 'Wandle den Text in einen Markdown-Codeblock um. Sprache, falls erkennbar, ansonsten ohne. Nur den Codeblock ausgeben.',
    },
    {
      name: 'DE → EN',
      category: 'translate',
      description: 'Übersetzt den Text ins Englische.',
      prompt: 'Übersetze den Text ins Englische. Nur Übersetzung ausgeben.',
    },
    {
      name: 'EN → DE',
      category: 'translate',
      description: 'Übersetzt den Text ins Deutsche.',
      prompt: 'Übersetze den Text ins Deutsche. Nur Übersetzung ausgeben.',
    },
    {
      name: 'Flowchart erstellen',
      category: 'visuals',
      description: 'Visualisiert Kernaussagen als Mermaid-Flowchart.',
      prompt: 'Analysiere den Text und extrahiere die wichtigsten Schritte oder Entscheidungen. Gib ein vollständiges Markdown-Fragment mit einem ```mermaid```-Block aus, der ein Flowchart im Format "flowchart TD" mit maximal 8 Knoten zeigt. Verwende kurze aktive Beschriftungen, nutze sprechende IDs (z. B. Schritt1, EntscheidungA) und ergänze sinnvolle Pfeiltexte. Keine zusätzliche Erklärung außerhalb des Codeblocks.',
    },
    {
      name: 'Sequenzdiagramm erstellen',
      category: 'visuals',
      description: 'Stellt Abläufe als Mermaid-Sequenzdiagramm dar.',
      prompt: 'Analysiere Rollen und Interaktionen im Text. Erzeuge ausschließlich ein Markdown-Fragment mit einem ```mermaid```-Block vom Typ "sequenceDiagram". Definiere alle Beteiligten mit sprechenden Namen, beschreibe maximal 10 Nachrichten mit kurzen, aktiven Formulierungen und verwende notes over/left/right wenn hilfreich. Keine weiteren Erklärungen außerhalb des Codeblocks.',
    },
    {
      name: 'Mindmap erstellen',
      category: 'visuals',
      description: 'Verdichtet Themen zu einer Mermaid-Mindmap.',
      prompt: 'Identifiziere das Hauptthema und die wichtigsten Unterthemen des Textes. Gib ausschließlich ein Markdown-Fragment mit einem ```mermaid```-Block vom Typ "mindmap" zurück. Verwende klare, kurze Stichworte, gruppiere verwandte Ideen unter gemeinsamen Ästen und beschränke dich auf höchstens drei Ebenen. Keine zusätzliche Erklärung außerhalb des Codeblocks.',
    },
  ];
  const BUILT_IN_PRESET_NAMES = new Set(BUILT_IN_PRESETS.map(p => p.name.trim()));
  function getPresetCategoryInfo(id) {
    const key = typeof id === 'string' ? id.trim() : '';
    if (key && PRESET_CATEGORIES[key]) return PRESET_CATEGORIES[key];
    return PRESET_CATEGORIES[CUSTOM_PRESET_CATEGORY] || { label: 'Eigene Presets', icon: '⭐' };
  }
  let syncInlinePresetPicker = () => {};
  const LEARNING_MODES = {
    'flashcards': {
      key: 'flashcards',
      label: 'Karteikarten',
      modalTitle: 'Interaktive Karteikarten',
      badge: 'Karteikarten',
      statusGenerating: 'Die KI erstellt interaktive Karteikarten…',
      statusReady: 'Fertig! Die Vorschau zeigt eine interaktive Karteikarten-Übung.',
      statusReadyFallback: 'Fertig! Vorschau über Blob-URL geladen, da iframe.srcdoc nicht verfügbar ist.',
      fallbackTitle: 'Interaktive Karteikarten',
      loadingMessage: 'Die KI generiert gerade interaktive Karteikarten. Bitte kurz warten.',
      downloadBase: 'Interaktive Karteikarten',
      buildUserInstruction(hasContent, markdown) {
        const base = hasContent
          ? `Analysiere den folgenden Markdown-Inhalt und extrahiere die wichtigsten Fakten, Definitionen oder Konzepte. Forme daraus 8–12 prägnante Karteikarten.\n\n[MARKDOWN]\n${markdown}`
          : 'Erstelle eine kleine Sammlung von 8–12 deutschsprachigen Karteikarten zu einem frei wählbaren Lernthema.';
        return `${base}\n\nAnforderungen:\n- Gestalte eine bildschirmfüllende Lernoberfläche mit einer festen Kopfzeile, Fortschrittsanzeige und einem zentralen Bereich für die aktuelle Karte.\n- Zeige immer nur eine Karte gleichzeitig. Biete Buttons zum Umdrehen sowie Schaltflächen „Gewusst“ und „Nochmal“, die den Lernfortschritt steuern.\n- Hinterlege alle Karten als Array von Objekten in einem Vanilla-JavaScript-Block, mische die Reihenfolge beim Start und nach einem Reset, und aktualisiere Fortschritt/Zähler dynamisch.\n- Animierte Flip-Effekte dürfen per CSS umgesetzt werden, müssen aber zugänglich bleiben (Focus-States, aria-Attribute, verständliche Texte).\n- Sorge dafür, dass Text auf Vorder- und Rückseite beim Flippen lesbar bleibt (z. B. durch backface-visibility: hidden und transform-style: preserve-3d). Vermeide Animationen, die Text spiegeln oder auf den Kopf stellen; nutze stattdessen seitliches Ein- und Ausblenden oder dezente 3D-Bewegungen mit unveränderter Leserichtung.\n- Blende die Rückseite standardmäßig aus und zeige sie erst nach Interaktion. Auf der Rückseite dürfen Definition, Beispiele und Merkhilfen stehen.\n- Baue einen sichtbaren Fortschrittsbalken sowie einen Score (z. B. „3 von 10 gelernt“) ein. Ergänze einen Reset-Button, der alles zurücksetzt.\n- Speichere für jede Karte, ob sie als „Gewusst“ oder „Nochmal“ markiert wurde, und organisiere mehrere Durchgänge: Nach einer Runde sollen automatisch nur die „Nochmal“-Karten in einer neuen Runde auftauchen, bis alle Karten als „Gewusst“ markiert sind. Zeige nach jeder Runde eine Zusammenfassung und ermögliche den direkten Start der nächsten Wiederholungsrunde.\n- Verwende ausschließlich HTML5, eingebettetes CSS und Vanilla-JavaScript ohne externe Ressourcen.\n- Gib ausschließlich den vollständigen HTML-Code zurück.`;
      },
    },
    'cloze': {
      key: 'cloze',
      label: 'Lückentexte',
      modalTitle: 'Interaktiver Lückentext',
      badge: 'Lückentext',
      statusGenerating: 'Die KI erstellt einen interaktiven Lückentext…',
      statusReady: 'Fertig! Die Vorschau zeigt einen interaktiven Lückentext.',
      statusReadyFallback: 'Fertig! Vorschau über Blob-URL geladen, da iframe.srcdoc nicht verfügbar ist.',
      fallbackTitle: 'Interaktiver Lückentext',
      loadingMessage: 'Die KI generiert gerade einen interaktiven Lückentext. Bitte kurz warten.',
      downloadBase: 'Interaktiver Lückentext',
      buildUserInstruction(hasContent, markdown) {
        const base = hasContent
          ? `Analysiere den folgenden Markdown-Inhalt und extrahiere zentrale Begriffe, Fakten oder Zusammenhänge. Forme daraus einen interaktiven Lückentext mit 8–12 Lücken.\n\n[MARKDOWN]\n${markdown}`
          : 'Erstelle einen deutschsprachigen interaktiven Lückentext mit 8–12 Lücken zu einem allgemeinbildenden Thema deiner Wahl.';
        return `${base}\n\nAnforderungen:\n- Gestalte eine Lernoberfläche mit Kopfbereich (Titel, kurzer Überblick, Fortschrittsanzeige) und einem Abschnitt für den eigentlichen Lückentext.\n- Bilde den Lückentext als Absätze, in denen einzelne Schlüsselwörter durch <input type="text" class="cloze-input"> ersetzt werden. Kennzeichne jede Lücke mit einer laufenden Nummer.\n- Lege alle Lösungen und akzeptierten Alternativen in einem eingebetteten JavaScript-Array ab. Verwende ein Skript, das Nutzerantworten prüft, Feedback anzeigt und den Fortschritt aktualisiert.\n- Ergänze Buttons zum Überprüfen einzelner Lücken sowie zum Anzeigen aller Lösungen. Nach vollständiger Lösung soll eine Zusammenfassung mit korrekt/inkorrekt-Statistik erscheinen.\n- Achte auf Tastaturbedienbarkeit, aussagekräftige aria-Labels und sichtbare Fokuszustände. Verzichte auf externe Bibliotheken.\n- Verwende ausschließlich HTML5, eingebettetes CSS und Vanilla-JavaScript ohne Abhängigkeiten.\n- Gib ausschließlich den vollständigen HTML-Code zurück.`;
      },
    },
    'quiz-mc': {
      key: 'quiz-mc',
      label: 'Quiz (Multiple Choice)',
      modalTitle: 'Interaktives Quiz (Multiple Choice)',
      badge: 'Multiple Choice',
      statusGenerating: 'Die KI komponiert ein interaktives Multiple-Choice-Quiz…',
      statusReady: 'Fertig! Die Vorschau zeigt ein interaktives Multiple-Choice-Quiz.',
      statusReadyFallback: 'Fertig! Vorschau über Blob-URL geladen, da iframe.srcdoc nicht verfügbar ist.',
      fallbackTitle: 'Interaktives Multiple-Choice-Quiz',
      loadingMessage: 'Die KI generiert gerade ein interaktives Multiple-Choice-Quiz. Bitte kurz warten.',
      downloadBase: 'Interaktives Multiple-Choice-Quiz',
      buildUserInstruction(hasContent, markdown) {
        const base = hasContent
          ? `Analysiere den folgenden Markdown-Inhalt und entwickle daraus 5–8 anspruchsvolle Multiple-Choice-Fragen. Jede Frage soll das Verständnis zentraler Inhalte überprüfen.\n\n[MARKDOWN]\n${markdown}`
          : 'Erstelle ein deutschsprachiges Multiple-Choice-Quiz mit 5–8 Fragen zu einem allgemeinbildenden Lernthema deiner Wahl.';
        return `${base}\n\nAnforderungen:\n- Präsentiere das Quiz als kleine App mit Starttext, Fortschrittsbalken und einer Ergebnisbox. Jede Frage soll in einem eigenen <article class="quiz-question"> stehen.\n- Platziere die Antwortoptionen in einem <form> mit <fieldset> und Radio-Buttons (<input type="radio">) samt klar beschrifteten <label>-Elementen.\n- Implementiere mit Vanilla-JavaScript eine Auswertelogik: Nach Klick auf „Antwort prüfen“ erscheint Feedback zur gewählten Option, falsche Antworten werden markiert und die richtige Lösung erklärt.\n- Aktualisiere nach jeder Frage den Fortschritt (z. B. „Frage 3 von 6“) und zähle die richtigen Antworten live mit.\n- Biete einen Button „Weiter“ zur nächsten Frage sowie einen Abschlussbildschirm mit Gesamtpunktzahl, Auswertungstext und Restart-Möglichkeit.\n- Sorge für zugängliche Tastatursteuerung und lesbare Fokuszustände. Vermeide externe Ressourcen.\n- Verwende ausschließlich HTML5, eingebettetes CSS und Vanilla-JavaScript ohne Abhängigkeiten.\n- Gib ausschließlich den vollständigen HTML-Code zurück.`;
      },
    },
    'quiz-free': {
      key: 'quiz-free',
      label: 'Quiz (Freitext)',
      modalTitle: 'Interaktives Quiz (Freitext)',
      badge: 'Freitext-Quiz',
      statusGenerating: 'Die KI entwickelt ein interaktives Freitext-Quiz…',
      statusReady: 'Fertig! Die Vorschau zeigt ein interaktives Freitext-Quiz.',
      statusReadyFallback: 'Fertig! Vorschau über Blob-URL geladen, da iframe.srcdoc nicht verfügbar ist.',
      fallbackTitle: 'Interaktives Freitext-Quiz',
      loadingMessage: 'Die KI generiert gerade ein interaktives Freitext-Quiz. Bitte kurz warten.',
      downloadBase: 'Interaktives Freitext-Quiz',
      buildUserInstruction(hasContent, markdown) {
        const base = hasContent
          ? `Analysiere den folgenden Markdown-Inhalt und formuliere daraus 5–7 offene Fragen, bei denen Lernende freie Antworten geben. Jede Frage soll Verständnis, Transfer oder Reflexion fördern.\n\n[MARKDOWN]\n${markdown}`
          : 'Erstelle ein deutschsprachiges Quiz mit 5–7 offenen Fragen zu einem Lerngebiet deiner Wahl, das zu reflektierenden Antworten anregt.';
        return `${base}\n\nAnforderungen:\n- Gestalte die Oberfläche als geführte Lernsession mit Einleitung, Frage-Navigation und Abschlussreflexion. Jede Frage gehört in ein eigenes <article class="quiz-question">.\n- Platziere pro Frage ein großzügiges <textarea> mit Zeichenzähler sowie Kontroll-Buttons „Notiz speichern“ und „Lösung ansehen“.\n- Nutze Vanilla-JavaScript, um Nutzereingaben temporär zu speichern, den Zeichenzähler live zu aktualisieren und pro Frage ein Selbst-Check-Rating (z. B. 1–5 Sterne) zu ermöglichen.\n- Verstecke Musterlösungen standardmäßig und blende sie erst nach Klick auf „Lösung ansehen“ ein. Ergänze Hinweise, Bewertungskriterien und markierte Schlüsselbegriffe.\n- Führe einen Fortschrittsstatus über alle Fragen hinweg und zeige am Ende eine Zusammenfassung mit den eigenen Notizen und Selbstbewertungen (ohne Server, rein clientseitig).\n- Achte auf zugängliche Labels, Tastaturbedienbarkeit und klare Fokuszustände. Verzichte auf externe Ressourcen.\n- Verwende ausschließlich HTML5, eingebettetes CSS und Vanilla-JavaScript ohne Abhängigkeiten.\n- Gib ausschließlich den vollständigen HTML-Code zurück.`;
      },
    },
  };
  const ONBOARDING_STORAGE_KEY = 'md-onboarding-v1';
  const CANONICAL_SHARE_URL = 'https://markdown-webeditor.252425.xyz/';
  const CANONICAL_SHARE_TITLE = 'Markdown WebEditor';
  const CANONICAL_SHARE_TEXT = 'Markdown WebEditor – dein leichter Markdown Editor direkt im Browser.';
  const onboardingSteps = [
    {
      title: 'Willkommen im Markdown WebEditor',
      description: 'Dein schneller Arbeitsbereich für Markdown, Notizen und Dokumentation.',
      highlights: [
        'Nutze die Formatierungsleiste für Überschriften, Tabellen, Aufgabenlisten und mehr.',
        'Schalte per Ansichtsschalter zwischen Editor, Split und Reader oder aktiviere „Vorlesen“ für den Reader.',
        'Wechsle Themes über die Sonne/Mond-Schaltfläche und passe Details im Einstellungsmenü an.',
      ],
    },
    {
      title: 'Dateien, Vorlagen & Versionen',
      description: 'Organisiere Dokumente und halte zentrale Ressourcen griffbereit.',
      highlights: [
        'Öffne, speichere oder importiere Markdown-, PDF- und Word-Dateien – Autosave sichert deinen Stand lokal.',
        'Starte mit dem Vorlagen-Button in der Toolbar schneller durch, inklusive Suche, Kategorien und Favoriten.',
        'Lege Snapshots im Versionspanel an, vergleiche Diffs und stelle ältere Stände bei Bedarf wieder her.',
      ],
    },
    {
      title: 'KI-Werkzeuge & Chat',
      description: 'Hol dir Unterstützung beim Schreiben, Kürzen oder Strukturieren.',
      highlights: [
        'Der Button „Text Generieren“ öffnet den Inline-Generator mit Presets und optionaler Auswahl-Ersetzung.',
        'Blende den Chat ein, nutze Vorschlagsprompts und teile bei Bedarf den Editor-Kontext für bessere Antworten.',
        'Verwalte KI-Anbieter, Modelle und API-Keys zentral im Einstellungsbereich.',
      ],
    },
    {
      title: 'Website & Lernmodus',
      description: 'Teile Ergebnisse direkt als Website oder Lernmaterial.',
      highlights: [
        'Wähle Export → Website, um eine responsive HTML-Seite zu generieren und direkt zu kopieren oder herunterzuladen.',
        'Öffne das Lernen-Menü für automatisch erzeugte Karteikarten, Lückentexte sowie Quizze mit Multiple Choice oder Freitext.',
        'Nutze die Vorschau-Modalfenster, um Ergebnisse erneut zu generieren, zu kopieren oder abzuspeichern.',
      ],
    },
  ];
  let onboardingIndex = 0;
  let onboardingAcknowledged = false;

  // Chat elements
  const chatToggleBtn = document.getElementById('chatToggleBtn');
  const chatOverlay = document.getElementById('chatOverlay');
  const chatPanel = document.getElementById('chatPanel');
  const chatCloseBtn = document.getElementById('chatCloseBtn');
  const chatModelBadge = document.getElementById('chatModelBadge');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSuggestions = document.getElementById('chatSuggestions');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatAbortBtn = document.getElementById('chatAbortBtn');
  const chatClearBtn = document.getElementById('chatClearBtn');
  const chatStreamToggle = document.getElementById('chatStreamToggle');
  const applyModeSelect = null;
  const aiGenerateBtn = document.getElementById('aiGenerateBtn');
  const websiteOverlay = document.getElementById('websiteOverlay');
  const websiteModal = document.getElementById('websiteModal');
  const websiteCloseBtn = document.getElementById('websiteCloseBtn');
  const websiteCloseFooterBtn = document.getElementById('websiteCloseFooterBtn');
  const websiteRegenerateBtn = document.getElementById('websiteRegenerateBtn');
  const websiteCopyHtmlBtn = document.getElementById('websiteCopyHtmlBtn');
  const websiteDownloadBtn = document.getElementById('websiteDownloadBtn');
  const websitePreviewFrame = document.getElementById('websitePreviewFrame');
  const websiteStatus = document.getElementById('websiteStatus');
  const learningOverlay = document.getElementById('learningOverlay');
  const learningModal = document.getElementById('learningModal');
  const learningCloseBtn = document.getElementById('learningCloseBtn');
  const learningCloseFooterBtn = document.getElementById('learningCloseFooterBtn');
  const learningRegenerateBtn = document.getElementById('learningRegenerateBtn');
  const learningCopyHtmlBtn = document.getElementById('learningCopyHtmlBtn');
  const learningDownloadBtn = document.getElementById('learningDownloadBtn');
  const learningPreviewFrame = document.getElementById('learningPreviewFrame');
  const learningStatus = document.getElementById('learningStatus');
  const learningModalTitle = document.getElementById('learningModalTitle');
  const learningModeLabel = document.getElementById('learningModeLabel');
  const learningFullscreenBtn = document.getElementById('learningFullscreenBtn');
  // Provider + Gemini/Mistral elements
  const aiProviderSelect = document.getElementById('aiProvider');
  const openaiSettingsGroup = document.getElementById('openaiSettingsGroup');
  const openaiApiKeyInput = document.getElementById('openaiApiKeyInput');
  const openaiBaseInput = document.getElementById('openaiBaseInput');
  const openaiModelInput = document.getElementById('openaiModelInput');
  const openaiModelSelect = document.getElementById('openaiModelSelect');
  const openaiSaveBtn = document.getElementById('openaiSaveBtn');
  const openaiTestBtn = document.getElementById('openaiTestBtn');
  const openaiStatus = document.getElementById('openaiStatus');
  const claudeSettingsGroup = document.getElementById('claudeSettingsGroup');
  const claudeApiKeyInput = document.getElementById('claudeApiKeyInput');
  const claudeBaseInput = document.getElementById('claudeBaseInput');
  const claudeModelInput = document.getElementById('claudeModelInput');
  const claudeModelSelect = document.getElementById('claudeModelSelect');
  const claudeSaveBtn = document.getElementById('claudeSaveBtn');
  const claudeTestBtn = document.getElementById('claudeTestBtn');
  const claudeStatus = document.getElementById('claudeStatus');
  const ollamaSettingsGroup = document.getElementById('ollamaSettingsGroup');
  const geminiSettingsGroup = document.getElementById('geminiSettingsGroup');
  const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
  const geminiModelInput = document.getElementById('geminiModelInput');
  const geminiModelSelect = document.getElementById('geminiModelSelect');
  const geminiSaveBtn = document.getElementById('geminiSaveBtn');
  const geminiTestBtn = document.getElementById('geminiTestBtn');
  const geminiStatus = document.getElementById('geminiStatus');
  const mistralSettingsGroup = document.getElementById('mistralSettingsGroup');
  const mistralApiKeyInput = document.getElementById('mistralApiKeyInput');
  const mistralModelInput = document.getElementById('mistralModelInput');
  const mistralModelSelect = document.getElementById('mistralModelSelect');
  const mistralSaveBtn = document.getElementById('mistralSaveBtn');
  const mistralTestBtn = document.getElementById('mistralTestBtn');
  const mistralStatus = document.getElementById('mistralStatus');
  const ollamaUrlInput = document.getElementById('ollamaUrlInput');
  const ollamaModelInput = document.getElementById('ollamaModelInput');
  const ollamaModelSelect = document.getElementById('ollamaModelSelect');
  const ollamaSaveBtn = document.getElementById('ollamaSaveBtn');
  const ollamaTestBtn = document.getElementById('ollamaTestBtn');
  const ollamaStatus = document.getElementById('ollamaStatus');
  const editorContextBtn = document.getElementById('editorContextBtn');
  const editorContextInfo = document.getElementById('editorContextInfo');
  const onboardingOverlay = document.getElementById('onboardingOverlay');
  const onboardingTitle = document.getElementById('onboardingTitle');
  const onboardingDescription = document.getElementById('onboardingDescription');
  const onboardingList = document.getElementById('onboardingStepList');
  const onboardingDots = document.getElementById('onboardingDots');
  const onboardingCounter = document.getElementById('onboardingStepCounter');
  const onboardingPrevBtn = document.getElementById('onboardingPrevBtn');
  const onboardingNextBtn = document.getElementById('onboardingNextBtn');
  const onboardingSkipBtn = document.getElementById('onboardingSkipBtn');

  // Settings elements
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const settingsCloseBtn = document.getElementById('settingsCloseBtn');
  const settingsSaveBtn = document.getElementById('settingsSaveBtn');
  const settingsTabs = document.querySelector('.settings-nav');
  const settingsTabButtons = () => Array.from(document.querySelectorAll('.settings-nav .nav-item'));
  const settingsTabPanels = () => Array.from(document.querySelectorAll('.settings-tab'));
  const infoAvatar = document.getElementById('infoAvatar');
  const infoName = document.getElementById('infoName');
  const prefReaderInput = document.getElementById('prefReaderInput');
  const prefStickyTools = document.getElementById('prefStickyTools');
  const prefAiInlineAutoOpen = document.getElementById('prefAiInlineAutoOpen');
  const prefDefaultView = document.getElementById('prefDefaultView');
  const prefAutoSnapshotInterval = document.getElementById('prefAutoSnapshotInterval');
  const prefUserContextEnabled = document.getElementById('prefUserContextEnabled');
  const prefUserContextProfile = document.getElementById('prefUserContextProfile');
  const prefUserContextStyle = document.getElementById('prefUserContextStyle');
  const prefUserContextAudience = document.getElementById('prefUserContextAudience');
  const prefUserContextInstructions = document.getElementById('prefUserContextInstructions');
  const userContextFieldsWrapper = document.getElementById('userContextFields');
  const feedbackForm = document.getElementById('feedbackForm');
  const feedbackNameInput = document.getElementById('feedbackName');
  const feedbackEmailInput = document.getElementById('feedbackEmail');
  const feedbackMessageInput = document.getElementById('feedbackMessage');
  const settingsConfigExportBtn = document.getElementById('settingsConfigExportBtn');
  const settingsConfigImportBtn = document.getElementById('settingsConfigImportBtn');
  const settingsConfigImportFile = document.getElementById('settingsConfigImportFile');
  const settingsConfigResetBtn = document.getElementById('settingsConfigResetBtn');
  const settingsShareCopyBtn = document.getElementById('settingsShareCopyBtn');
  const settingsShareNativeBtn = document.getElementById('settingsShareNativeBtn');
  const settingsShareTwitterBtn = document.getElementById('settingsShareTwitterBtn');
  const settingsShareLinkedinBtn = document.getElementById('settingsShareLinkedinBtn');
  const settingsShareFacebookBtn = document.getElementById('settingsShareFacebookBtn');
  const settingsShareWhatsappBtn = document.getElementById('settingsShareWhatsappBtn');
  const settingsShareTelegramBtn = document.getElementById('settingsShareTelegramBtn');
  const settingsShareMastodonBtn = document.getElementById('settingsShareMastodonBtn');
  const settingsShareEmailBtn = document.getElementById('settingsShareEmailBtn');
  const settingsOnboardingRestartBtn = document.getElementById('settingsOnboardingRestartBtn');

  const templatesToggleBtn = document.getElementById('templatesToggleBtn');
  const templatesPanel = document.getElementById('templatesPanel');
  const templatesOverlay = document.getElementById('templatesOverlay');
  const templatesCloseBtn = document.getElementById('templatesCloseBtn');
  const templateCategoriesNav = document.getElementById('templateCategories');
  const templateListEl = document.getElementById('templateList');
  const templateSearchInput = document.getElementById('templateSearch');
  const templatePreviewEmpty = document.getElementById('templatePreviewEmpty');
  const templatePreviewContent = document.getElementById('templatePreviewContent');
  const templatePreviewTitle = document.getElementById('templatePreviewTitle');
  const templatePreviewDescription = document.getElementById('templatePreviewDescription');
  const templatePreviewSample = document.getElementById('templatePreviewSample');
  const templatePreviewExpandBtn = document.getElementById('templatePreviewExpandBtn');
  const templatePreviewModal = document.getElementById('templatePreviewModal');
  const templatePreviewModalTitle = document.getElementById('templatePreviewModalTitle');
  const templatePreviewModalDescription = document.getElementById('templatePreviewModalDescription');
  const templatePreviewModalBody = document.getElementById('templatePreviewModalBody');
  const templatePreviewModalClose = document.getElementById('templatePreviewModalClose');
  const templateInsertBtn = document.getElementById('templateInsertBtn');
  const templateFavoriteBtn = document.getElementById('templateFavoriteBtn');
  const templateAiGenerateBtn = document.getElementById('templateAiGenerateBtn');
  const templateAiStatusEl = document.getElementById('templateAiStatus');
  const templateAiComposer = document.getElementById('templateAiComposer');
  const templateAiPromptInput = document.getElementById('templateAiPromptInput');
  const templateAiPromptSubmit = document.getElementById('templateAiPromptSubmit');
  const templateAiPromptClose = document.getElementById('templateAiPromptClose');
  const templateAiPromptCancel = document.getElementById('templateAiPromptCancel');
  const templateAiPromptMessage = document.getElementById('templateAiPromptMessage');

  const toolbar = document.querySelector('.toolbar');
  const tableDialogOverlay = document.getElementById('tableDialogOverlay');
  const tableDialog = document.getElementById('tableDialog');
  const tableDialogForm = document.getElementById('tableDialogForm');
  const tableRowsInput = document.getElementById('tableRowsInput');
  const tableColsInput = document.getElementById('tableColsInput');
  const tableAddRowBtn = document.getElementById('tableAddRowBtn');
  const tableAddColBtn = document.getElementById('tableAddColBtn');
  const tableDialogCloseBtn = document.getElementById('tableDialogCloseBtn');
  const tableDialogCancelBtn = document.getElementById('tableDialogCancelBtn');
  const tableBuilderGrid = document.getElementById('tableBuilderGrid');
  const mermaidDialogOverlay = document.getElementById('mermaidDialogOverlay');
  const mermaidDialog = document.getElementById('mermaidDialog');
  const mermaidDialogForm = document.getElementById('mermaidDialogForm');
  const mermaidTypeSelect = document.getElementById('mermaidTypeSelect');
  const mermaidOrientationField = document.getElementById('mermaidOrientationField');
  const mermaidOrientationSelect = document.getElementById('mermaidOrientationSelect');
  const mermaidCodeInput = document.getElementById('mermaidCodeInput');
  const mermaidCodeHint = document.getElementById('mermaidCodeHint');
  const mermaidDialogCloseBtn = document.getElementById('mermaidDialogCloseBtn');
  const mermaidDialogCancelBtn = document.getElementById('mermaidDialogCancelBtn');
  const mermaidTemplateResetBtn = document.getElementById('mermaidTemplateResetBtn');
  const mermaidBuilder = document.getElementById('mermaidBuilder');
  const mermaidBuilderEnabled = document.getElementById('mermaidBuilderEnabled');
  const mermaidBuilderContent = document.getElementById('mermaidBuilderContent');
  const mermaidBuilderResetBtn = document.getElementById('mermaidBuilderResetBtn');
  const mermaidNodeIdOptions = document.getElementById('mermaidNodeIdOptions');
  const mermaidPreview = document.getElementById('mermaidPreview');
  const mermaidPreviewStatus = document.getElementById('mermaidPreviewStatus');

  // State
  let fileHandle = null;
  let currentFileName = '';
  let dirty = false;
  let allowEditorContext = true;
  let importMenuVisible = false;
  let exportMenuVisible = false;
  let learningMenuVisible = false;
  let headingMenuVisible = false;
  let videoMenuVisible = false;
  let updatesLoading = false;
  let updatesLoadedOnce = false;
  let websiteModalOpen = false;
  let websiteAbortController = null;
  let websiteLastFocus = null;
  let websiteLatestDocument = '';
  let websiteIsBusy = false;
  let websitePreviewBlobUrl = '';
  let learningModalOpen = false;
  let learningModalFullscreen = false;
  let learningAbortController = null;
  let learningLastFocus = null;
  let learningPreviewBlobUrl = '';
  let learningIsBusy = false;
  /** @type {Map<string, string>} */
  const learningDocuments = new Map();
  /** @type {string | null} */
  let learningMode = null;
  let templatesVisible = false;
  let currentTemplateCategory = 'all';
  let currentTemplateSearch = '';
  /** @type {string | null} */
  let currentTemplateSelection = null;
  /** @type {AbortController | null} */
  let templateAiAbortController = null;
  /** @type {{ id: string, title: string, description: string, content: string, aiGenerated?: boolean, aiStatusMessage?: string, aiStatusError?: boolean } | null} */
  let templateAiDraft = null;
  let templateActivePreview = null;
  let templateAiComposerOpen = false;
  const TEMPLATE_FAVORITES_KEY = 'mw-template-favorites';
  const templateFavorites = new Set();
  const templateData = window.MARKDOWN_TEMPLATES || { categories: [] };
  const templateIndex = new Map();
  const templateAiIndex = new Map();
  const templateAiOrder = [];
  const MAX_AI_SNIPPETS = 20;
  updateWebsiteActionButtons();
  let skipToolbarPostAction = false;
  let tableInsertSelection = null;
  let mermaidConfigured = false;
  let lastMermaidTheme = null;
  const GITHUB_REPO = 'anes-03/Markdown-WebEditor';
  const MAX_COMMITS_TO_SHOW = 8;
  const TABLE_MIN_ROWS = 2;
  const TABLE_MIN_COLS = 1;
  const TABLE_MAX_ROWS = 15;
  const TABLE_MAX_COLS = 10;
  const TABLE_DEFAULT_ROWS = 3;
  const TABLE_DEFAULT_COLS = 3;
  let tableDialogRows = TABLE_DEFAULT_ROWS;
  let tableDialogCols = TABLE_DEFAULT_COLS;
  const MERMAID_DEFAULT_TYPE = 'flowchart';
  const MERMAID_DEFAULT_ORIENTATION = 'TD';
  let mermaidInsertSelection = null;
  let mermaidTemplatePristine = true;
  let lastMermaidType = MERMAID_DEFAULT_TYPE;
  let lastMermaidOrientation = MERMAID_DEFAULT_ORIENTATION;
  const MERMAID_NODE_SHAPES = [
    { value: 'rectangle', label: 'Rechteck' },
    { value: 'rounded', label: 'Abgerundet' },
    { value: 'diamond', label: 'Entscheidung' },
    { value: 'circle', label: 'Start/Ende' },
  ];
  const mermaidBuilderState = {
    enabled: false,
    type: MERMAID_DEFAULT_TYPE,
    data: new Map(),
  };
  let mermaidBuilderSyncing = false;

  // Utilities
  const supportsFSA = () => 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;

  if (window.pdfjsLib?.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.js';
  }

  let turndownService = null;

  const readAloudBaseTitle = readAloudBtn?.getAttribute('title') || 'Reader-Inhalt vorlesen';
  const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let speechUtterance = null;
  let speechActive = false;
  let speechVoices = [];

  function refreshSpeechVoices() {
    if (!speechSupported) return;
    try {
      speechVoices = window.speechSynthesis.getVoices();
    } catch {
      speechVoices = [];
    }
  }

  function getPreferredSpeechLang() {
    const docLang = (document.documentElement?.lang || '').trim();
    if (docLang) return docLang;
    const navLang = (navigator.language || navigator.userLanguage || '').trim?.() || '';
    return navLang || 'de-DE';
  }

  function findVoiceForLang(lang) {
    if (!speechVoices.length) return null;
    if (lang) {
      const normalized = lang.toLowerCase();
      const exact = speechVoices.find(v => (v.lang || '').toLowerCase() === normalized);
      if (exact) return exact;
      const base = normalized.split('-')[0];
      if (base) {
        const partial = speechVoices.find(v => (v.lang || '').toLowerCase().startsWith(base));
        if (partial) return partial;
      }
    }
    return speechVoices[0] || null;
  }

  function setReadAloudActive(active) {
    if (!readAloudBtn) return;
    const isActive = !!active;
    readAloudBtn.classList.toggle('active', isActive);
    readAloudBtn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    const title = isActive ? 'Vorlesen stoppen' : readAloudBaseTitle;
    readAloudBtn.title = title;
    readAloudBtn.setAttribute('aria-label', title);
    if (readAloudLabel) readAloudLabel.textContent = isActive ? 'Stopp' : 'Vorlesen';
    if (readAloudIcon) readAloudIcon.setAttribute('icon', isActive ? 'lucide:square' : 'lucide:volume-2');
  }

  function finishSpeech(message) {
    speechActive = false;
    speechUtterance = null;
    setReadAloudActive(false);
    if (message) setStatus(message);
  }

  function stopSpeech(message) {
    if (!speechSupported) return;
    const hadSpeech = speechActive || !!speechUtterance || window.speechSynthesis.speaking || window.speechSynthesis.pending;
    if (!hadSpeech) return;
    const current = speechUtterance;
    speechUtterance = null;
    speechActive = false;
    try {
      if (current) {
        current.onend = null;
        current.onerror = null;
      }
    } catch {}
    setReadAloudActive(false);
    try { window.speechSynthesis.cancel(); } catch {}
    if (message) setStatus(message);
  }

  function speakPreview() {
    if (!speechSupported) return;
    const text = (preview?.innerText || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      setStatus('Kein Inhalt zum Vorlesen');
      return;
    }
    refreshSpeechVoices();
    const utterance = new window.SpeechSynthesisUtterance(text);
    const lang = getPreferredSpeechLang();
    if (lang) utterance.lang = lang;
    const voice = findVoiceForLang(lang);
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (speechUtterance !== utterance) return;
      finishSpeech('Vorlesen beendet');
    };
    utterance.onerror = () => {
      if (speechUtterance !== utterance) return;
      finishSpeech('Vorlesen fehlgeschlagen');
    };
    try { window.speechSynthesis.cancel(); } catch {}
    try {
      speechUtterance = utterance;
      speechActive = true;
      setReadAloudActive(true);
      setStatus('Vorlesen läuft…');
      window.speechSynthesis.speak(utterance);
    } catch {
      finishSpeech('Vorlesen fehlgeschlagen');
    }
  }

  function updateReadAloudAvailability() {
    if (!readAloudBtn) return;
    if (!speechSupported) {
      readAloudBtn.disabled = true;
      readAloudBtn.setAttribute('aria-disabled', 'true');
      return;
    }
    const hasText = (preview?.innerText || '').trim().length > 0;
    readAloudBtn.disabled = !hasText;
    readAloudBtn.setAttribute('aria-disabled', hasText ? 'false' : 'true');
  }

  if (speechSupported) {
    refreshSpeechVoices();
    const synth = window.speechSynthesis;
    if (synth) {
      if (typeof synth.addEventListener === 'function') {
        synth.addEventListener('voiceschanged', refreshSpeechVoices);
      } else if ('onvoiceschanged' in synth) {
        synth.onvoiceschanged = refreshSpeechVoices;
      }
    }
  } else if (readAloudBtn) {
    readAloudBtn.disabled = true;
    readAloudBtn.setAttribute('aria-disabled', 'true');
    readAloudBtn.title = 'Vorlesen wird von diesem Browser nicht unterstützt';
    readAloudBtn.setAttribute('aria-label', 'Vorlesen wird von diesem Browser nicht unterstützt');
  }

  readAloudBtn?.addEventListener('click', () => {
    if (!speechSupported) return;
    if (speechActive || window.speechSynthesis.speaking) {
      stopSpeech('Vorlesen gestoppt');
    } else {
      speakPreview();
    }
  });

  updateReadAloudAvailability();

  function getTurndownService() {
    if (!turndownService && window.TurndownService) {
      turndownService = new window.TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
      if (typeof turndownService.keep === 'function') {
        try { turndownService.keep(['table']); } catch {}
      }
    }
    return turndownService;
  }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function getCanonicalSharePayload() {
    return {
      url: CANONICAL_SHARE_URL,
      title: CANONICAL_SHARE_TITLE,
      text: CANONICAL_SHARE_TEXT,
    };
  }

  function openShareTarget(url) {
    if (!url) return;
    try {
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
    } catch {
      try { window.location.href = url; } catch {}
    }
  }

  async function copyShareLinkToClipboard() {
    const { url, text } = getCanonicalSharePayload();
    const payload = `${text}\n${url}`.trim();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const ta = document.createElement('textarea');
        ta.value = payload;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setStatus('Teilen-Link kopiert');
    } catch (err) {
      console.error(err);
      alert('Link konnte nicht kopiert werden. Bitte manuell kopieren.');
      setStatus('Kopieren fehlgeschlagen');
    }
  }

  async function readErrorResponseBody(res) {
    if (!res || typeof res.text !== 'function') return '';
    try {
      const raw = await res.text();
      if (!raw) return '';
      const trimmed = raw.trim();
      if (!trimmed) return '';
      try {
        const json = JSON.parse(trimmed);
        if (json?.error?.message) return String(json.error.message);
        if (json?.message && typeof json.message === 'string') return json.message;
        if (typeof json === 'string') return json;
        return JSON.stringify(json);
      } catch {
        return trimmed;
      }
    } catch {
      return '';
    }
  }

  async function createHttpError(res) {
    if (!res) return new Error('HTTP Fehler');
    const detail = await readErrorResponseBody(res);
    const status = typeof res.status === 'number' ? `HTTP ${res.status}` : 'HTTP Fehler';
    if (!detail) return new Error(status);
    const normalized = detail.replace(/\s+/g, ' ').trim();
    const shortened = normalized.length > 300 ? `${normalized.slice(0, 297)}…` : normalized;
    return new Error(`${status}: ${shortened}`);
  }

  function setImportMenuVisible(visible) {
    importMenuVisible = !!visible;
    if (!importMenu || !importBtn) return;
    importMenu.classList.toggle('hidden', !importMenuVisible);
    importBtn.setAttribute('aria-expanded', importMenuVisible ? 'true' : 'false');
    importMenu.setAttribute('aria-hidden', importMenuVisible ? 'false' : 'true');
  }

  function closeImportMenu() {
    setImportMenuVisible(false);
  }

  function setExportMenuVisible(visible) {
    exportMenuVisible = !!visible;
    if (!exportMenu || !exportBtn) return;
    exportMenu.classList.toggle('hidden', !exportMenuVisible);
    exportBtn.setAttribute('aria-expanded', exportMenuVisible ? 'true' : 'false');
    exportMenu.setAttribute('aria-hidden', exportMenuVisible ? 'false' : 'true');
  }

  function closeExportMenu() {
    setExportMenuVisible(false);
  }

  function setLearningMenuVisible(visible) {
    learningMenuVisible = !!visible;
    if (!learningMenu || !learningBtn) return;
    learningMenu.classList.toggle('hidden', !learningMenuVisible);
    learningBtn.setAttribute('aria-expanded', learningMenuVisible ? 'true' : 'false');
    learningMenu.setAttribute('aria-hidden', learningMenuVisible ? 'false' : 'true');
  }

  function closeLearningMenu() {
    setLearningMenuVisible(false);
  }

  function setVideoMenuVisible(visible) {
    videoMenuVisible = !!visible;
    if (!videoMenu || !videoMenuBtn) return;
    videoMenu.classList.toggle('hidden', !videoMenuVisible);
    videoMenuBtn.setAttribute('aria-expanded', videoMenuVisible ? 'true' : 'false');
    videoMenu.setAttribute('aria-hidden', videoMenuVisible ? 'false' : 'true');
  }

  function closeVideoMenu() {
    setVideoMenuVisible(false);
  }

  function hasSeenOnboarding() {
    if (onboardingAcknowledged) return true;
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function markOnboardingComplete() {
    onboardingAcknowledged = true;
    try { localStorage.setItem(ONBOARDING_STORAGE_KEY, '1'); } catch {}
  }

  function renderOnboardingStep() {
    if (!onboardingOverlay || !Array.isArray(onboardingSteps) || !onboardingSteps.length) return;
    const step = onboardingSteps[onboardingIndex];
    if (!step) return;
    if (onboardingTitle) onboardingTitle.textContent = step.title || '';
    if (onboardingDescription) onboardingDescription.textContent = step.description || '';
    if (onboardingList) {
      onboardingList.innerHTML = '';
      if (Array.isArray(step.highlights)) {
        for (const entry of step.highlights) {
          if (typeof entry !== 'string') continue;
          const li = document.createElement('li');
          li.textContent = entry;
          onboardingList.appendChild(li);
        }
      }
    }
    if (onboardingCounter) {
      onboardingCounter.textContent = `${onboardingIndex + 1} / ${onboardingSteps.length}`;
    }
    const isFirst = onboardingIndex === 0;
    const isLast = onboardingIndex === onboardingSteps.length - 1;
    if (onboardingPrevBtn) {
      onboardingPrevBtn.disabled = isFirst;
      onboardingPrevBtn.setAttribute('aria-disabled', isFirst ? 'true' : 'false');
    }
    if (onboardingNextBtn) {
      onboardingNextBtn.textContent = isLast ? 'Los geht’s' : 'Weiter';
    }
    if (onboardingDots) {
      onboardingDots.innerHTML = '';
      onboardingSteps.forEach((_, idx) => {
        const dot = document.createElement('span');
        dot.className = 'onboarding-dot' + (idx === onboardingIndex ? ' active' : '');
        onboardingDots.appendChild(dot);
      });
    }
  }

  function openOnboarding() {
    if (!onboardingOverlay) return;
    onboardingOverlay.classList.remove('hidden');
    onboardingOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('onboarding-open');
    setTimeout(() => { try { onboardingNextBtn?.focus(); } catch {} }, 0);
  }

  function closeOnboarding(markComplete = false) {
    if (!onboardingOverlay) return;
    onboardingOverlay.classList.add('hidden');
    onboardingOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('onboarding-open');
    if (markComplete) {
      markOnboardingComplete();
    }
  }

  function initOnboarding() {
    if (!onboardingOverlay || !Array.isArray(onboardingSteps) || !onboardingSteps.length) return;
    if (hasSeenOnboarding()) return;
    onboardingIndex = 0;
    renderOnboardingStep();
    openOnboarding();
  }

  onboardingPrevBtn?.addEventListener('click', () => {
    if (onboardingIndex <= 0) return;
    onboardingIndex -= 1;
    renderOnboardingStep();
  });
  onboardingNextBtn?.addEventListener('click', () => {
    if (onboardingIndex < onboardingSteps.length - 1) {
      onboardingIndex += 1;
      renderOnboardingStep();
    } else {
      closeOnboarding(true);
    }
  });
  onboardingSkipBtn?.addEventListener('click', () => { closeOnboarding(true); });
  onboardingOverlay?.addEventListener('click', (event) => {
    if (event.target === onboardingOverlay) closeOnboarding(true);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && onboardingOverlay && !onboardingOverlay.classList.contains('hidden')) {
      closeOnboarding(true);
    }
  });

  function buildTemplateIndex() {
    templateIndex.clear();
    if (!templateData || !Array.isArray(templateData.categories)) return;
    templateData.categories.forEach((category) => {
      if (!category || !Array.isArray(category.snippets)) return;
      const categoryId = typeof category.id === 'string' ? category.id : String(category.id ?? '');
      const categoryLabel = category.label || categoryId || 'Allgemein';
      const categoryIcon = category.icon || 'lucide:folder';
      category.snippets.forEach((snippet) => {
        if (!snippet || typeof snippet.id !== 'string') return;
        const normalized = {
          id: snippet.id,
          title: snippet.title || 'Unbenannte Vorlage',
          description: snippet.description || '',
          content: snippet.content || '',
          categoryId,
          categoryLabel,
          categoryIcon,
        };
        templateIndex.set(normalized.id, normalized);
      });
    });
    if (templateAiOrder.length) {
      templateAiOrder.forEach((id) => {
        const aiSnippet = templateAiIndex.get(id);
        if (aiSnippet) {
          templateIndex.set(id, aiSnippet);
        }
      });
    }
  }

  function loadTemplateFavorites() {
    templateFavorites.clear();
    if (!window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(TEMPLATE_FAVORITES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => {
          if (typeof id === 'string' && templateIndex.has(id)) {
            templateFavorites.add(id);
          }
        });
      }
    } catch (err) {
      console.warn('Konnte Template-Favoriten nicht laden', err);
    }
  }

  function persistTemplateFavorites() {
    if (!window.localStorage) return;
    try {
      window.localStorage.setItem(TEMPLATE_FAVORITES_KEY, JSON.stringify(Array.from(templateFavorites)));
    } catch (err) {
      console.warn('Konnte Template-Favoriten nicht speichern', err);
    }
  }

  function toggleTemplateFavorite(id) {
    if (!id) return;
    if (templateFavorites.has(id)) {
      templateFavorites.delete(id);
    } else {
      templateFavorites.add(id);
    }
    persistTemplateFavorites();
  }

  function getAllTemplates() {
    return Array.from(templateIndex.values());
  }

  function getFilteredTemplates() {
    let snippets = getAllTemplates();
    if (currentTemplateCategory === 'favorites') {
      snippets = snippets.filter((snippet) => templateFavorites.has(snippet.id));
    } else if (currentTemplateCategory === 'ai') {
      snippets = templateAiOrder.map((id) => templateIndex.get(id)).filter(Boolean);
    } else if (currentTemplateCategory !== 'all') {
      snippets = snippets.filter((snippet) => snippet.categoryId === currentTemplateCategory);
    }
    if (currentTemplateSearch) {
      const term = currentTemplateSearch.toLowerCase();
      snippets = snippets.filter((snippet) => {
        const source = `${snippet.title} ${snippet.description} ${snippet.content}`.toLowerCase();
        return source.includes(term);
      });
    }
    return snippets;
  }

  function setTemplateAiStatus(message, options = {}) {
    if (!templateAiStatusEl) return;
    const { error = false } = options;
    if (!message) {
      templateAiStatusEl.textContent = '';
      templateAiStatusEl.classList.add('hidden');
      templateAiStatusEl.classList.remove('error');
      return;
    }
    templateAiStatusEl.textContent = message;
    templateAiStatusEl.classList.remove('hidden');
    templateAiStatusEl.classList.toggle('error', !!error);
  }

  function setTemplateAiPromptMessage(message, options = {}) {
    if (!templateAiPromptMessage) return;
    const { error = false } = options;
    if (!message) {
      templateAiPromptMessage.textContent = '';
      templateAiPromptMessage.classList.add('hidden');
      templateAiPromptMessage.classList.remove('error');
      return;
    }
    templateAiPromptMessage.textContent = message;
    templateAiPromptMessage.classList.remove('hidden');
    templateAiPromptMessage.classList.toggle('error', !!error);
  }

  function openTemplateAiComposer() {
    if (!templateAiComposer) return;
    templateAiComposerOpen = true;
    templateAiComposer.classList.remove('hidden');
    templateAiComposer.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      try { templateAiPromptInput?.focus({ preventScroll: true }); } catch {}
    }, 40);
  }

  function closeTemplateAiComposer(options = {}) {
    if (!templateAiComposer) return;
    const { resetPrompt = false } = options;
    templateAiComposerOpen = false;
    templateAiComposer.classList.add('hidden');
    templateAiComposer.setAttribute('aria-hidden', 'true');
    if (resetPrompt && templateAiPromptInput) {
      templateAiPromptInput.value = '';
    }
    if (!templateAiAbortController) {
      setTemplateAiPromptMessage('');
    }
  }

  function setTemplateAiComposerBusy(busy) {
    if (!templateAiComposer) return;
    const disabled = !!busy;
    templateAiComposer.classList.toggle('is-busy', disabled);
    if (templateAiPromptInput) templateAiPromptInput.readOnly = disabled;
    if (templateAiPromptSubmit) templateAiPromptSubmit.disabled = disabled;
  }

  function updateTemplateAiButton(busy) {
    if (!templateAiGenerateBtn) return;
    const isBusy = !!busy;
    const icon = templateAiGenerateBtn.querySelector('iconify-icon');
    const label = templateAiGenerateBtn.querySelector('.btn-label');
    templateAiGenerateBtn.classList.toggle('is-busy', isBusy);
    templateAiGenerateBtn.setAttribute('aria-busy', isBusy ? 'true' : 'false');
    templateAiGenerateBtn.setAttribute('aria-pressed', isBusy ? 'true' : 'false');
    templateAiGenerateBtn.setAttribute('title', isBusy ? 'KI-Generierung abbrechen' : 'KI-Prompt öffnen');
    if (icon) {
      try {
        icon.setAttribute('icon', isBusy ? 'lucide:loader-2' : 'lucide:sparkles');
      } catch {}
    }
    if (label) {
      label.textContent = isBusy ? 'Abbrechen' : 'KI-Vorlage';
    }
  }

  function renderTemplateCategories() {
    if (!templateCategoriesNav) return;
    const categories = [];
    categories.push({ id: 'all', label: 'Alle Vorlagen', icon: 'lucide:layers' });
    if (templateFavorites.size) {
      categories.push({ id: 'favorites', label: 'Favoriten', icon: 'lucide:star' });
    }
    if (templateAiOrder.length) {
      categories.push({ id: 'ai', label: 'KI-Vorlagen', icon: 'lucide:sparkles' });
    }
    if (Array.isArray(templateData?.categories)) {
      templateData.categories.forEach((category) => {
        if (!category || typeof category.id !== 'string') return;
        categories.push({
          id: category.id,
          label: category.label || category.id,
          icon: category.icon || 'lucide:folder',
        });
      });
    }
    const availableIds = new Set(categories.map((c) => c.id));
    if (!availableIds.has(currentTemplateCategory)) {
      currentTemplateCategory = 'all';
    }
    templateCategoriesNav.textContent = '';
    categories.forEach((category) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.category = category.id;
      btn.innerHTML = `${category.icon ? `<iconify-icon aria-hidden="true" icon="${category.icon}"></iconify-icon>` : ''}<span>${category.label}</span>`;
      if (currentTemplateCategory === category.id) btn.classList.add('active');
      btn.addEventListener('click', () => {
        currentTemplateCategory = category.id;
        renderTemplateCategories();
        renderTemplateList();
      });
      templateCategoriesNav.appendChild(btn);
    });
  }

  function renderTemplateList() {
    if (!templateListEl) return;
    const snippets = getFilteredTemplates();
    templateListEl.textContent = '';
    if (currentTemplateSelection && !snippets.some((snippet) => snippet.id === currentTemplateSelection)) {
      currentTemplateSelection = snippets.length ? snippets[0].id : null;
    }
    if (!currentTemplateSelection && snippets.length) {
      currentTemplateSelection = snippets[0].id;
    }
    if (!snippets.length) {
      const empty = document.createElement('li');
      empty.className = 'template-item-empty';
      empty.textContent = currentTemplateSearch ? 'Keine Vorlagen zur Suche gefunden.' : 'Keine Vorlagen verfügbar.';
      templateListEl.appendChild(empty);
      renderTemplatePreview(null);
      return;
    }
    snippets.forEach((snippet) => {
      templateListEl.appendChild(createTemplateListItem(snippet));
    });
    const selected = currentTemplateSelection ? templateIndex.get(currentTemplateSelection) || null : null;
    if (templatesVisible) {
      const activeItem = templateListEl.querySelector('.template-item.active');
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
    renderTemplatePreview(selected);
  }

  function createTemplateListItem(snippet) {
    const item = document.createElement('li');
    item.className = 'template-item';
    const isAiSnippet = !!snippet.aiGenerated;
    if (isAiSnippet) item.classList.add('is-ai');
    item.dataset.templateId = snippet.id;
    item.setAttribute('role', 'option');
    item.tabIndex = 0;
    if (snippet.id === currentTemplateSelection) {
      item.classList.add('active');
      item.setAttribute('aria-selected', 'true');
    } else {
      item.setAttribute('aria-selected', 'false');
    }
    const header = document.createElement('header');
    const title = document.createElement('span');
    title.className = 'template-item-title';
    title.textContent = snippet.title;
    header.appendChild(title);
    const favoriteBtn = document.createElement('button');
    favoriteBtn.type = 'button';
    favoriteBtn.className = 'icon-only template-item-favorite';
    const favIcon = document.createElement('iconify-icon');
    favIcon.setAttribute('aria-hidden', 'true');
    favIcon.setAttribute('icon', 'lucide:star');
    favoriteBtn.appendChild(favIcon);
    const fav = !isAiSnippet && templateFavorites.has(snippet.id);
    favoriteBtn.classList.toggle('active', fav);
    favoriteBtn.setAttribute('aria-pressed', fav ? 'true' : 'false');
    if (isAiSnippet) {
      favoriteBtn.classList.add('is-disabled');
      favoriteBtn.setAttribute('disabled', 'disabled');
      favoriteBtn.setAttribute('aria-hidden', 'true');
      favoriteBtn.setAttribute('tabindex', '-1');
      favoriteBtn.setAttribute('title', 'Favoriten nicht verfügbar');
      favoriteBtn.setAttribute('aria-label', 'Favoriten nicht verfügbar');
    } else {
      favoriteBtn.setAttribute('title', fav ? 'Favorit entfernen' : 'Als Favorit markieren');
      favoriteBtn.setAttribute('aria-label', fav ? 'Vorlage aus Favoriten entfernen' : 'Vorlage als Favorit markieren');
      favoriteBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleTemplateFavorite(snippet.id);
        renderTemplateCategories();
        renderTemplateList();
      });
    }
    if (isAiSnippet) {
      const badge = document.createElement('span');
      badge.className = 'template-item-badge';
      badge.innerHTML = '<iconify-icon aria-hidden="true" icon="lucide:sparkles"></iconify-icon> KI';
      header.appendChild(badge);
    }
    header.appendChild(favoriteBtn);
    item.appendChild(header);
    if (snippet.description) {
      const desc = document.createElement('p');
      desc.className = 'template-item-desc';
      desc.textContent = snippet.description;
      item.appendChild(desc);
    }
    const meta = document.createElement('span');
    meta.className = 'template-item-category';
    meta.textContent = isAiSnippet ? 'KI-Vorlage' : snippet.categoryLabel;
    item.appendChild(meta);
    const preview = document.createElement('p');
    preview.className = 'template-item-snippet';
    const condensed = snippet.content.replace(/\s+/g, ' ').trim();
    preview.textContent = condensed.length > 160 ? `${condensed.slice(0, 160)}…` : condensed;
    item.appendChild(preview);
    item.addEventListener('click', () => selectTemplateSnippet(snippet.id));
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectTemplateSnippet(snippet.id);
      }
    });
    return item;
  }

  function renderTemplatePreview(snippet) {
    if (!templatePreviewEmpty || !templatePreviewContent || !templateInsertBtn || !templateFavoriteBtn) return;
    if (!snippet) {
      setTemplateAiStatus('');
      templateActivePreview = null;
      templatePreviewEmpty.classList.remove('hidden');
      templatePreviewContent.classList.add('hidden');
      templateInsertBtn.setAttribute('disabled', 'disabled');
      templateInsertBtn.removeAttribute('data-template-id');
      templateInsertBtn.removeAttribute('data-template-ai');
      templateFavoriteBtn.setAttribute('disabled', 'disabled');
      templateFavoriteBtn.classList.remove('active');
      templateFavoriteBtn.removeAttribute('data-template-id');
      templateFavoriteBtn.removeAttribute('aria-pressed');
      templateFavoriteBtn.setAttribute('title', 'Als Favorit markieren');
      templateFavoriteBtn.setAttribute('aria-label', 'Als Favorit markieren');
      templatePreviewExpandBtn?.setAttribute('disabled', 'disabled');
      updateTemplatePreviewModalContent(null);
      return;
    }
    const isAiSnippet = !!snippet.aiGenerated;
    const hasContent = typeof snippet.content === 'string' && snippet.content.trim().length > 0;
    templateActivePreview = snippet;
    templatePreviewEmpty.classList.add('hidden');
    templatePreviewContent.classList.remove('hidden');
    templatePreviewTitle.textContent = snippet.title;
    templatePreviewDescription.textContent = snippet.description || '';
    templatePreviewSample.textContent = applyTemplatePlaceholders(snippet.content || '');
    if (hasContent) {
      templateInsertBtn.removeAttribute('disabled');
      templatePreviewExpandBtn?.removeAttribute('disabled');
    } else {
      templateInsertBtn.setAttribute('disabled', 'disabled');
      templatePreviewExpandBtn?.setAttribute('disabled', 'disabled');
    }
    if (isAiSnippet) {
      templateAiDraft = snippet;
      templateInsertBtn.setAttribute('data-template-ai', 'true');
      templateInsertBtn.setAttribute('data-template-id', snippet.id || 'ai-generated');
      setTemplateAiStatus(snippet.aiStatusMessage || '', { error: !!snippet.aiStatusError });
      templateFavoriteBtn.setAttribute('disabled', 'disabled');
      templateFavoriteBtn.classList.remove('active');
      templateFavoriteBtn.removeAttribute('data-template-id');
      templateFavoriteBtn.removeAttribute('aria-pressed');
      templateFavoriteBtn.setAttribute('title', 'Favoriten nicht verfügbar');
      templateFavoriteBtn.setAttribute('aria-label', 'Favoriten nicht verfügbar');
    } else {
      templateInsertBtn.removeAttribute('data-template-ai');
      templateInsertBtn.setAttribute('data-template-id', snippet.id);
      setTemplateAiStatus('');
      templateFavoriteBtn.removeAttribute('disabled');
      templateFavoriteBtn.setAttribute('data-template-id', snippet.id);
      const fav = templateFavorites.has(snippet.id);
      templateFavoriteBtn.classList.toggle('active', fav);
      templateFavoriteBtn.setAttribute('aria-pressed', fav ? 'true' : 'false');
      templateFavoriteBtn.setAttribute('title', fav ? 'Favorit entfernen' : 'Als Favorit markieren');
      templateFavoriteBtn.setAttribute('aria-label', fav ? 'Vorlage aus Favoriten entfernen' : 'Vorlage als Favorit markieren');
    }
    updateTemplatePreviewModalContent(snippet);
  }

  function selectTemplateSnippet(snippetId) {
    if (!snippetId || !templateIndex.has(snippetId)) return;
    currentTemplateSelection = snippetId;
    renderTemplateList();
    const snippet = templateIndex.get(snippetId);
    if (snippet) {
      renderTemplatePreview(snippet);
    }
  }

  function setTemplatesVisible(visible) {
    templatesVisible = !!visible;
    templatesPanel?.classList.toggle('hidden', !templatesVisible);
    templatesPanel?.setAttribute('aria-hidden', templatesVisible ? 'false' : 'true');
    templatesOverlay?.classList.toggle('hidden', !templatesVisible);
    templatesOverlay?.setAttribute('aria-hidden', templatesVisible ? 'false' : 'true');
    if (document.body) {
      document.body.classList.toggle('templates-open', templatesVisible);
    }
    templatesToggleBtn?.setAttribute('aria-expanded', templatesVisible ? 'true' : 'false');
    if (templatesVisible) {
      if (templateSearchInput) {
        templateSearchInput.value = currentTemplateSearch || '';
      }
      renderTemplateCategories();
      renderTemplateList();
      setTimeout(() => { templateSearchInput?.focus({ preventScroll: true }); }, 60);
    } else {
      templateSearchInput?.blur();
    }
  }

  function closeTemplatesPanel() {
    if (templateAiAbortController) {
      try { templateAiAbortController.abort(); } catch {}
      templateAiAbortController = null;
    }
    updateTemplateAiButton(false);
    setTemplateAiStatus('');
    closeTemplateAiComposer();
    closeTemplatePreviewModal();
    setTemplatesVisible(false);
  }

  function getEditorDocumentTitle() {
    const md = editor.value || '';
    const heading = extractTitle(md);
    if (heading) return heading;
    if (currentFileName) return currentFileName.replace(/\.[^.]+$/, '');
    const title = appTitleEl?.textContent?.trim();
    return title || 'Unbenanntes Dokument';
  }

  function applyTemplatePlaceholders(text) {
    if (!text) return '';
    const now = new Date();
    const title = getEditorDocumentTitle();
    const date = now.toLocaleDateString('de-DE');
    const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const replacements = {
      title,
      date,
      datetime: `${date} ${time}`,
      time,
      year: String(now.getFullYear()),
    };
    return text.replace(/\{\{\s*(title|date|datetime|time|year)\s*\}\}/gi, (_, key) => replacements[key.toLowerCase()] ?? '');
  }

  function insertTemplateSnippet(snippet) {
    if (!snippet) return;
    const text = applyTemplatePlaceholders(snippet.content || '');
    if (!text) return;
    editor.focus();
    const selStart = editor.selectionStart ?? editor.value.length;
    const selEnd = editor.selectionEnd ?? editor.value.length;
    let inserted = false;
    try {
      if (typeof document.queryCommandSupported === 'function' && document.queryCommandSupported('insertText')) {
        editor.setSelectionRange(selStart, selEnd);
        inserted = document.execCommand('insertText', false, text);
      }
    } catch (err) {
      console.warn('insertText command nicht verfügbar', err);
    }
    if (!inserted) {
      if (typeof editor.setRangeText === 'function') {
        editor.setRangeText(text, selStart, selEnd, 'end');
      } else {
        const value = editor.value;
        editor.value = value.slice(0, selStart) + text + value.slice(selEnd);
        editor.selectionStart = editor.selectionEnd = selStart + text.length;
      }
    }
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    updatePreview();
    updateCursorInfo();
    updateWordCount();
    markDirty(true);
    setStatus(`Vorlage „${snippet.title}“ eingefügt.`);
  }

  function normalizeTemplateMarkdown(text) {
    if (!text) return '';
    let trimmed = String(text).trim();
    const fenced = trimmed.match(/```(?:markdown|md)?\s*([\s\S]+?)```/i);
    if (fenced && fenced[1]) {
      trimmed = fenced[1].trim();
    }
    if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
      trimmed = trimmed.replace(/^```(?:markdown|md)?/i, '').replace(/```$/i, '').trim();
    }
    return trimmed;
  }

  function extractFirstMarkdownParagraph(md) {
    if (!md) return '';
    const withoutCode = md.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
    const lines = withoutCode.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^#{1,6}\s/.test(trimmed)) continue;
      if (/^[-*+]\s/.test(trimmed)) continue;
      if (/^>/.test(trimmed)) continue;
      const cleaned = trimmed
        .replace(/\[(.+?)\]\((.*?)\)/g, '$1')
        .replace(/[*_`~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned) return cleaned;
    }
    return '';
  }

  function deriveTemplateDescription(markdown, topic) {
    const paragraph = extractFirstMarkdownParagraph(markdown);
    if (paragraph) {
      return paragraph.length > 160 ? `${paragraph.slice(0, 157)}…` : paragraph;
    }
    const fallback = topic ? `Automatisch generierte Vorlage für ${topic}.` : 'Automatisch generierte Vorlage.';
    return fallback;
  }

  function sanitizeTopicForTitle(topic) {
    if (!topic) return '';
    return topic
      .replace(/[\r\n]+/g, ' ')
      .replace(/^(ich\s+)?(brauche|benötige|möchte|suche|will|hätte\s+gern(?:e)?|hätte\s+gerne)\s+(bitte\s+)?/i, '')
      .replace(/^(erstelle|erzeuge|generiere|bau|baue|mach|mache|entwickle)\s+(mir|uns|eine[nr]?|ein)?\s*/i, '')
      .replace(/\s+/g, ' ')
      .replace(/[:.!?]+$/g, '')
      .trim();
  }

  function isLetterLike(char) {
    if (!char) return false;
    const upper = char.toLocaleUpperCase('de-DE');
    const lower = char.toLocaleLowerCase('de-DE');
    return upper !== lower;
  }

  function toTitleCase(str) {
    if (!str) return '';
    const lower = str.toLocaleLowerCase('de-DE');
    let capitalizeNext = true;
    let result = '';
    for (const char of lower) {
      if (capitalizeNext && isLetterLike(char)) {
        result += char.toLocaleUpperCase('de-DE');
        capitalizeNext = false;
      } else {
        result += char;
      }
      if (!char.trim() || char === '-' || char === '/') {
        capitalizeNext = true;
      }
    }
    return result.replace(/\b([A-ZÄÖÜ])([A-ZÄÖÜ]+)\b/g, (_, first, rest) => `${first}${rest.toLowerCase('de-DE')}`);
  }

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return hash;
  }

  function createSmartTemplateTitle(topic) {
    const cleaned = sanitizeTopicForTitle(topic);
    const base = cleaned ? toTitleCase(cleaned) : 'Individuelle KI-Vorlage';
    if (!cleaned) return base;
    const suffixes = ['Kompass', 'Fahrplan', 'Blueprint', 'Navigator', 'Playbook', 'Toolkit', 'Baukasten', 'Masterplan'];
    const hash = Math.abs(hashString(base));
    const suffix = suffixes[hash % suffixes.length];
    const lowered = base.toLowerCase();
    if (!suffix || lowered.includes(suffix.toLowerCase())) {
      return base;
    }
    if (base.endsWith('–') || base.endsWith('-')) {
      return `${base} ${suffix}`;
    }
    return `${base} – ${suffix}`;
  }

  function buildTemplateAiSnippet(markdown, topic) {
    const clean = normalizeTemplateMarkdown(markdown);
    if (!clean) throw new Error('Die KI hat keinen Markdown-Inhalt zurückgegeben.');
    const fallbackTitle = createSmartTemplateTitle(topic);
    const derivedTitle = extractTitle(clean);
    const title = derivedTitle || fallbackTitle;
    const description = deriveTemplateDescription(clean, topic);
    return {
      id: '',
      title,
      description,
      content: clean,
      aiGenerated: true,
      aiStatusMessage: '',
      sourcePrompt: topic || '',
    };
  }

  function generateAiSnippetId() {
    return `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function registerTemplateAiSnippet(snippet) {
    if (!snippet) return null;
    const id = generateAiSnippetId();
    const normalized = {
      ...snippet,
      id,
      categoryId: 'ai',
      categoryLabel: 'KI-Vorlagen',
      categoryIcon: 'lucide:sparkles',
      aiGenerated: true,
      generatedAt: Date.now(),
    };
    templateAiIndex.set(id, normalized);
    templateIndex.set(id, normalized);
    const existingIdx = templateAiOrder.indexOf(id);
    if (existingIdx !== -1) {
      templateAiOrder.splice(existingIdx, 1);
    }
    templateAiOrder.unshift(id);
    if (templateAiOrder.length > MAX_AI_SNIPPETS) {
      const removedIds = templateAiOrder.splice(MAX_AI_SNIPPETS);
      let favoritesChanged = false;
      removedIds.forEach((removedId) => {
        templateAiIndex.delete(removedId);
        templateIndex.delete(removedId);
        if (templateFavorites.delete(removedId)) favoritesChanged = true;
        if (currentTemplateSelection === removedId) {
          currentTemplateSelection = null;
        }
      });
      if (favoritesChanged) persistTemplateFavorites();
    }
    return normalized;
  }

  function formatAiTopic(topic) {
    const clean = (topic || '').replace(/[\r\n]+/g, ' ').trim();
    if (!clean) return '';
    return clean.length > 60 ? `${clean.slice(0, 57)}…` : clean;
  }

  function updateTemplatePreviewModalContent(snippet) {
    if (!templatePreviewModal) return;
    if (!snippet) {
      if (!templatePreviewModal.classList.contains('hidden')) {
        closeTemplatePreviewModal();
      }
      return;
    }
    templatePreviewModalTitle.textContent = snippet.title || '';
    templatePreviewModalDescription.textContent = snippet.description || '';
    templatePreviewModalBody.textContent = applyTemplatePlaceholders(snippet.content || '');
  }

  function openTemplatePreviewModal(snippet) {
    if (!templatePreviewModal) return;
    const target = snippet || templateActivePreview;
    if (!target) return;
    updateTemplatePreviewModalContent(target);
    templatePreviewModal.classList.remove('hidden');
    templatePreviewModal.setAttribute('aria-hidden', 'false');
    document.body?.classList.add('template-preview-open');
    setTimeout(() => {
      try { templatePreviewModalClose?.focus({ preventScroll: true }); } catch {}
    }, 40);
  }

  function closeTemplatePreviewModal() {
    if (!templatePreviewModal) return;
    templatePreviewModal.classList.add('hidden');
    templatePreviewModal.setAttribute('aria-hidden', 'true');
    document.body?.classList.remove('template-preview-open');
  }

  async function handleTemplateAiGenerate() {
    if (!templateAiGenerateBtn) return;
    if (templateAiAbortController) {
      try { templateAiAbortController.abort(); } catch {}
      setTemplateAiStatus('Generierung wird abgebrochen…');
      setStatus('KI-Vorlage wird abgebrochen…');
      setTemplateAiPromptMessage('Die Generierung wird abgebrochen…');
      return;
    }
    const prompt = templateAiPromptInput?.value ?? '';
    const topic = prompt.replace(/[\s\u00A0]+/g, ' ').trim();
    if (!topic) {
      setTemplateAiPromptMessage('Bitte beschreibe kurz, wofür die Vorlage gedacht ist.', { error: true });
      try { templateAiPromptInput?.focus({ preventScroll: true }); } catch {}
      return;
    }
    const controller = new AbortController();
    templateAiAbortController = controller;
    updateTemplateAiButton(true);
    setTemplateAiComposerBusy(true);
    const shortTopic = formatAiTopic(topic);
    if (shortTopic) {
      setTemplateAiPromptMessage(`Die KI arbeitet an „${shortTopic}“…`);
      setStatus(`KI erstellt Vorlage zu „${shortTopic}“…`);
      setTemplateAiStatus(`Die KI erstellt gerade eine Vorlage zu „${shortTopic}“…`);
    } else {
      setTemplateAiPromptMessage('Die KI erstellt eine neue Vorlage…');
      setStatus('KI erstellt eine neue Vorlage…');
      setTemplateAiStatus('Die KI erstellt eine neue Vorlage…');
    }
    try {
      const markdown = await requestTemplateAiSnippet(topic, editor?.value || '', controller.signal);
      if (controller.signal.aborted) {
        setTemplateAiStatus('Die Generierung wurde abgebrochen.', { error: false });
        setTemplateAiPromptMessage('Die Generierung wurde abgebrochen.');
        setStatus('KI-Vorlage abgebrochen.');
        return;
      }
      const snippet = buildTemplateAiSnippet(markdown, topic);
      snippet.aiStatusMessage = 'Mit KI erstellt – überprüfe den Inhalt vor der Verwendung.';
      const registered = registerTemplateAiSnippet(snippet);
      templateAiDraft = registered;
      setTemplateAiPromptMessage('Fertig! Die KI-Vorlage wurde generiert.');
      currentTemplateCategory = 'ai';
      renderTemplateCategories();
      currentTemplateSelection = registered?.id || null;
      renderTemplateList();
      if (registered) {
        renderTemplatePreview(registered);
        setTemplateAiStatus(registered.aiStatusMessage || '', { error: false });
        setStatus(`KI-Vorlage „${registered.title}“ bereit.`);
      } else {
        setStatus('KI-Vorlage erstellt.');
      }
      try { templateInsertBtn?.focus({ preventScroll: true }); } catch {}
    } catch (err) {
      if (controller.signal.aborted) {
        setTemplateAiStatus('Die Generierung wurde abgebrochen.', { error: false });
        setTemplateAiPromptMessage('Die Generierung wurde abgebrochen.');
        setStatus('KI-Vorlage abgebrochen.');
      } else {
        console.error('KI-Vorlage konnte nicht generiert werden', err);
        const message = `Fehler bei der KI-Generierung: ${err?.message || err}`;
        setTemplateAiStatus(message, { error: true });
        setTemplateAiPromptMessage(message, { error: true });
        setStatus('KI-Vorlage konnte nicht erstellt werden.');
      }
    } finally {
      if (templateAiAbortController === controller) {
        templateAiAbortController = null;
      }
      setTemplateAiComposerBusy(false);
      updateTemplateAiButton(false);
    }
  }

  function setWebsiteModalVisible(visible) {
    websiteModalOpen = !!visible;
    if (websiteModal) {
      websiteModal.classList.toggle('hidden', !visible);
      websiteModal.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }
    if (websiteOverlay) {
      websiteOverlay.classList.toggle('hidden', !visible);
      websiteOverlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }
  }

  function updateWebsiteStatus(message, isError) {
    if (!websiteStatus) return;
    websiteStatus.textContent = message || '';
    websiteStatus.classList.toggle('error', !!isError);
  }

  function setWebsiteBusy(busy) {
    websiteIsBusy = !!busy;
    if (websiteModal) websiteModal.setAttribute('aria-busy', busy ? 'true' : 'false');
    if (websiteRegenerateBtn) websiteRegenerateBtn.disabled = !!busy;
    updateWebsiteActionButtons();
  }

  function setWebsiteDocument(doc) {
    websiteLatestDocument = doc || '';
    updateWebsiteActionButtons();
  }

  function updateWebsiteActionButtons() {
    const disable = websiteIsBusy || !websiteLatestDocument;
    if (websiteCopyHtmlBtn) websiteCopyHtmlBtn.disabled = disable;
    if (websiteDownloadBtn) websiteDownloadBtn.disabled = disable;
  }

  function revokeWebsitePreviewBlob() {
    if (!websitePreviewBlobUrl) return;
    try { URL.revokeObjectURL(websitePreviewBlobUrl); } catch {}
    websitePreviewBlobUrl = '';
  }

  function applyWebsitePreviewDocument(html) {
    if (!websitePreviewFrame) return { applied: false, fallback: false };
    revokeWebsitePreviewBlob();
    const frame = websitePreviewFrame;
    if (typeof frame.srcdoc === 'string') {
      try {
        frame.removeAttribute('src');
        frame.srcdoc = html;
        return { applied: true, fallback: false };
      } catch (err) {
        console.warn('iframe srcdoc failed, falling back to blob URL', err);
      }
    }
    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      websitePreviewBlobUrl = url;
      frame.removeAttribute('srcdoc');
      frame.src = url;
      return { applied: true, fallback: true };
    } catch (err) {
      revokeWebsitePreviewBlob();
      throw err;
    }
  }

  function buildLoadingCardDocument({ pageTitle, headline, message }) {
    const title = escapeHtml(pageTitle || headline || 'Inhalte werden erstellt…');
    const heading = escapeHtml(headline || 'Inhalte werden erstellt…');
    const body = escapeHtml(message || 'Bitte kurz warten.');
    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { color-scheme: light dark; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2933; }
    .card { text-align: center; padding: 2rem 2.5rem; border-radius: 18px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.15); background: rgba(255,255,255,0.9); max-width: 360px; backdrop-filter: blur(6px); }
    h1 { margin: 0 0 0.75rem; font-size: 1.35rem; }
    p { margin: 0; line-height: 1.5; color: rgba(15, 23, 42, 0.8); }
    @media (prefers-color-scheme: dark) {
      body { background: #020617; color: #e2e8f0; }
      .card { background: rgba(15, 23, 42, 0.85); color: #e2e8f0; box-shadow: 0 20px 45px rgba(2, 6, 23, 0.55); }
      p { color: rgba(226, 232, 240, 0.85); }
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${heading}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
  }

  function websiteLoadingTemplate() {
    return buildLoadingCardDocument({
      pageTitle: 'Website wird erstellt…',
      headline: 'Website wird erstellt…',
      message: 'Die KI generiert gerade eine Vorschau. Bitte kurz warten.',
    });
  }

  function ensureWebsiteDocument(content, fallbackTitle) {
    const trimmed = (content || '').trim();
    if (!trimmed) {
      return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${fallbackTitle || 'Generierte Website'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 3rem; background: #f5f6f8; color: #1f2328; }
    main { max-width: 720px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1rem; line-height: 1.6; }
  </style>
</head>
<body>
  <main>
    <h1>Keine Inhalte verfügbar</h1>
    <p>Die KI hat keine Inhalte zurückgegeben. Bitte versuche es erneut.</p>
  </main>
</body>
</html>`;
    }
    if (/<html[\s>]/i.test(trimmed)) {
      if (/<!doctype/i.test(trimmed)) return trimmed;
      return '<!DOCTYPE html>\n' + trimmed;
    }
    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${fallbackTitle || 'Generierte Website'}</title>
  <style>
    :root { color-scheme: light dark; }
    body { margin: 0; background: #f6f8fa; color: #1f2328; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 3rem; line-height: 1.6; }
    main { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 2.25rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <main>
${trimmed}
  </main>
</body>
</html>`;
  }

  function openWebsiteModal() {
    if (!websiteModal || !websiteOverlay) return;
    websiteLastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setWebsiteModalVisible(true);
    setWebsiteBusy(false);
    const hasExistingPreview = !!websiteLatestDocument;
    if (hasExistingPreview) {
      try { applyWebsitePreviewDocument(websiteLatestDocument); } catch (err) { console.error('Vorschau konnte nicht erneut geladen werden', err); }
      updateWebsiteStatus('Die zuletzt generierte Website wird angezeigt. Nutze „Neu generieren“ für eine aktualisierte Version.', false);
      updateWebsiteActionButtons();
    } else {
      setWebsiteDocument('');
      updateWebsiteStatus('Die KI erstellt eine Vorschau für deine Website…', false);
      applyWebsitePreviewDocument(websiteLoadingTemplate());
      generateWebsitePreview();
    }
    const focusModal = () => {
      try { websiteModal.focus({ preventScroll: true }); } catch {}
    };
    if (typeof queueMicrotask === 'function') queueMicrotask(focusModal);
    else setTimeout(focusModal, 0);
  }

  function closeWebsiteModal() {
    if (!websiteModalOpen) return;
    if (websiteAbortController) {
      try { websiteAbortController.abort(); } catch {}
    websiteAbortController = null;
    }
    setWebsiteBusy(false);
    setWebsiteModalVisible(false);
    revokeWebsitePreviewBlob();
    if (websiteLastFocus && typeof websiteLastFocus.focus === 'function') {
      setTimeout(() => {
        try { websiteLastFocus.focus({ preventScroll: true }); } catch {}
      }, 50);
    }
  }

  async function generateWebsitePreview() {
    if (!websiteModalOpen) return;
    const markdown = editor?.value || '';
    const controller = new AbortController();
    if (websiteAbortController) {
      try { websiteAbortController.abort(); } catch {}
    }
    websiteAbortController = controller;
    setWebsiteDocument('');
    setWebsiteBusy(true);
    updateWebsiteStatus('Die KI erstellt eine Vorschau für deine Website…', false);
    applyWebsitePreviewDocument(websiteLoadingTemplate());
    try {
      const html = await requestWebsiteHtml(markdown, controller.signal);
      if (controller.signal.aborted) return;
      const doc = ensureWebsiteDocument(html, currentFileName || 'Generierte Website');
      const applied = applyWebsitePreviewDocument(doc);
      if (applied.fallback) {
        updateWebsiteStatus('Fertig! Vorschau über Blob-URL geladen, da iframe.srcdoc nicht verfügbar ist.', false);
      } else {
        updateWebsiteStatus('Fertig! Die Vorschau zeigt die von der KI generierte Website.', false);
      }
      setWebsiteDocument(doc);
    } catch (err) {
      if (controller.signal.aborted) {
        updateWebsiteStatus('Die Generierung wurde abgebrochen.', true);
      } else {
        console.error('Website-Generierung fehlgeschlagen', err);
        updateWebsiteStatus(`Fehler bei der KI-Generierung: ${err?.message || err}`, true);
        const fallbackDoc = ensureWebsiteDocument('', currentFileName || 'Generierte Website');
        applyWebsitePreviewDocument(fallbackDoc);
        setWebsiteDocument(fallbackDoc);
      }
    } finally {
      if (websiteAbortController === controller) {
        websiteAbortController = null;
      }
      setWebsiteBusy(false);
    }
  }

  async function copyWebsiteHtmlToClipboard() {
    if (!websiteLatestDocument) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(websiteLatestDocument);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = websiteLatestDocument;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        let ok = false;
        try {
          ok = document.execCommand('copy');
        } finally {
          textarea.remove();
        }
        if (!ok) throw new Error('Kopieren wird nicht unterstützt');
      }
      updateWebsiteStatus('HTML wurde in die Zwischenablage kopiert.', false);
    } catch (err) {
      console.error('Website-HTML konnte nicht kopiert werden', err);
      updateWebsiteStatus(`HTML konnte nicht kopiert werden: ${err?.message || err}`, true);
    }
  }

  function downloadWebsiteHtmlFile() {
    if (!websiteLatestDocument) return;
    try {
      const base = currentFileName ? currentFileName.replace(/\.[^.]+$/, '') : 'Generierte Website';
      const safeBase = toSafeFileName(base) || 'Generierte-Website';
      const blob = new Blob([websiteLatestDocument], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeBase}.html`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 0);
      updateWebsiteStatus('Download gestartet.', false);
    } catch (err) {
      console.error('Website-HTML konnte nicht heruntergeladen werden', err);
      updateWebsiteStatus(`Download fehlgeschlagen: ${err?.message || err}`, true);
    }
  }

  function getLearningModeConfig(mode) {
    if (!mode) return null;
    return LEARNING_MODES?.[mode] || null;
  }

  function getLearningDocument() {
    if (!learningMode) return '';
    return learningDocuments.get(learningMode) || '';
  }

  function setLearningDocument(doc) {
    if (!learningMode) return;
    const content = typeof doc === 'string' ? doc : '';
    if (content) {
      learningDocuments.set(learningMode, content);
    } else {
      learningDocuments.delete(learningMode);
    }
    updateLearningActionButtons();
  }

  function updateLearningActionButtons() {
    const doc = getLearningDocument();
    const disable = learningIsBusy || !doc;
    if (learningCopyHtmlBtn) learningCopyHtmlBtn.disabled = disable;
    if (learningDownloadBtn) learningDownloadBtn.disabled = disable;
  }

  function updateLearningStatus(message, isError) {
    if (!learningStatus) return;
    learningStatus.textContent = message || '';
    learningStatus.classList.toggle('error', !!isError);
  }

  function setLearningBusy(busy) {
    learningIsBusy = !!busy;
    if (learningModal) learningModal.setAttribute('aria-busy', busy ? 'true' : 'false');
    if (learningRegenerateBtn) learningRegenerateBtn.disabled = !!busy;
    updateLearningActionButtons();
  }

  function setLearningModalVisible(visible) {
    learningModalOpen = !!visible;
    if (learningModal) {
      learningModal.classList.toggle('hidden', !visible);
      learningModal.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }
    if (learningOverlay) {
      learningOverlay.classList.toggle('hidden', !visible);
      learningOverlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }
  }

  function setLearningFullscreen(fullscreen) {
    const active = !!fullscreen;
    learningModalFullscreen = active;
    if (learningModal) {
      learningModal.classList.toggle('is-fullscreen', active);
    }
    if (learningOverlay) {
      learningOverlay.classList.toggle('is-light', active);
    }
    if (learningFullscreenBtn) {
      learningFullscreenBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
      const label = active ? 'Vorschau verkleinern' : 'Vorschau maximieren';
      learningFullscreenBtn.setAttribute('title', label);
      learningFullscreenBtn.setAttribute('aria-label', label);
      const icon = learningFullscreenBtn.querySelector('iconify-icon');
      if (icon) {
        icon.setAttribute('icon', active ? 'lucide:minimize-2' : 'lucide:maximize-2');
      }
    }
  }

  function revokeLearningPreviewBlob() {
    if (!learningPreviewBlobUrl) return;
    try { URL.revokeObjectURL(learningPreviewBlobUrl); } catch {}
    learningPreviewBlobUrl = '';
  }

  function applyLearningPreviewDocument(doc) {
    if (!learningPreviewFrame) return { applied: false, fallback: false };
    revokeLearningPreviewBlob();
    try {
      learningPreviewFrame.srcdoc = doc || '<!DOCTYPE html><html><body></body></html>';
      learningPreviewFrame.removeAttribute('src');
      return { applied: true, fallback: false };
    } catch (err) {
      console.warn('iframe.srcdoc wird nicht unterstützt, weiche auf Blob-URL aus.', err);
    }
    try {
      const blob = new Blob([doc || ''], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      learningPreviewFrame.removeAttribute('srcdoc');
      learningPreviewFrame.src = url;
      learningPreviewBlobUrl = url;
      return { applied: true, fallback: true };
    } catch (err) {
      console.error('Lernvorschau konnte nicht geladen werden', err);
      learningPreviewFrame.removeAttribute('srcdoc');
      learningPreviewFrame.setAttribute('src', 'about:blank');
      return { applied: false, fallback: false };
    }
  }

  function learningLoadingTemplate(config) {
    const label = config?.label || 'Lerninhalte';
    const message = config?.loadingMessage || 'Die KI bereitet interaktive Lerninhalte vor. Bitte kurz warten.';
    const headline = `${label} werden erstellt…`;
    return buildLoadingCardDocument({
      pageTitle: headline,
      headline,
      message,
    });
  }

  function openLearningModal(mode) {
    const config = getLearningModeConfig(mode);
    if (!config || !learningModal || !learningOverlay) return;
    learningMode = mode;
    learningLastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (learningModalTitle) learningModalTitle.textContent = config.modalTitle || 'Lernmodus-Vorschau';
    if (learningModeLabel) {
      const badge = config.badge || config.label || '';
      learningModeLabel.textContent = badge;
      if (badge) learningModeLabel.removeAttribute('hidden');
      else learningModeLabel.setAttribute('hidden', '');
    }
    setLearningFullscreen(false);
    setLearningModalVisible(true);
    setLearningBusy(false);
    const cached = getLearningDocument();
    if (cached) {
      try { applyLearningPreviewDocument(cached); } catch (err) { console.error('Lerninhalte konnten nicht erneut geladen werden', err); }
      updateLearningStatus(config.statusCached || 'Die zuletzt generierte Version wird angezeigt. Nutze „Neu generieren“, um eine aktualisierte Version zu erhalten.', false);
      updateLearningActionButtons();
    } else {
      setLearningDocument('');
      updateLearningStatus(config.statusGenerating || 'Die KI baut eine interaktive Lernansicht…', false);
      applyLearningPreviewDocument(learningLoadingTemplate(config));
      generateLearningPreview();
    }
    const focusModal = () => {
      try { learningModal.focus({ preventScroll: true }); } catch {}
    };
    if (typeof queueMicrotask === 'function') queueMicrotask(focusModal);
    else setTimeout(focusModal, 0);
  }

  function closeLearningModal() {
    if (!learningModalOpen) return;
    if (learningAbortController) {
      try { learningAbortController.abort(); } catch {}
      learningAbortController = null;
    }
    setLearningBusy(false);
    setLearningFullscreen(false);
    setLearningModalVisible(false);
    revokeLearningPreviewBlob();
    const lastFocus = learningLastFocus;
    learningLastFocus = null;
    if (lastFocus && typeof lastFocus.focus === 'function') {
      setTimeout(() => {
        try { lastFocus.focus({ preventScroll: true }); } catch {}
      }, 50);
    }
  }

  async function generateLearningPreview() {
    if (!learningModalOpen || !learningMode) return;
    const config = getLearningModeConfig(learningMode);
    if (!config) return;
    const markdown = editor?.value || '';
    const controller = new AbortController();
    if (learningAbortController) {
      try { learningAbortController.abort(); } catch {}
    }
    learningAbortController = controller;
    setLearningDocument('');
    setLearningBusy(true);
    updateLearningStatus(config.statusGenerating || 'Die KI baut eine interaktive Lernansicht…', false);
    applyLearningPreviewDocument(learningLoadingTemplate(config));
    try {
      const html = await requestLearningHtml(learningMode, markdown, controller.signal);
      if (controller.signal.aborted) return;
      const fallbackTitle = config.fallbackTitle || `${config.label || 'Lerninhalte'}`;
      const doc = ensureWebsiteDocument(html, fallbackTitle);
      const applied = applyLearningPreviewDocument(doc);
      if (applied.fallback) {
        updateLearningStatus(config.statusReadyFallback || 'Fertig! Vorschau über Blob-URL geladen, da iframe.srcdoc nicht verfügbar ist.', false);
      } else {
        updateLearningStatus(config.statusReady || 'Fertig! Die Vorschau zeigt die generierten Lerninhalte.', false);
      }
      setLearningDocument(doc);
    } catch (err) {
      if (controller.signal.aborted) {
        updateLearningStatus('Die Generierung wurde abgebrochen.', true);
      } else {
        console.error('Lerninhalte konnten nicht generiert werden', err);
        updateLearningStatus(`Fehler bei der KI-Generierung: ${err?.message || err}`, true);
        const fallbackDoc = ensureWebsiteDocument('', config.fallbackTitle || `${config.label || 'Lerninhalte'}`);
        applyLearningPreviewDocument(fallbackDoc);
        setLearningDocument(fallbackDoc);
      }
    } finally {
      if (learningAbortController === controller) {
        learningAbortController = null;
      }
      setLearningBusy(false);
    }
  }

  async function copyLearningHtmlToClipboard() {
    const doc = getLearningDocument();
    if (!doc) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(doc);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = doc;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        let ok = false;
        try {
          ok = document.execCommand('copy');
        } finally {
          textarea.remove();
        }
        if (!ok) throw new Error('Kopieren wird nicht unterstützt');
      }
      updateLearningStatus('HTML wurde in die Zwischenablage kopiert.', false);
    } catch (err) {
      console.error('Lern-HTML konnte nicht kopiert werden', err);
      updateLearningStatus(`HTML konnte nicht kopiert werden: ${err?.message || err}`, true);
    }
  }

  function downloadLearningHtmlFile() {
    const doc = getLearningDocument();
    if (!doc) return;
    const config = getLearningModeConfig(learningMode);
    try {
      const baseName = currentFileName ? currentFileName.replace(/\.[^.]+$/, '') : (config?.downloadBase || config?.label || 'Lerninhalte');
      const suffix = config?.badge || config?.label || learningMode || 'Lerninhalte';
      const safeBase = toSafeFileName(`${baseName} ${suffix}`.trim()) || 'Lerninhalte';
      const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeBase}.html`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 0);
      updateLearningStatus('Download gestartet.', false);
    } catch (err) {
      console.error('Lern-HTML konnte nicht heruntergeladen werden', err);
      updateLearningStatus(`Download fehlgeschlagen: ${err?.message || err}`, true);
    }
  }

  function getMermaidTheme() {
    const themeId = document.body?.getAttribute('data-theme') || 'light';
    if (['dark', 'black', 'solarized-dark'].includes(themeId)) return 'dark';
    if (themeId === 'high-contrast') return 'forest';
    if (themeId === 'sepia') return 'neutral';
    return 'default';
  }

  async function requestLearningHtml(mode, markdown, signal) {
    const config = getLearningModeConfig(mode);
    if (!config) throw new Error('Unbekannter Lernmodus');
    const provider = getAiProvider();
    const info = resolveCurrentProviderInfo();
    const trimmed = (markdown || '').trim();
    const hasContent = !!trimmed;
    const baseInstruction = `Du bist eine erfahrene Lehrkraft und Frontend-Designerin. Erstelle eine vollständige, responsive HTML5-Einzelseite für den Lernmodus "${config.label}". Verwende semantische HTML-Strukturen, ein klares Layout, eingebettete <style>-Blöcke und bei Bedarf einen einzelnen <script>-Block mit Vanilla-JavaScript für Interaktivität. Verzichte auf externe Bibliotheken, entferne Platzhalter- oder tote Links und gib ausschließlich den fertigen HTML-Code zurück.`;
    const userInstruction = typeof config.buildUserInstruction === 'function'
      ? config.buildUserInstruction(hasContent, trimmed)
      : '';
    if (!userInstruction) throw new Error('Keine gültige Anweisung für den Lernmodus verfügbar');
    const messages = [
      { role: 'system', content: baseInstruction },
      { role: 'user', content: userInstruction },
    ];

    switch (provider) {
      case 'openai': {
        const apiKey = (openaiApiKeyInput?.value || localStorage.getItem('openai-api-key') || '').trim();
        if (!apiKey) throw new Error('OpenAI API‑Key fehlt');
        return await openAiCompatibleChat({ apiKey, baseUrl: info.base, model: info.model, messages, stream: false, signal });
      }
      case 'claude': {
        const apiKey = (claudeApiKeyInput?.value || localStorage.getItem('claude-api-key') || '').trim();
        if (!apiKey) throw new Error('Claude API‑Key fehlt');
        return await anthropicChat({ apiKey, baseUrl: info.base, model: info.model, messages, stream: false, signal });
      }
      case 'ollama':
        return await ollamaChat({ base: info.base, model: info.model, messages, stream: false, signal });
      case 'gemini': {
        const apiKey = (geminiApiKeyInput?.value || localStorage.getItem('gemini-api-key') || '').trim();
        return await geminiChat({ apiKey, model: info.model, messages, stream: false, signal });
      }
      case 'mistral':
      default: {
        const apiKey = (mistralApiKeyInput?.value || localStorage.getItem('mistral-api-key') || '').trim();
        if (!apiKey) throw new Error('Mistral API‑Key fehlt');
        return await mistralChat({ apiKey, model: info.model, messages, stream: false, signal });
      }
    }
  }

  async function requestTemplateAiSnippet(topic, markdown, signal) {
    const subject = (topic || '').replace(/[\r\n]+/g, ' ').trim();
    if (!subject) throw new Error('Bitte gib ein Thema oder Ziel für die Vorlage an.');
    const provider = getAiProvider();
    const info = resolveCurrentProviderInfo();
    const trimmed = (markdown || '').trim();
    const hasContent = !!trimmed;
    const systemInstruction = 'Du bist eine erfahrene technische Redakteurin. Erstelle hochwertige Markdown-Vorlagen mit klaren Überschriften, Tabellen oder Listen, die direkt eingesetzt werden können. Verwende Platzhalter wie {{title}}, {{date}}, {{datetime}}, {{time}} oder {{year}}, wenn sie sinnvoll sind. Gib ausschließlich die fertige Markdown-Vorlage ohne zusätzliche Erklärungen aus.';
    const contextPart = hasContent
      ? `Berücksichtige den folgenden Editor-Inhalt als Referenz. Übernimm nur passende Struktur- oder Inhaltsideen und passe sie an das gewünschte Thema an.\n\n[EDITOR-INHALT]\n${trimmed}`
      : 'Nutze dein Fachwissen, um eine vollständige Struktur mit sinnvollen Abschnitten und Stichpunkten zu entwerfen.';
    const userInstruction = `Erstelle eine strukturierte Markdown-Vorlage zum Thema „${subject}“.\n\nAnforderungen:\n- Nutze klare Überschriften (##, ###) und strukturierende Elemente wie Listen oder Tabellen.\n- Verwende kurze Platzhaltertexte anstelle von Fließtext (z. B. TODO, Beschreibung, Verantwortliche).\n- Falls sinnvoll, setze Platzhalter {{title}}, {{date}}, {{datetime}}, {{time}} oder {{year}} ein.\n- Baue optionale Abschnitte mit Hinweisen (z. B. „Optional:“) ein, falls hilfreich.\n- Gib ausschließlich die Markdown-Vorlage zurück, ohne Erläuterungen oder Vorbemerkungen.\n\n${contextPart}`;

    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userInstruction },
    ];

    switch (provider) {
      case 'openai': {
        const apiKey = (openaiApiKeyInput?.value || localStorage.getItem('openai-api-key') || '').trim();
        if (!apiKey) throw new Error('OpenAI API‑Key fehlt');
        const response = await openAiCompatibleChat({ apiKey, baseUrl: info.base, model: info.model, messages, stream: false, signal });
        return normalizeTemplateMarkdown(response);
      }
      case 'claude': {
        const apiKey = (claudeApiKeyInput?.value || localStorage.getItem('claude-api-key') || '').trim();
        if (!apiKey) throw new Error('Claude API‑Key fehlt');
        const response = await anthropicChat({ apiKey, baseUrl: info.base, model: info.model, messages, stream: false, signal });
        return normalizeTemplateMarkdown(response);
      }
      case 'ollama': {
        const response = await ollamaChat({ base: info.base, model: info.model, messages, stream: false, signal });
        return normalizeTemplateMarkdown(response);
      }
      case 'gemini': {
        const apiKey = (geminiApiKeyInput?.value || localStorage.getItem('gemini-api-key') || '').trim();
        const response = await geminiChat({ apiKey, model: info.model, messages, stream: false, signal });
        return normalizeTemplateMarkdown(response);
      }
      case 'mistral':
      default: {
        const apiKey = (mistralApiKeyInput?.value || localStorage.getItem('mistral-api-key') || '').trim();
        if (!apiKey) throw new Error('Mistral API‑Key fehlt');
        const response = await mistralChat({ apiKey, model: info.model, messages, stream: false, signal });
        return normalizeTemplateMarkdown(response);
      }
    }
  }

  async function requestWebsiteHtml(markdown, signal) {
    const provider = getAiProvider();
    const info = resolveCurrentProviderInfo();
    const trimmed = (markdown || '').trim();
    const hasContent = !!trimmed;
    const baseInstruction = 'Du bist ein erfahrener UX- und Webdesigner. Erstelle eine vollständige, responsive HTML5-Einzelseite mit eingebettetem <style>-Block. Verwende semantische Elemente, ein hero-Layout, klare Abschnitte und einen deutlichen Call-to-Action. Vermeide Navigationsleisten oder Footer vollständig und setze keinerlei Links (weder intern noch extern). Platziere keine Buttons oder interaktiven Elemente ohne echte Funktion; verwende nur Elemente, die zur Lesbarkeit beitragen. Achte darauf, dass der Inhalt sehr gut leserlich ist und den gelieferten Editor-Text sorgfältig wiedergibt. Nutze nur relative Ressourcen (keine externen Skripte) und liefere ausschließlich validen HTML-Code.';
    const userInstruction = hasContent
      ? `Verwandele den folgenden Markdown-Inhalt in eine hochwertige Marketing-Landingpage. Ergänze sinnvolle Zwischenüberschriften, Icons (z. B. als Emoji) und Feature-Abschnitte. Vermeide Navigationsleisten oder Footer vollständig, setze keinerlei Links und verwende keine Buttons ohne echte Aktion. Stelle sicher, dass alles sehr gut leserlich ist und der Editor-Inhalt präzise und ansprechend dargestellt wird. Gib nur HTML aus.\n\n[MARKDOWN]\n${trimmed}`
      : 'Erstelle eine moderne, kreative Landingpage (Deutsch) mit Beispieltexten, die beschreibt, dass hier bald Inhalte stehen werden. Vermeide Navigationsleisten oder Footer vollständig, setze keinerlei Links und verwende keine Buttons ohne echte Aktion. Achte auf hervorragende Lesbarkeit und einen klaren Aufbau. Antworte ausschließlich mit HTML.';
    const messages = [
      { role: 'system', content: baseInstruction },
      { role: 'user', content: userInstruction },
    ];

    switch (provider) {
      case 'openai': {
        const apiKey = (openaiApiKeyInput?.value || localStorage.getItem('openai-api-key') || '').trim();
        if (!apiKey) throw new Error('OpenAI API‑Key fehlt');
        return await openAiCompatibleChat({ apiKey, baseUrl: info.base, model: info.model, messages, stream: false, signal });
      }
      case 'claude': {
        const apiKey = (claudeApiKeyInput?.value || localStorage.getItem('claude-api-key') || '').trim();
        if (!apiKey) throw new Error('Claude API‑Key fehlt');
        return await anthropicChat({ apiKey, baseUrl: info.base, model: info.model, messages, stream: false, signal });
      }
      case 'ollama':
        return await ollamaChat({ base: info.base, model: info.model, messages, stream: false, signal });
      case 'gemini': {
        const apiKey = (geminiApiKeyInput?.value || localStorage.getItem('gemini-api-key') || '').trim();
        return await geminiChat({ apiKey, model: info.model, messages, stream: false, signal });
      }
      case 'mistral':
      default: {
        const apiKey = (mistralApiKeyInput?.value || localStorage.getItem('mistral-api-key') || '').trim();
        if (!apiKey) throw new Error('Mistral API‑Key fehlt');
        return await mistralChat({ apiKey, model: info.model, messages, stream: false, signal });
      }
    }
  }


  function setUpdatesStatus(message) {
    if (updatesStatus) updatesStatus.textContent = message;
  }

  function formatCommitDate(date) {
    try {
      return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    } catch {
      return date.toLocaleString('de-DE');
    }
  }

  async function loadRepoUpdates() {
    if (!updatesPanel || !updatesList) return;
    if (updatesLoading) return;
    updatesLoadedOnce = true;
    if (typeof fetch !== 'function') {
      setUpdatesStatus('Aktuelle Änderungen können in diesem Browser nicht geladen werden.');
      if (updatesReloadBtn) {
        updatesReloadBtn.disabled = true;
        updatesReloadBtn.setAttribute('aria-disabled', 'true');
      }
      return;
    }
    updatesLoading = true;
    try {
      if (updatesReloadBtn) {
        updatesReloadBtn.disabled = true;
        updatesReloadBtn.setAttribute('aria-busy', 'true');
        updatesReloadBtn.setAttribute('aria-disabled', 'true');
      }
      setUpdatesStatus('Lade Änderungen…');
      updatesList.innerHTML = '';

      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=${MAX_COMMITS_TO_SHOW}`, {
        method: 'GET',
        headers: { 'Accept': 'application/vnd.github+json' }
      });

      if (!response.ok) {
        throw new Error(`GitHub API antwortete mit Status ${response.status}`);
      }

      const commits = await response.json();
      if (!Array.isArray(commits) || commits.length === 0) {
        setUpdatesStatus('Keine Änderungen gefunden.');
        return;
      }

      const fragment = document.createDocumentFragment();
      for (const commit of commits.slice(0, MAX_COMMITS_TO_SHOW)) {
        const li = document.createElement('li');
        li.className = 'updates-item';

        const commitMessage = typeof commit?.commit?.message === 'string' ? commit.commit.message.trim() : '';
        const message = document.createElement('pre');
        message.className = 'updates-item-message';
        message.textContent = commitMessage || 'Kein Committext';

        const meta = document.createElement('div');
        meta.className = 'updates-item-meta';
        const author = (commit?.commit?.author?.name || commit?.author?.login || '').trim();
        const dateStr = commit?.commit?.author?.date;
        const metaParts = [];
        if (author) metaParts.push(author);
        if (dateStr) {
          const parsed = new Date(dateStr);
          if (!Number.isNaN(parsed.getTime())) {
            metaParts.push(formatCommitDate(parsed));
          }
        }
        meta.textContent = metaParts.length ? metaParts.join(' • ') : 'Keine zusätzlichen Details';

        li.appendChild(message);
        li.appendChild(meta);

        const commitUrl = typeof commit?.html_url === 'string' ? commit.html_url : '';
        if (commitUrl) {
          const link = document.createElement('a');
          link.className = 'updates-item-link';
          link.href = commitUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = 'Commit auf GitHub öffnen';
          li.appendChild(link);
        }

        fragment.appendChild(li);
      }

      updatesList.appendChild(fragment);
      setUpdatesStatus(`Stand: ${formatCommitDate(new Date())}`);
    } catch (error) {
      console.error('Commits konnten nicht geladen werden', error);
      setUpdatesStatus('Konnte Änderungen nicht laden. Bitte später erneut versuchen.');
      const fallback = document.createElement('li');
      fallback.className = 'updates-item';
      const message = document.createElement('pre');
      message.className = 'updates-item-message';
      message.textContent = 'Aktuelle Änderungen konnten nicht abgerufen werden.';
      fallback.appendChild(message);
      updatesList.appendChild(fallback);
      updatesLoadedOnce = false;
    } finally {
      updatesLoading = false;
      if (updatesReloadBtn) {
        updatesReloadBtn.disabled = false;
        updatesReloadBtn.removeAttribute('aria-busy');
        updatesReloadBtn.removeAttribute('aria-disabled');
      }
    }
  }

  function setHeadingMenuVisible(visible) {
    headingMenuVisible = !!visible;
    if (!headingMenu || !headingMoreBtn) return;
    headingMenu.classList.toggle('hidden', !headingMenuVisible);
    headingMoreBtn.setAttribute('aria-expanded', headingMenuVisible ? 'true' : 'false');
    headingMenu.setAttribute('aria-hidden', headingMenuVisible ? 'false' : 'true');
  }

  function closeHeadingMenu() {
    setHeadingMenuVisible(false);
  }

  if (headingMoreBtn && headingMenu) {
    headingMoreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setHeadingMenuVisible(!headingMenuVisible);
    });

    headingMoreBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setHeadingMenuVisible(true);
        const firstItem = headingMenu.querySelector('button[data-action]');
        firstItem?.focus({ preventScroll: true });
      } else if (e.key === 'Escape' && headingMenuVisible) {
        e.preventDefault();
        closeHeadingMenu();
      }
    });
  }

  headingMenu?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeHeadingMenu();
      headingMoreBtn?.focus();
    }
  });

  headingMenu?.addEventListener('focusout', (e) => {
    if (!headingMenuVisible) return;
    const next = e.relatedTarget;
    if (!next) return;
    if (headingMenu.contains(next) || headingMoreBtn?.contains(next)) return;
    closeHeadingMenu();
  });

  // Provider helpers
  const SUPPORTED_PROVIDERS = ['openai', 'claude', 'ollama', 'gemini', 'mistral'];
  function getAiProvider() {
    try {
      const stored = localStorage.getItem('ai-provider') || 'openai';
      return SUPPORTED_PROVIDERS.includes(stored) ? stored : 'openai';
    } catch {
      return 'openai';
    }
  }
  function setAiProvider(p) {
    const normalized = SUPPORTED_PROVIDERS.includes(p) ? p : 'openai';
    try { localStorage.setItem('ai-provider', normalized); } catch {}
  }
  const PROVIDER_LABELS = {
    openai: 'OpenAI',
    claude: 'Anthropic Claude',
    ollama: 'Ollama',
    gemini: 'Google Gemini',
    mistral: 'Mistral',
  };

  function formatProviderInfo(info) {
    if (!info) return '';
    const label = PROVIDER_LABELS[info.provider] || info.provider;
    switch (info.provider) {
      case 'ollama':
        return `Modell: ${info.model} • URL: ${info.base}`;
      case 'gemini':
        return `Modell: ${info.model} • Anbieter: Google Gemini`;
      case 'mistral':
        return `Modell: ${info.model} • Anbieter: Mistral`;
      case 'openai':
      case 'claude':
        return `Modell: ${info.model} • Anbieter: ${label}${info.base ? ` • Basis: ${info.base}` : ''}`;
      default:
        return `Modell: ${info.model} • Anbieter: ${label}`;
    }
  }

  function applyProviderUI() {
    const p = getAiProvider();
    if (aiProviderSelect) aiProviderSelect.value = p;
    const groups = [
      ['openai', openaiSettingsGroup],
      ['claude', claudeSettingsGroup],
      ['ollama', ollamaSettingsGroup],
      ['gemini', geminiSettingsGroup],
      ['mistral', mistralSettingsGroup],
    ];
    for (const [id, el] of groups) {
      if (!el) continue;
      el.style.display = p === id ? '' : 'none';
    }
    // Update inline info/badge
    try { updateChatModelBadge(); } catch {}
    try {
      if (aiGenInfo) {
        const info = resolveCurrentProviderInfo();
        aiGenInfo.textContent = formatProviderInfo(info);
      }
    } catch {}
  }


  function resolveCurrentProviderInfo(presetOverrideModel) {
    const provider = getAiProvider();
    const override = (presetOverrideModel && presetOverrideModel.trim()) ? presetOverrideModel.trim() : null;
    switch (provider) {
      case 'openai': {
        const base = ((openaiBaseInput?.value || localStorage.getItem('openai-base') || 'https://api.openai.com/v1').trim() || 'https://api.openai.com/v1').replace(/\/$/, '');
        const defaultModel = (openaiModelSelect?.value || openaiModelInput?.value || localStorage.getItem('openai-model') || 'gpt-4o-mini').trim();
        return { provider, base, model: override || defaultModel };
      }
      case 'claude': {
        const base = ((claudeBaseInput?.value || localStorage.getItem('claude-base') || 'https://api.anthropic.com').trim() || 'https://api.anthropic.com').replace(/\/$/, '');
        const defaultModel = (claudeModelSelect?.value || claudeModelInput?.value || localStorage.getItem('claude-model') || 'claude-3-5-sonnet-latest').trim();
        return { provider, base, model: override || defaultModel };
      }
      case 'ollama': {
        const base = ((ollamaUrlInput?.value || localStorage.getItem('ollama-url') || 'http://localhost:11434').trim() || 'http://localhost:11434').replace(/\/$/, '');
        const defaultModel = (ollamaModelSelect?.value || ollamaModelInput?.value || localStorage.getItem('ollama-model') || 'llama3.1:8b').trim();
        return { provider, base, model: override || defaultModel };
      }
      case 'gemini': {
        const base = 'gemini';
        const defaultModel = (geminiModelSelect?.value || geminiModelInput?.value || localStorage.getItem('gemini-model') || 'gemini-1.5-flash').trim();
        return { provider, base, model: override || defaultModel };
      }
      case 'mistral': {
        const base = 'mistral';
        const defaultModel = (mistralModelSelect?.value || mistralModelInput?.value || localStorage.getItem('mistral-model') || 'mistral-small-latest').trim();
        return { provider, base, model: override || defaultModel };
      }
      default: {
        const base = 'gemini';
        const defaultModel = (geminiModelSelect?.value || geminiModelInput?.value || localStorage.getItem('gemini-model') || 'gemini-1.5-flash').trim();
        return { provider, base, model: override || defaultModel };
      }
    }
  }

  const inlineGenerator = createInlineGenerator();

  function editorGenerateAI() {
    inlineGenerator.toggle();
  }

  function createInlineGenerator() {
    const state = {
      controller: null,
      snapshot: null,
    };
    const elements = {
      editor,
      prompt: aiPromptInput,
      useSelection: aiUseSelection,
      startBtn: aiGenStartBtn,
      abortBtn: aiGenAbortBtn,
      resetBtn: aiGenResetBtn,
      toolbarBtn: aiGenerateBtn,
    };

    const isRunning = () => !!state.controller;

    const updateToolbarButton = (running) => {
      const btn = elements.toolbarBtn;
      if (!btn) return;
      try {
        const iconEl = btn.querySelector('iconify-icon');
        const labelEl = btn.querySelector('.btn-label');
        if (iconEl) iconEl.setAttribute('icon', running ? 'mdi:stop-circle-outline' : 'mdi:robot-outline');
        if (labelEl) labelEl.textContent = running ? 'Abbrechen' : 'Text Generieren';
        else btn.textContent = running ? 'Abbrechen' : 'Text Generieren';
      } catch {
        btn.textContent = running ? 'Abbrechen' : 'Text Generieren';
      }
      btn.disabled = false;
    };

    const updateInlineButtons = (running) => {
      if (elements.startBtn) elements.startBtn.disabled = running;
      if (elements.abortBtn) elements.abortBtn.disabled = !running;
    };

    const setResetEnabled = (enabled) => {
      if (elements.resetBtn) elements.resetBtn.disabled = !enabled;
    };

    const restoreSnapshot = (snap) => {
      if (!snap || !elements.editor) return;
      elements.editor.value = snap.value || '';
      try { elements.editor.setSelectionRange(snap.selStart ?? 0, snap.selEnd ?? 0); } catch {}
      elements.editor.dispatchEvent(new Event('input'));
    };

    const getPrompt = () => {
      if (elements.prompt) {
        const text = (elements.prompt.value || '').trim();
        if (!text) {
          elements.prompt.focus();
          return null;
        }
        return text;
      }
      const fallback = window.prompt('Beschreibe kurz, was generiert werden soll:', 'Zusammenfassung des ausgewählten Textes');
      if (fallback == null) return null;
      const trimmed = fallback.trim();
      return trimmed ? trimmed : null;
    };

    const runProviderChat = async (info, messages, signal, onDelta) => {
      switch (info.provider) {
        case 'openai': {
          const apiKey = (openaiApiKeyInput?.value || localStorage.getItem('openai-api-key') || '').trim();
          if (!apiKey) throw new Error('OpenAI API‑Key fehlt');
          return await openAiCompatibleChat({ apiKey, baseUrl: info.base, model: info.model, messages, stream: true, signal, onDelta });
        }
        case 'claude': {
          const apiKey = (claudeApiKeyInput?.value || localStorage.getItem('claude-api-key') || '').trim();
          if (!apiKey) throw new Error('Claude API‑Key fehlt');
          return await anthropicChat({ apiKey, baseUrl: info.base, model: info.model, messages, stream: true, signal, onDelta });
        }
        case 'ollama':
          return await ollamaChat({ base: info.base, model: info.model, messages, stream: true, signal, onDelta });
        case 'gemini': {
          const apiKey = (geminiApiKeyInput?.value || localStorage.getItem('gemini-api-key') || '').trim();
          if (!apiKey) throw new Error('Gemini API‑Key fehlt');
          return await geminiChat({ apiKey, model: info.model, messages, stream: true, signal, onDelta });
        }
        case 'mistral': {
          const apiKey = (mistralApiKeyInput?.value || localStorage.getItem('mistral-api-key') || '').trim();
          if (!apiKey) throw new Error('Mistral API‑Key fehlt');
          return await mistralChat({ apiKey, model: info.model, messages, stream: true, signal, onDelta });
        }
        default: {
          const apiKey = (mistralApiKeyInput?.value || localStorage.getItem('mistral-api-key') || '').trim();
          if (!apiKey) throw new Error('Mistral API‑Key fehlt');
          return await mistralChat({ apiKey, model: info.model, messages, stream: true, signal, onDelta });
        }
      }
    };

    const abort = () => {
      if (!state.controller) return;
      try { state.controller.abort(); } catch {}
    };

    const reset = () => {
      if (!state.snapshot) return;
      restoreSnapshot(state.snapshot);
      state.snapshot = null;
      setResetEnabled(false);
      setStatus('Zurückgesetzt');
    };

    const run = async () => {
      if (!elements.editor) return;
      const prompt = getPrompt();
      if (!prompt) return;

      const start = elements.editor.selectionStart ?? 0;
      const end = elements.editor.selectionEnd ?? 0;
      const useSelection = elements.useSelection ? !!elements.useSelection.checked : (end > start);
      const hasSelection = useSelection && end > start;
      const fullText = elements.editor.value || '';
      const selection = hasSelection ? fullText.slice(start, end) : '';

      const messages = [
        { role: 'system', content: 'Du bist ein hilfreicher Schreibassistent. Antworte in Markdown. Gib ausschließlich das Ergebnis aus – ohne Einleitung, ohne Meta-Kommentare, ohne Phrasen wie "ich" oder "hier ist".' }
      ];
      if (selection) {
        messages.push({ role: 'system', content: 'Kontext (ausgewählter Editor-Text, nur als Referenz, nicht erneut ausgeben):\n\n' + selection });
      }
      const userContext = getUserContext();
      if (userContext) {
        messages.push({ role: 'system', content: 'Beachte folgende Nutzer-Präferenzen für Stil, Ton oder Hintergrund:\n\n' + userContext });
      }
      messages.push({ role: 'user', content: prompt });

      const info = resolveCurrentProviderInfo();
      const controller = new AbortController();
      state.controller = controller;
      state.snapshot = {
        value: elements.editor.value,
        selStart: elements.editor.selectionStart,
        selEnd: elements.editor.selectionEnd,
      };

      setResetEnabled(true);
      updateToolbarButton(true);
      updateInlineButtons(true);
      setStatus('KI generiert (Streaming)…');

      let pos = start;
      if (hasSelection) {
        elements.editor.setRangeText('', start, end, 'start');
        pos = start;
      }
      let inserted = 0;
      let lastFlush = 0;

      const flush = () => {
        elements.editor.dispatchEvent(new Event('input'));
        try { elements.editor.setSelectionRange(pos, pos); } catch {}
        try { elements.editor.scrollTop = elements.editor.scrollHeight; } catch {}
        setStatus('KI generiert (Streaming)…');
      };

      const onDelta = (delta) => {
        if (!delta) return;
        elements.editor.setRangeText(delta, pos, pos, 'end');
        pos += delta.length;
        inserted += delta.length;
        const now = Date.now();
        if (now - lastFlush > 80) {
          flush();
          lastFlush = now;
        }
      };

      try {
        const full = await runProviderChat(info, messages, controller.signal, onDelta);
        if (inserted === 0 && full) {
          elements.editor.setRangeText(full, pos, pos, 'end');
          pos += full.length;
          inserted += full.length;
        }
        flush();
        setStatus(`KI‑Text eingefügt (${inserted} Zeichen)`);
      } catch (err) {
        if (err?.name === 'AbortError') {
          setStatus('KI‑Generierung abgebrochen');
        } else {
          console.error(err);
          setStatus('KI‑Generierung fehlgeschlagen');
          alert('KI‑Generierung fehlgeschlagen: ' + (err?.message || err));
        }
      } finally {
        state.controller = null;
        updateToolbarButton(false);
        updateInlineButtons(false);
      }
    };

    setResetEnabled(false);
    updateToolbarButton(false);
    updateInlineButtons(false);

    return {
      start: () => { if (isRunning()) { abort(); return; } run(); },
      toggle: () => { isRunning() ? abort() : run(); },
      abort,
      reset,
      isRunning,
    };
  }

  function setFileName(name) {
    currentFileName = name || '';
    fileNameEl.textContent = name ? `Datei: ${name}` : '';
    document.title = name ? `${name} — Markdown WebEditor` : 'Markdown WebEditor';
    appTitleEl.textContent = name ? name : 'Markdown WebEditor';
  }

  function markDirty(isDirty = true) {
    dirty = isDirty;
    if (dirty) setStatus('Änderungen nicht gespeichert');
    else setStatus('Gespeichert');
  }

  // Markdown parsing setup
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false,
    highlight: function (code, lang) {
      try {
        if (lang && window.hljs.getLanguage(lang)) {
          return window.hljs.highlight(code, { language: lang }).value;
        }
        return window.hljs.highlightAuto(code).value;
      } catch (_) {
        return code;
      }
    },
  });

  function persistEmbeddedMediaStore() {
    try {
      if (!window.localStorage) return;
      const entries = Array.from(embeddedMediaStore.entries()).map(([id, info]) => ({
        id,
        kind: info?.kind || 'media',
        dataUrl: info?.dataUrl || '',
        name: info?.name || '',
        label: info?.label || '',
      })).filter((entry) => entry.id && entry.dataUrl);
      if (entries.length) {
        window.localStorage.setItem(MEDIA_AUTOSAVE_KEY, JSON.stringify(entries));
      } else {
        window.localStorage.removeItem(MEDIA_AUTOSAVE_KEY);
      }
    } catch (err) {
      console.warn('Eingebettete Medien konnten nicht gespeichert werden', err);
    }
  }

  function loadEmbeddedMediaStore() {
    embeddedMediaStore.clear();
    try {
      if (!window.localStorage) return;
      const raw = window.localStorage.getItem(MEDIA_AUTOSAVE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      parsed.forEach((entry) => {
        if (!entry || typeof entry.id !== 'string' || typeof entry.dataUrl !== 'string') return;
        embeddedMediaStore.set(entry.id, {
          kind: entry.kind || 'media',
          dataUrl: entry.dataUrl,
          name: entry.name || '',
          label: entry.label || '',
        });
      });
    } catch (err) {
      console.warn('Eingebettete Medien konnten nicht geladen werden', err);
      embeddedMediaStore.clear();
    }
  }

  function resetEmbeddedMediaStore() {
    embeddedMediaStore.clear();
    persistEmbeddedMediaStore();
  }

  function generateMediaId(kind = 'media') {
    const prefix = (kind || 'media').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'media';
    let id = '';
    do {
      id = `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
    } while (embeddedMediaStore.has(id));
    return id;
  }

  function detectEmbeddedMediaKind(dataUrl) {
    if (typeof dataUrl !== 'string') return 'media';
    if (dataUrl.startsWith('data:image')) return 'image';
    if (dataUrl.startsWith('data:audio')) return 'audio';
    if (dataUrl.startsWith('data:video')) return 'video';
    return 'media';
  }

  function findEmbeddedMediaByData(dataUrl) {
    if (!dataUrl) return null;
    for (const [id, info] of embeddedMediaStore.entries()) {
      if (info?.dataUrl === dataUrl) {
        return { id, ...info };
      }
    }
    return null;
  }

  function registerEmbeddedMedia(kind, dataUrl, meta = {}) {
    if (!dataUrl) return null;
    const existing = findEmbeddedMediaByData(dataUrl);
    if (existing) return existing;
    const id = generateMediaId(kind);
    const record = {
      kind: kind || 'media',
      dataUrl,
      name: meta?.name || '',
      label: meta?.label || '',
    };
    embeddedMediaStore.set(id, record);
    persistEmbeddedMediaStore();
    return { id, ...record };
  }

  function ensureEmbeddedMedia(kind, dataUrl, meta = {}) {
    const existing = findEmbeddedMediaByData(dataUrl);
    if (existing) return existing;
    return registerEmbeddedMedia(kind || detectEmbeddedMediaKind(dataUrl), dataUrl, meta);
  }

  function resolveMediaPlaceholders(text) {
    if (!text || !embeddedMediaStore.size) return text;
    let output = text;
    embeddedMediaStore.forEach((info, id) => {
      const placeholder = `${MEDIA_PLACEHOLDER_PREFIX}${id}`;
      if (!placeholder || typeof info?.dataUrl !== 'string') return;
      if (output.includes(placeholder)) {
        output = output.split(placeholder).join(info.dataUrl);
      }
    });
    return output;
  }

  function convertDataUrisToPlaceholders(text) {
    if (!text) return { text, changed: false };
    let output = text;
    let changed = false;

    const stripMediaRefAttr = (segment) => (segment || '').replace(/\sdata-media-ref\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');

    output = output.replace(/!\[([^\]]*)\]\((data:[^\s)]+)(\s+"([^"]*)")?\)/gi, (match, alt, dataUrl, titlePart) => {
      const asset = ensureEmbeddedMedia(detectEmbeddedMediaKind(dataUrl) || 'image', dataUrl, { name: alt });
      if (!asset) return match;
      changed = true;
      const title = titlePart ? titlePart : '';
      return `![${alt}](${MEDIA_PLACEHOLDER_PREFIX}${asset.id}${title || ''})`;
    });

    output = output.replace(/<img([^>]*?)src="(data:[^"]+)"([^>]*)>/gi, (match, before, dataUrl, after) => {
      const asset = ensureEmbeddedMedia('image', dataUrl, {});
      if (!asset) return match;
      changed = true;
      const cleanBefore = stripMediaRefAttr(before);
      const cleanAfter = stripMediaRefAttr(after);
      return `<img${cleanBefore}src="${MEDIA_PLACEHOLDER_PREFIX}${asset.id}" data-media-ref="${asset.id}"${cleanAfter}>`;
    });

    output = output.replace(/<(audio|video)([^>]*?)src="(data:[^"]+)"([^>]*)>([\s\S]*?<\/\1>)/gi, (match, tag, before, dataUrl, after, inner) => {
      const asset = ensureEmbeddedMedia(tag === 'audio' ? 'audio' : 'video', dataUrl, {});
      if (!asset) return match;
      changed = true;
      const cleanBefore = stripMediaRefAttr(before);
      const cleanAfter = stripMediaRefAttr(after);
      return `<${tag}${cleanBefore}src="${MEDIA_PLACEHOLDER_PREFIX}${asset.id}" data-media-ref="${asset.id}"${cleanAfter}>${inner}`;
    });

    output = output.replace(/<source([^>]*?)src="(data:[^"]+)"([^>]*)>/gi, (match, before, dataUrl, after) => {
      const asset = ensureEmbeddedMedia(detectEmbeddedMediaKind(dataUrl), dataUrl, {});
      if (!asset) return match;
      changed = true;
      const cleanBefore = stripMediaRefAttr(before);
      const cleanAfter = stripMediaRefAttr(after);
      return `<source${cleanBefore}src="${MEDIA_PLACEHOLDER_PREFIX}${asset.id}" data-media-ref="${asset.id}"${cleanAfter}>`;
    });

    return { text: output, changed };
  }

  function normalizeEditorMedia({ persist = true } = {}) {
    if (!editor) return;
    const current = editor.value || '';
    const { text, changed } = convertDataUrisToPlaceholders(current);
    if (changed) {
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const scrollTop = editor.scrollTop;
      editor.value = text;
      try {
        if (typeof start === 'number' && typeof end === 'number') {
          editor.setSelectionRange(start, end);
        }
        editor.scrollTop = scrollTop;
      } catch {}
    }
    if (persist && changed) {
      persistEmbeddedMediaStore();
    }
  }

  function applyEmbeddedMediaToPreview(container) {
    if (!container || !embeddedMediaStore.size) return;
    const elements = container.querySelectorAll('[src^="' + MEDIA_PLACEHOLDER_PREFIX + '"], [data-media-ref]');
    elements.forEach((node) => {
      if (!(node instanceof Element)) return;
      let ref = node.getAttribute('data-media-ref');
      const src = node.getAttribute('src');
      if (!ref && src && src.startsWith(MEDIA_PLACEHOLDER_PREFIX)) {
        ref = src.slice(MEDIA_PLACEHOLDER_PREFIX.length);
        node.setAttribute('data-media-ref', ref);
      }
      if (!ref) return;
      const asset = embeddedMediaStore.get(ref);
      if (!asset || typeof asset.dataUrl !== 'string') return;
      node.setAttribute('src', asset.dataUrl);
      if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
        node.querySelectorAll('source').forEach((sourceEl) => {
          const sourceSrc = sourceEl.getAttribute('src');
          if (!sourceSrc) return;
          if (sourceSrc.startsWith(MEDIA_PLACEHOLDER_PREFIX)) {
            const sourceId = sourceSrc.slice(MEDIA_PLACEHOLDER_PREFIX.length);
            const sourceAsset = embeddedMediaStore.get(sourceId);
            if (sourceAsset?.dataUrl) {
              sourceEl.setAttribute('src', sourceAsset.dataUrl);
            }
          }
        });
      }
    });
  }

  function getResolvedMarkdown(sourceText = editor?.value || '') {
    return resolveMediaPlaceholders(sourceText || '');
  }

  function updatePreview() {
    const sourceMarkdown = editor.value;
    const resolvedMarkdown = getResolvedMarkdown(sourceMarkdown);
    const html = marked.parse(resolvedMarkdown);
    const safe = DOMPurify.sanitize(html, SANITIZE_MARKDOWN_OPTIONS);
    preview.innerHTML = safe;
    applyEmbeddedMediaToPreview(preview);
    // re-highlight just in case
    preview.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el));
    if (window.mermaid) {
      try {
        const mermaidTheme = getMermaidTheme();
        if (!mermaidConfigured || lastMermaidTheme !== mermaidTheme) {
          window.mermaid.initialize({ startOnLoad: false, theme: mermaidTheme });
          mermaidConfigured = true;
          lastMermaidTheme = mermaidTheme;
        }
        const mermaidBlocks = preview.querySelectorAll('code.language-mermaid');
        mermaidBlocks.forEach((codeEl) => {
          const parentPre = codeEl.closest('pre');
          const container = document.createElement('div');
          container.className = 'mermaid';
          container.textContent = codeEl.textContent;
          if (parentPre) parentPre.replaceWith(container);
          else codeEl.replaceWith(container);
          window.mermaid.init(undefined, container);
        });
      } catch (err) {
        console.warn('Mermaid rendering fehlgeschlagen', err);
      }
    }
    updateReadAloudAvailability();
  }

  // Adjust dynamic layout vars (header/toolbar/status/chat width)
  function adjustLayout() {
    const header = document.querySelector('.app-header');
    const toolbar = document.querySelector('.toolbar');
    const aiBar = document.getElementById('aiInline');
    const statusbar = document.querySelector('.statusbar');
    const hh = header ? header.offsetHeight : 0;
    const thToolbar = toolbar && getComputedStyle(toolbar).display !== 'none' ? toolbar.offsetHeight : 0;
    const thAi = aiBar && getComputedStyle(aiBar).display !== 'none' ? aiBar.offsetHeight : 0;
    const thTotal = thToolbar + thAi;
    const sh = statusbar ? statusbar.offsetHeight : 0;
    document.documentElement.style.setProperty('--header-h', hh + 'px');
    document.documentElement.style.setProperty('--toolbar-only-h', thToolbar + 'px');
    document.documentElement.style.setProperty('--ai-h', thAi + 'px');
    document.documentElement.style.setProperty('--toolbar-total-h', thTotal + 'px');
    document.documentElement.style.setProperty('--status-h', sh + 'px');
    if (chatPanel && !chatPanel.classList.contains('hidden')) {
      const cw = chatPanel.offsetWidth || 0;
      document.documentElement.style.setProperty('--chat-w', cw + 'px');
      document.body.classList.add('chat-open');
    } else {
      document.documentElement.style.setProperty('--chat-w', '0px');
      document.body.classList.remove('chat-open');
    }
    if (versionsPanel && !versionsPanel.classList.contains('hidden')) {
      const vw = versionsPanel.offsetWidth || 0;
      document.documentElement.style.setProperty('--versions-w', vw + 'px');
      document.body.classList.add('versions-open');
    } else {
      document.documentElement.style.setProperty('--versions-w', '0px');
      document.body.classList.remove('versions-open');
    }
  }
  window.addEventListener('resize', adjustLayout);

  function updateCursorInfo() {
    const text = editor.value;
    const pos = editor.selectionStart || 0;
    const lines = text.slice(0, pos).split(/\n/);
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    cursorPosEl.textContent = `Zeile ${line}, Spalte ${col}`;
  }

  function updateWordCount() {
    const text = editor.value;
    const words = (text.match(/[^\s]+/g) || []).length;
    wordCountEl.textContent = `${words} Wörter`;
  }

  function autosave() {
    try {
      localStorage.setItem('md-autosave-content', editor.value);
      localStorage.setItem('md-autosave-date', String(Date.now()));
      persistEmbeddedMediaStore();
    } catch {}
  }

  function loadAutosaveIfAny() {
    try {
      const content = localStorage.getItem('md-autosave-content');
      if (content && !editor.value) {
        editor.value = content;
        normalizeEditorMedia();
        updatePreview();
        updateCursorInfo();
        updateWordCount();
        markDirty(false);
      }
    } catch {}
  }

  // Version history (IndexedDB)
  const VERSION_DB_NAME = 'md-webeditor-versions';
  const VERSION_STORE_NAME = 'snapshots';
  const AUTO_SNAPSHOT_DEFAULT_INTERVAL = 300_000;
  const AUTO_SNAPSHOT_MIN_INTERVAL = 60_000;
  const AUTO_SNAPSHOT_MAX_INTERVAL = 3_600_000;
  const MAX_SNAPSHOTS = 200;
  const versionState = {
    dbPromise: null,
    snapshots: [],
    selectedId: null,
    autoTimer: null,
    lastContentHash: '',
    dmp: typeof diff_match_patch !== 'undefined' ? new diff_match_patch() : null,
    autoIntervalMs: AUTO_SNAPSHOT_DEFAULT_INTERVAL,
  };
  let versionsStatusTimer = null;

  function normalizeAutoSnapshotIntervalMs(value, fallback = AUTO_SNAPSHOT_DEFAULT_INTERVAL) {
    const numeric = Number.parseInt(typeof value === 'string' ? value.trim() : value, 10);
    if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
    return Math.min(Math.max(numeric, AUTO_SNAPSHOT_MIN_INTERVAL), AUTO_SNAPSHOT_MAX_INTERVAL);
  }

  function getStoredAutoSnapshotInterval() {
    const raw = getPrefStr('auto-snapshot-interval', String(AUTO_SNAPSHOT_DEFAULT_INTERVAL));
    return normalizeAutoSnapshotIntervalMs(raw, AUTO_SNAPSHOT_DEFAULT_INTERVAL);
  }

  function msFromMinutes(minutesValue) {
    const numeric = Number(minutesValue);
    if (!Number.isFinite(numeric) || numeric <= 0) return AUTO_SNAPSHOT_DEFAULT_INTERVAL;
    return numeric * 60_000;
  }

  function getAutoSnapshotInterval() {
    const current = Number(versionState.autoIntervalMs);
    if (Number.isFinite(current) && current >= AUTO_SNAPSHOT_MIN_INTERVAL) return current;
    const stored = getStoredAutoSnapshotInterval();
    versionState.autoIntervalMs = stored;
    return stored;
  }

  function formatAutoSnapshotInterval(ms) {
    const minutes = Math.round(ms / 60_000);
    return minutes === 1 ? '1 Minute' : `${minutes} Minuten`;
  }

  function isVersioningSupported() {
    return typeof indexedDB !== 'undefined';
  }

  function computeContentHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return `${text.length}:${hash >>> 0}`;
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
  }

  function formatSnapshotTimestamp(ts) {
    try {
      return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts));
    } catch {
      return new Date(ts).toLocaleString();
    }
  }

  function setVersionsStatus(message, options = {}) {
    if (!versionsStatusEl) return;
    const { sticky = false } = options;
    versionsStatusEl.textContent = message || '';
    if (versionsStatusTimer) {
      clearTimeout(versionsStatusTimer);
      versionsStatusTimer = null;
    }
    if (!sticky && message) {
      versionsStatusTimer = window.setTimeout(() => {
        versionsStatusTimer = null;
        updateVersionStatusSummary();
      }, 4000);
    }
  }

  function updateVersionStatusSummary() {
    if (!versionsStatusEl) return;
    if (!versionState.snapshots.length) {
      versionsStatusEl.textContent = 'Keine Snapshots';
      return;
    }
    const latest = versionState.snapshots[0];
    const total = versionState.snapshots.length;
    const label = total === 1 ? 'Version' : 'Versionen';
    versionsStatusEl.textContent = `${total} ${label} • letzter: ${formatSnapshotTimestamp(latest.createdAt)}`;
  }

  async function openVersionDb() {
    if (!isVersioningSupported()) return null;
    if (versionState.dbPromise) return versionState.dbPromise;
    versionState.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(VERSION_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(VERSION_STORE_NAME)) {
          const store = db.createObjectStore(VERSION_STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          versionState.dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        reject(request.error || new Error('IndexedDB Fehler'));
      };
    }).catch(err => {
      console.error('Versionen: Datenbank konnte nicht geöffnet werden', err);
      versionState.dbPromise = null;
      setVersionsStatus('Versionsspeicher nicht verfügbar', { sticky: true });
      return null;
    });
    return versionState.dbPromise;
  }

  async function fetchSnapshots() {
    const db = await openVersionDb();
    if (!db) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VERSION_STORE_NAME, 'readonly');
      const store = tx.objectStore(VERSION_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const rows = Array.isArray(request.result) ? request.result.slice() : [];
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(rows);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function trimSnapshotOverflow(overflowList) {
    const overflow = Array.isArray(overflowList) ? overflowList.filter(Boolean) : [];
    if (!overflow.length) return;
    const ids = overflow.map(s => s.id).filter(id => typeof id === 'number');
    if (!ids.length) return;
    const db = await openVersionDb();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(VERSION_STORE_NAME, 'readwrite');
      const store = tx.objectStore(VERSION_STORE_NAME);
      ids.forEach(id => { try { store.delete(id); } catch {} });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }).catch(err => console.error('Versionen: Bereinigung fehlgeschlagen', err));
  }

  async function refreshVersionList(preselectId) {
    if (!versionsList || !isVersioningSupported()) return;
    try {
      const snapshots = await fetchSnapshots();
      const mapped = snapshots.map(s => ({
        id: s.id,
        createdAt: s.createdAt || Date.now(),
        content: typeof s.content === 'string' ? s.content : '',
        note: typeof s.note === 'string' ? s.note : '',
        auto: !!s.auto,
        hash: s.hash || computeContentHash(typeof s.content === 'string' ? s.content : ''),
      }));
      let overflow = [];
      if (mapped.length > MAX_SNAPSHOTS) {
        overflow = mapped.slice(MAX_SNAPSHOTS);
        mapped.length = MAX_SNAPSHOTS;
      }
      versionState.snapshots = mapped;
      versionState.lastContentHash = versionState.snapshots[0]?.hash || '';
      if (typeof preselectId === 'number') {
        versionState.selectedId = preselectId;
      } else if (!versionState.snapshots.some(s => s.id === versionState.selectedId)) {
        versionState.selectedId = versionState.snapshots[0]?.id ?? null;
      }
      renderVersionList();
      updateDiffPreview();
      updateVersionStatusSummary();
      await trimSnapshotOverflow(overflow);
    } catch (err) {
      console.error('Versionen konnten nicht geladen werden', err);
      setVersionsStatus('Versionen konnten nicht geladen werden', { sticky: true });
    }
  }

  function renderVersionList() {
    if (!versionsList) return;
    versionsList.innerHTML = '';
    if (versionsEmptyHint) versionsEmptyHint.hidden = versionState.snapshots.length > 0;
    const fragment = document.createDocumentFragment();
    for (const snapshot of versionState.snapshots) {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'versions-entry';
      if (snapshot.id === versionState.selectedId) button.classList.add('active');
      button.dataset.id = String(snapshot.id);
      if (snapshot.auto) button.dataset.auto = 'true';
      const meta = document.createElement('div');
      meta.className = 'version-meta';
      const time = document.createElement('span');
      time.textContent = formatSnapshotTimestamp(snapshot.createdAt);
      meta.appendChild(time);
      if (snapshot.auto) {
        const tag = document.createElement('span');
        tag.className = 'version-tag';
        tag.textContent = 'Auto';
        meta.appendChild(tag);
      }
      button.appendChild(meta);
      const note = document.createElement('div');
      note.className = 'version-note';
      note.textContent = snapshot.note || (snapshot.auto ? 'Automatischer Snapshot' : 'Ohne Notiz');
      button.appendChild(note);
      button.addEventListener('click', () => {
        selectSnapshot(snapshot.id);
      });
      li.appendChild(button);
      fragment.appendChild(li);
    }
    versionsList.appendChild(fragment);
    if (versionsRestoreBtn) versionsRestoreBtn.disabled = !versionState.selectedId;
  }

  function selectSnapshot(id) {
    versionState.selectedId = id;
    renderVersionList();
    updateDiffPreview();
  }

  function diffToHtml(original, current) {
    if (!versionState.dmp) {
      return '<span class="diff-eq">Diff-Vorschau nicht verfügbar.</span>';
    }
    const diffs = versionState.dmp.diff_main(original, current);
    try {
      versionState.dmp.diff_cleanupSemantic(diffs);
    } catch {}
    const parts = diffs.map(([op, text]) => {
      const cls = op === 1 ? 'diff-ins' : (op === -1 ? 'diff-del' : 'diff-eq');
      const safe = escapeHtml(text).replace(/\n/g, '\n');
      return `<span class="diff-line ${cls}">${safe}</span>`;
    });
    return parts.join('').replace(/\n/g, '<br>');
  }

  function updateDiffPreview() {
    if (!versionsDiff || !versionsDiffMeta) return;
    const snapshot = versionState.snapshots.find(s => s.id === versionState.selectedId);
    if (!snapshot) {
      versionsDiff.textContent = 'Keine Version ausgewählt.';
      versionsDiffMeta.textContent = '';
      if (versionsRestoreBtn) versionsRestoreBtn.disabled = true;
      return;
    }
    const currentResolved = getResolvedMarkdown(editor.value || '');
    versionsDiff.innerHTML = diffToHtml(snapshot.content, currentResolved);
    const delta = currentResolved.length - snapshot.content.length;
    const deltaLabel = `${delta >= 0 ? '+' : ''}${delta} Zeichen`;
    versionsDiffMeta.textContent = `${formatSnapshotTimestamp(snapshot.createdAt)}${snapshot.note ? ` • ${snapshot.note}` : ''} • Δ ${deltaLabel}`;
    if (versionsRestoreBtn) versionsRestoreBtn.disabled = false;
  }

  async function createSnapshot(note = '', options = {}) {
    if (!isVersioningSupported() || !editor) return;
    const { auto = false, silent = false } = options;
    const content = getResolvedMarkdown(editor.value || '');
    if (auto && !dirty && !versionState.snapshots.length) return;
    if (!content.trim() && auto) return;
    const hash = computeContentHash(content);
    if (versionState.snapshots.length && versionState.lastContentHash === hash) {
      if (!silent) setVersionsStatus('Keine Änderungen seit dem letzten Snapshot');
      return;
    }
    try {
      const db = await openVersionDb();
      if (!db) return;
      const payload = {
        createdAt: Date.now(),
        content,
        note: note.trim(),
        auto: !!auto,
        hash,
      };
      const id = await new Promise((resolve, reject) => {
        const tx = db.transaction(VERSION_STORE_NAME, 'readwrite');
        const store = tx.objectStore(VERSION_STORE_NAME);
        const req = store.add(payload);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      versionState.lastContentHash = hash;
      await refreshVersionList(typeof id === 'number' ? id : undefined);
      if (!silent) {
        const label = auto ? 'Automatischer Snapshot gespeichert' : 'Snapshot gespeichert';
        setVersionsStatus(label);
        setStatus(`${label} (${formatSnapshotTimestamp(Date.now())})`);
      }
      if (!auto && versionsNoteInput) versionsNoteInput.value = '';
    } catch (err) {
      console.error('Snapshot konnte nicht gespeichert werden', err);
      if (!silent) {
        setVersionsStatus('Snapshot speichern fehlgeschlagen', { sticky: true });
        setStatus('Snapshot speichern fehlgeschlagen');
      }
    }
  }

  async function restoreSelectedSnapshot() {
    if (!editor) return;
    const snapshot = versionState.snapshots.find(s => s.id === versionState.selectedId);
    if (!snapshot) return;
    editor.value = snapshot.content;
    resetEmbeddedMediaStore();
    normalizeEditorMedia();
    updatePreview();
    updateWordCount();
    updateCursorInfo();
    markDirty(true);
    setStatus('Snapshot wiederhergestellt – Änderungen nicht gespeichert');
    setVersionsStatus('Version wiederhergestellt');
    updateDiffPreview();
  }

  function ensureAutoSnapshots() {
    if (!isVersioningSupported()) return;
    if (versionState.autoTimer) {
      window.clearInterval(versionState.autoTimer);
      versionState.autoTimer = null;
    }
    const interval = getAutoSnapshotInterval();
    if (!Number.isFinite(interval) || interval < AUTO_SNAPSHOT_MIN_INTERVAL) return;
    versionState.autoTimer = window.setInterval(() => {
      createSnapshot('', { auto: true, silent: true });
    }, interval);
  }

  function stopAutoSnapshots() {
    if (versionState.autoTimer) {
      window.clearInterval(versionState.autoTimer);
      versionState.autoTimer = null;
    }
  }

  function toggleVersionsPanel(show) {
    if (!versionsPanel || !versionsToggleBtn) return;
    const shouldShow = typeof show === 'boolean' ? show : versionsPanel.classList.contains('hidden');
    if (shouldShow) {
      versionsPanel.classList.remove('hidden');
      if (versionsOverlay) {
        versionsOverlay.classList.remove('hidden');
        versionsOverlay.setAttribute('aria-hidden', 'false');
      }
      versionsPanel.setAttribute('aria-hidden', 'false');
      versionsToggleBtn.setAttribute('aria-pressed', 'true');
      versionsToggleBtn.setAttribute('aria-label', 'Versionen verbergen');
      versionsToggleBtn.title = 'Versionen verbergen';
      document.body.classList.add('versions-open');
      window.setTimeout(() => adjustLayout(), 0);
      refreshVersionList();
    } else {
      versionsPanel.classList.add('hidden');
      if (versionsOverlay) {
        versionsOverlay.classList.add('hidden');
        versionsOverlay.setAttribute('aria-hidden', 'true');
      }
      versionsPanel.setAttribute('aria-hidden', 'true');
      versionsToggleBtn.setAttribute('aria-pressed', 'false');
      versionsToggleBtn.setAttribute('aria-label', 'Versionen anzeigen');
      versionsToggleBtn.title = 'Versionen anzeigen';
      document.body.classList.remove('versions-open');
      window.setTimeout(() => adjustLayout(), 0);
    }
  }

  // Editor context helpers
  const MAX_CONTEXT_CHARS = 20000;
  const MAX_USER_CONTEXT_CHARS = 4000;
  const MAX_USER_CONTEXT_FIELD_CHARS = 1500;
  const USER_CONTEXT_ENABLED_PREF_KEY = 'user-context-enabled';
  const USER_CONTEXT_STORAGE_KEYS = {
    profile: 'user-context-profile',
    style: 'user-context-style',
    audience: 'user-context-audience',
    instructions: 'user-context-instructions',
  };

  function sanitizeUserContext(value, max = MAX_USER_CONTEXT_CHARS) {
    if (value == null) return '';
    let text = String(value);
    text = text.replace(/\r\n?/g, '\n');
    text = text.replace(/[\t ]+/g, ' ');
    text = text.split('\n').map(line => line.trim()).join('\n');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();
    if (text.length > max) {
      text = text.slice(0, max);
    }
    return text;
  }

  function sanitizeUserContextField(value) {
    return sanitizeUserContext(value, MAX_USER_CONTEXT_FIELD_CHARS);
  }

  function sanitizeUserContextParts(parts) {
    return {
      profile: sanitizeUserContextField(parts?.profile || ''),
      style: sanitizeUserContextField(parts?.style || ''),
      audience: sanitizeUserContextField(parts?.audience || ''),
      instructions: sanitizeUserContextField(parts?.instructions || ''),
    };
  }

  function isUserContextEnabled() {
    return getPref(USER_CONTEXT_ENABLED_PREF_KEY, true);
  }

  function readUserContextParts() {
    const parts = sanitizeUserContextParts({
      profile: getPrefStr(USER_CONTEXT_STORAGE_KEYS.profile, ''),
      style: getPrefStr(USER_CONTEXT_STORAGE_KEYS.style, ''),
      audience: getPrefStr(USER_CONTEXT_STORAGE_KEYS.audience, ''),
      instructions: getPrefStr(USER_CONTEXT_STORAGE_KEYS.instructions, ''),
    });
    const hasAny = parts.profile || parts.style || parts.audience || parts.instructions;
    const legacy = sanitizeUserContext(getPrefStr('user-context', ''));
    if (!hasAny && legacy) {
      parts.style = legacy;
      writeUserContextParts(parts);
    }
    return parts;
  }

  function writeUserContextParts(parts) {
    const sanitized = sanitizeUserContextParts(parts || {});
    setPrefStr(USER_CONTEXT_STORAGE_KEYS.profile, sanitized.profile);
    setPrefStr(USER_CONTEXT_STORAGE_KEYS.style, sanitized.style);
    setPrefStr(USER_CONTEXT_STORAGE_KEYS.audience, sanitized.audience);
    setPrefStr(USER_CONTEXT_STORAGE_KEYS.instructions, sanitized.instructions);
    const combined = buildUserContextMessage(sanitized);
    setPrefStr('user-context', combined || '');
    return { combined, parts: sanitized };
  }

  function setUserContextFieldValues(parts) {
    const safe = parts || {};
    if (prefUserContextProfile) prefUserContextProfile.value = safe.profile || '';
    if (prefUserContextStyle) prefUserContextStyle.value = safe.style || '';
    if (prefUserContextAudience) prefUserContextAudience.value = safe.audience || '';
    if (prefUserContextInstructions) prefUserContextInstructions.value = safe.instructions || '';
  }

  function buildUserContextMessage(parts) {
    if (!parts || typeof parts !== 'object') return '';
    const sections = [];
    if (parts.profile) sections.push(`Über mich & Rolle:\n${parts.profile}`);
    if (parts.style) sections.push(`Schreibstil & Ton:\n${parts.style}`);
    if (parts.audience) sections.push(`Zielgruppe oder Empfänger:\n${parts.audience}`);
    if (parts.instructions) sections.push(`Besondere Hinweise:\n${parts.instructions}`);
    const combined = sections.join('\n\n').trim();
    return combined ? sanitizeUserContext(combined, MAX_USER_CONTEXT_CHARS) : '';
  }

  function getUserContext() {
    if (!isUserContextEnabled()) return '';
    const parts = readUserContextParts();
    return buildUserContextMessage(parts);
  }

  function populateUserContextFields() {
    const parts = readUserContextParts();
    setUserContextFieldValues(parts);
  }

  function updateUserContextInputsState() {
    const enabled = !!prefUserContextEnabled?.checked;
    const fields = [
      prefUserContextProfile,
      prefUserContextStyle,
      prefUserContextAudience,
      prefUserContextInstructions,
    ];
    for (const field of fields) {
      if (!field) continue;
      field.disabled = !enabled;
      field.setAttribute('aria-disabled', String(!enabled));
    }
    if (userContextFieldsWrapper) {
      userContextFieldsWrapper.classList.toggle('is-disabled', !enabled);
      if (!enabled) {
        userContextFieldsWrapper.setAttribute('aria-disabled', 'true');
      } else {
        userContextFieldsWrapper.removeAttribute('aria-disabled');
      }
    }
  }

  function syncUserContextEnabledControl() {
    if (prefUserContextEnabled) {
      prefUserContextEnabled.checked = isUserContextEnabled();
    }
    updateUserContextInputsState();
  }

  function readUserContextPartsFromFields() {
    return {
      profile: prefUserContextProfile?.value || '',
      style: prefUserContextStyle?.value || '',
      audience: prefUserContextAudience?.value || '',
      instructions: prefUserContextInstructions?.value || '',
    };
  }

  function getEditorContext() {
    if (!editor) return { text: '', type: 'none', truncated: false };
    const start = editor.selectionStart ?? 0;
    const end = editor.selectionEnd ?? 0;
    const hasSel = end > start;
    const full = editor.value || '';
    const raw = hasSel ? full.slice(start, end) : full;
    let text = raw;
    let truncated = false;
    if (text.length > MAX_CONTEXT_CHARS) {
      text = text.slice(0, MAX_CONTEXT_CHARS);
      truncated = true;
    }
    return { text, type: hasSel ? 'selection' : (full ? 'full' : 'none'), truncated };
  }
  function updateEditorContextInfo() {
    if (!editorContextBtn || !editorContextInfo) return;
    const { type, text, truncated } = getEditorContext();
    const len = text.length;
    // Prefer updating label span to preserve icon
    try {
      const lbl = editorContextBtn.querySelector('.btn-label');
      if (lbl) lbl.textContent = `Editor-Kontext: ${allowEditorContext ? 'EIN' : 'AUS'}`;
      else editorContextBtn.textContent = `Editor-Kontext: ${allowEditorContext ? 'EIN' : 'AUS'}`;
    } catch {
      editorContextBtn.textContent = `Editor-Kontext: ${allowEditorContext ? 'EIN' : 'AUS'}`;
    }
    const label = type === 'selection' ? 'Auswahl' : (type === 'full' ? 'Gesamter Text' : 'Kein Text');
    editorContextInfo.textContent = allowEditorContext ? `${label} (${len} Zeichen)${truncated ? ' – gekürzt' : ''}` : '';
  }

  function getSuggestedName() {
    // Use first H1 or first non-empty line
    const lines = editor.value.split(/\n/);
    for (const l of lines) {
      const m = l.match(/^\s*#\s+(.+)/);
      if (m) return toSafeFileName(m[1].trim()) + '.md';
      if (l.trim()) return toSafeFileName(l.trim()).slice(0, 40) + '.md';
    }
    return 'Unbenannt.md';
  }

  function isDigit(char) {
    return char >= '0' && char <= '9';
  }

  function filterFileNameChars(input) {
    if (!input) return '';
    const normalized = input.normalize('NFKD');
    let result = '';
    for (const char of normalized) {
      if (isLetterLike(char) || isDigit(char) || char === '-' || char === '_' || char === '.' || char === ' ') {
        result += char;
      }
    }
    return result;
  }

  function toSafeFileName(name) {
    return filterFileNameChars(name).replace(/\s+/g, ' ').trim().replace(/\s/g, '-');
  }

  // Toolbar helpers
  function replaceSelection(textarea, before, after, placeholder) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end) || placeholder || '';
    const newText = before + selected + (after ?? '');
    textarea.setRangeText(newText, start, end, 'end');
    textarea.focus();
  }

  function toggleWrapSelection(textarea, wrap) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    const [before, after] = Array.isArray(wrap) ? wrap : [wrap, wrap];
    const hasWrap = selected.startsWith(before) && selected.endsWith(after);
    const content = hasWrap ? selected.slice(before.length, selected.length - after.length) : before + (selected || '') + after;
    textarea.setRangeText(content, start, end, 'end');
    textarea.focus();
  }

  function prefixLines(textarea, prefix) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const pre = value.slice(0, start);
    const sel = value.slice(start, end);
    const post = value.slice(end);
    const selBlock = sel || '';
    const startIdx = pre.lastIndexOf('\n') + 1;
    const endIdx = end + (sel ? 0 : 0);
    const block = value.slice(startIdx, endIdx);
    const lines = (sel ? selBlock : block).split(/\n/);
    const newLines = lines.map((l, i) => prefix + l);
    const newBlock = newLines.join('\n');
    const replaceStart = sel ? start : startIdx;
    const replaceEnd = sel ? end : startIdx + block.length;
    editor.setRangeText(newBlock, replaceStart, replaceEnd, 'end');
    editor.focus();
  }

  function heading(n) {
    const hashes = '#'.repeat(n) + ' ';
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const value = editor.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const endPos = lineEnd === -1 ? value.length : lineEnd;
    const line = value.slice(lineStart, endPos);
    const stripped = line.replace(/^\s*#*\s*/, '');
    const newLine = hashes + stripped;
    editor.setRangeText(newLine, lineStart, endPos, 'end');
    editor.focus();
  }

  function insertCodeBlock() {
    const lang = prompt('Programmiersprache für Code-Block (z.B. js, ts, bash):', '') || '';
    const block = `\n\n\`\`\`${lang}\n$SEL\n\`\`\`\n\n`;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.slice(start, end) || '';
    const text = block.replace('$SEL', selected);
    editor.setRangeText(text, start, end, 'end');
    editor.focus();
  }

  function insertMermaidDiagram() {
    if (!isMermaidDialogReady()) {
      const template = buildMermaidTemplate(MERMAID_DEFAULT_TYPE, { orientation: MERMAID_DEFAULT_ORIENTATION });
      const fenced = `\n\n\`\`\`mermaid\n${template}\n\`\`\`\n\n`;
      insertAtCursor(fenced);
      return;
    }
    mermaidInsertSelection = {
      start: editor.selectionStart,
      end: editor.selectionEnd,
    };
    const selected = editor.value.slice(mermaidInsertSelection.start, mermaidInsertSelection.end);
    const code = extractMermaidCodeFromSelection(selected);
    const metadata = parseMermaidCodeMetadata(code);
    const type = metadata?.type || MERMAID_DEFAULT_TYPE;
    const orientation = metadata?.orientation || MERMAID_DEFAULT_ORIENTATION;
    if (mermaidTypeSelect) {
      mermaidTypeSelect.value = type;
    }
    if (mermaidOrientationSelect) {
      mermaidOrientationSelect.value = orientation;
    }
    updateMermaidOrientationVisibility();
    if (mermaidCodeInput) {
      if (code) {
        mermaidCodeInput.value = normalizeMermaidCode(code);
        mermaidTemplatePristine = false;
      } else {
        mermaidCodeInput.value = buildMermaidTemplate(type, { orientation });
        mermaidTemplatePristine = true;
      }
    }
    loadMermaidBuilderFromCode(type, code);
    if (mermaidCodeInput) {
      window.setTimeout(() => {
        try {
          mermaidCodeInput.focus();
          mermaidCodeInput.select();
        } catch {}
      }, 0);
    }
    lastMermaidType = type;
    lastMermaidOrientation = orientation;
    openMermaidDialog();
    skipToolbarPostAction = true;
    updateMermaidDialogPreview();
  }

  function buildMermaidTemplate(type, options = {}) {
    const orientation = normalizeOrientation(options.orientation || MERMAID_DEFAULT_ORIENTATION);
    switch (type) {
      case 'flowchart': {
        return `flowchart ${orientation}
  Start([Start]) --> Entscheidung{Entscheidung?}
  Entscheidung -->|Ja| Ende([Ende])
  Entscheidung -->|Nein| Alternative([Alternative])
  Alternative --> Ende([Ende])`;
      }
      case 'sequence':
        return `sequenceDiagram
  participant Nutzer
  participant System
  Nutzer->>System: Aktion ausführen
  System-->>Nutzer: Ergebnis zurückgeben
  alt Fehlerfall
    System-->>Nutzer: Fehlermeldung anzeigen
  end`;
      case 'class': {
        const direction = orientationToDirection(orientation);
        return `classDiagram
  direction ${direction}
  class Kunde {
    +id: string
    +name: string
    +bestellen()
  }
  class Bestellung {
    +nummer: string
    +status: Status
    +absenden()
  }
  Kunde --> Bestellung : erstellt`;
      }
      case 'state': {
        const direction = orientationToDirection(orientation);
        return `stateDiagram-v2
  direction ${direction}
  [*] --> Entwurf
  Entwurf --> Review : prüfen
  Review --> Genehmigt : ok
  Review --> Entwurf : überarbeiten
  Genehmigt --> [*]`;
      }
      case 'gantt':
        return `gantt
  dateFormat  YYYY-MM-DD
  title Projektplan
  section Planung
  Kickoff           :done,    d1, 2024-01-01, 3d
  Recherche         :active,  d2, 2024-01-04, 4d
  section Umsetzung
  Entwicklung       :d3, 2024-01-10, 10d
  Tests             :d4, 2024-01-22, 5d`;
      case 'pie':
        return `pie title Marktanteile
  "Produkt A" : 45
  "Produkt B" : 30
  "Produkt C" : 25`;
      default:
        return buildMermaidTemplate('flowchart', { orientation });
    }
  }


  function normalizeMermaidCode(code) {
    return (code || '').replace(/\r\n/g, '\n');
  }

  function extractMermaidCodeFromSelection(selection) {
    if (!selection) return '';
    const trimmed = selection.trim();
    if (!trimmed) return '';
    const fenceMatch = trimmed.match(/^```mermaid\b[\r\n]+([\s\S]*?)```$/i);
    if (fenceMatch) {
      return fenceMatch[1].trim();
    }
    return trimmed;
  }

  function parseMermaidCodeMetadata(code) {
    const trimmed = (code || '').trim();
    if (!trimmed) return null;
    const firstLine = trimmed.split(/\r?\n/).find((line) => line.trim().length > 0);
    if (!firstLine) return null;
    const line = firstLine.trim();
    const lower = line.toLowerCase();
    if (lower.startsWith('flowchart')) {
      const match = line.match(/flowchart\s+([a-z]{2})/i);
      return { type: 'flowchart', orientation: (match ? match[1].toUpperCase() : MERMAID_DEFAULT_ORIENTATION) };
    }
    if (lower.startsWith('graph')) {
      const match = line.match(/graph\s+([a-z]{2})/i);
      return { type: 'flowchart', orientation: (match ? match[1].toUpperCase() : MERMAID_DEFAULT_ORIENTATION) };
    }
    if (lower.startsWith('sequencediagram')) return { type: 'sequence' };
    if (lower.startsWith('classdiagram')) {
      const parsed = parseClassDiagram(trimmed);
      return { type: 'class', orientation: parsed?.orientation };
    }
    if (lower.startsWith('statediagram-v2') || lower.startsWith('statediagram')) {
      const parsed = parseStateDiagram(trimmed);
      return { type: 'state', orientation: parsed?.orientation };
    }
    if (lower.startsWith('gantt')) return { type: 'gantt' };
    if (lower.startsWith('pie')) return { type: 'pie' };
    return null;
  }


  function sanitizeMermaidNodeId(value, fallback) {
    const trimmed = (value || '').trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '');
    return trimmed || fallback;
  }

  function sanitizeMermaidLabel(value, fallback = '') {
    const trimmed = (value || '').replace(/\r\n/g, '\n').trim();
    return trimmed || fallback;
  }

  function sanitizeMermaidEdgeLabel(value) {
    return (value || '').replace(/\|/g, '/').trim();
  }

  function isMermaidDialogReady() {
    return !!(mermaidDialogOverlay && mermaidDialog && mermaidDialogForm && mermaidTypeSelect && mermaidCodeInput);
  }

  function isMermaidFlowchartType(type) {
    return (type || mermaidTypeSelect?.value || MERMAID_DEFAULT_TYPE) === 'flowchart';
  }

  function getSelectedMermaidType() {
    return mermaidTypeSelect?.value || MERMAID_DEFAULT_TYPE;
  }

  function getMermaidBuilder(type) {
    return MERMAID_BUILDERS[type] || null;
  }

  function ensureMermaidBuilderData(type) {
    const builder = getMermaidBuilder(type);
    if (!builder) return null;
    if (!mermaidBuilderState.data.has(type)) {
      mermaidBuilderState.data.set(type, builder.createDefault());
    }
    return mermaidBuilderState.data.get(type);
  }


  function setMermaidBuilderData(type, data) {
    mermaidBuilderState.data.set(type, data);
  }

  function builderSupportsOrientation(type) {
    return !!getMermaidBuilder(type)?.supportsOrientation;
  }

  function setMermaidPreviewMessage(message, { error = false } = {}) {
    if (!mermaidPreviewStatus) return;
    mermaidPreviewStatus.textContent = message;
    mermaidPreviewStatus.classList.toggle('is-error', !!error);
  }

  function updateMermaidDialogPreview() {
    if (!mermaidPreview || !mermaidPreviewStatus) return;
    const code = normalizeMermaidCode(mermaidCodeInput?.value || '').trim();
    if (!code) {
      mermaidPreview.innerHTML = '';
      setMermaidPreviewMessage('Die Vorschau wird angezeigt, sobald gültiger Mermaid-Code vorliegt.', { error: false });
      return;
    }
    if (!window.mermaid) {
      mermaidPreview.innerHTML = '';
      setMermaidPreviewMessage('Mermaid konnte nicht geladen werden. Bitte Internetverbindung prüfen.', { error: true });
      return;
    }
    try {
      const theme = getMermaidTheme();
      if (!mermaidConfigured || lastMermaidTheme !== theme) {
        window.mermaid.initialize({ startOnLoad: false, theme });
        mermaidConfigured = true;
        lastMermaidTheme = theme;
      }
      const container = document.createElement('div');
      container.className = 'mermaid';
      container.textContent = code;
      mermaidPreview.innerHTML = '';
      mermaidPreview.appendChild(container);
      window.mermaid.init(undefined, container);
      setMermaidPreviewMessage('Live-Vorschau aktualisiert.', { error: false });
    } catch (err) {
      console.warn('Mermaid Vorschau fehlgeschlagen', err);
      mermaidPreview.innerHTML = '';
      setMermaidPreviewMessage('Vorschau konnte nicht gerendert werden. Bitte prüfe den Code.', { error: true });
    }
  }

  function setMermaidBuilderUI(enabled) {
    const type = getSelectedMermaidType();
    const hasBuilder = !!getMermaidBuilder(type);
    const isActive = enabled && hasBuilder;
    mermaidBuilderState.enabled = isActive;
    mermaidBuilderState.type = type;
    if (mermaidBuilderEnabled) {
      mermaidBuilderEnabled.checked = isActive;
      mermaidBuilderEnabled.disabled = !hasBuilder;
    }
    if (mermaidBuilderContent) {
      mermaidBuilderContent.classList.toggle('builder-disabled', !isActive);
      mermaidBuilderContent.setAttribute('aria-disabled', isActive ? 'false' : 'true');
    }
    if (mermaidCodeInput) {
      mermaidCodeInput.readOnly = isActive;
      mermaidCodeInput.classList.toggle('read-only', isActive);
    }
    if (mermaidCodeHint) mermaidCodeHint.hidden = !isActive;
  }

  function renderMermaidBuilder() {
    if (!mermaidBuilder) return;
    const type = getSelectedMermaidType();
    const builder = getMermaidBuilder(type);
    if (!builder) {
      mermaidBuilder.classList.add('hidden');
      return;
    }
    mermaidBuilder.classList.remove('hidden');
    if (!mermaidBuilderContent) return;
    mermaidBuilderContent.innerHTML = '';
    if (!mermaidBuilderState.enabled) {
      const hint = document.createElement('p');
      hint.className = 'muted';
      hint.textContent = 'Aktiviere den grafischen Editor, um die Diagrammteile anzupassen.';
      mermaidBuilderContent.appendChild(hint);
      return;
    }
    const data = ensureMermaidBuilderData(type);
    if (!data) return;
    if (builderSupportsOrientation(type)) {
      data.orientation = normalizeOrientation(data.orientation || mermaidOrientationSelect?.value || MERMAID_DEFAULT_ORIENTATION);
      if (mermaidOrientationSelect) {
        mermaidOrientationSelect.value = data.orientation;
        lastMermaidOrientation = data.orientation;
      }
    }
    const helpers = {
      createSection(title, description) {
        return createBuilderSection(mermaidBuilderContent, title, description);
      },
      createTable(headers) {
        return createBuilderTable(headers);
      },
      createIconButton,
      sync: () => syncBuilderOutputs(),
      rerender: () => renderMermaidBuilder(),
    };
    builder.render({ container: mermaidBuilderContent, data, helpers });
  }

  function syncBuilderOutputs() {
    if (!mermaidBuilderState.enabled) {
      updateMermaidDialogPreview();
      return;
    }
    const type = mermaidBuilderState.type;
    const builder = getMermaidBuilder(type);
    const data = ensureMermaidBuilderData(type);
    if (!builder || !data || !mermaidCodeInput) return;
    try {
      const code = builder.generate(data);
      mermaidBuilderSyncing = true;
      mermaidCodeInput.value = code;
      mermaidTemplatePristine = true;
      mermaidBuilderSyncing = false;
      updateMermaidDialogPreview();
    } catch (err) {
      mermaidBuilderSyncing = false;
      console.warn('Mermaid-Builder konnte den Code nicht erzeugen', err);
    }
  }

  function setMermaidBuilderEnabled(enabled, options = {}) {
    const type = getSelectedMermaidType();
    const builder = getMermaidBuilder(type);
    if (!builder) {
      mermaidBuilderState.enabled = false;
      setMermaidBuilderUI(false);
      if (mermaidBuilderContent) mermaidBuilderContent.innerHTML = '';
      return;
    }
    const shouldEnable = !!enabled;
    setMermaidBuilderUI(shouldEnable);
    if (shouldEnable) {
      const { reset = false } = options;
      if (reset || !mermaidBuilderState.data.has(type)) {
        setMermaidBuilderData(type, builder.createDefault());
      }
      if (builderSupportsOrientation(type)) {
        const data = ensureMermaidBuilderData(type);
        const orientation = normalizeOrientation(data?.orientation || mermaidOrientationSelect?.value || MERMAID_DEFAULT_ORIENTATION);
        data.orientation = orientation;
        if (mermaidOrientationSelect) {
          mermaidOrientationSelect.value = orientation;
        }
        lastMermaidOrientation = orientation;
      }
    }
    renderMermaidBuilder();
    if (shouldEnable) {
      syncBuilderOutputs();
    } else {
      updateMermaidDialogPreview();
    }
  }

  function syncMermaidBuilderAvailability(type) {
    const builder = getMermaidBuilder(type);
    if (!builder) {
      if (mermaidBuilderEnabled) {
        mermaidBuilderEnabled.checked = false;
        mermaidBuilderEnabled.disabled = true;
      }
      mermaidBuilderState.enabled = false;
      if (mermaidBuilderContent) mermaidBuilderContent.innerHTML = '';
      if (mermaidBuilder) mermaidBuilder.classList.add('hidden');
      return;
    }
    if (mermaidBuilder) mermaidBuilder.classList.remove('hidden');
    if (mermaidBuilderEnabled) {
      mermaidBuilderEnabled.disabled = false;
      mermaidBuilderEnabled.checked = mermaidBuilderState.enabled;
    }
    mermaidBuilderState.type = type;
    renderMermaidBuilder();
    if (mermaidBuilderState.enabled) {
      syncBuilderOutputs();
    }
  }

  function loadMermaidBuilderFromCode(type, code) {
    const builder = getMermaidBuilder(type);
    syncMermaidBuilderAvailability(type);
    if (!builder) return;
    const parsed = builder.parse(code);
    if (parsed) {
      setMermaidBuilderData(type, parsed);
      if (typeof builder.afterParse === 'function') {
        builder.afterParse(parsed);
      }
      if (builderSupportsOrientation(type)) {
        const orientation = normalizeOrientation(parsed.orientation);
        if (orientation) {
          lastMermaidOrientation = orientation;
          if (mermaidOrientationSelect) mermaidOrientationSelect.value = orientation;
        }
      }
      if (mermaidBuilderState.enabled) {
        renderMermaidBuilder();
        syncBuilderOutputs();
      }
    } else if (mermaidBuilderState.enabled) {
      setMermaidBuilderEnabled(false);
    }
  }

  const MERMAID_BUILDERS = {
    flowchart: createFlowchartBuilder(),
    sequence: createSequenceBuilder(),
    class: createClassBuilder(),
    state: createStateBuilder(),
    gantt: createGanttBuilder(),
    pie: createPieBuilder(),
  };

  const ORIENTATION_VALUES = ['TD', 'LR', 'BT', 'RL'];

  function normalizeOrientation(value) {
    const upper = (value || '').toUpperCase();
    return ORIENTATION_VALUES.includes(upper) ? upper : MERMAID_DEFAULT_ORIENTATION;
  }

  function orientationToDirection(value) {
    switch (normalizeOrientation(value)) {
      case 'LR':
      case 'RL':
      case 'BT':
        return normalizeOrientation(value);
      case 'TD':
      default:
        return 'TB';
    }
  }

  function directionToOrientation(value) {
    const upper = (value || '').toUpperCase();
    switch (upper) {
      case 'LR':
      case 'RL':
      case 'BT':
        return upper;
      case 'TB':
      case 'TD':
      default:
        return 'TD';
    }
  }

  function createFlowchartBuilder() {
    return {
      supportsOrientation: true,
      createDefault: createFlowchartDefaultData,
      parse(code) {
        const parsed = parseFlowchartCode(code);
        if (!parsed) return null;
        return {
          orientation: normalizeOrientation(parsed.orientation),
          nodes: (parsed.nodes.length ? parsed.nodes : createFlowchartDefaultData().nodes).map((node, index) => ({
            id: node.id || `Knoten${index + 1}`,
            label: node.label || node.id || `Knoten ${index + 1}`,
            shape: node.shape || 'rectangle',
          })),
          edges: parsed.edges.map((edge) => ({
            from: edge.from || '',
            to: edge.to || '',
            label: edge.label || '',
          })),
        };
      },
      afterParse(data) {
        if (mermaidOrientationSelect && data?.orientation) {
          mermaidOrientationSelect.value = normalizeOrientation(data.orientation);
          lastMermaidOrientation = normalizeOrientation(data.orientation);
        }
      },
      generate: generateFlowchartCode,
      render({ data, helpers }) {
        const { createSection, createTable, createIconButton, sync, rerender } = helpers;
        data.orientation = normalizeOrientation(data.orientation || MERMAID_DEFAULT_ORIENTATION);
        if (mermaidOrientationSelect) {
          mermaidOrientationSelect.value = data.orientation;
          lastMermaidOrientation = data.orientation;
        }

        const nodesSection = createSection('Knoten');
        const addNodeBtn = createIconButton({
          label: 'Knoten',
          icon: 'lucide:plus',
          onClick() {
            const nextId = ensureUniqueNodeId(data.nodes, `Knoten${data.nodes.length + 1}`);
            data.nodes.push({ id: nextId, label: `Schritt ${data.nodes.length + 1}`, shape: 'rectangle' });
            rerender();
            sync();
          },
        });
        nodesSection.header.appendChild(addNodeBtn);
        const nodesTable = createTable(['ID', 'Beschriftung', 'Form', 'Aktion']);
        data.nodes.forEach((node, index) => {
          const row = document.createElement('tr');

          const idCell = document.createElement('td');
          const idInput = document.createElement('input');
          idInput.type = 'text';
          idInput.value = node.id;
          idInput.placeholder = 'ID';
          idInput.addEventListener('blur', () => {
            const next = ensureBuilderNodeId(idInput.value, `Knoten${index + 1}`);
            if (next !== node.id) {
              renameFlowchartReferences(data, node.id, next);
            }
            node.id = next;
            sync();
            rerender();
          });
          idInput.addEventListener('input', () => {
            node.id = sanitizeMermaidNodeId(idInput.value, '');
          });
          idCell.appendChild(idInput);
          row.appendChild(idCell);

          const labelCell = document.createElement('td');
          const labelInput = document.createElement('input');
          labelInput.type = 'text';
          labelInput.value = node.label;
          labelInput.placeholder = 'Anzeigename';
          labelInput.addEventListener('input', () => {
            node.label = labelInput.value;
          });
          labelInput.addEventListener('blur', () => {
            node.label = sanitizeMermaidLabel(labelInput.value, node.id);
            sync();
          });
          labelCell.appendChild(labelInput);
          row.appendChild(labelCell);

          const shapeCell = document.createElement('td');
          const shapeSelect = document.createElement('select');
          MERMAID_NODE_SHAPES.forEach((shape) => {
            const option = document.createElement('option');
            option.value = shape.value;
            option.textContent = shape.label;
            if (shape.value === node.shape) option.selected = true;
            shapeSelect.appendChild(option);
          });
          shapeSelect.addEventListener('change', () => {
            node.shape = shapeSelect.value;
            sync();
          });
          shapeCell.appendChild(shapeSelect);
          row.appendChild(shapeCell);

          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions';
          const removeBtn = createIconButton({
            label: 'Entfernen',
            icon: 'lucide:trash-2',
            className: 'icon-only',
            onClick() {
              if (data.nodes.length <= 1) return;
              const removedId = node.id;
              data.nodes.splice(index, 1);
              data.edges = data.edges.filter((edge) => edge.from !== removedId && edge.to !== removedId);
              rerender();
              sync();
            },
          });
          actionsCell.appendChild(removeBtn);
          row.appendChild(actionsCell);

          nodesTable.tbody.appendChild(row);
        });
        nodesSection.section.appendChild(nodesTable.wrapper);

        const edgesSection = createSection('Verbindungen');
        const addEdgeBtn = createIconButton({
          label: 'Verbindung',
          icon: 'lucide:plus',
          onClick() {
            const from = data.nodes[0]?.id || '';
            const to = data.nodes[data.nodes.length - 1]?.id || '';
            data.edges.push({ from, to, label: '' });
            rerender();
            sync();
          },
        });
        edgesSection.header.appendChild(addEdgeBtn);
        const edgesTable = createTable(['Von', 'Beschriftung', 'Nach', 'Aktion']);
        data.edges.forEach((edge, index) => {
          const row = document.createElement('tr');

          const fromCell = document.createElement('td');
          const fromInput = document.createElement('input');
          fromInput.type = 'text';
          fromInput.value = edge.from;
          fromInput.placeholder = 'Start';
          fromInput.setAttribute('list', 'mermaidNodeIdOptions');
          fromInput.addEventListener('blur', () => {
            edge.from = sanitizeMermaidNodeId(fromInput.value, '');
            sync();
          });
          fromInput.addEventListener('input', () => {
            edge.from = sanitizeMermaidNodeId(fromInput.value, '');
          });
          fromCell.appendChild(fromInput);
          row.appendChild(fromCell);

          const labelCell = document.createElement('td');
          const labelInput = document.createElement('input');
          labelInput.type = 'text';
          labelInput.value = edge.label;
          labelInput.placeholder = 'Beschriftung';
          labelInput.addEventListener('input', () => {
            edge.label = labelInput.value;
          });
          labelInput.addEventListener('blur', () => {
            edge.label = sanitizeMermaidEdgeLabel(labelInput.value);
            sync();
          });
          labelCell.appendChild(labelInput);
          row.appendChild(labelCell);

          const toCell = document.createElement('td');
          const toInput = document.createElement('input');
          toInput.type = 'text';
          toInput.value = edge.to;
          toInput.placeholder = 'Ziel';
          toInput.setAttribute('list', 'mermaidNodeIdOptions');
          toInput.addEventListener('blur', () => {
            edge.to = sanitizeMermaidNodeId(toInput.value, '');
            sync();
          });
          toInput.addEventListener('input', () => {
            edge.to = sanitizeMermaidNodeId(toInput.value, '');
          });
          toCell.appendChild(toInput);
          row.appendChild(toCell);

          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions';
          const removeBtn = createIconButton({
            label: 'Entfernen',
            icon: 'lucide:trash-2',
            className: 'icon-only',
            onClick() {
              data.edges.splice(index, 1);
              rerender();
              sync();
            },
          });
          actionsCell.appendChild(removeBtn);
          row.appendChild(actionsCell);

          edgesTable.tbody.appendChild(row);
        });
        edgesSection.section.appendChild(edgesTable.wrapper);

        fillDatalist(mermaidNodeIdOptions, data.nodes.map((node) => node.id));
      },
    };
  }

  function createSequenceBuilder() {
    return {
      supportsOrientation: false,
      createDefault: createSequenceDefaultData,
      parse: parseSequenceDiagram,
      generate: generateSequenceDiagram,
      render({ data, helpers }) {
        const { createSection, createTable, createIconButton, sync, rerender } = helpers;

        const participantsSection = createSection('Teilnehmer');
        const addParticipantBtn = createIconButton({
          label: 'Teilnehmer',
          icon: 'lucide:plus',
          onClick() {
            const base = `Teilnehmer${data.participants.length + 1}`;
            const id = sanitizeMermaidNodeId(base, base);
            data.participants.push({ id, label: base });
            rerender();
            sync();
          },
        });
        participantsSection.header.appendChild(addParticipantBtn);
        const participantsTable = createTable(['ID', 'Beschriftung', 'Aktion']);
        data.participants.forEach((participant, index) => {
          const row = document.createElement('tr');
          const idCell = document.createElement('td');
          const idInput = document.createElement('input');
          idInput.type = 'text';
          idInput.value = participant.id;
          idInput.placeholder = 'ID';
          idInput.addEventListener('blur', () => {
            const previous = participant.id;
            const next = sanitizeMermaidNodeId(idInput.value, `Teilnehmer${index + 1}`);
            participant.id = next;
            if (previous !== next) {
              data.messages = data.messages.map((message) => ({
                from: message.from === previous ? next : message.from,
                to: message.to === previous ? next : message.to,
                arrow: message.arrow,
                text: message.text,
              }));
            }
            sync();
            rerender();
          });
          idInput.addEventListener('input', () => {
            participant.id = sanitizeMermaidNodeId(idInput.value, participant.id);
          });
          idCell.appendChild(idInput);
          row.appendChild(idCell);

          const labelCell = document.createElement('td');
          const labelInput = document.createElement('input');
          labelInput.type = 'text';
          labelInput.value = participant.label || '';
          labelInput.placeholder = 'Anzeigename';
          labelInput.addEventListener('input', () => {
            participant.label = labelInput.value;
          });
          labelCell.appendChild(labelInput);
          row.appendChild(labelCell);

          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions';
          const removeBtn = createIconButton({
            label: 'Entfernen',
            icon: 'lucide:trash-2',
            className: 'icon-only',
            onClick() {
              const removedId = participant.id;
              data.participants.splice(index, 1);
              data.messages = data.messages.filter((msg) => msg.from !== removedId && msg.to !== removedId);
              rerender();
              sync();
            },
          });
          actionsCell.appendChild(removeBtn);
          row.appendChild(actionsCell);

          participantsTable.tbody.appendChild(row);
        });
        participantsSection.section.appendChild(participantsTable.wrapper);

        const messageSection = createSection('Nachrichten');
        const addMessageBtn = createIconButton({
          label: 'Nachricht',
          icon: 'lucide:plus',
          onClick() {
            const first = data.participants[0]?.id || '';
            const second = data.participants[1]?.id || first;
            data.messages.push({ from: first, arrow: SEQUENCE_ARROW_TYPES[0], to: second, text: '' });
            rerender();
            sync();
          },
        });
        messageSection.header.appendChild(addMessageBtn);
        const messageTable = createTable(['Von', 'Pfeil', 'Nach', 'Text', 'Aktion']);

        const participantIds = data.participants.map((p) => p.id);
        data.messages.forEach((message, index) => {
          const row = document.createElement('tr');

          const fromCell = document.createElement('td');
          const fromSelect = document.createElement('select');
          participantIds.forEach((id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id || '—';
            fromSelect.appendChild(option);
          });
          const fromFallback = document.createElement('option');
          fromFallback.value = '';
          fromFallback.textContent = '—';
          fromSelect.appendChild(fromFallback);
          fromSelect.value = participantIds.includes(message.from) ? message.from : '';
          fromSelect.addEventListener('change', () => {
            message.from = sanitizeMermaidNodeId(fromSelect.value, '');
            sync();
          });
          fromCell.appendChild(fromSelect);
          row.appendChild(fromCell);

          const arrowCell = document.createElement('td');
          const arrowSelect = document.createElement('select');
          SEQUENCE_ARROW_TYPES.forEach((arrow) => {
            const option = document.createElement('option');
            option.value = arrow;
            option.textContent = arrow;
            arrowSelect.appendChild(option);
          });
          arrowSelect.value = message.arrow || SEQUENCE_ARROW_TYPES[0];
          arrowSelect.addEventListener('change', () => {
            message.arrow = arrowSelect.value;
            sync();
          });
          arrowCell.appendChild(arrowSelect);
          row.appendChild(arrowCell);

          const toCell = document.createElement('td');
          const toSelect = document.createElement('select');
          participantIds.forEach((id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id || '—';
            toSelect.appendChild(option);
          });
          const toFallback = document.createElement('option');
          toFallback.value = '';
          toFallback.textContent = '—';
          toSelect.appendChild(toFallback);
          toSelect.value = participantIds.includes(message.to) ? message.to : '';
          toSelect.addEventListener('change', () => {
            message.to = sanitizeMermaidNodeId(toSelect.value, '');
            sync();
          });
          toCell.appendChild(toSelect);
          row.appendChild(toCell);

          const textCell = document.createElement('td');
          const textInput = document.createElement('input');
          textInput.type = 'text';
          textInput.value = message.text || '';
          textInput.placeholder = 'Text';
          textInput.addEventListener('input', () => {
            message.text = textInput.value;
            sync();
          });
          textCell.appendChild(textInput);
          row.appendChild(textCell);

          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions';
          const removeBtn = createIconButton({
            label: 'Entfernen',
            icon: 'lucide:trash-2',
            className: 'icon-only',
            onClick() {
              data.messages.splice(index, 1);
              rerender();
              sync();
            },
          });
          actionsCell.appendChild(removeBtn);
          row.appendChild(actionsCell);

          messageTable.tbody.appendChild(row);
        });
        messageSection.section.appendChild(messageTable.wrapper);
      },
    };
  }

  function createClassBuilder() {
    return {
      supportsOrientation: true,
      createDefault: createClassDefaultData,
      parse: parseClassDiagram,
      generate: generateClassDiagram,
      render({ data, helpers }) {
        const { createSection, createTable, createIconButton, sync, rerender } = helpers;
        data.orientation = normalizeOrientation(data.orientation || MERMAID_DEFAULT_ORIENTATION);
        if (mermaidOrientationSelect) {
          mermaidOrientationSelect.value = data.orientation;
          lastMermaidOrientation = data.orientation;
        }

        const classesSection = createSection('Klassen', 'Mitglieder je Zeile.');
        const addClassBtn = createIconButton({
          label: 'Klasse',
          icon: 'lucide:plus',
          onClick() {
            const base = `Klasse${data.classes.length + 1}`;
            const name = sanitizeMermaidNodeId(base, base);
            data.classes.push({ name, members: [] });
            rerender();
            sync();
          },
        });
        classesSection.header.appendChild(addClassBtn);
        const classesTable = createTable(['Name', 'Mitglieder', 'Aktion']);
        data.classes.forEach((cls, index) => {
          const row = document.createElement('tr');

          const nameCell = document.createElement('td');
          const nameInput = document.createElement('input');
          nameInput.type = 'text';
          nameInput.value = cls.name || '';
          nameInput.placeholder = 'Klassenname';
          nameInput.addEventListener('blur', () => {
            const previous = cls.name;
            const next = sanitizeMermaidNodeId(nameInput.value, `Klasse${index + 1}`);
            cls.name = next;
            if (previous !== next) {
              data.relations = data.relations.map((rel) => ({
                from: rel.from === previous ? next : rel.from,
                to: rel.to === previous ? next : rel.to,
                type: rel.type,
                label: rel.label,
              }));
            }
            sync();
            rerender();
          });
          nameInput.addEventListener('input', () => {
            cls.name = sanitizeMermaidNodeId(nameInput.value, cls.name);
          });
          nameCell.appendChild(nameInput);
          row.appendChild(nameCell);

          const membersCell = document.createElement('td');
          const membersTextarea = document.createElement('textarea');
          membersTextarea.value = (cls.members || []).join('\n');
          membersTextarea.placeholder = '+eigenschaft: Typ';
          membersTextarea.addEventListener('input', () => {
            cls.members = membersTextarea.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
            sync();
          });
          membersCell.appendChild(membersTextarea);
          row.appendChild(membersCell);

          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions';
          const removeBtn = createIconButton({
            label: 'Entfernen',
            icon: 'lucide:trash-2',
            className: 'icon-only',
            onClick() {
              const removed = cls.name;
              data.classes.splice(index, 1);
              data.relations = data.relations.filter((rel) => rel.from !== removed && rel.to !== removed);
              rerender();
              sync();
            },
          });
          actionsCell.appendChild(removeBtn);
          row.appendChild(actionsCell);

          classesTable.tbody.appendChild(row);
        });
        classesSection.section.appendChild(classesTable.wrapper);

        const relationsSection = createSection('Beziehungen');
        const addRelationBtn = createIconButton({
          label: 'Beziehung',
          icon: 'lucide:plus',
          onClick() {
            const from = data.classes[0]?.name || '';
            const to = data.classes[1]?.name || from;
            data.relations.push({ from, type: CLASS_RELATION_TYPES[0], to, label: '' });
            rerender();
            sync();
          },
        });
        relationsSection.header.appendChild(addRelationBtn);
        const relationsTable = createTable(['Von', 'Typ', 'Nach', 'Beschriftung', 'Aktion']);
        const classNames = data.classes.map((cls) => cls.name);
        data.relations.forEach((rel, index) => {
          const row = document.createElement('tr');

          const fromCell = document.createElement('td');
          const fromSelect = document.createElement('select');
          classNames.forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            fromSelect.appendChild(option);
          });
          const fromFallback = document.createElement('option');
          fromFallback.value = '';
          fromFallback.textContent = '—';
          fromSelect.appendChild(fromFallback);
          fromSelect.value = classNames.includes(rel.from) ? rel.from : '';
          fromSelect.addEventListener('change', () => {
            rel.from = sanitizeMermaidNodeId(fromSelect.value, '');
            sync();
          });
          fromCell.appendChild(fromSelect);
          row.appendChild(fromCell);

          const typeCell = document.createElement('td');
          const typeSelect = document.createElement('select');
          CLASS_RELATION_TYPES.forEach((type) => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
          });
          typeSelect.value = CLASS_RELATION_TYPES.includes(rel.type) ? rel.type : CLASS_RELATION_TYPES[0];
          typeSelect.addEventListener('change', () => {
            rel.type = typeSelect.value;
            sync();
          });
          typeCell.appendChild(typeSelect);
          row.appendChild(typeCell);

          const toCell = document.createElement('td');
          const toSelect = document.createElement('select');
          classNames.forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            toSelect.appendChild(option);
          });
          const toFallback = document.createElement('option');
          toFallback.value = '';
          toFallback.textContent = '—';
          toSelect.appendChild(toFallback);
          toSelect.value = classNames.includes(rel.to) ? rel.to : '';
          toSelect.addEventListener('change', () => {
            rel.to = sanitizeMermaidNodeId(toSelect.value, '');
            sync();
          });
          toCell.appendChild(toSelect);
          row.appendChild(toCell);

          const labelCell = document.createElement('td');
          const labelInput = document.createElement('input');
          labelInput.type = 'text';
          labelInput.value = rel.label || '';
          labelInput.placeholder = 'Beschriftung';
          labelInput.addEventListener('input', () => {
            rel.label = labelInput.value;
            sync();
          });
          labelCell.appendChild(labelInput);
          row.appendChild(labelCell);

          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions';
          const removeBtn = createIconButton({
            label: 'Entfernen',
            icon: 'lucide:trash-2',
            className: 'icon-only',
            onClick() {
              data.relations.splice(index, 1);
              rerender();
              sync();
            },
          });
          actionsCell.appendChild(removeBtn);
          row.appendChild(actionsCell);

          relationsTable.tbody.appendChild(row);
        });
        relationsSection.section.appendChild(relationsTable.wrapper);
      },
    };
  }

  function createStateBuilder() {
    return {
      supportsOrientation: true,
      createDefault: createStateDefaultData,
      parse: parseStateDiagram,
      generate: generateStateDiagram,
      render({ data, helpers }) {
        const { createSection, createTable, createIconButton, sync, rerender } = helpers;
        data.orientation = normalizeOrientation(data.orientation || MERMAID_DEFAULT_ORIENTATION);
        if (mermaidOrientationSelect) {
          mermaidOrientationSelect.value = data.orientation;
          lastMermaidOrientation = data.orientation;
        }

        const allStateNames = () => {
          const unique = new Set();
          if (data.initial) unique.add(data.initial);
          (data.states || []).forEach((state) => unique.add(state));
          (data.finals || []).forEach((state) => unique.add(state));
          return Array.from(unique);
        };

        const initialSection = createSection('Startzustand');
        const initialInput = document.createElement('input');
        initialInput.type = 'text';
        initialInput.value = data.initial || '';
        initialInput.placeholder = 'Start';
        initialInput.addEventListener('input', () => {
          data.initial = sanitizeMermaidNodeId(initialInput.value, '');
          sync();
        });
        initialSection.section.appendChild(initialInput);

        const statesSection = createSection('Zustände');
        const addStateBtn = createIconButton({
          label: 'Zustand',
          icon: 'lucide:plus',
          onClick() {
            const base = `State${(data.states || []).length + 1}`;
            const id = sanitizeMermaidNodeId(base, base);
            data.states = data.states || [];
            data.states.push(id);
            rerender();
            sync();
          },
        });
        statesSection.header.appendChild(addStateBtn);
        const statesTable = createTable(['Name', 'Aktion']);
        (data.states || []).forEach((state, index) => {
          const row = document.createElement('tr');
          const nameCell = document.createElement('td');
          const nameInput = document.createElement('input');
          nameInput.type = 'text';
          nameInput.value = state;
          nameInput.placeholder = 'Zustand';
          nameInput.addEventListener('blur', () => {
            const previous = state;
            const next = sanitizeMermaidNodeId(nameInput.value, `State${index + 1}`);
            data.states[index] = next;
            if (previous !== next) {
              data.transitions = (data.transitions || []).map((tr) => ({
                from: tr.from === previous ? next : tr.from,
                to: tr.to === previous ? next : tr.to,
                label: tr.label,
              }));
              data.finals = (data.finals || []).map((final) => (final === previous ? next : final));
              if (data.initial === previous) data.initial = next;
            }
            sync();
            rerender();
          });
          nameCell.appendChild(nameInput);
          row.appendChild(nameCell);

          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions';
          const removeBtn = createIconButton({
            label: 'Entfernen',
            icon: 'lucide:trash-2',
            className: 'icon-only',
            onClick() {
              const removed = data.states[index];
              data.states.splice(index, 1);
              data.transitions = (data.transitions || []).filter((tr) => tr.from !== removed && tr.to !== removed);
              data.finals = (data.finals || []).filter((final) => final !== removed);
              if (data.initial === removed) data.initial = '';
              rerender();
              sync();
            },
          });
          actionsCell.appendChild(removeBtn);
          row.appendChild(actionsCell);

          statesTable.tbody.appendChild(row);
        });
        statesSection.section.appendChild(statesTable.wrapper);

        const finalsSection = createSection('Endzustände');
        const addFinalBtn = createIconButton({
          label: 'Endzustand',
          icon: 'lucide:plus',
          onClick() {
            const base = `End${(data.finals || []).length + 1}`;
            const id = sanitizeMermaidNodeId(base, base);
            data.finals = data.finals || [];
            data.finals.push(id);
            rerender();
            sync();
          },
        });
        finalsSection.header.appendChild(addFinalBtn);
        const finalsTable = createTable(['Name', 'Aktion']);
        (data.finals || []).forEach((finalState, index) => {
          const row = document.createElement('tr');
          const nameCell = document.createElement('td');
          const nameInput = document.createElement('input');
          nameInput.type = 'text';
          nameInput.value = finalState;
          nameInput.placeholder = 'Endzustand';
          nameInput.addEventListener('blur', () => {
            const previous = finalState;
            const next = sanitizeMermaidNodeId(nameInput.value, `End${index + 1}`);
            data.finals[index] = next;
            data.transitions = (data.transitions || []).map((tr) => ({
              from: tr.from === previous ? next : tr.from,
              to: tr.to === previous ? next : tr.to,
              label: tr.label,
            }));
            sync();
            rerender();
          });
          nameCell.appendChild(nameInput);
          row.appendChild(nameCell);

          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions';
          const removeBtn = createIconButton({
            label: 'Entfernen',
            icon: 'lucide:trash-2',
            className: 'icon-only',
            onClick() {
              const removed = data.finals[index];
              data.finals.splice(index, 1);
              data.transitions = (data.transitions || []).filter((tr) => tr.from !== removed && tr.to !== removed);
              rerender();
              sync();
            },
          });
          actionsCell.appendChild(removeBtn);
          row.appendChild(actionsCell);

          finalsTable.tbody.appendChild(row);
        });
        finalsSection.section.appendChild(finalsTable.wrapper);

        const transitionsSection = createSection('Übergänge');
        const addTransitionBtn = createIconButton({
          label: 'Übergang',
          icon: 'lucide:plus',
          onClick() {
            const states = allStateNames();
            const from = states[0] || '';
            const to = states[1] || from;
            data.transitions = data.transitions || [];
            data.transitions.push({ from, to, label: '' });
            rerender();
            sync();
          },
        });
        transitionsSection.header.appendChild(addTransitionBtn);
        const transitionsTable = createTable(['Von', 'Nach', 'Ereignis', 'Aktion']);
        const availableStates = allStateNames();
        (data.transitions || []).forEach((transition, index) => {
          const row = document.createElement('tr');

          const fromCell = document.createElement('td');
          const fromSelect = document.createElement('select');
          availableStates.forEach((state) => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state || '—';
            fromSelect.appendChild(option);
          });
          const fromFallback = document.createElement('option');
          fromFallback.value = '';
          fromFallback.textContent = '—';
          fromSelect.appendChild(fromFallback);
          fromSelect.value = availableStates.includes(transition.from) ? transition.from : '';
          fromSelect.addEventListener('change', () => {
            transition.from = sanitizeMermaidNodeId(fromSelect.value, '');
            sync();
          });
          fromCell.appendChild(fromSelect);
          row.appendChild(fromCell);

          const toCell = document.createElement('td');
          const toSelect = document.createElement('select');
          availableStates.forEach((state) => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state || '—';
            toSelect.appendChild(option);
          });
          const toFallback = document.createElement('option');
          toFallback.value = '';
          toFallback.textContent = '—';
          toSelect.appendChild(toFallback);
          toSelect.value = availableStates.includes(transition.to) ? transition.to : '';
          toSelect.addEventListener('change', () => {
            transition.to = sanitizeMermaidNodeId(toSelect.value, '');
            sync();
          });
          toCell.appendChild(toSelect);
          row.appendChild(toCell);

          const labelCell = document.createElement('td');
          const labelInput = document.createElement('input');
          labelInput.type = 'text';
          labelInput.value = transition.label || '';
          labelInput.placeholder = 'Ereignis';
          labelInput.addEventListener('input', () => {
            transition.label = labelInput.value;
            sync();
          });
          labelCell.appendChild(labelInput);
          row.appendChild(labelCell);

          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions';
          const removeBtn = createIconButton({
            label: 'Entfernen',
            icon: 'lucide:trash-2',
            className: 'icon-only',
            onClick() {
              data.transitions.splice(index, 1);
              rerender();
              sync();
            },
          });
          actionsCell.appendChild(removeBtn);
          row.appendChild(actionsCell);

          transitionsTable.tbody.appendChild(row);
        });
        transitionsSection.section.appendChild(transitionsTable.wrapper);
      },
    };
  }

  function createGanttBuilder() {
    return {
      supportsOrientation: false,
      createDefault: createGanttDefaultData,
      parse: parseGanttDiagram,
      generate: generateGanttDiagram,
      render({ data, helpers }) {
        const { createSection, createTable, createIconButton, sync, rerender } = helpers;

        const metaSection = createSection('Metadaten');
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = data.title || '';
        titleInput.placeholder = 'Titel';
        titleInput.addEventListener('input', () => {
          data.title = titleInput.value.trim();
          sync();
        });
        metaSection.section.appendChild(titleInput);

        const formatInput = document.createElement('input');
        formatInput.type = 'text';
        formatInput.value = data.dateFormat || 'YYYY-MM-DD';
        formatInput.placeholder = 'YYYY-MM-DD';
        formatInput.addEventListener('input', () => {
          data.dateFormat = formatInput.value.trim() || 'YYYY-MM-DD';
          sync();
        });
        metaSection.section.appendChild(formatInput);

        const tasksSection = createSection('Aufgaben', 'Abschnitt, Aufgabe, Status, Kennung, Start, Dauer/Ende');
        const addTaskBtn = createIconButton({
          label: 'Aufgabe',
          icon: 'lucide:plus',
          onClick() {
            data.tasks = data.tasks || [];
            data.tasks.push({ section: '', name: `Aufgabe ${data.tasks.length + 1}`, status: '', id: '', start: '', duration: '' });
            rerender();
            sync();
          },
        });
        tasksSection.header.appendChild(addTaskBtn);
        const tasksTable = createTable(['Abschnitt', 'Aufgabe', 'Status', 'Kennung', 'Start', 'Dauer/Ende', 'Aktion']);
        (data.tasks || []).forEach((task, index) => {
          const row = document.createElement('tr');

          const cells = [
            { key: 'section', placeholder: 'Abschnitt' },
            { key: 'name', placeholder: 'Aufgabe' },
            { key: 'status', placeholder: 'Status (z.B. done)' },
            { key: 'id', placeholder: 'ID (optional)' },
            { key: 'start', placeholder: 'Startdatum oder Referenz' },
            { key: 'duration', placeholder: 'Dauer oder Ende' },
          ];

          cells.forEach(({ key, placeholder }) => {
            const cell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = task[key] || '';
            input.placeholder = placeholder;
            input.addEventListener('input', () => {
              task[key] = input.value;
              sync();
            });
            cell.appendChild(input);
            row.appendChild(cell);
          });

          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions';
          const removeBtn = createIconButton({
            label: 'Entfernen',
            icon: 'lucide:trash-2',
            className: 'icon-only',
            onClick() {
              data.tasks.splice(index, 1);
              rerender();
              sync();
            },
          });
          actionsCell.appendChild(removeBtn);
          row.appendChild(actionsCell);

          tasksTable.tbody.appendChild(row);
        });
        tasksSection.section.appendChild(tasksTable.wrapper);
      },
    };
  }

  function createPieBuilder() {
    return {
      supportsOrientation: false,
      createDefault: createPieDefaultData,
      parse: parsePieDiagram,
      generate: generatePieDiagram,
      render({ data, helpers }) {
        const { createSection, createTable, createIconButton, sync, rerender } = helpers;

        const titleSection = createSection('Titel');
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = data.title || '';
        titleInput.placeholder = 'Titel';
        titleInput.addEventListener('input', () => {
          data.title = titleInput.value.trim();
          sync();
        });
        titleSection.section.appendChild(titleInput);

        const slicesSection = createSection('Segmente');
        const addSliceBtn = createIconButton({
          label: 'Segment',
          icon: 'lucide:plus',
          onClick() {
            data.slices = data.slices || [];
            data.slices.push({ label: `Segment ${data.slices.length + 1}`, value: 10 });
            rerender();
            sync();
          },
        });
        slicesSection.header.appendChild(addSliceBtn);
        const slicesTable = createTable(['Bezeichnung', 'Wert', 'Aktion']);
        (data.slices || []).forEach((slice, index) => {
          const row = document.createElement('tr');

          const labelCell = document.createElement('td');
          const labelInput = document.createElement('input');
          labelInput.type = 'text';
          labelInput.value = slice.label || '';
          labelInput.placeholder = 'Bezeichnung';
          labelInput.addEventListener('input', () => {
            slice.label = labelInput.value;
            sync();
          });
          labelCell.appendChild(labelInput);
          row.appendChild(labelCell);

          const valueCell = document.createElement('td');
          const valueInput = document.createElement('input');
          valueInput.type = 'number';
          valueInput.value = Number.isFinite(slice.value) ? String(slice.value) : '0';
          valueInput.placeholder = 'Wert';
          valueInput.step = '1';
          valueInput.addEventListener('input', () => {
            const val = Number.parseFloat(valueInput.value);
            slice.value = Number.isFinite(val) ? val : 0;
            sync();
          });
          valueCell.appendChild(valueInput);
          row.appendChild(valueCell);

          const actionsCell = document.createElement('td');
          actionsCell.className = 'actions';
          const removeBtn = createIconButton({
            label: 'Entfernen',
            icon: 'lucide:trash-2',
            className: 'icon-only',
            onClick() {
              data.slices.splice(index, 1);
              rerender();
              sync();
            },
          });
          actionsCell.appendChild(removeBtn);
          row.appendChild(actionsCell);

          slicesTable.tbody.appendChild(row);
        });
        slicesSection.section.appendChild(slicesTable.wrapper);
      },
    };
  }

  function createFlowchartDefaultData() {
    return {
      orientation: MERMAID_DEFAULT_ORIENTATION,
      nodes: [
        { id: 'Start', label: 'Start', shape: 'circle' },
        { id: 'Entscheidung', label: 'Entscheidung?', shape: 'diamond' },
        { id: 'Alternative', label: 'Alternative', shape: 'rectangle' },
        { id: 'Ende', label: 'Ende', shape: 'circle' },
      ],
      edges: [
        { from: 'Start', to: 'Entscheidung', label: '' },
        { from: 'Entscheidung', to: 'Ende', label: 'Ja' },
        { from: 'Entscheidung', to: 'Alternative', label: 'Nein' },
        { from: 'Alternative', to: 'Ende', label: '' },
      ],
    };
  }

  function createSequenceDefaultData() {
    return {
      participants: [
        { id: 'Client', label: 'Nutzer' },
        { id: 'Server', label: 'System' },
      ],
      messages: [
        { from: 'Client', arrow: '->>', to: 'Server', text: 'Anfrage' },
        { from: 'Server', arrow: '-->>', to: 'Client', text: 'Antwort' },
      ],
    };
  }

  function createClassDefaultData() {
    return {
      orientation: MERMAID_DEFAULT_ORIENTATION,
      classes: [
        { name: 'Kunde', members: ['+id: string', '+bestellen()'] },
        { name: 'Bestellung', members: ['+nummer: string', '+absenden()'] },
      ],
      relations: [
        { from: 'Kunde', type: '-->', to: 'Bestellung', label: 'erstellt' },
      ],
    };
  }

  function createStateDefaultData() {
    return {
      orientation: MERMAID_DEFAULT_ORIENTATION,
      initial: 'Start',
      finals: ['Ende'],
      states: ['Prüfen'],
      transitions: [
        { from: 'Start', to: 'Prüfen', label: 'beginnen' },
        { from: 'Prüfen', to: 'Ende', label: 'abschließen' },
      ],
    };
  }

  function createGanttDefaultData() {
    return {
      title: 'Projektplan',
      dateFormat: 'YYYY-MM-DD',
      tasks: [
        { section: 'Planung', name: 'Kickoff', status: 'done', id: 't1', start: '2024-01-01', duration: '3d' },
        { section: 'Umsetzung', name: 'Implementierung', status: 'active', id: 't2', start: '2024-01-04', duration: '5d' },
      ],
    };
  }

  function createPieDefaultData() {
    return {
      title: 'Marktanteile',
      slices: [
        { label: 'Produkt A', value: 45 },
        { label: 'Produkt B', value: 30 },
        { label: 'Produkt C', value: 25 },
      ],
    };
  }

  function renderFlowchartBuilder(data, helpers) {
    if (typeof data.orientation === 'string' && mermaidOrientationSelect) {
      mermaidOrientationSelect.value = data.orientation;
      lastMermaidOrientation = data.orientation;
    }
    const { createSection, createTable, createIconButton, sync, rerender } = helpers;

    const nodesSection = createSection('Knoten');
    const addNodeBtn = createIconButton({
      label: 'Knoten',
      icon: 'lucide:plus',
      onClick() {
        const nextId = ensureUniqueNodeId(data.nodes, `Knoten${data.nodes.length + 1}`);
        data.nodes.push({ id: nextId, label: `Schritt ${data.nodes.length + 1}`, shape: 'rectangle' });
        rerender();
        sync();
      },
    });
    nodesSection.header.appendChild(addNodeBtn);
    const nodesTable = createTable(['ID', 'Beschriftung', 'Form', 'Aktion']);
    data.nodes.forEach((node, index) => {
      const row = document.createElement('tr');

      const idCell = document.createElement('td');
      const idInput = document.createElement('input');
      idInput.type = 'text';
      idInput.value = node.id;
      idInput.placeholder = 'ID';
      idInput.addEventListener('blur', () => {
        const next = ensureBuilderNodeId(idInput.value, `Knoten${index + 1}`);
        if (next !== node.id) {
          renameFlowchartReferences(data, node.id, next);
        }
        node.id = next;
        sync();
        rerender();
      });
      idInput.addEventListener('input', () => {
        node.id = sanitizeMermaidNodeId(idInput.value, '');
      });
      idCell.appendChild(idInput);
      row.appendChild(idCell);

      const labelCell = document.createElement('td');
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.value = node.label;
      labelInput.placeholder = 'Anzeigename';
      labelInput.addEventListener('input', () => {
        node.label = labelInput.value;
      });
      labelInput.addEventListener('blur', () => {
        node.label = sanitizeMermaidLabel(labelInput.value, node.id);
        sync();
      });
      labelCell.appendChild(labelInput);
      row.appendChild(labelCell);

      const shapeCell = document.createElement('td');
      const shapeSelect = document.createElement('select');
      MERMAID_NODE_SHAPES.forEach((shape) => {
        const option = document.createElement('option');
        option.value = shape.value;
        option.textContent = shape.label;
        if (shape.value === node.shape) option.selected = true;
        shapeSelect.appendChild(option);
      });
      shapeSelect.addEventListener('change', () => {
        node.shape = shapeSelect.value;
        sync();
      });
      shapeCell.appendChild(shapeSelect);
      row.appendChild(shapeCell);

      const actionsCell = document.createElement('td');
      actionsCell.className = 'actions';
      const removeBtn = createIconButton({
        label: 'Entfernen',
        icon: 'lucide:trash-2',
        className: 'icon-only',
        onClick() {
          if (data.nodes.length <= 1) return;
          const previousId = node.id;
          data.nodes.splice(index, 1);
          data.edges = data.edges.filter((edge) => edge.from !== previousId && edge.to !== previousId);
          rerender();
          sync();
        },
      });
      actionsCell.appendChild(removeBtn);
      row.appendChild(actionsCell);

      nodesTable.tbody.appendChild(row);
    });
    nodesSection.section.appendChild(nodesTable.wrapper);

    const edgesSection = createSection('Verbindungen');
    const addEdgeBtn = createIconButton({
      label: 'Verbindung',
      icon: 'lucide:plus',
      onClick() {
        const from = data.nodes[0]?.id || '';
        const to = data.nodes[data.nodes.length - 1]?.id || '';
        data.edges.push({ from, to, label: '' });
        rerender();
        sync();
      },
    });
    edgesSection.header.appendChild(addEdgeBtn);
    const edgesTable = createTable(['Von', 'Beschriftung', 'Nach', 'Aktion']);
    data.edges.forEach((edge, index) => {
      const row = document.createElement('tr');
      const fromCell = document.createElement('td');
      const fromInput = document.createElement('input');
      fromInput.type = 'text';
      fromInput.value = edge.from;
      fromInput.placeholder = 'Start';
      fromInput.setAttribute('list', 'mermaidNodeIdOptions');
      fromInput.addEventListener('blur', () => {
        edge.from = sanitizeMermaidNodeId(fromInput.value, '');
        sync();
      });
      fromInput.addEventListener('input', () => {
        edge.from = sanitizeMermaidNodeId(fromInput.value, '');
      });
      fromCell.appendChild(fromInput);
      row.appendChild(fromCell);

      const labelCell = document.createElement('td');
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.value = edge.label;
      labelInput.placeholder = 'Beschriftung';
      labelInput.addEventListener('input', () => {
        edge.label = labelInput.value;
      });
      labelInput.addEventListener('blur', () => {
        edge.label = sanitizeMermaidEdgeLabel(labelInput.value);
        sync();
      });
      labelCell.appendChild(labelInput);
      row.appendChild(labelCell);

      const toCell = document.createElement('td');
      const toInput = document.createElement('input');
      toInput.type = 'text';
      toInput.value = edge.to;
      toInput.placeholder = 'Ziel';
      toInput.setAttribute('list', 'mermaidNodeIdOptions');
      toInput.addEventListener('blur', () => {
        edge.to = sanitizeMermaidNodeId(toInput.value, '');
        sync();
      });
      toInput.addEventListener('input', () => {
        edge.to = sanitizeMermaidNodeId(toInput.value, '');
      });
      toCell.appendChild(toInput);
      row.appendChild(toCell);

      const actionsCell = document.createElement('td');
      actionsCell.className = 'actions';
      const removeBtn = createIconButton({
        label: 'Entfernen',
        icon: 'lucide:trash-2',
        className: 'icon-only',
        onClick() {
          data.edges.splice(index, 1);
          rerender();
          sync();
        },
      });
      actionsCell.appendChild(removeBtn);
      row.appendChild(actionsCell);

      edgesTable.tbody.appendChild(row);
    });
    edgesSection.section.appendChild(edgesTable.wrapper);

    fillDatalist(mermaidNodeIdOptions, data.nodes.map((node) => node.id));
  }

  function renderSequenceBuilder(data, helpers) {
    const { createSection, sync } = helpers;
    const participantSection = createSection('Teilnehmer', 'Eine Zeile pro Eintrag, Format: ID | Anzeigename (Anzeigename optional).');
    const participantTextarea = document.createElement('textarea');
    participantTextarea.value = data.participants.map((part) => {
      const id = part.id || '';
      const label = part.label && part.label !== part.id ? part.label : '';
      return label ? `${id} | ${label}` : id;
    }).join('\n');
    participantTextarea.placeholder = 'Client | Nutzer';
    participantTextarea.addEventListener('input', () => {
      data.participants = parseSequenceParticipants(participantTextarea.value);
      sync();
    });
    participantSection.section.appendChild(participantTextarea);

    const messageSection = createSection('Nachrichten', 'Eine Zeile pro Nachricht, Format: Von ->> Nach : Text');
    const messageTextarea = document.createElement('textarea');
    messageTextarea.value = data.messages.map((msg) => {
      const arrow = msg.arrow || '->';
      const text = msg.text ? ` : ${msg.text}` : '';
      return `${msg.from || ''} ${arrow} ${msg.to || ''}${text}`.trim();
    }).join('\n');
    messageTextarea.placeholder = 'Client ->> Server : Anfrage';
    messageTextarea.addEventListener('input', () => {
      data.messages = parseSequenceMessages(messageTextarea.value);
      sync();
    });
    messageSection.section.appendChild(messageTextarea);
  }

  function renderClassBuilder(data, helpers) {
    const { createSection, sync } = helpers;
    const classesSection = createSection('Klassen', 'Klassenblock mit leerer Zeile trennen. Erste Zeile = Klassenname, folgende Zeilen = Mitglieder.');
    const classesTextarea = document.createElement('textarea');
    classesTextarea.value = data.classes.map((cls) => {
      const members = (cls.members || []).map((member) => `  ${member}`).join('\n');
      return members ? `${cls.name}
${members}` : `${cls.name}`;
    }).join('\n\n');
    classesTextarea.placeholder = `Kunde
  +id: string
  +bestellen()`;
    classesTextarea.addEventListener('input', () => {
      data.classes = parseClassBlocks(classesTextarea.value);
      sync();
    });
    classesSection.section.appendChild(classesTextarea);

    const relationsSection = createSection('Beziehungen', 'Format: KlasseA --> KlasseB : Beschriftung (Beschriftung optional).');
    const relationsTextarea = document.createElement('textarea');
    relationsTextarea.value = data.relations.map((rel) => {
      const label = rel.label ? ` : ${rel.label}` : '';
      return `${rel.from || ''} ${rel.type || '-->'} ${rel.to || ''}${label}`.trim();
    }).join('\n');
    relationsTextarea.placeholder = 'Kunde --> Bestellung : erstellt';
    relationsTextarea.addEventListener('input', () => {
      data.relations = parseClassRelations(relationsTextarea.value);
      sync();
    });
    relationsSection.section.appendChild(relationsTextarea);
  }

  function renderStateBuilder(data, helpers) {
    const { createSection, sync } = helpers;
    const initialSection = createSection('Startzustand');
    const initialInput = document.createElement('input');
    initialInput.type = 'text';
    initialInput.value = data.initial || '';
    initialInput.placeholder = 'Start';
    initialInput.addEventListener('input', () => {
      data.initial = sanitizeMermaidNodeId(initialInput.value, '');
      sync();
    });
    initialSection.section.appendChild(initialInput);

    const finalsSection = createSection('Endzustände', 'Ein Zustand pro Zeile.');
    const finalsTextarea = document.createElement('textarea');
    finalsTextarea.value = (data.finals || []).join('\n');
    finalsTextarea.placeholder = 'Ende';
    finalsTextarea.addEventListener('input', () => {
      data.finals = finalsTextarea.value.split(/\r?\n/).map((line) => sanitizeMermaidNodeId(line.trim(), '')).filter(Boolean);
      sync();
    });
    finalsSection.section.appendChild(finalsTextarea);

    const statesSection = createSection('Weitere Zustände', 'Ein Zustand pro Zeile.');
    const statesTextarea = document.createElement('textarea');
    statesTextarea.value = (data.states || []).join('\n');
    statesTextarea.placeholder = 'Prüfen';
    statesTextarea.addEventListener('input', () => {
      data.states = statesTextarea.value.split(/\r?\n/).map((line) => sanitizeMermaidNodeId(line.trim(), '')).filter(Boolean);
      sync();
    });
    statesSection.section.appendChild(statesTextarea);

    const transitionsSection = createSection('Übergänge', 'Format: Von --> Nach : Ereignis');
    const transitionsTextarea = document.createElement('textarea');
    transitionsTextarea.value = (data.transitions || []).map((tr) => {
      const label = tr.label ? ` : ${tr.label}` : '';
      return `${tr.from || ''} --> ${tr.to || ''}${label}`.trim();
    }).join('\n');
    transitionsTextarea.placeholder = 'Start --> Prüfen : beginnen';
    transitionsTextarea.addEventListener('input', () => {
      data.transitions = parseStateTransitions(transitionsTextarea.value);
      sync();
    });
    transitionsSection.section.appendChild(transitionsTextarea);
  }


  function renderGanttBuilder(data, helpers) {
    const { createSection, sync } = helpers;
    const metaSection = createSection('Metadaten');

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = data.title || '';
    titleInput.placeholder = 'Titel';
    titleInput.addEventListener('input', () => {
      data.title = titleInput.value.trim();
      sync();
    });
    metaSection.section.appendChild(titleInput);

    const formatInput = document.createElement('input');
    formatInput.type = 'text';
    formatInput.value = data.dateFormat || 'YYYY-MM-DD';
    formatInput.placeholder = 'YYYY-MM-DD';
    formatInput.addEventListener('input', () => {
      data.dateFormat = formatInput.value.trim() || 'YYYY-MM-DD';
      sync();
    });
    metaSection.section.appendChild(formatInput);

    const tasksSection = createSection('Aufgaben', 'Format: Abschnitt | Aufgabe | Status | ID | Start | Dauer');
    const tasksTextarea = document.createElement('textarea');
    tasksTextarea.value = (data.tasks || []).map((task) => {
      return [
        task.section || '',
        task.name || '',
        task.status || '',
        task.id || '',
        task.start || '',
        task.duration || '',
      ].join(' | ');
    }).join('\n');
    tasksTextarea.placeholder = 'Planung | Kickoff | done | t1 | 2024-01-01 | 3d';
    tasksTextarea.addEventListener('input', () => {
      data.tasks = parseGanttTasks(tasksTextarea.value);
      sync();
    });
    tasksSection.section.appendChild(tasksTextarea);
  }


  function renderPieBuilder(data, helpers) {
    const { createSection, sync } = helpers;
    const titleSection = createSection('Titel');
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = data.title || '';
    titleInput.placeholder = 'Titel';
    titleInput.addEventListener('input', () => {
      data.title = titleInput.value.trim();
      sync();
    });
    titleSection.section.appendChild(titleInput);

    const slicesSection = createSection('Segmente', 'Format: Bezeichnung | Wert');
    const slicesTextarea = document.createElement('textarea');
    slicesTextarea.value = (data.slices || []).map((slice) => `${slice.label || ''} | ${slice.value ?? ''}`).join('\n');
    slicesTextarea.placeholder = 'Produkt A | 45';
    slicesTextarea.addEventListener('input', () => {
      data.slices = parsePieSlices(slicesTextarea.value);
      sync();
    });
    slicesSection.section.appendChild(slicesTextarea);
  }



  const SEQUENCE_ARROW_TYPES = ['->', '->>', '-->', '-->>'];

  function parseSequenceParticipants(value) {
    return value.split(/\r?\n/).map((line) => {
      const [idPart, labelPart] = line.split('|').map((part) => (part || '').trim());
      const id = sanitizeMermaidNodeId(idPart, '');
      const label = labelPart || id;
      return id ? { id, label } : null;
    }).filter(Boolean);
  }

  function parseSequenceMessages(value) {
    return value.split(/\r?\n/).map((line) => {
      const parts = line.split(':');
      const left = (parts.shift() || '').trim();
      const text = parts.join(':').trim();
      const arrowMatch = left.match(/^([^\s]+)\s*([\-\.=>]+)\s*([^\s]+)$/);
      if (!arrowMatch) return null;
      const from = sanitizeMermaidNodeId(arrowMatch[1], '');
      const arrow = SEQUENCE_ARROW_TYPES.includes(arrowMatch[2]) ? arrowMatch[2] : '->';
      const to = sanitizeMermaidNodeId(arrowMatch[3], '');
      if (!from || !to) return null;
      return { from, arrow, to, text };
    }).filter(Boolean);
  }

  function parseSequenceDiagram(code) {
    const text = normalizeMermaidCode(code || '').trim();
    if (!text) return null;
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length || lines[0].toLowerCase() !== 'sequencediagram') return null;
    const participants = [];
    const messages = [];
    const participantPattern = /^participant\s+([^\s]+)(?:\s+as\s+(.+))?$/i;
    const messagePattern = /^([^\s]+)\s*([\-\.=>]+)\s*([^\s:]+)\s*:?(.*)$/;
    for (const line of lines.slice(1)) {
      const participantMatch = line.match(participantPattern);
      if (participantMatch) {
        const id = sanitizeMermaidNodeId(participantMatch[1], '');
        if (!id) continue;
        const label = sanitizeMermaidLabel(participantMatch[2] || id, id);
        if (!participants.some((entry) => entry.id === id)) {
          participants.push({ id, label });
        }
        continue;
      }
      const messageMatch = line.match(messagePattern);
      if (messageMatch) {
        const arrow = SEQUENCE_ARROW_TYPES.includes(messageMatch[2]) ? messageMatch[2] : '->';
        messages.push({
          from: sanitizeMermaidNodeId(messageMatch[1], ''),
          arrow,
          to: sanitizeMermaidNodeId(messageMatch[3], ''),
          text: (messageMatch[4] || '').trim(),
        });
      }
    }
    if (!participants.length) return createSequenceDefaultData();
    return { participants, messages };
  }

  function generateSequenceDiagram(data) {
    const lines = ['sequenceDiagram'];
    const seen = new Set();
    data.participants.forEach((part) => {
      const id = sanitizeMermaidNodeId(part.id, '');
      if (!id || seen.has(id)) return;
      const label = sanitizeMermaidLabel(part.label || id, id);
      if (label && label !== id) {
        lines.push(`  participant ${id} as ${label}`);
      } else {
        lines.push(`  participant ${id}`);
      }
      seen.add(id);
    });
    data.messages.forEach((msg) => {
      const from = sanitizeMermaidNodeId(msg.from, '');
      const to = sanitizeMermaidNodeId(msg.to, '');
      if (!from || !to) return;
      const arrow = SEQUENCE_ARROW_TYPES.includes(msg.arrow) ? msg.arrow : '->';
      const text = msg.text ? ` : ${msg.text}` : '';
      lines.push(`  ${from} ${arrow} ${to}${text}`);
    });
    return lines.join('\n');
  }

  const CLASS_RELATION_TYPES = ['-->', '<--', '--|>', '<|--', '..>', '<..', '..|>', '<|..', '--', '..'];

  function parseClassBlocks(value) {
    const blocks = value.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
    return blocks.map((block) => {
      const lines = block.split(/\r?\n/).map((line) => line.replace(/^\s+/, '')).filter(Boolean);
      const name = sanitizeMermaidNodeId(lines.shift() || '', '');
      const members = lines.map((line) => line.trim()).filter(Boolean);
      return name ? { name, members } : null;
    }).filter(Boolean);
  }

  function parseClassRelations(value) {
    return value.split(/\r?\n/).map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      const [relationPart, labelPart] = trimmed.split(':');
      const label = (labelPart || '').trim();
      const parts = relationPart.trim().split(/\s+/);
      if (parts.length < 3) return null;
      const from = sanitizeMermaidNodeId(parts[0], '');
      const type = CLASS_RELATION_TYPES.includes(parts[1]) ? parts[1] : '-->';
      const to = sanitizeMermaidNodeId(parts[2], '');
      if (!from || !to) return null;
      return { from, type, to, label };
    }).filter(Boolean);
  }

  function parseClassDiagram(code) {
    const text = normalizeMermaidCode(code || '').trim();
    if (!text) return null;
    const lines = text.split(/\r?\n/);
    if (!lines.length || lines[0].trim().toLowerCase() !== 'classdiagram') return null;
    const classes = [];
    const relations = [];
    let orientation = MERMAID_DEFAULT_ORIENTATION;
    let currentClass = null;
    lines.slice(1).forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) return;
      const directionMatch = line.match(/^direction\s+([A-Za-z]{2})/i);
      if (directionMatch) {
        orientation = directionToOrientation(directionMatch[1]);
        return;
      }
      if (line.startsWith('class ')) {
        const nameMatch = line.match(/^class\s+([^\s{]+)(?:\s*\{)?/);
        if (nameMatch) {
          if (currentClass) classes.push(currentClass);
          currentClass = { name: sanitizeMermaidNodeId(nameMatch[1], ''), members: [] };
        }
        if (line.endsWith('{')) return;
      } else if (line === '}' && currentClass) {
        classes.push(currentClass);
        currentClass = null;
        return;
      } else if (currentClass) {
        currentClass.members.push(line);
        return;
      }
      const relationMatch = line.match(/^([^\s]+)\s+([^\s]+)\s+([^\s]+)(?:\s*:\s*(.+))?$/);
      if (relationMatch) {
        relations.push({
          from: sanitizeMermaidNodeId(relationMatch[1], ''),
          type: CLASS_RELATION_TYPES.includes(relationMatch[2]) ? relationMatch[2] : CLASS_RELATION_TYPES[0],
          to: sanitizeMermaidNodeId(relationMatch[3], ''),
          label: relationMatch[4] || '',
        });
      }
    });
    if (currentClass) classes.push(currentClass);
    if (!classes.length) return createClassDefaultData();
    return { orientation, classes, relations };
  }


  function generateClassDiagram(data) {
    const lines = ['classDiagram'];
    const direction = orientationToDirection(data.orientation);
    if (direction) lines.push(`  direction ${direction}`);
    (data.classes || []).forEach((cls) => {
      const name = sanitizeMermaidNodeId(cls.name, '');
      if (!name) return;
      const members = (cls.members || []).filter(Boolean);
      if (!members.length) {
        lines.push(`  class ${name}`);
        return;
      }
      lines.push(`  class ${name} {`);
      members.forEach((member) => {
        lines.push(`    ${member}`);
      });
      lines.push('  }');
    });
    (data.relations || []).forEach((rel) => {
      const from = sanitizeMermaidNodeId(rel.from, '');
      const to = sanitizeMermaidNodeId(rel.to, '');
      if (!from || !to) return;
      const type = CLASS_RELATION_TYPES.includes(rel.type) ? rel.type : CLASS_RELATION_TYPES[0];
      const label = rel.label ? ` : ${rel.label}` : '';
      lines.push(`  ${from} ${type} ${to}${label}`);
    });
    return lines.join('\n');
  }


  function parseStateTransitions(value) {
    return value.split(/\r?\n/).map((line) => {
      const parts = line.split(':');
      const left = (parts.shift() || '').trim();
      const label = (parts.join(':') || '').trim();
      const arrowMatch = left.match(/^([^\s]+)\s*--?>\s*([^\s]+)$/);
      if (!arrowMatch) return null;
      const from = sanitizeMermaidNodeId(arrowMatch[1], '');
      const to = sanitizeMermaidNodeId(arrowMatch[2], '');
      if (!from || !to) return null;
      return { from, to, label };
    }).filter(Boolean);
  }

  function parseStateDiagram(code) {
    const text = normalizeMermaidCode(code || '').trim();
    if (!text) return null;
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length || !/^stateDiagram/i.test(lines[0])) return null;
    const data = createStateDefaultData();
    data.states = [...data.states];
    data.transitions = [];
    data.finals = [...data.finals];
    lines.slice(1).forEach((line) => {
      if (!line) return;
      const directionMatch = line.match(/^direction\s+([A-Za-z]{2})/i);
      if (directionMatch) {
        data.orientation = directionToOrientation(directionMatch[1]);
        return;
      }
      if (/^\[\*\]\s*-->/.test(line)) {
        const target = line.replace(/^\[\*\]\s*-->/, '').trim();
        data.initial = sanitizeMermaidNodeId(target, data.initial);
        return;
      }
      if (/-->\s*\[\*\]/.test(line)) {
        const source = line.replace(/-->\s*\[\*\]/, '').trim();
        const state = sanitizeMermaidNodeId(source, '');
        if (state && !data.finals.includes(state)) data.finals.push(state);
        return;
      }
      if (/^state\s+/.test(line)) {
        const stateName = line.replace(/^state\s+/, '').trim();
        const id = sanitizeMermaidNodeId(stateName, '');
        if (id && !data.states.includes(id) && id !== data.initial && !data.finals.includes(id)) {
          data.states.push(id);
        }
        return;
      }
      const transitionMatch = line.match(/^([^\s]+)\s*--?>\s*([^\s]+)(?:\s*:\s*(.+))?/);
      if (transitionMatch) {
        data.transitions.push({
          from: sanitizeMermaidNodeId(transitionMatch[1], ''),
          to: sanitizeMermaidNodeId(transitionMatch[2], ''),
          label: transitionMatch[3] || '',
        });
      }
    });
    return data;
  }


  function generateStateDiagram(data) {
    const lines = ['stateDiagram-v2'];
    const direction = orientationToDirection(data.orientation);
    if (direction) lines.push(`  direction ${direction}`);
    const initial = sanitizeMermaidNodeId(data.initial, '');
    if (initial) lines.push(`  [*] --> ${initial}`);
    (data.transitions || []).forEach((transition) => {
      const from = sanitizeMermaidNodeId(transition.from, '');
      const to = sanitizeMermaidNodeId(transition.to, '');
      if (!from || !to) return;
      const label = transition.label ? ` : ${transition.label}` : '';
      lines.push(`  ${from} --> ${to}${label}`);
    });
    (data.finals || []).forEach((state) => {
      const id = sanitizeMermaidNodeId(state, '');
      if (!id) return;
      lines.push(`  ${id} --> [*]`);
    });
    return lines.join('\n');
  }


  function parseGanttTasks(value) {
    return value.split(/\r?\n/).map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      const parts = trimmed.split('|').map((part) => part.trim());
      return {
        section: parts[0] || '',
        name: parts[1] || '',
        status: parts[2] || '',
        id: parts[3] || '',
        start: parts[4] || '',
        duration: parts[5] || '',
      };
    }).filter(Boolean);
  }


  function parseGanttDiagram(code) {
    const textInput = normalizeMermaidCode(code || '').trim();
    if (!textInput) return null;
    const lines = textInput.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length || lines[0].toLowerCase() !== 'gantt') return null;
    const data = createGanttDefaultData();
    data.tasks = [];
    let currentSection = '';
    lines.slice(1).forEach((line) => {
      if (!line) return;
      if (line.toLowerCase().startsWith('dateformat')) {
        data.dateFormat = line.replace(/dateformat\s+/i, '').trim();
        return;
      }
      if (line.toLowerCase().startsWith('title')) {
        data.title = line.replace(/title\s+/i, '').trim();
        return;
      }
      if (line.toLowerCase().startsWith('section')) {
        currentSection = line.replace(/section\s+/i, '').trim();
        return;
      }
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return;
      const name = line.slice(0, colonIndex).trim();
      const remainder = line.slice(colonIndex + 1).split(',').map((part) => part.trim()).filter((part) => part.length > 0);
      data.tasks.push({
        section: currentSection,
        name,
        status: remainder[0] || '',
        id: remainder[1] || '',
        start: remainder[2] || '',
        duration: remainder[3] || '',
      });
    });
    if (!data.tasks.length) {
      data.tasks = createGanttDefaultData().tasks.map((task) => ({ ...task }));
    }
    return data;
  }


  function generateGanttDiagram(data) {
    const lines = ['gantt'];
    const dateFormat = data.dateFormat || 'YYYY-MM-DD';
    lines.push(`  dateFormat  ${dateFormat}`);
    if (data.title) lines.push(`  title ${data.title}`);
    let lastSection = undefined;
    (data.tasks || []).forEach((task) => {
      const sectionName = task.section || '';
      if (sectionName !== lastSection) {
        if (sectionName) lines.push(`  section ${sectionName}`);
        lastSection = sectionName;
      }
      const timingParts = [];
      if (task.status) timingParts.push(task.status);
      if (task.id) timingParts.push(task.id);
      if (task.start) timingParts.push(task.start);
      if (task.duration) timingParts.push(task.duration);
      const timing = timingParts.join(', ');
      lines.push(`  ${task.name || 'Aufgabe'} :${timing}`);
    });
    return lines.join('\n');
  }


  function parsePieSlices(value) {
    return value.split(/\r?\n/).map((line) => {
      if (!line.trim()) return null;
      const [labelPart, valuePart] = line.split('|').map((part) => (part || '').trim());
      const label = labelPart || 'Segment';
      const value = Number.parseFloat(valuePart);
      return { label, value: Number.isFinite(value) ? value : 0 };
    }).filter(Boolean);
  }

  function parsePieDiagram(code) {
    const textInput = normalizeMermaidCode(code || '').trim();
    if (!textInput) return null;
    const lines = textInput.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length || !lines[0].toLowerCase().startsWith('pie')) return null;
    const data = createPieDefaultData();
    data.slices = [];
    const titleMatch = lines[0].match(/pie\s+title\s+(.+)/i);
    if (titleMatch) data.title = titleMatch[1].trim();
    lines.slice(1).forEach((line) => {
      const match = line.match(/^"?(.+?)"?\s*:\s*(.+)$/);
      if (!match) return;
      const label = match[1].trim();
      const value = Number.parseFloat(match[2]);
      data.slices.push({ label, value: Number.isFinite(value) ? value : 0 });
    });
    if (!data.slices.length) {
      data.slices = createPieDefaultData().slices.map((slice) => ({ ...slice }));
    }
    return data;
  }

  function generatePieDiagram(data) {
    const lines = ['pie title ' + (data.title || 'Verteilung')];
    (data.slices || []).forEach((slice) => {
      const label = slice.label || 'Segment';
      const value = Number.isFinite(slice.value) ? slice.value : 0;
      lines.push(`  "${label}" : ${value}`);
    });
    return lines.join('\n');
  }


  function generatePieDiagram(data) {
    const lines = ['pie title ' + (data.title || 'Verteilung')];
    (data.slices || []).forEach((slice) => {
      const label = slice.label || 'Segment';
      const value = Number.isFinite(slice.value) ? slice.value : 0;
      lines.push(`  "${label}" : ${value}`);
    });
    return lines.join('\n');
  }

  function generateFlowchartCode(data) {
    const orientation = ['TD', 'LR', 'BT', 'RL'].includes(data.orientation) ? data.orientation : MERMAID_DEFAULT_ORIENTATION;
    const lines = [`flowchart ${orientation}`];
    (data.nodes || []).forEach((node) => {
      const id = sanitizeMermaidNodeId(node.id, '');
      if (!id) return;
      const label = sanitizeMermaidLabel(node.label, id);
      let wrapStart = '[';
      let wrapEnd = ']';
      if (node.shape === 'rounded') {
        wrapStart = '(';
        wrapEnd = ')';
      } else if (node.shape === 'diamond') {
        wrapStart = '{';
        wrapEnd = '}';
      } else if (node.shape === 'circle') {
        wrapStart = '((';
        wrapEnd = '))';
      }
      lines.push(`  ${id}${wrapStart}${label}${wrapEnd}`);
    });
    (data.edges || []).forEach((edge) => {
      const from = sanitizeMermaidNodeId(edge.from, '');
      const to = sanitizeMermaidNodeId(edge.to, '');
      if (!from || !to) return;
      const label = sanitizeMermaidEdgeLabel(edge.label);
      const labelSegment = label ? ` |${label}|` : '';
      lines.push(`  ${from} -->${labelSegment} ${to}`);
    });
    return lines.join('\n');
  }

  function createBuilderSection(container, title, description) {
    const section = document.createElement('section');
    section.className = 'builder-section';
    const header = document.createElement('header');
    header.className = 'builder-section-header';
    const heading = document.createElement('strong');
    heading.textContent = title;
    header.appendChild(heading);
    section.appendChild(header);
    if (description) {
      const desc = document.createElement('p');
      desc.className = 'muted builder-hint';
      desc.textContent = description;
      section.appendChild(desc);
    }
    container.appendChild(section);
    return { section, header };
  }

  function createBuilderTable(headers) {
    const wrapper = document.createElement('div');
    wrapper.className = 'builder-table-wrapper';
    const table = document.createElement('table');
    table.className = 'builder-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headers.forEach((label) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    wrapper.appendChild(table);
    return { wrapper, table, tbody };
  }

  function createIconButton({ label, icon, className = 'secondary has-icon', onClick }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    if (label) {
      button.title = label;
      button.setAttribute('aria-label', label);
    }
    if (icon && className !== 'icon-only') {
      const iconEl = document.createElement('iconify-icon');
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.setAttribute('icon', icon);
      button.appendChild(iconEl);
    }
    if (className === 'icon-only' && icon) {
      const iconEl = document.createElement('iconify-icon');
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.setAttribute('icon', icon);
      button.appendChild(iconEl);
    }
    if (className !== 'icon-only') {
      const span = document.createElement('span');
      span.className = 'btn-label';
      span.textContent = label;
      button.appendChild(span);
    }
    if (typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }
    return button;
  }

  function fillDatalist(listElement, values) {
    if (!listElement) return;
    listElement.innerHTML = '';
    values.filter(Boolean).forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      listElement.appendChild(option);
    });
  }

  function ensureBuilderNodeId(value, fallback) {
    const sanitized = sanitizeMermaidNodeId(value, fallback);
    return sanitized || fallback;
  }

  function ensureUniqueNodeId(nodes, candidate) {
    let base = ensureBuilderNodeId(candidate, 'Knoten');
    let id = base;
    let run = 1;
    const taken = new Set(nodes.map((node) => node.id));
    while (taken.has(id)) {
      id = `${base}_${run++}`;
    }
    return id;
  }

  function renameFlowchartReferences(data, previousId, nextId) {
    data.edges = data.edges.map((edge) => {
      const updated = { ...edge };
      if (edge.from === previousId) updated.from = nextId;
      if (edge.to === previousId) updated.to = nextId;
      return updated;
    });
  }

  function parseFlowchartCode(rawCode) {
    const code = normalizeMermaidCode(rawCode || '').trim();
    if (!code) return null;
    const rawLines = code.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!rawLines.length) return null;
    let orientation = MERMAID_DEFAULT_ORIENTATION;
    let lines = rawLines;
    const firstLine = rawLines[0].replace(/;+$/, '').trim();
    if (/^(flowchart|graph)\s+/i.test(firstLine)) {
      const match = firstLine.match(/^(?:flowchart|graph)\s+([A-Za-z]{2})/i);
      if (match) orientation = match[1].toUpperCase();
      lines = rawLines.slice(1);
    }
    const nodes = [];
    const edges = [];
    const nodePattern = /^([A-Za-z0-9_]+)\s*(\[\s*(.+?)\s*\]|\(\s*(.+?)\s*\)|\{\s*(.+?)\s*\}|\(\(\s*(.+?)\s*\)\))$/;
    const edgePattern = /^([A-Za-z0-9_]+)\s*-->\s*(?:\|\s*(.+?)\s*\|\s*)?([A-Za-z0-9_]+)$/;
    for (const rawLine of lines) {
      const sanitized = rawLine.replace(/;+$/, '').trim();
      if (!sanitized) continue;
      if (/^%%/.test(sanitized)) continue;
      const nodeMatch = sanitized.match(nodePattern);
      if (nodeMatch) {
        const id = sanitizeMermaidNodeId(nodeMatch[1], '');
        if (!id) continue;
        let shape = 'rectangle';
        let label = nodeMatch[3] || '';
        if (nodeMatch[4]) {
          shape = 'rounded';
          label = nodeMatch[4];
        } else if (nodeMatch[5]) {
          shape = 'diamond';
          label = nodeMatch[5];
        } else if (nodeMatch[6]) {
          shape = 'circle';
          label = nodeMatch[6];
        }
        nodes.push({
          id,
          label: sanitizeMermaidLabel(label, id),
          shape,
        });
        continue;
      }
      const edgeMatch = sanitized.match(edgePattern);
      if (edgeMatch) {
        edges.push({
          from: sanitizeMermaidNodeId(edgeMatch[1], ''),
          label: sanitizeMermaidEdgeLabel(edgeMatch[2]),
          to: sanitizeMermaidNodeId(edgeMatch[3], ''),
        });
        continue;
      }
      return null;
    }
    const validIds = new Set(nodes.map((node) => node.id));
    const filteredEdges = edges.filter((edge) => validIds.has(edge.from) && validIds.has(edge.to));
    return {
      orientation: ['TD', 'LR', 'BT', 'RL'].includes(orientation) ? orientation : MERMAID_DEFAULT_ORIENTATION,
      nodes,
      edges: filteredEdges,
    };
  }

  function openMermaidDialog() {
    if (!isMermaidDialogReady()) return;
    mermaidDialogOverlay.classList.remove('hidden');
    mermaidDialogOverlay.setAttribute('aria-hidden', 'false');
    setStatus('Diagramm-Editor (experimentell) geöffnet');
    window.setTimeout(() => {
      try {
        if (mermaidCodeInput) {
          mermaidCodeInput.focus();
          mermaidCodeInput.select();
        }
      } catch {}
    }, 0);
  }

  function closeMermaidDialog(options = {}) {
    if (!isMermaidDialogReady()) return;
    const { restoreFocus = true, clearSelection = true } = options;
    mermaidDialogOverlay.classList.add('hidden');
    mermaidDialogOverlay.setAttribute('aria-hidden', 'true');
    if (clearSelection) mermaidInsertSelection = null;
    if (restoreFocus) {
      try { editor.focus(); } catch {}
    }
  }

  function handleMermaidDialogKeydown(e) {
    if (!mermaidDialogOverlay || mermaidDialogOverlay.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMermaidDialog();
    }
  }

  function updateMermaidOrientationVisibility() {
    if (!mermaidOrientationField) return;
    const type = getSelectedMermaidType();
    const supportsOrientation = builderSupportsOrientation(type);
    mermaidOrientationField.hidden = !supportsOrientation;
    if (supportsOrientation && mermaidOrientationSelect) {
      let orientation = lastMermaidOrientation || MERMAID_DEFAULT_ORIENTATION;
      const data = ensureMermaidBuilderData(type);
      if (mermaidBuilderState.enabled && data?.orientation) {
        orientation = normalizeOrientation(data.orientation);
      }
      orientation = normalizeOrientation(orientation);
      mermaidOrientationSelect.value = orientation;
      lastMermaidOrientation = orientation;
    }
    syncMermaidBuilderAvailability(type);
  }


  function shouldOverwriteMermaidCode() {
    if (mermaidBuilderState.enabled) return true;
    if (mermaidTemplatePristine) return true;
    return window.confirm('Eigene Anpassungen werden überschrieben. Fortfahren?');
  }

  function updateMermaidTemplateFromControls(options = {}) {
    if (!isMermaidDialogReady()) return false;
    const { force = false } = options;
    if (mermaidBuilderState.enabled) {
      syncBuilderOutputs();
      return true;
    }
    if (!force && !shouldOverwriteMermaidCode()) return false;
    const type = mermaidTypeSelect?.value || MERMAID_DEFAULT_TYPE;
    const orientation = mermaidOrientationSelect?.value || MERMAID_DEFAULT_ORIENTATION;
    if (mermaidCodeInput) {
      mermaidCodeInput.value = buildMermaidTemplate(type, { orientation });
      mermaidTemplatePristine = true;
      updateMermaidDialogPreview();
    }
    return true;
  }

  function handleMermaidTypeChange() {
    if (!isMermaidDialogReady()) return;
    const newType = mermaidTypeSelect?.value || MERMAID_DEFAULT_TYPE;
    const previousType = lastMermaidType;
    const previousOrientation = lastMermaidOrientation;
    updateMermaidOrientationVisibility();
    const updated = updateMermaidTemplateFromControls({ force: false });
    if (!updated) {
      if (mermaidTypeSelect) mermaidTypeSelect.value = previousType;
      if (mermaidOrientationSelect) mermaidOrientationSelect.value = previousOrientation;
      updateMermaidOrientationVisibility();
      return;
    }
    lastMermaidType = newType;
    lastMermaidOrientation = normalizeOrientation(mermaidOrientationSelect?.value || previousOrientation || MERMAID_DEFAULT_ORIENTATION);
    if (mermaidCodeInput) {
      loadMermaidBuilderFromCode(newType, mermaidCodeInput.value);
    } else {
      syncMermaidBuilderAvailability(newType);
    }
    updateMermaidDialogPreview();
  }


  function handleMermaidOrientationChange() {
    if (!isMermaidDialogReady()) return;
    const newOrientation = normalizeOrientation(mermaidOrientationSelect?.value || MERMAID_DEFAULT_ORIENTATION);
    if (mermaidBuilderState.enabled) {
      const type = mermaidBuilderState.type;
      if (builderSupportsOrientation(type)) {
        const data = ensureMermaidBuilderData(type);
        if (data) data.orientation = newOrientation;
        lastMermaidOrientation = newOrientation;
        syncBuilderOutputs();
        return;
      }
    }
    const previousOrientation = lastMermaidOrientation;
    lastMermaidOrientation = newOrientation;
    const updated = updateMermaidTemplateFromControls({ force: false });
    if (!updated) {
      lastMermaidOrientation = previousOrientation;
      if (mermaidOrientationSelect) mermaidOrientationSelect.value = previousOrientation;
      return;
    }
    updateMermaidDialogPreview();
  }


  function insertMermaidFromDialog() {
    if (!isMermaidDialogReady() || !mermaidCodeInput) return;
    const raw = mermaidCodeInput.value || '';
    const normalized = normalizeMermaidCode(raw).replace(/\s+$/g, '');
    if (!normalized) {
      mermaidCodeInput.focus();
      return;
    }
    const block = `\n\n\`\`\`mermaid\n${normalized}\n\`\`\`\n\n`;
    const selection = mermaidInsertSelection;
    const start = selection ? selection.start : editor.selectionStart;
    const end = selection ? selection.end : editor.selectionEnd;
    editor.setRangeText(block, start, end, 'end');
    const pos = start + block.length;
    try { editor.setSelectionRange(pos, pos); } catch {}
    mermaidTemplatePristine = true;
    closeMermaidDialog({ clearSelection: true });
    updatePreview();
    updateCursorInfo();
    updateWordCount();
    markDirty(true);
  }

  function insertList(ordered = false) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const sel = editor.value.slice(start, end) || 'Listenelement';
    const lines = sel.split(/\n/);
    const newLines = lines.map((l, i) => ordered ? `${i + 1}. ${l || 'Item'}` : `- ${l || 'Item'}`);
    editor.setRangeText(newLines.join('\n'), start, end, 'end');
    editor.focus();
  }

  function insertTaskList() {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const sel = editor.value.slice(start, end) || 'Aufgabe';
    const lines = sel.split(/\n/);
    const newLines = lines.map((l) => `- [ ] ${l || 'Aufgabe'}`);
    editor.setRangeText(newLines.join('\n'), start, end, 'end');
    editor.focus();
  }

  function insertLink() {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.slice(start, end) || 'Linktext';
    const url = prompt('URL eingeben:', 'https://');
    if (!url) return;
    const md = `[${selected}](${url})`;
    editor.setRangeText(md, start, end, 'end');
    editor.focus();
  }

  function insertImageFromURL() {
    const url = prompt('Bild-URL eingeben:');
    if (!url) return;
    const alt = prompt('Alt-Text (optional):', '') || '';
    insertAtCursor(`![${alt}](${url})`);
  }

  function insertAtCursor(text) {
    const pos = editor.selectionStart;
    editor.setRangeText(text, pos, pos, 'end');
    editor.focus();
  }

  function insertTable() {
    if (!isTableDialogReady()) {
      const tpl = `\n\n| Spalte 1 | Spalte 2 |\n| --- | --- |\n|  |  |\n\n`;
      insertAtCursor(tpl);
      return;
    }
    tableInsertSelection = {
      start: editor.selectionStart,
      end: editor.selectionEnd,
    };
    tableDialogRows = TABLE_DEFAULT_ROWS;
    tableDialogCols = TABLE_DEFAULT_COLS;
    tableRowsInput.value = String(tableDialogRows);
    tableColsInput.value = String(tableDialogCols);
    rebuildTableInputs({ row: 0, col: 0 }, true);
    openTableDialog();
    skipToolbarPostAction = true;
  }

  function isTableDialogReady() {
    return !!(tableDialogOverlay && tableDialog && tableDialogForm && tableRowsInput && tableColsInput && tableBuilderGrid);
  }

  function openTableDialog() {
    if (!isTableDialogReady()) return;
    tableDialogOverlay.classList.remove('hidden');
    tableDialogOverlay.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      const first = tableBuilderGrid.querySelector('input[data-row="0"][data-col="0"]');
      if (first) {
        first.focus();
        first.select();
      }
    }, 0);
  }

  function closeTableDialog(options = {}) {
    if (!isTableDialogReady()) return;
    const { restoreFocus = true, clearSelection = true } = options;
    tableDialogOverlay.classList.add('hidden');
    tableDialogOverlay.setAttribute('aria-hidden', 'true');
    tableBuilderGrid.innerHTML = '';
    if (clearSelection) tableInsertSelection = null;
    if (restoreFocus) {
      try { editor.focus(); } catch {}
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function readCurrentTableValues() {
    const values = new Map();
    if (!tableBuilderGrid) return values;
    tableBuilderGrid.querySelectorAll('input[data-row][data-col]').forEach((input) => {
      const key = `${input.dataset.row}:${input.dataset.col}`;
      values.set(key, input.value);
    });
    return values;
  }

  function createTableCellInput(row, col, existingValues) {
    const input = document.createElement('input');
    input.type = 'text';
    input.dataset.row = String(row);
    input.dataset.col = String(col);
    const key = `${row}:${col}`;
    input.value = existingValues.has(key) ? existingValues.get(key) || '' : '';
    input.placeholder = row === 0 ? `Spalte ${col + 1}` : `Zelle ${row + 1}-${col + 1}`;
    return input;
  }

  function rebuildTableInputs(focusCell = null, resetValues = false) {
    if (!isTableDialogReady()) return;
    const existingValues = resetValues ? new Map() : readCurrentTableValues();
    tableBuilderGrid.innerHTML = '';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (let c = 0; c < tableDialogCols; c++) {
      const th = document.createElement('th');
      const input = createTableCellInput(0, c, existingValues);
      th.appendChild(input);
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (let r = 1; r < tableDialogRows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < tableDialogCols; c++) {
        const td = document.createElement('td');
        const input = createTableCellInput(r, c, existingValues);
        td.appendChild(input);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    tableBuilderGrid.appendChild(table);
    if (focusCell) {
      const target = tableBuilderGrid.querySelector(`input[data-row="${focusCell.row}"][data-col="${focusCell.col}"]`);
      if (target) {
        target.focus();
        target.select();
      }
    }
  }

  function setTableRows(rows, focusCell = null) {
    const next = clamp(rows, TABLE_MIN_ROWS, TABLE_MAX_ROWS);
    const previous = tableDialogRows;
    tableDialogRows = next;
    tableRowsInput.value = String(tableDialogRows);
    const focus = focusCell || (next > previous ? { row: next - 1, col: 0 } : null);
    rebuildTableInputs(focus);
  }

  function setTableCols(cols, focusCell = null) {
    const next = clamp(cols, TABLE_MIN_COLS, TABLE_MAX_COLS);
    const previous = tableDialogCols;
    tableDialogCols = next;
    tableColsInput.value = String(tableDialogCols);
    const focus = focusCell || (next > previous ? { row: 0, col: next - 1 } : null);
    rebuildTableInputs(focus);
  }

  function escapeTableCell(text) {
    return text.replace(/\|/g, '\\|').trim();
  }

  function collectTableValues() {
    const values = [];
    if (!isTableDialogReady()) return values;
    for (let r = 0; r < tableDialogRows; r++) {
      const row = [];
      for (let c = 0; c < tableDialogCols; c++) {
        const input = tableBuilderGrid.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
        row.push(input ? input.value.trim() : '');
      }
      values.push(row);
    }
    return values;
  }

  function buildTableMarkdown(data) {
    if (!data.length) return '';
    const headerRow = data[0].map((cell, idx) => escapeTableCell(cell || `Spalte ${idx + 1}`));
    const alignRow = headerRow.map(() => '---');
    const lines = [`| ${headerRow.join(' | ')} |`, `| ${alignRow.join(' | ')} |`];
    const bodyRows = data.slice(1);
    if (!bodyRows.length) {
      bodyRows.push(new Array(headerRow.length).fill(''));
    }
    for (const row of bodyRows) {
      const cells = row.map((cell) => {
        const text = cell && cell.trim() ? escapeTableCell(cell) : ' ';
        return text;
      });
      while (cells.length < headerRow.length) cells.push(' ');
      lines.push(`| ${cells.join(' | ')} |`);
    }
    return lines.join('\n');
  }

  function insertTableFromDialog() {
    const data = collectTableValues();
    const markdown = buildTableMarkdown(data);
    if (!markdown) {
      closeTableDialog();
      return;
    }
    closeTableDialog({ restoreFocus: false, clearSelection: false });
    if (tableInsertSelection) {
      try {
        editor.focus();
        editor.setSelectionRange(tableInsertSelection.start, tableInsertSelection.end);
      } catch {}
    }
    insertAtCursor(`\n\n${markdown}\n\n`);
    tableInsertSelection = null;
    editor.focus();
    updatePreview();
    updateCursorInfo();
    updateWordCount();
    markDirty(true);
  }

  function handleTableDialogKeydown(e) {
    if (!tableDialogOverlay || tableDialogOverlay.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeTableDialog();
    }
  }

  function insertHr() {
    insertAtCursor('\n\n---\n\n');
  }

  function insertQuote() {
    prefixLines(editor, '> ');
  }

  // Images, audio & video via file input, paste, drag & drop
  function chooseImageFile() {
    hiddenImage.value = '';
    hiddenImage.click();
  }

  function chooseAudioFile() {
    hiddenAudio.value = '';
    hiddenAudio.click();
  }

  function chooseVideoFile() {
    if (!hiddenVideo) return;
    hiddenVideo.value = '';
    hiddenVideo.click();
  }

  function parseTimecodeToSeconds(value) {
    if (!value) return 0;
    if (/^\d+$/.test(value)) return Math.max(0, parseInt(value, 10));
    const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
    if (!match) return 0;
    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    return Math.max(hours * 3600 + minutes * 60 + seconds, 0);
  }

  function buildVideoTag(src, label = '', options = {}) {
    const safeSrc = escapeHtml(src);
    const baseFallback = 'Dein Browser unterstützt das Video-Element nicht.';
    const safeLabel = label ? ` ${escapeHtml(label)}` : '';
    let mediaRefAttr = '';
    if (options?.mediaRef) {
      mediaRefAttr = ` data-media-ref="${escapeHtml(options.mediaRef)}"`;
    } else if (typeof src === 'string' && src.startsWith(MEDIA_PLACEHOLDER_PREFIX)) {
      mediaRefAttr = ` data-media-ref="${escapeHtml(src.slice(MEDIA_PLACEHOLDER_PREFIX.length))}"`;
    }
    return `<video class="embedded-video" controls playsinline src="${safeSrc}"${mediaRefAttr}>\n  ${baseFallback}${safeLabel}\n</video>`;
  }

  function extractYouTubeId(url) {
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') {
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[0] || '';
    }
    if (host.endsWith('youtube.com')) {
      if (url.searchParams.get('v')) {
        return url.searchParams.get('v') || '';
      }
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'watch') {
        return segments[1] || '';
      }
    }
    return '';
  }

  function extractYouTubeStartSeconds(url) {
    const params = url.searchParams;
    let raw = params.get('start') || params.get('t') || '';
    if (!raw && url.hash) {
      const hash = url.hash.replace(/^#/, '');
      if (hash.includes('=')) {
        const hashParams = new URLSearchParams(hash);
        raw = hashParams.get('start') || hashParams.get('t') || '';
      } else if (hash) {
        raw = hash;
      }
    }
    return parseTimecodeToSeconds(raw || '');
  }

  function buildYouTubeEmbed(url) {
    const id = extractYouTubeId(url).replace(/[^0-9A-Za-z_-]/g, '');
    if (!id) return null;
    const embedUrl = new URL(`https://www.youtube.com/embed/${id}`);
    const list = url.searchParams.get('list');
    if (list) embedUrl.searchParams.set('list', list);
    const startSeconds = extractYouTubeStartSeconds(url);
    if (startSeconds > 0) embedUrl.searchParams.set('start', String(startSeconds));
    return `<iframe class="embedded-video" src="${escapeHtml(embedUrl.toString())}" title="YouTube Video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  }

  function buildVimeoEmbed(url) {
    const segments = url.pathname.split('/').filter(Boolean);
    let videoId = '';
    if (segments[0] === 'video' && segments[1]) {
      videoId = segments[1];
    } else {
      videoId = segments.find((seg) => /^\d+$/.test(seg)) || '';
    }
    if (!videoId) return null;
    const embedUrl = `https://player.vimeo.com/video/${videoId}`;
    return `<iframe class="embedded-video" src="${escapeHtml(embedUrl)}" title="Vimeo Video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  function buildVideoEmbedFromUrl(input) {
    let url;
    let normalized = input.trim();
    if (normalized.startsWith('//')) {
      normalized = `https:${normalized}`;
    } else if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    try {
      url = new URL(normalized);
    } catch (_) {
      return null;
    }
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be' || host.endsWith('youtube.com')) {
      return buildYouTubeEmbed(url);
    }
    if (host.endsWith('vimeo.com')) {
      return buildVimeoEmbed(url);
    }
    if (/\.(mp4|webm|ogv|ogg|mov|m4v|mpg|mpeg|mkv)$/i.test(url.pathname)) {
      return buildVideoTag(url.toString());
    }
    return null;
  }

  function startVideoInsertFlow(mode = 'url') {
    if (mode === 'file') {
      chooseVideoFile();
      return;
    }
    const input = prompt('Video-URL eingeben (unterstützt YouTube, Vimeo oder direkte MP4/WebM-Links):');
    if (input === null) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    const embed = buildVideoEmbedFromUrl(trimmed);
    if (!embed) {
      alert('Die Video-URL konnte nicht verarbeitet werden. Bitte gib eine gültige Adresse an oder nutze die Dateiauswahl.');
      return;
    }
    insertAtCursor(`\n${embed}\n`);
    updatePreview();
    updateCursorInfo();
    updateWordCount();
    markDirty(true);
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  hiddenImage.addEventListener('change', async () => {
    const file = hiddenImage.files && hiddenImage.files[0];
    if (!file) return;
    const dataUrl = await fileToDataURL(file);
    const alt = file.name.replace(/\.[^.]+$/, '');
    const asset = registerEmbeddedMedia('image', dataUrl, { name: file.name });
    const placeholder = asset ? `${MEDIA_PLACEHOLDER_PREFIX}${asset.id}` : dataUrl;
    insertAtCursor(`![${alt}](${placeholder})`);
    updatePreview();
    markDirty(true);
  });

  hiddenAudio.addEventListener('change', async () => {
    const file = hiddenAudio.files && hiddenAudio.files[0];
    if (!file) return;
    const dataUrl = await fileToDataURL(file);
    const label = file.name.replace(/\.[^.]+$/, '');
    const asset = registerEmbeddedMedia('audio', dataUrl, { name: file.name, label });
    const placeholder = asset ? `${MEDIA_PLACEHOLDER_PREFIX}${asset.id}` : dataUrl;
    const mediaAttr = asset ? ` data-media-ref="${asset.id}"` : '';
    insertAtCursor(`\n<audio controls src="${placeholder}"${mediaAttr}>\n  Dein Browser unterstützt das Audio-Element nicht. ${label}\n</audio>\n`);
    updatePreview();
    markDirty(true);
  });

  hiddenVideo?.addEventListener('change', async () => {
    const file = hiddenVideo.files && hiddenVideo.files[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataURL(file);
      const label = file.name.replace(/\.[^.]+$/, '');
      const asset = registerEmbeddedMedia('video', dataUrl, { name: file.name, label });
      const placeholder = asset ? `${MEDIA_PLACEHOLDER_PREFIX}${asset.id}` : dataUrl;
      insertAtCursor(`\n${buildVideoTag(placeholder, label, asset ? { mediaRef: asset.id } : {})}\n`);
      updatePreview();
      updateCursorInfo();
      updateWordCount();
      markDirty(true);
    } catch (err) {
      console.error('Videodatei konnte nicht gelesen werden', err);
      alert('Das Video konnte nicht geladen werden. Bitte versuche es erneut.');
    }
  });

  editor.addEventListener('paste', async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type && it.type.startsWith('image/')) {
        e.preventDefault();
        const file = it.getAsFile();
        if (!file) continue;
        const dataUrl = await fileToDataURL(file);
        const asset = registerEmbeddedMedia('image', dataUrl, { name: file.name });
        const placeholder = asset ? `${MEDIA_PLACEHOLDER_PREFIX}${asset.id}` : dataUrl;
        insertAtCursor(`![${file.name.replace(/\.[^.]+$/, '')}](${placeholder})`);
        updatePreview();
        markDirty(true);
      }
    }
  });

  // Drag & drop: .md to open, PDFs/Word zum Importieren, Bilder, Audio & Video zum Einfügen
  ['dragenter','dragover'].forEach((type) => document.addEventListener(type, (e) => {
    e.preventDefault(); e.stopPropagation(); document.body.classList.add('dragging');
  }));
  ['dragleave','dragend','drop'].forEach((type) => document.addEventListener(type, (e) => {
    if (type !== 'drop') { document.body.classList.remove('dragging'); }
  }));
  document.addEventListener('drop', async (e) => {
    e.preventDefault(); e.stopPropagation(); document.body.classList.remove('dragging');
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    if (files.length === 1 && /\.(md|markdown)$/i.test(files[0].name)) {
      // open markdown file (fallback style)
      const file = files[0];
      const text = await file.text();
      resetEmbeddedMediaStore();
      editor.value = text;
      normalizeEditorMedia();
      updatePreview();
      updateCursorInfo();
      updateWordCount();
      setFileName(file.name);
      fileHandle = null; // dropped file is not a persistent handle
      markDirty(false);
      return;
    }
    if (files.length === 1 && /\.pdf$/i.test(files[0].name)) {
      await importPdfFile(files[0], { suggestedName: files[0].name.replace(/\.pdf$/i, '.md') });
      return;
    }
    if (files.length === 1 && /\.docx$/i.test(files[0].name)) {
      await importDocxFile(files[0], { suggestedName: files[0].name.replace(/\.docx$/i, '.md') });
      return;
    }
    // Insert all images, audio & video files
    for (const f of files) {
      if (f.type.startsWith('image/')) {
        const dataUrl = await fileToDataURL(f);
        const asset = registerEmbeddedMedia('image', dataUrl, { name: f.name });
        const placeholder = asset ? `${MEDIA_PLACEHOLDER_PREFIX}${asset.id}` : dataUrl;
        insertAtCursor(`\n![${f.name.replace(/\.[^.]+$/, '')}](${placeholder})\n`);
      } else if (f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(f.name)) {
        const dataUrl = await fileToDataURL(f);
        const label = f.name.replace(/\.[^.]+$/, '');
        const asset = registerEmbeddedMedia('audio', dataUrl, { name: f.name, label });
        const placeholder = asset ? `${MEDIA_PLACEHOLDER_PREFIX}${asset.id}` : dataUrl;
        const mediaAttr = asset ? ` data-media-ref="${asset.id}"` : '';
        insertAtCursor(`\n<audio controls src="${placeholder}"${mediaAttr}>\n  Dein Browser unterstützt das Audio-Element nicht. ${label}\n</audio>\n`);
      } else if (f.type.startsWith('video/') || /\.(mp4|webm|ogv|ogg|mov|m4v|mpg|mpeg|mkv)$/i.test(f.name)) {
        const dataUrl = await fileToDataURL(f);
        const label = f.name.replace(/\.[^.]+$/, '');
        const asset = registerEmbeddedMedia('video', dataUrl, { name: f.name, label });
        const placeholder = asset ? `${MEDIA_PLACEHOLDER_PREFIX}${asset.id}` : dataUrl;
        insertAtCursor(`\n${buildVideoTag(placeholder, label, asset ? { mediaRef: asset.id } : {})}\n`);
      }
    }
    updatePreview();
    markDirty(true);
  });

  // Toolbar clicks
  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    switch (action) {
      case 'undo': try { editor.focus(); document.execCommand('undo'); } catch {} break;
      case 'redo': try { editor.focus(); document.execCommand('redo'); } catch {} break;
      case 'h1': heading(1); break;
      case 'h2': heading(2); break;
      case 'h3': heading(3); closeHeadingMenu(); break;
      case 'h4': heading(4); closeHeadingMenu(); break;
      case 'h5': heading(5); closeHeadingMenu(); break;
      case 'h6': heading(6); closeHeadingMenu(); break;
      case 'bold': toggleWrapSelection(editor, ['**', '**']); break;
      case 'italic': toggleWrapSelection(editor, ['*', '*']); break;
      case 'strike': toggleWrapSelection(editor, ['~~', '~~']); break;
      case 'code': toggleWrapSelection(editor, ['`', '`']); break;
      case 'codeblock': insertCodeBlock(); break;
      case 'mermaid': insertMermaidDiagram(); break;
      case 'ul': insertList(false); break;
      case 'ol': insertList(true); break;
      case 'task': insertTaskList(); break;
      case 'quote': insertQuote(); break;
      case 'link': insertLink(); break;
      case 'image': chooseImageFile(); break;
      case 'audio': chooseAudioFile(); break;
      case 'table': insertTable(); break;
      case 'hr': insertHr(); break;
      default: break;
    }
    if (skipToolbarPostAction) {
      skipToolbarPostAction = false;
      return;
    }
    updatePreview();
    updateCursorInfo();
    updateWordCount();
    markDirty(true);
  });

  if (isTableDialogReady()) {
    tableDialogOverlay.addEventListener('click', (e) => {
      if (e.target === tableDialogOverlay) closeTableDialog();
    });
    tableDialogOverlay.addEventListener('keydown', handleTableDialogKeydown);
    tableDialogCloseBtn?.addEventListener('click', () => closeTableDialog());
    tableDialogCancelBtn?.addEventListener('click', () => closeTableDialog());
    tableDialogForm.addEventListener('submit', (e) => {
      e.preventDefault();
      insertTableFromDialog();
    });
    tableRowsInput.addEventListener('change', () => {
      const value = Number.parseInt(tableRowsInput.value, 10);
      if (Number.isFinite(value)) {
        setTableRows(value);
      } else {
        tableRowsInput.value = String(tableDialogRows);
      }
    });
    tableColsInput.addEventListener('change', () => {
      const value = Number.parseInt(tableColsInput.value, 10);
      if (Number.isFinite(value)) {
        setTableCols(value);
      } else {
        tableColsInput.value = String(tableDialogCols);
      }
    });
    tableAddRowBtn?.addEventListener('click', () => setTableRows(tableDialogRows + 1));
    tableAddColBtn?.addEventListener('click', () => setTableCols(tableDialogCols + 1));
  }

  if (isMermaidDialogReady()) {
    mermaidDialogOverlay.addEventListener('click', (e) => {
      if (e.target === mermaidDialogOverlay) closeMermaidDialog();
    });
    mermaidDialogOverlay.addEventListener('keydown', handleMermaidDialogKeydown);
    mermaidDialogCloseBtn?.addEventListener('click', () => closeMermaidDialog());
    mermaidDialogCancelBtn?.addEventListener('click', () => closeMermaidDialog());
    mermaidDialogForm.addEventListener('submit', (e) => {
      e.preventDefault();
      insertMermaidFromDialog();
    });
    mermaidCodeInput.addEventListener('input', () => {
      if (mermaidBuilderSyncing) return;
      mermaidTemplatePristine = false;
      if (mermaidBuilderState.enabled) {
        setMermaidBuilderEnabled(false);
      }
      updateMermaidDialogPreview();
    });
    mermaidTypeSelect.addEventListener('change', () => handleMermaidTypeChange());
    mermaidOrientationSelect?.addEventListener('change', () => handleMermaidOrientationChange());
    mermaidTemplateResetBtn?.addEventListener('click', () => {
      if (mermaidBuilderState.enabled) {
        setMermaidBuilderEnabled(true, { reset: true });
        lastMermaidType = mermaidTypeSelect?.value || MERMAID_DEFAULT_TYPE;
        lastMermaidOrientation = mermaidOrientationSelect?.value || MERMAID_DEFAULT_ORIENTATION;
        return;
      }
      const restored = updateMermaidTemplateFromControls({ force: true });
      if (!restored) return;
      lastMermaidType = mermaidTypeSelect?.value || MERMAID_DEFAULT_TYPE;
      lastMermaidOrientation = mermaidOrientationSelect?.value || MERMAID_DEFAULT_ORIENTATION;
      window.setTimeout(() => {
        try {
          mermaidCodeInput.focus();
          mermaidCodeInput.select();
        } catch {}
      }, 0);
    });
    mermaidBuilderEnabled?.addEventListener('change', () => {
      const type = getSelectedMermaidType();
      if (!mermaidBuilderEnabled.checked) {
        setMermaidBuilderEnabled(false);
        return;
      }
      const builder = getMermaidBuilder(type);
      if (!builder) {
        setMermaidBuilderEnabled(false);
        if (mermaidBuilderEnabled) mermaidBuilderEnabled.checked = false;
        return;
      }
      const parsed = builder.parse(mermaidCodeInput?.value || '');
      if (parsed) {
        setMermaidBuilderData(type, parsed);
        if (typeof builder.afterParse === 'function') builder.afterParse(parsed);
        setMermaidBuilderEnabled(true, { reset: false });
      } else {
        setMermaidBuilderEnabled(true, { reset: true });
      }
    });
    mermaidBuilderResetBtn?.addEventListener('click', () => {
      setMermaidBuilderEnabled(true, { reset: true });
    });
    updateMermaidOrientationVisibility();
  }

  // View switching
  function setView(mode) {
    // mode: edit | split | reader
    editViewBtn.classList.toggle('active', mode === 'edit');
    splitViewBtn.classList.toggle('active', mode === 'split');
    readerViewBtn.classList.toggle('active', mode === 'reader');
    workspace.classList.remove('layout-edit', 'layout-reader');
    if (mode === 'edit') workspace.classList.add('layout-edit');
    if (mode === 'reader') workspace.classList.add('layout-reader');
    try { localStorage.setItem('md-view', mode); } catch {}
    document.body.classList.toggle('reader-mode', mode === 'reader');
    if (mode !== 'reader') {
      stopSpeech();
    }
    // Toolbar height may change; readjust
    adjustLayout();
    updatePreview();
    if (mode === 'reader' && window.enableReaderInput) {
      try { editor.focus(); editor.setSelectionRange(editor.value.length, editor.value.length); } catch {}
    }
  }

  editViewBtn.addEventListener('click', () => setView('edit'));
  splitViewBtn.addEventListener('click', () => setView('split'));
  readerViewBtn.addEventListener('click', () => setView('reader'));

  // Theme management (multiple themes, single cycle button)
  const themes = [
    { id: 'system', label: 'System', icon: '🖥️', dark: false },
    { id: 'light', label: 'Light', icon: '🌞', dark: false },
    { id: 'dark', label: 'Dark', icon: '🌙', dark: true },
    { id: 'black', label: 'Pitch Black', icon: '⬛', dark: true },
    { id: 'high-contrast', label: 'High Contrast', icon: '⚡', dark: true },
    { id: 'sepia', label: 'Sepia', icon: '📜', dark: false },
    { id: 'solarized-light', label: 'Solarized Light', icon: '🌤️', dark: false },
    { id: 'solarized-dark', label: 'Solarized Dark', icon: '🌌', dark: true },
  ];

  function findTheme(id) { return themes.find(t => t.id === id) || themes[0]; }
  function isDark(id) { return findTheme(id)?.dark; }

  // Track the saved preference and media listener for 'system'
  let currentThemePreference = null; // 'system' | concrete id (light/dark/black/...)
  let systemMql = null;

  function effectiveThemeFromPreference(prefId) {
    if (prefId === 'system') {
      const prefersDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      return prefersDark ? 'dark' : 'light';
    }
    return prefId;
  }

  function setSystemListenerEnabled(enabled) {
    try {
      if (systemMql && systemMql.removeEventListener) {
        systemMql.removeEventListener('change', onSystemSchemeChange);
      } else if (systemMql && systemMql.removeListener) {
        systemMql.removeListener(onSystemSchemeChange);
      }
    } catch {}
    if (enabled) {
      try {
        systemMql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        if (systemMql) {
          if (systemMql.addEventListener) systemMql.addEventListener('change', onSystemSchemeChange);
          else if (systemMql.addListener) systemMql.addListener(onSystemSchemeChange);
        }
      } catch {}
    }
  }

  function markThemeCurrentInMenu(id) {
    try {
      if (!themeMenu) return;
      themeMenu.querySelectorAll('button[data-theme]')?.forEach(btn => {
        btn.classList.toggle('current', btn.dataset.theme === id);
      });
    } catch {}
  }

  function onSystemSchemeChange() {
    // Re-apply without persisting to keep 'system' preference
    try { applyThemeName('system', { persist: false }); } catch {}
  }

  function applyThemeName(id, opts) {
    const options = opts || {};
    const persist = options.persist !== false; // default true
    const pref = findTheme(id)?.id || 'light';
    currentThemePreference = pref;
    if (persist) { try { localStorage.setItem('md-theme', pref); } catch {} }

    // Update menu highlight to reflect the preference (not effective theme)
    markThemeCurrentInMenu(pref);

    // If 'system', install listener; otherwise remove
    setSystemListenerEnabled(pref === 'system');

    // Compute effective theme and apply
    const effectiveId = effectiveThemeFromPreference(pref);
    document.body.dataset.theme = effectiveId;

    // Update theme cycle icon (sun for light-ish, moon for dark-ish)
    try {
      const icon = themeCycleBtn?.querySelector('iconify-icon');
      const darkish = !!isDark(effectiveId);
      if (icon) icon.setAttribute('icon', darkish ? 'lucide:moon' : 'lucide:sun');
      const label = findTheme(pref)?.label || pref;
      if (themeCycleBtn) themeCycleBtn.title = `Theme wechseln (aktuell: ${label})`;
    } catch {}

    // Update syntax highlighting theme based on effective dark/light
    const darkish = !!isDark(effectiveId);
    hljsThemeLink.href = darkish
      ? 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github-dark.min.css'
      : 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github.min.css';
    // Re-highlight to ensure contrast is right
    preview.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el));
  }

  // Theme menu setup
  function iconForTheme(id) {
    switch (id) {
      case 'system': return 'lucide:monitor';
      case 'light': return 'lucide:sun';
      case 'dark': return 'lucide:moon';
      case 'black': return 'mdi:brightness-2';
      case 'high-contrast': return 'mdi:contrast-circle';
      case 'sepia': return 'mdi:book-open-page-variant-outline';
      case 'solarized-light': return 'mdi:white-balance-sunny';
      case 'solarized-dark': return 'mdi:weather-night';
      default: return 'lucide:palette';
    }
  }
  function initThemeMenu() {
    if (!themeMenu) return;
    themeMenu.innerHTML = themes.map(t => `
      <button type="button" class="theme-item has-icon" data-theme="${t.id}" role="menuitem">
        <iconify-icon aria-hidden="true" icon="${iconForTheme(t.id)}"></iconify-icon>
        <span class="btn-label">${t.label}</span>
      </button>`).join('');
    themeMenu.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-theme]');
      if (!btn) return;
      const id = btn.dataset.theme;
      applyThemeName(id);
      // close menu
      themeMenu.classList.add('hidden');
    });
  }
  initThemeMenu();

  // Open/close the theme menu on button click
  themeCycleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!themeMenu) return;
    themeMenu.classList.toggle('hidden');
    // ensure current item is marked based on saved preference, falling back to current effective
    let saved = null;
    try { saved = localStorage.getItem('md-theme'); } catch {}
    const current = saved || currentThemePreference || document.body.dataset.theme || themes[0].id;
    markThemeCurrentInMenu(current);
  });
  // Close theme menu when clicking outside
  document.addEventListener('click', (e) => {
    if (themeMenu && !themeMenu.classList.contains('hidden')) {
      const withinTheme = themeMenu.contains(e.target) || themeCycleBtn?.contains(e.target);
      if (!withinTheme) themeMenu.classList.add('hidden');
    }
    if (importMenuVisible && importMenu && importBtn) {
      const withinImport = importMenu.contains(e.target) || importBtn.contains(e.target);
      if (!withinImport) closeImportMenu();
    }
    if (exportMenuVisible && exportMenu && exportBtn) {
      const withinExport = exportMenu.contains(e.target) || exportBtn.contains(e.target);
      if (!withinExport) closeExportMenu();
    }
    if (learningMenuVisible && learningMenu && learningBtn) {
      const withinLearning = learningMenu.contains(e.target) || learningBtn.contains(e.target);
      if (!withinLearning) closeLearningMenu();
    }
    if (headingMenuVisible && headingMenu && headingMoreBtn) {
      const withinHeading = headingMenu.contains(e.target) || headingMoreBtn.contains(e.target);
      if (!withinHeading) closeHeadingMenu();
    }
    if (videoMenuVisible && videoMenu && videoMenuBtn) {
      const withinVideo = videoMenu.contains(e.target) || videoMenuBtn.contains(e.target);
      if (!withinVideo) closeVideoMenu();
    }
  });

  versionsToggleBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleVersionsPanel();
  });
  versionsCloseBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleVersionsPanel(false);
  });
  versionsOverlay?.addEventListener('click', () => toggleVersionsPanel(false));
  versionsSnapshotBtn?.addEventListener('click', () => {
    const note = versionsNoteInput?.value || '';
    createSnapshot(note);
  });
  versionsNoteInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      createSnapshot(versionsNoteInput.value || '');
    }
  });
  versionsRestoreBtn?.addEventListener('click', () => restoreSelectedSnapshot());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && versionsPanel && !versionsPanel.classList.contains('hidden')) {
      toggleVersionsPanel(false);
    }
  });

  // Fullscreen toggle button
  function isFullscreenSupported() {
    if (!document) return false;
    return !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled ||
      document.documentElement?.requestFullscreen ||
      document.documentElement?.webkitRequestFullscreen ||
      document.documentElement?.mozRequestFullScreen ||
      document.documentElement?.msRequestFullscreen
    );
  }

  function isFullscreenActive() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  function enterFullscreen() {
    const el = document.documentElement;
    let result;
    if (el.requestFullscreen) result = el.requestFullscreen();
    else if (el.webkitRequestFullscreen) result = el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) result = el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) result = el.msRequestFullscreen();
    else return Promise.reject(new Error('Fullscreen API nicht verfügbar'));
    return Promise.resolve(result);
  }

  function exitFullscreen() {
    let result;
    if (document.exitFullscreen) result = document.exitFullscreen();
    else if (document.webkitExitFullscreen) result = document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) result = document.mozCancelFullScreen();
    else if (document.msExitFullscreen) result = document.msExitFullscreen();
    else return Promise.reject(new Error('Fullscreen API nicht verfügbar'));
    return Promise.resolve(result);
  }

  function updateFullscreenButton() {
    if (!fullscreenToggleBtn) return;
    const supported = isFullscreenSupported();
    if (!supported) {
      fullscreenToggleBtn.disabled = true;
      fullscreenToggleBtn.setAttribute('aria-disabled', 'true');
      fullscreenToggleBtn.setAttribute('aria-pressed', 'false');
      fullscreenToggleBtn.title = 'Vollbildmodus wird von diesem Browser nicht unterstützt';
      const icon = fullscreenToggleBtn.querySelector('iconify-icon');
      if (icon) icon.setAttribute('icon', 'lucide:maximize-2');
      return;
    }

    fullscreenToggleBtn.disabled = false;
    fullscreenToggleBtn.removeAttribute('aria-disabled');
    const active = isFullscreenActive();
    fullscreenToggleBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    fullscreenToggleBtn.title = active ? 'Vollbildmodus verlassen (Esc)' : 'Vollbildmodus aktivieren';
    const icon = fullscreenToggleBtn.querySelector('iconify-icon');
    if (icon) icon.setAttribute('icon', active ? 'lucide:minimize-2' : 'lucide:maximize-2');
  }

  async function toggleFullscreen() {
    if (!isFullscreenSupported()) return;
    const active = isFullscreenActive();
    try {
      if (active) {
        await exitFullscreen();
      } else {
        await enterFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle failed', err);
    } finally {
      updateFullscreenButton();
    }
  }

  if (fullscreenToggleBtn) {
    fullscreenToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFullscreen();
    });
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach((evt) => {
    document.addEventListener(evt, updateFullscreenButton);
  });
  updateFullscreenButton();

  // File actions
  function estimatePdfFontSize(item) {
    if (!item) return 0;
    if (typeof item.height === 'number') {
      return Math.abs(item.height);
    }
    if (typeof item.fontSize === 'number') {
      return Math.abs(item.fontSize);
    }
    if (Array.isArray(item.transform) && item.transform.length >= 4) {
      const scaleX = Number.isFinite(item.transform[0]) ? Math.abs(item.transform[0]) : 0;
      const scaleY = Number.isFinite(item.transform[3]) ? Math.abs(item.transform[3]) : 0;
      return Math.max(scaleX, scaleY);
    }
    return 0;
  }

  function decoratePdfLinesWithHeadings(lines) {
    const fontSizes = lines.map((l) => l.fontSize).filter((size) => size > 0).sort((a, b) => a - b);
    const medianIndex = fontSizes.length ? Math.floor(fontSizes.length / 2) : -1;
    const medianFontSize = medianIndex >= 0 ? fontSizes[medianIndex] : 0;
    const maxFontSize = fontSizes.length ? fontSizes[fontSizes.length - 1] : 0;

    return lines.map((line, index) => {
      let text = line.text.trim();
      if (!text) return '';

      const fontSize = line.fontSize || 0;
      const normalized = text.replace(/^#+\s*/, '');
      const looksSentence = /[.!?]\s*$/.test(normalized);
      const shortEnough = normalized.length <= 120;
      let shouldHeading = false;

      if (fontSize && medianFontSize && fontSize >= medianFontSize * 1.25 && shortEnough && !looksSentence) {
        shouldHeading = true;
      } else if (index === 0 && fontSize && maxFontSize && fontSize >= maxFontSize * 0.95 && shortEnough && !looksSentence) {
        shouldHeading = true;
      }

      if (shouldHeading) {
        text = `# ${normalized}`;
      } else {
        text = normalized;
      }

      return text;
    });
  }

  async function importPdfFile(file, { suggestedName } = {}) {
    if (!file) return false;
    if (!window.pdfjsLib) {
      alert('PDF-Import ist nicht verfügbar (pdf.js konnte nicht geladen werden).');
      return false;
    }

    setStatus('PDF wird importiert…');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const lines = [];
        let currentLine = [];
        let currentFontSize = 0;
        const segments = [];

        for (const item of content.items) {
          const raw = (item.str || '').replace(/\u00a0/g, ' ');
          const text = raw.replace(/\s+/g, ' ').trim();
          if (!text) continue;
          currentLine.push(text);
          const fontSize = estimatePdfFontSize(item);
          if (fontSize > currentFontSize) {
            currentFontSize = fontSize;
          }
          if (item.hasEOL) {
            const joined = currentLine.join(' ').replace(/\s+/g, ' ').trim();
            if (joined) {
              lines.push({ text: joined, fontSize: currentFontSize });
            }
            currentLine = [];
            currentFontSize = 0;
          }
        }

        if (currentLine.length) {
          const joined = currentLine.join(' ').replace(/\s+/g, ' ').trim();
          if (joined) {
            lines.push({ text: joined, fontSize: currentFontSize });
          }
        }

        const decoratedLines = decoratePdfLinesWithHeadings(lines);
        const pageText = decoratedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        if (pageText) {
          segments.push(pageText);
        }

        try {
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/png');
          if (dataUrl) {
            segments.push(`![PDF Seite ${pageNum}](${dataUrl})`);
          }
          canvas.width = 0;
          canvas.height = 0;
        } catch (renderErr) {
          console.warn('PDF page render fehlgeschlagen', renderErr);
        }

        if (segments.length) {
          pages.push(segments.join('\n\n'));
        }
      }

      const finalText = pages.join('\n\n').trim();
      resetEmbeddedMediaStore();
      editor.value = finalText ? `${finalText}\n` : '';
      normalizeEditorMedia();
      updatePreview();
      updateCursorInfo();
      updateWordCount();
      editor.focus();
      markDirty(true);

      const baseName = suggestedName || file.name.replace(/\.pdf$/i, '.md');
      if (baseName) setFileName(baseName);
      fileHandle = null;
      setStatus('PDF importiert – Änderungen nicht gespeichert');
      return true;
    } catch (err) {
      console.error(err);
      setStatus('PDF-Import fehlgeschlagen');
      alert('PDF-Import fehlgeschlagen: ' + (err?.message || err));
      return false;
    }
  }

  async function importDocxFile(file, { suggestedName } = {}) {
    if (!file) return false;
    if (!window.mammoth) {
      alert('Word-Import ist nicht verfügbar (mammoth.js konnte nicht geladen werden).');
      return false;
    }
    const td = getTurndownService();
    if (!td) {
      alert('Word-Import ist nicht verfügbar (Turndown konnte nicht geladen werden).');
      return false;
    }

    setStatus('Word-Dokument wird importiert…');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const inlineImageConverter = window.mammoth?.images?.inline
        ? window.mammoth.images.inline(async (element) => {
            try {
              const data = await element.read('base64');
              return { src: `data:${element.contentType};base64,${data}` };
            } catch (imageErr) {
              console.warn('Word-Bild konnte nicht konvertiert werden', imageErr);
              return {};
            }
          })
        : undefined;
      const mammothOptions = {
        includeDefaultStyleMap: true,
        convertImage: inlineImageConverter,
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => h2:fresh",
          "p[style-name='Überschrift 1'] => h1:fresh",
          "p[style-name='Überschrift 2'] => h2:fresh",
        ],
      };
      const result = await window.mammoth.convertToHtml({ arrayBuffer }, mammothOptions);
      const rawHtml = result?.value || '';
      const sanitizedHtml = window.DOMPurify ? window.DOMPurify.sanitize(rawHtml, SANITIZE_MARKDOWN_OPTIONS) : rawHtml;
      const markdown = sanitizedHtml ? td.turndown(sanitizedHtml).trim() : '';
      resetEmbeddedMediaStore();
      editor.value = markdown ? `${markdown}\n` : '';
      normalizeEditorMedia();
      updatePreview();
      updateCursorInfo();
      updateWordCount();
      editor.focus();
      markDirty(true);

      const baseName = suggestedName || file.name.replace(/\.docx$/i, '.md');
      if (baseName) setFileName(baseName);
      fileHandle = null;
      setStatus('Word-Dokument importiert – Änderungen nicht gespeichert');
      return true;
    } catch (err) {
      console.error(err);
      setStatus('Word-Import fehlgeschlagen');
      alert('Word-Import fehlgeschlagen: ' + (err?.message || err));
      return false;
    }
  }

  const importConfig = {
    pdf: {
      pickerTypes: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
      hiddenInput: hiddenPdf,
      importer: importPdfFile,
      suggestName: (name) => name.replace(/\.pdf$/i, '.md'),
    },
    docx: {
      pickerTypes: [{
        description: 'Word-Dokument',
        accept: {
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
      }],
      hiddenInput: hiddenDocx,
      importer: importDocxFile,
      suggestName: (name) => name.replace(/\.docx$/i, '.md'),
    },
  };

  async function handleImportFile(kind, file) {
    if (!file) return;
    const config = importConfig[kind];
    if (!config || typeof config.importer !== 'function') return;
    const suggestedName = typeof config.suggestName === 'function' ? config.suggestName(file.name) : undefined;
    await config.importer(file, { suggestedName });
  }

  async function startImportFlow(kind) {
    const config = importConfig[kind];
    if (!config) return;
    if (supportsFSA()) {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: config.pickerTypes,
          excludeAcceptAllOption: true,
        });
        const file = await handle.getFile();
        await handleImportFile(kind, file);
      } catch (err) {
        // dialog cancelled
      }
    } else if (config.hiddenInput) {
      config.hiddenInput.value = '';
      config.hiddenInput.click();
    }
  }

  async function doOpenFile() {
    if (supportsFSA()) {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown'] } }],
          excludeAcceptAllOption: true,
        });
        const file = await handle.getFile();
        const text = await file.text();
        resetEmbeddedMediaStore();
        editor.value = text;
        normalizeEditorMedia();
        setFileName(file.name);
        fileHandle = handle;
        updatePreview();
        updateCursorInfo();
        updateWordCount();
        markDirty(false);
      } catch (err) {
        // user canceled
      }
    } else {
      hiddenFile.value = '';
      hiddenFile.click();
    }
  }

  hiddenFile.addEventListener('change', async () => {
    const file = hiddenFile.files && hiddenFile.files[0];
    if (!file) return;
    const text = await file.text();
    resetEmbeddedMediaStore();
    editor.value = text;
    normalizeEditorMedia();
    setFileName(file.name);
    fileHandle = null;
    updatePreview();
    updateCursorInfo();
    updateWordCount();
    markDirty(false);
  });

  buildTemplateIndex();
  loadTemplateFavorites();
  templateInsertBtn?.setAttribute('disabled', 'disabled');
  templateFavoriteBtn?.setAttribute('disabled', 'disabled');
  templatePreviewExpandBtn?.setAttribute('disabled', 'disabled');
  setTemplateAiStatus('');
  updateTemplateAiButton(false);
  templateAiComposer?.classList.add('hidden');
  templateAiComposer?.setAttribute('aria-hidden', 'true');
  templatePreviewModal?.classList.add('hidden');
  templatePreviewModal?.setAttribute('aria-hidden', 'true');
  templatesPanel?.setAttribute('aria-hidden', 'true');
  templatesOverlay?.setAttribute('aria-hidden', 'true');

  templatesToggleBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setTemplatesVisible(!templatesVisible);
  });
  templatesOverlay?.addEventListener('click', () => {
    closeTemplatesPanel();
    templatesToggleBtn?.focus({ preventScroll: true });
  });
  templatesCloseBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeTemplatesPanel();
    templatesToggleBtn?.focus({ preventScroll: true });
  });
  templateSearchInput?.addEventListener('input', () => {
    currentTemplateSearch = templateSearchInput.value.trim();
    renderTemplateList();
  });
  templateInsertBtn?.addEventListener('click', () => {
    const isAi = templateInsertBtn.getAttribute('data-template-ai') === 'true';
    if (isAi && templateAiDraft && templateAiDraft.content) {
      insertTemplateSnippet(templateAiDraft);
      closeTemplatesPanel();
      setTimeout(() => { try { editor.focus({ preventScroll: true }); } catch {} }, 0);
      return;
    }
    const dataId = templateInsertBtn.getAttribute('data-template-id');
    const targetId = dataId || currentTemplateSelection;
    if (!targetId) return;
    const snippet = templateIndex.get(targetId);
    if (snippet) {
      insertTemplateSnippet(snippet);
      closeTemplatesPanel();
      setTimeout(() => { try { editor.focus({ preventScroll: true }); } catch {} }, 0);
    }
  });
  templateFavoriteBtn?.addEventListener('click', () => {
    const id = templateFavoriteBtn.getAttribute('data-template-id');
    if (!id) return;
    toggleTemplateFavorite(id);
    renderTemplateCategories();
    renderTemplateList();
  });
  templateAiGenerateBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (templateAiAbortController) {
      handleTemplateAiGenerate();
      return;
    }
    if (!templateAiComposerOpen) {
      openTemplateAiComposer();
      if (!(templateAiPromptInput?.value || '').trim()) {
        setTemplateAiPromptMessage('Beschreibe kurz, welche Vorlage die KI erzeugen soll.');
      }
      return;
    }
    handleTemplateAiGenerate();
  });
  templateAiPromptSubmit?.addEventListener('click', (e) => {
    e.preventDefault();
    handleTemplateAiGenerate();
  });
  templateAiPromptClose?.addEventListener('click', (e) => {
    e.preventDefault();
    if (templateAiAbortController) {
      handleTemplateAiGenerate();
      return;
    }
    closeTemplateAiComposer();
  });
  templateAiPromptCancel?.addEventListener('click', (e) => {
    e.preventDefault();
    if (templateAiAbortController) {
      handleTemplateAiGenerate();
      return;
    }
    closeTemplateAiComposer();
  });
  templateAiPromptInput?.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleTemplateAiGenerate();
    }
  });
  templatePreviewExpandBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openTemplatePreviewModal();
  });
  templatePreviewModalClose?.addEventListener('click', (e) => {
    e.preventDefault();
    closeTemplatePreviewModal();
    try { templatePreviewExpandBtn?.focus({ preventScroll: true }); } catch {}
  });
  templatePreviewModal?.addEventListener('click', (e) => {
    if (e.target === templatePreviewModal) {
      closeTemplatePreviewModal();
      try { templatePreviewExpandBtn?.focus({ preventScroll: true }); } catch {}
    }
  });
  templatesPanel?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeTemplatesPanel();
      templatesToggleBtn?.focus({ preventScroll: true });
    }
  });

  if (importBtn && importMenu) {
    importBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (importMenuVisible) {
        closeImportMenu();
      } else {
        setImportMenuVisible(true);
      }
    });

    importBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setImportMenuVisible(true);
        const firstItem = importMenu.querySelector('button[data-import]');
        firstItem?.focus({ preventScroll: true });
      } else if (e.key === 'Escape' && importMenuVisible) {
        e.preventDefault();
        closeImportMenu();
      }
    });
  }

  importMenu?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-import]');
    if (!btn) return;
    e.preventDefault();
    closeImportMenu();
    try {
      await startImportFlow(btn.dataset.import);
    } catch (err) {
      console.error('Import fehlgeschlagen', err);
    }
  });

  importMenu?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeImportMenu();
      importBtn?.focus();
    }
  });

  importMenu?.addEventListener('focusout', (e) => {
    if (!importMenuVisible) return;
    const next = e.relatedTarget;
    if (!next) return;
    if (importMenu.contains(next) || importBtn?.contains(next)) return;
    closeImportMenu();
  });

  if (videoMenuBtn && videoMenu) {
    videoMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setVideoMenuVisible(!videoMenuVisible);
      if (videoMenuVisible) {
        const first = videoMenu.querySelector('button[data-video-action]');
        first?.focus({ preventScroll: true });
      }
    });

    videoMenuBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setVideoMenuVisible(true);
        const first = videoMenu.querySelector('button[data-video-action]');
        first?.focus({ preventScroll: true });
      } else if (e.key === 'Escape' && videoMenuVisible) {
        e.preventDefault();
        closeVideoMenu();
      }
    });
  }

  videoMenu?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-video-action]');
    if (!btn) return;
    e.preventDefault();
    const action = btn.dataset.videoAction;
    closeVideoMenu();
    if (action === 'file') {
      chooseVideoFile();
    } else if (action === 'url') {
      startVideoInsertFlow('url');
    }
  });

  videoMenu?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeVideoMenu();
      videoMenuBtn?.focus();
    }
  });

  videoMenu?.addEventListener('focusout', (e) => {
    if (!videoMenuVisible) return;
    const next = e.relatedTarget;
    if (!next) return;
    if (videoMenu.contains(next) || videoMenuBtn?.contains(next)) return;
    closeVideoMenu();
  });

  if (exportBtn && exportMenu) {
    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (exportMenuVisible) {
        closeExportMenu();
      } else {
        setExportMenuVisible(true);
      }
    });

    exportBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setExportMenuVisible(true);
        const firstItem = exportMenu.querySelector('button[data-export]');
        firstItem?.focus({ preventScroll: true });
      } else if (e.key === 'Escape' && exportMenuVisible) {
        e.preventDefault();
        closeExportMenu();
      }
    });
  }

  const EXPORT_ACTIONS = {
    html: () => doExportHtml(),
    pdf: () => doExportPdf(),
    website: () => openWebsiteModal(),
  };

  exportMenu?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-export]');
    if (!btn) return;
    e.preventDefault();
    closeExportMenu();
    const action = btn.dataset.export;
    const handler = EXPORT_ACTIONS[action];
    try {
      handler?.();
    } catch (err) {
      console.error('Export fehlgeschlagen', err);
    }
  });

  exportMenu?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeExportMenu();
      exportBtn?.focus();
    }
  });

  exportMenu?.addEventListener('focusout', (e) => {
    if (!exportMenuVisible) return;
    const next = e.relatedTarget;
    if (!next) return;
    if (exportMenu.contains(next) || exportBtn?.contains(next)) return;
    closeExportMenu();
  });

  if (learningBtn && learningMenu) {
    learningBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (learningMenuVisible) {
        closeLearningMenu();
      } else {
        closeImportMenu();
        closeExportMenu();
        setLearningMenuVisible(true);
      }
    });

    learningBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        closeImportMenu();
        closeExportMenu();
        setLearningMenuVisible(true);
        const firstItem = learningMenu.querySelector('button[data-learning]');
        firstItem?.focus({ preventScroll: true });
      } else if (e.key === 'Escape' && learningMenuVisible) {
        e.preventDefault();
        closeLearningMenu();
      }
    });
  }

  learningMenu?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-learning]');
    if (!btn) return;
    e.preventDefault();
    closeLearningMenu();
    try {
      openLearningModal(btn.dataset.learning || '');
    } catch (err) {
      console.error('Lernmodus konnte nicht geöffnet werden', err);
    }
  });

  learningMenu?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLearningMenu();
      learningBtn?.focus();
    }
  });

  learningMenu?.addEventListener('focusout', (e) => {
    if (!learningMenuVisible) return;
    const next = e.relatedTarget;
    if (!next) return;
    if (learningMenu.contains(next) || learningBtn?.contains(next)) return;
    closeLearningMenu();
  });

  websiteOverlay?.addEventListener('click', (e) => {
    if (e.target === websiteOverlay) closeWebsiteModal();
  });

  learningOverlay?.addEventListener('click', (e) => {
    if (e.target !== learningOverlay) return;
    if (learningModalFullscreen) {
      setLearningFullscreen(false);
    } else {
      closeLearningModal();
    }
  });

  websiteCloseBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeWebsiteModal();
  });

  learningCloseBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeLearningModal();
  });

  learningFullscreenBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const next = !learningModalFullscreen;
    setLearningFullscreen(next);
    if (next) {
      try { learningModal?.focus({ preventScroll: true }); } catch {}
    }
  });

  websiteCloseFooterBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeWebsiteModal();
  });

  learningCloseFooterBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeLearningModal();
  });

  websiteCopyHtmlBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await copyWebsiteHtmlToClipboard();
  });

  learningCopyHtmlBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await copyLearningHtmlToClipboard();
  });

  websiteDownloadBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    downloadWebsiteHtmlFile();
  });

  learningDownloadBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    downloadLearningHtmlFile();
  });

  websiteRegenerateBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    generateWebsitePreview();
  });

  learningRegenerateBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    generateLearningPreview();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (learningModalOpen) {
        e.preventDefault();
        if (learningModalFullscreen) {
          setLearningFullscreen(false);
        } else {
          closeLearningModal();
        }
        return;
      }
      if (websiteModalOpen) {
        e.preventDefault();
        closeWebsiteModal();
      }
    }
  });

  hiddenPdf?.addEventListener('change', async () => {
    const file = hiddenPdf.files && hiddenPdf.files[0];
    hiddenPdf.value = '';
    await handleImportFile('pdf', file);
  });

  hiddenDocx?.addEventListener('change', async () => {
    const file = hiddenDocx.files && hiddenDocx.files[0];
    hiddenDocx.value = '';
    await handleImportFile('docx', file);
  });

  async function doSaveFile() {
    if (supportsFSA() && fileHandle) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(getResolvedMarkdown());
        await writable.close();
        markDirty(false);
      } catch (err) {
        console.error(err);
        setStatus('Speichern fehlgeschlagen');
      }
    } else {
      await doSaveFileAs();
    }
  }

  async function doSaveFileAs() {
    if (supportsFSA()) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: currentFileName || getSuggestedName(),
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
          excludeAcceptAllOption: false,
        });
        const writable = await handle.createWritable();
        await writable.write(getResolvedMarkdown());
        await writable.close();
        fileHandle = handle;
        setFileName(handle.name);
        markDirty(false);
      } catch (_) {}
    } else {
      // Fallback: download
      const blob = new Blob([getResolvedMarkdown()], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = currentFileName || getSuggestedName();
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
      markDirty(false);
    }
  }

  function doNewFile() {
    if (dirty && !confirm('Nicht gespeicherte Änderungen verwerfen?')) return;
    editor.value = '';
    resetEmbeddedMediaStore();
    setFileName('');
    fileHandle = null;
    updatePreview();
    updateCursorInfo();
    updateWordCount();
    markDirty(false);
  }

  function doExportHtml() {
    const md = getResolvedMarkdown();
    const html = marked.parse(md);
    const safe = DOMPurify.sanitize(html, SANITIZE_MARKDOWN_OPTIONS);
    const title = extractTitle(md) || (currentFileName ? currentFileName.replace(/\.[^.]+$/, '') : 'Export');
    const doc = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github.min.css">
  <style>
    :root { --bg:#fff; --text:#1f2328; --border:#d0d7de; }
    @media (prefers-color-scheme: dark) { :root { --bg:#0d1117; --text:#e6edf3; --border:#30363d; } }
    body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial; }
    .container { max-width: 860px; margin: 40px auto; padding: 0 20px; }
    .markdown-body h1,.markdown-body h2,.markdown-body h3{ border-bottom:1px solid var(--border); padding-bottom:4px; }
    .markdown-body pre { background: rgba(127,127,127,0.06); border:1px solid var(--border); padding:12px; border-radius:6px; overflow:auto; }
    .markdown-body blockquote { color:#6a737d; border-left:4px solid var(--border); margin:0; padding:0 12px; }
    .markdown-body table { border-collapse:collapse; width:100%; }
    .markdown-body th,.markdown-body td { border:1px solid var(--border); padding:6px 8px; }
    .markdown-body .embedded-video { width:100%; max-width:100%; display:block; margin:16px 0; border:0; }
    .markdown-body iframe.embedded-video { aspect-ratio:16/9; height:auto; border:0; }
    .markdown-body video.embedded-video { height:auto; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js"></script>
  <script>window.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('pre code').forEach(el=>hljs.highlightElement(el)));</script>
</head>
<body>
  <div class="container">
    <article class="markdown-body">${safe}</article>
  </div>
</body>
</html>`;
    const blob = new Blob([doc], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (toSafeFileName(title) || 'Export') + '.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function extractTitle(md) {
    const m = md.match(/^\s*#\s+(.+)/m);
    return m ? m[1].trim() : '';
  }

  function escapeHtml(s) { return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }

  // Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 's') {
    e.preventDefault(); if (e.shiftKey) doSaveFileAs(); else doSaveFile();
  } else if (mod && e.key.toLowerCase() === 'o') {
    e.preventDefault(); doOpenFile();
  } else if (mod && e.key.toLowerCase() === 'n') {
    e.preventDefault(); doNewFile();
  } else if (mod && e.key.toLowerCase() === 'b') {
    e.preventDefault(); toggleWrapSelection(editor, ['**', '**']); updatePreview(); markDirty(true);
  } else if (mod && e.key.toLowerCase() === 'i') {
    e.preventDefault(); toggleWrapSelection(editor, ['*', '*']); updatePreview(); markDirty(true);
  } else if (mod && e.key.toLowerCase() === 'k') {
    e.preventDefault(); insertLink(); updatePreview(); markDirty(true);
  } else if (mod && e.key.toLowerCase() === 'g') {
    e.preventDefault(); editorGenerateAI();
  } else if (mod && e.key === 'Enter') {
    // Alternative Trigger für KI‑Generierung
    e.preventDefault(); editorGenerateAI();
  } else if (e.key === 'Escape' && templatePreviewModal && !templatePreviewModal.classList.contains('hidden')) {
    e.preventDefault();
    closeTemplatePreviewModal();
    try { templatePreviewExpandBtn?.focus({ preventScroll: true }); } catch {}
  } else if (e.key === 'Escape' && templateAiComposerOpen && !templateAiAbortController) {
    e.preventDefault();
    closeTemplateAiComposer();
  } else if (e.key === 'Escape' && templatesVisible) {
    e.preventDefault();
    closeTemplatesPanel();
    templatesToggleBtn?.focus({ preventScroll: true });
  } else if (e.key === 'Escape' && inlineGenerator.isRunning()) {
    e.preventDefault();
    inlineGenerator.abort();
  }
});

// Zusätzlicher globaler Listener im Capture‑Modus für mehr Zuverlässigkeit
// (unterbindet Browser‑Defaults wie Suchen/Seite speichern, wo erlaubt)
try {
  if (!window.__mdKeyHandlerInstalled) {
    window.addEventListener('keydown', (e) => {
      const mod = e.metaKey || e.ctrlKey;
      const k = (e.key || '').toLowerCase();
  // Nur für unsere bekannten Kürzel eingreifen (keine rohe Enter-Taste!)
  if (mod && (k === 's' || k === 'o' || k === 'n' || k === 'b' || k === 'i' || k === 'k' || k === 'g' || k === 'enter')) {
        // Verhindere doppelte Ausführung
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Delegiere an obige Logik (wird nicht erneut laufen, da gestoppt)
        if (k === 's') { if (e.shiftKey) doSaveFileAs(); else doSaveFile(); return; }
        if (k === 'o') { doOpenFile(); return; }
        if (k === 'n') { doNewFile(); return; }
        if (k === 'b') { toggleWrapSelection(editor, ['**', '**']); updatePreview(); markDirty(true); return; }
        if (k === 'i') { toggleWrapSelection(editor, ['*', '*']); updatePreview(); markDirty(true); return; }
        if (k === 'k') { insertLink(); updatePreview(); markDirty(true); return; }
    if (k === 'g' || k === 'enter') { editorGenerateAI(); return; }
  }
    }, { capture: true });
    window.__mdKeyHandlerInstalled = true;
  }
} catch {}

  // Button events
  newBtn.addEventListener('click', doNewFile);
  openBtn.addEventListener('click', doOpenFile);
  saveBtn.addEventListener('click', doSaveFile);
  saveAsBtn.addEventListener('click', doSaveFileAs);
  undoBtn?.addEventListener('click', () => { try { editor.focus(); document.execCommand('undo'); } catch {} updatePreview(); updateCursorInfo(); updateWordCount(); markDirty(true); });
  redoBtn?.addEventListener('click', () => { try { editor.focus(); document.execCommand('redo'); } catch {} updatePreview(); updateCursorInfo(); updateWordCount(); markDirty(true); });
  aiGenerateBtn?.addEventListener('click', () => {
    // Only toggle the inline panel; do not start/abort generation here
    if (aiInline) {
      const open = aiInline.classList.contains('hidden');
      aiInline.classList.toggle('hidden', !open);
      adjustLayout();
      if (aiUseSelection) {
        const hasSel = (editor.selectionEnd ?? 0) > (editor.selectionStart ?? 0);
        aiUseSelection.checked = !!hasSel;
      }
      if (aiGenInfo) {
        const info = resolveCurrentProviderInfo();
        if (info.provider === 'ollama') {
          aiGenInfo.textContent = `Modell: ${info.model} • URL: ${info.base}`;
        } else if (info.provider === 'gemini') {
          aiGenInfo.textContent = `Modell: ${info.model} • Anbieter: Gemini`;
        } else {
          aiGenInfo.textContent = `Modell: ${info.model} • Anbieter: Mistral`;
        }
      }
      setTimeout(() => aiPromptInput?.focus(), 0);
      return;
    }
    // Fallback if no inline panel exists
    try { editorGenerateAI(); } catch {}
  });
  aiGenStartBtn?.addEventListener('click', editorGenerateAI);
  aiGenAbortBtn?.addEventListener('click', () => { inlineGenerator.abort(); });
  aiGenResetBtn?.addEventListener('click', () => { inlineGenerator.reset(); });
  // Enter in prompt field triggers generate; Enter again aborts
  aiPromptInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      if (inlineGenerator.isRunning()) {
        inlineGenerator.abort();
      } else {
        editorGenerateAI();
      }
    }
    // Cmd/Ctrl+Enter also triggers
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'Enter') {
      e.preventDefault();
      if (inlineGenerator.isRunning()) {
        inlineGenerator.abort();
      } else {
        editorGenerateAI();
      }
    }
  });
  // Presets dropdown

  // Chat logic
  function setOllamaStatus(msg, ok = false) {
    if (!ollamaStatus) return;
    ollamaStatus.textContent = msg || '';
    ollamaStatus.style.color = ok ? 'var(--accent)' : 'var(--muted)';
  }

  function loadOllamaSettings() {
    try {
      const url = localStorage.getItem('ollama-url') || 'http://localhost:11434';
      const model = localStorage.getItem('ollama-model') || 'llama3.1:8b';
      if (ollamaUrlInput) ollamaUrlInput.value = url;
      if (ollamaModelInput) ollamaModelInput.value = model;
      if (ollamaModelSelect) ollamaModelSelect.value = '';
    } catch {}
  }

  function saveOllamaSettings() {
    try {
      const url = (ollamaUrlInput?.value || '').trim();
      const model = (ollamaModelInput?.value || '').trim();
      if (url) localStorage.setItem('ollama-url', url);
      if (model) localStorage.setItem('ollama-model', model);
      setOllamaStatus('Gespeichert', true);
    } catch {}
  }

  function setOpenAiStatus(msg, ok = false) {
    if (!openaiStatus) return;
    openaiStatus.textContent = msg || '';
    openaiStatus.style.color = ok ? 'var(--accent)' : 'var(--muted)';
  }
  function loadOpenAiSettings() {
    try {
      const apiKey = localStorage.getItem('openai-api-key') || '';
      const base = localStorage.getItem('openai-base') || 'https://api.openai.com/v1';
      const model = localStorage.getItem('openai-model') || 'gpt-4o-mini';
      if (openaiApiKeyInput) openaiApiKeyInput.value = apiKey;
      if (openaiBaseInput) openaiBaseInput.value = base;
      if (openaiModelInput) openaiModelInput.value = model;
      if (openaiModelSelect) openaiModelSelect.value = '';
    } catch {}
  }
  function saveOpenAiSettings() {
    try {
      const apiKey = (openaiApiKeyInput?.value || '').trim();
      const base = (openaiBaseInput?.value || '').trim();
      const model = (openaiModelInput?.value || '').trim();
      if (apiKey) localStorage.setItem('openai-api-key', apiKey);
      if (base) localStorage.setItem('openai-base', base);
      if (model) localStorage.setItem('openai-model', model);
      setOpenAiStatus('Gespeichert', true);
    } catch {}
  }

  function setClaudeStatus(msg, ok = false) {
    if (!claudeStatus) return;
    claudeStatus.textContent = msg || '';
    claudeStatus.style.color = ok ? 'var(--accent)' : 'var(--muted)';
  }
  function loadClaudeSettings() {
    try {
      const apiKey = localStorage.getItem('claude-api-key') || '';
      const base = localStorage.getItem('claude-base') || 'https://api.anthropic.com';
      const model = localStorage.getItem('claude-model') || 'claude-3-5-sonnet-latest';
      if (claudeApiKeyInput) claudeApiKeyInput.value = apiKey;
      if (claudeBaseInput) claudeBaseInput.value = base;
      if (claudeModelInput) claudeModelInput.value = model;
      if (claudeModelSelect) claudeModelSelect.value = '';
    } catch {}
  }
  function saveClaudeSettings() {
    try {
      const apiKey = (claudeApiKeyInput?.value || '').trim();
      const base = (claudeBaseInput?.value || '').trim();
      const model = (claudeModelInput?.value || '').trim();
      if (apiKey) localStorage.setItem('claude-api-key', apiKey);
      if (base) localStorage.setItem('claude-base', base);
      if (model) localStorage.setItem('claude-model', model);
      setClaudeStatus('Gespeichert', true);
    } catch {}
  }

  // Gemini settings
  function setGeminiStatus(msg, ok = false) {
    if (!geminiStatus) return;
    geminiStatus.textContent = msg || '';
    geminiStatus.style.color = ok ? 'var(--accent)' : 'var(--muted)';
  }
  function loadGeminiSettings() {
    try {
      const apiKey = localStorage.getItem('gemini-api-key') || '';
      const model = localStorage.getItem('gemini-model') || 'gemini-1.5-flash';
      if (geminiApiKeyInput) geminiApiKeyInput.value = apiKey;
      if (geminiModelInput) geminiModelInput.value = model;
      if (geminiModelSelect) geminiModelSelect.value = '';
    } catch {}
  }
  function saveGeminiSettings() {
    try {
      const apiKey = (geminiApiKeyInput?.value || '').trim();
      const model = (geminiModelInput?.value || '').trim();
      if (apiKey) localStorage.setItem('gemini-api-key', apiKey);
      if (model) localStorage.setItem('gemini-model', model);
      setGeminiStatus('Gespeichert', true);
    } catch {}
  }
  // Mistral settings
  function setMistralStatus(msg, ok = false) {
    if (!mistralStatus) return;
    mistralStatus.textContent = msg || '';
    mistralStatus.style.color = ok ? 'var(--accent)' : 'var(--muted)';
  }
  function loadMistralSettings() {
    try {
      const apiKey = localStorage.getItem('mistral-api-key') || '';
      const model = localStorage.getItem('mistral-model') || 'mistral-small-latest';
      if (mistralApiKeyInput) mistralApiKeyInput.value = apiKey;
      if (mistralModelInput) mistralModelInput.value = model;
      if (mistralModelSelect) mistralModelSelect.value = '';
    } catch {}
  }
  function saveMistralSettings() {
    try {
      const apiKey = (mistralApiKeyInput?.value || '').trim();
      const model = (mistralModelInput?.value || '').trim();
      if (apiKey) localStorage.setItem('mistral-api-key', apiKey);
      if (model) localStorage.setItem('mistral-model', model);
      setMistralStatus('Gespeichert', true);
    } catch {}
  }
  async function fetchMistralModels(apiKey) {
    const key = (apiKey || localStorage.getItem('mistral-api-key') || '').trim();
    if (!key) throw new Error('Kein API‑Key');
    const url = `https://api.mistral.ai/v1/models`;
    const res = await fetch(url, { method: 'GET', mode: 'cors', headers: { 'Authorization': `Bearer ${key}` } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const arr = Array.isArray(data?.data) ? data.data : [];
    const names = arr.map(m => m?.id || '').filter(Boolean);
    const uniq = Array.from(new Set(names));
    return uniq;
  }
  function populateMistralModelSelect(models, preferred) {
    if (!mistralModelSelect) return;
    const opts = models.map(name => `<option value="${name}">${name}</option>`).join('');
    const header = '<option value="" disabled selected>Modell wählen…</option>';
    mistralModelSelect.innerHTML = header + opts;
    const choose = preferred && models.includes(preferred) ? preferred : '';
    if (choose) mistralModelSelect.value = choose;
  }
  async function testMistral() {
    const key = (mistralApiKeyInput?.value || localStorage.getItem('mistral-api-key') || '').trim();
    if (!key) { setMistralStatus('Bitte API‑Key angeben'); return; }
    setMistralStatus('Lade Modelle…');
    try {
      const models = await fetchMistralModels(key);
      populateMistralModelSelect(models, (mistralModelInput?.value || '').trim());
      const list = models.slice(0, 8).join(', ');
      setMistralStatus(models.length ? `OK. ${models.length} Modelle: ${list}${models.length>8?'…':''}` : 'OK, keine Modelle gefunden', true);
    } catch (e) {
      setMistralStatus('Fehler: API‑Key oder Netzwerk prüfen');
    }
  }
  async function fetchGeminiModels(apiKey) {
    const key = (apiKey || localStorage.getItem('gemini-api-key') || '').trim();
    if (!key) throw new Error('Kein API‑Key');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { method: 'GET', mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const arr = Array.isArray(data?.models) ? data.models : [];
    // Extract short names like "gemini-1.5-pro" from name "models/gemini-1.5-pro"
    const names = arr.map(m => (m?.name || '').replace(/^models\//, '')).filter(Boolean);
    // Prefer only text-capable models
    const uniq = Array.from(new Set(names));
    return uniq;
  }
  function populateGeminiModelSelect(models, preferred) {
    if (!geminiModelSelect) return;
    const opts = models.map(name => `<option value="${name}">${name}</option>`).join('');
    const header = '<option value="" disabled selected>Modell wählen…</option>';
    geminiModelSelect.innerHTML = header + opts;
    const choose = preferred && models.includes(preferred) ? preferred : '';
    if (choose) geminiModelSelect.value = choose;
  }
  async function testGemini() {
    const key = (geminiApiKeyInput?.value || localStorage.getItem('gemini-api-key') || '').trim();
    if (!key) { setGeminiStatus('Bitte API‑Key angeben'); return; }
    setGeminiStatus('Lade Modelle…');
    try {
      const models = await fetchGeminiModels(key);
      populateGeminiModelSelect(models, (geminiModelInput?.value || '').trim());
      const list = models.filter(n => /gemini/i.test(n)).slice(0, 8).join(', ');
      setGeminiStatus(models.length ? `OK. ${models.length} Modelle: ${list}${models.length>8?'…':''}` : 'OK, keine Modelle gefunden', true);
    } catch (e) {
      setGeminiStatus('Fehler: API‑Key oder Netzwerk prüfen');
    }
  }

  async function fetchOllamaModels(base) {
    const res = await fetch((base || 'http://localhost:11434').replace(/\/$/, '') + '/api/tags', { method: 'GET', mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const arr = Array.isArray(data?.models) ? data.models : (Array.isArray(data) ? data : []);
    return arr.map(m => m?.name || m?.model || '').filter(Boolean);
  }

  function populateModelSelect(models, preferred) {
    if (!ollamaModelSelect) return;
    const opts = models.map(name => `<option value="${name}">${name}</option>`).join('');
    const header = '<option value="" disabled selected>Modell wählen…</option>';
    ollamaModelSelect.innerHTML = header + opts;
    const choose = preferred && models.includes(preferred) ? preferred : '';
    if (choose) ollamaModelSelect.value = choose;
  }

  async function testOllama() {
    const base = (ollamaUrlInput?.value || '').replace(/\/$/, '');
    if (!base) { setOllamaStatus('Bitte URL angeben'); return; }
    setOllamaStatus('Teste Verbindung…');
    try {
      const models = await fetchOllamaModels(base);
      populateModelSelect(models, (ollamaModelInput?.value || '').trim());
      const list = models.slice(0, 8).join(', ');
      setOllamaStatus(models.length ? `OK. ${models.length} Modelle: ${list}${models.length>8?'…':''}` : 'OK, keine Modelle gefunden');
    } catch (e) {
      setOllamaStatus('Fehler/CORS? Prüfe URL und CORS in Ollama.');
    }
  }

  function populateGenericModelSelect(selectEl, models, preferred) {
    if (!selectEl) return;
    const list = Array.isArray(models) ? models : [];
    const opts = list.map(name => `<option value="${name}">${name}</option>`).join('');
    const header = '<option value="" disabled selected>Modell wählen…</option>';
    selectEl.innerHTML = header + opts;
    const choose = preferred && list.includes(preferred) ? preferred : '';
    if (choose) selectEl.value = choose;
  }

  async function fetchOpenAiModels(baseUrl, apiKey, headers = {}) {
    const key = (apiKey || '').trim();
    if (!key) throw new Error('Kein API‑Key');
    const base = ((baseUrl || '').trim() || 'https://api.openai.com/v1').replace(/\/$/, '');
    const url = `${base}/models`;
    const hdrs = { 'Authorization': `Bearer ${key}`, ...headers };
    const res = await fetch(url, { method: 'GET', mode: 'cors', headers: hdrs });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.models) ? data.models : []);
    const names = arr.map(m => m?.id || m?.name || m?.model || '').filter(Boolean);
    return Array.from(new Set(names));
  }

  async function fetchAnthropicModels(apiKey, baseUrl) {
    const key = (apiKey || '').trim();
    if (!key) throw new Error('Kein API‑Key');
    const base = ((baseUrl || '').trim() || 'https://api.anthropic.com').replace(/\/$/, '');
    const url = `${base}/v1/models`;
    const res = await fetch(url, { method: 'GET', mode: 'cors', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const arr = Array.isArray(data?.data) ? data.data : [];
    const names = arr.map(m => m?.id || '').filter(Boolean);
    return Array.from(new Set(names));
  }

  async function testOpenAi() {
    const apiKey = (openaiApiKeyInput?.value || localStorage.getItem('openai-api-key') || '').trim();
    if (!apiKey) { setOpenAiStatus('Bitte API‑Key angeben'); return; }
    const base = ((openaiBaseInput?.value || localStorage.getItem('openai-base') || 'https://api.openai.com/v1').trim() || 'https://api.openai.com/v1');
    setOpenAiStatus('Lade Modelle…');
    try {
      const models = await fetchOpenAiModels(base, apiKey);
      populateGenericModelSelect(openaiModelSelect, models, (openaiModelInput?.value || '').trim());
      const list = models.slice(0, 8).join(', ');
      setOpenAiStatus(models.length ? `OK. ${models.length} Modelle: ${list}${models.length>8?'…':''}` : 'OK, keine Modelle gefunden', true);
    } catch (e) {
      setOpenAiStatus('Fehler: API‑Key oder Netzwerk prüfen');
    }
  }

  async function testClaude() {
    const apiKey = (claudeApiKeyInput?.value || localStorage.getItem('claude-api-key') || '').trim();
    if (!apiKey) { setClaudeStatus('Bitte API‑Key angeben'); return; }
    const base = ((claudeBaseInput?.value || localStorage.getItem('claude-base') || 'https://api.anthropic.com').trim() || 'https://api.anthropic.com');
    setClaudeStatus('Lade Modelle…');
    try {
      const models = await fetchAnthropicModels(apiKey, base);
      populateGenericModelSelect(claudeModelSelect, models, (claudeModelInput?.value || '').trim());
      const list = models.slice(0, 8).join(', ');
      setClaudeStatus(models.length ? `OK. ${models.length} Modelle: ${list}${models.length>8?'…':''}` : 'OK, keine Modelle gefunden', true);
    } catch (e) {
      setClaudeStatus('Fehler: API‑Key oder Netzwerk prüfen');
    }
  }

  function openChat() {
    chatPanel?.classList.remove('hidden');
    chatOverlay?.classList.remove('hidden');
    document.body.classList.add('chat-open');
    adjustLayout();
    chatInput?.focus();
    const provider = getAiProvider();
    switch (provider) {
      case 'openai':
        testOpenAi();
        break;
      case 'claude':
        testClaude();
        break;
      case 'ollama': {
        const base = (ollamaUrlInput?.value || '').trim();
        if (base) testOllama();
        break;
      }
      case 'gemini':
        testGemini();
        break;
      case 'mistral':
        testMistral();
        break;
      default:
        testMistral();
        break;
    }
    updateChatModelBadge();
  }
  function closeChat() {
    chatOverlay?.classList.add('hidden');
    chatPanel?.classList.add('hidden');
    try { chatAbortController?.abort(); } catch {}
    stopChatSpeech();
    setChatBusy(false);
    document.body.classList.remove('chat-open');
    document.documentElement.style.setProperty('--chat-w', '0px');
    adjustLayout();
  }

  function effectiveChatModel() {
    try {
      return resolveCurrentProviderInfo().model || '';
    } catch {
      return '';
    }
  }
  function updateChatModelBadge() {
    if (!chatModelBadge) return;
    const m = effectiveChatModel();
    const provider = getAiProvider();
    const provLabel = PROVIDER_LABELS[provider] || provider;
    chatModelBadge.textContent = m ? `Modell: ${m} (${provLabel})` : 'Modell: (keins)';
  }

  function appendChatMessage(role, content) {
    if (!chatMessages) return;
    const el = document.createElement('div');
    el.className = `msg ${role}`;
    const roleEl = document.createElement('span');
    roleEl.className = 'role';
    roleEl.textContent = role === 'user' ? 'Du' : 'Assistant';
    el.appendChild(roleEl);
    const body = document.createElement('div');
    if (role === 'assistant') {
      el.__raw = content || '';
      renderAssistantMarkdown(body, el.__raw);
    } else {
      el.__raw = content || '';
      body.textContent = el.__raw;
    }
    el.appendChild(body);
    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.title = 'Kopieren';
    copyBtn.innerHTML = '<iconify-icon aria-hidden="true" icon="lucide:copy"></iconify-icon>';
    actions.appendChild(copyBtn);
    const speakBtn = document.createElement('button');
    speakBtn.type = 'button';
    speakBtn.className = 'speak-btn';
    speakBtn.title = 'Vorlesen';
    speakBtn.innerHTML = '<iconify-icon aria-hidden="true" icon="lucide:volume-2"></iconify-icon>';
    speakBtn.setAttribute('aria-pressed', 'false');
    if (!supportsChatSpeech()) speakBtn.disabled = true;
    actions.appendChild(speakBtn);
    el.appendChild(actions);
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return el;
  }

  // Thinking: convert content to collapsible details (collapsed by default)
  function detailsBlockFromMd(innerMd, open) {
    const innerHtml = marked.parse(innerMd || '');
    const openAttr = open ? ' open' : '';
    return `<details class="think-block"${openAttr}><summary>🧠 Reasoning</summary><div class="think-body">${innerHtml}</div></details>`;
  }
  function convertThinkSegments(md, open) {
    let out = md;
    // code fence style
    out = out.replace(/```thinking([\s\S]*?)```/gi, (_, c) => detailsBlockFromMd(c, open));
    // xml-like tags
    for (const tag of ['think','thinking','reasoning']) {
      const re = new RegExp(`<\\s*${tag}\\s*>([\\s\\S]*?)<\\s*\\/\\s*${tag}\\s*>`, 'gi');
      out = out.replace(re, (_, c) => detailsBlockFromMd(c, open));
    }
    // markers like <<THINK>>...<</THINK>>
    out = out.replace(/<<\s*THINK\s*>>([\s\S]*?)<<\s*\/\s*THINK\s*>>/gi, (_, c) => detailsBlockFromMd(c, open));
    // fullwidth angle brackets variant
    out = out.replace(/＜\s*think\s*＞([\s\S]*?)＜\s*\/\s*think\s*＞/gi, (_, c) => detailsBlockFromMd(c, open));
    return out;
  }
  function preprocessThinking(md) {
    return convertThinkSegments(md || '', false);
  }

  function renderAssistantMarkdown(container, md) {
    const processed = preprocessThinking(md || '');
    const html = marked.parse(processed);
    const safe = DOMPurify.sanitize(html, SANITIZE_MARKDOWN_OPTIONS);
    container.innerHTML = safe;
    container.querySelectorAll('pre code').forEach((node) => hljs.highlightElement(node));
  }

  const supportsChatSpeech = () => 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  let chatSpeechUtterance = null;
  let chatSpeechActiveMsg = null;
  let chatSpeechActiveBtn = null;

  function clearChatSpeechState() {
    if (chatSpeechActiveBtn) {
      chatSpeechActiveBtn.classList.remove('speaking');
      chatSpeechActiveBtn.setAttribute('aria-pressed', 'false');
    }
    chatSpeechActiveBtn = null;
    chatSpeechActiveMsg = null;
  }

  function stopChatSpeech() {
    if (supportsChatSpeech()) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    chatSpeechUtterance = null;
    clearChatSpeechState();
  }

  function markdownToPlainText(md) {
    if (!md) return '';
    try {
      const processed = preprocessThinking(md || '');
      const html = marked.parse(processed);
      const safe = DOMPurify.sanitize(html, SANITIZE_MARKDOWN_OPTIONS);
      const tmp = document.createElement('div');
      tmp.innerHTML = safe;
      return tmp.textContent || tmp.innerText || '';
    } catch (_) {
      return md;
    }
  }

  function chatMessageToSpeechText(el) {
    if (!el) return '';
    const raw = el.__raw || '';
    if (el.classList.contains('assistant')) {
      return markdownToPlainText(raw).trim();
    }
    return (raw || '').replace(/\s+/g, ' ').trim();
  }

  function speakChatMessageEl(msgEl, triggerBtn) {
    if (!supportsChatSpeech()) return;
    const text = chatMessageToSpeechText(msgEl);
    if (!text) return;
    stopChatSpeech();
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = navigator.language || 'de-DE';
    chatSpeechActiveMsg = msgEl || null;
    chatSpeechActiveBtn = triggerBtn || msgEl?.querySelector('.speak-btn') || null;
    if (chatSpeechActiveBtn) {
      chatSpeechActiveBtn.classList.add('speaking');
      chatSpeechActiveBtn.setAttribute('aria-pressed', 'true');
    }
    utter.onend = () => { chatSpeechUtterance = null; clearChatSpeechState(); };
    utter.onerror = () => { chatSpeechUtterance = null; clearChatSpeechState(); };
    chatSpeechUtterance = utter;
    try {
      window.speechSynthesis.speak(utter);
    } catch (_) {
      chatSpeechUtterance = null;
      clearChatSpeechState();
    }
  }

  let chatHistory = [];
  let chatAbortController = null;
  // removed editor-applied change modes

  function setChatBusy(busy) {
    if (chatSendBtn) chatSendBtn.disabled = !!busy;
    if (chatAbortBtn) chatAbortBtn.disabled = !busy;
    if (chatInput) chatInput.disabled = !!busy;
    if (chatSuggestions) {
      chatSuggestions.querySelectorAll('button').forEach(btn => { btn.disabled = !!busy; });
    }
  }

  async function sendChat() {
    const text = (chatInput?.value || '').trim();
    if (!text) return;
    chatInput.value = '';
    // no editor-apply capture
    // Build message array with optional editor context as a system prompt
    const msgs = [];
    if (allowEditorContext) {
      const ctx = getEditorContext();
      if (ctx.text) {
        msgs.push({ role: 'system', content: `Du befindest dich in einem Markdown‑Editor. Nutze den folgenden Editor‑Kontext (Typ: ${ctx.type}${ctx.truncated ? ', gekürzt' : ''}) für deine Antwort. Antworte in Markdown und sei präzise.\n\n[Editor‑Kontext BEGIN]\n${ctx.text}\n[Editor‑Kontext ENDE]` });
      }
    }
    const userContext = getUserContext();
    if (userContext) {
      msgs.push({ role: 'system', content: `Berücksichtige diese Nutzer-Präferenzen für Ton, Stil oder Hintergrundinformationen:\n\n${userContext}` });
    }
    msgs.push(...chatHistory);
    const currentUserMsg = { role: 'user', content: text };
    msgs.push(currentUserMsg);
    chatHistory.push(currentUserMsg);
    appendChatMessage('user', text);
    const provider = getAiProvider();
    const info = resolveCurrentProviderInfo();
    const stream = !!chatStreamToggle?.checked;
    let assistantEl = null;
    let assistantBody = null;
    try {
      assistantEl = appendChatMessage('assistant', '');
      assistantBody = assistantEl?.querySelector('div') || null;
      if (assistantEl) assistantEl.__raw = assistantEl.__raw || '';
      const updateAssistant = (text) => {
        if (!assistantEl) return;
        assistantEl.__raw = text;
        if (assistantBody) {
          renderAssistantMarkdown(assistantBody, text);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      };
      const applyDelta = (delta) => {
        if (!delta) return;
        updateAssistant((assistantEl.__raw || '') + delta);
      };
      setChatBusy(true);
      chatAbortController = new AbortController();
      const signal = chatAbortController.signal;
      let content = '';
      switch (provider) {
        case 'openai': {
          const apiKey = (openaiApiKeyInput?.value || localStorage.getItem('openai-api-key') || '').trim();
          if (!apiKey) throw new Error('OpenAI API‑Key fehlt');
          content = await openAiCompatibleChat({ apiKey, baseUrl: info.base, model: info.model, messages: msgs, stream, signal, onDelta: applyDelta });
          break;
        }
        case 'claude': {
          const apiKey = (claudeApiKeyInput?.value || localStorage.getItem('claude-api-key') || '').trim();
          if (!apiKey) throw new Error('Claude API‑Key fehlt');
          content = await anthropicChat({ apiKey, baseUrl: info.base, model: info.model, messages: msgs, stream, signal, onDelta: applyDelta });
          break;
        }
        case 'ollama': {
          content = await ollamaChat({ base: info.base, model: info.model, messages: msgs, stream, signal, onDelta: applyDelta });
          break;
        }
        case 'gemini': {
          const apiKey = (geminiApiKeyInput?.value || localStorage.getItem('gemini-api-key') || '').trim();
          content = await geminiChat({ apiKey, model: info.model, messages: msgs, stream, signal, onDelta: applyDelta });
          break;
        }
        case 'mistral':
        default: {
          const apiKey = (mistralApiKeyInput?.value || localStorage.getItem('mistral-api-key') || '').trim();
          if (!apiKey) throw new Error('Mistral API‑Key fehlt');
          content = await mistralChat({ apiKey, model: info.model, messages: msgs, stream, signal, onDelta: applyDelta });
          break;
        }
      }
      const finalText = content || '';
      updateAssistant(finalText);
      chatHistory.push({ role: 'assistant', content: finalText });
    } catch (e) {
      const isAbort = e?.name === 'AbortError';
      const msgText = isAbort ? '⏹️ Abgebrochen.' : `Fehler: ${e?.message || e}`;
      if (assistantEl) {
        assistantEl.__raw = msgText;
        if (assistantBody) {
          assistantBody.textContent = msgText;
          chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
          appendChatMessage('assistant', msgText);
        }
      } else {
        appendChatMessage('assistant', msgText);
      }
      const last = chatHistory[chatHistory.length - 1];
      if (last === currentUserMsg) chatHistory.pop();
    } finally {
      setChatBusy(false);
      chatAbortController = null;
    }
  }

  // removed diff/apply helpers

  async function ollamaChat({ base, model, messages, stream, signal, onDelta }) {
    const url = (base || 'http://localhost:11434').replace(/\/$/, '') + '/api/chat';
    const body = { model: model || 'llama3.1:8b', messages, stream: !!stream, options: {} };
    const res = await fetch(url, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
    if (!res.ok) throw await createHttpError(res);
    if (!stream) {
      const data = await res.json();
      const content = data?.message?.content || '';
      if (onDelta) onDelta(content);
      return content;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          const json = JSON.parse(line);
          if (json?.message?.content) {
            full += json.message.content;
            onDelta && onDelta(json.message.content);
          }
        } catch { /* ignore parse errors */ }
      }
    }
    return full;
  }

  // Gemini chat (streaming and non-streaming)
  function toGeminiPayload(messages, genCfg) {
    const contents = [];
    const sys = [];
    for (const m of messages || []) {
      const role = m.role || 'user';
      const text = typeof m.content === 'string' ? m.content : '';
      if (!text) continue;
      if (role === 'system') {
        sys.push(text);
      } else if (role === 'assistant') {
        contents.push({ role: 'model', parts: [{ text }] });
      } else {
        contents.push({ role: 'user', parts: [{ text }] });
      }
    }
    const body = { contents };
    if (sys.length) body.system_instruction = { parts: [{ text: sys.join('\n\n') }] };
    if (genCfg) body.generationConfig = genCfg;
    return body;
  }
  async function geminiChat({ apiKey, model, messages, stream, signal, onDelta, genCfg }) {
    const key = (apiKey || '').trim();
    if (!key) throw new Error('Gemini API‑Key fehlt');
    const mdl = (model || localStorage.getItem('gemini-model') || 'gemini-1.5-flash').trim();
    const body = toGeminiPayload(messages, genCfg);
    const base = 'https://generativelanguage.googleapis.com/v1beta/models/';
    if (!stream) {
      const url = `${base}${encodeURIComponent(mdl)}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
      if (!res.ok) throw await createHttpError(res);
      const data = await res.json();
      const txt = ((data?.candidates?.[0]?.content?.parts || []).map(p => p?.text || '').join('')) || '';
      if (onDelta) onDelta(txt);
      return txt;
    }
    const url = `${base}${encodeURIComponent(mdl)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' }, body: JSON.stringify(body), signal });
    if (!res.ok) throw await createHttpError(res);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        const m = line.match(/^data:\s*(\{.*\})\s*$/);
        if (!m) continue;
        try {
          const json = JSON.parse(m[1]);
          const delta = ((json?.candidates?.[0]?.content?.parts || []).map(p => p?.text || '').join('')) || '';
          if (delta) {
            full += delta;
            onDelta && onDelta(delta);
          }
        } catch {}
      }
    }
    return full;
  }

  // Mistral chat (streaming and non-streaming)
  function toMistralPayload(messages) {
    const body = { messages: [] };
    for (const m of messages || []) {
      const role = m.role || 'user';
      const content = typeof m.content === 'string' ? m.content : '';
      if (!content) continue;
      body.messages.push({ role, content });
    }
    return body;
  }
  async function mistralChat({ apiKey, model, messages, stream, signal, onDelta }) {
    const key = (apiKey || '').trim();
    if (!key) throw new Error('Mistral API‑Key fehlt');
    const mdl = (model || localStorage.getItem('mistral-model') || 'mistral-small-latest').trim();
    const base = 'https://api.mistral.ai/v1/chat/completions';
    const body = { model: mdl, stream: !!stream, ...toMistralPayload(messages) };
    if (!stream) {
      const res = await fetch(base, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify(body), signal });
      if (!res.ok) throw await createHttpError(res);
      const data = await res.json();
      const txt = (data?.choices?.[0]?.message?.content) || '';
      if (onDelta) onDelta(txt);
      return txt;
    }
    const res = await fetch(base, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream', 'Authorization': `Bearer ${key}` }, body: JSON.stringify(body), signal });
    if (!res.ok) throw await createHttpError(res);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        const m = line.match(/^data:\s*(.*)\s*$/);
        if (!m) continue;
        const payload = m[1];
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = (json?.choices?.[0]?.delta?.content) || (json?.choices?.[0]?.message?.content) || '';
          if (delta) {
            full += delta;
            onDelta && onDelta(delta);
          }
        } catch {}
      }
    }
    return full;
  }

  function toOpenAiMessages(messages) {
    const arr = [];
    for (const m of messages || []) {
      const role = m?.role || 'user';
      const content = typeof m?.content === 'string' ? m.content : '';
      if (!content) continue;
      arr.push({ role, content });
    }
    return arr;
  }

  function extractOpenAiDelta(choice) {
    if (!choice) return '';
    if (choice.delta) {
      const delta = choice.delta;
      if (typeof delta.content === 'string') return delta.content;
      if (Array.isArray(delta.content)) {
        return delta.content.map((part) => part?.text || part?.content || '').join('');
      }
      if (typeof delta.text === 'string') return delta.text;
    }
    if (choice.message) {
      const msg = choice.message;
      if (typeof msg.content === 'string') return msg.content;
      if (Array.isArray(msg.content)) {
        return msg.content.map((part) => part?.text || part?.content || '').join('');
      }
    }
    if (typeof choice.text === 'string') return choice.text;
    return '';
  }

  async function openAiCompatibleChat({ apiKey, baseUrl, model, messages, stream, signal, onDelta, headers = {} }) {
    const key = (apiKey || '').trim();
    if (!key) throw new Error('API‑Key fehlt');
    const mdl = (model || '').trim();
    if (!mdl) throw new Error('Modell fehlt');
    const base = ((baseUrl || '').trim() || 'https://api.openai.com/v1').replace(/\/$/, '');
    const url = `${base}/chat/completions`;
    const body = { model: mdl, stream: !!stream, messages: toOpenAiMessages(messages) };
    const hdrs = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, ...headers };
    if (stream) hdrs['Accept'] = 'text/event-stream';
    const res = await fetch(url, { method: 'POST', mode: 'cors', headers: hdrs, body: JSON.stringify(body), signal });
    if (!res.ok) throw await createHttpError(res);
    if (!stream) {
      const data = await res.json();
      const choice = Array.isArray(data?.choices) ? data.choices[0] : null;
      let text = '';
      if (choice?.message?.content) {
        text = typeof choice.message.content === 'string'
          ? choice.message.content
          : Array.isArray(choice.message.content) ? choice.message.content.map(part => part?.text || part?.content || '').join('') : '';
      } else if (typeof choice?.text === 'string') {
        text = choice.text;
      }
      if (text && onDelta) onDelta(text);
      return text;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        line = line.replace(/\r$/, '').trim();
        if (!line) continue;
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = extractOpenAiDelta(Array.isArray(json?.choices) ? json.choices[0] : null);
          if (delta) {
            full += delta;
            onDelta && onDelta(delta);
          }
        } catch {}
      }
    }
    return full;
  }

  function toAnthropicMessages(messages) {
    const sys = [];
    const conv = [];
    for (const m of messages || []) {
      const role = m?.role || 'user';
      const text = typeof m?.content === 'string' ? m.content : '';
      if (!text) continue;
      if (role === 'system') {
        sys.push(text);
      } else {
        conv.push({ role: role === 'assistant' ? 'assistant' : 'user', content: [{ type: 'text', text }] });
      }
    }
    return { system: sys, messages: conv };
  }

  async function anthropicChat({ apiKey, baseUrl, model, messages, stream, signal, onDelta }) {
    const key = (apiKey || '').trim();
    if (!key) throw new Error('Claude API‑Key fehlt');
    const mdl = (model || '').trim();
    if (!mdl) throw new Error('Modell fehlt');
    const base = ((baseUrl || '').trim() || 'https://api.anthropic.com').replace(/\/$/, '');
    const url = `${base}/v1/messages`;
    const prepared = toAnthropicMessages(messages);
    const body = {
      model: mdl,
      stream: !!stream,
      max_tokens: 8192,
      messages: prepared.messages,
    };
    if (prepared.system.length) body.system = prepared.system.join('\n\n');
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    };
    if (stream) headers['Accept'] = 'text/event-stream';
    const res = await fetch(url, { method: 'POST', mode: 'cors', headers, body: JSON.stringify(body), signal });
    if (!res.ok) throw await createHttpError(res);
    if (!stream) {
      const data = await res.json();
      const content = Array.isArray(data?.content) ? data.content : [];
      const text = content.map(part => part?.text || '').join('');
      if (text && onDelta) onDelta(text);
      return text;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let full = '';
    let eventType = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        line = line.replace(/\r$/, '');
        if (!line) { eventType = ''; continue; }
        if (line.startsWith('event:')) { eventType = line.slice(6).trim(); continue; }
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          if (eventType === 'content_block_delta' || eventType === 'message_delta') {
            const delta = json?.delta?.text || '';
            if (delta) {
              full += delta;
              onDelta && onDelta(delta);
            }
          }
        } catch {}
      }
    }
    return full;
  }

  // Chat events
  chatToggleBtn?.addEventListener('click', () => {
    try { loadOpenAiSettings(); } catch {}
    try { loadClaudeSettings(); } catch {}
    try { loadOllamaSettings(); } catch {}
    try { loadGeminiSettings(); } catch {}
    try { loadMistralSettings(); } catch {}
    if (chatPanel?.classList.contains('hidden')) openChat(); else closeChat();
  });
  const badgeInputs = [
    [openaiModelSelect, openaiModelInput],
    [claudeModelSelect, claudeModelInput],
    [ollamaModelSelect, ollamaModelInput],
    [geminiModelSelect, geminiModelInput],
    [mistralModelSelect, mistralModelInput],
  ];
  for (const [sel, inp] of badgeInputs) {
    sel?.addEventListener('change', () => { if (inp && sel.value) inp.value = sel.value; updateChatModelBadge(); });
    inp?.addEventListener('input', updateChatModelBadge);
  }
  [openaiSaveBtn, claudeSaveBtn, ollamaSaveBtn, geminiSaveBtn, mistralSaveBtn].forEach(btn => {
    btn?.addEventListener('click', () => setTimeout(updateChatModelBadge, 50));
  });
  [openaiTestBtn, claudeTestBtn, ollamaTestBtn, geminiTestBtn, mistralTestBtn].forEach(btn => {
    btn?.addEventListener('click', () => setTimeout(updateChatModelBadge, 200));
  });
  chatOverlay?.addEventListener('click', closeChat);
  chatCloseBtn?.addEventListener('click', closeChat);
  chatSuggestions?.addEventListener('click', (e) => {
    if (chatInput?.disabled) return;
    const btn = e.target.closest('button[data-prompt]');
    if (!btn) return;
    const prompt = btn.dataset.prompt || btn.textContent || '';
    if (!prompt) return;
    chatInput.value = prompt;
    chatInput.focus();
    if (typeof chatInput.setSelectionRange === 'function') {
      const len = prompt.length;
      try { chatInput.setSelectionRange(len, len); } catch {}
    }
    void sendChat();
  });
  chatSendBtn?.addEventListener('click', sendChat);
  chatAbortBtn?.addEventListener('click', () => { try { chatAbortController?.abort(); } catch {} });
  chatClearBtn?.addEventListener('click', () => { chatMessages.innerHTML = ''; chatHistory = []; stopChatSpeech(); });
  if (chatStreamToggle) {
    chatStreamToggle.checked = getPref('chat-stream', true);
    chatStreamToggle.addEventListener('change', () => { setPref('chat-stream', !!chatStreamToggle.checked); });
  }
  editorContextBtn?.addEventListener('click', () => { allowEditorContext = !allowEditorContext; updateEditorContextInfo(); });
  // removed applyModeSelect listener
  chatMessages?.addEventListener('click', async (e) => {
    const speakBtn = e.target.closest('button.speak-btn');
    if (speakBtn) {
      const msg = speakBtn.closest('.msg');
      if (!msg) return;
      if (chatSpeechActiveMsg === msg && chatSpeechUtterance) {
        stopChatSpeech();
      } else {
        speakChatMessageEl(msg, speakBtn);
      }
      return;
    }
    const copyBtn = e.target.closest('button.copy-btn');
    if (!copyBtn) return;
    const msg = copyBtn.closest('.msg');
    if (!msg) return;
    const text = msg.__raw || msg.textContent || '';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
      }
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = '<iconify-icon aria-hidden="true" icon="lucide:check"></iconify-icon>';
      setTimeout(() => { copyBtn.innerHTML = orig; }, 800);
    } catch (_) {
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = '<iconify-icon aria-hidden="true" icon="lucide:alert-circle"></iconify-icon>';
      setTimeout(() => { copyBtn.innerHTML = orig; }, 800);
    }
  });
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  });
  openaiSaveBtn?.addEventListener('click', saveOpenAiSettings);
  openaiTestBtn?.addEventListener('click', testOpenAi);
  claudeSaveBtn?.addEventListener('click', saveClaudeSettings);
  claudeTestBtn?.addEventListener('click', testClaude);
  ollamaSaveBtn?.addEventListener('click', saveOllamaSettings);
  ollamaTestBtn?.addEventListener('click', testOllama);
  // Settings handlers
  function openSettings(initialTab = 'general') {
    settingsPanel?.classList.remove('hidden');
    settingsOverlay?.classList.remove('hidden');
    try { showSettingsTab(initialTab); } catch {}
    prefReaderInput && (prefReaderInput.checked = getPref('reader-input', true));
    prefStickyTools && (prefStickyTools.checked = getPref('sticky-tools', true));
    prefAiInlineAutoOpen && (prefAiInlineAutoOpen.checked = getPref('ai-inline-open', false));
    if (prefDefaultView) {
      const dv = getPrefStr('default-view', 'split');
      prefDefaultView.value = ['edit','split','reader'].includes(dv) ? dv : 'split';
    }
    if (prefAutoSnapshotInterval) {
      const minutes = Math.round(getAutoSnapshotInterval() / 60_000);
      prefAutoSnapshotInterval.value = String(minutes);
    }
    syncUserContextEnabledControl();
    populateUserContextFields();
    if (chatStreamToggle) chatStreamToggle.checked = getPref('chat-stream', true);
    // Load provider settings
    try { loadOpenAiSettings(); } catch {}
    try { loadClaudeSettings(); } catch {}
    try { loadOllamaSettings(); } catch {}
    try { loadGeminiSettings(); } catch {}
    try { loadMistralSettings(); } catch {}
    try { applyProviderUI(); } catch {}
  }
  settingsBtn?.addEventListener('click', () => { openSettings('general'); });
  aiPresetSettingsBtn?.addEventListener('click', () => { openSettings('presets'); });
  function closeSettings() { settingsPanel?.classList.add('hidden'); settingsOverlay?.classList.add('hidden'); }
  settingsOverlay?.addEventListener('click', closeSettings);
  settingsCloseBtn?.addEventListener('click', closeSettings);
  prefUserContextEnabled?.addEventListener('change', () => {
    updateUserContextInputsState();
  });
  settingsSaveBtn?.addEventListener('click', () => {
    setPref('reader-input', !!prefReaderInput?.checked);
    setPref('sticky-tools', !!prefStickyTools?.checked);
    setPref('ai-inline-open', !!prefAiInlineAutoOpen?.checked);
    setPref(USER_CONTEXT_ENABLED_PREF_KEY, !!prefUserContextEnabled?.checked);
    if (prefDefaultView && prefDefaultView.value) setPrefStr('default-view', prefDefaultView.value);
    if (prefAutoSnapshotInterval) {
      const rawMinutes = Number.parseInt(prefAutoSnapshotInterval.value, 10);
      const ms = normalizeAutoSnapshotIntervalMs(msFromMinutes(rawMinutes), versionState.autoIntervalMs || AUTO_SNAPSHOT_DEFAULT_INTERVAL);
      setPrefStr('auto-snapshot-interval', ms);
      versionState.autoIntervalMs = ms;
      prefAutoSnapshotInterval.value = String(Math.round(ms / 60_000));
      if (isVersioningSupported()) {
        ensureAutoSnapshots();
        setVersionsStatus(`Auto-Snapshot alle ${formatAutoSnapshotInterval(ms)}`);
      }
    }
    const ctxResult = writeUserContextParts(readUserContextPartsFromFields());
    setUserContextFieldValues(ctxResult.parts);
    updateUserContextInputsState();
    applyPrefs();
    closeSettings();
  });
  settingsConfigExportBtn?.addEventListener('click', () => {
    try {
      const payload = collectSettingsConfig();
      exportSettingsConfig(payload);
      setStatus('Konfiguration exportiert');
    } catch (e) {
      console.error(e);
      alert('Export fehlgeschlagen. Bitte erneut versuchen.');
      setStatus('Export fehlgeschlagen');
    }
  });
  settingsConfigImportBtn?.addEventListener('click', () => { settingsConfigImportFile?.click(); });
  settingsConfigImportFile?.addEventListener('change', async () => {
    const file = settingsConfigImportFile?.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      applySettingsConfig(data);
      setStatus('Konfiguration importiert');
    } catch (e) {
      console.error(e);
      alert('Import fehlgeschlagen. Bitte eine gültige JSON-Konfigurationsdatei auswählen.');
      setStatus('Import fehlgeschlagen');
    } finally {
      if (settingsConfigImportFile) settingsConfigImportFile.value = '';
    }
  });

  settingsShareCopyBtn?.addEventListener('click', () => { void copyShareLinkToClipboard(); });

  if (settingsShareNativeBtn) {
    if (typeof navigator.share !== 'function') {
      settingsShareNativeBtn.remove();
    } else {
      settingsShareNativeBtn.addEventListener('click', async () => {
        const payload = getCanonicalSharePayload();
        try {
          await navigator.share(payload);
          setStatus('Teilen gestartet');
        } catch (err) {
          if (err?.name === 'AbortError') {
            setStatus('Teilen abgebrochen');
          } else {
            console.error(err);
            alert('Teilen nicht möglich. Bitte einen anderen Button verwenden.');
            setStatus('Teilen fehlgeschlagen');
          }
        }
      });
    }
  }

  settingsShareTwitterBtn?.addEventListener('click', () => {
    const payload = getCanonicalSharePayload();
    const encodedUrl = encodeURIComponent(payload.url);
    const encodedText = encodeURIComponent(payload.text);
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    openShareTarget(shareUrl);
    setStatus('Freigabe auf X geöffnet');
  });

  settingsShareLinkedinBtn?.addEventListener('click', () => {
    const payload = getCanonicalSharePayload();
    const encodedUrl = encodeURIComponent(payload.url);
    const encodedTitle = encodeURIComponent(payload.title);
    const encodedText = encodeURIComponent(payload.text);
    const shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`;
    openShareTarget(shareUrl);
    setStatus('Freigabe auf LinkedIn geöffnet');
  });

  settingsShareFacebookBtn?.addEventListener('click', () => {
    const payload = getCanonicalSharePayload();
    const encodedUrl = encodeURIComponent(payload.url);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    openShareTarget(shareUrl);
    setStatus('Freigabe auf Facebook geöffnet');
  });

  settingsShareWhatsappBtn?.addEventListener('click', () => {
    const payload = getCanonicalSharePayload();
    const encodedMessage = encodeURIComponent(`${payload.text} ${payload.url}`.trim());
    const shareUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    openShareTarget(shareUrl);
    setStatus('Freigabe auf WhatsApp geöffnet');
  });

  settingsShareTelegramBtn?.addEventListener('click', () => {
    const payload = getCanonicalSharePayload();
    const encodedUrl = encodeURIComponent(payload.url);
    const encodedText = encodeURIComponent(payload.text);
    const shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    openShareTarget(shareUrl);
    setStatus('Freigabe auf Telegram geöffnet');
  });

  settingsShareMastodonBtn?.addEventListener('click', () => {
    const payload = getCanonicalSharePayload();
    const encodedUrl = encodeURIComponent(payload.url);
    const encodedText = encodeURIComponent(`${payload.text}`);
    const shareUrl = `https://mastodonshare.com/?text=${encodedText}&url=${encodedUrl}`;
    openShareTarget(shareUrl);
    setStatus('Freigabe für Mastodon geöffnet');
  });

  settingsShareEmailBtn?.addEventListener('click', () => {
    const payload = getCanonicalSharePayload();
    const encodedSubject = encodeURIComponent(payload.title);
    const encodedBody = encodeURIComponent(`${payload.text}\n\n${payload.url}`.trim());
    const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
    try {
      window.location.href = mailtoUrl;
    } catch {
      openShareTarget(mailtoUrl);
    }
    setStatus('E-Mail-Entwurf vorbereitet');
  });

  settingsConfigResetBtn?.addEventListener('click', () => {
    const confirmed = window.confirm('Alle Einstellungen wirklich auf die Standardwerte zurücksetzen?');
    if (!confirmed) return;
    resetSettingsConfigToDefaults();
  });

  settingsOnboardingRestartBtn?.addEventListener('click', () => {
    if (!onboardingOverlay) return;
    closeSettings();
    try { localStorage.removeItem(ONBOARDING_STORAGE_KEY); } catch {}
    onboardingAcknowledged = false;
    onboardingIndex = 0;
    renderOnboardingStep();
    openOnboarding();
  });

  function readStoredValue(key) {
    try { return localStorage.getItem(key); }
    catch { return null; }
  }

  function writeStoredValue(key, value) {
    try {
      if (value === undefined || value === null) {
        localStorage.removeItem(key);
        return;
      }
      const str = typeof value === 'string' ? value.trim() : String(value).trim();
      if (!str) localStorage.removeItem(key);
      else localStorage.setItem(key, str);
    } catch {}
  }

  function normalizeBoolean(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (['1', 'true', 'yes', 'on'].includes(v)) return true;
      if (['0', 'false', 'no', 'off'].includes(v)) return false;
    }
    return fallback;
  }

  function normalizePresetList(list) {
    if (!Array.isArray(list)) return [];
    const sanitized = [];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const prompt = typeof item.prompt === 'string' ? item.prompt : '';
      if (!name) continue;
      const category = typeof item.category === 'string' ? item.category.trim() : '';
      const description = typeof item.description === 'string' ? item.description.trim() : '';
      const icon = typeof item.icon === 'string' ? item.icon.trim() : '';
      const payload = { name, prompt };
      if (category) payload.category = category;
      if (description) payload.description = description;
      if (icon) payload.icon = icon;
      sanitized.push(payload);
    }
    return sanitized;
  }

  function readPresetList() {
    try {
      const raw = localStorage.getItem('ai-presets');
      const parsed = raw ? JSON.parse(raw) : [];
      return normalizePresetList(Array.isArray(parsed) ? parsed : []);
    } catch {
      return [];
    }
  }

  function collectSettingsConfig() {
    const defaultView = (() => {
      const view = getPrefStr('default-view', 'split');
      return ['edit', 'split', 'reader'].includes(view) ? view : 'split';
    })();
    const presets = normalizePresetList(readPresetList());
    const customPresets = presets.filter(p => !BUILT_IN_PRESET_NAMES.has(p.name));
    const userContextParts = readUserContextParts();
    const combinedUserContext = buildUserContextMessage(userContextParts);
    const userContextEnabled = isUserContextEnabled();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      prefs: {
        readerInput: getPref('reader-input', true),
        stickyTools: getPref('sticky-tools', true),
        aiInlineOpen: getPref('ai-inline-open', false),
        defaultView,
        autoSnapshotIntervalMinutes: Math.round(getAutoSnapshotInterval() / 60_000),
        userContextEnabled,
        userContext: {
          profile: userContextParts.profile,
          style: userContextParts.style,
          audience: userContextParts.audience,
          instructions: userContextParts.instructions,
          combined: combinedUserContext,
          enabled: userContextEnabled,
        },
      },
      chat: {
        stream: getPref('chat-stream', true),
      },
      aiProvider: getAiProvider(),
      providers: {
        openai: {
          apiKey: readStoredValue('openai-api-key') || '',
          base: readStoredValue('openai-base') || '',
          model: readStoredValue('openai-model') || '',
        },
        claude: {
          apiKey: readStoredValue('claude-api-key') || '',
          base: readStoredValue('claude-base') || '',
          model: readStoredValue('claude-model') || '',
        },
        ollama: {
          url: readStoredValue('ollama-url') || '',
          model: readStoredValue('ollama-model') || '',
        },
        gemini: {
          apiKey: readStoredValue('gemini-api-key') || '',
          model: readStoredValue('gemini-model') || '',
        },
        mistral: {
          apiKey: readStoredValue('mistral-api-key') || '',
          model: readStoredValue('mistral-model') || '',
        },
      },
      presets: customPresets,
    };
  }

  function exportSettingsConfig(payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `markdown-webeditor-settings-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  function applySettingsConfig(data) {
    if (!data || typeof data !== 'object') throw new Error('Ungültige Konfigurationsdaten');

    const prefs = (data.prefs && typeof data.prefs === 'object') ? data.prefs : {};
    if ('readerInput' in prefs) {
      const val = normalizeBoolean(prefs.readerInput, getPref('reader-input', true));
      setPref('reader-input', val);
      if (prefReaderInput) prefReaderInput.checked = val;
    }
    if ('stickyTools' in prefs) {
      const val = normalizeBoolean(prefs.stickyTools, getPref('sticky-tools', true));
      setPref('sticky-tools', val);
      if (prefStickyTools) prefStickyTools.checked = val;
    }
    if ('aiInlineOpen' in prefs) {
      const val = normalizeBoolean(prefs.aiInlineOpen, getPref('ai-inline-open', false));
      setPref('ai-inline-open', val);
      if (prefAiInlineAutoOpen) prefAiInlineAutoOpen.checked = val;
    }
    if ('defaultView' in prefs) {
      const raw = typeof prefs.defaultView === 'string' ? prefs.defaultView : getPrefStr('default-view', 'split');
      const normalized = ['edit', 'split', 'reader'].includes(raw) ? raw : 'split';
      setPrefStr('default-view', normalized);
      if (prefDefaultView) prefDefaultView.value = normalized;
    }
    if ('autoSnapshotIntervalMinutes' in prefs || 'autoSnapshotIntervalMs' in prefs) {
      const msSource = prefs.autoSnapshotIntervalMs;
      const minutesSource = prefs.autoSnapshotIntervalMinutes;
      let target = AUTO_SNAPSHOT_DEFAULT_INTERVAL;
      if (msSource !== undefined && msSource !== null) {
        const candidate = Number(msSource);
        if (Number.isFinite(candidate)) {
          target = normalizeAutoSnapshotIntervalMs(candidate, target);
        }
      } else if (minutesSource !== undefined && minutesSource !== null) {
        const candidate = Number(minutesSource);
        if (Number.isFinite(candidate)) {
          target = normalizeAutoSnapshotIntervalMs(msFromMinutes(candidate), target);
        }
      }
      setPrefStr('auto-snapshot-interval', target);
      versionState.autoIntervalMs = target;
      if (prefAutoSnapshotInterval) prefAutoSnapshotInterval.value = String(Math.round(target / 60_000));
      if (isVersioningSupported()) ensureAutoSnapshots();
    }
    if ('userContextEnabled' in prefs) {
      const enabledVal = normalizeBoolean(prefs.userContextEnabled, isUserContextEnabled());
      setPref(USER_CONTEXT_ENABLED_PREF_KEY, enabledVal);
      if (prefUserContextEnabled) prefUserContextEnabled.checked = enabledVal;
      updateUserContextInputsState();
    }
    if ('userContext' in prefs) {
      const rawCtx = prefs.userContext;
      let partsToWrite = null;
      if (typeof rawCtx === 'string') {
        const sanitized = sanitizeUserContext(rawCtx);
        partsToWrite = { profile: '', style: sanitized, audience: '', instructions: '' };
      } else if (rawCtx && typeof rawCtx === 'object') {
        partsToWrite = {
          profile: rawCtx.profile ?? '',
          style: rawCtx.style ?? rawCtx.tone ?? '',
          audience: rawCtx.audience ?? rawCtx.target ?? '',
          instructions: rawCtx.instructions ?? rawCtx.notes ?? '',
        };
        if (!partsToWrite.profile && !partsToWrite.style && !partsToWrite.audience && !partsToWrite.instructions && typeof rawCtx.combined === 'string') {
          partsToWrite.style = sanitizeUserContext(rawCtx.combined);
        }
        if ('enabled' in rawCtx) {
          const enabledVal = normalizeBoolean(rawCtx.enabled, isUserContextEnabled());
          setPref(USER_CONTEXT_ENABLED_PREF_KEY, enabledVal);
          if (prefUserContextEnabled) prefUserContextEnabled.checked = enabledVal;
        }
      }
      if (partsToWrite) {
        const result = writeUserContextParts(partsToWrite);
        setUserContextFieldValues(result.parts);
      } else {
        populateUserContextFields();
      }
      syncUserContextEnabledControl();
    }

    if (data.chat && typeof data.chat === 'object' && 'stream' in data.chat) {
      const streamVal = normalizeBoolean(data.chat.stream, getPref('chat-stream', true));
      setPref('chat-stream', streamVal);
      if (chatStreamToggle) chatStreamToggle.checked = streamVal;
    }

    if (data.aiProvider) {
      setAiProvider(data.aiProvider);
      if (aiProviderSelect) aiProviderSelect.value = getAiProvider();
    }

    const providers = (data.providers && typeof data.providers === 'object') ? data.providers : {};
    if (providers.openai && typeof providers.openai === 'object') {
      const info = providers.openai;
      if ('apiKey' in info) writeStoredValue('openai-api-key', info.apiKey);
      if ('base' in info) writeStoredValue('openai-base', info.base);
      if ('model' in info) writeStoredValue('openai-model', info.model);
    }
    if (providers.claude && typeof providers.claude === 'object') {
      const info = providers.claude;
      if ('apiKey' in info) writeStoredValue('claude-api-key', info.apiKey);
      if ('base' in info) writeStoredValue('claude-base', info.base);
      if ('model' in info) writeStoredValue('claude-model', info.model);
    }
    if (providers.ollama && typeof providers.ollama === 'object') {
      const info = providers.ollama;
      if ('url' in info) writeStoredValue('ollama-url', info.url);
      if ('model' in info) writeStoredValue('ollama-model', info.model);
    }
    if (providers.gemini && typeof providers.gemini === 'object') {
      const info = providers.gemini;
      if ('apiKey' in info) writeStoredValue('gemini-api-key', info.apiKey);
      if ('model' in info) writeStoredValue('gemini-model', info.model);
    }
    if (providers.mistral && typeof providers.mistral === 'object') {
      const info = providers.mistral;
      if ('apiKey' in info) writeStoredValue('mistral-api-key', info.apiKey);
      if ('model' in info) writeStoredValue('mistral-model', info.model);
    }

    if (Array.isArray(data.presets)) {
      const customPresets = normalizePresetList(data.presets).filter(p => !BUILT_IN_PRESET_NAMES.has(p.name));
      const existing = readPresetList();
      let basePresets = existing.filter(p => BUILT_IN_PRESET_NAMES.has(p.name));
      if (!basePresets.length) basePresets = BUILT_IN_PRESETS.map(p => ({ ...p }));
      const mergedMap = new Map();
      for (const entry of [...basePresets, ...customPresets]) {
        if (!entry || typeof entry.name !== 'string') continue;
        const name = entry.name.trim();
        if (!name) continue;
        mergedMap.set(name, { name, prompt: typeof entry.prompt === 'string' ? entry.prompt : '' });
      }
      const merged = Array.from(mergedMap.values());
      try { localStorage.setItem('ai-presets', JSON.stringify(merged)); } catch {}
      document.dispatchEvent(new Event('presets-updated'));
    }

    applyPrefs();
    try { loadOpenAiSettings(); } catch {}
    try { loadClaudeSettings(); } catch {}
    try { loadOllamaSettings(); } catch {}
    try { loadGeminiSettings(); } catch {}
    try { loadMistralSettings(); } catch {}
    try { applyProviderUI(); } catch {}
  }

  function resetSettingsConfigToDefaults() {
    const storageKeys = [
      'ai-provider',
      'ai-presets',
      'openai-api-key',
      'openai-base',
      'openai-model',
      'claude-api-key',
      'claude-base',
      'claude-model',
      'ollama-url',
      'ollama-model',
      'gemini-api-key',
      'gemini-model',
      'mistral-api-key',
      'mistral-model',
      'pref-reader-input',
      'pref-sticky-tools',
      'pref-ai-inline-open',
      'pref-default-view',
      'pref-auto-snapshot-interval',
      'pref-chat-stream',
    ];
    for (const key of storageKeys) {
      try { localStorage.removeItem(key); }
      catch {}
    }

    setPref('reader-input', true);
    if (prefReaderInput) prefReaderInput.checked = true;

    setPref('sticky-tools', true);
    if (prefStickyTools) prefStickyTools.checked = true;

    setPref('ai-inline-open', false);
    if (prefAiInlineAutoOpen) prefAiInlineAutoOpen.checked = false;

    setPrefStr('default-view', 'split');
    if (prefDefaultView) prefDefaultView.value = 'split';
    try { setView('split'); } catch {}

    setPrefStr('auto-snapshot-interval', AUTO_SNAPSHOT_DEFAULT_INTERVAL);
    versionState.autoIntervalMs = AUTO_SNAPSHOT_DEFAULT_INTERVAL;
    if (prefAutoSnapshotInterval) prefAutoSnapshotInterval.value = String(Math.round(AUTO_SNAPSHOT_DEFAULT_INTERVAL / 60_000));
    if (isVersioningSupported()) ensureAutoSnapshots();

    setPref('chat-stream', true);
    if (chatStreamToggle) chatStreamToggle.checked = true;

    setAiProvider('openai');
    if (aiProviderSelect) aiProviderSelect.value = getAiProvider();

    try { loadOllamaSettings(); } catch {}
    try { loadOpenAiSettings(); } catch {}
    try { loadClaudeSettings(); } catch {}
    try { loadGeminiSettings(); } catch {}
    try { loadMistralSettings(); } catch {}

    setOllamaStatus('', false);
    setOpenAiStatus('', false);
    setClaudeStatus('', false);
    setGeminiStatus('', false);
    setMistralStatus('', false);

    applyPrefs();
    try { applyProviderUI(); } catch {}
    document.dispatchEvent(new Event('presets-updated'));
    setStatus('Alle Einstellungen wurden auf Standardwerte zurückgesetzt.');
  }
  feedbackForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const subject = 'Feedback zum Markdown WebEditor';
    const name = (feedbackNameInput?.value || '').trim();
    const email = (feedbackEmailInput?.value || '').trim();
    const message = (feedbackMessageInput?.value || '').trim();
    if (!message) {
      feedbackMessageInput?.focus();
      return;
    }
    const parts = [];
    if (name) parts.push(`Name: ${name}`);
    if (email) parts.push(`E-Mail: ${email}`);
    if (parts.length) parts.push('');
    parts.push(message);
    const mailtoUrl = `mailto:info@252425.xyz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(parts.join('\n'))}`;
    window.location.href = mailtoUrl;
  });

  function showSettingsTab(id) {
    settingsTabButtons().forEach(btn => {
      const active = btn.dataset.tab === id;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    settingsTabPanels().forEach(panel => {
      panel.classList.toggle('hidden', panel.dataset.tab !== id);
    });
    if (id === 'info') {
      loadInfoTab();
    }
    if (id === 'updates' && !updatesLoadedOnce) {
      loadRepoUpdates();
    }
  }
  settingsTabs?.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    const id = btn.dataset.tab;
    if (id) showSettingsTab(id);
  });

  // Provider / Gemini events
  aiProviderSelect?.addEventListener('change', () => { setAiProvider(aiProviderSelect.value); applyProviderUI(); });
  geminiSaveBtn?.addEventListener('click', saveGeminiSettings);
  geminiTestBtn?.addEventListener('click', testGemini);
  mistralSaveBtn?.addEventListener('click', saveMistralSettings);
  mistralTestBtn?.addEventListener('click', testMistral);

  async function loadInfoTab() {
    try {
      // Load GitHub profile for Anes-03
      const res = await fetch('https://api.github.com/users/Anes-03', { method: 'GET', mode: 'cors' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const avatar = data?.avatar_url || '';
      const name = (data?.name && data.name.trim()) || data?.login || 'Anes-03';
      if (infoAvatar && avatar) infoAvatar.src = avatar;
      if (infoName) infoName.textContent = name;
    } catch (_) {
      // Fallbacks
      if (infoAvatar && !infoAvatar.src) infoAvatar.src = '';
      if (infoName && !infoName.textContent) infoName.textContent = 'Anes-03';
    }
    // Populate extra info fields
    try {
      const verEl = document.getElementById('infoVersion');
      const buildEl = document.getElementById('infoBuild');
      const themeEl = document.getElementById('infoTheme');
      const viewEl = document.getElementById('infoView');
      const provEl = document.getElementById('infoProvider');
      if (verEl) verEl.textContent = '—';
      if (buildEl) {
        const d = new Date(document.lastModified || Date.now());
        buildEl.textContent = d.toLocaleString('de-DE');
      }
      if (themeEl) {
        const id = document.body?.dataset?.theme || 'light';
        const t = (function(){ try { return findTheme(id); } catch { return { id, label: id }; } })();
        themeEl.textContent = t.label || id;
      }
      if (viewEl) {
        const v = localStorage.getItem('md-view') || 'split';
        const label = v === 'edit' ? 'Editor' : (v === 'reader' ? 'Reader' : 'Split');
        viewEl.textContent = label;
      }
      if (provEl) {
        const info = resolveCurrentProviderInfo();
        provEl.textContent = formatProviderInfo(info);
      }
    } catch {}
  }

  // Sync model select -> input
  ollamaModelSelect?.addEventListener('change', () => {
    if (ollamaModelInput && ollamaModelSelect.value) ollamaModelInput.value = ollamaModelSelect.value;
  });

  // Editor events
  editor.addEventListener('input', () => { updatePreview(); updateWordCount(); autosave(); markDirty(true); updateEditorContextInfo(); updateDiffPreview(); });
  editor.addEventListener('click', updateCursorInfo);
  editor.addEventListener('keyup', () => { updateCursorInfo(); updateEditorContextInfo(); });
  // In reader mode, clicking preview focuses the hidden editor for typing
  preview.addEventListener('mousedown', () => {
    if (document.body.classList.contains('reader-mode') && window.enableReaderInput) {
      try { editor.focus(); } catch {}
    }
  });

  // Before unload guard
  window.addEventListener('beforeunload', (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
    stopSpeech();
  });

  // Init theme
  (function initTheme() {
    try {
      const saved = localStorage.getItem('md-theme');
      if (saved) applyThemeName(saved);
      else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyThemeName(prefersDark ? 'dark' : 'light');
      }
    } catch {
      applyThemeName('light');
    }
  })();

  // Init view
  (function initView() {
    try {
      const defView = getPrefStr('default-view', 'split');
      const mode = ['edit','split','reader'].includes(defView) ? defView : 'split';
      setView(mode);
    } catch { setView('split'); }
  })();

  // Init provider
  (function initProvider() { try { applyProviderUI(); } catch {} })();

  // Initial render
  loadEmbeddedMediaStore();
  updatePreview();
  updateWordCount();
  updateCursorInfo();
  loadAutosaveIfAny();
  markDirty(false);
  versionState.autoIntervalMs = getStoredAutoSnapshotInterval();
  adjustLayout();
  if (isVersioningSupported()) {
    versionsToggleBtn?.removeAttribute('disabled');
    versionsToggleBtn?.setAttribute('aria-label', 'Versionen anzeigen');
    versionsToggleBtn?.setAttribute('title', 'Versionen anzeigen');
    refreshVersionList();
    updateVersionStatusSummary();
    ensureAutoSnapshots();
  } else {
    versionsToggleBtn?.setAttribute('disabled', 'true');
    versionsToggleBtn?.setAttribute('title', 'Versionsspeicher nicht verfügbar');
    versionsToggleBtn?.setAttribute('aria-label', 'Versionsspeicher nicht verfügbar');
    if (versionsStatusEl) versionsStatusEl.textContent = 'Versionsspeicher nicht verfügbar';
  }
  // Focus editor for immediate typing
  try { editor.focus(); } catch {}
  updateEditorContextInfo();
  initAiInlineDefaults(BUILT_IN_PRESETS);
  initPresetSettings(BUILT_IN_PRESETS);
  updatesReloadBtn?.addEventListener('click', () => { loadRepoUpdates(); });
  // Apply settings
  syncUserContextEnabledControl();
  applyPrefs();
  setTimeout(() => { try { initOnboarding(); } catch {} }, 250);

  function initAiInlineDefaults(builtIns) {
    const picker = document.getElementById('aiPresetPicker');
    const toggle = document.getElementById('aiPresetToggle');
    const menu = document.getElementById('aiPresetMenu');
    const activeNameEl = document.getElementById('aiPresetActiveName');
    const activeDetailsEl = document.getElementById('aiPresetActiveDetails');
    const prompt = document.getElementById('aiPromptInput');
    if (!picker || !toggle || !menu || !prompt) return;

    const builtInPresets = Array.isArray(builtIns) ? builtIns : [];
    let presetList = [];
    let activeIndex = -1;
    let menuOpen = false;

    toggle.setAttribute('aria-controls', 'aiPresetMenu');

    function getPresets() {
      try {
        return normalizePresetList(JSON.parse(localStorage.getItem('ai-presets') || '[]'));
      } catch {
        return [];
      }
    }

    function setPresets(list) {
      const sanitized = normalizePresetList(list);
      try { localStorage.setItem('ai-presets', JSON.stringify(sanitized)); } catch {}
    }

    function ensureDefaults() {
      const list = getPresets();
      const map = new Map(Array.isArray(list) ? list.map(p => [p.name, { ...p }]) : []);
      for (const preset of builtInPresets) {
        if (!preset || typeof preset.name !== 'string') continue;
        const name = preset.name.trim();
        if (!name) continue;
        const existing = map.get(name);
        if (existing) {
          map.set(name, {
            ...preset,
            ...existing,
            name,
            prompt: typeof existing.prompt === 'string' ? existing.prompt : (preset.prompt || ''),
          });
        } else {
          map.set(name, { ...preset, name });
        }
      }
      const merged = Array.from(map.values());
      setPresets(merged);
      return merged;
    }

    function groupPresets(list) {
      const groups = new Map();
      for (let idx = 0; idx < list.length; idx++) {
        const entry = list[idx];
        if (!entry || typeof entry.name !== 'string') continue;
        const rawCat = typeof entry.category === 'string' ? entry.category.trim() : '';
        const category = rawCat || CUSTOM_PRESET_CATEGORY;
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push({ item: entry, index: idx });
      }
      const orderIndex = (id) => {
        const pos = PRESET_CATEGORY_ORDER.indexOf(id);
        return pos >= 0 ? pos : PRESET_CATEGORY_ORDER.length + Array.from(groups.keys()).indexOf(id);
      };
      return Array.from(groups.entries()).sort((a, b) => orderIndex(a[0]) - orderIndex(b[0]));
    }

    function buildMenuMarkup(groups) {
      if (!groups.length) {
        return '<div class="preset-menu-empty">Keine Presets verfügbar</div>';
      }
      const chunks = [];
      for (const [categoryId, entries] of groups) {
        const info = getPresetCategoryInfo(categoryId);
        const icon = info?.icon
          ? `<span class="preset-group-icon" aria-hidden="true"><iconify-icon aria-hidden="true" icon="${escapeHtml(info.icon)}"></iconify-icon></span>`
          : '';
        const title = escapeHtml(info?.label || categoryId || 'Presets');
        const options = entries.map(({ item, index }) => {
          const optionId = `aiPresetOption-${index}`;
          const nameHtml = escapeHtml(item.name);
          const descHtml = item.description ? `<span class="preset-option-desc">${escapeHtml(item.description)}</span>` : '';
          return `<button type="button" class="preset-option" role="option" data-index="${index}" id="${optionId}" tabindex="-1"><span class="preset-option-name">${nameHtml}</span>${descHtml}</button>`;
        }).join('');
        chunks.push(`<div class="preset-group" data-category="${escapeHtml(categoryId)}"><div class="preset-group-header">${icon}<span class="preset-group-title">${title}</span></div><div class="preset-group-options">${options}</div></div>`);
      }
      return chunks.join('');
    }

    function updateMenuSelection() {
      const buttons = menu.querySelectorAll('.preset-option');
      let activeId = '';
      buttons.forEach(btn => {
        const idx = Number(btn.dataset.index);
        const selected = Number.isInteger(idx) && idx === activeIndex;
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
        btn.classList.toggle('is-active', selected);
        btn.setAttribute('tabindex', selected ? '0' : '-1');
        if (selected) activeId = btn.id || '';
      });
      if (activeId) menu.setAttribute('aria-activedescendant', activeId);
      else menu.removeAttribute('aria-activedescendant');
    }

    function updateActiveDisplay() {
      if (!activeNameEl || !activeDetailsEl) return;
      const preset = activeIndex >= 0 ? presetList[activeIndex] : null;
      if (!preset) {
        activeNameEl.textContent = 'Preset auswählen';
        activeDetailsEl.textContent = 'Schnellstart für KI-Aufgaben';
        toggle.dataset.selected = 'false';
        return;
      }
      activeNameEl.textContent = preset.name;
      const info = getPresetCategoryInfo(preset.category);
      activeDetailsEl.textContent = '';
      if (info?.label) {
        const cat = document.createElement('span');
        cat.className = 'preset-active-meta preset-active-category';
        if (info.icon) {
          const iconWrap = document.createElement('span');
          iconWrap.className = 'preset-active-icon';
          iconWrap.setAttribute('aria-hidden', 'true');
          const iconEl = document.createElement('iconify-icon');
          iconEl.setAttribute('aria-hidden', 'true');
          iconEl.setAttribute('icon', info.icon);
          iconWrap.appendChild(iconEl);
          cat.appendChild(iconWrap);
        }
        const labelEl = document.createElement('span');
        labelEl.className = 'preset-active-category-label';
        labelEl.textContent = info.label;
        cat.appendChild(labelEl);
        activeDetailsEl.appendChild(cat);
      }
      if (preset.description) {
        if (activeDetailsEl.childNodes.length) {
          const separator = document.createElement('span');
          separator.className = 'preset-active-separator';
          separator.textContent = '·';
          activeDetailsEl.appendChild(separator);
        }
        const desc = document.createElement('span');
        desc.className = 'preset-active-meta preset-active-description';
        desc.textContent = preset.description;
        activeDetailsEl.appendChild(desc);
      }
      toggle.dataset.selected = 'true';
    }

    function renderMenu({ preserveSelection = true } = {}) {
      const previousName = preserveSelection && activeIndex >= 0 ? (presetList[activeIndex]?.name || '') : '';
      const list = ensureDefaults();
      presetList = list;
      const groups = groupPresets(list);
      menu.innerHTML = buildMenuMarkup(groups);
      if (previousName) {
        const idx = list.findIndex(p => p.name === previousName);
        activeIndex = idx >= 0 ? idx : -1;
      } else if (preserveSelection && activeIndex >= 0 && list[activeIndex]) {
        // keep current selection
      } else if (!preserveSelection) {
        activeIndex = -1;
      } else if (activeIndex >= list.length) {
        activeIndex = -1;
      }
      updateMenuSelection();
      updateActiveDisplay();
    }

    function setActiveIndex(index, { applyPrompt = false } = {}) {
      if (!presetList[index]) {
        activeIndex = -1;
        updateMenuSelection();
        updateActiveDisplay();
        return;
      }
      activeIndex = index;
      updateMenuSelection();
      updateActiveDisplay();
      if (applyPrompt) {
        const preset = presetList[index];
        if (preset && typeof preset.prompt === 'string') {
          prompt.value = preset.prompt;
        }
      }
    }

    function getMenuItems() {
      return Array.from(menu.querySelectorAll('.preset-option'));
    }

    function openMenu() {
      if (menuOpen) return;
      renderMenu({ preserveSelection: true });
      menu.classList.remove('hidden');
      toggle.setAttribute('aria-expanded', 'true');
      menuOpen = true;
      const activeBtn = menu.querySelector('.preset-option.is-active');
      const target = activeBtn || menu.querySelector('.preset-option');
      if (target) {
        target.focus();
        target.scrollIntoView({ block: 'nearest' });
      }
    }

    function closeMenu({ focusToggle = false } = {}) {
      if (!menuOpen) return;
      menu.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
      menuOpen = false;
      if (focusToggle) {
        try { toggle.focus(); } catch {}
      }
    }

    toggle.addEventListener('click', () => {
      if (menuOpen) closeMenu(); else openMenu();
    });

    toggle.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'ArrowUp', ' ', 'Enter'].includes(event.key)) {
        event.preventDefault();
        if (!menuOpen) openMenu();
        const items = getMenuItems();
        const activeBtn = menu.querySelector('.preset-option.is-active');
        const target = activeBtn || items[0];
        target?.focus();
      }
    });

    menu.addEventListener('click', (event) => {
      const option = event.target.closest('.preset-option');
      if (!option) return;
      event.preventDefault();
      const idx = Number(option.dataset.index);
      if (!Number.isInteger(idx)) return;
      setActiveIndex(idx, { applyPrompt: true });
      closeMenu({ focusToggle: true });
    });

    menu.addEventListener('keydown', (event) => {
      const items = getMenuItems();
      if (!items.length) {
        if (event.key === 'Escape') closeMenu({ focusToggle: true });
        return;
      }
      const currentIndex = items.indexOf(document.activeElement);
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        const next = items[(currentIndex + 1) % items.length];
        next?.focus();
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const next = items[(currentIndex - 1 + items.length) % items.length];
        next?.focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        items[items.length - 1]?.focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu({ focusToggle: true });
      } else if (event.key === 'Enter' || event.key === ' ') {
        const option = document.activeElement?.closest('.preset-option');
        if (option) {
          event.preventDefault();
          option.click();
        }
      }
    });

    menu.addEventListener('focusout', (event) => {
      if (!menuOpen) return;
      const related = event.relatedTarget;
      if (!menu.contains(related)) {
        closeMenu();
      }
    });

    document.addEventListener('click', (event) => {
      if (!menuOpen) return;
      if (!picker.contains(event.target)) closeMenu();
    });

    document.addEventListener('presets-updated', () => {
      renderMenu({ preserveSelection: true });
    });

    aiPresetSettingsBtn?.addEventListener('click', () => { if (menuOpen) closeMenu(); });

    syncInlinePresetPicker = ({ preserveSelection = true } = {}) => {
      renderMenu({ preserveSelection });
    };

    renderMenu({ preserveSelection: false });
  }

  // Preferences helpers
  function initPresetSettings(builtIns) {
    const sel = document.getElementById('settingsPresetSelect');
    const name = document.getElementById('settingsPresetName');
    const prompt = document.getElementById('settingsPresetPrompt');
    const saveBtn = document.getElementById('settingsPresetSaveBtn');
    const delBtn = document.getElementById('settingsPresetDeleteBtn');
    const renameBtn = document.getElementById('settingsPresetRenameBtn');
    const newBtn = document.getElementById('settingsPresetNewBtn');
    const dupBtn = document.getElementById('settingsPresetDuplicateBtn');
    const exportBtn = document.getElementById('aiPresetExportBtn');
    const importBtn = document.getElementById('aiPresetImportBtn');
    const importFile = document.getElementById('aiPresetImportFile');
    const presetStatus = document.getElementById('settingsPresetStatus');
    if (!sel || !prompt) return;

    const builtInPresets = Array.isArray(builtIns) ? builtIns : [];

    const setPresetStatus = (msg, ok = false) => {
      if (!presetStatus) return;
      presetStatus.textContent = msg || '';
      presetStatus.style.color = ok ? 'var(--accent)' : 'var(--muted)';
    };

    function getPresets() {
      try {
        return normalizePresetList(JSON.parse(localStorage.getItem('ai-presets') || '[]'));
      } catch {
        return [];
      }
    }

    function setPresets(list) {
      const sanitized = normalizePresetList(list);
      try { localStorage.setItem('ai-presets', JSON.stringify(sanitized)); } catch {}
      return sanitized;
    }

    function ensureDefaults() {
      const list = getPresets();
      const map = new Map(Array.isArray(list) ? list.map(p => [p.name, { ...p }]) : []);
      for (const preset of builtInPresets) {
        if (!preset || typeof preset.name !== 'string') continue;
        const presetName = preset.name.trim();
        if (!presetName) continue;
        const existing = map.get(presetName);
        if (existing) {
          map.set(presetName, {
            ...preset,
            ...existing,
            name: presetName,
            prompt: typeof existing.prompt === 'string' ? existing.prompt : (preset.prompt || ''),
          });
        } else {
          map.set(presetName, { ...preset, name: presetName });
        }
      }
      const merged = Array.from(map.values());
      setPresets(merged);
      return merged;
    }

    function formatOptionLabel(preset) {
      const info = getPresetCategoryInfo(preset.category);
      return `${preset.name}${preset.category ? ` · ${info?.label || preset.category}` : ''}`;
    }

    function populate() {
      const list = ensureDefaults();
      sel.innerHTML = list.map((p, i) => `<option value="${i}">${escapeHtml(formatOptionLabel(p))}</option>`).join('');
    }

    function refreshInlinePicker() {
      syncInlinePresetPicker({ preserveSelection: true });
    }

    function loadSelectionFields() {
      const list = getPresets();
      let idx = parseInt(sel.value, 10);
      if (isNaN(idx) || !list[idx]) {
        idx = list.length ? 0 : -1;
        if (idx >= 0) sel.value = String(idx);
      }
      const active = idx >= 0 ? list[idx] : null;
      if (active) {
        prompt.value = active.prompt || '';
        if (name) name.value = active.name || '';
        setPresetStatus('Preset geladen', true);
      } else {
        prompt.value = '';
        if (name) name.value = '';
        setPresetStatus('Keine Presets verfügbar', false);
      }
    }

    populate();
    refreshInlinePicker();
    loadSelectionFields();

    sel.addEventListener('change', () => {
      const list = getPresets();
      const idx = parseInt(sel.value, 10);
      const p = list[idx];
      if (p) {
        prompt.value = p.prompt || '';
        if (name) name.value = p.name || '';
        setPresetStatus('Preset geladen', true);
      }
    });

    newBtn?.addEventListener('click', () => {
      if (name) name.value = '';
      prompt.value = '';
      setPresetStatus('Neues Preset – ausfüllen und speichern', true);
    });

    dupBtn?.addEventListener('click', () => {
      const list = getPresets();
      const idx = parseInt(sel.value, 10);
      const base = (!isNaN(idx) && list[idx]) ? list[idx] : {
        name: (name?.value || 'Preset').trim() || 'Preset',
        prompt: (prompt?.value || '').trim(),
        category: CUSTOM_PRESET_CATEGORY,
      };
      let newName = base.name + ' (Kopie)';
      const existingNames = new Set(list.map(p => p.name));
      let n = 2;
      while (existingNames.has(newName)) { newName = `${base.name} (Kopie ${n++})`; }
      const copy = { ...base, name: newName };
      if (!copy.category) copy.category = CUSTOM_PRESET_CATEGORY;
      const updated = [...list, copy];
      const sanitized = setPresets(updated);
      populate();
      refreshInlinePicker();
      const newIdx = sanitized.findIndex(p => p.name === newName);
      if (newIdx >= 0) sel.value = String(newIdx);
      if (name) name.value = newName;
      prompt.value = copy.prompt || '';
      setPresetStatus('Preset dupliziert', true);
    });

    async function getPresetModelForRequest() {
      const provider = getAiProvider();
      if (provider === 'ollama') {
        const base = (ollamaUrlInput?.value || localStorage.getItem('ollama-url') || 'http://localhost:11434');
        const def = (ollamaModelSelect?.value || ollamaModelInput?.value || localStorage.getItem('ollama-model') || 'llama3.1:8b').trim();
        return { provider, base, model: def };
      } else if (provider === 'gemini') {
        const apiKey = (geminiApiKeyInput?.value || localStorage.getItem('gemini-api-key') || '').trim();
        const def = (geminiModelSelect?.value || geminiModelInput?.value || localStorage.getItem('gemini-model') || 'gemini-1.5-flash').trim();
        return { provider, apiKey, model: def };
      } else {
        const apiKey = (mistralApiKeyInput?.value || localStorage.getItem('mistral-api-key') || '').trim();
        const def = (mistralModelSelect?.value || mistralModelInput?.value || localStorage.getItem('mistral-model') || 'mistral-small-latest').trim();
        return { provider, apiKey, model: def };
      }
    }

    saveBtn?.addEventListener('click', () => {
      const list = getPresets();
      const nm = (name?.value || '').trim() || 'Preset';
      const pr = (prompt?.value || '').trim();
      if (!pr) {
        setPresetStatus('Prompt darf nicht leer sein', false);
        return;
      }
      const exist = list.findIndex(x => x.name === nm);
      const payload = { ...(exist >= 0 ? list[exist] : {}), name: nm, prompt: pr };
      if (!payload.category) payload.category = CUSTOM_PRESET_CATEGORY;
      const updated = exist >= 0
        ? [...list.slice(0, exist), payload, ...list.slice(exist + 1)]
        : [...list, payload];
      const sanitized = setPresets(updated);
      populate();
      refreshInlinePicker();
      const idx = sanitized.findIndex(x => x.name === nm);
      if (idx >= 0) sel.value = String(idx);
      setPresetStatus('Preset gespeichert', true);
    });

    renameBtn?.addEventListener('click', () => {
      const list = getPresets();
      const idx = parseInt(sel.value, 10);
      if (isNaN(idx)) return;
      const current = list[idx];
      const newName = (name?.value || '').trim();
      if (!current || !newName) return;
      const dup = list.findIndex(x => x.name === newName);
      const updated = [...list];
      if (dup >= 0 && dup !== idx) updated.splice(dup, 1);
      const entry = { ...current, name: newName, prompt: (prompt?.value || '').trim() };
      if (!entry.category) entry.category = CUSTOM_PRESET_CATEGORY;
      updated[idx] = entry;
      const sanitized = setPresets(updated);
      populate();
      refreshInlinePicker();
      const nidx = sanitized.findIndex(x => x.name === newName);
      if (nidx >= 0) sel.value = String(nidx);
      setPresetStatus('Preset umbenannt', true);
    });

    delBtn?.addEventListener('click', () => {
      const list = getPresets();
      const idx = parseInt(sel.value, 10);
      if (isNaN(idx)) return;
      const updated = [...list];
      updated.splice(idx, 1);
      setPresets(updated);
      populate();
      refreshInlinePicker();
      if (name) name.value = '';
      prompt.value = '';
      setPresetStatus('Preset gelöscht', true);
    });

    exportBtn?.addEventListener('click', () => {
      const list = getPresets();
      const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ai-presets.json';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    });

    importBtn?.addEventListener('click', () => { importFile?.click(); });
    importFile?.addEventListener('change', async () => {
      const f = importFile.files && importFile.files[0];
      if (!f) return;
      try {
        const text = await f.text();
        const arr = JSON.parse(text);
        if (!Array.isArray(arr)) throw new Error('Format');
        const incoming = normalizePresetList(arr);
        const existing = getPresets();
        const map = new Map(existing.map(p => [p.name, { ...p }]));
        for (const item of incoming) {
          if (!item || typeof item.name !== 'string') continue;
          const merged = { ...(map.get(item.name) || {}), ...item, name: item.name };
          if (!merged.category) merged.category = CUSTOM_PRESET_CATEGORY;
          map.set(item.name, merged);
        }
        const mergedList = Array.from(map.values());
        setPresets(mergedList);
        populate();
        refreshInlinePicker();
        setPresetStatus('Presets importiert', true);
      } catch (e) {
        alert('Import fehlgeschlagen. Bitte gültige JSON-Presets wählen.');
        setPresetStatus('Import fehlgeschlagen', false);
      } finally {
        importFile.value = '';
      }
    });

    document.addEventListener('presets-updated', () => {
      populate();
      refreshInlinePicker();
      loadSelectionFields();
      setPresetStatus('Presets aktualisiert', true);
    });
  }

})();

// PDF export via html2pdf.js
function doExportPdf() {
  const preview = document.getElementById('preview');
  if (!preview) return;
  const mdTitle = (function () {
    const editor = document.getElementById('editor');
    if (!editor) return '';
    const m = editor.value.match(/^\s*#\s+(.+)/m);
    return m ? m[1].trim() : '';
  })();
  const currentFileName = document.getElementById('fileName')?.textContent?.replace(/^Datei:\s*/, '') || '';
  const baseName = (mdTitle || currentFileName || 'Export').replace(/\.[^.]+$/, '');
  const safeName = (() => {
    const normalized = baseName.normalize('NFKD');
    let filtered = '';
    for (const char of normalized) {
      const upper = char.toLocaleUpperCase('de-DE');
      const lower = char.toLocaleLowerCase('de-DE');
      const isLetter = upper !== lower;
      const isDigitChar = char >= '0' && char <= '9';
      if (isLetter || isDigitChar || char === '-' || char === '_' || char === '.' || char === ' ') {
        filtered += char;
      }
    }
    return filtered.trim().replace(/\s+/g, '-');
  })();

  const cs = getComputedStyle(document.body);
  const bg = cs.getPropertyValue('--bg') || '#ffffff';

  const opt = {
    margin:       10,
    filename:     `${safeName || 'Export'}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, backgroundColor: bg.trim() || '#ffffff' },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (window.html2pdf) {
    window.html2pdf().from(preview).set(opt).save();
  } else {
    // Fallback to print if library not ready
    window.print();
  }
}

function getPref(key, defVal) { try { const v = localStorage.getItem('pref-' + key); if (v === null) return defVal; return v === '1' || v === 'true'; } catch { return defVal; } }
function setPref(key, val) { try { localStorage.setItem('pref-' + key, val ? '1' : '0'); } catch {} }
function getPrefStr(key, defVal) { try { const v = localStorage.getItem('pref-' + key); return v === null ? defVal : v; } catch { return defVal; } }
function setPrefStr(key, val) { try { localStorage.setItem('pref-' + key, String(val)); } catch {} }
function applyPrefs() {
  const sticky = getPref('sticky-tools', true);
  document.body.classList.toggle('sticky-tools', sticky);
  const reader = getPref('reader-input', true);
  window.enableReaderInput = reader;
  const showAi = getPref('ai-inline-open', false);
  const aiInline = document.getElementById('aiInline');
  if (aiInline) aiInline.classList.toggle('hidden', !showAi);
  try { adjustLayout(); } catch {}
}
