import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ToastProps {
    message: string;
    type?: 'error' | 'success' | 'info';
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    isVisible,
    onClose,
    duration = 5000
}) => {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            default: return <AlertCircle className="w-5 h-5 text-blue-500" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200';
            case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-200';
            default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-200';
        }
    };

    return createPortal(
        <div className="fixed top-0 left-0 right-0 z-[150] flex justify-center px-4 pt-4 pointer-events-none">
            <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${getColors()} max-w-sm w-full`}>
                {getIcon()}
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>,
        document.body
    );
};
