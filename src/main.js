const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const STORAGE_FILE = path.join(app.getPath('userData'), 'notes.json');
const NOTE_COUNT = 5;

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

let tray = null;
let contextMenu = null;

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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createTray();
  }
});
