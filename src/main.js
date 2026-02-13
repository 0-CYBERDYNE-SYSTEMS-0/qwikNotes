const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

const STORAGE_FILE = path.join(app.getPath('userData'), 'notes.json');
const NOTE_COUNT = 5;
const CLIPBOARD_NOTE_INDEX = NOTE_COUNT - 1;
const CLIPBOARD_HISTORY_LIMIT = 20;
const CLIPBOARD_POLL_MS = 1000;

// Load notes from storage
function loadNotes() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
    }
  } catch (e) {}
  return Array(NOTE_COUNT).fill('');
}

// Save notes to storage
function saveNotes(notes) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(notes, null, 2));
}

function normalizeClipboardEntry(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function appendClipboardHistoryEntry(rawText) {
  const text = normalizeClipboardEntry(rawText);
  if (!text) return;

  const notes = loadNotes();
  const existing = (notes[CLIPBOARD_NOTE_INDEX] || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (existing[0] === text) return;

  const next = [text, ...existing.filter(line => line !== text)].slice(0, CLIPBOARD_HISTORY_LIMIT);
  notes[CLIPBOARD_NOTE_INDEX] = next.join('\n');
  saveNotes(notes);
  createTray();
}

let tray = null;
let contextMenu = null;
let clipboardPollTimer = null;
let lastClipboardText = '';

function createTray() {
  if (tray) {
    tray.destroy();
  }

  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setTitle('📝');
  tray.setToolTip('QwikNotes - Click for menu');

  const notes = loadNotes();

  contextMenu = Menu.buildFromTemplate([
    { label: '📝 QwikNotes', enabled: false },
    { type: 'separator' },
    ...Array.from({ length: NOTE_COUNT }, (_, i) => ({
      label: notes[i] ? `Note ${i + 1}: ${notes[i].substring(0, 30)}${notes[i].length > 30 ? '...' : ''}` : `Note ${i + 1}: (empty)`,
      click: () => openEditor(i)
    })),
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('QwikNotes - Click for menu');
}

let editorWindow = null;

function openEditor(index) {
  if (editorWindow) {
    editorWindow.focus();
    return;
  }

  const notes = loadNotes();

  editorWindow = new BrowserWindow({
    width: 400,
    height: 350,
    title: `Edit Note ${index + 1}`,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  editorWindow.loadFile(path.join(__dirname, 'editor.html'), { query: { index, note: notes[index] || '' } });

  editorWindow.on('closed', () => {
    editorWindow = null;
  });
}

// IPC handlers
ipcMain.handle('save-note', (event, index, text) => {
  const notes = loadNotes();
  notes[index] = text;
  saveNotes(notes);
  createTray(); // Refresh menu
  return true;
});

ipcMain.handle('copy-note', (event, text) => {
  require('electron').clipboard.writeText(text);
  return true;
});

ipcMain.handle('close-editor', () => {
  if (editorWindow) {
    editorWindow.close();
  }
  return true;
});

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
  createTray();
  lastClipboardText = normalizeClipboardEntry(clipboard.readText());
  clipboardPollTimer = setInterval(() => {
    const current = normalizeClipboardEntry(clipboard.readText());
    if (current && current !== lastClipboardText) {
      lastClipboardText = current;
      appendClipboardHistoryEntry(current);
    } else if (!current) {
      lastClipboardText = '';
    }
  }, CLIPBOARD_POLL_MS);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createTray();
  }
});

app.on('before-quit', () => {
  if (clipboardPollTimer) {
    clearInterval(clipboardPollTimer);
    clipboardPollTimer = null;
  }
});
