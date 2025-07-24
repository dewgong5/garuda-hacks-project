const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let miniWindow;

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 300,
    height: 300,
    x: Math.round((width - 300) / 2),
    y: Math.round((height - 300) / 2),
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.loadURL('http://localhost:3000'); // Or loadFile if using static build
}

function createMiniWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  miniWindow = new BrowserWindow({
    width: 180,
    height: 180,
    x: width - 200,
    y: height - 220,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  miniWindow.loadURL('http://localhost:3000/mini'); // Create a /mini route if needed
}

app.whenReady().then(() => {
  createMainWindow();

  ipcMain.on('close-window', () => {
    BrowserWindow.getFocusedWindow()?.close();
  });

  ipcMain.on('open-mini-window', () => {
    if (!miniWindow) {
      createMiniWindow();
    }
  });
});
