import React from 'react';
import type { Song } from '../types';
import { Play, Trash2 } from 'lucide-react';

interface SongListProps {
    songs: Song[];
    onPlay: (song: Song) => void;
    onRemove?: (song: Song) => void;
}

export const SongList: React.FC<SongListProps> = ({ songs, onPlay, onRemove }) => {
    if (songs.length === 0) {
        return (
            <div className="text-center text-zinc-500 mt-20">
                <p className="text-lg">No songs found. Try searching for something!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-24 md:pb-0">
            {songs.map((song) => (
                <div
                    key={song.id}
                    className="relative flex md:block bg-white dark:bg-zinc-900 md:bg-zinc-800/50 rounded-xl overflow-hidden group hover:bg-zinc-50 dark:hover:bg-zinc-800 transition duration-300 cursor-pointer border border-zinc-200 dark:border-white/5 hover:border-primary/30"
                    onClick={() => onPlay(song)}
                >
                    {/* Thumbnail wrapper */}
                    <div className="relative w-24 md:w-full aspect-square md:aspect-video flex-shrink-0 overflow-hidden">
                        <img
                            src={song.thumbnail}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        {/* Play Overlay (Desktop only usually) */}
                        <div className="hidden md:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 items-center justify-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition duration-300">
                                <Play className="w-6 h-6 text-black fill-current ml-1" />
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 md:p-4 flex flex-col justify-center min-w-0 pr-10">
                        <h3 className="font-semibold text-zinc-900 dark:text-white truncate text-sm md:text-base" title={song.title}>{song.title}</h3>
                        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1 truncate group-hover:text-primary transition-colors">{song.artist}</p>
                    </div>

                    {/* Remove Button */}
                    {onRemove && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(song);
                            }}
                            className="absolute md:top-2 md:right-2 right-2 top-1/2 -translate-y-1/2 md:translate-y-0 p-2 rounded-full bg-black/50 hover:bg-red-500 text-white opacity-100 md:opacity-0 group-hover:opacity-100 transition z-10"
                            title="Remove from playlist"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};
