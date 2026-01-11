import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';
import { SongList } from './SongList';
import { Play, Shuffle } from 'lucide-react';
import type { Song } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface PlaylistViewProps {
    playlistId: string;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId }) => {
    const { playlists, playSong, addToQueue, removeFromPlaylist } = usePlayer();
    const { t } = useLanguage();
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <p>{t.playlistNotFound}</p>
            </div>
        );
    }

    const [songToDelete, setSongToDelete] = React.useState<Song | null>(null);

    const handlePlayAll = () => {
        if (playlist.songs.length > 0) {
            playSong(playlist.songs[0]);
            playlist.songs.slice(1).forEach(song => addToQueue(song));
        }
    };

    const handleShuffle = () => {
        if (playlist.songs.length > 0) {
            const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
            playSong(shuffled[0]);
            shuffled.slice(1).forEach(song => addToQueue(song));
        }
    };

    const handleConfirmDelete = () => {
        if (songToDelete) {
            removeFromPlaylist(playlistId, songToDelete.id);
            setSongToDelete(null);
        }
    };

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="flex items-end gap-6 mb-8 p-6 bg-gradient-to-b from-primary/20 to-transparent rounded-3xl">
                <div className="w-48 h-48 bg-zinc-800 rounded-xl shadow-2xl flex items-center justify-center text-zinc-600">
                    {/* Placeholder Art using first 4 songs if available or just generic */}
                    {playlist.songs.length > 0 ? (
                        <div className="grid grid-cols-2 w-full h-full">
                            {playlist.songs.slice(0, 4).map((s) => (
                                <img key={s.id} src={s.thumbnail} className="w-full h-full object-cover first:rounded-tl-xl second:rounded-tr-xl third:rounded-bl-xl fourth:rounded-br-xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-6xl font-bold opacity-20">{playlist.name[0]}</div>
                    )}
                </div>

                <div className="flex-1">
                    <p className="text-sm font-medium uppercase tracking-wider mb-2">{t.playlist}</p>
                    <h1 className="text-5xl font-bold mb-4">{playlist.name}</h1>
                    <p className="text-zinc-400 text-sm mb-6">
                        {playlist.songs.length} {t.songs}
                    </p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePlayAll}
                            className="w-14 h-14 bg-primary rounded-full flex items-center justify-center hover:scale-105 transition shadow-xl text-white"
                        >
                            <Play className="w-6 h-6 fill-current ml-1" />
                        </button>
                        <button
                            onClick={handleShuffle}
                            className="w-10 h-10 rounded-full border border-zinc-500 flex items-center justify-center hover:bg-white/10 transition"
                            title="Shuffle"
                        >
                            <Shuffle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4">
                <SongList
                    songs={playlist.songs}
                    onPlay={playSong}
                    onRemove={(song) => setSongToDelete(song)}
                />
            </div>

            {playlist.songs.length === 0 && (
                <div className="text-center py-20 text-zinc-500">
                    <p>{t.emptyPlaylist}</p>
                    <p className="text-sm">{t.searchToAdd}</p>
                </div>
            )}

            <ConfirmModal
                isOpen={!!songToDelete}
                onClose={() => setSongToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t.removeSong}
                description={t.removeSongConfirm}
                confirmLabel={t.confirm}
                cancelLabel={t.cancel}
            />
        </div>
    );
};
