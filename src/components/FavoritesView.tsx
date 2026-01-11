import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { SongList } from './SongList';
import { Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const FavoritesView: React.FC = () => {
    const { favorites, playSong } = usePlayer();
    const { t } = useLanguage();

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-0 bg-primary/20 rounded-full">
                    <Heart className="w-8 h-8 text-primary fill-current" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white py-2 leading-relaxed">{t.favorites}</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">{favorites.length} {t.songs}</p>
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-zinc-800/30 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
                    <Heart className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
                    <h3 className="text-xl font-medium text-zinc-900 dark:text-white mb-2">{t.noFavorites}</h3>
                    <p className="text-zinc-500">{t.noFavoritesDesc}</p>
                </div>
            ) : (
                <SongList songs={favorites} onPlay={playSong} />
            )}
        </div>
    );
};
