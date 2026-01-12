import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
    analyser: AnalyserNode | null;
    isPlaying: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!analyser || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configuration
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let animationId: number;

        const draw = () => {
            animationId = requestAnimationFrame(draw);

            if (!isPlaying) {
                // clear if paused
                // ctx.clearRect(0, 0, canvas.width, canvas.height); // Optional: keep last frame or clear
                // return;
                // Keep drawing to fade out or just stop? Let's keep drawing so it freezes or looks natural.
                // Actually if paused, data might freeze. using isPlaying as dependency might kill animation loop.
            }

            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const width = canvas.width;
            const height = canvas.height;
            // Draw Mirrored Spectrum for aesthetics
            // We'll draw from center out or just normal bars
            // Let's do simple bars first.

            const barWidth = (width / bufferLength) * 2;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                // Enhance high frequencies visually
                // const val = dataArray[i]; 
                const barHeight = (dataArray[i] / 255) * height * 0.8;

                // Styling
                const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)'); // Fade at bottom
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)'); // Bright at top

                ctx.fillStyle = gradient;

                // Rounded caps?
                ctx.beginPath();
                // Draw bar
                ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
                ctx.fill();

                x += barWidth;
            }
        };

        if (isPlaying) {
            draw();
        } else {
            // Optional: Draw one frame of silence or keep last frame
            // analyzer data is likely 0 if paused
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        return () => cancelAnimationFrame(animationId);
    }, [analyser, isPlaying]);

    // Responsive canvas
    useEffect(() => {
        const resize = () => {
            if (canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                if (parent) {
                    canvasRef.current.width = parent.clientWidth;
                    canvasRef.current.height = parent.clientHeight;
                }
            }
        }
        window.addEventListener('resize', resize);
        resize();
        return () => window.removeEventListener('resize', resize);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full absolute inset-0 pointer-events-none z-0"
        />
    );
};
