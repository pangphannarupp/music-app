import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export const PiPPlayer: React.FC = () => {
    const {
        currentSong,
        isPlaying,
        togglePlay,
        playNext,
        playPrevious,
        currentTime,
        duration,
        seek
    } = usePlayer();

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log('PiP Component Mounted');
    }, []);



    // Copy styles from main window to PiP window
    useEffect(() => {
        if (!containerRef.current) return;
        const pipDocument = containerRef.current.ownerDocument;
        const mainDocument = document; // Global document is main window

        if (pipDocument === mainDocument) return; // Should not happen in Portal

        const styleSheets = Array.from(mainDocument.styleSheets);
        styleSheets.forEach(styleSheet => {
            try {
                if (styleSheet.href) {
                    const link = pipDocument.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = styleSheet.href;
                    pipDocument.head.appendChild(link);
                } else if (styleSheet.cssRules) {
                    const style = pipDocument.createElement('style');
                    Array.from(styleSheet.cssRules).forEach(rule => {
                        style.appendChild(pipDocument.createTextNode(rule.cssText));
                    });
                    pipDocument.head.appendChild(style);
                }
            } catch (e) {
                console.warn('Could not copy stylesheet to PiP window', e);
            }
        });
    }, []);

    if (!currentSong) return null;

    return (
        <div ref={containerRef} className="flex flex-col h-screen w-screen bg-black/99 text-white items-center justify-center p-4">
            {/* Artwork */}
            <div className="w-full max-w-[200px] aspect-square rounded-xl overflow-hidden shadow-2xl mb-4 relative group">
                {currentSong.thumbnail ? (
                    <img src={currentSong.thumbnail} alt={currentSong.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-zinc-800" />
                )}
            </div>

            {/* Info */}
            <div className="text-center mb-6">
                <h3 className="font-bold text-lg truncate px-2">{currentSong.title}</h3>
                <p className="text-zinc-400 text-sm truncate px-2">{currentSong.artist}</p>
            </div>

            {/* Progress */}
            <div className="w-full h-1 bg-zinc-800 rounded-full mb-6 relative group">
                <div
                    className="absolute top-0 left-0 h-full bg-primary rounded-full"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
                <button onClick={playPrevious} className="text-zinc-400 hover:text-white transition">
                    <SkipBack className="w-8 h-8" />
                </button>
                <button
                    onClick={togglePlay}
                    className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition"
                >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
                <button onClick={playNext} className="text-zinc-400 hover:text-white transition">
                    <SkipForward className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};
