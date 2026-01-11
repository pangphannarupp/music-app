import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    placeholder?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    initialValue?: string;
}

export const InputModal: React.FC<InputModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    placeholder = '',
    confirmLabel = 'Create',
    cancelLabel = 'Cancel',
    initialValue = ''
}) => {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onConfirm(value.trim());
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-white/10 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-white/5">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-1 text-zinc-400 hover:text-red-500 transition rounded-full hover:bg-zinc-100 dark:hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                        autoFocus
                    />

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium transition"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="submit"
                            disabled={!value.trim()}
                            className="px-6 py-2 bg-primary text-white rounded-xl font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
