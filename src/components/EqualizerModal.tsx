import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { X, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EqualizerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ isOpen, onClose }) => {
    const { eqBands, setEqBand, currentPreset, setPreset } = usePlayer();

    const presets = [
        { id: 'flat', name: 'Flat' },
        { id: 'bass', name: 'Bass Boost' },
        { id: 'rock', name: 'Rock' },
        { id: 'pop', name: 'Pop' },
        { id: 'vocal', name: 'Vocal' },
        { id: 'classical', name: 'Classical' },
    ];

    // Frequencies for display (standard 5-band)
    const frequencies = ['60Hz', '230Hz', '910Hz', '4kHz', '14kHz'];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl z-10 border border-zinc-200 dark:border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Sliders className="w-5 h-5" />
                                Equalizer
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition text-zinc-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Presets */}
                            <div className="mb-8">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block">Presets</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {presets.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setPreset(p.id)}
                                            className={`px-3 py-2 text-sm rounded-lg border transition ${currentPreset === p.id
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary/50'
                                                }`}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sliders */}
                            <div className="flex justify-between items-end h-48 gap-4">
                                {eqBands.map((gain, index) => (
                                    <div key={index} className="flex flex-col items-center h-full w-full gap-2 group">
                                        {/* Gain Value Label */}
                                        <span className="text-xs font-medium text-zinc-400 opacity-0 group-hover:opacity-100 transition">
                                            {gain > 0 ? '+' : ''}{gain}dB
                                        </span>

                                        <div className="relative flex-1 w-2 bg-zinc-200 dark:bg-zinc-800 rounded-full flex justify-center">
                                            {/* Fill */}
                                            <div
                                                className="absolute bottom-1/2 w-full bg-primary/30 rounded-full"
                                                style={{
                                                    height: `${Math.abs(gain) / 12 * 50}%`,
                                                    bottom: gain > 0 ? '50%' : undefined,
                                                    top: gain < 0 ? '50%' : undefined
                                                }}
                                            />
                                            {/* Thumb (Input) */}
                                            <input
                                                type="range"
                                                min="-12"
                                                max="12"
                                                step="1"
                                                value={gain}
                                                onChange={(e) => setEqBand(index, parseInt(e.target.value))}
                                                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-10 appearance-vertical"
                                                style={{ WebkitAppearance: 'slider-vertical' as any }}
                                            />
                                            {/* Visible Thumb Handle */}
                                            <div
                                                className="absolute w-4 h-4 bg-primary rounded-full shadow-md pointer-events-none transition-all duration-75"
                                                style={{
                                                    bottom: `${((gain + 12) / 24) * 100}%`,
                                                    transform: 'translateY(50%)'
                                                }}
                                            />
                                        </div>

                                        <span className="text-xs font-bold text-zinc-500 mt-2">{frequencies[index]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
