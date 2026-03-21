import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";

/* ── Glitch text ── */
function GlitchText({ text }: { text: string }) {
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const id = setInterval(() => {
            setOffset({ x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 4 });
            setTimeout(() => setOffset({ x: 0, y: 0 }), 100);
        }, 3000);
        return () => clearInterval(id);
    }, []);

    return (
        <span className="relative inline-block">
            {/* Cyan shadow layer */}
            <span
                className="absolute inset-0 text-cyan-400/40 select-none"
                aria-hidden
                style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
            >
                {text}
            </span>
            {/* Red shadow layer */}
            <span
                className="absolute inset-0 text-red-400/40 select-none"
                aria-hidden
                style={{ transform: `translate(${-offset.x}px, ${-offset.y}px)` }}
            >
                {text}
            </span>
            {/* Main */}
            <span className="relative">{text}</span>
        </span>
    );
}

export function NotFound() {
    const shouldReduceMotion = useReducedMotion();
    const t = shouldReduceMotion ? { duration: 0 } : undefined;

    return (
        <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-180px)] overflow-hidden px-4 py-12 select-none">
            {/* Radial glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-orange-500/5 blur-3xl" />
            </div>

            {/* Main content */}
            <motion.div
                className="relative z-10 flex flex-col items-center gap-6 text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={t ?? { duration: 0.6 }}
            >
                {/* Big 404 */}
                <motion.h1
                    className="text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600/40 bg-clip-text text-transparent"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={t ?? { type: "spring", stiffness: 100, damping: 12, delay: 0.1 }}
                >
                    <GlitchText text="404" />
                </motion.h1>

                {/* Subtitle */}
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={t ?? { delay: 0.3, duration: 0.5 }}
                >
                    <p className="text-xl sm:text-2xl font-semibold text-foreground/90">
                        Кейс не найден
                    </p>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                        Попробуйте вернуться на главную и поискать снова.
                    </p>
                </motion.div>

                {/* Decorative scan-line */}
                {!shouldReduceMotion && (
                    <motion.div
                        className="w-64 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: [0, 1, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}
            </motion.div>
        </div>
    );
}
