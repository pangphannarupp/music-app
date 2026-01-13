// TypeScript definitions for Electron API exposed via preload
export interface ElectronAPI {
    downloadFile: (videoId: string, defaultFilename: string, artist: string, title: string) => Promise<{
        success: boolean;
        canceled?: boolean;
        filePath?: string;
        error?: string;
    }>;
    onDownloadProgress: (callback: (data: { progress: string; message: string }) => void) => void;
    removeDownloadProgressListener: () => void;
    fetchUrl: (url: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getAudioUrl: (videoId: string) => Promise<{ success: boolean; url?: string; error?: string }>;
    searchVideos: (query: string) => Promise<{ success: boolean; songs?: any[]; error?: string }>;
    listDownloads: () => Promise<{ success: boolean; files?: any[]; error?: string }>;
    isElectron: boolean;
    // Media Shortcuts
    onMediaPlayPause: (callback: () => void) => void;
    onMediaNext: (callback: () => void) => void;
    onMediaPrevious: (callback: () => void) => void;
    removeMediaListeners: () => void;
    // Discord RPC
    setDiscordActivity: (activity: any) => void;

    // Taskbar Progress
    setProgressBar: (progress: number) => void;

    // Mini Player
    toggleMiniPlayer: () => void;
    updateMiniPlayer: (data: {
        isPlaying: boolean;
        currentSong: { title: string; artist: string; thumbnail: string } | null;
        currentTime: number;
        duration: number;
        themeColor: string;
        themeMode: string;
    }) => void;
    sendMiniPlayerAction: (action: 'play-pause' | 'next' | 'prev') => void;
    initMiniPlayer: () => void;
    onSyncMiniPlayer: (callback: (data: any) => void) => void;
    onGetPlayerState: (callback: () => void) => void;
    onMediaAction: (callback: (action: string) => void) => void;
}

declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}

export { };
