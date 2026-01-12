import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronDown, ListMusic, Heart, PlusCircle, Download } from 'lucide-react';
import { PlaylistModal } from './PlaylistModal';
import { motion, type PanInfo } from 'framer-motion';
import { PlayingAnimation } from './PlayingAnimation';
import { useLanguage } from '../context/LanguageContext';
import { Toast } from './Toast';

export const FullScreenPlayer: React.FC = () => {
    const { t } = useLanguage();
    const {
        currentSong,
        isPlaying,
        togglePlay,
        playNext,
        playPrevious,
        hasNext,
        hasPrevious,
        isFullScreen,
        toggleFullScreen,
        playSong,
        relatedSongs,
        favorites,
        toggleFavorite,
        currentTime,
        duration,
        seek,
        volume,
        setVolume
    } = usePlayer();

    const isFavorite = favorites.some(s => s.id === currentSong?.id);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({
        isVisible: false,
        message: '',
        type: 'success'
    });
    const [downloadProgress, setDownloadProgress] = useState('0%');

    // Drag handling
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const handleDragEnd = (_: any, info: PanInfo) => {
        // Dismiss if dragged down more than 150px or invalid velocity
        if (info.offset.y > 150 || info.velocity.y > 500) {
            if (isFullScreen) toggleFullScreen();
        }
    };

    // Format helper
    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const date = new Date(seconds * 1000);
        const mm = date.getUTCMinutes();
        const ss = date.getUTCSeconds().toString().padStart(2, '0');
        return `${mm}:${ss}`;
    };

    // Listen for download progress from Electron
    React.useEffect(() => {
        if (window.electron && window.electron.onDownloadProgress) {
            window.electron.onDownloadProgress((data) => {
                setDownloadProgress(data.progress);
            });

            return () => {
                if (window.electron?.removeDownloadProgressListener) {
                    window.electron?.removeDownloadProgressListener();
                }
            };
        }
    }, []);

    // Download handler
    const handleDownload = async () => {
        if (!currentSong || isDownloading) return;

        setIsDownloading(true);
        setDownloadProgress('0%'); // Reset progress
        try {
            const filename = `${currentSong.artist} - ${currentSong.title}.mp3`;

            // Check if running in Electron
            if (window.electron) {
                // Electron version - use Python yt-dlp for reliable downloads
                const result = await window.electron.downloadFile(
                    currentSong.id,
                    filename,
                    currentSong.artist,
                    currentSong.title
                );

                if (result.canceled) {
                    console.log('Download canceled by user');
                } else if (result.success) {
                    setToast({ isVisible: true, message: t.downloadSuccess, type: 'success' });
                    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
                } else {
                    throw new Error(result.error || 'Download failed');
                }
            } else {
                // Get audio URL - use existing one or fetch it
                let audioUrl = currentSong.audioUrl;
                if (!audioUrl) {
                    // Dynamically import getStreamUrl to avoid circular dependency
                    const { getStreamUrl } = await import('../api/youtube');
                    audioUrl = await getStreamUrl(currentSong.id);

                    if (!audioUrl) {
                        throw new Error('Could not get audio URL');
                    }
                }

                // Browser version - use blob download
                const response = await fetch(audioUrl);
                if (!response.ok) throw new Error('Download failed');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                setToast({ isVisible: true, message: t.downloadSuccess, type: 'success' });
                setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
            }
        } catch (error) {
            console.error('Download error:', error);
            setToast({
                isVisible: true,
                message: t.downloadError + ': ' + (error instanceof Error ? error.message : 'Unknown error'),
                type: 'error'
            });
            setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 5000);
        } finally {
            setIsDownloading(false);
        }
    };


    // Derived state
    const isLoadingRelated = relatedSongs.length === 0;

    if (!currentSong) return null;

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isFullScreen ? 0 : '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }} // Snap back if not dismissed
            dragElastic={{ top: 0, bottom: 0.2 }} // Rubber band effect only on bottom
            onDragEnd={handleDragEnd}
            className="fixed inset-0 z-[100] bg-white/95 dark:bg-black/95 backdrop-blur-3xl flex flex-col"
        >
            {/* Header - High Z-index for interactivity */}
            <div className="flex items-center justify-between px-6 py-8 md:py-12 z-10 shrink-0">
                <button
                    onClick={toggleFullScreen}
                    className="p-2 text-zinc-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
                >
                    <ChevronDown className="w-8 h-8" />
                </button>
                <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-xs font-bold">{t.nowPlaying}</span>
                <div className="w-12" /> {/* Spacer */}
            </div>

            {/* Main Content - No Scroll, Flex Layout to fit screen */}
            <div className="flex-1 w-full flex flex-col items-center justify-between pb-8 px-8 min-h-0 overflow-hidden">

                {/* Artwork - Flexible Height */}
                <div className="flex-1 w-full flex items-center justify-center min-h-0 py-4">
                    <div className="h-full aspect-square max-h-[40vh] md:max-h-[50vh] rounded-2xl overflow-hidden shadow-2xl relative group bg-zinc-800/20">
                        {currentSong.thumbnail ? (
                            <img
                                src={currentSong.thumbnail}
                                alt={currentSong.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-800/50 flex items-center justify-center border border-white/5">
                                <Music className="w-1/3 h-1/3 text-zinc-500" />
                            </div>
                        )}
                        {/* Play/Pause Overlay */}
                        <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-lg">
                            <PlayingAnimation isPlaying={isPlaying} color="bg-white" />
                        </div>
                    </div>
                </div>

                {/* Controls Container - Fixed Stack */}
                <div className="w-full max-w-lg flex flex-col items-center gap-6 shrink-0 z-10">

                    {/* Info */}
                    <div className="text-center w-full mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-2 truncate">{currentSong.title}</h2>
                        <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 truncate">{currentSong.artist}</p>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full group mx-auto">
                        <div className="relative h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-2">
                            <div
                                className="absolute top-0 left-0 h-full bg-primary rounded-full"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            />
                            <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                value={currentTime}
                                onChange={(e) => {
                                    seek(parseFloat(e.target.value));
                                }}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <div className="flex justify-between text-xs text-zinc-500 font-medium">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-8 w-full mx-auto">
                        <button
                            onClick={() => toggleFavorite(currentSong)}
                            className={`p-3 rounded-full bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition ${isFavorite ? 'text-red-500' : 'text-zinc-600 dark:text-zinc-400'}`}
                        >
                            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        <button
                            onClick={() => setIsPlaylistModalOpen(true)}
                            className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition text-zinc-600 dark:text-zinc-400"
                        >
                            <PlusCircle className="w-6 h-6" />
                        </button>

                        <button
                            onClick={handleDownload}
                            disabled={isDownloading || !currentSong}
                            className={`p-3 rounded-full transition bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${isDownloading || !currentSong
                                ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                                : 'text-zinc-600 dark:text-zinc-400'
                                }`}
                        >
                            {isDownloading ? (
                                <div className="relative w-6 h-6 flex items-center justify-center">
                                    <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" className="opacity-25" />
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="62.83" strokeDashoffset={62.83 * (1 - (parseFloat(downloadProgress) || 0) / 100)} className="transition-all duration-300 ease-out text-primary" strokeLinecap="round" />
                                    </svg>
                                    <Download className="absolute w-3 h-3 text-current opacity-50" />
                                </div>
                            ) : (
                                <Download className="w-6 h-6" />
                            )}
                        </button>

                        <button
                            onClick={() => setIsQueueOpen(true)}
                            className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition text-zinc-600 dark:text-zinc-400"
                        >
                            <ListMusic className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Main Controls */}
                    <div className="flex items-center justify-center gap-10">
                        <button
                            onClick={playPrevious}
                            disabled={!hasPrevious}
                            className={`text-primary hover:text-primary/80 transition ${!hasPrevious && 'opacity-30'}`}
                        >
                            <SkipBack className="w-8 h-8 md:w-10 md:h-10" />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-full flex items-center justify-center hover:scale-105 transition shadow-glow shadow-primary/20"
                        >
                            {isPlaying ? (
                                <Pause className="w-8 h-8 text-white fill-current" />
                            ) : (
                                <Play className="w-8 h-8 text-white fill-current ml-1" />
                            )}
                        </button>

                        <button
                            onClick={playNext}
                            disabled={!hasNext}
                            className={`text-primary hover:text-primary/80 transition ${!hasNext && 'opacity-30'}`}
                        >
                            <SkipForward className="w-8 h-8 md:w-10 md:h-10" />
                        </button>
                    </div>

                    {/* Volume Control */}
                    <div className="w-full max-w-sm px-4 flex items-center gap-4 mx-auto pb-4">
                        <button
                            onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                            className="text-zinc-500 dark:text-zinc-400 hover:text-primary transition"
                        >
                            {volume === 0 ? (
                                <VolumeX className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>
                        <div className="flex-1 relative h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full group cursor-pointer">
                            <div
                                className="absolute top-0 left-0 h-full bg-zinc-500 dark:bg-white rounded-full group-hover:bg-primary transition-colors"
                                style={{ width: `${volume * 100}%` }}
                            />
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* Up Next Bottom Sheet */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: isQueueOpen ? '0%' : '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) setIsQueueOpen(false);
                }}
                className="absolute inset-x-0 bottom-0 h-[60vh] bg-white dark:bg-zinc-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 flex flex-col border-t border-zinc-200 dark:border-white/5"
            >
                {/* Handle */}
                <div className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing" onClick={() => setIsQueueOpen(false)}>
                    <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                </div>

                <div className="px-6 py-2 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                        <ListMusic className="w-5 h-5 text-primary" />
                        Up Next
                    </h3>
                    <button
                        onClick={() => setIsQueueOpen(false)}
                        className="p-2 -mr-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {isLoadingRelated ? (
                        <div className="text-center text-zinc-500 py-10">Loading suggestions...</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {relatedSongs.map((song) => (
                                <div
                                    key={song.id}
                                    onClick={() => {
                                        playSong(song);
                                        // Optional: close queue on select, or keep open
                                        // setIsQueueOpen(false); 
                                    }}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition group"
                                >
                                    <div className="relative w-16 h-10 shrink-0 rounded overflow-hidden">
                                        {song.thumbnail ? (
                                            <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                                <Music className="w-6 h-6 text-zinc-500" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-zinc-900 dark:text-white font-medium truncate text-sm">{song.title}</h4>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate">{song.artist}</p>
                                    </div>
                                </div>
                            ))}
                            {relatedSongs.length === 0 && (
                                <div className="text-center text-zinc-600 py-10">No related tracks found</div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>


            {/* Background Gradient Mesh (Optional Visual Flare) */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px]" />
            </div>

            <PlaylistModal
                isOpen={isPlaylistModalOpen}
                onClose={() => setIsPlaylistModalOpen(false)}
                songToAdd={currentSong}
            />

            {/* Success Toast */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </motion.div >
    );
};
