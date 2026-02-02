const FAVORITES_KEY = 'yt_music_favorites';
const SETUP_COMPLETED_KEY = 'yt_music_setup_completed';

export const getFavorites = (): string[] => {
    try {
        const favorites = localStorage.getItem(FAVORITES_KEY);
        return favorites ? JSON.parse(favorites) : [];
    } catch (e) {
        console.warn('Failed to parse favorites:', e);
        return [];
    }
};

// Helper to handle storage quota
const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e: any) {
        console.warn(`Failed to save ${key}:`, e);
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
            // Try to clear space by removing non-critical data
            try {
                // Remove history if needed
                localStorage.removeItem('playback_history');
                // Retry
                localStorage.setItem(key, value);
            } catch (retryErr) {
                console.error("Critical: Failed to save even after cleanup", retryErr);
            }
        }
    }
};

export const saveFavorites = (favorites: string[]) => {
    safeSetItem(FAVORITES_KEY, JSON.stringify(favorites));
};

export const hasCompletedSetup = (): boolean => {
    try {
        return localStorage.getItem(SETUP_COMPLETED_KEY) === 'true';
    } catch (e) {
        return false;
    }
};

export const setSetupCompleted = (completed: boolean) => {
    safeSetItem(SETUP_COMPLETED_KEY, String(completed));
};

export const resetSetup = () => {
    try {
        localStorage.removeItem(SETUP_COMPLETED_KEY);
    } catch (e) {
        console.warn('Failed to reset setup:', e);
    }
};
