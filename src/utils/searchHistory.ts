export const SEARCH_HISTORY_KEY = 'yt_music_search_history';
export const MAX_HISTORY_ITEMS = 5;

export const getSearchHistory = (): string[] => {
    try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (e) {
        console.warn('Failed to parse search history:', e);
        return [];
    }
};

export const addToSearchHistory = (query: string) => {
    if (!query || !query.trim()) return;

    const cleanQuery = query.trim();
    const currentHistory = getSearchHistory();

    // Remove if exists (to move to top)
    const filteredHistory = currentHistory.filter(item => item.toLowerCase() !== cleanQuery.toLowerCase());

    // Add to top
    const newHistory = [cleanQuery, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

    try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
        console.warn('Failed to save search history:', e);
    }
};
