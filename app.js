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

  const editViewBtn = document.getElementById('editViewBtn');
  const splitViewBtn = document.getElementById('splitViewBtn');
  const readerViewBtn = document.getElementById('readerViewBtn');
  const workspace = document.getElementById('workspace');

  const themeSelect = document.getElementById('themeSelect');
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
  const prefReaderInput = document.getElementById('prefReaderInput');
  const prefStickyTools = document.getElementById('prefStickyTools');
  const prefAiInlineAutoOpen = document.getElementById('prefAiInlineAutoOpen');

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
    editorContextBtn.textContent = `Editor-Kontext: ${allowEditorContext ? 'EIN' : 'AUS'}`;
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
    if (themeSelect) {
      themeSelect.value = t.id;
      themeSelect.title = `Theme: ${t.label}`;
    }
    hljsThemeLink.href = isDark(t.id)
      ? 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github-dark.min.css'
      : 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github.min.css';
    try { localStorage.setItem('md-theme', t.id); } catch {}
    // Re-highlight to ensure contrast is right
    preview.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el));
  }

  // Populate theme dropdown
  (function initThemeSelect() {
    if (!themeSelect) return;
    themeSelect.innerHTML = themes.map(t => `<option value="${t.id}">${t.icon} ${t.label}</option>`).join('');
    themeSelect.addEventListener('change', () => applyThemeName(themeSelect.value));
  })();

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
      // model info
      if (aiGenInfo) {
        const base = (ollamaUrlInput?.value || localStorage.getItem('ollama-url') || 'http://localhost:11434').replace(/\/$/, '');
        const model = (ollamaModelSelect?.value || ollamaModelInput?.value || localStorage.getItem('ollama-model') || 'llama3.1:8b').trim();
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
    const res = await fetch(base.replace(/\/$/, '') + '/api/tags', { method: 'GET', mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return (data?.models || []).map(m => m.name);
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
    copyBtn.textContent = '📋';
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
      const orig = copyBtn.textContent;
      copyBtn.textContent = '✓';
      setTimeout(() => { copyBtn.textContent = orig; }, 800);
    } catch (_) {
      const orig = copyBtn.textContent;
      copyBtn.textContent = '!';
      setTimeout(() => { copyBtn.textContent = orig; }, 800);
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
    prefReaderInput && (prefReaderInput.checked = getPref('reader-input', true));
    prefStickyTools && (prefStickyTools.checked = getPref('sticky-tools', true));
    prefAiInlineAutoOpen && (prefAiInlineAutoOpen.checked = getPref('ai-inline-open', false));
  });
  function closeSettings() { settingsPanel?.classList.add('hidden'); settingsOverlay?.classList.add('hidden'); }
  settingsOverlay?.addEventListener('click', closeSettings);
  settingsCloseBtn?.addEventListener('click', closeSettings);
  settingsSaveBtn?.addEventListener('click', () => {
    setPref('reader-input', !!prefReaderInput?.checked);
    setPref('sticky-tools', !!prefStickyTools?.checked);
    setPref('ai-inline-open', !!prefAiInlineAutoOpen?.checked);
    applyPrefs();
    closeSettings();
  });

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
      const v = localStorage.getItem('md-view');
      setView(v || 'edit');
    } catch { setView('edit'); }
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
  const model = (ollamaModelSelect?.value || ollamaModelInput?.value || localStorage.getItem('ollama-model') || 'llama3.1:8b').trim();
  const tempEl = document.getElementById('aiTemp');
  const maxEl = document.getElementById('aiMaxTokens');
  const temperature = parseFloat((tempEl?.value || localStorage.getItem('ai-temp') || '0.7'));
  const num_predict = parseInt((maxEl?.value || localStorage.getItem('ai-max') || '512'), 10);

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
    btn.textContent = running ? '⏹ Abbrechen' : '🤖 Generieren';
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

  function getPresets() {
    try { return JSON.parse(localStorage.getItem('ai-presets') || '[]'); } catch { return []; }
  }
  function setPresets(list) {
    try { localStorage.setItem('ai-presets', JSON.stringify(list)); } catch {}
  }
  function ensureDefaults() {
    let list = getPresets();
    if (!list || list.length === 0) {
      list = [
        { name: 'Zusammenfassen', prompt: 'Zusammenfasse den ausgewählten Text prägnant.' },
        { name: 'Verbessern', prompt: 'Verbessere Stil, Klarheit und Grammatik des ausgewählten Textes, ohne Inhalt zu verlieren.' },
        { name: 'DE → EN', prompt: 'Übersetze den ausgewählten Text ins Englische.' },
        { name: 'EN → DE', prompt: 'Übersetze den ausgewählten Text ins Deutsche.' },
      ];
      setPresets(list);
    }
    return list;
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
function getPref(key, defVal) { try { const v = localStorage.getItem('pref-' + key); if (v === null) return defVal; return v === '1' || v === 'true'; } catch { return defVal; } }
function setPref(key, val) { try { localStorage.setItem('pref-' + key, val ? '1' : '0'); } catch {} }
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
