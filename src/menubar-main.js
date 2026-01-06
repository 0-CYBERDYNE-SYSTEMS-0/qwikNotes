const { app } = require('electron');
const { Menubar } = require('menubar');
const path = require('path');
const fs = require('fs');

const STORAGE_FILE = path.join(app.getPath('userData'), 'notes.json');
const NOTE_COUNT = 5;

// Load notes
function loadNotes() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
    }
  } catch (e) {}
  return Array(NOTE_COUNT).fill('');
}

function saveNotes(notes) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(notes, null, 2));
}

app.whenReady().then(() => {
  const mb = Menubar({
    index: `file://${path.join(__dirname, 'menu.html')}`,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    tooltip: 'QwikNotes',
    showDockIcon: false,
    browserWindow: {
      width: 320,
      height: 400,
      resizable: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    }
  });

  mb.on('ready', () => {
    console.log('Menubar app ready');
    app.dock.hide();
  });

  // Expose API to renderer
  mb.window.webContents.on('dom-ready', () => {
    mb.window.webContents.executeJavaScript(`
      window.notes = ${JSON.stringify(loadNotes())};
      window.noteCount = ${NOTE_COUNT};
    `);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
