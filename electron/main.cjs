const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
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

    // Load the app
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        console.log('Loading production app...');
        // alert(path.join(__dirname, '../dist/index.html'));
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Handle download request from renderer using Python yt-dlp
ipcMain.handle('download-file', async (event, videoId, defaultFilename, artist, title) => {
    try {
        // Show save dialog
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            defaultPath: defaultFilename,
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

app.whenReady().then(createWindow);

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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
