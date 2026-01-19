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

    // Check if we should use native audio (Desktop OR Radio)
    const useNativeAudio = isDesktop || currentSong?.isRadio;

    // References
    const audioRef = useRef<HTMLAudioElement>(null);
    const ytPlayerRef = useRef<YouTubePlayer | null>(null);

    // Local State
    const [played, setPlayed] = useState(0);
    const [muted, setMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);

    // Stream URL state
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [urlSongId, setUrlSongId] = useState<string | null>(null);
    const [isLoadingStream, setIsLoadingStream] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFavorite = favorites.some(s => s.id === currentSong?.id);

    // Derived URL to prevent stale playback
    const activeStreamUrl = (urlSongId === currentSong?.id) ? streamUrl : null;

    // --- EFFECT: Load Audio Source ---
    useEffect(() => {
        if (!currentSong) return;

        // Cleanup function to ensure audio stops when unmounting or switching
        return () => {
            if (useNativeAudio && audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute('src'); // Explicitly clear src
            }
        };
    }, [useNativeAudio]); // Only re-run on environment change or unmount

    // Actual Data Loading Effect
    useEffect(() => {
        if (!currentSong) return;

        let isMounted = true;
        setPlayed(0);
        setDuration(0);
        setGlobalDuration(0);
        setStreamUrl(null);
        setUrlSongId(null); // Invalidate previous URL immediately
        setError(null);

        // 1. NATIVE AUDIO: Fetch Stream URL (Desktop or Radio)
        if (useNativeAudio) {
            setIsLoadingStream(true);

            // For Radio, audioUrl is directly available
            if (currentSong.isRadio && currentSong.audioUrl) {
                setStreamUrl(currentSong.audioUrl);
                setUrlSongId(currentSong.id);
                setIsLoadingStream(false);
            }
            // For Desktop Local/YouTube
            else if (currentSong.audioUrl) {
                // Local file or pre-set URL
                setStreamUrl(currentSong.audioUrl);
                setUrlSongId(currentSong.id);
                setIsLoadingStream(false);
            } else if (isDesktop) {
                // Fetch via yt-dlp if on desktop and no URL
                const fetchStream = async () => {
                    try {
                        const url = await getStreamUrl(currentSong.id);
                        if (isMounted) {
                            if (url) {
                                console.log('Desktop: Stream fetched:', url);
                                setStreamUrl(url);
                                setUrlSongId(currentSong.id);
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
            } else {
                // Should technically not happen if logic is correct
                setIsLoadingStream(false);
            }
        }
        // 2. WEB YOUTUBE: YouTube Embed handles loading internally via videoId
        else {
            setIsLoadingStream(true); // Will be cleared when player is ready/starts
            // Verify if player is ready, otherwise it will load automatically
        }

        return () => { isMounted = false; };
    }, [currentSong, useNativeAudio, isDesktop]); // Removed setGlobalDuration from dependency to avoid loop

    // --- EFFECT: Handle Play/Pause ---
    useEffect(() => {
        // Native Audio
        if (useNativeAudio && audioRef.current && activeStreamUrl) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio Play Err:", e));
            } else {
                audioRef.current.pause();
            }
        }
        // Web YouTube
        else if (!useNativeAudio && ytPlayerRef.current) {
            if (isPlaying) {
                ytPlayerRef.current.playVideo();
            } else {
                ytPlayerRef.current.pauseVideo();
            }
        }
    }, [isPlaying, activeStreamUrl, useNativeAudio]);

    // --- EFFECT: Handle Volume ---
    useEffect(() => {
        // Native Audio
        if (useNativeAudio && audioRef.current) {
            audioRef.current.volume = muted ? 0 : volume;
            audioRef.current.muted = muted;
        }
        // Web YouTube
        else if (!useNativeAudio && ytPlayerRef.current) {
            if (muted) {
                ytPlayerRef.current.mute();
            } else {
                ytPlayerRef.current.unMute();
                ytPlayerRef.current.setVolume(volume * 100);
            }
        }
    }, [volume, muted, useNativeAudio]);

    // --- EFFECT: Handle Seek Request ---
    useEffect(() => {
        if (seekRequest !== null) {
            // Native Audio
            if (useNativeAudio && audioRef.current) {
                // Check duration > 0 unless it's radio (infinite)
                if (duration > 0 || currentSong?.isRadio) {
                    audioRef.current.currentTime = seekRequest;
                }
            }
            // Web YouTube
            else if (!useNativeAudio && ytPlayerRef.current && duration > 0) {
                ytPlayerRef.current.seekTo(seekRequest, true);
            }
            setSeekRequest(null);
        }
    }, [seekRequest, duration, useNativeAudio, setSeekRequest, currentSong]);

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

        // Retry with Proxy for CORS errors (common in Web for Podcasts)
        if (currentSong?.audioUrl && !audioRef.current?.src.includes('api.allorigins.win')) {
            // Only retry if we aren't already using the proxy
            console.warn('Playback failed, retrying with CORS proxy...');
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(currentSong.audioUrl)}`;
            if (audioRef.current) {
                // We must update the SRC and play again
                audioRef.current.src = proxyUrl;
                audioRef.current.play().catch(err => console.error("Proxy Play Err:", err));
                return; // Prevent setting general error state yet
            }
        }

        setError('Playback error. Stream may be offline or blocked.');
    };

    // --- HANDLERS: Web YouTube ---
    const onPlayerReady = (event: YouTubeEvent) => {
        console.log("Web: Player Ready");
        ytPlayerRef.current = event.target;
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
    // Poll for progress (YouTube API doesn't have onTimeUpdate)
    useEffect(() => {
        if (useNativeAudio || !isPlaying || isSeeking) return;

        const interval = setInterval(() => {
            if (!ytPlayerRef.current) return;
            // Guard against calling methods on destroyed player
            try {
                // Check if internal player Object is valid
                if (typeof ytPlayerRef.current.getCurrentTime !== 'function') return;

                const curr = ytPlayerRef.current.getCurrentTime();
                const dur = ytPlayerRef.current.getDuration();
                if (curr && dur) {
                    setDuration(dur);
                    setGlobalDuration(dur);
                    setPlayed(curr / dur);
                    setCurrentTime(curr);
                }
            } catch (e) {
                console.warn("YouTube poll error:", e);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [useNativeAudio, isPlaying, isSeeking, setGlobalDuration, setCurrentTime]);


    // --- UI HELPERS ---
    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSeeking(true);
        setPlayed(parseFloat(e.target.value));
    };

    const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
        setIsSeeking(false);
        const val = parseFloat(e.currentTarget.value) * duration;

        if (useNativeAudio && audioRef.current) {
            audioRef.current.currentTime = val;
        } else if (!useNativeAudio && ytPlayerRef.current) {
            ytPlayerRef.current.seekTo(val, true);
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

    // Memoize player options to prevent re-renders/crashes
    const playerOpts: any = React.useMemo(() => ({
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 1, // Always autoplay, we control pause via API
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin
        },
    }), []);

    if (!currentSong) return null;

    return (
        <div
            onClick={toggleFullScreen}
            className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 px-4 md:px-6 py-2 md:py-3 flex flex-col md:flex-row items-center justify-between h-[5.5rem] md:h-24 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/100 transition relative"
        >
            {/* --- ENGINES --- */}

            {/* 1. Native Audio (Desktop OR Radio) */}
            {useNativeAudio ? (
                <audio
                    ref={audioRef}
                    src={activeStreamUrl || undefined}
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
                        opts={playerOpts}
                        onReady={onPlayerReady}
                        onStateChange={onPlayerStateChange}
                        onError={(e) => {
                            console.error("YouTube Player Error:", e);
                            // Only set error if it disrupts playback, usually 150/101
                            if (e.data === 150 || e.data === 101) {
                                playNext(); // Skip if RESTRICTED
                            }
                        }}
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
                    {currentSong.thumbnail ? (
                        <img
                            src={currentSong.thumbnail}
                            alt={currentSong.title}
                            className="w-12 h-12 md:w-14 md:h-14 rounded-md object-cover shadow-lg shrink-0"
                        />
                    ) : (
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                            <span className="text-xs text-zinc-500">MP3</span>
                        </div>
                    )}
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
                        {!useNativeAudio && isLoadingStream && (
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
