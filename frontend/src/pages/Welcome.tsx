import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Box, SlidersHorizontal, Coins, X, ArrowUpDown, ChevronDown } from "lucide-react";
import { dummyCases, dummyRecentWins } from "@/data/dummy-data";

const conveyorItems = [...dummyRecentWins, ...dummyRecentWins];

const MAX_PRICE_SLIDER = 600;

const PRICE_PRESETS = [
    { label: "Все",     min: 0,   max: MAX_PRICE_SLIDER },
    { label: "до 100",  min: 0,   max: 100 },
    { label: "100–200", min: 100, max: 200 },
    { label: "200–500", min: 200, max: 500 },
    { label: "500+",    min: 500, max: MAX_PRICE_SLIDER },
];

const rarityFilters = [
    { id: "common"    as const, label: "Обычное",      color: "border-gray-400   text-gray-400",   active: "bg-gray-400/15   border-gray-400   text-gray-300"   },
    { id: "rare"      as const, label: "Редкое",       color: "border-blue-400   text-blue-400",   active: "bg-blue-400/15   border-blue-400   text-blue-300"   },
    { id: "epic"      as const, label: "Эпическое",    color: "border-purple-400 text-purple-400", active: "bg-purple-400/15 border-purple-400 text-purple-300" },
    { id: "legendary" as const, label: "Легендарное",  color: "border-orange-400 text-orange-400", active: "bg-orange-400/15 border-orange-400 text-orange-300" },
    { id: "exotic"    as const, label: "Экзотическое", color: "border-red-500    text-red-500",    active: "bg-red-500/15    border-red-500    text-red-400"    },
];

const categoryFilters = [
    { id: "Оружие",    label: "Оружие"    },
    { id: "Ножи",      label: "Ножи"      },
    { id: "Перчатки",  label: "Перчатки"  },
    { id: "Агенты",    label: "Агенты"    },
    { id: "Наклейки",  label: "Наклейки"  },
];

/** Sub-type filters per category (weapon name prefixes) */
const weaponSubTypes: Record<string, string[]> = {
    "Оружие":    ["AK-47", "AWP", "M4A4", "M4A1-S"],
    "Ножи":      ["Karambit", "M9 Bayonet", "Butterfly Knife", "Huntsman Knife", "Flip Knife", "Gut Knife"],
    "Перчатки":  ["Sport Gloves", "Driver Gloves", "Hand Wraps", "Moto Gloves", "Specialist Gloves"],
    "Агенты":    [],
    "Наклейки":  [],
};

type Rarity = "common" | "rare" | "epic" | "legendary" | "exotic";
type SortMode = "default" | "price-asc" | "price-desc" | "popular";

/** Simulated popularity scores */
const popularityMap: Record<string, number> = {
    "3": 95, "5": 90, "6": 85, "2": 80, "1": 75, "4": 70, "7": 60, "8": 55,
};

export function Welcome() {
    const shouldReduceMotion = useReducedMotion();

    // Price
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(MAX_PRICE_SLIDER);

    // Rarity
    const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set());

    // Categories
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    // Weapon sub-types (e.g. "AK-47", "AWP")
    const [selectedSubTypes, setSelectedSubTypes] = useState<Set<string>>(new Set());

    const [showFilters, setShowFilters] = useState(false);

    // Sorting
    const [sortMode, setSortMode] = useState<SortMode>("default");
    const sortOptions: { id: SortMode; label: string }[] = [
        { id: "default",    label: "По умолчанию" },
        { id: "price-asc",  label: "Цена ↑" },
        { id: "price-desc", label: "Цена ↓" },
        { id: "popular",    label: "Популярные" },
    ];

    // active preset: index whose min/max matches current slider
    const activePreset = PRICE_PRESETS.findIndex(p => p.min === priceMin && p.max === priceMax);

    const selectPreset = (idx: number) => {
        setPriceMin(PRICE_PRESETS[idx].min);
        setPriceMax(PRICE_PRESETS[idx].max);
    };

    const toggleRarity = (rarity: Rarity) => {
        setSelectedRarities(prev => {
            const next = new Set(prev);
            next.has(rarity) ? next.delete(rarity) : next.add(rarity);
            return next;
        });
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) {
                next.delete(cat);
                // Also clear sub-types for this category
                setSelectedSubTypes(prevSub => {
                    const subs = weaponSubTypes[cat] || [];
                    const nextSub = new Set(prevSub);
                    subs.forEach(s => nextSub.delete(s));
                    return nextSub;
                });
            } else {
                next.add(cat);
            }
            return next;
        });
    };

    const toggleSubType = (sub: string) => {
        setSelectedSubTypes(prev => {
            const next = new Set(prev);
            next.has(sub) ? next.delete(sub) : next.add(sub);
            return next;
        });
    };

    const handlePriceMinInput = (raw: string) => {
        const v = Math.max(0, Math.min(Number(raw) || 0, priceMax - 10));
        setPriceMin(v);
    };

    const handlePriceMaxInput = (raw: string) => {
        const v = Math.min(MAX_PRICE_SLIDER, Math.max(Number(raw) || 0, priceMin + 10));
        setPriceMax(v);
    };

    const resetFilters = () => {
        setPriceMin(0);
        setPriceMax(MAX_PRICE_SLIDER);
        setSelectedRarities(new Set());
        setSelectedCategories(new Set());
        setSelectedSubTypes(new Set());
        setSortMode("default");
    };

    const priceFiltered = priceMin > 0 || priceMax < MAX_PRICE_SLIDER;
    const activeFilterCount =
        (priceFiltered ? 1 : 0) +
        (selectedRarities.size > 0 ? 1 : 0) +
        (selectedCategories.size > 0 ? 1 : 0) +
        (selectedSubTypes.size > 0 ? 1 : 0) +
        (sortMode !== "default" ? 1 : 0);

    const filteredCases = useMemo(() => {
        let result = dummyCases.filter(c => {
            if (c.price < priceMin) return false;
            if (c.price > priceMax) return false;
            if (selectedCategories.size > 0 && !selectedCategories.has(c.category)) return false;
            if (selectedRarities.size > 0) {
                const hasRarity = c.items.some(item => selectedRarities.has(item.rarity));
                if (!hasRarity) return false;
            }
            // Sub-type filter: at least one item matches a selected sub-type prefix
            if (selectedSubTypes.size > 0) {
                const hasSubType = c.items.some(item =>
                    Array.from(selectedSubTypes).some(sub => item.name.startsWith(sub))
                );
                if (!hasSubType) return false;
            }
            return true;
        });

        // Sorting
        if (sortMode === "price-asc") {
            result = [...result].sort((a, b) => a.price - b.price);
        } else if (sortMode === "price-desc") {
            result = [...result].sort((a, b) => b.price - a.price);
        } else if (sortMode === "popular") {
            result = [...result].sort((a, b) => (popularityMap[b.id] ?? 0) - (popularityMap[a.id] ?? 0));
        }

        return result;
    }, [priceMin, priceMax, selectedRarities, selectedCategories, selectedSubTypes, sortMode]);

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
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1] }}
                    className="mb-8"
                >
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur-xl overflow-hidden">
                        <motion.div
                            className="flex gap-3 w-max"
                            animate={shouldReduceMotion ? undefined : { x: ["0%", "-50%"] }}
                            transition={shouldReduceMotion ? undefined : { duration: 18, repeat: Infinity, ease: "linear" }}
                        >
                            {conveyorItems.map((win, index) => (
                                <Link
                                    key={`${win.player}-${win.item}-${index}`}
                                    to="/user/$userId"
                                    params={{ userId: win.userId }}
                                    className="block"
                                >
                                    <motion.div
                                        whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
                                        transition={{ duration: 0.2 }}
                                        className="group relative min-w-[300px] rounded-2xl border border-border/60 bg-card/80 p-4 overflow-hidden backdrop-blur-xl hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer text-left"
                                    >
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent" />
                                        <div className="relative z-10 flex items-start gap-3">
                                            <div className="h-14 w-14 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                                                <Box className="h-7 w-7 text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate group-hover:text-orange-500 transition-colors">{win.player}</p>
                                                <p className="text-xs text-muted-foreground truncate">{win.caseName}</p>
                                                <p className="mt-1 text-sm font-medium text-orange-500 truncate">{win.item}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05, ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1] }}
                    className="mb-6"
                >
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                                showFilters
                                    ? "bg-orange-500 border-orange-500 text-white"
                                    : "bg-card/80 border-border/60 text-muted-foreground hover:text-foreground hover:border-orange-500/30"
                            }`}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Фильтры
                            {activeFilterCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Active filter chips */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-xl bg-card/80 border border-border/60 text-xs text-muted-foreground hover:text-orange-500 hover:border-orange-500/30 transition-all duration-200"
                            >
                                <X className="h-3.5 w-3.5" /> Сбросить
                            </button>
                        )}
                    </div>

                    <AnimatePresence initial={false}>
                        {showFilters && (
                            <motion.div
                                key="filter-panel"
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl space-y-6">
                                    {/* Цена кейса */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-medium text-foreground">Цена кейса</p>
                                            {priceFiltered && (
                                                <span className="flex items-center gap-1 text-sm font-semibold text-orange-500">
                                                    {priceMin}–{priceMax} <Coins className="h-3.5 w-3.5" />
                                                </span>
                                            )}
                                        </div>

                                        {/* Preset buttons */}
                                        <div className="flex flex-wrap gap-2 mb-5">
                                            {PRICE_PRESETS.map((preset, idx) => (
                                                <button
                                                    key={preset.label}
                                                    onClick={() => selectPreset(idx)}
                                                    className={`cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                        activePreset === idx
                                                            ? "bg-orange-500 text-white"
                                                            : "bg-background/50 text-muted-foreground border border-border/60 hover:border-orange-500/30 hover:text-foreground"
                                                    }`}
                                                >
                                                    {preset.label}
                                                    {idx > 0 && <Coins className="h-3 w-3 opacity-70" />}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Dual range slider */}
                                        <style>{`
                                            .range-thumb { pointer-events: none; }
                                            .range-thumb::-webkit-slider-thumb { pointer-events: auto; cursor: pointer; }
                                            .range-thumb::-moz-range-thumb { pointer-events: auto; cursor: pointer; }
                                        `}</style>
                                        <div className="relative h-6 flex items-center mb-4">
                                            <div className="absolute inset-x-0 h-1.5 rounded-full bg-border/60" />
                                            <div
                                                className="absolute h-1.5 rounded-full bg-orange-500 pointer-events-none"
                                                style={{
                                                    left: `${(priceMin / MAX_PRICE_SLIDER) * 100}%`,
                                                    right: `${100 - (priceMax / MAX_PRICE_SLIDER) * 100}%`,
                                                }}
                                            />
                                            <input
                                                type="range"
                                                min={0}
                                                max={MAX_PRICE_SLIDER}
                                                step={10}
                                                value={priceMin}
                                                onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax - 10))}
                                                className="range-thumb absolute inset-0 w-full h-full appearance-none bg-transparent"
                                            />
                                            <input
                                                type="range"
                                                min={0}
                                                max={MAX_PRICE_SLIDER}
                                                step={10}
                                                value={priceMax}
                                                onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin + 10))}
                                                className="range-thumb absolute inset-0 w-full h-full appearance-none bg-transparent"
                                            />
                                        </div>

                                        {/* Manual inputs */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-3 py-2 focus-within:border-orange-500/50 transition-colors">
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">от</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={priceMax - 10}
                                                    step={10}
                                                    value={priceMin}
                                                    onChange={e => handlePriceMinInput(e.target.value)}
                                                    className="w-full bg-transparent text-sm text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <Coins className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                                            </div>
                                            <span className="text-muted-foreground text-sm">—</span>
                                            <div className="flex-1 flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-3 py-2 focus-within:border-orange-500/50 transition-colors">
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">до</span>
                                                <input
                                                    type="number"
                                                    min={priceMin + 10}
                                                    max={MAX_PRICE_SLIDER}
                                                    step={10}
                                                    value={priceMax}
                                                    onChange={e => handlePriceMaxInput(e.target.value)}
                                                    className="w-full bg-transparent text-sm text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <Coins className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Сортировка */}
                                    <div>
                                        <p className="text-sm font-medium text-foreground mb-2">Сортировка</p>
                                        <div className="flex flex-wrap gap-2">
                                            {sortOptions.map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setSortMode(opt.id)}
                                                    className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                                                        sortMode === opt.id
                                                            ? "bg-orange-500 border-orange-500 text-white"
                                                            : "bg-background/50 border-border/60 text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
                                                    }`}
                                                >
                                                    <ArrowUpDown className="h-3 w-3" />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Тип содержимого */}
                                    <div>
                                        <p className="text-sm font-medium text-foreground mb-2">Тип содержимого</p>
                                        <div className="flex flex-wrap gap-2">
                                            {categoryFilters.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => toggleCategory(cat.id)}
                                                    className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                                                        selectedCategories.has(cat.id)
                                                            ? "bg-orange-500 border-orange-500 text-white"
                                                            : "bg-background/50 border-border/60 text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
                                                    }`}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Sub-types for selected categories */}
                                        {Array.from(selectedCategories).map(cat => {
                                            const subs = weaponSubTypes[cat];
                                            if (!subs || subs.length === 0) return null;
                                            return (
                                                <div key={cat} className="mt-3 ml-2 pl-3 border-l-2 border-orange-500/30">
                                                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                                                        <ChevronDown className="h-3 w-3" /> {cat}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {subs.map(sub => (
                                                            <button
                                                                key={sub}
                                                                onClick={() => toggleSubType(sub)}
                                                                className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${
                                                                    selectedSubTypes.has(sub)
                                                                        ? "bg-orange-500/80 border-orange-500 text-white"
                                                                        : "bg-background/50 border-border/60 text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
                                                                }`}
                                                            >
                                                                {sub}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Редкость дропа */}
                                    <div>
                                        <p className="text-sm font-medium text-foreground mb-2">Редкость дропа</p>
                                        <div className="flex flex-wrap gap-2">
                                            {rarityFilters.map(r => (
                                                <button
                                                    key={r.id}
                                                    onClick={() => toggleRarity(r.id)}
                                                    className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                                                        selectedRarities.has(r.id)
                                                            ? r.active
                                                            : "border-border/60 text-muted-foreground hover:text-foreground"
                                                    }`}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                        {filteredCases.map((caseItem, index) => (
                            <Link
                                key={caseItem.id}
                                to="/cases/$caseId"
                                params={{ caseId: caseItem.id }}
                                className="block h-full"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.05, ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1] }}
                                    whileHover={shouldReduceMotion ? undefined : { scale: 1.04, transition: { duration: 0.2 } }}
                                    className="group h-full rounded-2xl border border-border/60 bg-card/80 overflow-hidden backdrop-blur-xl hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col cursor-pointer"
                                >
                                    <div className="relative h-48 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent p-6">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-32 h-32 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                                                <Box className="h-16 w-16 text-white" />
                                            </div>
                                        </div>
                                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-xs font-medium text-white">
                                            {caseItem.category}
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="text-lg font-semibold text-foreground mb-2">
                                            {caseItem.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                            {caseItem.description}
                                        </p>

                                        <div className="mt-auto flex items-center justify-center w-full py-3 rounded-xl bg-orange-500 text-white group-hover:bg-white group-hover:text-black font-medium transition-all duration-300 ease-out overflow-hidden">
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
