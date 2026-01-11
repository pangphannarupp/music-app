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
    isElectron: true
});
