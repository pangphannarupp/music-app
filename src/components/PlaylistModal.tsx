import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePlayer } from '../context/PlayerContext';
import type { Song } from '../types';
import { PlusSquare, Check, X, ListMusic } from 'lucide-react';
import { InputModal } from './InputModal';

interface PlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    songToAdd: Song | null;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({ isOpen, onClose, songToAdd }) => {
    const { playlists, folders, createPlaylist, createFolder, addToPlaylist, removeFromPlaylist } = usePlayer();
    const [createModal, setCreateModal] = useState<{ isOpen: boolean; type: 'playlist' | 'folder'; folderId?: string }>({
        isOpen: false,
        type: 'playlist'
    });
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

    if (!isOpen || !songToAdd) return null;

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const handleCreateConfirm = (name: string) => {
        if (createModal.type === 'folder') {
            createFolder(name);
        } else {
            createPlaylist(name, createModal.folderId);
        }
        setCreateModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleTogglePlaylist = (playlistId: string) => {
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return;

        const isAlreadyAdded = playlist.songs.some(s => s.id === songToAdd.id);

        if (isAlreadyAdded) {
            removeFromPlaylist(playlistId, songToAdd.id);
        } else {
            addToPlaylist(playlistId, songToAdd);
        }
        // Don't close immediately so user can see the toggle state change
        // onClose(); 
    };

    const rootPlaylists = playlists.filter(p => !p.folderId);

    const renderPlaylistRow = (playlist: typeof playlists[0], isNested = false) => {
        const hasSong = playlist.songs.some(s => s.id === songToAdd.id);
        return (
            <button
                key={playlist.id}
                onClick={() => handleTogglePlaylist(playlist.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition group ${hasSong
                    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                    : 'hover:bg-white/10 text-zinc-400 hover:text-white'
                    } ${isNested ? 'ml-6 w-[calc(100%-1.5rem)]' : ''}`}
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 ${hasSong ? 'bg-green-500 text-white' : 'bg-zinc-800'}`}>
                    {hasSong ? <Check className="w-4 h-4" /> : <ListMusic className="w-4 h-4 text-zinc-500 group-hover:text-white" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate text-sm">{playlist.name}</p>
                    <p className="text-[10px] opacity-60 truncate">{playlist.songs.length} songs</p>
                </div>
            </button>
        );
    };

    return createPortal(
        <>
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                        <h3 className="text-lg font-bold text-white">Add to Playlist</h3>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 bg-zinc-800/50 flex items-center gap-3 border-b border-white/5 shrink-0">
                        <img src={songToAdd.thumbnail} className="w-12 h-12 rounded object-cover bg-zinc-800 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{songToAdd.title}</p>
                            <p className="text-zinc-400 text-sm truncate">{songToAdd.artist}</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                onClick={() => setCreateModal({ isOpen: true, type: 'playlist' })}
                                className="flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-primary/20 hover:text-primary transition text-zinc-400 hover:border-primary/50 border border-dashed border-white/10"
                            >
                                <PlusSquare className="w-5 h-5" />
                                <span className="font-medium text-sm">New Playlist</span>
                            </button>
                            <button
                                onClick={() => setCreateModal({ isOpen: true, type: 'folder' })}
                                className="flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-amber-500/20 hover:text-amber-500 transition text-zinc-400 hover:border-amber-500/50 border border-dashed border-white/10"
                            >
                                <span className="text-lg">📁</span>
                                <span className="font-medium text-sm">New Folder</span>
                            </button>
                        </div>

                        {playlists.length === 0 && folders.length === 0 && (
                            <div className="text-center py-8 text-zinc-500">
                                No playlists yet.
                            </div>
                        )}

                        {/* Folders Section */}
                        {folders.map(folder => {
                            const isExpanded = expandedFolders[folder.id];
                            const folderPlaylists = playlists.filter(p => p.folderId === folder.id);

                            return (
                                <div key={folder.id} className="space-y-1">
                                    <button
                                        onClick={() => toggleFolder(folder.id)}
                                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-zinc-300 transition group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Folder Icon */}
                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-500 group-hover:text-amber-400 transition-colors">
                                                <span className="text-lg">📁</span>
                                            </div>
                                            <span className="font-semibold truncate text-sm">{folder.name}</span>
                                        </div>
                                        <div className="text-zinc-500">
                                            {isExpanded ? <span className="text-xs">▼</span> : <span className="text-xs">▶</span>}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="pl-4 space-y-1 border-l border-white/5 ml-3.5">
                                            {/* Create Playlist Inside Folder */}
                                            <button
                                                onClick={() => setCreateModal({ isOpen: true, type: 'playlist', folderId: folder.id })}
                                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:text-primary transition text-zinc-500 text-sm pl-2"
                                            >
                                                <PlusSquare className="w-4 h-4" />
                                                <span className="">Create in "{folder.name}"</span>
                                            </button>

                                            {folderPlaylists.map(p => renderPlaylistRow(p, true))}

                                            {folderPlaylists.length === 0 && (
                                                <div className="px-3 py-1 text-xs text-zinc-600 italic">No playlists here</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Root Playlists */}
                        {rootPlaylists.length > 0 && folders.length > 0 && <div className="h-px bg-white/5 my-2" />}
                        {rootPlaylists.map(p => renderPlaylistRow(p))}
                    </div>
                </div>
            </div>

            <InputModal
                isOpen={createModal.isOpen}
                onClose={() => setCreateModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleCreateConfirm}
                title={createModal.type === 'folder' ? "Create New Folder" : (createModal.folderId ? `New Playlist in Folder` : "Create New Playlist")}
                placeholder={createModal.type === 'folder' ? "Folder Name" : "Playlist Name"}
            />
        </>,
        document.body
    );
};
