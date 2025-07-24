const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 320,
    height: 340,
    frame: false, // Removes OS chrome
    transparent: true, // Allows background to be transparent
    resizable: true, // Allow resizing
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // if you use preload
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadURL('http://localhost:3000');

  ipcMain.on('close-window', () => {
    win.close();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
