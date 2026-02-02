import React, { useState, useEffect, useRef } from 'react';
import { SearchBar } from './SearchBar';
import { SongList } from './SongList';
import { HorizontalArtistList } from './HorizontalArtistList';
import { HorizontalSongList } from './HorizontalSongList';
import { usePlayer } from '../context/PlayerContext';
import { searchVideos } from '../api/youtube';
import type { Song } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getSearchHistory } from '../utils/searchHistory';
import { getFavorites } from '../utils/favorites';

export const HomeView: React.FC = () => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [newSongs, setNewSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
    const [currentQuery, setCurrentQuery] = useState('');
    const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
    const { playSong, playbackHistory } = usePlayer();
    const { t, language } = useLanguage();
    const observerTarget = useRef<HTMLDivElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Initial search and New Songs
    useEffect(() => {
        const loadInitialContent = async () => {
            // Load New Songs (separate from main feed)
            if (newSongs.length === 0) {
                try {
                    const query = language === 'km' ? 'Khmer New Release Songs' : 'New Trending Music';
                    const { songs: newReleaseSongs } = await searchVideos(query);
                    setNewSongs(newReleaseSongs);
                } catch (e) {
                    console.warn('Failed to load new songs', e);
                }
            }

            if (songs.length > 0) return;

            const history = getSearchHistory();
            const favorites = getFavorites();

            // Smart Mix: Combine history and favorites
            if (history.length > 0 || favorites.length > 0) {
                setIsLoading(true);
                try {
                    // Prioritize history (top 3) + favorites (top 3)
                    const queries = [
                        ...history.slice(0, 3),
                        ...favorites.slice(0, 3)
                    ];

                    // Remove duplicates
                    const uniqueQueries = [...new Set(queries)];

                    const results = await Promise.all(
                        uniqueQueries.map(q => searchVideos(q))
                    );

                    // Interleave results
                    const mixedSongs: Song[] = [];
                    const maxSongsPerQuery = Math.max(...results.map(r => r.songs.length));
                    const seenIds = new Set<string>();

                    for (let i = 0; i < maxSongsPerQuery; i++) {
                        for (const result of results) {
                            if (result.songs[i]) {
                                const song = result.songs[i];
                                if (!seenIds.has(song.id)) {
                                    mixedSongs.push(song);
                                    seenIds.add(song.id);
                                }
                            }
                        }
                    }

                    setSongs(mixedSongs);

                    // Restore Lazy Loading using the first query
                    if (results.length > 0 && uniqueQueries.length > 0) {
                        setCurrentQuery(uniqueQueries[0]);
                        setNextPageToken(results[0].nextPageToken);
                    } else {
                        setNextPageToken(undefined);
                    }

                } catch (e) {
                    console.warn('Smart Mix failed, falling back', e);
                    handleSearch('khmer tiktok song');
                } finally {
                    setIsLoading(false);
                }
            } else {
                handleSearch('khmer tiktok song');
            }
        };

        loadInitialContent();
    }, [language]);

    const handleSearch = async (query: string) => {
        setIsLoading(true);
        setCurrentQuery(query);

        // Auto-scroll to results
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        const { songs: newSongs, nextPageToken: token } = await searchVideos(query);
        setSongs(newSongs);
        setNextPageToken(token);
        setIsLoading(false);
    };

    const handleArtistSelect = (artistQuery: string) => {
        if (selectedArtist === artistQuery) {
            // Deselect and reset to default
            setSelectedArtist(null);
            handleSearch('khmer tiktok song');
        } else {
            // Select and search
            setSelectedArtist(artistQuery);
            handleSearch(artistQuery);
        }
    };

    const handleLoadMore = async () => {
        if (!nextPageToken || !currentQuery) return;

        setIsLoading(true);
        const { songs: newSongs, nextPageToken: token } = await searchVideos(currentQuery, nextPageToken);
        setSongs(prev => [...prev, ...newSongs]);
        setNextPageToken(token);
        setIsLoading(false);
    };

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !isLoading && nextPageToken) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [isLoading, nextPageToken, currentQuery]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-0 pb-20">
            <div className="text-center mb-6 mt-2">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-600 mb-2 px-4 py-2 leading-relaxed">
                    {t.discoverTitle}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400">{t.discoverSubtitle}</p>
            </div>

            <SearchBar
                onSearch={(q) => { setSelectedArtist(null); handleSearch(q); }}
                isLoading={isLoading && songs.length === 0}
            />

            {/* Listen Again Section */}
            {playbackHistory.length > 0 && (
                <HorizontalSongList
                    title={t.listenAgain}
                    songs={playbackHistory.slice(0, 15)}
                    onPlay={playSong}
                />
            )}

            {/* New Songs Section */}
            {newSongs.length > 0 && (
                <HorizontalSongList
                    title={t.newSongs}
                    songs={newSongs}
                    onPlay={playSong}
                />
            )}

            <HorizontalArtistList onSelect={handleArtistSelect} selectedArtist={selectedArtist} />

            <div className="w-full mt-4 px-2" ref={resultsRef}>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6 pl-3 border-l-4 border-primary">
                    {isLoading && songs.length === 0 ? t.searching : t.results}
                </h3>
                <SongList songs={songs} onPlay={playSong} />

                {nextPageToken && (
                    <div ref={observerTarget} className="flex justify-center mt-8 py-4 w-full">
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                {t.loading}
                            </div>
                        ) : (
                            <div className="h-4 w-full" /> // Invisible trigger area
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
