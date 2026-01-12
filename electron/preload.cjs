const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    downloadFile: (videoId, defaultFilename, artist, title) =>
        ipcRenderer.invoke('download-file', videoId, defaultFilename, artist, title),
    onDownloadProgress: (callback) => {
        ipcRenderer.on('download-progress', (_, data) => callback(data));
    },
    removeDownloadProgressListener: () => {
        ipcRenderer.removeAllListeners('download-progress');
    },
    fetchUrl: (url) => ipcRenderer.invoke('fetch-url', url),
    getAudioUrl: (videoId) => ipcRenderer.invoke('get-audio-url', videoId),
    searchVideos: (query) => ipcRenderer.invoke('search-videos', query),
    listDownloads: () => ipcRenderer.invoke('list-downloads'),
    isElectron: true,
    // Media Shortcuts
    onMediaPlayPause: (callback) => ipcRenderer.on('media-play-pause', callback),
    onMediaNext: (callback) => ipcRenderer.on('media-next', callback),
    onMediaPrevious: (callback) => ipcRenderer.on('media-previous', callback),
    removeMediaListeners: () => {
        ipcRenderer.removeAllListeners('media-play-pause');
        ipcRenderer.removeAllListeners('media-next');
        ipcRenderer.removeAllListeners('media-previous');
    },
    // Discord RPC
    setDiscordActivity: (activity) => ipcRenderer.send('set-discord-activity', activity),

    // Taskbar Progress
    setProgressBar: (progress) => ipcRenderer.send('set-progress-bar', progress),

    // Mini Player
    toggleMiniPlayer: () => ipcRenderer.send('toggle-mini-player'),
    updateMiniPlayer: (data) => ipcRenderer.send('update-mini-player', data),
    initMiniPlayer: () => ipcRenderer.send('mini-player-init'),
    sendMiniPlayerAction: (action) => ipcRenderer.send('mini-player-action', action),
    onSyncMiniPlayer: (callback) => ipcRenderer.on('sync-mini-player', (_, data) => callback(data)),
    onGetPlayerState: (callback) => ipcRenderer.on('get-player-state', callback),
    onMediaAction: (callback) => ipcRenderer.on('media-action', (_, action) => callback(action))
});
