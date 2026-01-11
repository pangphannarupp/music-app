import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface Artist {
    id: string;
    name: string;
    image: string;
    searchQuery: string;
}

// Popular Artists Data
// Using UI Avatars for consistent, reliable images
const POPULAR_ARTISTS: Artist[] = [
    {
        id: 'vannda',
        name: 'VannDa',
        image: 'https://ui-avatars.com/api/?name=VannDa&background=random&size=200',
        searchQuery: 'VannDa'
    },
    {
        id: 'gdevith',
        name: 'G-Devith',
        image: 'https://ui-avatars.com/api/?name=G-Devith&background=random&size=200',
        searchQuery: 'G-Devith'
    },
    {
        id: 'manith',
        name: 'Manith',
        image: 'https://ui-avatars.com/api/?name=Manith&background=random&size=200',
        searchQuery: 'Manith Jupiter'
    },
    {
        id: 'chet-kenea',
        name: 'Chet Kenea',
        image: 'https://ui-avatars.com/api/?name=Chet+Kenea&background=random&size=200',
        searchQuery: 'Chet Kenea'
    },
    {
        id: 'suly-pheng',
        name: 'Suly Pheng',
        image: 'https://ui-avatars.com/api/?name=Suly+Pheng&background=random&size=200',
        searchQuery: 'Suly Pheng'
    },
    {
        id: 'tena',
        name: 'Tena',
        image: 'https://ui-avatars.com/api/?name=Tena&background=random&size=200',
        searchQuery: 'Tena Kh'
    },
    {
        id: 'justin-bieber',
        name: 'Justin Bieber',
        image: 'https://ui-avatars.com/api/?name=Justin+Bieber&background=random&size=200',
        searchQuery: 'Justin Bieber'
    },
    {
        id: 'taylor-swift',
        name: 'Taylor Swift',
        image: 'https://ui-avatars.com/api/?name=Taylor+Swift&background=random&size=200',
        searchQuery: 'Taylor Swift'
    },
    {
        id: 'ed-sheeran',
        name: 'Ed Sheeran',
        image: 'https://ui-avatars.com/api/?name=Ed+Sheeran&background=random&size=200',
        searchQuery: 'Ed Sheeran'
    }
];

interface HorizontalArtistListProps {
    onSelect: (query: string) => void;
    selectedArtist: string | null;
}

export const HorizontalArtistList: React.FC<HorizontalArtistListProps> = ({ onSelect, selectedArtist }) => {
    const { t } = useLanguage();

    return (
        <div className="w-full mt-4 mb-0">
            <div className="px-2 mb-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white border-l-4 border-primary pl-3">
                    {t.popularArtists}
                </h3>
            </div>

            {/* Added py-4 to container to prevent hover scale clipping */}
            <div className="flex overflow-x-auto py-2 px-2 gap-4 scrollbar-hide snap-x">
                {POPULAR_ARTISTS.map((artist) => {
                    const isSelected = selectedArtist === artist.searchQuery;

                    return (
                        <div
                            key={artist.id}
                            onClick={() => onSelect(artist.searchQuery)}
                            className="flex flex-col items-center gap-2 cursor-pointer group min-w-[5rem] snap-start"
                        >
                            {/* Avatar */}
                            <div className={`w-20 h-20 rounded-full overflow-hidden shadow-md border-4 transition-all duration-300 group-hover:scale-105 ${isSelected
                                ? 'border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-900 scale-105'
                                : 'border-transparent group-hover:border-primary/50'
                                }`}>
                                <img
                                    src={artist.image}
                                    alt={artist.name}
                                    className="w-full h-full object-cover bg-zinc-200 dark:bg-zinc-800"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=random`;
                                    }}
                                />
                            </div>

                            {/* Name */}
                            <span className={`text-xs font-medium text-center line-clamp-2 max-w-[5rem] transition-colors ${isSelected ? 'text-primary font-bold' : 'text-zinc-600 dark:text-zinc-300 group-hover:text-primary'
                                }`}>
                                {artist.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
