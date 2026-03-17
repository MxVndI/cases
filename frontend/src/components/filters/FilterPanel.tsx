import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";

interface FilterPanelProps {
    /** Whether the panel is currently open */
    open: boolean;
    /** Toggle open/closed */
    onToggle: () => void;
    /** Number of active filters (shown as badge) */
    filterCount: number;
    /** Reset all filters */
    onReset: () => void;
    /** Content rendered inside the collapsible panel */
    children: ReactNode;
    /**
     * "standalone" = full-width filter section (Welcome.tsx style)
     * "inline" = inside a card header (Profile.tsx / UserProfile.tsx style)
     */
    variant?: "standalone" | "inline";
}

export function FilterPanel({
    open,
    onToggle,
    filterCount,
    onReset,
    children,
    variant = "standalone",
}: FilterPanelProps) {
    if (variant === "inline") {
        return (
            <>
                <button
                    onClick={onToggle}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                        open
                            ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                            : "bg-card/80 border-border/60 text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
                    }`}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Фильтры
                    {filterCount > 0 && (
                        <span className="ml-1 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {filterCount}
                        </span>
                    )}
                </button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden w-full"
                        >
                            <div className="pt-4 mt-4 border-t border-border/40 space-y-4">
                                {children}
                                {filterCount > 0 && (
                                    <button
                                        onClick={onReset}
                                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="h-3 w-3" /> Сбросить фильтры
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        );
    }

    // standalone variant
    return (
        <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <button
                    onClick={onToggle}
                    className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        open
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-card/80 border-border/60 text-muted-foreground hover:text-foreground hover:border-orange-500/30"
                    }`}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Фильтры
                    {filterCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                            {filterCount}
                        </span>
                    )}
                </button>

                {filterCount > 0 && (
                    <button
                        onClick={onReset}
                        className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-xl bg-card/80 border border-border/60 text-xs text-muted-foreground hover:text-orange-500 hover:border-orange-500/30 transition-all duration-200"
                    >
                        <X className="h-3.5 w-3.5" /> Сбросить
                    </button>
                )}
            </div>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="filter-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-6 backdrop-blur-xl space-y-6">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
