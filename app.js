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
  const hiddenPdf = document.getElementById('hiddenPdf');
  const hiddenDocx = document.getElementById('hiddenDocx');
  const importBtn = document.getElementById('importBtn');
  const importMenu = document.getElementById('importMenu');
  const hljsThemeLink = document.getElementById('hljs-theme');

  // Buttons
  const newBtn = document.getElementById('newBtn');
  const openBtn = document.getElementById('openBtn');
  const saveBtn = document.getElementById('saveBtn');
  const saveAsBtn = document.getElementById('saveAsBtn');
  const exportHtmlBtn = document.getElementById('exportHtmlBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  const editViewBtn = document.getElementById('editViewBtn');
  const splitViewBtn = document.getElementById('splitViewBtn');
  const readerViewBtn = document.getElementById('readerViewBtn');
  const workspace = document.getElementById('workspace');

  const themeSelect = null; // removed select dropdown
  const themeCycleBtn = document.getElementById('themeCycleBtn');
  const themeMenu = document.getElementById('themeMenu');
  // Inline AI elements
  const aiInline = document.getElementById('aiInline');
  const aiPromptInput = document.getElementById('aiPromptInput');
  const aiUseSelection = document.getElementById('aiUseSelection');
  const aiGenStartBtn = document.getElementById('aiGenStartBtn');
  const aiGenAbortBtn = document.getElementById('aiGenAbortBtn');
  const aiGenResetBtn = document.getElementById('aiGenResetBtn');
  const aiGenInfo = document.getElementById('aiGenInfo');
  const aiPresetRenameBtn = document.getElementById('aiPresetRenameBtn');
  const aiPresetExportBtn = document.getElementById('aiPresetExportBtn');
  const aiPresetImportBtn = document.getElementById('aiPresetImportBtn');
  const aiPresetImportFile = document.getElementById('aiPresetImportFile');

  // Chat elements
  const chatToggleBtn = document.getElementById('chatToggleBtn');
  const chatOverlay = document.getElementById('chatOverlay');
  const chatPanel = document.getElementById('chatPanel');
  const chatCloseBtn = document.getElementById('chatCloseBtn');
  const chatModelBadge = document.getElementById('chatModelBadge');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatAbortBtn = document.getElementById('chatAbortBtn');
  const chatClearBtn = document.getElementById('chatClearBtn');
  const chatStreamToggle = document.getElementById('chatStreamToggle');
  const applyModeSelect = null;
  const aiGenerateBtn = document.getElementById('aiGenerateBtn');
  // Provider + Gemini/Mistral elements
  const aiProviderSelect = document.getElementById('aiProvider');
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

  const toolbar = document.querySelector('.toolbar');

  // State
  let fileHandle = null;
  let currentFileName = '';
  let dirty = false;
  let allowEditorContext = false;
  let importMenuVisible = false;

  // Utilities
  const supportsFSA = () => 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;

  if (window.pdfjsLib?.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.js';
  }

  let turndownService = null;

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

  // Provider helpers
  function getAiProvider() {
    try { return localStorage.getItem('ai-provider') || 'ollama'; } catch { return 'ollama'; }
  }
  function setAiProvider(p) {
    try { localStorage.setItem('ai-provider', p); } catch {}
  }
  function applyProviderUI() {
    const p = getAiProvider();
    if (aiProviderSelect) aiProviderSelect.value = p;
    if (ollamaSettingsGroup) ollamaSettingsGroup.style.display = p === 'ollama' ? '' : 'none';
    if (geminiSettingsGroup) geminiSettingsGroup.style.display = p === 'gemini' ? '' : 'none';
    if (mistralSettingsGroup) mistralSettingsGroup.style.display = p === 'mistral' ? '' : 'none';
    // Update inline info/badge
    try { updateChatModelBadge(); } catch {}
    try {
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
    } catch {}
  }


  function resolveCurrentProviderInfo(presetOverrideModel) {
    const provider = getAiProvider();
    if (provider === 'ollama') {
      const base = (ollamaUrlInput?.value || localStorage.getItem('ollama-url') || 'http://localhost:11434').replace(/\/$/, '');
      const defaultModel = (ollamaModelSelect?.value || ollamaModelInput?.value || localStorage.getItem('ollama-model') || 'llama3.1:8b').trim();
      const model = (presetOverrideModel && presetOverrideModel.trim()) ? presetOverrideModel.trim() : defaultModel;
      return { provider, base, model };
    } else if (provider === 'gemini') {
      const base = 'gemini';
      const defaultModel = (geminiModelSelect?.value || geminiModelInput?.value || localStorage.getItem('gemini-model') || 'gemini-1.5-flash').trim();
      const model = (presetOverrideModel && presetOverrideModel.trim()) ? presetOverrideModel.trim() : defaultModel;
      return { provider, base, model };
    } else {
      const base = 'mistral';
      const defaultModel = (mistralModelSelect?.value || mistralModelInput?.value || localStorage.getItem('mistral-model') || 'mistral-small-latest').trim();
      const model = (presetOverrideModel && presetOverrideModel.trim()) ? presetOverrideModel.trim() : defaultModel;
      return { provider, base, model };
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
        if (labelEl) labelEl.textContent = running ? 'Abbrechen' : 'Generieren';
        else btn.textContent = running ? 'Abbrechen' : 'Generieren';
      } catch {
        btn.textContent = running ? 'Abbrechen' : 'Generieren';
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
      if (info.provider === 'ollama') {
        return await ollamaChat({ base: info.base, model: info.model, messages, stream: true, signal, onDelta });
      }
      if (info.provider === 'gemini') {
        const apiKey = (geminiApiKeyInput?.value || localStorage.getItem('gemini-api-key') || '').trim();
        if (!apiKey) throw new Error('Gemini API‑Key fehlt');
        return await geminiChat({ apiKey, model: info.model, messages, stream: true, signal, onDelta });
      }
      const apiKey = (mistralApiKeyInput?.value || localStorage.getItem('mistral-api-key') || '').trim();
      if (!apiKey) throw new Error('Mistral API‑Key fehlt');
      return await mistralChat({ apiKey, model: info.model, messages, stream: true, signal, onDelta });
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

  function updatePreview() {
    const md = editor.value;
    const html = marked.parse(md);
    const safe = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    preview.innerHTML = safe;
    // re-highlight just in case
    preview.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el));
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
    } catch {}
  }

  function loadAutosaveIfAny() {
    try {
      const content = localStorage.getItem('md-autosave-content');
      if (content && !editor.value) {
        editor.value = content;
        updatePreview();
        updateCursorInfo();
        updateWordCount();
        markDirty(false);
      }
    } catch {}
  }

  // Editor context helpers
  const MAX_CONTEXT_CHARS = 20000;
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

  function toSafeFileName(name) {
    return name.replace(/[^\p{L}\p{N}\-_\.\s]/gu, '').replace(/\s+/g, ' ').trim().replace(/\s/g, '-');
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
    const tpl = `\n\n| Spalte 1 | Spalte 2 |\n| --- | --- |\n|  |  |\n\n`;
    insertAtCursor(tpl);
  }

  function insertHr() {
    insertAtCursor('\n\n---\n\n');
  }

  function insertQuote() {
    prefixLines(editor, '> ');
  }

  // Images via file input, paste, drag & drop
  function chooseImageFile() {
    hiddenImage.value = '';
    hiddenImage.click();
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
    insertAtCursor(`![${alt}](${dataUrl})`);
    updatePreview();
    markDirty(true);
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
        insertAtCursor(`![${file.name.replace(/\.[^.]+$/, '')}](${dataUrl})`);
        updatePreview();
        markDirty(true);
      }
    }
  });

  // Drag & drop: .md to open, PDFs/Word zum Importieren, Bilder zum Einfügen
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
      editor.value = text;
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
    // Insert all images
    for (const f of files) {
      if (f.type.startsWith('image/')) {
        const dataUrl = await fileToDataURL(f);
        insertAtCursor(`\n![${f.name.replace(/\.[^.]+$/, '')}](${dataUrl})\n`);
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
      case 'h3': heading(3); break;
      case 'bold': toggleWrapSelection(editor, ['**', '**']); break;
      case 'italic': toggleWrapSelection(editor, ['*', '*']); break;
      case 'strike': toggleWrapSelection(editor, ['~~', '~~']); break;
      case 'code': toggleWrapSelection(editor, ['`', '`']); break;
      case 'codeblock': insertCodeBlock(); break;
      case 'ul': insertList(false); break;
      case 'ol': insertList(true); break;
      case 'task': insertTaskList(); break;
      case 'quote': insertQuote(); break;
      case 'link': insertLink(); break;
      case 'image': chooseImageFile(); break;
      case 'table': insertTable(); break;
      case 'hr': insertHr(); break;
      default: break;
    }
    updatePreview();
    updateCursorInfo();
    updateWordCount();
    markDirty(true);
  });

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
  });

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
      editor.value = finalText ? `${finalText}\n` : '';
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
      const sanitizedHtml = window.DOMPurify ? window.DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } }) : rawHtml;
      const markdown = sanitizedHtml ? td.turndown(sanitizedHtml).trim() : '';
      editor.value = markdown ? `${markdown}\n` : '';
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
        editor.value = text;
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
    editor.value = text;
    setFileName(file.name);
    fileHandle = null;
    updatePreview();
    updateCursorInfo();
    updateWordCount();
    markDirty(false);
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
        await writable.write(editor.value);
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
        await writable.write(editor.value);
        await writable.close();
        fileHandle = handle;
        setFileName(handle.name);
        markDirty(false);
      } catch (_) {}
    } else {
      // Fallback: download
      const blob = new Blob([editor.value], { type: 'text/markdown' });
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
    setFileName('');
    fileHandle = null;
    updatePreview();
    updateCursorInfo();
    updateWordCount();
    markDirty(false);
  }

  function doExportHtml() {
    const md = editor.value;
    const html = marked.parse(md);
    const safe = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
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
  exportHtmlBtn.addEventListener('click', doExportHtml);
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', doExportPdf);
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

  function openChat() {
    chatPanel?.classList.remove('hidden');
    chatOverlay?.classList.remove('hidden');
    document.body.classList.add('chat-open');
    adjustLayout();
    chatInput?.focus();
    const provider = getAiProvider();
    if (provider === 'ollama') {
      const base = (ollamaUrlInput?.value || '').trim();
      if (base) testOllama();
    } else if (provider === 'gemini') {
      testGemini();
    } else {
      testMistral();
    }
    updateChatModelBadge();
  }
  function closeChat() {
    chatOverlay?.classList.add('hidden');
    chatPanel?.classList.add('hidden');
    try { chatAbortController?.abort(); } catch {}
    setChatBusy(false);
    document.body.classList.remove('chat-open');
    document.documentElement.style.setProperty('--chat-w', '0px');
    adjustLayout();
  }

  function effectiveChatModel() {
    const provider = getAiProvider();
    if (provider === 'ollama') {
      const selVal = (ollamaModelSelect?.value || '').trim();
      const inpVal = (ollamaModelInput?.value || '').trim();
      const local = (localStorage.getItem('ollama-model') || '').trim();
      return selVal || inpVal || local || '';
    } else if (provider === 'gemini') {
      const selVal = (geminiModelSelect?.value || '').trim();
      const inpVal = (geminiModelInput?.value || '').trim();
      const local = (localStorage.getItem('gemini-model') || '').trim();
      return selVal || inpVal || local || 'gemini-1.5-flash';
    } else {
      const selVal = (mistralModelSelect?.value || '').trim();
      const inpVal = (mistralModelInput?.value || '').trim();
      const local = (localStorage.getItem('mistral-model') || '').trim();
      return selVal || inpVal || local || 'mistral-small-latest';
    }
  }
  function updateChatModelBadge() {
    if (!chatModelBadge) return;
    const m = effectiveChatModel();
    const provider = getAiProvider();
    const provLabel = provider === 'ollama' ? 'Ollama' : (provider === 'gemini' ? 'Gemini' : 'Mistral');
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
    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.title = 'Kopieren';
    copyBtn.innerHTML = '<iconify-icon aria-hidden="true" icon="lucide:copy"></iconify-icon>';
    el.appendChild(copyBtn);
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
    const safe = DOMPurify.sanitize(html, { ADD_TAGS: ['details','summary'], ADD_ATTR: ['open','class'] });
    container.innerHTML = safe;
    container.querySelectorAll('pre code').forEach((node) => hljs.highlightElement(node));
  }

  let chatHistory = [];
  let chatAbortController = null;
  // removed editor-applied change modes

  function setChatBusy(busy) {
    if (chatSendBtn) chatSendBtn.disabled = !!busy;
    if (chatAbortBtn) chatAbortBtn.disabled = !busy;
    if (chatInput) chatInput.disabled = !!busy;
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
    msgs.push(...chatHistory);
    const currentUserMsg = { role: 'user', content: text };
    msgs.push(currentUserMsg);
    chatHistory.push(currentUserMsg);
    appendChatMessage('user', text);
    const provider = getAiProvider();
    const base = (ollamaUrlInput?.value || '').replace(/\/$/, '');
    const model = effectiveChatModel();
    const stream = !!chatStreamToggle?.checked;
    try {
      const assistantEl = appendChatMessage('assistant', '');
      setChatBusy(true);
      chatAbortController = new AbortController();
      const signal = chatAbortController.signal;
      let content = '';
      if (provider === 'ollama') {
        content = await ollamaChat({ base, model, messages: msgs, stream, signal, onDelta: (delta) => {
          const md = (assistantEl.__raw || '') + delta;
          assistantEl.__raw = md;
          renderAssistantMarkdown(assistantEl.querySelector('div'), md);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }});
      } else if (provider === 'gemini') {
        const apiKey = (geminiApiKeyInput?.value || localStorage.getItem('gemini-api-key') || '').trim();
        content = await geminiChat({ apiKey, model, messages: msgs, stream, signal, onDelta: (delta) => {
          const md = (assistantEl.__raw || '') + delta;
          assistantEl.__raw = md;
          renderAssistantMarkdown(assistantEl.querySelector('div'), md);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }});
      } else {
        const apiKey = (mistralApiKeyInput?.value || localStorage.getItem('mistral-api-key') || '').trim();
        content = await mistralChat({ apiKey, model, messages: msgs, stream, signal, onDelta: (delta) => {
          const md = (assistantEl.__raw || '') + delta;
          assistantEl.__raw = md;
          renderAssistantMarkdown(assistantEl.querySelector('div'), md);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }});
      }
      chatHistory.push({ role: 'assistant', content });
      // Apply modes
      // no auto-apply/diff handling
      setChatBusy(false);
      chatAbortController = null;
    } catch (e) {
      if (e?.name === 'AbortError') {
        appendChatMessage('assistant', '⏹️ Abgebrochen.');
      } else {
        appendChatMessage('assistant', 'Fehler: ' + (e?.message || e));
      }
      setChatBusy(false);
      chatAbortController = null;
    }
  }

  // removed diff/apply helpers

  async function ollamaChat({ base, model, messages, stream, signal, onDelta }) {
    const url = (base || 'http://localhost:11434').replace(/\/$/, '') + '/api/chat';
    const body = { model: model || 'llama3.1:8b', messages, stream: !!stream, options: {} };
    const res = await fetch(url, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
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
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const txt = ((data?.candidates?.[0]?.content?.parts || []).map(p => p?.text || '').join('')) || '';
      if (onDelta) onDelta(txt);
      return txt;
    }
    const url = `${base}${encodeURIComponent(mdl)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' }, body: JSON.stringify(body), signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
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
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const txt = (data?.choices?.[0]?.message?.content) || '';
      if (onDelta) onDelta(txt);
      return txt;
    }
    const res = await fetch(base, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream', 'Authorization': `Bearer ${key}` }, body: JSON.stringify(body), signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
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

  // Chat events
  chatToggleBtn?.addEventListener('click', () => {
    loadOllamaSettings();
    loadGeminiSettings();
    try { loadMistralSettings(); } catch {}
    if (chatPanel?.classList.contains('hidden')) openChat(); else closeChat();
  });
  ollamaModelSelect?.addEventListener('change', updateChatModelBadge);
  ollamaModelInput?.addEventListener('input', updateChatModelBadge);
  ollamaSaveBtn?.addEventListener('click', () => setTimeout(updateChatModelBadge, 50));
  ollamaTestBtn?.addEventListener('click', () => setTimeout(updateChatModelBadge, 200));
  geminiModelSelect?.addEventListener('change', updateChatModelBadge);
  geminiModelInput?.addEventListener('input', updateChatModelBadge);
  mistralModelSelect?.addEventListener('change', updateChatModelBadge);
  mistralModelInput?.addEventListener('input', updateChatModelBadge);
  chatOverlay?.addEventListener('click', closeChat);
  chatCloseBtn?.addEventListener('click', closeChat);
  chatSendBtn?.addEventListener('click', sendChat);
  chatAbortBtn?.addEventListener('click', () => { try { chatAbortController?.abort(); } catch {} });
  chatClearBtn?.addEventListener('click', () => { chatMessages.innerHTML = ''; chatHistory = []; });
  editorContextBtn?.addEventListener('click', () => { allowEditorContext = !allowEditorContext; updateEditorContextInfo(); });
  // removed applyModeSelect listener
  chatMessages?.addEventListener('click', async (e) => {
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
  ollamaSaveBtn?.addEventListener('click', saveOllamaSettings);
  ollamaTestBtn?.addEventListener('click', testOllama);
  // Settings handlers
  settingsBtn?.addEventListener('click', () => {
    settingsPanel?.classList.remove('hidden');
    settingsOverlay?.classList.remove('hidden');
    // default to General tab
    try { showSettingsTab('general'); } catch {}
    prefReaderInput && (prefReaderInput.checked = getPref('reader-input', true));
    prefStickyTools && (prefStickyTools.checked = getPref('sticky-tools', true));
    prefAiInlineAutoOpen && (prefAiInlineAutoOpen.checked = getPref('ai-inline-open', false));
    if (prefDefaultView) {
      const dv = getPrefStr('default-view', 'split');
      prefDefaultView.value = ['edit','split','reader'].includes(dv) ? dv : 'split';
    }
    // Load provider settings
    try { loadOllamaSettings(); } catch {}
    try { loadGeminiSettings(); } catch {}
    try { loadMistralSettings(); } catch {}
    try { applyProviderUI(); } catch {}
  });
  function closeSettings() { settingsPanel?.classList.add('hidden'); settingsOverlay?.classList.add('hidden'); }
  settingsOverlay?.addEventListener('click', closeSettings);
  settingsCloseBtn?.addEventListener('click', closeSettings);
  settingsSaveBtn?.addEventListener('click', () => {
    setPref('reader-input', !!prefReaderInput?.checked);
    setPref('sticky-tools', !!prefStickyTools?.checked);
    setPref('ai-inline-open', !!prefAiInlineAutoOpen?.checked);
    if (prefDefaultView && prefDefaultView.value) setPrefStr('default-view', prefDefaultView.value);
    applyPrefs();
    closeSettings();
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
  geminiModelSelect?.addEventListener('change', () => { if (geminiModelInput && geminiModelSelect.value) geminiModelInput.value = geminiModelSelect.value; });
  mistralSaveBtn?.addEventListener('click', saveMistralSettings);
  mistralTestBtn?.addEventListener('click', testMistral);
  mistralModelSelect?.addEventListener('change', () => { if (mistralModelInput && mistralModelSelect.value) mistralModelInput.value = mistralModelSelect.value; });

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
        if (info.provider === 'ollama') provEl.textContent = `Ollama • Modell: ${info.model} • URL: ${info.base}`;
        else if (info.provider === 'gemini') provEl.textContent = `Google Gemini • Modell: ${info.model}`;
        else provEl.textContent = `Mistral • Modell: ${info.model}`;
      }
    } catch {}
  }

  // Sync model select -> input
  ollamaModelSelect?.addEventListener('change', () => {
    if (ollamaModelInput && ollamaModelSelect.value) ollamaModelInput.value = ollamaModelSelect.value;
  });

  // Editor events
  editor.addEventListener('input', () => { updatePreview(); updateWordCount(); autosave(); markDirty(true); updateEditorContextInfo(); });
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
  updatePreview();
  updateWordCount();
  updateCursorInfo();
  loadAutosaveIfAny();
  markDirty(false);
  adjustLayout();
  // Focus editor for immediate typing
  try { editor.focus(); } catch {}
  updateEditorContextInfo();
  initAiInlineDefaults();
  initPresetSettings();
  // Apply settings
  applyPrefs();

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
  const safeName = baseName.replace(/[^\p{L}\p{N}\-_\.\s]/gu, '').trim().replace(/\s+/g, '-');

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

  function initAiInlineDefaults() {
  const sel = document.getElementById('aiPresetSelect');
  const name = document.getElementById('aiPresetName');
  const prompt = document.getElementById('aiPromptInput');
  const saveBtn = document.getElementById('aiPresetSaveBtn');
  const delBtn = document.getElementById('aiPresetDeleteBtn');
  const renameBtn = document.getElementById('aiPresetRenameBtn');
  const exportBtn = document.getElementById('aiPresetExportBtn');
  const importBtn = document.getElementById('aiPresetImportBtn');
  const importFile = document.getElementById('aiPresetImportFile');
  // removed temperature/max controls
  if (!sel || !prompt) return;

  function getPresets() { try { return JSON.parse(localStorage.getItem('ai-presets') || '[]'); } catch { return []; } }
  function setPresets(list) { try { localStorage.setItem('ai-presets', JSON.stringify(list)); } catch {} }
  function ensureDefaults() {
    const builtIns = [
      { name: 'Zusammenfassen', prompt: 'Fasse den Text prägnant in 3–5 Sätzen zusammen. Nur Markdown-Ausgabe.' },
      { name: 'Verbessern', prompt: 'Verbessere Stil, Klarheit und Grammatik des Textes, ohne Inhalt zu ändern. Nur Ergebnis in Markdown.' },
      { name: 'Freundlich umformulieren', prompt: 'Formuliere den Text in einem freundlichen, respektvollen und wertschätzenden Ton neu. Erhalte die inhaltliche Aussage, entschärfe harsche Formulierungen, nutze inklusive Sprache. Nur das umformulierte Ergebnis in Markdown ausgeben.' },
      { name: 'Professionell umschreiben', prompt: 'Schreibe den Text in einem professionellen, sachlichen und klar strukturierten Stil um. Vermeide Umgangssprache, optimiere Präzision und Lesbarkeit, behalte den Kerninhalt bei. Nur das Ergebnis in Markdown ausgeben.' },
      { name: 'Locker umformulieren', prompt: 'Formuliere den Text locker, natürlich und umgangssprachlich neu. Erhalte die Aussage, vereinfache komplexe Sätze und nutze alltagstaugliche Wörter. Nur das umformulierte Ergebnis in Markdown ausgeben.' },
      { name: 'Neutralisieren', prompt: 'Formuliere den Text neutral und wertfrei um. Entferne emotionale oder wertende Sprache und behalte den Inhalt bei. Nur das neutralisierte Ergebnis in Markdown ausgeben.' },
      { name: 'Kürzen', prompt: 'Kürze den Text deutlich (ca. 30–50%), entferne Füllwörter und Redundanzen und erhalte die Kernaussagen. Struktur möglichst beibehalten. Nur das gekürzte Ergebnis in Markdown ausgeben.' },
      { name: 'Verlängern', prompt: 'Erweitere den Text behutsam um erläuternde Details, Beispiele und klarere Übergänge. Erhalte Ton und Intention; keine neuen Fakten erfinden. Nur das erweiterte Ergebnis in Markdown ausgeben.' },
      { name: 'Technisch erklären', prompt: 'Erkläre den Text technisch präzise für ein fachkundiges Publikum. Nutze korrekte Terminologie, klare Struktur (Markdown-Überschriften/Listen) und Beispiele, falls sinnvoll. Nur die Erklärung in Markdown ausgeben.' },
      { name: 'DE → EN', prompt: 'Übersetze den Text ins Englische. Nur Übersetzung ausgeben.' },
      { name: 'EN → DE', prompt: 'Übersetze den Text ins Deutsche. Nur Übersetzung ausgeben.' },
      { name: 'Tabelle aus Text', prompt: 'Erzeuge aus dem Text eine konsistente Markdown-Tabelle mit sinnvollen Spalten. Keine Erklärungen, nur Tabelle.' },
      { name: 'Stichpunkte', prompt: 'Konvertiere den Text in eine prägnante ungeordnete Liste (Markdown). Nur die Liste ausgeben.' },
      { name: 'Nummerierte Schritte', prompt: 'Konvertiere den Text in eine nummerierte Schritt-für-Schritt Liste (Markdown). Nur die Liste ausgeben.' },
      { name: 'Aufgabenliste', prompt: 'Konvertiere den Text in eine Aufgabenliste in Markdown mit - [ ] Einträgen. Nur die Liste ausgeben.' },
      { name: 'Zitat', prompt: 'Wandle den Text in ein Markdown-Blockzitat (> ...) um. Nur das Zitat ausgeben.' },
      { name: 'Codeblock', prompt: 'Wandle den Text in einen Markdown-Codeblock um. Sprache, falls erkennbar, ansonsten ohne. Nur den Codeblock ausgeben.' },
      { name: 'Überschrift H1', prompt: 'Formatiere die erste Zeile als H1 (#) und lasse den restlichen Text darunter unverändert. Nur vollständiges Markdown ausgeben.' },
      { name: 'Überschrift H2', prompt: 'Formatiere die erste Zeile als H2 (##) und lasse den restlichen Text darunter unverändert. Nur vollständiges Markdown ausgeben.' },
      { name: 'Trennlinie', prompt: 'Gib nur eine Markdown-Trennlinie (---) aus.' },
    ];
    let list = getPresets();
    const map = new Map(Array.isArray(list) ? list.map(p => [p.name, p]) : []);
    for (const p of builtIns) { if (!map.has(p.name)) map.set(p.name, p); }
    const merged = Array.from(map.values());
    setPresets(merged);
    return merged;
  }
  function populate() {
    const list = ensureDefaults();
    sel.innerHTML = list.map((p, i) => `<option value="${i}">${p.name}</option>`).join('');
  }
  populate();

  sel.addEventListener('change', () => {
    const list = getPresets();
    const idx = parseInt(sel.value, 10);
    const p = list[idx];
    if (p) { prompt.value = p.prompt; name && (name.value = p.name); }
  });
  saveBtn?.addEventListener('click', () => {
    const list = getPresets();
    const nm = (name?.value || '').trim() || 'Preset';
    const pr = (prompt?.value || '').trim();
    if (!pr) return;
    const exist = list.findIndex(x => x.name === nm);
    if (exist >= 0) list[exist] = { name: nm, prompt: pr }; else list.push({ name: nm, prompt: pr });
    setPresets(list);
    populate();
    // Modelle aus aktuellem Anbieter laden
    (async () => {
      if (!modelInput) return;
      try {
        const provider = getAiProvider();
        let models = [];
        if (provider === 'ollama') {
          const base = (ollamaUrlInput?.value || localStorage.getItem('ollama-url') || 'http://localhost:11434');
          models = await fetchOllamaModels(base);
        } else if (provider === 'gemini') {
          const key = (geminiApiKeyInput?.value || localStorage.getItem('gemini-api-key') || '').trim();
          models = key ? await fetchGeminiModels(key) : ['gemini-1.5-flash', 'gemini-1.5-pro'];
        } else {
          const key = (mistralApiKeyInput?.value || localStorage.getItem('mistral-api-key') || '').trim();
          models = key ? await fetchMistralModels(key) : ['mistral-small-latest','mistral-large-latest'];
        }
        const opts = models.map(n => `<option value="${n}">${n}</option>`).join('');
        modelInput.innerHTML = `<option value="">(Standard – aus Anbieter‑Einstellungen)</option>` + opts;
      } catch {
        modelInput.innerHTML = `<option value="">(Standard – aus Anbieter‑Einstellungen)</option>`;
      }
    })();
    // select this preset
    const idx = list.findIndex(x => x.name === nm);
    if (idx >= 0) sel.value = String(idx);
  });
  renameBtn?.addEventListener('click', () => {
    const list = getPresets();
    const idx = parseInt(sel.value, 10);
    if (isNaN(idx)) return;
    const p = list[idx];
    const newName = (name?.value || '').trim();
    if (!p || !newName) return;
    // avoid duplicate name by renaming existing duplicate
    const dup = list.findIndex(x => x.name === newName);
    if (dup >= 0 && dup !== idx) list.splice(dup, 1);
    list[idx] = { name: newName, prompt: (prompt?.value || '').trim() };
    setPresets(list);
    populate();
    const nidx = list.findIndex(x => x.name === newName);
    if (nidx >= 0) sel.value = String(nidx);
  });
  delBtn?.addEventListener('click', () => {
    const list = getPresets();
    const idx = parseInt(sel.value, 10);
    if (isNaN(idx)) return;
    list.splice(idx, 1);
    setPresets(list);
    populate();
    // clear fields
    if (name) name.value = '';
    prompt.value = '';
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
      // merge by name
      const existing = getPresets();
      const map = new Map(existing.map(p => [p.name, p.prompt]));
      for (const item of arr) {
        if (!item || typeof item.name !== 'string' || typeof item.prompt !== 'string') continue;
        map.set(item.name, item.prompt);
      }
      const merged = Array.from(map.entries()).map(([name, prompt]) => ({ name, prompt }));
      setPresets(merged);
      populate();
    } catch (e) {
      alert('Import fehlgeschlagen. Bitte gültige JSON-Presets wählen.');
    } finally {
      importFile.value = '';
    }
  });

  // removed temperature/max persistence
  }

  // Preferences helpers
  function initPresetSettings() {
    const sel = document.getElementById('settingsPresetSelect');
    const name = document.getElementById('settingsPresetName');
    const prompt = document.getElementById('settingsPresetPrompt');
    const saveBtn = document.getElementById('settingsPresetSaveBtn');
    const delBtn = document.getElementById('settingsPresetDeleteBtn');
    const renameBtn = document.getElementById('settingsPresetRenameBtn');
    const exportBtn = document.getElementById('settingsPresetExportBtn');
    const importBtn = document.getElementById('settingsPresetImportBtn');
    const importFile = document.getElementById('settingsPresetImportFile');
    const newBtn = document.getElementById('settingsPresetNewBtn');
    const dupBtn = document.getElementById('settingsPresetDuplicateBtn');
    const presetStatus = document.getElementById('settingsPresetStatus');
    if (!sel || !prompt) return;

    const setPresetStatus = (msg, ok = false) => {
      if (!presetStatus) return;
      presetStatus.textContent = msg || '';
      presetStatus.style.color = ok ? 'var(--accent)' : 'var(--muted)';
    };

    function getPresets() { try { return JSON.parse(localStorage.getItem('ai-presets') || '[]'); } catch { return []; } }
    function setPresets(list) { try { localStorage.setItem('ai-presets', JSON.stringify(list)); } catch {} }
    function ensureDefaults() {
      const builtIns = [
        { name: 'Zusammenfassen', prompt: 'Fasse den Text prägnant in 3–5 Sätzen zusammen. Nur Markdown-Ausgabe.' },
        { name: 'Verbessern', prompt: 'Verbessere Stil, Klarheit und Grammatik des Textes, ohne Inhalt zu ändern. Nur Ergebnis in Markdown.' },
        { name: 'Freundlich umformulieren', prompt: 'Formuliere den Text in einem freundlichen, respektvollen und wertschätzenden Ton neu. Erhalte die inhaltliche Aussage, entschärfe harsche Formulierungen, nutze inklusive Sprache. Nur das umformulierte Ergebnis in Markdown ausgeben.' },
        { name: 'Professionell umschreiben', prompt: 'Schreibe den Text in einem professionellen, sachlichen und klar strukturierten Stil um. Vermeide Umgangssprache, optimiere Präzision und Lesbarkeit, behalte den Kerninhalt bei. Nur das Ergebnis in Markdown ausgeben.' },
        { name: 'Locker umformulieren', prompt: 'Formuliere den Text locker, natürlich und umgangssprachlich neu. Erhalte die Aussage, vereinfache komplexe Sätze und nutze alltagstaugliche Wörter. Nur das umformulierte Ergebnis in Markdown ausgeben.' },
        { name: 'Neutralisieren', prompt: 'Formuliere den Text neutral und wertfrei um. Entferne emotionale oder wertende Sprache und behalte den Inhalt bei. Nur das neutralisierte Ergebnis in Markdown ausgeben.' },
        { name: 'Kürzen', prompt: 'Kürze den Text deutlich (ca. 30–50%), entferne Füllwörter und Redundanzen und erhalte die Kernaussagen. Struktur möglichst beibehalten. Nur das gekürzte Ergebnis in Markdown ausgeben.' },
        { name: 'Verlängern', prompt: 'Erweitere den Text behutsam um erläuternde Details, Beispiele und klarere Übergänge. Erhalte Ton und Intention; keine neuen Fakten erfinden. Nur das erweiterte Ergebnis in Markdown ausgeben.' },
        { name: 'Technisch erklären', prompt: 'Erkläre den Text technisch präzise für ein fachkundiges Publikum. Nutze korrekte Terminologie, klare Struktur (Markdown-Überschriften/Listen) und Beispiele, falls sinnvoll. Nur die Erklärung in Markdown ausgeben.' },
        { name: 'DE → EN', prompt: 'Übersetze den Text ins Englische. Nur Übersetzung ausgeben.' },
        { name: 'EN → DE', prompt: 'Übersetze den Text ins Deutsche. Nur Übersetzung ausgeben.' },
        { name: 'Tabelle aus Text', prompt: 'Erzeuge aus dem Text eine konsistente Markdown-Tabelle mit sinnvollen Spalten. Keine Erklärungen, nur Tabelle.' },
        { name: 'Stichpunkte', prompt: 'Konvertiere den Text in eine prägnante ungeordnete Liste (Markdown). Nur die Liste ausgeben.' },
        { name: 'Nummerierte Schritte', prompt: 'Konvertiere den Text in eine nummerierte Schritt-für-Schritt Liste (Markdown). Nur die Liste ausgeben.' },
        { name: 'Aufgabenliste', prompt: 'Konvertiere den Text in eine Aufgabenliste in Markdown mit - [ ] Einträgen. Nur die Liste ausgeben.' },
        { name: 'Zitat', prompt: 'Wandle den Text in ein Markdown-Blockzitat (> ...) um. Nur das Zitat ausgeben.' },
        { name: 'Codeblock', prompt: 'Wandle den Text in einen Markdown-Codeblock um. Sprache, falls erkennbar, ansonsten ohne. Nur den Codeblock ausgeben.' },
        { name: 'Überschrift H1', prompt: 'Formatiere die erste Zeile als H1 (#) und lasse den restlichen Text darunter unverändert. Nur vollständiges Markdown ausgeben.' },
        { name: 'Überschrift H2', prompt: 'Formatiere die erste Zeile als H2 (##) und lasse den restlichen Text darunter unverändert. Nur vollständiges Markdown ausgeben.' },
        { name: 'Trennlinie', prompt: 'Gib nur eine Markdown-Trennlinie (---) aus.' },
      ];
      let list = getPresets();
      const map = new Map(Array.isArray(list) ? list.map(p => [p.name, p]) : []);
      for (const p of builtIns) { if (!map.has(p.name)) map.set(p.name, p); }
      const merged = Array.from(map.values());
      setPresets(merged);
      return merged;
    }
    function populate() {
      const list = ensureDefaults();
      sel.innerHTML = list.map((p, i) => `<option value="${i}">${p.name}</option>`).join('');
    }
    function refreshInlineSelect() {
      const inlineSel = document.getElementById('aiPresetSelect');
      if (!inlineSel) return;
      const list = ensureDefaults();
      inlineSel.innerHTML = list.map((p, i) => `<option value="${i}">${p.name}</option>`).join('');
    }
    populate();
    // no model handling inside presets anymore

    sel.addEventListener('change', () => {
      const list = getPresets();
      const idx = parseInt(sel.value, 10);
      const p = list[idx];
      if (p) {
        prompt.value = p.prompt;
        name && (name.value = p.name);
        setPresetStatus('Preset geladen', true);
      }
    });
    newBtn?.addEventListener('click', () => {
      if (name) name.value = '';
      if (prompt) prompt.value = '';
      setPresetStatus('Neues Preset – ausfüllen und speichern', true);
    });
    dupBtn?.addEventListener('click', () => {
      const list = getPresets();
      const idx = parseInt(sel.value, 10);
      const base = (!isNaN(idx) && list[idx]) ? list[idx] : { name: (name?.value || 'Preset').trim() || 'Preset', prompt: (prompt?.value || '').trim() };
      let newName = base.name + ' (Kopie)';
      const existingNames = new Set(list.map(p => p.name));
      let n = 2;
      while (existingNames.has(newName)) { newName = base.name + ` (Kopie ${n++})`; }
      const copy = { name: newName, prompt: base.prompt || '' };
      list.push(copy);
      setPresets(list);
      populate();
      refreshInlineSelect();
      const newIdx = list.findIndex(p => p.name === newName);
      if (newIdx >= 0) sel.value = String(newIdx);
      // reflect in fields
      if (name) name.value = newName;
      if (prompt) prompt.value = copy.prompt || '';
      setPresetStatus('Preset dupliziert', true);
    });
    // no model reload hooks needed

    // Prompt helpers via aktueller Anbieter
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
    async function suggestPrompt() {
      const nm = (name?.value || '').trim() || 'Preset';
      const req = await getPresetModelForRequest();
      const messages = [
        { role: 'system', content: 'Du bist ein hilfreicher Prompt‑Engineer. Liefere nur den Prompt‑Text, ohne Einleitung oder Erklärungen. Sprache: Deutsch.' },
        { role: 'user', content: `Erzeuge einen prägnanten, robusten Prompt für ein KI‑Schreibpreset namens "${nm}". Der Prompt soll klar beschreiben, was die KI tun soll, inkl. Format (Markdown), Stil und Grenzen. Nur den Prompt‑Text zurückgeben.` }
      ];
      try {
        let text = '';
        if (req.provider === 'ollama') {
          text = await ollamaChat({ base: req.base, model: req.model, messages, stream: false });
        } else if (req.provider === 'gemini') {
          text = await geminiChat({ apiKey: req.apiKey, model: req.model, messages, stream: false });
        } else {
          text = await mistralChat({ apiKey: req.apiKey, model: req.model, messages, stream: false });
        }
        if (prompt) prompt.value = (text || '').trim(); setPresetStatus('Prompt generiert', true);
      }
      catch (e) { setPresetStatus('Generierung fehlgeschlagen', false); }
    }
    async function improvePrompt() {
      const current = (prompt?.value || '').trim();
      if (!current) { await suggestPrompt(); return; }
      const nm = (name?.value || '').trim() || 'Preset';
      const req = await getPresetModelForRequest();
      const messages = [
        { role: 'system', content: 'Du bist ein hilfreicher Prompt‑Engineer. Überarbeite Prompts präzise. Nur den verbesserten Prompt‑Text zurückgeben. Sprache: Deutsch.' },
        { role: 'user', content: `Verbessere den folgenden Prompt für das Preset "${nm}":\n\n${current}` }
      ];
      try {
        let text = '';
        if (req.provider === 'ollama') {
          text = await ollamaChat({ base: req.base, model: req.model, messages, stream: false });
        } else if (req.provider === 'gemini') {
          text = await geminiChat({ apiKey: req.apiKey, model: req.model, messages, stream: false });
        } else {
          text = await mistralChat({ apiKey: req.apiKey, model: req.model, messages, stream: false });
        }
        if (prompt) prompt.value = (text || '').trim(); setPresetStatus('Prompt verbessert', true);
      }
      catch (e) { setPresetStatus('Verbesserung fehlgeschlagen', false); }
    }
    document.getElementById('settingsPresetPromptSuggestBtn')?.addEventListener('click', suggestPrompt);
    document.getElementById('settingsPresetPromptImproveBtn')?.addEventListener('click', improvePrompt);
    saveBtn?.addEventListener('click', () => {
      const list = getPresets();
      const nm = (name?.value || '').trim() || 'Preset';
      const pr = (prompt?.value || '').trim();
      if (!pr) return;
      const exist = list.findIndex(x => x.name === nm);
      const payload = { name: nm, prompt: pr };
      if (exist >= 0) list[exist] = payload; else list.push(payload);
      setPresets(list);
      populate();
      refreshInlineSelect();
      const idx = list.findIndex(x => x.name === nm);
      if (idx >= 0) sel.value = String(idx);
    });
    renameBtn?.addEventListener('click', () => {
      const list = getPresets();
      const idx = parseInt(sel.value, 10);
      if (isNaN(idx)) return;
      const p = list[idx];
      const newName = (name?.value || '').trim();
      if (!p || !newName) return;
      const dup = list.findIndex(x => x.name === newName);
      if (dup >= 0 && dup !== idx) list.splice(dup, 1);
      list[idx] = { name: newName, prompt: (prompt?.value || '').trim() };
      setPresets(list);
      populate();
      refreshInlineSelect();
      const nidx = list.findIndex(x => x.name === newName);
      if (nidx >= 0) sel.value = String(nidx);
    });
    delBtn?.addEventListener('click', () => {
      const list = getPresets();
      const idx = parseInt(sel.value, 10);
      if (isNaN(idx)) return;
      list.splice(idx, 1);
      setPresets(list);
      populate();
      refreshInlineSelect();
      if (name) name.value = '';
      prompt.value = '';
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
        const existing = getPresets();
        const map = new Map(existing.map(p => [p.name, { ...p }]));
        for (const item of arr) {
          if (!item || typeof item.name !== 'string' || typeof item.prompt !== 'string') continue;
          map.set(item.name, { name: item.name, prompt: item.prompt });
        }
        const merged = Array.from(map.values());
        setPresets(merged);
        populate();
        refreshInlineSelect();
      } catch (e) {
        alert('Import fehlgeschlagen. Bitte gültige JSON-Presets wählen.');
      } finally {
        importFile.value = '';
      }
    });
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
