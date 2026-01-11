import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { SongList } from './SongList';
import { Trash2, History } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { useLanguage } from '../context/LanguageContext';

export const HistoryView: React.FC = () => {
    const { playbackHistory, playSong, clearHistory } = usePlayer();
    const { t } = useLanguage();
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const handleClearHistory = () => {
        clearHistory();
        setShowClearConfirm(false);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <History className="w-8 h-8 text-primary" />
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        {t.historyTitle}
                    </h2>
                </div>

                {playbackHistory.length > 0 && (
                    <button
                        onClick={() => setShowClearConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        {t.clearAll}
                    </button>
                )}
            </div>

            {playbackHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-600">
                    <History className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">{t.noHistory}</p>
                    <p className="text-sm">{t.noHistoryDesc}</p>
                </div>
            ) : (
                <SongList songs={playbackHistory} onPlay={playSong} />
            )}

            <ConfirmModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClearHistory}
                title={t.clearHistory}
                description={t.clearHistoryConfirm}
                confirmLabel={t.clearAll}
                cancelLabel={t.cancel}
            />
        </div>
    );
};
