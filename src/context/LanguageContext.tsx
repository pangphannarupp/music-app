import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'km' | 'en';

interface Translations {
    home: string;
    favorites: string;
    settings: string;
    searchPlaceholder: string;
    discoverTitle: string;
    discoverSubtitle: string;
    results: string;
    searching: string;
    noFavorites: string;
    noFavoritesDesc: string;
    appearance: string;
    darkMode: string;
    primaryColor: string;
    language: string;
    clearData: string;
    clearDataDesc: string;
    about: string;
    sourceCode: string;
    clearDataConfirm: string;
    addedToFavorites: string;
    removedFromFavorites: string;
    library: string;
    history: string;
    notifications: string;
    back: string;
    playlistsTab: string;
    newPlaylist: string;
    newFolder: string;
    emptyFolder: string;
    noPlaylists: string;
    createOne: string;
    songs: string;
    light: string;
    dark: string;
    system: string;
    createPlaylistTitle: string;
    createFolderTitle: string;
    playlistNamePlaceholder: string;
    folderNamePlaceholder: string;
    cancel: string;
    create: string;
    confirm: string;
    playlist: string;
    playlistNotFound: string;
    removeSong: string;
    removeSongConfirm: string;
    emptyPlaylist: string;
    searchToAdd: string;
    appName: string;
    menu: string;
    empty: string;
    myFolder: string;
    myPlaylist: string;
    loading: string;
    loadMore: string;
    historyTitle: string;
    noHistory: string;
    noHistoryDesc: string;
    clearHistory: string;
    clearHistoryConfirm: string;
    clearAll: string;
    popularArtists: string;
    nowPlaying: string;
    download: string;
    downloading: string;
    downloadSuccess: string;
    downloadError: string;
    recentSearches: string;
    listenAgain: string;
    newSongs: string;
    downloads: string;
    dataManagement: string;
    exportData: string;
    importData: string;
    importConfirm: string;
}

const translations: Record<Language, Translations> = {
    en: {
        home: 'Home',
        favorites: 'Favorites',
        settings: 'Settings',
        searchPlaceholder: 'Search for songs, artists...',
        discoverTitle: 'Discover Your Vibe',
        discoverSubtitle: 'Search for your favorite tracks from YouTube',
        results: 'Results',
        searching: 'Searching...',
        noFavorites: 'No favorites yet',
        noFavoritesDesc: 'Click the heart icon on any song to add it to your collection.',
        appearance: 'Appearance',
        darkMode: 'Dark Mode',
        primaryColor: 'Primary Color',
        language: 'Language',
        clearData: 'Clear Data',
        clearDataDesc: 'Clear all your local data including favorites and playlists. This action cannot be undone.',
        about: 'About',
        sourceCode: 'Source Code',
        clearDataConfirm: 'Are you sure you want to clear all data?',
        addedToFavorites: 'Added to favorites',
        removedFromFavorites: 'Removed from favorites',
        library: 'Library',
        history: 'History',
        notifications: 'Notifications',
        back: 'Back',
        playlistsTab: 'Playlists',
        downloads: 'Downloads',
        newPlaylist: 'New Playlist',
        newFolder: 'New Folder',
        emptyFolder: 'Empty folder',
        noPlaylists: 'No playlists yet.',
        createOne: 'Create one above!',
        songs: 'songs',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        createPlaylistTitle: 'Create New Playlist',
        createFolderTitle: 'Create New Folder',
        playlistNamePlaceholder: 'Playlist Name',
        folderNamePlaceholder: 'Folder Name',
        cancel: 'Cancel',
        create: 'Create',
        confirm: 'Confirm',
        playlist: 'Playlist',
        playlistNotFound: 'Playlist not found',
        removeSong: 'Remove Song',
        removeSongConfirm: 'Are you sure you want to remove this song from the playlist?',
        emptyPlaylist: 'This playlist is empty.',
        searchToAdd: 'Search for songs and add them to this playlist.',
        appName: 'Your Music',
        menu: 'Menu',
        empty: 'Empty',
        myFolder: 'My Folder',
        myPlaylist: 'My Playlist',
        loading: 'Loading...',
        loadMore: 'Load More',
        historyTitle: 'History',
        noHistory: 'No history yet',
        noHistoryDesc: 'Songs you play will appear here',
        clearHistory: 'Clear History',
        clearHistoryConfirm: 'Are you sure you want to clear your playback history? This cannot be undone.',
        clearAll: 'Clear All',
        popularArtists: 'Popular Artists',
        nowPlaying: 'Now Playing',
        download: 'Download',
        downloading: 'Downloading...',
        downloadSuccess: 'Download complete!',
        downloadError: 'Download failed',
        recentSearches: 'Recent Searches',
        listenAgain: 'Listen Again',
        newSongs: 'New Songs',
        dataManagement: 'Data Management',
        exportData: 'Export Backup',
        importData: 'Import Backup',
        importConfirm: 'This will overwrite your current data. Continue?'
    },
    km: {
        home: 'ទំព័រដើម',
        favorites: 'ចំណូលចិត្ត',
        settings: 'ការកំណត់',
        searchPlaceholder: 'ស្វែងរកបទចម្រៀង, តារាចម្រៀង...',
        discoverTitle: 'ស្វែងរកតន្ត្រីរបស់អ្នក',
        discoverSubtitle: 'ស្វែងរកបទចម្រៀងដែលអ្នកចូលចិត្តពី YouTube',
        results: 'លទ្ធផល',
        searching: 'កំពុងស្វែងរក...',
        noFavorites: 'មិនទាន់មានចំណូលចិត្តនៅឡើយទេ',
        noFavoritesDesc: 'ចុចរូបបេះដូងលើបទចម្រៀងណាមួយដើម្បីរក្សាទុក',
        appearance: 'រូបរាង',
        darkMode: 'របៀបងងឹត',
        primaryColor: 'ពណ៌ចម្បង',
        language: 'ភាសា',
        clearData: 'លុបទិន្នន័យ',
        clearDataDesc: 'លុបទិន្នន័យទាំងអស់ដូចជាចំណូលចិត្តនិងបញ្ជីចាក់។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
        about: 'អំពី',
        sourceCode: 'កូដប្រភព',
        clearDataConfirm: 'តើអ្នកប្រាកដថាចង់លុបទិន្នន័យទាំងអស់ឬទេ?',
        addedToFavorites: 'បានដាក់ចូលចំណូលចិត្ត',
        removedFromFavorites: 'បានដកចេញពីចំណូលចិត្ត',
        library: 'បណ្ណាល័យ',
        history: 'ប្រវត្តិ',
        notifications: 'ការជូនដំណឹង',
        back: 'ត្រឡប់',
        playlistsTab: 'បញ្ជីចាក់',
        downloads: 'ដែលបានទាញយក',
        newPlaylist: 'បញ្ជីចាក់ថ្មី',
        newFolder: 'ថតថ្មី',
        emptyFolder: 'ថតទទេ',
        noPlaylists: 'មិនទាន់មានបញ្ជីចាក់ទេ',
        createOne: 'បង្កើតថ្មីនៅខាងលើ!',
        songs: 'បទ',
        light: 'ភ្លឺ',
        dark: 'ងងឹត',
        system: 'ប្រព័ន្ធ',
        createPlaylistTitle: 'បង្កើតបញ្ជីចាក់ថ្មី',
        createFolderTitle: 'បង្កើតថតថ្មី',
        playlistNamePlaceholder: 'ឈ្មោះបញ្ជីចាក់',
        folderNamePlaceholder: 'ឈ្មោះថត',
        cancel: 'បោះបង់',
        create: 'បង្កើត',
        confirm: 'យល់ព្រម',
        playlist: 'បញ្ជីចាក់',
        playlistNotFound: 'រកមិនឃើញបញ្ជីចាក់ទេ',
        removeSong: 'លុបបទចម្រៀង',
        removeSongConfirm: 'តើអ្នកប្រាកដថាចង់លុបបទចម្រៀងនេះពីបញ្ជីចាក់ឬទេ?',
        emptyPlaylist: 'បញ្ជីចាក់នេះទទេ',
        searchToAdd: 'ស្វែងរកបទចម្រៀងហើយដាក់ចូលក្នុងបញ្ជីចាក់នេះ',
        appName: 'តន្ត្រីរបស់អ្នក',
        menu: 'ម៉ឺនុយ',
        empty: 'ទទេ',
        myFolder: 'ថតរបស់ខ្ញុំ',
        myPlaylist: 'បញ្ជីចាក់របស់ខ្ញុំ',
        loading: 'កំពុងផ្ទុក...',
        loadMore: 'ផ្ទុកបន្ថែម',
        historyTitle: 'ប្រវត្តិ',
        noHistory: 'មិនទាន់មានប្រវត្តិនៅឡើយទេ',
        noHistoryDesc: 'បទចម្រៀងដែលអ្នកចាក់នឹងបង្ហាញនៅទីនេះ',
        clearHistory: 'លុបប្រវត្តិ',
        clearHistoryConfirm: 'តើអ្នកប្រាកដថាចង់លុបប្រវត្តិការចាក់របស់អ្នកឬទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
        clearAll: 'លុបទាំងអស់',
        popularArtists: 'តារាចម្រៀងពេញនិយម',
        nowPlaying: 'កំពុងចាក់',
        download: 'ទាញយក',
        downloading: 'កំពុងទាញយក...',
        downloadSuccess: 'ទាញយករួចរាល់!',
        downloadError: 'ទាញយកបរាជ័យ',
        recentSearches: 'ការស្វែងរកថ្មីៗ',
        listenAgain: 'ស្តាប់ម្តងទៀត',
        newSongs: 'បទចម្រៀងថ្មីៗ',
        dataManagement: 'ការគ្រប់គ្រងទិន្នន័យ',
        exportData: 'នាំចេញទិន្នន័យ',
        importData: 'នាំចូលទិន្នន័យ',
        importConfirm: 'សកម្មភាពនេះនឹងលុបនិងជំនួសទិន្នន័យបច្ចុប្បន្នរបស់អ្នក។ បន្តដែរឬទេ?'
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('app_language');
        return (saved as Language) || 'km'; // Default to Khmer as requested
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
        document.documentElement.lang = language;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
    return context;
};
