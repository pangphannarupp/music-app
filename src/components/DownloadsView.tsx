import React, { useEffect, useState } from 'react';
import { Music, Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import type { Song } from '../types';

export const DownloadsView: React.FC = () => {
    const { playSong } = usePlayer();
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDownloads = async () => {
            if (window.electron && window.electron.listDownloads) {
                try {
                    const result = await window.electron.listDownloads();
                    if (result.success && result.files) {
                        const localSongs: Song[] = result.files.map((f: any) => ({
                            id: f.name, // Use filename as ID for now
                            title: f.name.replace(/\.(mp3|webm|m4a|wav|ogg|aac)$/i, ''),
                            artist: 'Local File',
                            thumbnail: '', // No thumbnail for local files yet
                            isLocal: true,
                            localPath: f.path,
                            // Split path by / (or \ for Windows), encode each segment, then join.
                            // This ensures characters like '?' or '#' in filenames are encoded as %3F, %23 etc.
                            audioUrl: `file://${f.path.split(window.electron ? '/' : '/').map(encodeURIComponent).join('/')}`
                        }));
                        setSongs(localSongs);
                    }
                } catch (error) {
                    console.error('Failed to list downloads:', error);
                }
            }
            setLoading(false);
        };

        fetchDownloads();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-zinc-500">Loading downloads...</div>;
    }

    if (songs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Music className="w-16 h-16 mb-4 opacity-20" />
                <p>No downloads found in your Music or Downloads folders.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {songs.map((song) => (
                <div
                    key={song.id}
                    className="group relative bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all cursor-pointer border border-white/5 hover:border-white/10"
                    onClick={() => playSong(song)}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                            <Music className="w-6 h-6 text-zinc-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-white truncate">{song.title}</h3>
                            <p className="text-sm text-zinc-400 truncate">{song.artist}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            <Play className="w-5 h-5 fill-current" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
