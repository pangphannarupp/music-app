import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';
import { Music, Play, X, Trash2, Folder as FolderIcon, ChevronRight, ChevronDown, FolderPlus, ListPlus } from 'lucide-react';
import type { Song, Playlist } from '../types';
import { InputModal } from './InputModal';

interface LibraryViewProps {
    isOpen: boolean;
    onClose: () => void;
    variant?: 'drawer' | 'page';
}

export const LibraryView: React.FC<LibraryViewProps> = ({ isOpen, onClose, variant = 'drawer' }) => {
    const { t } = useLanguage();
    const {
        favorites,
        playlists,
        folders,
        playSong,
        deletePlaylist,
        createPlaylist,
        createFolder
    } = usePlayer();

    const [activeTab, setActiveTab] = useState<'favorites' | 'playlists'>('favorites');
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Input Modal State
    const [isInputModalOpen, setIsInputModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'playlist' | 'folder'>('playlist');

    const openCreateModal = (mode: 'playlist' | 'folder') => {
        setModalMode(mode);
        setIsInputModalOpen(true);
    };

    const handleInputConfirm = (val: string) => {
        if (!val.trim()) return;

        if (modalMode === 'playlist') {
            createPlaylist(val);
        } else {
            createFolder(val);
        }
        setIsInputModalOpen(false);
    };

    const toggleFolder = (folderId: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    // If drawer mode and not open, return null.
    // If page mode, we typically control visibility via parent routing/rendering, but can check isOpen too.
    if (!isOpen) return null;

    const renderSongList = (songs: Song[], isRemovable = false, removeAction?: (id: string) => void) => (
        <div className="flex flex-col gap-2">
            {songs.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                    <p>No songs found here yet.</p>
                </div>
            ) : (
                songs.map(song => (
                    <div
                        key={song.id}
                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition group cursor-pointer"
                        onClick={() => playSong(song)}
                    >
                        <div className="relative w-12 h-12 bg-zinc-800 rounded overflow-hidden shrink-0">
                            <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <Play className="w-5 h-5 text-white fill-current" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-zinc-900 dark:text-white font-medium truncate text-sm">{song.title}</h4>
                            <p className="text-zinc-500 text-xs truncate">{song.artist}</p>
                        </div>
                        {isRemovable && removeAction && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeAction(song.id);
                                }}
                                className="p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))
            )}
        </div>
    );

    // Dynamic Classes based on variant
    const containerClasses = variant === 'drawer'
        ? "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-900 border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300"
        : "w-full flex flex-col min-h-full"; // Page mode: explicit height/width handling handled by parent layout mostly

    const headerClasses = variant === 'drawer'
        ? "flex items-center justify-between p-6 border-b border-white/10 shrink-0"
        : "flex items-center justify-between mb-2 shrink-0";

    const titleClasses = variant === 'drawer'
        ? "text-2xl font-bold text-white py-1 leading-relaxed"
        : "text-2xl font-bold text-zinc-900 dark:text-white py-1 leading-relaxed";

    const navBorderClass = variant === 'drawer'
        ? "border-white/10"
        : "border-zinc-200 dark:border-white/10";

    return (
        <div className={containerClasses}>
            {/* Header */}
            <div className={headerClasses}>
                <h2 className={titleClasses}>{t.library}</h2>
                {variant === 'drawer' && (
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition">
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            {selectedPlaylist ? (
                <div className={`flex items-center gap-4 px-0 py-4 border-b ${navBorderClass} ${variant === 'drawer' ? 'px-6' : ''}`}>
                    <button
                        onClick={() => setSelectedPlaylist(null)}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm"
                    >
                        ← {t.back}
                    </button>
                    <h3 className="text-zinc-900 dark:text-white font-bold truncate flex-1">{selectedPlaylist.name}</h3>
                </div>
            ) : (
                <div className={`flex border-b ${navBorderClass} ${variant === 'drawer' ? 'px-6' : ''}`}>
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`py-4 px-4 font-medium text-sm border-b-2 transition ${activeTab === 'favorites' ? 'text-primary border-primary' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-white'}`}
                    >
                        {t.favorites}
                    </button>
                    <button
                        onClick={() => setActiveTab('playlists')}
                        className={`py-4 px-4 font-medium text-sm border-b-2 transition ${activeTab === 'playlists' ? 'text-primary border-primary' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-white'}`}
                    >
                        {t.playlistsTab}
                    </button>
                </div>
            )}

            {/* Content */}
            <div className={`flex-1 overflow-y-auto ${variant === 'drawer' ? 'p-6' : 'py-6'}`}>
                {selectedPlaylist ? (
                    <div>
                        <div className="flex gap-4 mb-6">
                            <div className="w-32 h-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
                                {selectedPlaylist.songs.length > 0 ? (
                                    <img src={selectedPlaylist.songs[0].thumbnail} className="w-full h-full object-cover" />
                                ) : (
                                    <Music className="w-12 h-12 text-zinc-400 dark:text-zinc-600" />
                                )}
                            </div>
                            <div className="flex flex-col justify-end pb-2">
                                <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-widest mb-1">Playlist</p>
                                <h1 className="text-zinc-900 dark:text-white text-2xl font-bold mb-2">{selectedPlaylist.name}</h1>
                                <p className="text-zinc-500 text-sm">{selectedPlaylist.songs.length} {t.songs}</p>
                            </div>
                        </div>
                        {renderSongList(selectedPlaylist.songs, true, () => { })}
                    </div>
                ) : activeTab === 'favorites' ? (
                    renderSongList(favorites)
                ) : (
                    <div className="flex flex-col gap-2">
                        {/* Creation Actions */}
                        <div className="flex gap-2 mb-2">
                            <button
                                onClick={() => openCreateModal('playlist')}
                                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                            >
                                <ListPlus className="w-5 h-5" />
                                {t.newPlaylist}
                            </button>
                            <button
                                onClick={() => openCreateModal('folder')}
                                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                            >
                                <FolderPlus className="w-5 h-5" />
                                {t.newFolder}
                            </button>
                        </div>

                        {/* Folders */}
                        {folders.map(folder => {
                            const folderPlaylists = playlists.filter(p => p.folderId === folder.id);
                            return (
                                <div key={folder.id} className="border border-zinc-200 dark:border-white/5 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => toggleFolder(folder.id)}
                                        className="w-full flex items-center justify-between p-3 bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FolderIcon className="w-5 h-5 text-primary" />
                                            <span className="font-medium text-zinc-900 dark:text-white">{folder.name}</span>
                                            <span className="text-xs text-zinc-500">({folderPlaylists.length})</span>
                                        </div>
                                        {expandedFolders.has(folder.id) ? (
                                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                                        )}
                                    </button>

                                    {expandedFolders.has(folder.id) && (
                                        <div className="bg-zinc-50 dark:bg-black/20 p-2 space-y-2">
                                            {folderPlaylists.length === 0 ? (
                                                <p className="text-xs text-center text-zinc-500 py-2">{t.emptyFolder}</p>
                                            ) : (
                                                folderPlaylists.map(pl => (
                                                    <div
                                                        key={pl.id}
                                                        onClick={() => setSelectedPlaylist(pl)}
                                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-800 cursor-pointer transition pl-4"
                                                    >
                                                        <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-900 rounded flex items-center justify-center shrink-0">
                                                            {pl.songs.length > 0 ? (
                                                                <img src={pl.songs[0].thumbnail} className="w-full h-full object-cover rounded" />
                                                            ) : (
                                                                <Music className="w-5 h-5 text-zinc-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-sm font-medium text-zinc-900 dark:text-white truncate">{pl.name}</h5>
                                                            <p className="text-xs text-zinc-500">{pl.songs.length} {t.songs}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Root Playlists */}
                        {playlists.filter(p => !p.folderId).map(pl => (
                            <div
                                key={pl.id}
                                onClick={() => setSelectedPlaylist(pl)}
                                className="group flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition border border-zinc-200 dark:border-white/5"
                            >
                                <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-900 rounded flex items-center justify-center shrink-0 relative overflow-hidden">
                                    {pl.songs.length > 0 ? (
                                        <img src={pl.songs[0].thumbnail} className="w-full h-full object-cover" />
                                    ) : (
                                        <Music className="w-6 h-6 text-zinc-400" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <Play className="w-4 h-4 text-white fill-current" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-zinc-900 dark:text-white truncate">{pl.name}</h4>
                                    <p className="text-xs text-zinc-500">{pl.songs.length} {t.songs}</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deletePlaylist(pl.id);
                                    }}
                                    className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {playlists.length === 0 && folders.length === 0 && (
                            <div className="text-center py-10 text-zinc-500">
                                <p>{t.noPlaylists}</p>
                                <p className="text-xs mt-2">{t.createOne}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <InputModal
                isOpen={isInputModalOpen}
                onClose={() => setIsInputModalOpen(false)}
                onConfirm={handleInputConfirm}
                title={modalMode === 'playlist' ? t.createPlaylistTitle : t.createFolderTitle}
                placeholder={modalMode === 'playlist' ? t.playlistNamePlaceholder : t.folderNamePlaceholder}
                confirmLabel={t.create}
                cancelLabel={t.cancel}
            />
        </div >
    );
};
