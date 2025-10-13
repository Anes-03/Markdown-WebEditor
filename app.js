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

  // Utilities
  const supportsFSA = () => 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;

  function setStatus(msg) {
    statusEl.textContent = msg;
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

  // Drag & drop: .md to open, images to embed
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
    { id: 'light', label: 'Light', icon: '🌞', dark: false },
    { id: 'dark', label: 'Dark', icon: '🌙', dark: true },
    { id: 'black', label: 'Pitch Black', icon: '⬛', dark: true },
    { id: 'sepia', label: 'Sepia', icon: '📜', dark: false },
    { id: 'solarized-light', label: 'Solarized Light', icon: '🌤️', dark: false },
    { id: 'solarized-dark', label: 'Solarized Dark', icon: '🌌', dark: true },
  ];

  function findTheme(id) { return themes.find(t => t.id === id) || themes[0]; }
  function isDark(id) { return findTheme(id).dark; }

  function applyThemeName(id) {
    const t = findTheme(id);
    document.body.dataset.theme = t.id;
    // Update theme menu selection state
    try {
      if (themeMenu) {
        themeMenu.querySelectorAll('button[data-theme]')?.forEach(btn => {
          btn.classList.toggle('current', btn.dataset.theme === t.id);
        });
      }
    } catch {}
    // Update theme cycle icon (sun for light-ish, moon for dark-ish)
    try {
      const icon = themeCycleBtn?.querySelector('iconify-icon');
      if (icon) icon.setAttribute('icon', isDark(t.id) ? 'lucide:moon' : 'lucide:sun');
      if (themeCycleBtn) themeCycleBtn.title = `Theme wechseln (aktuell: ${t.label})`;
    } catch {}
    hljsThemeLink.href = isDark(t.id)
      ? 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github-dark.min.css'
      : 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github.min.css';
    try { localStorage.setItem('md-theme', t.id); } catch {}
    // Re-highlight to ensure contrast is right
    preview.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el));
  }

  // Theme menu setup
  function iconForTheme(id) {
    switch (id) {
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
    // ensure current item is marked
    applyThemeName(document.body.dataset.theme || themes[0].id);
  });
  // Close theme menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!themeMenu || themeMenu.classList.contains('hidden')) return;
    const within = themeMenu.contains(e.target) || themeCycleBtn?.contains(e.target);
    if (!within) themeMenu.classList.add('hidden');
  });

  // File actions
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
  } else if (e.key === 'Escape' && window.__aiGenController) {
    try { window.__aiGenController.abort(); } catch {}
  }
});

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
    // If streaming, toggle abort
    if (window.__aiGenController) { try { window.__aiGenController.abort(); } catch {} return; }
    // Toggle panel
    if (aiInline) {
      const open = aiInline.classList.contains('hidden');
      aiInline.classList.toggle('hidden', !open);
      adjustLayout();
      // default selection checkbox based on current selection
      if (aiUseSelection) {
        const hasSel = (editor.selectionEnd ?? 0) > (editor.selectionStart ?? 0);
        aiUseSelection.checked = !!hasSel;
      }
      // model info (respect preset-specific model if set)
      if (aiGenInfo) {
        const base = (ollamaUrlInput?.value || localStorage.getItem('ollama-url') || 'http://localhost:11434').replace(/\/$/, '');
        const defaultModel = (ollamaModelSelect?.value || ollamaModelInput?.value || localStorage.getItem('ollama-model') || 'llama3.1:8b').trim();
        let model = defaultModel;
        try {
          const presetSel = document.getElementById('aiPresetSelect');
          if (presetSel && presetSel.value !== '') {
            const idx = parseInt(presetSel.value, 10);
            const list = JSON.parse(localStorage.getItem('ai-presets') || '[]');
            const p = Array.isArray(list) ? list[idx] : null;
            if (p && typeof p.model === 'string' && p.model.trim()) model = p.model.trim();
          }
        } catch {}
        aiGenInfo.textContent = `Modell: ${model} • URL: ${base}`;
      }
      // focus prompt
      setTimeout(() => aiPromptInput?.focus(), 0);
    } else {
      editorGenerateAI();
    }
  });
  aiGenStartBtn?.addEventListener('click', editorGenerateAI);
  aiGenAbortBtn?.addEventListener('click', () => { try { window.__aiGenController?.abort(); } catch {} });
  aiGenResetBtn?.addEventListener('click', () => { if (window.__aiGenSnapshot) { restoreEditorSnapshot(window.__aiGenSnapshot); window.__aiGenSnapshot = null; aiGenResetBtn.disabled = true; setStatus('Zurückgesetzt'); } });
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
    const base = (ollamaUrlInput?.value || '').trim();
    if (base) testOllama();
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
    const selVal = (ollamaModelSelect?.value || '').trim();
    const inpVal = (ollamaModelInput?.value || '').trim();
    const local = (localStorage.getItem('ollama-model') || '').trim();
    return selVal || inpVal || local || '';
  }
  function updateChatModelBadge() {
    if (!chatModelBadge) return;
    const m = effectiveChatModel();
    chatModelBadge.textContent = m ? `Modell: ${m}` : 'Modell: (keins)';
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
    const base = (ollamaUrlInput?.value || '').replace(/\/$/, '');
    const model = (ollamaModelSelect?.value || ollamaModelInput?.value || '').trim();
    const stream = !!chatStreamToggle?.checked;
    try {
      const assistantEl = appendChatMessage('assistant', '');
      setChatBusy(true);
      chatAbortController = new AbortController();
      const signal = chatAbortController.signal;
      const content = await ollamaChat({ base, model, messages: msgs, stream, signal, onDelta: (delta) => {
        // Append delta to last assistant element
        const md = (assistantEl.__raw || '') + delta;
        assistantEl.__raw = md;
        renderAssistantMarkdown(assistantEl.querySelector('div'), md);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }});
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

  // Chat events
  chatToggleBtn?.addEventListener('click', () => {
    loadOllamaSettings();
    if (chatPanel?.classList.contains('hidden')) openChat(); else closeChat();
  });
  ollamaModelSelect?.addEventListener('change', updateChatModelBadge);
  ollamaModelInput?.addEventListener('input', updateChatModelBadge);
  ollamaSaveBtn?.addEventListener('click', () => setTimeout(updateChatModelBadge, 50));
  ollamaTestBtn?.addEventListener('click', () => setTimeout(updateChatModelBadge, 200));
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
    // Load Ollama values into settings fields
    try { loadOllamaSettings(); } catch {}
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

// AI generation from editor with streaming
async function editorGenerateAI() {
  const editor = document.getElementById('editor');
  const statusEl = document.getElementById('status');
  const btn = document.getElementById('aiGenerateBtn');
  const ollamaUrlInput = document.getElementById('ollamaUrlInput');
  const ollamaModelSelect = document.getElementById('ollamaModelSelect');
  const ollamaModelInput = document.getElementById('ollamaModelInput');
  if (!editor) return;

  // If already generating, act as abort toggle
  if (window.__aiGenController) {
    try { window.__aiGenController.abort(); } catch {}
    return;
  }

  // Inline prompt if available, fallback to prompt()
  let promptMsg = '';
  if (document.getElementById('aiPromptInput')) {
    promptMsg = (document.getElementById('aiPromptInput').value || '').trim();
    if (!promptMsg) {
      document.getElementById('aiPromptInput').focus();
      return;
    }
  } else {
    const p = window.prompt('Beschreibe kurz, was generiert werden soll:', 'Zusammenfassung des ausgewählten Textes');
    if (p == null) return; promptMsg = p;
  }

  const base = (ollamaUrlInput?.value || localStorage.getItem('ollama-url') || 'http://localhost:11434').replace(/\/$/, '');
  const defaultModel = (ollamaModelSelect?.value || ollamaModelInput?.value || localStorage.getItem('ollama-model') || 'llama3.1:8b').trim();
  let model = defaultModel;
  try {
    const presetSel = document.getElementById('aiPresetSelect');
    if (presetSel && presetSel.value !== '') {
      const idx = parseInt(presetSel.value, 10);
      const list = JSON.parse(localStorage.getItem('ai-presets') || '[]');
      const p = Array.isArray(list) ? list[idx] : null;
      if (p && typeof p.model === 'string' && p.model.trim()) model = p.model.trim();
      if (p && typeof p.temperature === 'number') temperature = p.temperature;
      if (p && typeof p.max === 'number') num_predict = p.max;
    }
  } catch {}
  const tempEl = document.getElementById('aiTemp');
  const maxEl = document.getElementById('aiMaxTokens');
  let temperature = parseFloat((tempEl?.value || localStorage.getItem('ai-temp') || '0.7'));
  let num_predict = parseInt((maxEl?.value || localStorage.getItem('ai-max') || '512'), 10);

  const start = editor.selectionStart ?? 0;
  const end = editor.selectionEnd ?? 0;
  const useSelection = document.getElementById('aiUseSelection') ? !!document.getElementById('aiUseSelection').checked : (end > start);
  const hasSel = useSelection && end > start;
  const full = editor.value || '';
  const selection = hasSel ? full.slice(start, end) : '';

  const messages = [];
  messages.push({ role: 'system', content: 'Du bist ein hilfreicher Schreibassistent. Antworte in Markdown. Gib ausschließlich das Ergebnis aus – ohne Einleitung, ohne Meta-Kommentare, ohne Phrasen wie "ich" oder "hier ist".' });
  if (hasSel) {
    messages.push({ role: 'system', content: 'Kontext (ausgewählter Editor-Text, nur als Referenz, nicht erneut ausgeben):\n\n' + selection });
  }
  messages.push({ role: 'user', content: promptMsg });

  const controller = new AbortController();
  window.__aiGenController = controller;
  // snapshot before modification for reset
  window.__aiGenSnapshot = { value: editor.value, selStart: editor.selectionStart, selEnd: editor.selectionEnd };
  if (document.getElementById('aiGenResetBtn')) document.getElementById('aiGenResetBtn').disabled = false;
  let pos = start;
  let inserted = 0;
  let lastFlush = 0;
  const flush = () => { editor.dispatchEvent(new Event('input')); };
  const setBtnState = (running) => {
    if (!btn) return;
    try {
      const iconEl = btn.querySelector('iconify-icon');
      const lblEl = btn.querySelector('.btn-label');
      if (iconEl) iconEl.setAttribute('icon', running ? 'mdi:stop-circle-outline' : 'mdi:robot-outline');
      if (lblEl) lblEl.textContent = running ? 'Abbrechen' : 'Generieren';
      else btn.textContent = running ? 'Abbrechen' : 'Generieren';
    } catch {
      btn.textContent = running ? 'Abbrechen' : 'Generieren';
    }
    btn.disabled = false;
  };
  if (document.getElementById('aiGenAbortBtn')) document.getElementById('aiGenAbortBtn').disabled = false;
  if (document.getElementById('aiGenStartBtn')) document.getElementById('aiGenStartBtn').disabled = true;
  setBtnState(true);
  statusEl && (statusEl.textContent = 'KI generiert (Streaming)…');

  try {
    // prepare insertion: if selection, clear it first
    if (hasSel) {
      editor.setRangeText('', start, end, 'start');
      pos = start;
    }

    const url = base + '/api/chat';
    const body = { model, messages, stream: true, options: { temperature, num_predict } };
    const res = await fetch(url, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
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
          const delta = json?.message?.content || '';
          if (delta) {
            editor.setRangeText(delta, pos, pos, 'end');
            pos += delta.length;
            inserted += delta.length;
            const now = Date.now();
            if (now - lastFlush > 100) { flush(); lastFlush = now; }
          }
        } catch {}
      }
    }
    flush();
    statusEl && (statusEl.textContent = `KI‑Text eingefügt (${inserted} Zeichen)`);
  } catch (e) {
    if (e?.name === 'AbortError') {
      statusEl && (statusEl.textContent = 'KI‑Generierung abgebrochen');
    } else {
      console.error(e);
      statusEl && (statusEl.textContent = 'KI‑Generierung fehlgeschlagen');
      alert('KI‑Generierung fehlgeschlagen: ' + (e?.message || e));
    }
  } finally {
    window.__aiGenController = null;
    setBtnState(false);
    if (document.getElementById('aiGenAbortBtn')) document.getElementById('aiGenAbortBtn').disabled = true;
    if (document.getElementById('aiGenStartBtn')) document.getElementById('aiGenStartBtn').disabled = false;
  }
}

// AI inline helpers
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
  const temp = document.getElementById('aiTemp');
  const tempVal = document.getElementById('aiTempVal');
  const maxT = document.getElementById('aiMaxTokens');
  const maxVal = document.getElementById('aiMaxVal');
  if (!sel || !prompt) return;

  function getPresets() { try { return JSON.parse(localStorage.getItem('ai-presets') || '[]'); } catch { return []; } }
  function setPresets(list) { try { localStorage.setItem('ai-presets', JSON.stringify(list)); } catch {} }
  function ensureDefaults() {
    const builtIns = [
      { name: 'Zusammenfassen', prompt: 'Fasse den Text prägnant in 3–5 Sätzen zusammen. Nur Markdown-Ausgabe.' },
      { name: 'Verbessern', prompt: 'Verbessere Stil, Klarheit und Grammatik des Textes, ohne Inhalt zu ändern. Nur Ergebnis in Markdown.' },
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
    // Fill model dropdown from Ollama
    (async () => {
      if (modelInput) {
        try {
          const base = (ollamaUrlInput?.value || localStorage.getItem('ollama-url') || 'http://localhost:11434');
          const models = await fetchOllamaModels(base);
          const opts = models.map(n => `<option value="${n}">${n}</option>`).join('');
          modelInput.innerHTML = `<option value="">(Standard – aus Ollama‑Einstellungen)</option>` + opts;
        } catch {
          modelInput.innerHTML = `<option value="">(Standard – aus Ollama‑Einstellungen)</option>`;
        }
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

  // temperature + max tokens
  const savedTemp = parseFloat(localStorage.getItem('ai-temp') || '0.7');
  const savedMax = parseInt(localStorage.getItem('ai-max') || '512', 10);
  if (temp) temp.value = String(savedTemp);
  if (tempVal) tempVal.textContent = `(${savedTemp.toFixed(2)})`;
  if (maxT) maxT.value = String(savedMax);
  if (maxVal) maxVal.textContent = `(${savedMax})`;
  temp?.addEventListener('input', () => { tempVal && (tempVal.textContent = `(${parseFloat(temp.value).toFixed(2)})`); try { localStorage.setItem('ai-temp', temp.value); } catch {} });
  maxT?.addEventListener('input', () => { maxVal && (maxVal.textContent = `(${parseInt(maxT.value,10)})`); try { localStorage.setItem('ai-max', maxT.value); } catch {} });
  }

  // Preferences helpers
  function initPresetSettings() {
    const sel = document.getElementById('settingsPresetSelect');
    const name = document.getElementById('settingsPresetName');
    const prompt = document.getElementById('settingsPresetPrompt');
    const useModel = document.getElementById('settingsPresetUseModel');
    const modelInput = document.getElementById('settingsPresetModel');
    const saveBtn = document.getElementById('settingsPresetSaveBtn');
    const delBtn = document.getElementById('settingsPresetDeleteBtn');
    const renameBtn = document.getElementById('settingsPresetRenameBtn');
    const exportBtn = document.getElementById('settingsPresetExportBtn');
    const importBtn = document.getElementById('settingsPresetImportBtn');
    const importFile = document.getElementById('settingsPresetImportFile');
    const newBtn = document.getElementById('settingsPresetNewBtn');
    const dupBtn = document.getElementById('settingsPresetDuplicateBtn');
    const modelReloadBtn = document.getElementById('settingsPresetModelReloadBtn');
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
    // Helper to fill model dropdown from Ollama
    async function populatePresetModelOptions() {
      if (!modelInput) return;
      const current = modelInput.value || '';
      try {
        const base = (ollamaUrlInput?.value || localStorage.getItem('ollama-url') || 'http://localhost:11434');
        const arr = await fetchOllamaModels(base);
        const uniq = Array.from(new Set(arr.filter(Boolean)));
        uniq.sort((a,b) => a.localeCompare(b));
        const opts = uniq.map(n => `<option value="${n}">${n}</option>`).join('');
        modelInput.innerHTML = `<option value="">(Standard – aus Ollama‑Einstellungen)</option>` + opts;
        // restore selection if present
        if (current) {
          if (!Array.from(modelInput.options).some(o => o.value === current)) {
            const opt = document.createElement('option'); opt.value = current; opt.textContent = current; modelInput.appendChild(opt);
          }
          modelInput.value = current;
        }
        setPresetStatus(`${uniq.length} Modelle geladen`, true);
      } catch (e) {
        modelInput.innerHTML = `<option value="">(Standard – aus Ollama‑Einstellungen)</option>`;
        // keep current custom if any
        if (current) { const opt = document.createElement('option'); opt.value = current; opt.textContent = current; modelInput.appendChild(opt); modelInput.value = current; }
        setPresetStatus('Modelle konnten nicht geladen werden', false);
      }
    }
    // initial fill
    populatePresetModelOptions();

    sel.addEventListener('change', () => {
      const list = getPresets();
      const idx = parseInt(sel.value, 10);
      const p = list[idx];
      if (p) {
        prompt.value = p.prompt;
        name && (name.value = p.name);
        if (useModel) useModel.checked = !!p.model;
        if (modelInput) {
          const val = p.model || '';
          if (val) {
            const has = Array.from(modelInput.options).some(o => o.value === val);
            if (!has) { const opt = document.createElement('option'); opt.value = val; opt.textContent = val; modelInput.appendChild(opt); }
          }
          modelInput.value = val;
          modelInput.disabled = !(useModel && useModel.checked);
        }
        const modelArea = document.getElementById('settingsPresetModelArea');
        if (modelArea) modelArea.classList.toggle('hidden', !(useModel && useModel.checked));
        setPresetStatus('Preset geladen', true);
      }
    });
    newBtn?.addEventListener('click', () => {
      if (name) name.value = '';
      if (prompt) prompt.value = '';
      if (useModel) useModel.checked = false;
      if (modelInput) { modelInput.value = ''; modelInput.disabled = true; }
      const modelArea = document.getElementById('settingsPresetModelArea');
      if (modelArea) modelArea.classList.add('hidden');
      setPresetStatus('Neues Preset – ausfüllen und speichern', true);
    });
    dupBtn?.addEventListener('click', () => {
      const list = getPresets();
      const idx = parseInt(sel.value, 10);
      const base = (!isNaN(idx) && list[idx]) ? list[idx] : { name: (name?.value || 'Preset').trim() || 'Preset', prompt: (prompt?.value || '').trim(), model: (useModel?.checked ? (modelInput?.value || '').trim() : '') };
      let newName = base.name + ' (Kopie)';
      const existingNames = new Set(list.map(p => p.name));
      let n = 2;
      while (existingNames.has(newName)) { newName = base.name + ` (Kopie ${n++})`; }
      const copy = { name: newName, prompt: base.prompt || '', ...(base.model ? { model: base.model } : {}), ...(typeof base.temperature === 'number' ? { temperature: base.temperature } : {}), ...(typeof base.max === 'number' ? { max: base.max } : {}) };
      list.push(copy);
      setPresets(list);
      populate();
      refreshInlineSelect();
      const newIdx = list.findIndex(p => p.name === newName);
      if (newIdx >= 0) sel.value = String(newIdx);
      // reflect in fields
      if (name) name.value = newName;
      if (prompt) prompt.value = copy.prompt || '';
      if (useModel) useModel.checked = !!copy.model;
      if (modelInput) { modelInput.disabled = !useModel.checked; modelInput.value = copy.model || ''; }
      const modelArea = document.getElementById('settingsPresetModelArea');
      if (modelArea) modelArea.classList.toggle('hidden', !useModel?.checked);
      setPresetStatus('Preset dupliziert', true);
    });
    useModel?.addEventListener('change', () => {
      if (modelInput) modelInput.disabled = !useModel.checked;
      const modelArea = document.getElementById('settingsPresetModelArea');
      if (modelArea) modelArea.classList.toggle('hidden', !useModel.checked);
    });
    // Repopulate models when settings open
    settingsBtn?.addEventListener('click', () => {
      populatePresetModelOptions();
      const modelArea = document.getElementById('settingsPresetModelArea');
      if (modelArea) modelArea.classList.toggle('hidden', !useModel?.checked);
    });
    modelReloadBtn?.addEventListener('click', () => { populatePresetModelOptions(); });
    ollamaSaveBtn?.addEventListener('click', () => { setTimeout(populatePresetModelOptions, 50); });
    ollamaTestBtn?.addEventListener('click', () => { setTimeout(populatePresetModelOptions, 200); });

    // Prompt helpers via Ollama
    async function getPresetModelForRequest() {
      const base = (ollamaUrlInput?.value || localStorage.getItem('ollama-url') || 'http://localhost:11434');
      const defaultModel = (ollamaModelSelect?.value || ollamaModelInput?.value || localStorage.getItem('ollama-model') || 'llama3.1:8b').trim();
      const mdl = (useModel?.checked && modelInput?.value) ? modelInput.value.trim() : defaultModel;
      return { base, model: mdl };
    }
    async function suggestPrompt() {
      const nm = (name?.value || '').trim() || 'Preset';
      const { base, model } = await getPresetModelForRequest();
      const messages = [
        { role: 'system', content: 'Du bist ein hilfreicher Prompt‑Engineer. Liefere nur den Prompt‑Text, ohne Einleitung oder Erklärungen. Sprache: Deutsch.' },
        { role: 'user', content: `Erzeuge einen prägnanten, robusten Prompt für ein KI‑Schreibpreset namens "${nm}". Der Prompt soll klar beschreiben, was die KI tun soll, inkl. Format (Markdown), Stil und Grenzen. Nur den Prompt‑Text zurückgeben.` }
      ];
      try { const text = await ollamaChat({ base, model, messages, stream: false }); if (prompt) prompt.value = (text || '').trim(); setPresetStatus('Prompt generiert', true); }
      catch (e) { setPresetStatus('Generierung fehlgeschlagen', false); }
    }
    async function improvePrompt() {
      const current = (prompt?.value || '').trim();
      if (!current) { await suggestPrompt(); return; }
      const nm = (name?.value || '').trim() || 'Preset';
      const { base, model } = await getPresetModelForRequest();
      const messages = [
        { role: 'system', content: 'Du bist ein hilfreicher Prompt‑Engineer. Überarbeite Prompts präzise. Nur den verbesserten Prompt‑Text zurückgeben. Sprache: Deutsch.' },
        { role: 'user', content: `Verbessere den folgenden Prompt für das Preset "${nm}":\n\n${current}` }
      ];
      try { const text = await ollamaChat({ base, model, messages, stream: false }); if (prompt) prompt.value = (text || '').trim(); setPresetStatus('Prompt verbessert', true); }
      catch (e) { setPresetStatus('Verbesserung fehlgeschlagen', false); }
    }
    document.getElementById('settingsPresetPromptSuggestBtn')?.addEventListener('click', suggestPrompt);
    document.getElementById('settingsPresetPromptImproveBtn')?.addEventListener('click', improvePrompt);
    saveBtn?.addEventListener('click', () => {
      const list = getPresets();
      const nm = (name?.value || '').trim() || 'Preset';
      const pr = (prompt?.value || '').trim();
      if (!pr) return;
      const mdl = useModel?.checked ? (modelInput?.value || '').trim() : '';
      const tEl = document.getElementById('settingsPresetTemp');
      const mEl = document.getElementById('settingsPresetMaxTokens');
      const tval = tEl ? parseFloat(tEl.value) : undefined;
      const mval = mEl ? parseInt(mEl.value, 10) : undefined;
      const exist = list.findIndex(x => x.name === nm);
      const payload = { name: nm, prompt: pr, ...(mdl ? { model: mdl } : {}), ...(isFinite(tval) ? { temperature: tval } : {}), ...(Number.isInteger(mval) ? { max: mval } : {}) };
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
      const mdl = useModel?.checked ? (modelInput?.value || '').trim() : '';
      const tEl = document.getElementById('settingsPresetTemp');
      const mEl = document.getElementById('settingsPresetMaxTokens');
      const tval = tEl ? parseFloat(tEl.value) : undefined;
      const mval = mEl ? parseInt(mEl.value, 10) : undefined;
      list[idx] = { name: newName, prompt: (prompt?.value || '').trim(), ...(mdl ? { model: mdl } : {}), ...(isFinite(tval) ? { temperature: tval } : {}), ...(Number.isInteger(mval) ? { max: mval } : {}) };
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
          const mdl = typeof item.model === 'string' ? item.model : (map.get(item.name)?.model || '');
          map.set(item.name, { name: item.name, prompt: item.prompt, ...(mdl ? { model: mdl } : {}) });
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
function restoreEditorSnapshot(snap) {
  const editor = document.getElementById('editor');
  if (!editor || !snap) return;
  editor.value = snap.value || '';
  try { editor.setSelectionRange(snap.selStart || 0, snap.selEnd || 0); } catch {}
  editor.dispatchEvent(new Event('input'));
}
