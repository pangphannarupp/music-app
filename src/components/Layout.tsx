import { type ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { HomeView } from './HomeView';
import { FavoritesView } from './FavoritesView';
import { SettingsView } from './SettingsView';
import { PlayerControls } from './PlayerControls';
import { LibraryView } from './LibraryView';

import { PlaylistView } from './PlaylistView';
import { Toast, type ToastProps } from './Toast';
import { ArtistView } from './ArtistView';
import { HistoryView } from './HistoryView';
import { useLanguage } from '../context/LanguageContext';
import { analytics } from '../firebase';
import { logEvent } from 'firebase/analytics';

interface LayoutProps {
    children?: ReactNode;
}

export type ViewState = 'home' | 'favorites' | 'settings' | 'library' | 'history' | string;

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { t } = useLanguage();

    // Parse initial route from URL hash
    const getViewFromHash = (): ViewState => {
        const hash = window.location.hash.slice(1); // Remove '#'
        if (!hash || hash === '/') return 'home';
        return hash.slice(1); // Remove leading '/'
    };

    const [currentView, setCurrentView] = useState<ViewState>(getViewFromHash());
    const [isNavVisible, setIsNavVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [toastState, setToastState] = useState<{ isVisible: boolean; message: string; type: ToastProps['type'] }>({
        isVisible: false,
        message: '',
        type: 'info'
    });

    useEffect(() => {
        const handleApiExhausted = () => {
            setToastState({
                isVisible: true,
                message: 'All API keys are exhausted. Please try again later.',
                type: 'error'
            });
        };

        window.addEventListener('YT_API_EXHAUSTED', handleApiExhausted);
        return () => window.removeEventListener('YT_API_EXHAUSTED', handleApiExhausted);
    }, []);

    // Sync URL hash with current view
    useEffect(() => {
        const hash = `#/${currentView}`;
        if (window.location.hash !== hash) {
            window.location.hash = hash;
        }
    }, [currentView]);

    // Listen for browser back/forward navigation
    useEffect(() => {
        const handleHashChange = () => {
            const newView = getViewFromHash();
            setCurrentView(newView);
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Track page views with Firebase Analytics
    useEffect(() => {
        if (analytics) {
            logEvent(analytics, 'page_view', {
                page_title: currentView,
                page_location: window.location.href,
                page_path: `/${currentView}`
            });
        }
    }, [currentView]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        const scrollDiff = currentScrollY - lastScrollY;

        // Hide if scrolling down more than 10px and not at top
        if (scrollDiff > 10 && currentScrollY > 20) {
            setIsNavVisible(false);
        } else if (scrollDiff < -10) {
            // Show if scrolling up more than 10px
            setIsNavVisible(true);
        }
        setLastScrollY(currentScrollY);
    };

    const renderView = () => {
        if (typeof currentView === 'string') {
            if (currentView.startsWith('playlist:')) {
                const playlistId = currentView.split(':')[1];
                return <PlaylistView playlistId={playlistId} />;
            }
            if (currentView.startsWith('artist:')) {
                const artistName = currentView.split(':')[1];
                return <ArtistView artistName={artistName} onBack={() => setCurrentView('home')} />;
            }
        }

        switch (currentView) {
            case 'home': return <HomeView />;
            case 'favorites': return <FavoritesView />;
            case 'library': return <LibraryView isOpen={true} onClose={() => { }} variant="page" />;
            case 'history': return <HistoryView />;
            case 'settings': return <SettingsView />;
            default: return <HomeView />;
        }
    };

    return (
        <div className="flex min-h-screen font-sans bg-zinc-50 text-zinc-900 dark:bg-black dark:text-white transition-colors duration-300">
            {/* Desktop Sidebar */}
            <Sidebar currentView={currentView} onViewChange={setCurrentView} />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:ml-64 relative h-[100dvh] max-h-[100dvh] overflow-hidden">

                {/* Header - Mobile Only or Adjusted for Desktop */}
                <header
                    className={`absolute top-0 left-2 right-2 flex items-center justify-between px-3 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] bg-white/80 dark:bg-black/90 backdrop-blur-md z-30 border-b border-zinc-200 dark:border-white/5 md:hidden transition-transform duration-300 ${isNavVisible ? 'translate-y-0' : '-translate-y-full'}`}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <img src="music-app.png" alt={t.appName} className="w-8 h-8 rounded-full shadow-lg shadow-primary/20" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">{t.appName}</span>
                    </div>
                </header>

                {/* Desktop Header Actions */}
                <div className="hidden md:flex absolute top-6 right-6 z-20">
                </div>

                {/* View Content */}
                <main
                    onScroll={handleScroll}
                    className="flex-1 px-2 py-2 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-40 md:py-10 md:px-12 md:pb-32 overflow-y-auto scroll-smooth"
                >
                    {renderView()}
                    {children}
                </main>

                {/* Player Bar */}
                <div
                    className={`fixed left-0 right-0 md:left-64 z-40 transition-all duration-300 ease-in-out md:bottom-0 ${isNavVisible ? 'bottom-20' : 'bottom-0 safe-area-bottom'}`}
                >
                    <PlayerControls />
                </div>

                {/* Mobile Bottom Nav */}
                <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                    <BottomNav
                        currentView={currentView}
                        onViewChange={setCurrentView}
                    />
                </div>
            </div>

            <Toast
                message={toastState.message}
                type={toastState.type}
                isVisible={toastState.isVisible}
                onClose={() => setToastState(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
};
