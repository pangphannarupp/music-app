import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { ChevronDown, SkipBack, SkipForward, Play, Pause, ListMusic, Heart, PlusCircle, Volume2, VolumeX, Download } from 'lucide-react';
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

            {/* Main Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto w-full">
                <div className="flex flex-col items-center justify-start pt-4 px-8 pb-24 min-h-min">

                    {/* Album Art (Square with Soft Corners) */}
                    <div className={`w-64 h-64 md:w-full md:max-w-sm md:aspect-square mb-8 md:mb-12 transition-transform duration-700 ${isFullScreen ? 'scale-100' : 'scale-90'}`}>
                        <div className="w-full h-full rounded-2xl shadow-2xl overflow-hidden relative">
                            <img
                                src={currentSong.thumbnail}
                                alt={currentSong.title}
                                className="w-full h-full object-cover"
                            />
                            {/* Visualizer Overlay */}
                            <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-lg">
                                <PlayingAnimation isPlaying={isPlaying} color="bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="text-center mb-8 w-full max-w-lg">
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 truncate">{currentSong.title}</h2>
                        <p className="text-xl text-zinc-500 dark:text-zinc-400">{currentSong.artist}</p>
                    </div>

                    {/* Progress Track (Interactive) */}
                    <div className="w-full max-w-lg mb-8 group">
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
                    <div className="flex items-center gap-8 mb-10">
                        <button
                            onClick={() => toggleFavorite(currentSong)}
                            className={`p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition ${isFavorite ? 'text-primary' : 'text-zinc-900 dark:text-white'}`}
                        >
                            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            className="p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition text-zinc-900 dark:text-white"
                            onClick={() => setIsPlaylistModalOpen(true)}
                        >
                            <PlusCircle className="w-6 h-6" />
                        </button>

                        {/* Download Button */}
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading || !currentSong}
                            className={`p-3 rounded-full transition ${isDownloading || !currentSong
                                ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                                : 'text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10'
                                }`}
                            title={isDownloading ? t.downloading : t.download}
                        >
                            {isDownloading ? (
                                <div className="relative w-6 h-6 flex items-center justify-center">
                                    {/* Background circle */}
                                    <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            fill="none"
                                            className="opacity-25"
                                        />
                                        {/* Progress circle */}
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            fill="none"
                                            strokeDasharray="62.83"
                                            strokeDashoffset={62.83 * (1 - (parseFloat(downloadProgress) || 0) / 100)}
                                            className="transition-all duration-300 ease-out text-primary"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    {/* Download icon in center */}
                                    <Download className="absolute w-3 h-3 text-current opacity-50" />
                                </div>
                            ) : (
                                <Download className="w-6 h-6" />
                            )}
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-10">
                        <button
                            onClick={playPrevious}
                            disabled={!hasPrevious}
                            className={`text-primary hover:text-primary/80 transition ${!hasPrevious && 'opacity-30'}`}
                        >
                            <SkipBack className="w-10 h-10" />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="w-20 h-20 bg-primary rounded-full flex items-center justify-center hover:scale-105 transition shadow-glow shadow-primary/20"
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
                            <SkipForward className="w-10 h-10" />
                        </button>
                    </div>

                    {/* Volume Control */}
                    <div className="w-full max-w-sm mt-8 px-4 flex items-center gap-4">
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

                    {/* Related Videos List */}
                    <div className="w-full max-w-2xl mt-12 mb-10">
                        <div className="flex items-center gap-2 mb-6 text-zinc-400">
                            <ListMusic className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-wider">Up Next</span>
                        </div>

                        {isLoadingRelated ? (
                            <div className="text-center text-zinc-500 py-4">Loading suggestions...</div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {relatedSongs.map((song) => (
                                    <div
                                        key={song.id}
                                        onClick={() => playSong(song)}
                                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition group"
                                    >
                                        <div className="relative w-16 h-10 shrink-0 rounded overflow-hidden">
                                            <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-zinc-900 dark:text-white font-medium truncate text-sm">{song.title}</h4>
                                            <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate">{song.artist}</p>
                                        </div>
                                    </div>
                                ))}
                                {relatedSongs.length === 0 && (
                                    <div className="text-center text-zinc-600 py-4">No related tracks found</div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>

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
        </motion.div>
    );
};
