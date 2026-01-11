import React from 'react';
import { motion } from 'framer-motion';

interface PlayingAnimationProps {
    isPlaying: boolean;
    color?: string; // Tailwind color class e.g. "bg-primary" or "bg-white"
}

export const PlayingAnimation: React.FC<PlayingAnimationProps> = ({ isPlaying, color = "bg-primary" }) => {
    // Animation variants for the bars
    const barVariants: any = {
        playing: (i: number) => ({
            height: [4, 16, 8, 20, 4],
            transition: {
                repeat: Infinity,
                duration: 0.8,
                ease: "easeInOut",
                delay: i * 0.2, // Stagger effect
            },
        }),
        paused: {
            height: 4,
            transition: {
                duration: 0.2,
            },
        },
    };

    return (
        <div className="flex items-end gap-1 h-5 w-6 pb-1">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    custom={i}
                    variants={barVariants}
                    animate={isPlaying ? "playing" : "paused"}
                    className={`w-1.5 rounded-full ${color}`}
                />
            ))}
        </div>
    );
};
