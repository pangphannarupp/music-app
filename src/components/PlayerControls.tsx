import React, { useRef, useState, useEffect } from 'react';
import YouTube, { type YouTubeEvent, type YouTubePlayer } from 'react-youtube';
import { PlayingAnimation } from './PlayingAnimation';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart } from 'lucide-react';
import { getStreamUrl } from '../api/youtube';

export const PlayerControls: React.FC = () => {
    const {
        currentSong,
        isPlaying,
        togglePlay,
        playNext,
        playPrevious,
        hasNext,
        hasPrevious,
        toggleFullScreen,
        favorites,
        toggleFavorite,
        setCurrentTime,
        setDuration: setGlobalDuration,
        seekRequest,
        setSeekRequest,
        volume,
        setVolume
    } = usePlayer();

    // Environment Check
    const isDesktop = !!window.electron;

    // References
    const audioRef = useRef<HTMLAudioElement>(null);
    const [ytPlayer, setYtPlayer] = useState<YouTubePlayer | null>(null);

    // Local State
    const [played, setPlayed] = useState(0);
    const [muted, setMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);

    // Stream URL state (Desktop Only)
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [isLoadingStream, setIsLoadingStream] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFavorite = favorites.some(s => s.id === currentSong?.id);

    // --- EFFECT: Load Audio Source ---
    useEffect(() => {
        if (!currentSong) return;

        let isMounted = true;
        setPlayed(0);
        setDuration(0);
        setGlobalDuration(0);
        setStreamUrl(null);
        setError(null);

        // 1. DESKTOP: Fetch Stream URL
        if (isDesktop) {
            setIsLoadingStream(true);
            if (currentSong.audioUrl) {
                // Local file or pre-set URL
                setStreamUrl(currentSong.audioUrl);
                setIsLoadingStream(false);
            } else {
                // Fetch via yt-dlp
                const fetchStream = async () => {
                    try {
                        const url = await getStreamUrl(currentSong.id);
                        if (isMounted) {
                            if (url) {
                                console.log('Desktop: Stream fetched:', url);
                                setStreamUrl(url);
                            } else {
                                console.error('Desktop: Failed to fetch stream');
                                setError('Stream not available locally.');
                            }
                        }
                    } catch (err) {
                        if (isMounted) {
                            console.error('Desktop Error:', err);
                            setError('Error fetching stream.');
                        }
                    } finally {
                        if (isMounted) setIsLoadingStream(false);
                    }
                };
                fetchStream();
            }
        }
        // 2. WEB: YouTube Embed handles loading internally via videoId
        else {
            setIsLoadingStream(true); // Will be cleared when player is ready/starts
            // Verify if player is ready, otherwise it will load automatically
        }

        return () => { isMounted = false; };
    }, [currentSong, isDesktop]); // Removed setGlobalDuration from dependency to avoid loop

    // --- EFFECT: Handle Play/Pause ---
    useEffect(() => {
        // Desktop Audio
        if (isDesktop && audioRef.current && streamUrl) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio Play Err:", e));
            } else {
                audioRef.current.pause();
            }
        }
        // Web YouTube
        else if (!isDesktop && ytPlayer) {
            if (isPlaying) {
                ytPlayer.playVideo();
            } else {
                ytPlayer.pauseVideo();
            }
        }
    }, [isPlaying, streamUrl, ytPlayer, isDesktop]);

    // --- EFFECT: Handle Volume ---
    useEffect(() => {
        // Desktop
        if (isDesktop && audioRef.current) {
            audioRef.current.volume = muted ? 0 : volume;
            audioRef.current.muted = muted;
        }
        // Web
        else if (!isDesktop && ytPlayer) {
            if (muted) {
                ytPlayer.mute();
            } else {
                ytPlayer.unMute();
                ytPlayer.setVolume(volume * 100);
            }
        }
    }, [volume, muted, isDesktop, ytPlayer]);

    // --- EFFECT: Handle Seek Request ---
    useEffect(() => {
        if (seekRequest !== null) {
            // Desktop
            if (isDesktop && audioRef.current && duration > 0) {
                audioRef.current.currentTime = seekRequest;
            }
            // Web
            else if (!isDesktop && ytPlayer && duration > 0) {
                ytPlayer.seekTo(seekRequest, true);
            }
            setSeekRequest(null);
        }
    }, [seekRequest, duration, isDesktop, ytPlayer, setSeekRequest]);

    // --- HANDLERS: Desktop Audio ---
    const handleAudioTimeUpdate = () => {
        if (!audioRef.current || isSeeking) return;
        const curr = audioRef.current.currentTime;
        const dur = audioRef.current.duration;
        if (!isNaN(dur) && dur > 0) {
            setDuration(dur);
            setGlobalDuration(dur);
            setPlayed(curr / dur);
            setCurrentTime(curr);
        }
    };

    const handleAudioEnded = () => playNext();

    const handleAudioError = (e: any) => {
        console.error("Audio Error:", e);
        setError('Playback error.');
    };

    // --- HANDLERS: Web YouTube ---
    const onPlayerReady = (event: YouTubeEvent) => {
        console.log("Web: Player Ready");
        setYtPlayer(event.target);
        setDuration(event.target.getDuration());
        setGlobalDuration(event.target.getDuration());
        setIsLoadingStream(false);
        // Sync Volume
        event.target.setVolume(volume * 100);
        if (muted) event.target.mute();
        // Auto-play if state says so
        if (isPlaying) event.target.playVideo();
    };

    const onPlayerStateChange = (event: YouTubeEvent) => {
        // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
        const state = event.data;
        if (state === 0) { // Ended
            playNext();
        }
        if (state === 1) { // Playing
            setIsLoadingStream(false);
            if (!isPlaying) togglePlay(); // Sync state if triggered externally
        }
        if (state === 2) { // Paused
            if (isPlaying) togglePlay();
        }
    };

    // Poll for progress (YouTube API doesn't have onTimeUpdate)
    useEffect(() => {
        if (isDesktop || !ytPlayer || !isPlaying || isSeeking) return;

        const interval = setInterval(() => {
            const curr = ytPlayer.getCurrentTime();
            const dur = ytPlayer.getDuration();
            if (curr && dur) {
                setDuration(dur);
                setGlobalDuration(dur);
                setPlayed(curr / dur);
                setCurrentTime(curr);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isDesktop, ytPlayer, isPlaying, isSeeking, setGlobalDuration, setCurrentTime]);


    // --- UI HELPERS ---
    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSeeking(true);
        setPlayed(parseFloat(e.target.value));
    };

    const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
        setIsSeeking(false);
        const val = parseFloat(e.currentTarget.value) * duration;

        if (isDesktop && audioRef.current) {
            audioRef.current.currentTime = val;
        } else if (!isDesktop && ytPlayer) {
            ytPlayer.seekTo(val, true);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (val > 0) setMuted(false);
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const date = new Date(seconds * 1000);
        const hh = date.getUTCHours();
        const mm = date.getUTCMinutes();
        const ss = date.getUTCSeconds().toString().padStart(2, '0');
        if (hh) return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
        return `${mm}:${ss}`;
    };

    if (!currentSong) return null;

    return (
        <div
            onClick={toggleFullScreen}
            className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 px-4 md:px-6 py-2 md:py-3 flex flex-col md:flex-row items-center justify-between h-[5.5rem] md:h-24 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/100 transition relative"
        >
            {/* --- ENGINES --- */}

            {/* 1. Desktop: Native Audio */}
            {isDesktop ? (
                <audio
                    ref={audioRef}
                    src={streamUrl || undefined}
                    preload="auto"
                    onTimeUpdate={handleAudioTimeUpdate}
                    onLoadedMetadata={() => setIsLoadingStream(false)}
                    onEnded={handleAudioEnded}
                    onError={handleAudioError}
                    crossOrigin="anonymous"
                />
            ) : (
                /* 2. Web: YouTube Embed (Hidden) */
                <div className="hidden">
                    <YouTube
                        videoId={currentSong.id}
                        opts={{
                            height: '0',
                            width: '0',
                            playerVars: {
                                autoplay: isPlaying ? 1 : 0,
                                controls: 0,
                            },
                        }}
                        onReady={onPlayerReady}
                        onStateChange={onPlayerStateChange}
                    />
                </div>
            )}

            {/* --- UI Controls (Shared) --- */}

            {/* Mobile Progress Bar (Absolute Top) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 md:hidden" onClick={(e) => e.stopPropagation()}>
                <div
                    className="h-full bg-primary relative"
                    style={{ width: `${played * 100}%` }}
                >
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step="any"
                        value={played}
                        onChange={handleSeekChange}
                        onMouseUp={handleSeekMouseUp}
                        onTouchEnd={handleSeekMouseUp as any}
                        className="absolute inset-y-0 -top-2 -bottom-2 w-full opacity-0 cursor-pointer"
                    />
                </div>
            </div>

            {/* Main Content Container */}
            <div className="flex items-center justify-between w-full h-full">
                {/* Song Info */}
                <div className="flex items-center gap-3 w-full md:w-1/4 overflow-hidden pr-2">
                    <img
                        src={currentSong.thumbnail}
                        alt={currentSong.title}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-md object-cover shadow-lg shrink-0"
                    />
                    <div
                        onClick={toggleFullScreen}
                        className="flex-1 flex flex-col justify-center mx-4 min-w-0 cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm truncate text-zinc-900 dark:text-white">
                                {currentSong.title}
                            </h4>
                            <PlayingAnimation isPlaying={isPlaying && !isLoadingStream} />
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {currentSong.artist}
                        </p>
                        {/* Show Error only for Desktop or if Web fails catastrophically */}
                        {error && (
                            <p className="text-[10px] text-red-500 font-medium truncate animate-pulse">
                                {error}
                            </p>
                        )}
                        {/* Web Hint */}
                        {!isDesktop && isLoadingStream && (
                            <p className="text-[10px] text-zinc-400 animate-pulse">Loading YouTube Player...</p>
                        )}
                    </div>
                </div>

                {/* Controls (Desktop: Center, Mobile: Right) */}
                <div
                    className="flex md:flex-col items-center justify-end md:justify-center w-auto md:w-2/4 md:max-w-xl gap-4 md:gap-2 shrink-0 pl-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Buttons */}
                    <div className="flex items-center gap-3 md:gap-6">
                        <button
                            onClick={() => toggleFavorite(currentSong)}
                            className={`hidden md:block text-primary hover:text-primary transition ${isFavorite ? 'fill-current' : ''}`}
                        >
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        <button
                            onClick={playPrevious}
                            disabled={!hasPrevious}
                            className={`hidden md:block text-primary hover:text-primary/80 transition ${!hasPrevious && 'opacity-30 cursor-not-allowed'}`}
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(currentSong); }}
                            className={`md:hidden text-primary hover:text-primary transition ${isFavorite ? 'fill-current' : ''}`}
                        >
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        <button
                            onClick={togglePlay}
                            disabled={isLoadingStream}
                            className={`w-10 h-10 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center hover:scale-105 transition shadow-glow shrink-0 ${isLoadingStream ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            {isPlaying && !isLoadingStream ? (
                                <Pause className="w-5 h-5 text-white fill-current" />
                            ) : (
                                <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                            )}
                        </button>

                        <button
                            onClick={playNext}
                            disabled={!hasNext}
                            className={`text-primary hover:text-primary/80 transition ${!hasNext && 'opacity-30 cursor-not-allowed'}`}
                        >
                            <SkipForward className="w-6 h-6 md:w-5 md:h-5" />
                        </button>
                    </div>

                    {/* Desktop Progress Bar */}
                    <div className="hidden md:flex w-full items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        <span>{formatTime(played * duration)}</span>
                        <div className="flex-1 relative h-1 bg-zinc-300 dark:bg-zinc-600 rounded-lg group">
                            <div
                                className="absolute top-0 left-0 h-full bg-zinc-900 dark:bg-white rounded-lg"
                                style={{ width: `${played * 100}%` }}
                            />
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step="any"
                                value={played}
                                onChange={handleSeekChange}
                                onMouseUp={handleSeekMouseUp}
                                onTouchEnd={handleSeekMouseUp as any}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Volume (Desktop Only) */}
                <div
                    className="hidden md:flex items-center justify-end w-1/4 gap-3"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => setMuted(!muted)} className="text-zinc-500 dark:text-zinc-400 hover:text-primary">
                        {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <div className="w-24 relative h-1 bg-zinc-300 dark:bg-zinc-600 rounded-lg group">
                        <div
                            className="absolute top-0 left-0 h-full bg-zinc-900 dark:bg-white rounded-lg group-hover:bg-primary transition-colors"
                            style={{ width: `${muted ? 0 : volume * 100}%` }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step="0.01"
                            value={muted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
