import React from 'react';
import type { Song } from '../types';
import { Play, Music } from 'lucide-react';

interface HorizontalSongListProps {
    title: string;
    songs: Song[];
    onPlay: (song: Song) => void;
}

export const HorizontalSongList: React.FC<HorizontalSongListProps> = ({ title, songs, onPlay }) => {


    if (songs.length === 0) return null;

    return (
        <div className="w-full mb-8 px-2">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                {title}
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {songs.map((song) => (
                    <div
                        key={song.id}
                        className="flex-none w-36 sm:w-48 group cursor-pointer snap-start"
                        onClick={() => onPlay(song)}
                    >
                        <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-lg bg-zinc-800">
                            {song.thumbnail ? (
                                <img
                                    src={song.thumbnail}
                                    alt={song.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                    <Music className="w-12 h-12 text-zinc-600 opacity-50" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition">
                                    <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current ml-1" />
                                </div>
                            </div>
                        </div>
                        <h4 className="font-semibold text-zinc-900 dark:text-white truncate text-sm sm:text-base">{song.title}</h4>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">{song.artist}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
