const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let miniWindow;

// Use ICO file for Windows, ICNS for macOS if needed
const appIcon = path.join(__dirname, 'assets', 'favicon.ico');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 420,
    frame: true,
    transparent: false,
    resizable: false,
    icon: appIcon, // ✅ Custom icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  // Hide top menu bar
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);

  // Load your main React/Next.js app
  mainWindow.loadURL('http://localhost:3000');
}

function createMiniWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  miniWindow = new BrowserWindow({
    width: 300, // or your preferred width
    height: 300, // or your preferred height
    x: width - 280,
    y: height - 280,
    frame: true,
    transparent: false,
    resizable: false,
    alwaysOnTop: true,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  miniWindow.setMenuBarVisibility(false);
  miniWindow.setAutoHideMenuBar(true);
  miniWindow.loadURL('http://localhost:3000/mini');

  // Show main window again if mini is closed
  miniWindow.on('closed', () => {
    miniWindow = null;
    mainWindow?.show();
  });
}

app.whenReady().then(() => {
  createMainWindow();

  // IPC listeners from renderer process
  ipcMain.on('close-window', () => {
    BrowserWindow.getFocusedWindow()?.close();
  });

  ipcMain.on('open-mini-window', () => {
    if (!miniWindow) {
      createMiniWindow();
    } else {
      miniWindow.show();
    }
    mainWindow?.hide();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('browser-window-created', (_, win) => {
  win.webContents.on('context-menu', e => e.preventDefault());
});
