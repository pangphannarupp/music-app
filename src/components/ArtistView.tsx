import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { SongList } from './SongList';
import { searchVideos } from '../api/youtube';
import type { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
// import { useLanguage } from '../context/LanguageContext';

interface ArtistViewProps {
    artistName: string;
    onBack: () => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ artistName, onBack }) => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { playSong } = usePlayer();
    // const { t } = useLanguage(); // Unused

    // Decode artist name for display (in case of URL encoding)
    const decodedName = decodeURIComponent(artistName);

    useEffect(() => {
        const fetchArtistSongs = async () => {
            setIsLoading(true);
            try {
                // Search specifically for the artist
                const { songs: artistSongs } = await searchVideos(decodedName);
                setSongs(artistSongs);
            } catch (error) {
                console.error("Failed to fetch artist songs", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (artistName) {
            fetchArtistSongs();
        }
    }, [artistName]);

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black pb-32 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                {/* Background Blur */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-zinc-50 dark:to-black z-0" />

                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 z-20 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-zinc-900 dark:text-white transition"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                {/* Artist Info */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pt-8">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full shadow-2xl border-4 border-white dark:border-zinc-800 overflow-hidden mb-4">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(decodedName)}&background=random&size=400`}
                            alt={decodedName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white text-center px-4 drop-shadow-sm">
                        {decodedName}
                    </h1>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 md:px-8 -mt-6 z-20">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-l-4 border-primary pl-3">
                        Top Songs
                    </h2>

                    {/* Play All Button (Conceptual - just plays first for now or random) */}
                    <button
                        onClick={() => songs.length > 0 && playSong(songs[0])}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-medium transition shadow-lg shadow-primary/30"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Play All
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <SongList songs={songs} onPlay={playSong} />
                )}
            </div>
        </div>
    );
};
