const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const defaults = {
  gamePath: '',
  graphicsQuality: 'HDR',
  frameRate: 'Ultra (90 FPS)',
  controlsProfile: 'Classic (Default)',
  voiceChat: 'Enabled'
};

function configFile() {
  return path.join(app.getPath('userData'), 'battleground-client.json');
}

function readConfig() {
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(configFile(), 'utf8')) };
  } catch {
    return { ...defaults };
  }
}

function writeConfig(patch = {}) {
  const next = { ...readConfig(), ...patch };
  fs.writeFileSync(configFile(), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1536,
    height: 1024,
    minWidth: 760,
    minHeight: 620,
    frame: false,
    backgroundColor: '#080d12',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
  win.once('ready-to-show', () => win.show());
}

app.whenReady().then(() => {
  ipcMain.handle('window:minimize', e => BrowserWindow.fromWebContents(e.sender)?.minimize());
  ipcMain.handle('window:maximize', e => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (!win) return false;
    win.isMaximized() ? win.unmaximize() : win.maximize();
    return win.isMaximized();
  });
  ipcMain.handle('window:close', e => BrowserWindow.fromWebContents(e.sender)?.close());

  ipcMain.handle('config:get', () => readConfig());
  ipcMain.handle('config:save', (_e, patch) => writeConfig(patch));

  ipcMain.handle('game:browse', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select game executable',
      properties: ['openFile'],
      filters: [
        { name: 'Executable', extensions: ['exe', 'bat', 'cmd'] },
        { name: 'All files', extensions: ['*'] }
      ]
    });
    if (result.canceled || !result.filePaths[0]) return null;
    writeConfig({ gamePath: result.filePaths[0] });
    return result.filePaths[0];
  });

  ipcMain.handle('game:start', () => {
    const { gamePath } = readConfig();
    if (!gamePath) return { ok: false, error: 'Choose the game executable in Settings first.' };
    if (!fs.existsSync(gamePath)) return { ok: false, error: 'The configured executable no longer exists.' };

    try {
      const child = spawn(gamePath, [], {
        cwd: path.dirname(gamePath),
        detached: true,
        stdio: 'ignore',
        windowsHide: false
      });
      child.unref();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message || 'Unable to launch the game.' };
    }
  });

  ipcMain.handle('game:verify', () => {
    const { gamePath } = readConfig();
    if (!gamePath) return { ok: false, error: 'No executable configured.' };
    if (!fs.existsSync(gamePath)) return { ok: false, error: 'Executable not found.' };
    const stat = fs.statSync(gamePath);
    return {
      ok: stat.isFile(),
      fileName: path.basename(gamePath),
      size: stat.size,
      modified: stat.mtime.toISOString()
    };
  });

  ipcMain.handle('game:open-folder', async () => {
    const { gamePath } = readConfig();
    if (!gamePath || !fs.existsSync(gamePath)) {
      return { ok: false, error: 'Configure the game executable first.' };
    }
    const error = await shell.openPath(path.dirname(gamePath));
    return error ? { ok: false, error } : { ok: true };
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
