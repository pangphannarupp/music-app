import { Home, Heart, Settings, Radio, Mic } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
    currentView: string;
    onViewChange: (view: 'home' | 'favorites' | 'settings' | 'library' | string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {
    const { t } = useLanguage();

    const menuItems = [
        { id: 'home', icon: Home, label: t.home, canFill: true },
        { id: 'radio', icon: Radio, label: 'Radio', canFill: true },
        { id: 'podcasts', icon: Mic, label: 'Podcasts', canFill: true },
        { id: 'favorites', icon: Heart, label: t.favorites, canFill: true },
        { id: 'settings', icon: Settings, label: t.settings, canFill: false },
    ] as const;

    return (
        <div className="md:hidden w-full bg-white/80 dark:bg-black/80 backdrop-blur-lg px-6 py-4 flex justify-around items-center safe-area-bottom">
            {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`flex flex-col items-center gap-1 transition ${isActive ? 'text-primary' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                    >
                        <Icon className={`w-6 h-6 ${isActive && item.canFill ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
