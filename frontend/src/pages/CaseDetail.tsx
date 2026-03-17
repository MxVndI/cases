import { useState, useRef, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { casesApi, inventoryApi, type CaseItem } from "@/services/api";
import { useAuth } from "@/AuthContext";
import { Box, Coins, Check, X, Loader2 } from "lucide-react";

const rarityColors: Record<string, string> = {
    common: "text-gray-400 border-gray-400 bg-gray-400/10",
    rare: "text-blue-400 border-blue-400 bg-blue-400/10",
    epic: "text-purple-400 border-purple-400 bg-purple-400/10",
    legendary: "text-orange-400 border-orange-400 bg-orange-400/10",
    exotic: "text-red-500 border-red-500 bg-red-500/10",
};

/** Helper to get rarity name string from CaseItem */
function getRarity(item: CaseItem): string {
    return typeof item.rarity === 'string' ? item.rarity : item.rarity.name;
}

/** Build a long repeating strip of items for the spinner reel */
function buildReelStrip(items: CaseItem[], totalSlots: number): CaseItem[] {
    const strip: CaseItem[] = [];
    for (let i = 0; i < totalSlots; i++) {
        strip.push(items[Math.floor(Math.random() * items.length)]);
    }
    return strip;
}

const SLOT_W  = 144;
const GAP     = 12;
const CELL    = SLOT_W + GAP;
const REEL_SLOTS = 60;
const WIN_INDEX  = 50;

/** Rarity-specific glow colour */
const rarityGlow: Record<string, string> = {
    common:    "shadow-gray-400/40",
    rare:      "shadow-blue-400/40",
    epic:      "shadow-purple-500/40",
    legendary: "shadow-orange-400/50",
    exotic:    "shadow-red-500/50",
};

/** Rarity border glow for overlay ring */
const rarityBorderGlow: Record<string, string> = {
    common:    "from-gray-400/60 to-gray-400/10",
    rare:      "from-blue-400/60 to-blue-400/10",
    epic:      "from-purple-500/60 to-purple-500/10",
    legendary: "from-orange-400/60 to-orange-400/10",
    exotic:    "from-red-500/60 to-red-500/10",
};

/** Particle colours per rarity */
const rarityParticleColor: Record<string, string> = {
    common:    "bg-gray-400",
    rare:      "bg-blue-400",
    epic:      "bg-purple-500",
    legendary: "bg-orange-400",
    exotic:    "bg-red-500",
};

export function CaseDetail() {
    const shouldReduceMotion = useReducedMotion();
    const { caseId } = useParams({ strict: false });
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isAuthenticated = Boolean(user);

    const resolvedCaseSlug = (() => {
        const raw = caseId ?? "";
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    })();

    const { data: caseItem, isLoading: caseLoading } = useQuery({
        queryKey: ['caseBySlug', resolvedCaseSlug],
        queryFn: async () => {
            try {
                return await casesApi.getBySystemName(resolvedCaseSlug);
            } catch {
                return await casesApi.getByName(resolvedCaseSlug);
            }
        },
        enabled: !!resolvedCaseSlug,
        staleTime: 60_000,
    });

    const caseName = caseItem?.name ?? "Кейс";
    const caseItems: CaseItem[] = caseItem?.case_content?.map(entry => entry.item) ?? [];

    // --- spinner state ---
    const [spinning, setSpinning] = useState(false);
    const [wonItem, setWonItem] = useState<CaseItem | null>(null);
    const [showOverlay, setShowOverlay] = useState(false);
    const [reelStrip, setReelStrip] = useState<CaseItem[]>([]);
    const [reelStarted, setReelStarted] = useState(false);
    const [confirmSell, setConfirmSell] = useState(false);
    const [multiWonItems, setMultiWonItems] = useState<CaseItem[]>([]);
    const [wonEntryIds, setWonEntryIds] = useState<Map<number, string>>(new Map());
    const [soldItems, setSoldItems] = useState<Set<number>>(new Set());
    const [confirmSellIdx, setConfirmSellIdx] = useState<number | null>(null);
    const [openError, setOpenError] = useState<string | null>(null);
    const reelRef = useRef<HTMLDivElement>(null);
    const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingWinnerRef = useRef<CaseItem | null>(null);

    const revealWinner = useCallback(() => {
        setSpinning(false);
        const winner = pendingWinnerRef.current;
        if (winner) {
            setWonItem(winner);
            setShowOverlay(true);
        }
    }, []);

    const skipAnimation = useCallback(() => {
        if (!spinning) return;
        // clear the pending reveal timer
        if (spinTimerRef.current) {
            clearTimeout(spinTimerRef.current);
            spinTimerRef.current = null;
        }
        // snap reel to final position immediately
        if (reelRef.current) {
            const jitter = Math.random() * (CELL * 0.4) - CELL * 0.2;
            const targetX = -(WIN_INDEX * CELL) + jitter;
            reelRef.current.style.transition = "none";
            reelRef.current.style.transform = `translateX(${targetX}px)`;
        }
        revealWinner();
    }, [spinning, revealWinner]);

    const openCase = useCallback(async () => {
        if (spinning || caseItems.length === 0 || !resolvedCaseSlug || !isAuthenticated) return;
        setOpenError(null);

        try {
            const result = caseItem?.system_name
                ? await casesApi.openBySystemName(caseItem.system_name)
                : await casesApi.openByName(resolvedCaseSlug);
            const winner = result.won_item;
            pendingWinnerRef.current = winner;

            // Find the inventory entry ID for the won item (newest matching entry)
            const inv = result.inventory?.items ?? [];
            const matchingEntry = [...inv].reverse().find(e => e.item_id === winner.id);
            if (matchingEntry) {
                setWonEntryIds(new Map([[0, matchingEntry.id]]));
            }

            const strip = buildReelStrip(caseItems, REEL_SLOTS);
            strip[WIN_INDEX] = winner;

            setReelStrip(strip);
            setReelStarted(true);
            setWonItem(null);
            setShowOverlay(false);
            setConfirmSell(false);
            setSpinning(true);

            // Invalidate balance cache
            queryClient.invalidateQueries({ queryKey: ['balance'] });

            if (reelRef.current) {
                reelRef.current.style.transition = "none";
                reelRef.current.style.transform = "translateX(0px)";
            }

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!reelRef.current) return;
                    const jitter = Math.random() * (CELL * 0.4) - CELL * 0.2;
                    const targetX = -(WIN_INDEX * CELL) + jitter;
                    reelRef.current.style.transition = "transform 5s cubic-bezier(0.15, 0.85, 0.20, 1)";
                    reelRef.current.style.transform = `translateX(${targetX}px)`;
                });
            });

            spinTimerRef.current = setTimeout(() => {
                revealWinner();
            }, 5200);
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 402) {
                setOpenError("Недостаточно средств");
            } else if (status === 401) {
                setOpenError("Нужно авторизоваться или зарегистрироваться");
            } else {
                setOpenError("Ошибка при открытии кейса");
            }
        }
    }, [spinning, caseItems, resolvedCaseSlug, isAuthenticated, revealWinner, queryClient, caseItem?.system_name]);

    const closeOverlay = () => {
        setShowOverlay(false);
        setConfirmSell(false);
        setMultiWonItems([]);
        setSoldItems(new Set());
        setConfirmSellIdx(null);
    };

    const handleSell = async () => {
        if (!confirmSell) {
            setConfirmSell(true);
        } else {
            if (multiWonItems.length > 0) {
                // Multi-open: sell all unsold items
                let totalAdded = 0;
                for (let i = 0; i < multiWonItems.length; i++) {
                    if (soldItems.has(i)) continue;
                    const entryId = wonEntryIds.get(i);
                    if (!entryId) continue;
                    try {
                        await inventoryApi.sellItem(entryId);
                        totalAdded += multiWonItems[i].price;
                    } catch { /* ignore */ }
                }
                if (user && totalAdded > 0) {
                    queryClient.setQueryData(['balance', user.id], (old: number | undefined) => (old ?? 0) + totalAdded);
                }
            } else {
                // Single open: sell the one item
                const entryId = wonEntryIds.get(0);
                if (wonItem && entryId) {
                    try {
                        await inventoryApi.sellItem(entryId);
                        if (user) {
                            queryClient.setQueryData(['balance', user.id], (old: number | undefined) => (old ?? 0) + wonItem.price);
                        }
                    } catch { /* ignore */ }
                }
            }
            queryClient.invalidateQueries({ queryKey: ['balance'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setShowOverlay(false);
            setConfirmSell(false);
            setMultiWonItems([]);
            setWonEntryIds(new Map());
            setSoldItems(new Set());
            setConfirmSellIdx(null);
        }
    };

    const handleSellItem = async (idx: number) => {
        if (confirmSellIdx === idx) {
            const item = multiWonItems[idx];
            const entryId = wonEntryIds.get(idx);
            if (item && entryId) {
                try {
                    await inventoryApi.sellItem(entryId);
                    if (user) {
                        queryClient.setQueryData(['balance', user.id], (old: number | undefined) => (old ?? 0) + item.price);
                    }
                    queryClient.invalidateQueries({ queryKey: ['balance'] });
                    queryClient.invalidateQueries({ queryKey: ['inventory'] });
                } catch { /* ignore */ }
            }
            setSoldItems((prev) => new Set(prev).add(idx));
            setConfirmSellIdx(null);
        } else {
            setConfirmSellIdx(idx);
        }
    };

    const openMultiCase = useCallback(async (count: number) => {
        if (spinning || caseItems.length === 0 || !resolvedCaseSlug || !isAuthenticated) return;
        setOpenError(null);

        try {
            const promises = Array.from(
                { length: count },
                () => caseItem?.system_name
                    ? casesApi.openBySystemName(caseItem.system_name)
                    : casesApi.openByName(resolvedCaseSlug)
            );
            const results = await Promise.all(promises);
            const winners = results.map(r => r.won_item);

            // Build entry ID mapping from the last inventory snapshot
            // Each open adds one entry; the last result has the complete inventory
            const lastInv = results[results.length - 1]?.inventory?.items ?? [];
            const entryMap = new Map<number, string>();
            const usedEntryIds = new Set<string>();
            // Match each winner to its inventory entry (newest first)
            for (let i = winners.length - 1; i >= 0; i--) {
                const entry = [...lastInv].reverse().find(
                    e => e.item_id === winners[i].id && !usedEntryIds.has(e.id)
                );
                if (entry) {
                    entryMap.set(i, entry.id);
                    usedEntryIds.add(entry.id);
                }
            }

            // Optimistic balance deduction for multi-open
            if (user && caseItem) {
                queryClient.setQueryData(['balance', user.id], (old: number | undefined) => Math.max(0, (old ?? 0) - caseItem.price * count));
            }

            // Invalidate balance cache
            queryClient.invalidateQueries({ queryKey: ['balance'] });

            setMultiWonItems(winners);
            setWonEntryIds(entryMap);
            setWonItem(null);
            setReelStarted(false);
            setShowOverlay(true);
            setConfirmSell(false);
            setSoldItems(new Set());
            setConfirmSellIdx(null);
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 402) {
                setOpenError("Недостаточно средств");
            } else if (status === 401) {
                setOpenError("Нужно авторизоваться или зарегистрироваться");
            } else {
                setOpenError("Ошибка при открытии кейса");
            }
        }
    }, [spinning, caseItems, resolvedCaseSlug, isAuthenticated, queryClient, caseItem?.system_name]);

    // Determine overlay rarity (best from multi-open, or single item)
    const overlayRarity = wonItem ? getRarity(wonItem)
        : (multiWonItems.length > 0
            ? getRarity(multiWonItems.reduce((best, item) => {
                  const ord: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3, exotic: 4 };
                  return (ord[getRarity(item)] ?? 0) > (ord[getRarity(best)] ?? 0) ? item : best;
              }, multiWonItems[0]))
            : "common");

    // Generate particles — mixed sizes, shapes and trajectories
    const burstParticles = Array.from({ length: 60 }, (_, i) => {
        const angle = (i / 60) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const dist = 80 + Math.random() * 180;
        return {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            delay: i * 0.015,
            size: 3 + Math.random() * 9,
            duration: 0.5 + Math.random() * 0.7,
            isSquare: i % 4 === 0,
        };
    });

    // Secondary ring of slower, larger particles
    const outerParticles = Array.from({ length: 30 }, (_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const dist = 170 + Math.random() * 140;
        return {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            delay: 0.1 + i * 0.025,
            size: 2 + Math.random() * 5,
            duration: 0.9 + Math.random() * 0.6,
        };
    });

    return (
        <div className="relative min-h-screen bg-background">
            <Link
                to="/"
                aria-label="На главную"
                className="peer/home-edge hidden lg:block fixed inset-y-0 left-0 z-10 w-24 cursor-pointer"
            />

            <Link
                to="/"
                className="peer/home hidden lg:block fixed left-8 top-1/2 z-20 -translate-y-1/2 origin-left transform-gpu text-2xl font-semibold text-muted-foreground transition-all duration-300 ease-out hover:scale-110 hover:text-white peer-hover/home-edge:scale-110 peer-hover/home-edge:text-white"
            >
                На главную
            </Link>
            <div
                aria-hidden="true"
                className="hidden lg:block pointer-events-none fixed inset-y-0 left-0 z-0 w-[30vw] max-w-[440px] opacity-0 transition-opacity duration-300 ease-out peer-hover/home:opacity-100 peer-hover/home-edge:opacity-100 bg-[linear-gradient(to_right,rgba(249,115,22,0.11),rgba(251,146,60,0.055)_35%,rgba(255,200,120,0.02)_65%,transparent),conic-gradient(from_290deg_at_0%_50%,rgba(249,115,22,0.06),rgba(251,146,60,0.025),transparent,rgba(249,115,22,0.04))] blur-xl"
            />

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.4,
                        ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
                    }}
                    className="space-y-6"
                >
                    {caseLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        </div>
                    ) : !caseItem ? (
                        <div className="text-center py-32 text-muted-foreground">
                            Кейс не найден
                        </div>
                    ) : (
                    <section className="rounded-3xl border border-border/60 bg-card/80 p-4 sm:p-6 lg:p-8 backdrop-blur-xl shadow-xl shadow-orange-500/5">
                        <h1 className="text-3xl font-bold text-foreground text-center mb-6">{caseName}</h1>

                        {/* ━━━━━━ Spinner reel ━━━━━━ */}
                        <div className="relative w-full rounded-2xl border border-border/60 bg-background/40 p-4 mb-8 overflow-hidden select-none">
                            {/* centre marker — only visible after reel starts */}
                            {reelStarted && (
                                <>
                                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-orange-500 z-20 pointer-events-none" />
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-orange-500" />
                                    </div>
                                </>
                            )}

                            {/* fade edges */}
                            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background/90 to-transparent z-10 pointer-events-none" />
                            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background/90 to-transparent z-10 pointer-events-none" />

                            <div className="overflow-hidden">
                                {!reelStarted ? (
                                    /* Before opening: show case image placeholder */
                                    <div className="flex items-center justify-center h-[152px]">
                                        {caseItem?.img_url ? (
                                            <img src={caseItem.img_url} alt={caseName} className="h-48 w-48 object-contain drop-shadow-lg" />
                                        ) : (
                                            <div className="w-28 h-28 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                                <Box className="h-14 w-14 text-white" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Reel strip */
                                    <div
                                        ref={reelRef}
                                        className="flex gap-3 will-change-transform"
                                        style={{ paddingLeft: "calc(50% - 72px)" }}
                                    >
                                        {reelStrip.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex-shrink-0 w-36 rounded-xl border-2 overflow-hidden transition-colors ${rarityColors[getRarity(item)]}`}
                                            >
                                                <div className="h-28 flex items-center justify-center bg-gradient-to-br from-orange-500/10 via-transparent to-transparent">
                                                    {item.img_url ? <img src={item.img_url} alt={item.name} className="h-28 w-28 object-contain" /> : <Box className="h-10 w-10" />}
                                                </div>
                                                <div className="px-2 py-1.5">
                                                    <p className="text-[11px] font-medium text-foreground text-center truncate">{item.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ━━━━━━ Open / Skip buttons ━━━━━━ */}
                        <div className="mb-8 flex flex-col items-center gap-3">
                            {spinning ? (
                                <button
                                    type="button"
                                    onClick={skipAnimation}
                                    className="cursor-target w-full max-w-xs cursor-pointer rounded-xl border border-border/60 bg-card/80 py-3 text-base font-semibold text-muted-foreground hover:text-foreground hover:border-orange-500/40 transition-all duration-300 ease-out"
                                >
                                    Пропустить
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={openCase}
                                        disabled={!isAuthenticated}
                                        className={`cursor-target group/button w-full max-w-xs rounded-xl py-3 text-base font-semibold transition-all duration-300 ease-out ${
                                            isAuthenticated
                                                ? "cursor-pointer bg-orange-500 text-white hover:bg-white hover:text-black"
                                                : "cursor-not-allowed bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        <span className="grid">
                                            <span className="col-start-1 row-start-1 transition-all duration-300 ease-out opacity-100 translate-y-0 group-hover/button:opacity-0 group-hover/button:-translate-y-1">
                                                Открыть
                                            </span>
                                            <span className="col-start-1 row-start-1 transition-all duration-300 ease-out opacity-0 translate-y-1 group-hover/button:opacity-100 group-hover/button:translate-y-0">
                                                {caseItem?.price ?? "—"} <Coins className="inline h-4 w-4" />
                                            </span>
                                        </span>
                                    </button>
                                    <div className="flex gap-3 w-full max-w-xs">
                                        <button
                                            type="button"
                                            onClick={() => openMultiCase(3)}
                                            disabled={!isAuthenticated}
                                            className={`cursor-target group/btn3 flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all duration-300 ease-out ${
                                                isAuthenticated
                                                    ? "cursor-pointer border-border/60 bg-card/80 text-muted-foreground hover:text-foreground hover:border-orange-500/40"
                                                    : "cursor-not-allowed border-border/40 bg-card/40 text-muted-foreground/70"
                                            }`}
                                        >
                                            <span className="grid">
                                                <span className="col-start-1 row-start-1 transition-all duration-300 ease-out opacity-100 translate-y-0 group-hover/btn3:opacity-0 group-hover/btn3:-translate-y-1">
                                                    Открыть x3
                                                </span>
                                                <span className="col-start-1 row-start-1 transition-all duration-300 ease-out opacity-0 translate-y-1 group-hover/btn3:opacity-100 group-hover/btn3:translate-y-0">
                                                    {((caseItem?.price ?? 0) * 3).toLocaleString()} <Coins className="inline h-3.5 w-3.5" />
                                                </span>
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openMultiCase(5)}
                                            disabled={!isAuthenticated}
                                            className={`cursor-target group/btn5 flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all duration-300 ease-out ${
                                                isAuthenticated
                                                    ? "cursor-pointer border-border/60 bg-card/80 text-muted-foreground hover:text-foreground hover:border-orange-500/40"
                                                    : "cursor-not-allowed border-border/40 bg-card/40 text-muted-foreground/70"
                                            }`}
                                        >
                                            <span className="grid">
                                                <span className="col-start-1 row-start-1 transition-all duration-300 ease-out opacity-100 translate-y-0 group-hover/btn5:opacity-0 group-hover/btn5:-translate-y-1">
                                                    Открыть x5
                                                </span>
                                                <span className="col-start-1 row-start-1 transition-all duration-300 ease-out opacity-0 translate-y-1 group-hover/btn5:opacity-100 group-hover/btn5:translate-y-0">
                                                    {((caseItem?.price ?? 0) * 5).toLocaleString()} <Coins className="inline h-3.5 w-3.5" />
                                                </span>
                                            </span>
                                        </button>
                                    </div>
                                    {!isAuthenticated && (
                                        <p className="text-center text-sm text-muted-foreground mt-1">
                                            Для открытия кейса
                                            {' '}
                                            <Link to="/login" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
                                                войдите
                                            </Link>
                                            {' '}
                                            или
                                            {' '}
                                            <Link to="/register" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
                                                зарегистрируйтесь
                                            </Link>
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        {openError && (
                            <p className="text-center text-red-400 text-sm font-medium mb-6">{openError}</p>
                        )}

                        <h2 className="text-xl font-semibold text-foreground text-center mb-4">Содержимое кейса</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {caseItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                    className={`group/item rounded-2xl border border-border/60 bg-card/80 overflow-hidden backdrop-blur-xl hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300`}
                                >
                                    <div className="relative h-44 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent flex items-center justify-center">
                                        <div className="flex items-center justify-center overflow-visible">
                                            {item.img_url ? <img src={item.img_url} alt={item.name} className="h-[8.75rem] w-[8.75rem] max-w-none object-contain" /> : <Box className="h-12 w-12" />}
                                        </div>
                                        {/* Rarity badge */}
                                        <div
                                            className="absolute top-4 right-4 px-3 py-1 rounded-full bg-transparent border border-white/30 text-xs font-medium"
                                            style={{ color: typeof item.rarity !== 'string' ? item.rarity.color : undefined, borderColor: typeof item.rarity !== 'string' ? `${item.rarity.color}40` : undefined }}
                                        >
                                            {typeof item.rarity === 'string' ? item.rarity : item.rarity.name}
                                        </div>
                                    </div>
                                    <div className="p-4 relative">
                                        <p className="text-sm font-medium text-foreground line-clamp-2 text-center transition-all duration-200 group-hover/item:opacity-0 group-hover/item:-translate-y-1">
                                            {item.name}
                                        </p>
                                        <p className="absolute inset-x-4 top-4 text-center text-sm font-bold text-orange-500 flex items-center justify-center gap-1.5 opacity-0 translate-y-1 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:translate-y-0">
                                            {item.price.toLocaleString()} <Coins className="h-4 w-4" />
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                    )}
                </motion.div>
            </main>

            {/* ━━━━━━ FULLSCREEN WON ITEM OVERLAY ━━━━━━ */}
            <AnimatePresence>
                {showOverlay && (wonItem || multiWonItems.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        onClick={closeOverlay}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

                        {/* Radial glow behind item */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={`absolute w-[500px] h-[500px] rounded-full bg-gradient-radial ${rarityBorderGlow[overlayRarity]} blur-3xl opacity-30`}
                        />

                        {/* Expanding rings */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0.8 }}
                            animate={{ scale: 3, opacity: 0 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className={`absolute w-40 h-40 rounded-full border-2 ${rarityColors[overlayRarity]}`}
                        />
                        <motion.div
                            initial={{ scale: 0, opacity: 0.6 }}
                            animate={{ scale: 4, opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
                            className={`absolute w-32 h-32 rounded-full border ${rarityColors[overlayRarity]}`}
                        />
                        <motion.div
                            initial={{ scale: 0, opacity: 0.5 }}
                            animate={{ scale: 5, opacity: 0 }}
                            transition={{ duration: 1.8, ease: "easeOut", delay: 0.25 }}
                            className={`absolute w-24 h-24 rounded-full border ${rarityColors[overlayRarity]}`}
                        />

                        {/* Burst particles — inner ring, mixed shapes */}
                        {burstParticles.map((p, i) => (
                            <motion.div
                                key={`burst-${i}`}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
                                transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
                                className={`absolute ${p.isSquare ? "rounded-sm rotate-45" : "rounded-full"} ${rarityParticleColor[overlayRarity]}`}
                                style={{ width: p.size, height: p.size }}
                            />
                        ))}

                        {/* Outer slow particles */}
                        {outerParticles.map((p, i) => (
                            <motion.div
                                key={`outer-${i}`}
                                initial={{ x: 0, y: 0, opacity: 0.8, scale: 1.2 }}
                                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
                                transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
                                className={`absolute rounded-full ${rarityParticleColor[overlayRarity]}`}
                                style={{ width: p.size, height: p.size }}
                            />
                        ))}

                        {/* Floating shimmer dots */}
                        {Array.from({ length: 28 }).map((_, i) => {
                            const sz = 2 + Math.random() * 4;
                            return (
                                <motion.div
                                    key={`shimmer-${i}`}
                                    initial={{ y: 60, opacity: 0 }}
                                    animate={{
                                        y: -160 - Math.random() * 260,
                                        opacity: [0, 0.9, 0],
                                        x: (Math.random() - 0.5) * 360,
                                        scale: [0.4, 1.1, 0.2],
                                    }}
                                    transition={{ duration: 2 + Math.random() * 2, delay: 0.2 + i * 0.1, repeat: Infinity, repeatDelay: 0.6 }}
                                    className={`absolute rounded-full ${rarityParticleColor[overlayRarity]}`}
                                    style={{ width: sz, height: sz }}
                                />
                            );
                        })}

                        {/* ━━━ Single item card ━━━ */}
                        {wonItem && multiWonItems.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className="relative z-10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className={`relative w-[min(320px,90vw)] rounded-3xl border-2 bg-card/95 p-5 sm:p-8 backdrop-blur-2xl shadow-2xl ${rarityColors[getRarity(wonItem)]} ${rarityGlow[getRarity(wonItem)]}`}>
                                    <motion.div
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className={`absolute -inset-[2px] rounded-3xl border-2 pointer-events-none ${rarityColors[getRarity(wonItem)]}`}
                                    />
                                    <div className="flex flex-col items-center gap-5">
                                        <motion.div
                                            initial={{ scale: 0, rotate: -10 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 12 }}
                                            className={`w-28 h-28 rounded-2xl flex items-center justify-center border-2 shadow-xl ${rarityColors[getRarity(wonItem)]} ${rarityGlow[getRarity(wonItem)]}`}
                                        >
                                            {wonItem.img_url ? <img src={wonItem.img_url} alt={wonItem.name} className="h-28 w-28 object-contain" /> : <Box className="h-14 w-14" />}
                                        </motion.div>
                                        <motion.p
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-lg font-bold text-foreground text-center leading-snug"
                                        >
                                            {wonItem.name}
                                        </motion.p>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.45, type: "spring", stiffness: 200, damping: 14 }}
                                            className="flex items-center gap-2 text-orange-500 font-bold text-2xl"
                                        >
                                            {wonItem.price.toLocaleString()} <Coins className="h-6 w-6" />
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 }}
                                            className="flex gap-3 w-full mt-1"
                                        >
                                            <AnimatePresence mode="wait">
                                                {confirmSell ? (
                                                    <motion.div key="confirm" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex gap-2 w-full">
                                                        <button onClick={handleSell} className="flex-1 py-2.5 rounded-xl bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5">
                                                            <Check className="h-4 w-4" /> Продать
                                                        </button>
                                                        <button onClick={() => setConfirmSell(false)} className="px-4 py-2.5 rounded-xl bg-card/80 border border-border/60 text-muted-foreground hover:text-foreground text-sm font-medium transition-all duration-200">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.button key="sell" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} onClick={handleSell}
                                                        className="group flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-green-500/15 hover:border-green-500/40 hover:text-green-400 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5"
                                                    >
                                                        <span className="group-hover:hidden flex items-center gap-1.5">Продать</span>
                                                        <span className="hidden group-hover:flex items-center gap-1.5">
                                                            <Coins className="h-3.5 w-3.5" /> Продать за {wonItem.price.toLocaleString()}
                                                        </span>
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ━━━ Multi-open cards ━━━ */}
                        {multiWonItems.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="relative z-10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex flex-col items-center gap-6">
                                    <div className="flex gap-4 flex-wrap justify-center">
                                        {multiWonItems.map((item, idx) => {
                                            const isSold = soldItems.has(idx);
                                            const isConfirming = confirmSellIdx === idx;
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                                >
                                                    <div className={`relative w-36 sm:w-44 rounded-2xl border-2 bg-card/95 p-4 backdrop-blur-2xl shadow-2xl transition-opacity duration-300 ${isSold ? "opacity-50" : ""} ${rarityColors[getRarity(item)]} ${rarityGlow[getRarity(item)]}`}>
                                                        {!isSold && (
                                                            <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className={`absolute -inset-[2px] rounded-2xl border-2 pointer-events-none ${rarityColors[getRarity(item)]}`} />
                                                        )}
                                                        <div className="flex flex-col items-center gap-3">
                                                            <motion.div
                                                                initial={{ scale: 0, rotate: -10 }}
                                                                animate={{ scale: 1, rotate: 0 }}
                                                                transition={{ delay: 0.15 + idx * 0.1, type: "spring", stiffness: 180, damping: 12 }}
                                                                className={`w-16 h-16 rounded-xl flex items-center justify-center border-2 shadow-lg ${rarityColors[getRarity(item)]} ${rarityGlow[getRarity(item)]}`}
                                                            >
                                                                {isSold ? <Check className="h-8 w-8 text-green-400" /> : item.img_url ? <img src={item.img_url} alt={item.name} className="h-14 w-14 object-contain" /> : <Box className="h-8 w-8" />}
                                                            </motion.div>
                                                            <p className="text-xs font-bold text-foreground text-center leading-snug line-clamp-2">{item.name}</p>
                                                            <div className="flex items-center gap-1 text-orange-500 font-bold text-base">
                                                                {item.price.toLocaleString()} <Coins className="h-3.5 w-3.5" />
                                                            </div>
                                                            {/* Per-item sell button */}
                                                            {isSold ? (
                                                                <span className="text-[11px] font-medium text-green-400">Продано</span>
                                                            ) : (
                                                                <AnimatePresence mode="wait">
                                                                    {isConfirming ? (
                                                                        <motion.div key={`c-${idx}`} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} className="flex gap-1.5 w-full">
                                                                            <button onClick={() => handleSellItem(idx)} className="flex-1 py-1.5 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25 text-[11px] font-medium transition-all duration-200 flex items-center justify-center gap-1">
                                                                                <Check className="h-3 w-3" /> Да
                                                                            </button>
                                                                            <button onClick={() => setConfirmSellIdx(null)} className="px-2.5 py-1.5 rounded-lg bg-card/80 border border-border/60 text-muted-foreground hover:text-foreground text-[11px] font-medium transition-all duration-200">
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </motion.div>
                                                                    ) : (
                                                                        <motion.button key={`s-${idx}`} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} onClick={() => handleSellItem(idx)}
                                                                            className="w-full py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-green-500/15 hover:border-green-500/40 hover:text-green-400 text-[11px] font-medium transition-all duration-200 flex items-center justify-center gap-1"
                                                                        >
                                                                            Продать
                                                                        </motion.button>
                                                                    )}
                                                                </AnimatePresence>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: multiWonItems.length * 0.1 + 0.15 }}
                                        className="flex flex-col items-center gap-3"
                                    >
                                        <p className="text-lg font-bold text-foreground flex items-center gap-2">
                                            Итого: {multiWonItems.reduce((s, it, i) => s + (soldItems.has(i) ? 0 : it.price), 0).toLocaleString()} <Coins className="h-5 w-5 text-orange-500" />
                                        </p>
                                        {soldItems.size < multiWonItems.length && (
                                        <div className="flex gap-3">
                                            <AnimatePresence mode="wait">
                                                {confirmSell ? (
                                                    <motion.div key="confirm-multi" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex gap-2">
                                                        <button onClick={handleSell} className="py-2.5 px-6 rounded-xl bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5">
                                                            <Check className="h-4 w-4" /> Продать всё
                                                        </button>
                                                        <button onClick={() => setConfirmSell(false)} className="px-4 py-2.5 rounded-xl bg-card/80 border border-border/60 text-muted-foreground hover:text-foreground text-sm font-medium transition-all duration-200">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.button key="sell-multi" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} onClick={handleSell}
                                                        className="group py-2.5 px-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-green-500/15 hover:border-green-500/40 hover:text-green-400 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5"
                                                    >
                                                        <span className="group-hover:hidden flex items-center gap-1.5">Продать всё</span>
                                                        <span className="hidden group-hover:flex items-center gap-1.5">
                                                            <Coins className="h-3.5 w-3.5" /> Продать за {multiWonItems.reduce((s, it, i) => s + (soldItems.has(i) ? 0 : it.price), 0).toLocaleString()}
                                                        </span>
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        )}
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
