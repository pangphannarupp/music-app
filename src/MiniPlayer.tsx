import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Play, Pause, SkipForward, SkipBack, X } from 'lucide-react';
import './index.css';

// Minimal Type Definition for IPC
interface Song {
    title: string;
    artist: string;
    thumbnail: string;
}

interface MiniPlayerState {
    isPlaying: boolean;
    currentSong: Song | null;
    currentTime: number;
    duration: number;
}

const MiniPlayer = () => {
    const [state, setState] = useState<MiniPlayerState>({
        isPlaying: false,
        currentSong: null,
        currentTime: 0,
        duration: 0,
    });

    useEffect(() => {
        if (window.electron?.onSyncMiniPlayer) {
            window.electron.onSyncMiniPlayer((data: MiniPlayerState) => {
                setState(data);
            });
            // Request initial state
            window.electron.initMiniPlayer?.();
        }
    }, []);

    const { currentSong, isPlaying, currentTime, duration } = state;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handlePlayPause = () => window.electron?.sendMiniPlayerAction('play-pause');
    const handleNext = () => window.electron?.sendMiniPlayerAction('next');
    const handlePrev = () => window.electron?.sendMiniPlayerAction('prev');
    const handleClose = () => window.electron?.toggleMiniPlayer();

    if (!currentSong) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-500 text-sm">
                No Music Playing
            </div>
        );
    }

    return (
        <div className="flex items-center h-screen bg-zinc-950 px-3 pr-2 gap-3 relative group overflow-hidden">
            {/* Playing Animation on Thumbnail */}
            <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden shadow-lg group">
                <img src={currentSong.thumbnail} alt="Art" className={`w-full h-full object-cover transition duration-700 ${isPlaying ? 'scale-110' : 'scale-100'}`} />

                {isPlaying && (
                    <div className="absolute inset-0 bg-black/20 flex items-end justify-center gap-1 pb-2">
                        <div className="w-1.5 bg-purple-500 h-4 animate-music-bar" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 bg-purple-500 h-6 animate-music-bar" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 bg-purple-500 h-3 animate-music-bar" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <div className="flex flex-col">
                    <h4 className="text-white font-bold text-sm truncate leading-tight">{currentSong.title}</h4>
                    <p className="text-zinc-400 text-xs truncate">{currentSong.artist}</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                    <div
                        className="h-full bg-purple-500 transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center justify-between mt-1">
                    {/* Controls (Always Visible) */}
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrev} className="text-zinc-400 hover:text-white transition">
                            <SkipBack className="w-4 h-4 fill-current" />
                        </button>
                        <button onClick={handlePlayPause} className="text-white hover:scale-110 transition">
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        </button>
                        <button onClick={handleNext} className="text-zinc-400 hover:text-white transition">
                            <SkipForward className="w-4 h-4 fill-current" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Hover Close Button */}
            <button
                onClick={handleClose}
                className="absolute top-1 right-1 p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MiniPlayer />
    </React.StrictMode>
);
