const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const https = require('https');
const AdmZip = require('adm-zip');

let mainWindow;
let splashWindow;

// Directories
const CONTENT_DIR = path.join(app.getPath('userData'), 'app-content');
const BUNDLED_CONTENT = path.join(__dirname, '../dist/content/index.html');

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        backgroundColor: '#000000',
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Simple splash doesn't need isolation
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));

    splashWindow.on('closed', () => {
        splashWindow = null;
    });
}

function createMainWindow(contentPath) {
    if (mainWindow) return;

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs'),
            webSecurity: false,
            allowRunningInsecureContent: true
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#000000',
        show: false // Don't show until ready
    });

    console.log('Loading app from:', contentPath);
    mainWindow.loadFile(contentPath);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (splashWindow) {
            splashWindow.close();
        }
        registerGlobalShortcuts();
    });

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Update Helper Functions
function downloadFile(url, dest, onProgress) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (response) => {
            // Handle Redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                console.log(`Redirecting to: ${response.headers.location}`);
                return downloadFile(response.headers.location, dest, onProgress)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to download: ${response.statusCode}`));
            }

            const file = fs.createWriteStream(dest);
            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloaded = 0;

            response.on('data', (chunk) => {
                downloaded += chunk.length;
                if (totalSize && onProgress) {
                    onProgress((downloaded / totalSize) * 100);
                }
                file.write(chunk);
            });

            response.on('end', () => {
                file.end();
                file.on('finish', resolve);
            });

            // Handle file stream errors
            file.on('error', (err) => {
                fs.unlink(dest, () => { });
                reject(err);
            });

        });

        req.on('error', (err) => {
            // Ensure we don't leave partial files if connection fails before stream creation
            if (fs.existsSync(dest)) fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

// Local version helper
function getLocalVersion() {
    // Store version.json in the user data root (persistent storage)
    // simpler than managing inside the potentially overwritten content dir
    const localVersionPath = path.join(app.getPath('userData'), 'version.json');
    try {
        if (fs.existsSync(localVersionPath)) {
            return JSON.parse(fs.readFileSync(localVersionPath, 'utf8'));
        }
    } catch (e) { }
    return { mainVersion: 0, partialVersion: 0 }; // Default 0.0
}

function saveLocalVersion(mainVer, partialVer) {
    const localVersionPath = path.join(app.getPath('userData'), 'version.json');
    fs.writeFileSync(localVersionPath, JSON.stringify({
        mainVersion: mainVer,
        partialVersion: partialVer
    }, null, 2));
}

async function checkForUpdates() {
    try {
        if (splashWindow) splashWindow.webContents.send('update-status', 'Initializing update check...');

        // 1. Get Update Config
        let configPath = path.join(process.resourcesPath, 'config.json');
        console.log('Reading config from:', configPath);

        // Fallback for local testing (when running "electron ." but simulating prod)
        if (!fs.existsSync(configPath)) {
            const rootConfig = path.join(__dirname, '../config.json');
            if (fs.existsSync(rootConfig)) {
                configPath = rootConfig;
                console.log('Found config in root:', configPath);
            }
        }

        if (!fs.existsSync(configPath)) {
            console.log('No config.json found. Skipping update.');
            if (splashWindow) splashWindow.webContents.send('update-status', `Config missing at: ${configPath}`);
            await dialog.showMessageBox(splashWindow, {
                type: 'warning',
                title: 'Configuration Missing',
                message: `No config.json found at ${configPath}. Update check skipped.`,
                buttons: ['OK']
            });
            await new Promise(r => setTimeout(r, 2000));
            startApp();
            return;
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const updateBaseUrl = config.updateUrl;
        const appKey = config.appKey || 'MUSIC_APP';

        if (!updateBaseUrl) {
            console.log('No updateUrl in config. Skipping update.');
            if (splashWindow) splashWindow.webContents.send('update-status', 'Update URL missing in config.');
            await new Promise(r => setTimeout(r, 2000));
            startApp();
            return;
        }

        // 2. Prepare Request
        const localVer = getLocalVersion();
        console.log('Checking updates for:', appKey, 'Local:', localVer);

        if (splashWindow) splashWindow.webContents.send('update-status', 'Checking for updates...');

        // POST request to /api/get-latest-content
        // Note: Node 20 environment supports global fetch
        const apiUrl = new URL('/api/get-latest-content', updateBaseUrl).toString();

        console.log(`Fetching from ${apiUrl}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appKey: appKey,
                mainVersion: localVer.mainVersion,
                partialVersion: localVer.partialVersion
            }),
            signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));

        if (!response.ok) {
            throw new Error(`Update API failed: ${response.status}`);
        }

        const data = await response.json();
        /*
        Response Structure:
        {
            "result": true,
            "current_main_version": 4,
            "current_partial_version": 0,
            "download_url": [ { "url": "...", "type": "main" } ]
        }
        */

        if (data.result) {
            const remoteMain = parseInt(data.current_main_version);
            const remotePartial = parseInt(data.current_partial_version);
            const localMain = parseInt(localVer.mainVersion);
            const localPartial = parseInt(localVer.partialVersion);

            const hasUpdate = (remoteMain > localMain) || (remoteMain === localMain && remotePartial > localPartial);

            console.log(`Update check: Local ${localMain}.${localPartial} vs Remote ${remoteMain}.${remotePartial} -> ${hasUpdate}`);

            if (hasUpdate && data.download_url && data.download_url.length > 0) {
                // Ensure content dir exists
                if (!fs.existsSync(CONTENT_DIR)) {
                    fs.mkdirSync(CONTENT_DIR, { recursive: true });
                }

                // Process all downloads sequentially
                for (let i = 0; i < data.download_url.length; i++) {
                    const item = data.download_url[i];
                    const versionLabel = item.version || `${remoteMain}.${remotePartial}`;
                    const itemsTotal = data.download_url.length;

                    if (splashWindow) splashWindow.webContents.send('update-status', `Downloading update (${i + 1}/${itemsTotal}): v${versionLabel}...`);

                    const zipPath = path.join(app.getPath('temp'), `update_${i}.zip`);
                    const downloadUrl = new URL(item.url, updateBaseUrl).toString();

                    console.log(`Downloading part ${i + 1}/${itemsTotal} from:`, downloadUrl);

                    // Download
                    await downloadFile(downloadUrl, zipPath, (progress) => {
                        if (splashWindow) splashWindow.webContents.send('update-progress', progress);
                    });

                    // Extract
                    if (splashWindow) splashWindow.webContents.send('update-status', `Installing update (${i + 1}/${itemsTotal})...`);
                    const zip = new AdmZip(zipPath);
                    zip.extractAllTo(CONTENT_DIR, true); // overwrite

                    console.log('Extracted to:', CONTENT_DIR);

                    // Clean up
                    fs.unlinkSync(zipPath);
                }

                if (splashWindow) splashWindow.webContents.send('update-status', 'All updates installed!');

                // Save new version
                saveLocalVersion(data.current_main_version, data.current_partial_version);

                await new Promise(r => setTimeout(r, 1000));

                startApp(true); // Launch updated content
                return;
            } else {
                if (splashWindow) splashWindow.webContents.send('update-status', 'You are up to date.');
                await new Promise(r => setTimeout(r, 1000));
            }
        } else {
            if (splashWindow) splashWindow.webContents.send('update-status', 'No update info received.');
            await new Promise(r => setTimeout(r, 1000));
        }

        startApp(true); // Launch existing (downloaded) or bundled

    } catch (error) {
        console.error('Update failed:', error);
        if (splashWindow) splashWindow.webContents.send('update-status', `Error: ${error.message}`);
        await new Promise(r => setTimeout(r, 3000));
        startApp(); // Fallback
    }
}

function startApp(preferDownloaded = false) {
    let localIndex = path.join(CONTENT_DIR, 'index.html');
    console.log('Checking for local content at:', localIndex);

    // Handle nested extraction (e.g. zip contains "content/index.html")
    if (!fs.existsSync(localIndex)) {
        const nestedIndex = path.join(CONTENT_DIR, 'content', 'index.html');
        console.log('Checking nested content at:', nestedIndex);
        if (fs.existsSync(nestedIndex)) {
            localIndex = nestedIndex;
            console.log('Found nested content!');
        }
    }

    // Check if we have valid downloaded content
    if (preferDownloaded && fs.existsSync(localIndex)) {
        console.log('Found local content, loading...');
        createMainWindow(localIndex);
    } else if (fs.existsSync(localIndex)) {
        // Even if update failed, if we have old valid content, use it? 
        // Or strictly fallback to bundle? Let's prefer downloaded if it exists.
        console.log('Found existing local content (fallback), loading...');
        createMainWindow(localIndex);
    } else {
        // Fallback to bundled
        console.log('Local content missing, falling back to bundled.');
        createMainWindow(BUNDLED_CONTENT);
    }
}

app.whenReady().then(() => {
    // Only verify/update in production or if explicitly testing
    const isDev = process.env.NODE_ENV === 'development';
    // const isDev = false;

    if (isDev) {
        mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.cjs'),
                webSecurity: false, // Allow loading local and remote resources without CORS
                allowRunningInsecureContent: true
            },
            titleBarStyle: 'hiddenInset',
            backgroundColor: '#000000'
        });
        mainWindow.loadURL('http://localhost:5174');
        mainWindow.webContents.openDevTools();
        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    } else {
        createSplashWindow();
        checkForUpdates();
    }
});

// Handle download request from renderer using Python yt-dlp
ipcMain.handle('download-file', async (event, videoId, defaultFilename, artist, title) => {
    try {
        // Show save dialog
        const defaultPath = path.join(app.getPath('music'), defaultFilename);
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            defaultPath: defaultPath,
            filters: [
                { name: 'Audio Files', extensions: ['mp3'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (canceled || !filePath) {
            return { success: false, canceled: true };
        }

        // Path to Python script
        const isDev = process.env.NODE_ENV === 'development';
        const scriptPath = isDev
            ? path.join(__dirname, '../scripts/download.py')
            : path.join(process.resourcesPath, 'scripts/download.py');

        // Execute Python script
        return new Promise((resolve) => {
            // Use generic python3 command
            const pythonCmd = 'python3';
            console.log(`Spawning python with: ${pythonCmd} and script: ${scriptPath}`);
            console.log(`PATH: ${process.env.PATH}`);

            const python = spawn(pythonCmd, [
                scriptPath,
                videoId,
                filePath,
                artist || 'Unknown Artist',
                title || 'Unknown Title'
            ]);

            let errorOutput = '';

            python.stdout.on('data', (data) => {
                const text = data.toString();
                console.log('Python:', text);

                // Parse JSON progress messages and send to renderer
                try {
                    const lines = text.trim().split('\n');
                    for (const line of lines) {
                        if (line.trim() && line.includes('{')) {
                            const msg = JSON.parse(line);

                            // Send progress to renderer
                            if (msg.status === 'progress' && mainWindow) {
                                mainWindow.webContents.send('download-progress', {
                                    progress: msg.progress,
                                    message: msg.message
                                });
                            }
                        }
                    }
                } catch (e) {
                    // Not JSON, just log
                }
            });

            python.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error('Python error:', data.toString());
            });

            python.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, filePath });
                } else {
                    resolve({
                        success: false,
                        error: errorOutput || 'Download failed. Make sure Python 3 and yt-dlp are installed.'
                    });
                }
            });

            python.on('error', (err) => {
                resolve({
                    success: false,
                    error: `Failed to start Python: ${err.message}. Make sure Python 3 is installed.`
                });
            });
        });
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Proxy URL fetching to avoid CORS in renderer
ipcMain.handle('fetch-url', async (event, url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get direct audio URL using yt-dlp (Python)
ipcMain.handle('get-audio-url', async (event, videoId) => {
    try {
        // Path to Python script
        const isDev = process.env.NODE_ENV === 'development';
        const scriptPath = isDev
            ? path.join(__dirname, '../scripts/download.py')
            : path.join(process.resourcesPath, 'scripts/download.py');

        return new Promise((resolve) => {
            const pythonCmd = 'python3';
            const python = spawn(pythonCmd, [
                scriptPath,
                'get_url',
                videoId
            ]);

            let output = '';
            let errorOutput = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error('Python Stderr:', data.toString());
            });

            python.on('close', (code) => {
                if (code === 0) {
                    try {
                        // Find the JSON line in output
                        const lines = output.trim().split('\n');
                        let resultUrl = null;

                        for (const line of lines) {
                            try {
                                const msg = JSON.parse(line);
                                if (msg.status === 'success' && msg.url) {
                                    resultUrl = msg.url;
                                    break;
                                }
                            } catch (e) { }
                        }

                        if (resultUrl) {
                            resolve({ success: true, url: resultUrl });
                        } else {
                            resolve({ success: false, error: 'Could not parse URL from python output' });
                        }
                    } catch (e) {
                        resolve({ success: false, error: 'Failed to parse python output' });
                    }
                } else {
                    resolve({ success: false, error: errorOutput || 'Python script failed' });
                }
            });
        });
    } catch (error) {
        return { success: false, error: error.message };
    }
});



// Search videos using yt-dlp (Python)
ipcMain.handle('search-videos', async (event, query) => {
    try {
        // Path to Python script
        const isDev = process.env.NODE_ENV === 'development';
        const scriptPath = isDev
            ? path.join(__dirname, '../scripts/download.py')
            : path.join(process.resourcesPath, 'scripts/download.py');

        return new Promise((resolve) => {
            const pythonCmd = 'python3';
            const python = spawn(pythonCmd, [
                scriptPath,
                'search',
                query,
                '12' // Limit to 12
            ]);

            let output = '';
            let errorOutput = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorOutput += data.toString();
                // console.error('Python Search Stderr:', data.toString());
            });

            python.on('close', (code) => {
                if (code === 0) {
                    try {
                        // Find the JSON line in output
                        const lines = output.trim().split('\n');
                        let results = [];

                        for (const line of lines) {
                            try {
                                const msg = JSON.parse(line);
                                if (msg.status === 'success' && msg.results) {
                                    results = msg.results;
                                    break;
                                }
                            } catch (e) { }
                        }

                        resolve({ success: true, songs: results });
                    } catch (e) {
                        resolve({ success: false, error: 'Failed to parse python output' });
                    }
                } else {
                    resolve({ success: false, error: errorOutput || 'Python script failed' });
                }
            });
        });
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// List downloaded files
// List downloaded files
ipcMain.handle('list-downloads', async () => {
    try {
        const pathsToScan = [
            app.getPath('music'),
            app.getPath('downloads')
        ];

        const fs = require('fs/promises');
        let allFiles = [];

        for (const dirPath of pathsToScan) {
            try {
                const files = await fs.readdir(dirPath);
                const audioExtensions = ['.mp3', '.webm', '.m4a', '.wav', '.ogg', '.aac'];
                const audioFiles = files
                    .filter(f => audioExtensions.some(ext => f.toLowerCase().endsWith(ext)))
                    .map(f => ({
                        name: f,
                        path: path.join(dirPath, f)
                    }));
                allFiles = [...allFiles, ...audioFiles];
            } catch (e) {
                console.warn(`Failed to read directory: ${dirPath}`, e);
            }
        }

        // Remove duplicates (by name or path? let's keep all valid paths)
        return { success: true, files: allFiles };

    } catch (error) {
        return { success: false, error: error.message };
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        startApp();
    }
});

// Global Shortcuts
function registerGlobalShortcuts() {
    // Media Play/Pause
    globalShortcut.register('MediaPlayPause', () => {
        if (mainWindow) mainWindow.webContents.send('media-play-pause');
    });

    // Media Next Track
    globalShortcut.register('MediaNextTrack', () => {
        if (mainWindow) mainWindow.webContents.send('media-next');
    });

    // Media Previous Track
    globalShortcut.register('MediaPreviousTrack', () => {
        if (mainWindow) mainWindow.webContents.send('media-previous');
    });
}

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
// Discord Rich Presence
const DiscordRPC = require('discord-rpc');
// Replace this with your own Client ID from the Discord Developer Portal
const clientId = '123456789012345678';
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

let rpcReady = false;

rpc.on('ready', () => {
    rpcReady = true;
    console.log('Discord RPC Ready');
});

ipcMain.on('set-discord-activity', (_, activity) => {
    if (!rpcReady) return;
    rpc.setActivity(activity).catch(console.error);
});

// Taskbar Progress
ipcMain.on('set-progress-bar', (_, progress) => {
    if (mainWindow) {
        mainWindow.setProgressBar(progress);
    }
});

// Mini Player Window
let miniPlayerWindow = null;

function createMiniPlayerWindow() {
    if (miniPlayerWindow) return;

    miniPlayerWindow = new BrowserWindow({
        width: 300,
        height: 120,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs'),
        },
        titleBarStyle: 'hidden',
        show: false,
        skipTaskbar: true,
    });

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        miniPlayerWindow.loadURL('http://localhost:5174/src/mini-player.html');
    } else {
        // Prod: load from file, handle both bundled and downloaded scenarios?
        // Actually, for simplicity, let's assume it's part of the app bundle for now.
        // We'll trust Vite acts correctly for multi-page apps or we route via hash.
        // Let's try loading the file directly from dist if it exists, or main window's dir.
        miniPlayerWindow.loadFile(path.join(__dirname, '../dist/content/src/mini-player.html'));
    }

    miniPlayerWindow.on('closed', () => {
        miniPlayerWindow = null;
    });
}

ipcMain.on('toggle-mini-player', () => {
    if (miniPlayerWindow) {
        miniPlayerWindow.close();
        miniPlayerWindow = null;
    } else {
        createMiniPlayerWindow();
        miniPlayerWindow.once('ready-to-show', () => {
            miniPlayerWindow.show();
        });
    }
});

ipcMain.on('mini-player-action', (event, action) => {
    // Forward action to main window
    if (mainWindow) {
        mainWindow.webContents.send('media-action', action);
    }
});

// Init Handshake
ipcMain.on('mini-player-init', () => {
    if (mainWindow) {
        mainWindow.webContents.send('get-player-state');
    }
});

// Update Mini Player State
ipcMain.on('update-mini-player', (event, data) => {
    if (miniPlayerWindow) {
        miniPlayerWindow.webContents.send('sync-mini-player', data);
    }
});

// Login to Discord RPC when app is ready
app.whenReady().then(() => {
    rpc.login({ clientId }).catch(() => {
        console.log('[Discord RPC] Not connected (optional)');
    });
});

