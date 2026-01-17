import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ArrowLeft, Play, Clock, Calendar } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { PodcastService } from '../api/podcast';
import type { Podcast, Episode } from '../types';

import { useLanguage } from '../context/LanguageContext';

export const PodcastBrowser: React.FC = () => {
    const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
    const { t } = useLanguage();

    const [view, setView] = useState<'list' | 'detail'>('list');
    const [podcasts, setPodcasts] = useState<Podcast[]>([]);
    const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTopPodcasts();
    }, []);

    const loadTopPodcasts = async (query = 'khmer podcast') => {
        setLoading(true);
        try {
            const data = await PodcastService.getTopPodcasts(query);
            setPodcasts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePodcastClick = async (podcast: Podcast) => {
        setSelectedPodcast(podcast);
        setView('detail');
        setLoading(true);
        try {
            // For YouTube, we just need the playlist ID (podcast.id)
            const eps = await PodcastService.getEpisodes(podcast.id);
            setEpisodes(eps);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayEpisode = (episode: Episode) => {
        if (currentSong?.id === episode.id) {
            togglePlay();
        } else {
            playSong({
                id: episode.id,
                title: episode.title,
                artist: selectedPodcast?.title || 'Podcast',
                thumbnail: selectedPodcast?.image || '',
                duration: episode.duration || '0:00',
                audioUrl: undefined, // Let PlayerContext/YouTube handle it
                isLocal: false,
                isRadio: false, // Use YouTube Player
            });
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'khmer' | 'international'>('khmer');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadTopPodcasts(searchQuery);
    };

    const handleTabChange = (tab: 'khmer' | 'international') => {
        setActiveTab(tab);
        if (tab === 'khmer') {
            loadTopPodcasts('khmer podcast');
        } else {
            loadTopPodcasts('popular podcasts');
        }
    };

    return (
        <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 px-2 pt-4 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                    <Mic className="w-8 h-8 text-primary" />
                    {t.podcasts}
                </h2>
                <div className="flex items-center gap-4 bg-zinc-200 dark:bg-zinc-800 p-1 rounded-full">
                    <button
                        onClick={() => handleTabChange('khmer')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === 'khmer' ? 'bg-primary text-white shadow-lg' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                    >
                        {t.khmer}
                    </button>
                    <button
                        onClick={() => handleTabChange('international')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === 'international' ? 'bg-primary text-white shadow-lg' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                    >
                        {t.international}
                    </button>
                </div>
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        placeholder={t.searchPodcasts}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 focus:border-primary focus:outline-none w-full md:w-64 placeholder-zinc-400 dark:placeholder-zinc-500"
                    />
                </form>
            </div>

            <AnimatePresence mode="wait">
                {view === 'list' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {loading && podcasts.length === 0 ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {podcasts.map((podcast) => (
                                    <div
                                        key={podcast.id}
                                        className="group cursor-pointer bg-white dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-4 rounded-xl transition duration-300 border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm"
                                        onClick={() => handlePodcastClick(podcast)}
                                    >
                                        <div className="aspect-square rounded-lg overflow-hidden mb-4 shadow-lg relative">
                                            <img
                                                src={podcast.image}
                                                alt={podcast.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                                loading="lazy"
                                            />
                                        </div>
                                        <h3 className="font-semibold text-zinc-900 dark:text-white truncate mb-1">{podcast.title}</h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{podcast.artist}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <button
                            onClick={() => setView('list')}
                            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6 transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            {t.backToPodcasts}
                        </button>

                        {selectedPodcast && (
                            <div className="space-y-8">
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <img
                                        src={selectedPodcast.image}
                                        alt={selectedPodcast.title}
                                        className="w-48 h-48 md:w-64 md:h-64 rounded-xl shadow-2xl"
                                    />
                                    <div className="flex-1">
                                        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">{selectedPodcast.title}</h1>
                                        <p className="text-xl text-zinc-700 dark:text-zinc-300 mb-4">{selectedPodcast.artist}</p>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {selectedPodcast.genres?.map(g => (
                                                <span key={g} className="px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">{g}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{t.episodes}</h3>
                                    {loading ? (
                                        <div className="flex justify-center py-20">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {episodes.map((episode) => (
                                                <div
                                                    key={episode.id}
                                                    className={`p-4 rounded-xl transition flex items-center gap-4 group ${currentSong?.id === episode.id
                                                        ? 'bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30'
                                                        : 'bg-zinc-100 dark:bg-zinc-800/30 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                                        }`}
                                                >
                                                    <button
                                                        onClick={() => handlePlayEpisode(episode)}
                                                        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shrink-0 hover:scale-105 transition"
                                                    >
                                                        {currentSong?.id === episode.id && isPlaying ? (
                                                            <div className="w-3 h-3 bg-white rounded-sm" /> // Pause icon
                                                        ) : (
                                                            <Play className="w-5 h-5 fill-current ml-0.5" />
                                                        )}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`font-semibold truncate mb-1 ${currentSong?.id === episode.id ? 'text-primary' : 'text-zinc-900 dark:text-white'
                                                            }`}>
                                                            {episode.title}
                                                        </h4>
                                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 md:line-clamp-1">
                                                            {episode.description}
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                                                            {episode.publishedAt && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(episode.publishedAt).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {episode.duration && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {episode.duration}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
