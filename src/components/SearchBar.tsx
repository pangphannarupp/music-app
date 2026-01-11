import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getSearchHistory, addToSearchHistory } from '../utils/searchHistory';

interface SearchBarProps {
    onSearch: (query: string) => void;
    isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
    const [query, setQuery] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const { t } = useLanguage();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHistory(getSearchHistory());
    }, []);

    // Close history when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowHistory(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            addToSearchHistory(query);
            setHistory(getSearchHistory()); // Update local state immediately
            setShowHistory(false);
            onSearch(query);
        }
    };

    const handleHistoryClick = (historyItem: string) => {
        setQuery(historyItem);
        addToSearchHistory(historyItem); // Re-add to move to top
        setHistory(getSearchHistory());
        setShowHistory(false);
        onSearch(historyItem);
    };

    const handleFocus = () => {
        setHistory(getSearchHistory());
        setShowHistory(true);
    };

    return (
        <div ref={wrapperRef} className="w-full max-w-2xl mx-auto mb-8 relative z-50">
            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-lg overflow-hidden shadow-sm">
                    <input
                        type="text"
                        className="w-full px-6 py-4 bg-transparent text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none text-lg"
                        placeholder={t.searchPlaceholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={handleFocus}
                    />
                    <button
                        type="submit"
                        className="p-4 text-zinc-400 hover:text-primary dark:hover:text-white transition-colors"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Search className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </form>

            {/* Search History Dropdown */}
            {showHistory && history.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                        <div className="px-4 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            {t.recentSearches || 'Recent Searches'}
                        </div>
                        {history.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleHistoryClick(item)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors text-left"
                            >
                                <Clock className="w-4 h-4 text-zinc-400" />
                                <span className="text-zinc-700 dark:text-zinc-200">{item}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
