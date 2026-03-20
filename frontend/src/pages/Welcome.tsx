import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Box, Crosshair, Coins } from "lucide-react";
import { casesApi, type CaseData, type RecentWinEntry } from "@/services/api";
import { useRarities } from "@/hooks/useRarities";
import { FilterPanel, PriceRangeInputs, RarityFilterButtons, SortButtons, StatusFilterButtons, TagFilterButtons } from "@/components/filters";
import { useAuth } from "@/AuthContext";

const MAX_PRICE = 600;

type SortMode = "default" | "price-asc" | "price-desc" | "items-asc" | "items-desc" | "status-asc" | "status-desc";
type StatusFilter = "all" | "active" | "disabled";

function normalizeCaseStatus(status?: string): "active" | "disabled" {
    return status === "disabled" ? "disabled" : "active";
}

type FeedCardEntry = RecentWinEntry & {
    renderKey: string;
    isClone: boolean;
};

function formatWinTime(timestamp: string): string {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "только что";
    }

    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

    if (diffSeconds < 60) {
        return `${diffSeconds} сек назад`;
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
        return `${diffMinutes} мин назад`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours <= 24) {
        return `${diffHours} ч назад`;
    }

    return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function buildFeedCards(wins: RecentWinEntry[], targetCount: number): FeedCardEntry[] {
    if (wins.length === 0) {
        return [];
    }

    const cards: FeedCardEntry[] = wins.map((win, index) => ({
        ...win,
        renderKey: `${win.user_id}-${win.item_name}-${win.timestamp}-${index}`,
        isClone: false,
    }));

    let cloneIndex = 0;
    while (cards.length < targetCount) {
        const source = wins[cloneIndex % wins.length];
        cards.push({
            ...source,
            renderKey: `${source.user_id}-${source.item_name}-${source.timestamp}-clone-${cloneIndex}`,
            isClone: true,
        });
        cloneIndex += 1;
    }

    return cards.slice(0, targetCount);
}

export function Welcome() {
    const shouldReduceMotion = useReducedMotion();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [feedSlots, setFeedSlots] = useState(4);
    const isAdmin = user?.role === "admin" || user?.role === "superadmin";

    // Tick every second to keep relative timestamps live
    const [, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    // Fetch cases from API
    const { data: cases = [], isLoading: casesLoading } = useQuery({
        queryKey: ['cases'],
        queryFn: casesApi.getAll,
        staleTime: 60_000,
    });

    // Fetch rarities from API
    const rarities = useRarities();

    // Fetch recent wins from API
    const { data: recentWins = [] } = useQuery({
        queryKey: ['recentWins'],
        queryFn: () => casesApi.getRecentWins(20),
        staleTime: 15_000,
    });

    useEffect(() => {
        let eventSource: EventSource | null = null;
        let reconnectTimer: number | null = null;
        let fallbackTimer: number | null = null;
        let disposed = false;

        const stopFallback = () => {
            if (fallbackTimer !== null) {
                window.clearInterval(fallbackTimer);
                fallbackTimer = null;
            }
        };

        const startFallback = () => {
            if (fallbackTimer !== null) {
                return;
            }
            fallbackTimer = window.setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ['recentWins'] });
            }, 15_000);
        };

        const connect = () => {
            if (disposed) {
                return;
            }

            stopFallback();
            eventSource = new EventSource(casesApi.getRecentWinsStreamUrl(), { withCredentials: false });

            eventSource.onmessage = (event) => {
                try {
                    const win = JSON.parse(event.data) as RecentWinEntry;
                    queryClient.setQueryData<RecentWinEntry[]>(['recentWins'], (current = []) => {
                        const next = [win, ...current].filter((entry, index, list) => {
                            return list.findIndex((candidate) => (
                                candidate.user_id === entry.user_id &&
                                candidate.item_name === entry.item_name &&
                                candidate.timestamp === entry.timestamp
                            )) === index;
                        });
                        return next.slice(0, 20);
                    });
                } catch {
                    queryClient.invalidateQueries({ queryKey: ['recentWins'] });
                }
            };

            eventSource.onerror = () => {
                if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                }
                startFallback();
                if (!disposed && reconnectTimer === null) {
                    reconnectTimer = window.setTimeout(() => {
                        reconnectTimer = null;
                        connect();
                    }, 3_000);
                }
            };
        };

        connect();

        return () => {
            disposed = true;
            stopFallback();
            if (reconnectTimer !== null) {
                window.clearTimeout(reconnectTimer);
            }
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [queryClient]);

    useEffect(() => {
        const computeSlots = () => {
            const width = window.innerWidth;
            if (width >= 1536) {
                setFeedSlots(5);
                return;
            }
            if (width >= 1024) {
                setFeedSlots(4);
                return;
            }
            if (width >= 640) {
                setFeedSlots(3);
                return;
            }
            setFeedSlots(2);
        };

        computeSlots();
        window.addEventListener("resize", computeSlots);
        return () => window.removeEventListener("resize", computeSlots);
    }, []);

    const feedCards = useMemo(
        () => buildFeedCards(recentWins, feedSlots),
        [recentWins, feedSlots],
    );

    // Track feedSlots changes to suppress entry animations on resize
    const prevFeedSlotsRef = useRef(feedSlots);
    const [feedKey, setFeedKey] = useState(0);
    useEffect(() => {
        if (prevFeedSlotsRef.current !== feedSlots) {
            prevFeedSlotsRef.current = feedSlots;
            setFeedKey(k => k + 1);
        }
    }, [feedSlots]);

    // Compute max price dynamically from loaded cases so the filter isn't capped at 600
    const computedMaxPrice = useMemo(() => {
        if (!cases.length) return MAX_PRICE;
        const maxCasePrice = Math.max(...(cases as CaseData[]).map((c) => c.price ?? 0));
        return Math.max(MAX_PRICE, Math.ceil(maxCasePrice / 100) * 100);
    }, [cases]);

    // Price
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(MAX_PRICE);

    const prevComputedMaxRef = useRef(MAX_PRICE);
    useEffect(() => {
        const prev = prevComputedMaxRef.current;
        prevComputedMaxRef.current = computedMaxPrice;
        // Only raise the ceiling if the user hasn't manually restricted priceMax
        setPriceMax((m) => (m >= prev ? computedMaxPrice : m));
    }, [computedMaxPrice]);

    // Rarity
    const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const [showFilters, setShowFilters] = useState(false);

    // Sorting
    const [sortMode, setSortMode] = useState<SortMode>("default");
    const sortOptions: { id?: SortMode; descId?: SortMode; ascId?: SortMode; label: string }[] = [
        { id: "default",    label: "По умолчанию" },
        { descId: "price-desc", ascId: "price-asc", label: "Цена" },
        { descId: "items-desc", ascId: "items-asc", label: "Предметов" },
        ...(isAdmin ? [{ descId: "status-desc" as SortMode, ascId: "status-asc" as SortMode, label: "Статус" }] : []),
    ];

    const visibleCases = useMemo(() => {
        if (isAdmin) {
            return cases;
        }
        return cases.filter((caseItem) => normalizeCaseStatus(caseItem.status) === "active");
    }, [cases, isAdmin]);

    const availableTags = useMemo(() => {
        return Array.from(
            new Set(
                visibleCases
                    .map((caseItem) => caseItem.tag?.trim())
                    .filter((tag): tag is string => Boolean(tag))
            )
        ).sort((a, b) => a.localeCompare(b, "ru"));
    }, [visibleCases]);

    const toggleRarity = (rarity: string) => {
        setSelectedRarities(prev => {
            const next = new Set(prev);
            next.has(rarity) ? next.delete(rarity) : next.add(rarity);
            return next;
        });
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) => {
            const next = new Set(prev);
            next.has(tag) ? next.delete(tag) : next.add(tag);
            return next;
        });
    };

    const resetFilters = () => {
        setPriceMin(0);
        setPriceMax(computedMaxPrice);
        setSelectedRarities(new Set());
        setSelectedTags(new Set());
        setStatusFilter("all");
        setSortMode("default");
    };

    const priceFiltered = priceMin > 0 || priceMax < computedMaxPrice;
    const activeFilterCount =
        (priceFiltered ? 1 : 0) +
        (selectedRarities.size > 0 ? 1 : 0) +
        (selectedTags.size > 0 ? 1 : 0) +
        (isAdmin && statusFilter !== "all" ? 1 : 0) +
        (sortMode !== "default" ? 1 : 0);

    const filteredCases = useMemo(() => {
        let result = visibleCases.filter((c: CaseData) => {
            if (c.price < priceMin) return false;
            if (c.price > priceMax) return false;
            if (selectedRarities.size > 0) {
                const hasRarity = c.case_content.some((entry) =>
                    selectedRarities.has(entry.item.rarity.name)
                );
                if (!hasRarity) return false;
            }
            if (selectedTags.size > 0 && (!c.tag || !selectedTags.has(c.tag))) {
                return false;
            }
            if (isAdmin && statusFilter !== "all" && normalizeCaseStatus(c.status) !== statusFilter) {
                return false;
            }
            return true;
        });

        switch (sortMode) {
            case "price-asc":
                result = [...result].sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                result = [...result].sort((a, b) => b.price - a.price);
                break;
            case "items-desc":
                result = [...result].sort((a, b) => b.case_content.length - a.case_content.length);
                break;
            case "items-asc":
                result = [...result].sort((a, b) => a.case_content.length - b.case_content.length);
                break;
            case "status-desc":
                result = [...result].sort((a, b) => Number(normalizeCaseStatus(b.status) === "active") - Number(normalizeCaseStatus(a.status) === "active"));
                break;
            case "status-asc":
                result = [...result].sort((a, b) => Number(normalizeCaseStatus(a.status) === "active") - Number(normalizeCaseStatus(b.status) === "active"));
                break;
        }

        return result;
    }, [visibleCases, priceMin, priceMax, selectedRarities, selectedTags, isAdmin, statusFilter, sortMode]);

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Заголовок */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Лента последних выпадений
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Смотрите, что выпадает другим игрокам прямо сейчас
                    </p>
                </div>

                {/* Recent wins conveyor */}
                {feedCards.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1] }}
                    className="mb-8"
                >
                    <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-4 sm:px-5 sm:py-5 backdrop-blur-xl overflow-visible">
                        <div className="flex items-stretch gap-3 overflow-visible">
                            <AnimatePresence key={feedKey} initial={false} mode="popLayout">
                            {feedCards.map((win) => (
                                <motion.div
                                    key={win.renderKey}
                                    layout
                                    initial={win.isClone ? false : { opacity: 0, x: -120, scale: 0.92, rotate: -1.5 }}
                                    animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, x: 120, scale: 0.92 }}
                                    whileHover={undefined}
                                    transition={{
                                        layout: { duration: shouldReduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] },
                                        duration: shouldReduceMotion ? 0 : 0.45,
                                    }}
                                    className="cursor-target card-hover group relative min-w-0 flex-1 basis-0 rounded-2xl border border-border/60 bg-card/80 p-3 sm:p-4 overflow-hidden backdrop-blur-xl hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 text-left"
                                >
                                    {win.user_nickname && !win.isClone ? (
                                        <Link
                                            to="/user/$userName"
                                            params={{ userName: win.user_nickname }}
                                            aria-label={`Открыть профиль пользователя ${win.user_nickname}`}
                                            className="absolute inset-0 z-20 bg-transparent active:bg-transparent focus:bg-transparent focus-visible:outline-none focus-visible:ring-0 [-webkit-tap-highlight-color:transparent]"
                                        />
                                    ) : null}
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent" />
                                    <div className="relative z-10 flex items-center gap-3">
                                        <div
                                            className={`h-16 w-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
                                                win.item_img_url
                                                    ? "bg-transparent"
                                                    : "bg-orange-500 shadow-lg shadow-orange-500/30"
                                            }`}
                                        >
                                            {win.item_img_url ? (
                                                <img src={win.item_img_url} alt={win.item_name} className="h-16 w-16 object-contain" />
                                            ) : (
                                                <Crosshair className="h-6 w-6 text-white" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold truncate text-orange-500">{win.item_name}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground truncate">{win.case_name}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{formatWinTime(win.timestamp)}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
                )}

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05, ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1] }}
                    className="mb-6"
                >
                    <FilterPanel
                        open={showFilters}
                        onToggle={() => setShowFilters(!showFilters)}
                        filterCount={activeFilterCount}
                        onReset={resetFilters}
                    >
                        <PriceRangeInputs min={priceMin} max={priceMax} onMinChange={setPriceMin} onMaxChange={setPriceMax} maxValue={computedMaxPrice} />

                        {/* Сортировка */}
                        <SortButtons options={sortOptions} current={sortMode} onChange={setSortMode} label="Сортировка" />

                        {/* Редкость */}
                        <div>
                            <p className="text-sm font-medium text-foreground mb-2">Редкость</p>
                            <RarityFilterButtons rarities={rarities} selected={selectedRarities} onToggle={toggleRarity} />
                        </div>

                        {availableTags.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-foreground mb-2">Теги</p>
                                <TagFilterButtons tags={availableTags} selected={selectedTags} onToggle={toggleTag} />
                            </div>
                        )}

                        {isAdmin && (
                            <div>
                                <p className="text-sm font-medium text-foreground mb-2">Статус кейса</p>
                                <StatusFilterButtons current={statusFilter} onChange={setStatusFilter as (v: string) => void} />
                            </div>
                        )}
                    </FilterPanel>
                </motion.div>

                {/* Cases grid */}
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1] }}
                    className="mb-12"
                >
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Кейсы
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Выберите кейс и испытайте удачу
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {casesLoading ? (
                            <div className="col-span-full text-center py-16">
                                <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                                <p className="text-muted-foreground text-sm">Загрузка кейсов...</p>
                            </div>
                        ) : filteredCases.map((caseItem, index) => (
                            <Link
                                key={caseItem.id}
                                to="/cases/$caseId"
                                params={{ caseId: caseItem.system_name ?? caseItem.name }}
                                className="block h-full"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.05, ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1] }}
                                    whileHover={undefined}
                                    className="cursor-target card-hover group h-full rounded-2xl border border-border/60 bg-card/80 overflow-hidden backdrop-blur-xl hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 flex flex-col cursor-pointer"
                                >
                                    <div className="relative h-48 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent p-6">
                                        {caseItem.tag && (
                                            <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-transparent border border-white/30 text-xs font-medium text-white">
                                                {caseItem.tag}
                                            </div>
                                        )}
                                        {isAdmin && normalizeCaseStatus(caseItem.status) === "disabled" && (
                                            <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-xs font-medium text-red-300">
                                                Отключен
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {caseItem.img_url ? (
                                                <img src={caseItem.img_url} alt={caseItem.name} className="w-48 h-48 object-contain" />
                                            ) : (
                                                <div className="w-40 h-40 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                                    <Box className="h-16 w-16 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="text-lg font-semibold text-foreground mb-2">
                                            {caseItem.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {caseItem.case_content.length} предметов
                                        </p>

                                        <div className="mt-auto flex items-center justify-center w-full py-3 rounded-xl bg-orange-500 text-white group-hover:bg-white group-hover:text-black font-medium transition-colors duration-100 ease-out overflow-hidden">
                                            <span className="group-hover:hidden">Подробнее</span>
                                            <span className="hidden group-hover:flex items-center gap-1.5">
                                                {caseItem.price} <Coins className="h-4 w-4" />
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>

                    {filteredCases.length === 0 && (
                        <div className="text-center py-16">
                            <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">Нет кейсов</h3>
                            <p className="text-muted-foreground text-sm">Попробуйте изменить фильтры</p>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
