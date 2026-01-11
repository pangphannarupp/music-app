import React, { useState } from 'react';
import { Trash2, Info, Github, Moon, Sun, Globe, Palette, Monitor } from 'lucide-react';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ConfirmModal } from './ConfirmModal';

export const SettingsView: React.FC = () => {
    const { mode, setMode, color, setColor, predefinedColors } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleClearData = () => {
        localStorage.clear();
        window.location.reload();
    };

    const modeOptions: { id: ThemeMode; icon: any; label: string }[] = [
        { id: 'light', icon: Sun, label: t.light },
        { id: 'dark', icon: Moon, label: t.dark },
        { id: 'system', icon: Monitor, label: t.system },
    ];

    return (
        <div className="w-full max-w-2xl mx-auto pb-20">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 py-2 leading-relaxed">{t.settings}</h2>

            <div className="space-y-6">
                {/* Appearance Section */}
                <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        {t.appearance}
                    </h3>

                    {/* Theme Mode Toggles */}
                    <div className="grid grid-cols-3 gap-2 mb-8 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-white/5">
                        {modeOptions.map((opt) => {
                            const Icon = opt.icon;
                            const isActive = mode === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => setMode(opt.id)}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${isActive
                                        ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Color Picker */}
                    <div className="mb-2">
                        <label className="block text-zinc-500 dark:text-zinc-400 text-sm mb-3">{t.primaryColor}</label>
                        <div className="flex flex-wrap gap-3 items-center">
                            {/* Predefined Colors */}
                            {(Object.entries(predefinedColors)).map(([name, hex]) => (
                                <button
                                    key={name}
                                    onClick={() => setColor(hex)}
                                    className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${color === hex ? 'border-primary scale-110 ring-2 ring-offset-2 ring-primary ring-offset-zinc-900' : 'border-transparent'}`}
                                    style={{ backgroundColor: hex }}
                                    title={name}
                                />
                            ))}

                            {/* Custom Color Input */}
                            <div className="relative group">
                                <div className={`w-8 h-8 rounded-full border-2 overflow-hidden flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 ${!Object.values(predefinedColors).includes(color) ? 'border-primary' : 'border-zinc-300 dark:border-zinc-700'}`}>
                                    <span className="text-xs text-zinc-400">+</span>
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Language Section */}
                <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        {t.language}
                    </h3>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setLanguage('km')}
                            className={`flex-1 py-3 px-4 rounded-xl border transition text-sm font-medium ${language === 'km' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300'}`}
                        >
                            ភាសាខ្មែរ
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={`flex-1 py-3 px-4 rounded-xl border transition text-sm font-medium ${language === 'en' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300'}`}
                        >
                            English
                        </button>
                    </div>
                </div>

                {/* Data Section */}
                <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        {t.clearData}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                        {t.clearDataDesc}
                    </p>
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="px-4 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition font-medium text-sm"
                    >
                        {t.clearData}
                    </button>
                </div>

                {/* About Section */}
                <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        {t.about}
                    </h3>
                    <div className="flex gap-4">
                        <a href="#" className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-primary transition text-sm">
                            <Github className="w-4 h-4" /> {t.sourceCode}
                        </a>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleClearData}
                title={t.clearData}
                description={t.clearDataConfirm}
                confirmLabel={t.clearData}
                cancelLabel={t.cancel}
            />
        </div>
    );
};
