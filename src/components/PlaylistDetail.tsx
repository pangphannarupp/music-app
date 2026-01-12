import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';
import type { Song, Playlist } from '../types';
import { Reorder } from 'framer-motion';
import { ArrowLeft, Play, Music, GripVertical, Trash2, Edit2, Upload, X } from 'lucide-react';

interface PlaylistDetailProps {
    playlist: Playlist;
    onBack: () => void;
}

export const PlaylistDetail: React.FC<PlaylistDetailProps> = ({ playlist, onBack }) => {
    const { t } = useLanguage();
    const { playSong, deletePlaylist, updatePlaylist, reorderPlaylist } = usePlayer();

    // Local state for reordering (optimistic UI)
    const [items, setItems] = useState<Song[]>(playlist.songs);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(playlist.name);

    // Update items when playlist changes externaly (e.g. song added)
    useEffect(() => {
        setItems(playlist.songs);
    }, [playlist.songs]);

    const handleReorder = (newOrder: Song[]) => {
        setItems(newOrder);
        reorderPlaylist(playlist.id, newOrder);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                updatePlaylist(playlist.id, { coverImage: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (editName.trim()) {
            updatePlaylist(playlist.id, { name: editName });
        }
        setIsEditing(false);
    };

    const handlePlayPlaylist = () => {
        if (items.length > 0) {
            playSong(items[0]);
            // Ideally we should replace the queue here, but current logic just plays one.
            // Future improvement: Queue entire playlist.
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900 border-l border-white/5">
            {/* Header */}
            <div className="relative h-64 shrink-0 group">
                {/* Cover Image Background (Blurred) */}
                <div
                    className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30"
                    style={{ backgroundImage: `url(${playlist.coverImage || (items[0]?.thumbnail) || ''})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />

                <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
                    <button
                        onClick={onBack}
                        className="absolute top-6 left-6 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex gap-6 items-end">
                        <div className="relative w-40 h-40 shadow-2xl rounded-lg overflow-hidden group/image bg-zinc-800 shrink-0">
                            {playlist.coverImage ? (
                                <img src={playlist.coverImage} className="w-full h-full object-cover" />
                            ) : items.length > 0 ? (
                                <img src={items[0].thumbnail} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Music className="w-16 h-16 text-zinc-600" />
                                </div>
                            )}

                            {/* Image Upload Overlay */}
                            <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/image:opacity-100 transition cursor-pointer">
                                <Upload className="w-8 h-8 text-white mb-2" />
                                <span className="text-xs text-white font-medium">Change Cover</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>

                        <div className="flex-1 min-w-0 mb-2">
                            <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">
                                Playlist
                            </h2>

                            {isEditing ? (
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="bg-white/10 text-white text-3xl font-bold rounded px-2 py-1 outline-none w-full"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    />
                                    <button onClick={handleSave} className="p-2 bg-primary rounded-full text-white">
                                        <Play className="w-4 h-4 fill-current rotate-90" /> {/* Checkmark proxy */}
                                    </button>
                                </div>
                            ) : (
                                <h1
                                    className="text-white text-4xl font-bold mb-2 truncate cursor-pointer hover:underline decoration-white/30"
                                    onClick={() => { setEditName(playlist.name); setIsEditing(true); }}
                                >
                                    {playlist.name}
                                    <Edit2 className="w-5 h-5 inline-block ml-3 text-zinc-500 hover:text-white transition opacity-0 group-hover:opacity-100" />
                                </h1>
                            )}

                            <p className="text-zinc-400 text-sm">
                                {items.length} {t.songs}
                            </p>
                        </div>

                        <div className="mb-2 flex gap-3">
                            <button
                                onClick={handlePlayPlaylist}
                                className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center shadow-lg transition hover:scale-105"
                            >
                                <Play className="w-6 h-6 text-white fill-current ml-1" />
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this playlist?')) {
                                        deletePlaylist(playlist.id);
                                        onBack();
                                    }
                                }}
                                className="p-3 bg-white/10 rounded-full text-zinc-300 hover:text-red-400 hover:bg-white/20 transition"
                                title="Delete Playlist"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Song List */}
            <div className="flex-1 overflow-y-auto p-4 content-start">
                <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-1">
                    {items.map((song) => (
                        <Reorder.Item key={song.id} value={song}>
                            <div className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition select-none bg-zinc-900 border border-transparent hover:border-white/5">
                                {/* Drag Handle */}
                                <div className="p-2 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400">
                                    <GripVertical className="w-4 h-4" />
                                </div>

                                <div
                                    onClick={() => playSong(song)}
                                    className="relative w-10 h-10 bg-zinc-800 rounded overflow-hidden shrink-0 cursor-pointer"
                                >
                                    {song.thumbnail ? (
                                        <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <Music className="w-5 h-5 text-zinc-600 m-auto" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playSong(song)}>
                                    <h4 className="text-zinc-200 font-medium truncate text-sm">{song.title}</h4>
                                    <p className="text-zinc-500 text-xs truncate">{song.artist}</p>
                                </div>

                                <div className="text-xs text-zinc-600 w-12 text-right">
                                    {song.duration || '--:--'}
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newItems = items.filter(s => s.id !== song.id);
                                        handleReorder(newItems);
                                    }}
                                    className="p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>

                {items.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">
                        <p>This playlist is empty.</p>
                        <p className="text-sm">Find songs and right-click to add them.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
