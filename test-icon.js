const { app, Tray, nativeImage, Menu } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  // Try multiple icon approaches
  console.log('Testing tray icons...');
  
  // Method 1: Empty tray (always works)
  const tray1 = new Tray();
  tray1.setToolTip('Test: Empty tray');
  
  // Method 2: From file
  const iconPath = path.join(__dirname, 'src', 'assets', 'icon.png');
  console.log('Icon path:', iconPath);
  console.log('Icon exists:', require('fs').existsSync(iconPath));
  
  const tray2 = new Tray(nativeImage.createEmpty());
  tray2.setToolTip('Test: Empty nativeImage');
  
  // Method 3: Simple 16x16 icon
  const emptyImg = nativeImage.createEmpty();
  const tray3 = new Tray(emptyImg);
  tray3.setToolTip('Test: Empty image tray');
  
  tray3.setContextMenu(Menu.buildFromTemplate([
    { label: 'If you see this, tray works!', enabled: false },
    { label: 'Quit', click: () => app.quit() }
  ]));
  
  app.dock.hide();
  
  console.log('Trays created - check menu bar');
});
