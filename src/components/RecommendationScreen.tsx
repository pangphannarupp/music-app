import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Check } from 'lucide-react';
import { saveFavorites, setSetupCompleted, getFavorites } from '../utils/favorites';
import { useSetup } from '../context/SetupContext';

interface RecommendationScreenProps {
    onComplete: () => void;
}

const GENRES = [
    { id: 'khmer_songs', label: 'Khmer Songs', emoji: '🇰🇭' },
    { id: 'english_pop', label: 'English Pop', emoji: '🎤' },
    { id: 'k_pop', label: 'K-Pop', emoji: '🕺' },
    { id: 'rock', label: 'Rock', emoji: '🎸' },
    { id: 'jazz', label: 'Jazz', emoji: '🎷' },
    { id: 'classical', label: 'Classical', emoji: '🎻' },
    { id: 'lofi', label: 'Lofi & Chill', emoji: '☕' },
    { id: 'hip_hop', label: 'Hip Hop', emoji: '🎧' },
    { id: 'edm', label: 'EDM', emoji: '🎛️' },
    { id: 'acoustic', label: 'Acoustic', emoji: '🎸' },
    { id: 'rap', label: 'Rap', emoji: '🎤' },
    { id: 'r_and_b', label: 'R&B', emoji: '🎹' },
    { id: 'indie', label: 'Indie', emoji: '⛺' },
    { id: 'country', label: 'Country', emoji: '🤠' },
    { id: 'latin', label: 'Latin', emoji: '💃' },
    { id: 'metal', label: 'Metal', emoji: '🤘' },
    { id: 'soul', label: 'Soul', emoji: '👻' },
    { id: 'blues', label: 'Blues', emoji: '🎺' },
    { id: 'reggae', label: 'Reggae', emoji: '🇯🇲' },
    { id: 'punk', label: 'Punk', emoji: '🧷' },
    { id: 'folk', label: 'Folk', emoji: '🌾' },
    { id: 'disco', label: 'Disco', emoji: '🕺' },
    { id: 'techno', label: 'Techno', emoji: '🤖' },
    { id: 'house', label: 'House', emoji: '🏠' },
];

const ARTISTS = [
    { id: 'vann_da', label: 'VannDa', emoji: '🇰🇭' },
    { id: 'g_devith', label: 'G-Devith', emoji: '🇰🇭' },
    { id: 'suly_pheng', label: 'Suly Pheng', emoji: '🇰🇭' },
    { id: 'tena', label: 'Tena', emoji: '🇰🇭' },
    { id: 'manith', label: 'Manith', emoji: '🇰🇭' },
    { id: 'preap_sovath', label: 'Preap Sovath', emoji: '🇰🇭' },
    { id: 'aok_sokunkanha', label: 'Aok Sokunkanha', emoji: '🇰🇭' },
    { id: 'khemarak_sereymun', label: 'Khemarak Sereymun', emoji: '🇰🇭' },
    { id: 'chen', label: 'Chen', emoji: '🇰🇭' },
    { id: 'kmeng_khmer', label: 'Kmeng Khmer', emoji: '🇰🇭' },
    { id: 'taylor_swift', label: 'Taylor Swift', emoji: '👱‍♀️' },
    { id: 'the_weeknd', label: 'The Weeknd', emoji: '🌑' },
    { id: 'bts', label: 'BTS', emoji: '💜' },
    { id: 'blackpink', label: 'BLACKPINK', emoji: '🖤' },
    { id: 'justin_bieber', label: 'Justin Bieber', emoji: '🧢' },
    { id: 'ed_sheeran', label: 'Ed Sheeran', emoji: '🎸' },
    { id: 'ariana_grande', label: 'Ariana Grande', emoji: '🦄' },
    { id: 'bruno_mars', label: 'Bruno Mars', emoji: '🕺' },
    { id: 'drake', label: 'Drake', emoji: '🦉' },
    { id: 'eminem', label: 'Eminem', emoji: '🎤' },
    { id: 'coldplay', label: 'Coldplay', emoji: '🌈' },
    { id: 'maroon_5', label: 'Maroon 5', emoji: '🎸' },
    { id: 'imagine_dragons', label: 'Imagine Dragons', emoji: '🐉' },
    { id: 'dua_lipa', label: 'Dua Lipa', emoji: '💋' },
    { id: 'olivia_rodrigo', label: 'Olivia Rodrigo', emoji: '🦋' },
    { id: 'billie_eilish', label: 'Billie Eilish', emoji: '💚' },
    { id: 'post_malone', label: 'Post Malone', emoji: '🌻' },
    { id: 'exo', label: 'EXO', emoji: '🪐' },
    { id: 'twice', label: 'TWICE', emoji: '🍭' },
    { id: 'newjeans', label: 'NewJeans', emoji: '👖' },
    { id: 'adele', label: 'Adele', emoji: '🎤' },
    { id: 'beyonce', label: 'Beyoncé', emoji: '🐝' },
    { id: 'harry_styles', label: 'Harry Styles', emoji: '🍉' },
    { id: 'rihanna', label: 'Rihanna', emoji: '💎' },
    { id: 'kendrick_lamar', label: 'Kendrick Lamar', emoji: '🐐' },
    { id: 'lady_gaga', label: 'Lady Gaga', emoji: '👾' },
    { id: 'katy_perry', label: 'Katy Perry', emoji: '🎆' },
    { id: 'shawn_mendes', label: 'Shawn Mendes', emoji: '🎸' },
    { id: 'charlie_puth', label: 'Charlie Puth', emoji: '🎹' },
    { id: 'queen', label: 'Queen', emoji: '👑' },
];

import { ChevronRight, ChevronLeft } from 'lucide-react';

export const RecommendationScreen: React.FC<RecommendationScreenProps> = ({ onComplete }) => {
    const { t } = useLanguage();
    const { setupCompleted } = useSetup(); // Get setup context

    // If setup is already done (editing mode), skip welcome screen (start at step 1: Genres)
    const [step, setStep] = useState(setupCompleted ? 1 : 0);
    const [selectedItems, setSelectedItems] = useState<string[]>(() => {
        const saved = getFavorites();
        if (saved.length === 0) return [];

        // Map saved labels back to IDs
        const genreIds = GENRES.filter(g => saved.includes(g.label) || saved.includes(g.id)).map(g => g.id);
        const artistIds = ARTISTS.filter(a => saved.includes(a.label) || saved.includes(a.id)).map(a => a.id);
        return [...genreIds, ...artistIds];
    });

    const toggleItem = (id: string) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (step === 0 || (setupCompleted && step === 1)) {
            onComplete(); // Exit wizard
            return;
        }
        setStep(prev => prev - 1);
    };

    // ...

    // ...



    const handleFinish = () => {
        // Map internal IDs to search queries
        const queries = selectedItems.map(id => {
            const genre = GENRES.find(g => g.id === id);
            if (genre) return genre.label;

            const artist = ARTISTS.find(a => a.id === id);
            if (artist) return artist.label;

            return id;
        });

        // Save setup status FIRST to ensure it persists even if favorites run out of space
        setSetupCompleted(true);
        saveFavorites(queries);
        onComplete();
    };

    // ...

    const renderWelcome = () => (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Close button for Edit Mode */}
            {setupCompleted && (
                <button
                    onClick={onComplete}
                    className="absolute top-0 right-0 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                    ✕
                </button>
            )}

            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <SparklesIcon className="w-12 h-12 text-primary" />
            </div>
            <div className="text-center space-y-4 max-w-lg">
                <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    {t.welcomeToMusic || "Welcome to Music"}
                </h1>
                <p className="text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {t.selectFavorites || "Let's personalize your experience. Tell us what you love to listen to."}
                </p>
            </div>
            <button
                onClick={handleNext}
                className="group relative px-8 py-4 bg-primary text-white rounded-full font-bold text-lg shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
                {t.getStarted || "Get Started"}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );

    const renderGenres = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-5xl h-full flex flex-col">
            <div className="text-center mb-4 shrink-0">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Pick your vibes</h2>
                <p className="text-zinc-500 dark:text-zinc-400">Select genres you enjoy</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto p-2 scrollbar-hide flex-1">
                {GENRES.map((genre) => (
                    <button
                        key={genre.id}
                        onClick={() => toggleItem(genre.id)}
                        className={`
                        relative group flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200
                        ${selectedItems.includes(genre.id)
                                ? 'border-primary bg-primary/5 dark:bg-primary/10 scale-105 shadow-lg shadow-primary/10'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-primary/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }
                    `}
                    >
                        <span className="text-4xl mb-3 filter drop-shadow-sm transform group-hover:scale-110 transition-transform">{genre.emoji}</span>
                        <span className={`font-medium text-lg ${selectedItems.includes(genre.id) ? 'text-primary' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {genre.label}
                        </span>

                        {selectedItems.includes(genre.id) && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-sm animate-in zoom-in">
                                <Check className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderArtists = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-5xl h-full flex flex-col">
            <div className="text-center mb-4 shrink-0">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Favorite Artists</h2>
                <p className="text-zinc-500 dark:text-zinc-400">Select artists you love</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto p-2 scrollbar-hide flex-1">
                {ARTISTS.map((artist) => (
                    <button
                        key={artist.id}
                        onClick={() => toggleItem(artist.id)}
                        className={`
                        relative group flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200
                        ${selectedItems.includes(artist.id)
                                ? 'border-primary bg-primary/5 dark:bg-primary/10 scale-105 shadow-lg shadow-primary/10'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-primary/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }
                    `}
                    >
                        <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 mb-3 flex items-center justify-center text-3xl overflow-hidden shadow-sm">
                            {artist.emoji ? artist.emoji : artist.label[0]}
                        </div>
                        <span className={`font-medium text-center ${selectedItems.includes(artist.id) ? 'text-primary' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {artist.label}
                        </span>

                        {selectedItems.includes(artist.id) && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-sm animate-in zoom-in">
                                <Check className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-zinc-950 overflow-hidden flex flex-col">
            {/* Progress Bar */}
            {step > 0 && (
                <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-900">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${(step / 2) * 100}%` }}
                    />
                </div>
            )}

            <div className="flex-1 flex flex-col items-center p-6 relative overflow-hidden h-[calc(100vh-80px)]">
                {step === 0 && <div className="flex-1 flex flex-col justify-center">{renderWelcome()}</div>}
                {step === 1 && renderGenres()}
                {step === 2 && renderArtists()}
            </div>

            {/* Navigation Footer */}
            {step > 0 && (
                <div className="p-6 border-t border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm flex justify-between items-center max-w-5xl mx-auto w-full">
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 rounded-xl font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                    </button>

                    <div className="flex gap-2">
                        <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-800'}`} />
                        <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-800'}`} />
                    </div>

                    <button
                        onClick={step === 2 ? handleFinish : handleNext}
                        disabled={step === 1 && selectedItems.length === 0} // Optional: require at least one selection?
                        className={`
                            px-8 py-3 rounded-full font-bold shadow-lg transition-all flex items-center gap-2
                            ${(step === 1 && selectedItems.length === 0)
                                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                                : 'bg-primary text-white shadow-primary/25 hover:scale-105 active:scale-95'
                            }
                        `}
                    >
                        {step === 2 ? (
                            <>
                                Start Listening
                                <SparklesIcon className="w-5 h-5" />
                            </>
                        ) : (
                            <>
                                Next
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    )
}
