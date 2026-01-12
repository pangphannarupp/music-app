import React, { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import type { Song, Playlist } from '../types';
import { getRelatedVideos } from '../api/youtube';
import { getSkipSegments, type SponsorBlockSegment } from '../api/sponsorBlock';

interface PlaylistFolder {
    id: string;
    name: string;
    createdAt: number;
}

interface PlayerContextType {
    currentSong: Song | null;
    isPlaying: boolean;
    playSong: (song: Song) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrevious: () => void;
    queue: Song[];
    addToQueue: (song: Song) => void;
    hasPrevious: boolean;
    hasNext: boolean;
    isFullScreen: boolean;
    toggleFullScreen: () => void;
    relatedSongs: Song[];

    // History
    playbackHistory: Song[];
    clearHistory: () => void;

    // Player State
    currentTime: number;
    setCurrentTime: (time: number) => void;
    duration: number;
    setDuration: (duration: number) => void;
    seekRequest: number | null;
    setSeekRequest: (time: number | null) => void;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    seek: (time: number) => void;

    // Library
    favorites: Song[];
    toggleFavorite: (song: Song) => void;
    isFavorite: (songId: string) => boolean;
    playlists: Playlist[];
    folders: PlaylistFolder[];
    createPlaylist: (name: string, folderId?: string) => void;
    createFolder: (name: string) => void;
    deletePlaylist: (id: string) => void;
    deleteFolder: (id: string) => void;
    addToPlaylist: (playlistId: string, song: Song) => void;
    removeFromPlaylist: (playlistId: string, songId: string) => void;

    // Volume
    volume: number;
    setVolume: (vol: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Player Core Logic
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [seekRequest, setSeekRequest] = useState<number | null>(null);
    const [queue, setQueue] = useState<Song[]>([]);
    const [history, setHistory] = useState<Song[]>([]);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [relatedSongs, setRelatedSongs] = useState<Song[]>([]);
    const [skipSegments, setSkipSegments] = useState<SponsorBlockSegment[]>([]);

    // Persistent Playback History
    const [playbackHistory, setPlaybackHistory] = useState<Song[]>(() => {
        const saved = localStorage.getItem('playback_history');
        return saved ? JSON.parse(saved) : [];
    });

    // Volume State (0.0 to 1.0)
    const [volume, setVolume] = useState(0.8);

    // Library State with Persistence
    const [favorites, setFavorites] = useState<Song[]>(() => {
        const saved = localStorage.getItem('favorites');
        return saved ? JSON.parse(saved) : [];
    });

    const [playlists, setPlaylists] = useState<Playlist[]>(() => {
        const saved = localStorage.getItem('playlists');
        return saved ? JSON.parse(saved) : [];
    });

    const [folders, setFolders] = useState<PlaylistFolder[]>(() => {
        const saved = localStorage.getItem('playlist_folders');
        return saved ? JSON.parse(saved) : [];
    });

    // Persistence Effects
    useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)); }, [favorites]);
    useEffect(() => { localStorage.setItem('playlists', JSON.stringify(playlists)); }, [playlists]);
    useEffect(() => { localStorage.setItem('playlist_folders', JSON.stringify(folders)); }, [folders]);
    useEffect(() => { localStorage.setItem('playback_history', JSON.stringify(playbackHistory)); }, [playbackHistory]);

    // Update history when song changes
    useEffect(() => {
        if (currentSong) {
            setPlaybackHistory(prev => {
                // Remove existing entry of this song to move it to top
                const filtered = prev.filter(s => s.id !== currentSong.id);
                // Add to front, limit to 100
                return [currentSong, ...filtered].slice(0, 100);
            });
        }
    }, [currentSong]);

    // Fetch related songs
    useEffect(() => {
        if (currentSong) {
            getRelatedVideos(currentSong.id, currentSong.artist).then((songs) => {
                const filtered = songs.filter(s => s.id !== currentSong.id);
                setRelatedSongs(filtered);
            });
        }
    }, [currentSong]);

    // Player Actions
    const playSong = (song: Song) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            if (currentSong) setHistory(prev => [...prev, currentSong]);
            setCurrentSong(song);
            setIsPlaying(true);
        }
    };

    const togglePlay = () => setIsPlaying(prev => !prev);

    const seek = (time: number) => {
        setSeekRequest(time);
        setCurrentTime(time);
    };

    // SponsorBlock Effect
    useEffect(() => {
        if (currentSong?.id && !currentSong.isLocal) {
            setSkipSegments([]); // Reset
            getSkipSegments(currentSong.id).then(setSkipSegments);
        } else {
            setSkipSegments([]);
        }
    }, [currentSong?.id, currentSong?.isLocal]);

    // Check for skips on time update
    useEffect(() => {
        if (skipSegments.length > 0 && isPlaying) {
            const currentSegment = skipSegments.find(
                s => currentTime >= s.segment[0] && currentTime < s.segment[1]
            );

            if (currentSegment) {
                console.log(`[SponsorBlock] Skipping ${currentSegment.category} from ${currentSegment.segment[0]} to ${currentSegment.segment[1]}`);
                seek(currentSegment.segment[1]);
                // Optional: Show toast or visual indicator
            }
        }
    }, [currentTime, skipSegments, isPlaying]);

    const toggleFullScreen = () => setIsFullScreen(prev => !prev);

    const checkHasNext = () => queue.length > 0 || relatedSongs.length > 0;

    const playNext = () => {
        if (queue.length > 0) {
            const nextSong = queue[0];
            setQueue(prev => prev.slice(1));
            if (currentSong) setHistory(prev => [...prev, currentSong]);
            setCurrentSong(nextSong);
            setIsPlaying(true);
        } else if (relatedSongs.length > 0) {
            const nextSong = relatedSongs[0];
            if (currentSong) setHistory(prev => [...prev, currentSong]);
            setCurrentSong(nextSong);
            setIsPlaying(true);
        }
    };

    const playPrevious = () => {
        if (history.length > 0) {
            const prevSong = history[history.length - 1];
            setHistory(prev => prev.slice(0, -1));
            if (currentSong) setQueue(prev => [currentSong, ...prev]);
            setCurrentSong(prevSong);
            setIsPlaying(true);
        }
    };

    const addToQueue = (song: Song) => setQueue(prev => [...prev, song]);

    const clearHistory = () => setPlaybackHistory([]);

    // Library Actions
    const toggleFavorite = (song: Song) => {
        setFavorites(prev => {
            const exists = prev.some(s => s.id === song.id);
            if (exists) return prev.filter(s => s.id !== song.id);
            return [...prev, song];
        });
    };

    const isFavorite = (songId: string) => favorites.some(s => s.id === songId);

    const createPlaylist = (name: string, folderId?: string) => {
        const newPlaylist: Playlist = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
            name,
            songs: [],
            folderId,
            createdAt: Date.now(),
        };
        setPlaylists(prev => [...prev, newPlaylist]);
    };

    const createFolder = (name: string) => {
        const newFolder: PlaylistFolder = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
            name,
            createdAt: Date.now(),
        };
        setFolders(prev => [...prev, newFolder]);
    };

    const deletePlaylist = (id: string) => {
        setPlaylists(prev => prev.filter(p => p.id !== id));
    };

    const deleteFolder = (id: string) => {
        setFolders(prev => prev.filter(f => f.id !== id));
        setPlaylists(prev => prev.map(p => p.folderId === id ? { ...p, folderId: undefined } : p));
    };

    const addToPlaylist = (playlistId: string, song: Song) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId) {
                if (p.songs.some(s => s.id === song.id)) return p;
                return { ...p, songs: [...p.songs, song] };
            }
            return p;
        }));
    };

    const removeFromPlaylist = (playlistId: string, songId: string) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId) {
                return { ...p, songs: p.songs.filter(s => s.id !== songId) };
            }
            return p;
        }));
    };

    return (
        <PlayerContext.Provider value={{
            currentSong,
            isPlaying,
            playSong,
            togglePlay,
            playNext,
            playPrevious,
            queue,
            addToQueue,
            hasPrevious: history.length > 0,
            hasNext: checkHasNext(),
            isFullScreen,
            toggleFullScreen,
            relatedSongs,
            playbackHistory,
            clearHistory,
            currentTime,
            setCurrentTime,
            duration,
            setDuration,
            seekRequest,
            setSeekRequest,
            audioRef,
            seek,
            favorites,
            toggleFavorite,
            isFavorite,
            playlists,
            folders,
            createPlaylist,
            createFolder,
            deletePlaylist,
            deleteFolder,
            addToPlaylist,
            removeFromPlaylist,
            volume,
            setVolume
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = (): PlayerContextType => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};
