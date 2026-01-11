import React, { useState } from 'react';
import { InputModal } from './InputModal';
import { Home, Heart, Settings, FolderPlus, PlusSquare, Folder, ListMusic, ChevronDown, ChevronRight, Trash2, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePlayer } from '../context/PlayerContext';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
    const { t } = useLanguage();
    const { playlists, folders, createPlaylist, createFolder, deletePlaylist, deleteFolder } = usePlayer();
    const [createModal, setCreateModal] = useState<{ type: 'folder' | 'playlist'; parentId?: string; isOpen: boolean }>({
        type: 'folder',
        isOpen: false
    });
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const handleCreateConfirm = (name: string) => {
        if (createModal.type === 'folder') {
            createFolder(name);
        } else {
            createPlaylist(name, createModal.parentId);
        }
        setCreateModal(prev => ({ ...prev, isOpen: false }));
    };

    const openCreateFolder = () => setCreateModal({ type: 'folder', isOpen: true });
    const openCreatePlaylist = (folderId?: string) => setCreateModal({ type: 'playlist', parentId: folderId, isOpen: true });

    const menuItems = [
        { id: 'home', icon: Home, label: t.home },
        { id: 'favorites', icon: Heart, label: t.favorites },
        { id: 'history', icon: Clock, label: t.history },
        { id: 'settings', icon: Settings, label: t.settings },
    ] as const;

    // Filter root playlists (no folder)
    const rootPlaylists = playlists.filter(p => !p.folderId);

    return (
        <div className="hidden md:flex flex-col w-64 bg-white dark:bg-black border-r border-zinc-200 dark:border-white/5 h-screen fixed left-0 top-0 z-30 transition-colors duration-300">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                    <img src="music-app.png" alt={t.appName} className="w-10 h-10 rounded-xl shadow-lg shadow-primary/20" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-600 tracking-tight">
                    {t.appName}
                </h1>
            </div>

            {/* Nav */}
            <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">{t.menu}</p>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition font-medium group ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-primary dark:group-hover:text-white'}`} />
                            {item.label}
                        </button>
                    );
                })}

                {/* Library / Playlists Header */}
                <div className="mt-8 mb-2 px-4 flex items-center justify-between group">
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t.library}</p>
                    <div className="flex gap-1 opacity-100 transition-opacity">
                        <button onClick={openCreateFolder} title={t.newFolder} className="p-1 hover:text-primary text-zinc-500"><FolderPlus className="w-4 h-4" /></button>
                        <button onClick={() => openCreatePlaylist()} title={t.newPlaylist} className="p-1 hover:text-primary text-zinc-500"><PlusSquare className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Folders & Playlists */}
                <div className="space-y-1">
                    {/* Folders */}
                    {folders.map(folder => {
                        const isExpanded = expandedFolders[folder.id];
                        const folderPlaylists = playlists.filter(p => p.folderId === folder.id);

                        return (
                            <div key={folder.id} className="space-y-1">
                                <div className="flex items-center justify-between group px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 cursor-pointer" onClick={() => toggleFolder(folder.id)}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Folder className={`w-4 h-4 ${isExpanded ? 'text-primary' : ''}`} />
                                        <span className="truncate text-sm font-medium">{folder.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                            className="p-1 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openCreatePlaylist(folder.id); }}
                                            className="p-1 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <PlusSquare className="w-3 h-3" />
                                        </button>
                                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </div>
                                </div>

                                {/* Folder Contents */}
                                {isExpanded && (
                                    <div className="pl-4 border-l border-zinc-200 dark:border-white/5 ml-4 space-y-1">
                                        {folderPlaylists.map(playlist => (
                                            <button
                                                key={playlist.id}
                                                onClick={() => onViewChange(`playlist:${playlist.id}`)}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition group ${currentView === `playlist:${playlist.id}`
                                                    ? 'text-primary bg-primary/5'
                                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <ListMusic className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{playlist.name}</span>
                                                </div>
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                                                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </div>
                                            </button>
                                        ))}
                                        {folderPlaylists.length === 0 && (
                                            <div className="px-3 py-1 text-xs text-zinc-400 italic">{t.empty}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Root Playlists */}
                    {rootPlaylists.map(playlist => (
                        <button
                            key={playlist.id}
                            onClick={() => onViewChange(`playlist:${playlist.id}`)}
                            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm transition group ${currentView === `playlist:${playlist.id}`
                                ? 'text-primary bg-primary/5'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3 truncate">
                                <ListMusic className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate font-medium">{playlist.name}</span>
                            </div>
                            <div
                                onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1"
                            >
                                <Trash2 className="w-3 h-3" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer / User Check (Optional) */}
            <div className="p-6 border-t border-zinc-200 dark:border-white/5">
                <div className="text-xs text-zinc-500 dark:text-zinc-600 text-center">
                    v1.0.0
                </div>
            </div>

            <InputModal
                isOpen={createModal.isOpen}
                onClose={() => setCreateModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleCreateConfirm}
                title={createModal.type === 'folder' ? t.createFolderTitle : t.createPlaylistTitle}
                placeholder={createModal.type === 'folder' ? t.myFolder : t.myPlaylist}
                confirmLabel={t.create}
                cancelLabel={t.cancel}
            />
        </div>
    );
};
