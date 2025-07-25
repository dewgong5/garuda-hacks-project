const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

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
    resizable: true,
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
    width: 200,
    height: 325,
    frame: true,
    transparent: false,
    resizable: true,
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

  ipcMain.on('launch-lockin', () => {
    const child = spawn('npm', ['start'], {
      cwd: path.join(__dirname, '../../'), // Go up to the root directory
      shell: true
    });

    child.stdout.on('data', (data) => {
      console.log(`Lockin stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`Lockin stderr: ${data}`);
    });

    child.on('close', (code) => {
      console.log(`Lockin process exited with code ${code}`);
    });

    // Hide the adris-frontend window
    mainWindow?.hide();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('browser-window-created', (_, win) => {
  win.webContents.on('context-menu', e => e.preventDefault());
});
