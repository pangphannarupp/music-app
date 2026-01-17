import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void> | void;
    children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const pullThreshold = 100;
    const startY = useRef(0);
    const isPulling = useRef(false);

    // Transform y value to rotation for the icon
    const rotate = useTransform(y, [0, pullThreshold], [0, 360]);
    const opacity = useTransform(y, [0, pullThreshold / 2, pullThreshold], [0, 0.5, 1]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e: TouchEvent) => {
            if (container.scrollTop === 0) {
                startY.current = e.touches[0].clientY;
                isPulling.current = false;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            const currentY = e.touches[0].clientY;
            const dy = currentY - startY.current;

            if (container.scrollTop === 0 && dy > 0) {
                isPulling.current = true;
                // Prevent default pulling behavior if we are handling it
                if (e.cancelable) e.preventDefault();

                // Add resistance
                const dampedY = Math.min(dy * 0.5, pullThreshold * 1.5);
                y.set(dampedY);
            } else {
                isPulling.current = false;
            }
        };

        const handleTouchEnd = async () => {
            if (!isPulling.current) return;

            const currentPullHeight = y.get();
            if (currentPullHeight > pullThreshold) {
                setIsRefreshing(true);
                // Snap to loading position
                animate(y, 80, { type: "spring", stiffness: 300, damping: 30 });

                await onRefresh();

                setIsRefreshing(false);
                animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
            } else {
                // Snap back to 0
                animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
            }
            isPulling.current = false;
        };

        // Add non-passive event listener to prevent default scroll
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [y, onRefresh, pullThreshold]);

    return (
        <div className="relative w-full h-full overflow-hidden">
            <motion.div
                className="absolute top-0 left-0 right-0 flex justify-center items-center h-20 -mt-20 z-10"
                style={{ y, opacity }}
            >
                <motion.div style={{ rotate }}>
                    <RefreshCw className={`w-6 h-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
                </motion.div>
            </motion.div>

            <motion.div
                ref={containerRef}
                style={{ y }}
                className="h-full overflow-y-auto overscroll-none"
            >
                {children}
            </motion.div>
        </div>
    );
};
