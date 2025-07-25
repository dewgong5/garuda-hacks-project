const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let miniWindow;

// Reusable default icon path
const appIcon = path.join(__dirname, 'assets', 'icon.png'); // ✅ Replace with your actual icon path

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 340,
    height: 340,
    x: Math.round((width - 340) / 2),
    y: Math.round((height - 340) / 2),
    frame: false,                     // ✅ Removes native title bar
    transparent: true,               // ✅ Enables glass-like transparency
    resizable: false,
    icon: appIcon,                   // ✅ Prevents Electron from showing "N"
    titleBarStyle: 'customButtonsOnHover', // Optional, for macOS style hover buttons
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);     // ✅ Hide the default menu
  mainWindow.setAutoHideMenuBar(true);        // ✅ Keep it hidden unless Alt is pressed (Windows)

  mainWindow.loadURL('http://localhost:3000');
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
    icon: appIcon,                   // ✅ Same icon to avoid fallback
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  miniWindow.setMenuBarVisibility(false);
  miniWindow.setAutoHideMenuBar(true);

  miniWindow.loadURL('http://localhost:3000/mini');
}

// App Ready
app.whenReady().then(() => {
  createMainWindow();

  // IPC events from frontend
  ipcMain.on('close-window', () => {
    BrowserWindow.getFocusedWindow()?.close();
  });

  ipcMain.on('open-mini-window', () => {
    if (!miniWindow) {
      createMiniWindow();
    } else {
      miniWindow.show();
    }
  });
});

// Quit app on all window close (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('browser-window-created', (_, win) => {
    win.webContents.on('context-menu', (e) => e.preventDefault());
  });
  
