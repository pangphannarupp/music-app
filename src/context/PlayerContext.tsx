import React, { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import type { Song, Playlist } from '../types';
import { getRelatedVideos } from '../api/youtube';
import { getSkipSegments, type SponsorBlockSegment } from '../api/sponsorBlock';
import { useTheme } from './ThemeContext';

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
    updatePlaylist: (id: string, data: Partial<Playlist>) => void;
    reorderPlaylist: (id: string, newSongs: Song[]) => void;


    // Volume
    volume: number;
    setVolume: (vol: number) => void;

    // Visualizer
    analyser: AnalyserNode | null;

    // Sleep Timer
    sleepTimerEnd: number | null;
    setSleepTimer: (minutes: number) => void;

    // PiP
    togglePiP: () => Promise<void>;

    // Equalizer
    eqBands: number[];
    setEqBand: (index: number, gain: number) => void;
    currentPreset: string;
    setPreset: (presetId: string) => void;

}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Player Core Logic
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const { mode, color } = useTheme();
    // ...

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
        try {
            const saved = localStorage.getItem('playback_history');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Sanitize: Detect old Radio stations missing the flag
                return parsed.map((s: Song) => ({
                    ...s,
                    // Heuristic: If ID matches UUID format (long) and not local, assume it's possibly a radio station
                    // Better: If it was saved before, we rely on standard format.
                    // Real fix: Just ensure we don't break.
                    isRadio: s.isRadio || (s.id && s.id.length > 20 && !s.isLocal && !s.duration)
                }));
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
        return [];
    });

    // Volume State (0.0 to 1.0)
    const [volume, setVolume] = useState(0.8);

    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

    // EQ State
    const [eqBands, setEqBands] = useState<number[]>([0, 0, 0, 0, 0]); // 60, 230, 910, 4k, 14k
    const [currentPreset, setCurrentPreset] = useState('manual');
    const filtersRef = useRef<BiquadFilterNode[]>([]);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Load EQ settings
    useEffect(() => {
        const savedEq = localStorage.getItem('equalizer_bands');
        const savedPreset = localStorage.getItem('equalizer_preset');
        if (savedEq) setEqBands(JSON.parse(savedEq));
        if (savedPreset) setCurrentPreset(savedPreset);
    }, []);

    // Safe LocalStorage Helper
    const safeSetItem = (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch (e: any) {
            console.error(`Failed to save ${key} to localStorage:`, e);
            if (e.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded. Trimming history to save space.');
                // Emergency: Clear old history if we can't save
                try {
                    const history = JSON.parse(localStorage.getItem('playback_history') || '[]');
                    if (history.length > 50) {
                        localStorage.setItem('playback_history', JSON.stringify(history.slice(-50)));
                    }
                } catch (err) { }
            }
        }
    };

    // Save EQ settings
    useEffect(() => {
        safeSetItem('equalizer_bands', JSON.stringify(eqBands));
        safeSetItem('equalizer_preset', JSON.stringify(currentPreset));

        // Update live filters
        filtersRef.current.forEach((filter, index) => {
            if (filter) {
                // Smooth transition
                filter.gain.setTargetAtTime(eqBands[index], (audioCtxRef.current?.currentTime || 0), 0.1);
            }
        });
    }, [eqBands, currentPreset]);

    const setEqBand = (index: number, gain: number) => {
        setCurrentPreset('manual');
        setEqBands(prev => {
            const newBands = [...prev];
            newBands[index] = gain;
            return newBands;
        });
    };

    const setPreset = (presetId: string) => {
        // Presets definition
        const presets: Record<string, number[]> = {
            'flat': [0, 0, 0, 0, 0],
            'bass': [5, 3, 0, 0, 0],
            'rock': [4, 2, -2, 3, 4],
            'pop': [-1, 2, 4, 1, -2],
            'vocal': [-2, -1, 3, 4, 1],
            'classical': [4, 2, -2, 2, 4],
            'manual': eqBands
        };

        if (presets[presetId]) {
            setCurrentPreset(presetId);
            if (presetId !== 'manual') {
                setEqBands(presets[presetId]);
            }
        }
    };

    // Audio Context Initialization for Visualizer & EQ
    useEffect(() => {
        if (audioRef.current && isPlaying) {
            try {
                // Check if context already exists (we might reuse it, but simpler to ensure setup)
                // Note: We need to handle re-initialization carefully or check if nodes are connected
                if ((audioRef.current as any)._audioGraphAttached) return;

                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioContext();

                const source = audioCtx.createMediaElementSource(audioRef.current);
                const analyserNode = audioCtx.createAnalyser();
                analyserNode.fftSize = 256;

                // Create EQ Filters
                const frequencies = [60, 230, 910, 4000, 14000];
                const filters = frequencies.map((freq, i) => {
                    const filter = audioCtx.createBiquadFilter();
                    filter.type = i === 0 ? 'lowshelf' : i === frequencies.length - 1 ? 'highshelf' : 'peaking';
                    filter.frequency.value = freq;
                    filter.gain.value = eqBands[i];
                    return filter;
                });

                filtersRef.current = filters;

                // Chain: Source -> Filter0 -> Filter1 ... -> Analyser -> Destination
                let currentNode: AudioNode = source;
                filters.forEach(filter => {
                    currentNode.connect(filter);
                    currentNode = filter;
                });

                currentNode.connect(analyserNode);
                analyserNode.connect(audioCtx.destination);

                setAnalyser(analyserNode);
                (audioRef.current as any)._audioGraphAttached = true;

                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
            } catch (error) {
                console.error("Failed to init Audio Graph:", error);
                // Don't crash app
            }
        }
    }, [isPlaying]); // Removed 'analyser' dependency to prevent loop, relies on _audioGraphAttached check

    // Time Update & Progress
    useEffect(() => {
        if (!isPlaying || !audioRef.current) return;

        const interval = setInterval(() => {
            if (audioRef.current) {
                const current = audioRef.current.currentTime;
                setCurrentTime(current);

                // Taskbar Progress (Only for non-radio/finite duration)
                // Radio streams might return Infinity or very large numbers for duration, so we check carefully.
                if (window.electron?.setProgressBar && duration > 0 && duration !== Infinity) {
                    window.electron.setProgressBar(current / duration);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, duration]);

    // Reset progress on end/pause check
    useEffect(() => {
        if (!isPlaying && window.electron?.setProgressBar) {
            // -1 removes the progress bar
            window.electron.setProgressBar(-1);
        }
    }, [isPlaying]);

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


    useEffect(() => { safeSetItem('favorites', JSON.stringify(favorites)); }, [favorites]);
    useEffect(() => { safeSetItem('playlists', JSON.stringify(playlists)); }, [playlists]);
    useEffect(() => { safeSetItem('playlist_folders', JSON.stringify(folders)); }, [folders]);
    useEffect(() => {
        // Limit history to 100 items on disk
        const limitedHistory = playbackHistory.slice(0, 100);
        safeSetItem('playback_history', JSON.stringify(limitedHistory));
    }, [playbackHistory]);

    // Update history when song changes
    useEffect(() => {
        if (currentSong) {
            setPlaybackHistory(prev => {
                // Remove existing entry of this song to move it to top
                const filtered = prev.filter(s => s.id !== currentSong.id);
                // Add to front, limit to 100
                const newHistory = [currentSong, ...filtered];
                return newHistory.slice(0, 100);
            });
        }
    }, [currentSong]);

    // Fetch related songs and filter out recently played
    useEffect(() => {
        if (currentSong) {
            getRelatedVideos(currentSong.id, currentSong.artist).then((songs) => {
                let filtered = songs.filter(s => s.id !== currentSong.id);

                // Avoid looping back to recent history (last 50 songs)
                const historyIds = new Set(playbackHistory.slice(0, 50).map(s => s.id));
                filtered = filtered.filter(s => !historyIds.has(s.id));

                setRelatedSongs(filtered);
            });
        }
    }, [currentSong]); // playbackHistory is stable enough here or we accept minor staleness to avoid double fetch

    // Player Actions
    const playSong = (song: Song) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            if (currentSong) {
                setHistory(prev => {
                    const newHistory = [...prev, currentSong];
                    return newHistory.slice(-100); // Keep last 100
                });
            }
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
        // Only fetch for YouTube videos (length 11) - Skip for Radio/Podcasts/Local
        const isYouTubeId = currentSong?.id && currentSong.id.length === 11 && !currentSong.isLocal && !currentSong.isRadio;

        if (isYouTubeId) {
            setSkipSegments([]); // Reset
            getSkipSegments(currentSong.id).then(setSkipSegments);
        } else {
            setSkipSegments([]);
        }
    }, [currentSong?.id, currentSong?.isLocal, currentSong?.isRadio]);

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

    const updatePlaylist = (id: string, data: Partial<Playlist>) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, ...data };
            }
            return p;
        }));
    };

    const reorderPlaylist = (id: string, newSongs: Song[]) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, songs: newSongs };
            }
            return p;
        }));
    };

    // Sleep Timer
    const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null);

    const setSleepTimer = (minutes: number) => {
        if (minutes === 0) {
            setSleepTimerEnd(null);
            return;
        }
        setSleepTimerEnd(Date.now() + minutes * 60 * 1000);
    };

    useEffect(() => {
        if (!sleepTimerEnd) return;

        const interval = setInterval(() => {
            if (Date.now() >= sleepTimerEnd) {
                setIsPlaying(false);
                setSleepTimerEnd(null);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [sleepTimerEnd]);

    // Mini Player / PiP Logic
    const togglePiP = async () => {
        if (window.electron?.toggleMiniPlayer) {
            window.electron.toggleMiniPlayer();
        } else {
            console.warn("Mini Player not supported in this environment");
        }
    };

    // Sync state: Send update whenever state changes
    useEffect(() => {
        if (window.electron?.updateMiniPlayer) {
            window.electron.updateMiniPlayer({
                isPlaying,
                currentTime,
                duration: duration === Infinity ? 0 : duration,
                themeColor: color,
                themeMode: mode,
                currentSong: currentSong ? {
                    title: currentSong.title,
                    artist: currentSong.artist,
                    thumbnail: currentSong.thumbnail
                } : null
            });
        }
    }, [isPlaying, currentSong, currentTime, duration, color, mode]);

    // Init Listener: Handle request for state (use ref to access current state without re-binding)
    const stateRef = useRef({ isPlaying, currentSong, currentTime, duration, mode, color });
    useEffect(() => {
        stateRef.current = { isPlaying, currentSong, currentTime, duration, mode, color };
    }, [isPlaying, currentSong, currentTime, duration, mode, color]);

    useEffect(() => {
        if (window.electron?.onGetPlayerState) {
            window.electron.onGetPlayerState(() => {
                const { isPlaying, currentSong: song, currentTime, duration, mode: themeMode, color: themeColor } = stateRef.current;

                window.electron?.updateMiniPlayer({
                    isPlaying,
                    currentTime,
                    duration,
                    themeColor,
                    themeMode,
                    currentSong: song ? {
                        title: song.title,
                        artist: song.artist,
                        thumbnail: song.thumbnail
                    } : null
                });
            });
        }
    }, []);

    // Global Media Shortcuts & Mini Player Actions
    const textRef = useRef({ togglePlay, playNext, playPrevious });
    useEffect(() => {
        textRef.current = { togglePlay, playNext, playPrevious };
    }, [togglePlay, playNext, playPrevious]);

    useEffect(() => {
        if (!window.electron) return;

        const handleAction = (action: string) => {
            if (action === 'play-pause') textRef.current.togglePlay();
            if (action === 'next') textRef.current.playNext();
            if (action === 'prev') textRef.current.playPrevious();
        };

        const handlePlayPause = () => textRef.current.togglePlay();
        const handleNext = () => textRef.current.playNext();
        const handlePrevious = () => textRef.current.playPrevious();

        window.electron.onMediaAction(handleAction);
        window.electron.onMediaPlayPause(handlePlayPause);
        window.electron.onMediaNext(handleNext);
        window.electron.onMediaPrevious(handlePrevious);

        return () => {
            // We need to implement remove listener in preload if we want cleanup, 
            // but for now relying on app lifecycle is okay.
            if (window.electron?.removeMediaListeners) {
                window.electron.removeMediaListeners();
            }
        };
    }, []);

    // Discord Rich Presence
    useEffect(() => {
        if (!window.electron?.setDiscordActivity) return;

        if (!currentSong) {
            window.electron.setDiscordActivity({
                details: 'Idle',
                state: 'Waiting for music...',
            });
            return;
        }

        if (isPlaying) {
            window.electron.setDiscordActivity({
                details: currentSong.title,
                state: currentSong.artist || 'Unknown Artist',
                largeImageKey: 'icon', // Ensure this key exists in Discord App assets or remove if not set up
                largeImageText: 'Music App',
                smallImageKey: isPlaying ? 'play' : 'pause',
                smallImageText: isPlaying ? 'Playing' : 'Paused',
                instance: false,
            });
        } else {
            window.electron.setDiscordActivity({
                details: currentSong.title,
                state: 'Paused',
                largeImageKey: 'icon',
                largeImageText: 'Music App',
                instance: false,
            });
        }
    }, [currentSong, isPlaying]);



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
            setVolume,
            analyser,
            sleepTimerEnd,
            setSleepTimer,
            togglePiP,
            eqBands,
            setEqBand,
            currentPreset,
            setPreset,
            updatePlaylist,
            reorderPlaylist
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
