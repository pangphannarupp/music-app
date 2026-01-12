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
}

declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}

export { };
