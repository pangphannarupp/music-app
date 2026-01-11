import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'pink' | 'teal' | 'cyan' | 'indigo' | 'yellow' | 'dynamic';

interface ThemeContextType {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    color: string;
    setColor: (color: string) => void; // Changed to string to accept any hex
    predefinedColors: Record<string, string>;
}

const predefinedColors: Record<string, string> = {
    purple: '#a855f7',
    blue: '#3b82f6',
    green: '#22c55e',
    red: '#ef4444',
    orange: '#f97316',
    pink: '#ec4899',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    indigo: '#6366f1',
    yellow: '#eab308'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>(() => {
        return (localStorage.getItem('theme_mode') as ThemeMode) || 'system';
    });

    const [color, setColor] = useState<string>(() => {
        return localStorage.getItem('theme_color') || '#a855f7';
    });

    // Handle Theme Mode
    useEffect(() => {
        localStorage.setItem('theme_mode', mode);

        const updateTheme = () => {
            const isDark =
                mode === 'dark' ||
                (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

            document.documentElement.classList.toggle('dark', isDark);
        };

        updateTheme();

        if (mode === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', updateTheme);
            return () => mediaQuery.removeEventListener('change', updateTheme);
        }
    }, [mode]);

    // Handle Color
    useEffect(() => {
        localStorage.setItem('theme_color', color);
        document.documentElement.style.setProperty('--color-primary', color);
    }, [color]);

    return (
        <ThemeContext.Provider value={{ mode, setMode, color, setColor, predefinedColors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
