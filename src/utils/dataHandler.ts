export const exportData = () => {
    const data = {
        favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
        playlists: JSON.parse(localStorage.getItem('playlists') || '[]'),
        playlist_folders: JSON.parse(localStorage.getItem('playlist_folders') || '[]'),
        playback_history: JSON.parse(localStorage.getItem('playback_history') || '[]'),
        settings: {
            theme: localStorage.getItem('theme_mode'),
            color: localStorage.getItem('theme_color'),
            language: localStorage.getItem('app_language'),
        },
        version: 1,
        timestamp: Date.now()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `music-app-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);

                // Basic Validation
                if (!Array.isArray(data.favorites) || !Array.isArray(data.playlists)) {
                    throw new Error('Invalid backup file format');
                }

                // Restore Data
                localStorage.setItem('favorites', JSON.stringify(data.favorites));
                localStorage.setItem('playlists', JSON.stringify(data.playlists));

                if (data.playlist_folders) {
                    localStorage.setItem('playlist_folders', JSON.stringify(data.playlist_folders));
                }

                if (data.playback_history) {
                    localStorage.setItem('playback_history', JSON.stringify(data.playback_history));
                }

                if (data.settings) {
                    if (data.settings.theme) localStorage.setItem('theme_mode', data.settings.theme);
                    if (data.settings.color) localStorage.setItem('theme_color', data.settings.color);
                    if (data.settings.language) localStorage.setItem('app_language', data.settings.language);
                }

                resolve();
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};
