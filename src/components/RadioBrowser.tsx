import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio as RadioIcon, Search, ChevronRight, Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { RadioService, type RadioStation } from '../api/radio';
import { useLanguage } from '../context/LanguageContext';

export const RadioBrowser: React.FC = () => {
    const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
    const { t } = useLanguage();

    const [view, setView] = useState<'top' | 'countries' | 'search'>('top');
    const [stations, setStations] = useState<RadioStation[]>([]);
    const [loading, setLoading] = useState(false);

    // Country browser state
    const [countries, setCountries] = useState<{ name: string; iso_3166_1: string; stationcount: number }[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        loadTopStations();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (debouncedQuery.trim().length > 2) {
            setView('search');
            handleSearch(debouncedQuery);
        }
    }, [debouncedQuery]);

    const loadTopStations = async () => {
        setLoading(true);
        setView('top');
        setSelectedCountry(null);
        try {
            const data = await RadioService.getTopStations(50);
            setStations(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCountries = async () => {
        setLoading(true);
        setView('countries');
        try {
            const data = await RadioService.getCountries();
            setCountries(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCountryStations = async (code: string) => {
        setLoading(true);
        setSelectedCountry(code);
        try {
            const data = await RadioService.getStationsByCountry(code);
            setStations(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setLoading(true);
        try {
            const data = await RadioService.searchStations(query);
            setStations(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = (station: RadioStation) => {
        if (currentSong?.id === station.stationuuid) {
            togglePlay();
        } else {
            playSong(RadioService.toSong(station));
        }
    };

    return (
        <div className="flex-1 bg-white/50 dark:bg-black/50 px-2 pt-4 pb-20">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-500 rounded-lg">
                        <RadioIcon className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t.radio}</h1>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400">
                    {t.radioSubtitle}
                </p>
            </header>

            {/* Navigation & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex gap-2">
                    <button
                        onClick={loadTopStations}
                        className={`px-4 py-2 rounded-lg font-medium transition ${view === 'top'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
                    >
                        {t.top50}
                    </button>
                    <button
                        onClick={loadCountries}
                        className={`px-4 py-2 rounded-lg font-medium transition ${view === 'countries'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
                    >
                        {t.countries}
                    </button>
                </div>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder={t.searchStations}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-white/5 border-none rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-primary outline-none transition"
                    />
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : view === 'countries' && !selectedCountry ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {countries.map((country) => (
                        <motion.button
                            key={country.iso_3166_1}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => loadCountryStations(country.iso_3166_1)}
                            className="p-4 bg-white dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 hover:border-primary/50 text-left group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl">{getFlagEmoji(country.iso_3166_1)}</span>
                                <span className="text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-white/10 px-2 py-1 rounded-full">
                                    {country.stationcount}
                                </span>
                            </div>
                            <h3 className="font-semibold text-zinc-900 dark:text-white truncate group-hover:text-primary transition">
                                {country.name}
                            </h3>
                        </motion.button>
                    ))}
                </div>
            ) : (
                <>
                    {view === 'countries' && selectedCountry && (
                        <button
                            onClick={() => setSelectedCountry(null)}
                            className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-primary transition"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" /> {t.backToCountries}
                        </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {stations.map((station) => (
                            <motion.div
                                key={station.stationuuid}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-3 bg-white dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 hover:border-primary/50 group flex items-center gap-4 transition-all ${currentSong?.id === station.stationuuid ? 'ring-2 ring-primary border-transparent bg-primary/5' : ''
                                    }`}
                            >
                                <div className="relative w-12 h-12 flex-shrink-0">
                                    <img
                                        src={station.favicon || 'https://cdn-icons-png.flaticon.com/512/305/305108.png'}
                                        alt={station.name}
                                        className="w-full h-full rounded-full object-cover bg-zinc-100 dark:bg-white/10"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/305/305108.png';
                                        }}
                                    />
                                    <button
                                        onClick={() => handlePlay(station)}
                                        className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-opacity ${currentSong?.id === station.stationuuid && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                            }`}
                                    >
                                        {currentSong?.id === station.stationuuid && isPlaying ? (
                                            <div className="w-3 h-3 bg-white rounded-sm" /> // Pause icon placeholder
                                        ) : (
                                            <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                                        )}
                                    </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-semibold truncate pr-2 ${currentSong?.id === station.stationuuid ? 'text-primary' : 'text-zinc-900 dark:text-white'
                                        }`}>
                                        {station.name}
                                    </h4>
                                    <p className="text-xs text-zinc-500 truncate flex items-center gap-1">
                                        {station.countrycode && <span>{getFlagEmoji(station.countrycode)}</span>}
                                        {station.tags ? station.tags.split(',')[0] : 'Radio'}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                        {stations.length === 0 && !loading && (
                            <div className="col-span-full text-center py-20 text-zinc-500">
                                {t.noStations}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// Helper to convert ISO code to Flag Emoji
function getFlagEmoji(countryCode: string) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
