import React, { useRef } from 'react';
import type { Song } from '../types';
import { Play } from 'lucide-react';

interface HorizontalSongListProps {
    title: string;
    songs: Song[];
    onPlay: (song: Song) => void;
}

export const HorizontalSongList: React.FC<HorizontalSongListProps> = ({ title, songs, onPlay }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    if (songs.length === 0) return null;

    return (
        <div className="w-full mb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-2 mb-2 mt-4">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white border-l-4 border-primary pl-3">
                    {title}
                </h3>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-4 px-2 pb-2 snap-x snap-mandatory hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {songs.map((song) => (
                    <div
                        key={song.id}
                        className="flex-none w-40 group cursor-pointer"
                        onClick={() => onPlay(song)}
                    >
                        <div className="relative aspect-square mb-3 rounded-lg overflow-hidden shadow-md">
                            <img
                                src={song.thumbnail}
                                alt={song.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-105 transition-all">
                                    <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                                </div>
                            </div>
                        </div>
                        <h4 className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                            {song.title}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {song.artist}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
