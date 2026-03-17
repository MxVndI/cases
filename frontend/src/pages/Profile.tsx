import { useState, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import CountUp from "@/components/CountUp";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { usePreferences } from "@/PreferencesContext";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi, casesApi, authApi, type CaseItem, type WinHistoryEntry } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRarities } from "@/hooks/useRarities";
import { FilterPanel, PriceRangeInputs, RarityFilterButtons, SortButtons } from "@/components/filters";
import {
    User, Mail, Save, Check, Coins, Package,
    Settings, Box, Shield, X,
    Loader2, ArrowLeft, Crosshair, Clock, History
} from "lucide-react";

type Tab = "overview" | "inventory" | "history" | "settings";
type InvSortMode = "default" | "price-asc" | "price-desc" | "date-asc" | "date-desc";

const rarityColors: Record<string, string> = {
    common: "text-gray-400 border-gray-400 bg-gray-400/10",
    rare: "text-blue-400 border-blue-400 bg-blue-400/10",
    epic: "text-purple-400 border-purple-400 bg-purple-400/10",
    legendary: "text-orange-400 border-orange-400 bg-orange-400/10",
    exotic: "text-red-500 border-red-500 bg-red-500/10",
};

interface EnrichedInventoryItem {
    id: string;
    item_id: string;
    obtained_at: string;
    name: string;
    price: number;
    rarity: string;
    rarityColor?: string;
    img_url?: string | null;
}

function formatWinTime(timestamp: string): string {
    const diff = Date.now() - new Date(timestamp).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec} сек. назад`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} мин. назад`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs} ч. назад`;
    const days = Math.floor(hrs / 24);
    return `${days} дн. назад`;
}

function pluralItems(n: number): string {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return `${n} предметов`;
    if (last > 1 && last < 5) return `${n} предмета`;
    if (last === 1) return `${n} предмет`;
    return `${n} предметов`;
}

function WinTile({ win }: { win: WinHistoryEntry }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur-xl flex flex-col items-center text-center gap-2">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center overflow-hidden">
                {win.item_img_url ? (
                    <img src={win.item_img_url} alt={win.item_name} className="h-14 w-14 object-contain" />
                ) : (
                    <Crosshair className="h-6 w-6 text-muted-foreground" />
                )}
            </div>
            <p className="text-sm font-medium text-orange-500 truncate w-full">{win.item_name}</p>
            <p className="text-xs text-muted-foreground truncate w-full">{win.case_name}</p>
            <p className="text-xs text-muted-foreground">{formatWinTime(win.timestamp)}</p>
        </div>
    );
}

function WinRow({ win }: { win: WinHistoryEntry }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/30 px-3 py-2.5">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {win.item_img_url ? (
                    <img src={win.item_img_url} alt={win.item_name} className="h-10 w-10 object-contain" />
                ) : (
                    <Crosshair className="h-5 w-5 text-muted-foreground" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-orange-500 truncate">{win.item_name}</p>
                <p className="text-xs text-muted-foreground truncate">{win.case_name}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                {new Date(win.timestamp).toLocaleString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
        </div>
    );
}

export function Profile() {
    const shouldReduceMotion = useReducedMotion();
    const { user, updateProfile, isLoading } = useAuth();
    const { customCursor, setCustomCursor, countUpAnimations, setCountUpAnimations } = usePreferences();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [nickname, setNickname] = useState(user?.nickname || "");
    const [profileStep, setProfileStep] = useState<'form' | 'code'>('form');
    const [profileCode, setProfileCode] = useState("");
    const [profileCodeLoading, setProfileCodeLoading] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [saved, setSaved] = useState(false);

    // Fetch inventory from API
    const { data: rawInventory = [] } = useQuery({
        queryKey: ['inventory'],
        queryFn: inventoryApi.getMyInventory,
        enabled: !!user,
        staleTime: 30_000,
        refetchOnMount: 'always',
    });

    // Fetch all cases to build item lookup
    const { data: allCases = [] } = useQuery({
        queryKey: ['cases'],
        queryFn: casesApi.getAll,
        staleTime: 60_000,
        refetchOnMount: 'always',
    });

    // Fetch rarities from API
    const rarities = useRarities();

    // Build item lookup map from all cases
    const itemMap = useMemo(() => {
        const map = new Map<string, CaseItem>();
        for (const c of allCases) {
            for (const entry of c.case_content) {
                const item = entry.item;
                map.set(item.id, item);
            }
        }
        return map;
    }, [allCases]);

    // Enrich inventory items with details from item lookup
    const inventory: EnrichedInventoryItem[] = useMemo(() => {
        return rawInventory.map(inv => {
            const item = itemMap.get(inv.item_id);
            const rarityName = item ? (typeof item.rarity === 'string' ? item.rarity : item.rarity.name) : "common";
            const rarityObj = item && typeof item.rarity !== 'string' ? item.rarity : null;
            return {
                id: inv.id,
                item_id: inv.item_id,
                obtained_at: inv.obtained_at,
                name: item?.name ?? "Неизвестный предмет",
                price: item?.price ?? 0,
                rarity: rarityName,
                rarityColor: rarityObj?.color ?? undefined,
                img_url: item?.img_url ?? null,
            };
        });
    }, [rawInventory, itemMap]);

    const [soldItems, setSoldItems] = useState<Set<string>>(new Set());
    const [confirmingSellId, setConfirmingSellId] = useState<string | null>(null);
    const [showSellAllConfirm, setShowSellAllConfirm] = useState(false);
    const [sellAllLoading, setSellAllLoading] = useState(false);

    // Fetch user's win stats (total opened + last 3)
    const { data: winsStats } = useQuery({
        queryKey: ['wins-stats'],
        queryFn: casesApi.getMyWinsStats,
        enabled: !!user,
        staleTime: 30_000,
        refetchOnMount: 'always',
    });

    // Fetch full win history (for History tab)
    const { data: winHistory = [], isLoading: historyLoading } = useQuery({
        queryKey: ['win-history'],
        queryFn: () => casesApi.getMyWins(200, 0),
        enabled: !!user && activeTab === 'history',
        staleTime: 30_000,
        refetchOnMount: 'always',
    });

    // Inventory filters & sorting
    const [invSortMode, setInvSortMode] = useState<InvSortMode>("default");
    const [invSelectedRarities, setInvSelectedRarities] = useState<Set<string>>(new Set());
    const [invPriceMin, setInvPriceMin] = useState(0);
    const [invPriceMaxOverride, setInvPriceMaxOverride] = useState<number | null>(null);
    const [showInvFilters, setShowInvFilters] = useState(false);

    const toggleInvRarity = (r: string) => {
        setInvSelectedRarities(prev => {
            const next = new Set(prev);
            next.has(r) ? next.delete(r) : next.add(r);
            return next;
        });
    };

    const maxInventoryPrice = useMemo(
        () => Math.max(100, inventory.filter(item => !soldItems.has(item.id)).reduce((highest, current) => Math.max(highest, current.price), 0)),
        [inventory, soldItems],
    );
    const invPriceMax = invPriceMaxOverride ?? maxInventoryPrice;
    const handleInvPriceMaxChange = (value: number) => {
        setInvPriceMaxOverride(value >= maxInventoryPrice ? null : value);
    };

    const invFilterCount =
        (invSelectedRarities.size > 0 ? 1 : 0) +
        (invPriceMin > 0 || invPriceMaxOverride !== null ? 1 : 0) +
        (invSortMode !== "default" ? 1 : 0);

    const resetInvFilters = () => {
        setInvSelectedRarities(new Set());
        setInvPriceMin(0);
        setInvPriceMaxOverride(null);
        setInvSortMode("default");
    };

    const activeInventory = useMemo(() => {
        let items = inventory.filter(item => !soldItems.has(item.id));

        // Rarity filter
        if (invSelectedRarities.size > 0) {
            items = items.filter(item => invSelectedRarities.has(item.rarity));
        }
        if (invPriceMin > 0) {
            items = items.filter(item => item.price >= invPriceMin);
        }
        if (invPriceMaxOverride !== null) {
            items = items.filter(item => item.price <= invPriceMax);
        }

        // Sort
        switch (invSortMode) {
            case "price-asc":
                items = [...items].sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                items = [...items].sort((a, b) => b.price - a.price);
                break;
            case "date-desc":
                items = [...items].sort((a, b) => new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime());
                break;
            case "date-asc":
                items = [...items].sort((a, b) => new Date(a.obtained_at).getTime() - new Date(b.obtained_at).getTime());
                break;
        }

        return items;
    }, [invPriceMax, invPriceMaxOverride, invPriceMin, inventory, soldItems, invSelectedRarities, invSortMode]);

    const inventoryTotal = activeInventory.reduce((sum, item) => sum + item.price, 0);

    const handleSell = async (entryId: string) => {
        if (confirmingSellId === entryId) {
            try {
                await inventoryApi.sellItem(entryId);
                setSoldItems(prev => new Set([...prev, entryId]));
                setConfirmingSellId(null);
                queryClient.invalidateQueries({ queryKey: ['inventory'] });
                queryClient.invalidateQueries({ queryKey: ['balance'] });
            } catch {
                setConfirmingSellId(null);
            }
        } else {
            setConfirmingSellId(entryId);
        }
    };

    const handleSellAll = async () => {
        setSellAllLoading(true);
        try {
            await inventoryApi.sellAll();
            setSoldItems(new Set(activeInventory.map(i => i.id)));
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['balance'] });
        } catch { /* ignore */ }
        setSellAllLoading(false);
        setShowSellAllConfirm(false);
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError("");
        setProfileCodeLoading(true);
        try {
            await authApi.requestProfileCode();
            setProfileStep('code');
        } catch (error: any) {
            setProfileError(error?.response?.data?.detail || "Не удалось отправить код");
        } finally {
            setProfileCodeLoading(false);
        }
    };

    const handleProfileCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError("");
        setProfileCodeLoading(true);
        try {
            await authApi.verifyProfileCode(profileCode);
            await updateProfile({ nickname: nickname || undefined });
            setSaved(true);
            setProfileStep('form');
            setProfileCode("");
            setTimeout(() => setSaved(false), 2000);
        } catch (error: any) {
            setProfileError(error?.response?.data?.detail || "Неверный код");
        } finally {
            setProfileCodeLoading(false);
        }
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: "overview", label: "Обзор", icon: <User className="h-4 w-4" /> },
        { id: "inventory", label: "Инвентарь", icon: <Package className="h-4 w-4" /> },
        { id: "history", label: "История", icon: <History className="h-4 w-4" /> },
        { id: "settings", label: "Настройки", icon: <Settings className="h-4 w-4" /> },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex items-center justify-center h-96">
                    <div className="text-muted-foreground">Загрузка...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-background">
            {/* Full-left "На главную" edge button — fixed to viewport */}
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
                >
                    {/* Header с информацией пользователя */}
                    <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-card/90 to-card/90 p-5 sm:p-8 backdrop-blur-xl shadow-2xl shadow-orange-500/10 mb-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                                <User className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                                        {user?.nickname || "Пользователь"}
                                    </h1>
                                    {user?.role === "admin" && (
                                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-xs font-medium text-red-400 flex items-center gap-1">
                                            <Shield className="h-3 w-3" /> Администратор
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5" /> {user?.email}
                                </p>
                                {(user?.created_at || user?.registeredAt) && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                        <Clock className="h-3.5 w-3.5" /> {new Date(user.created_at || user.registeredAt!).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`cursor-target flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                        : "bg-card/80 text-muted-foreground hover:text-foreground border border-border/60 hover:border-orange-500/30"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    {activeTab === "overview" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            {/* Статистика */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                            <Package className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Инвентарь</span>
                                    </div>
                                    <div className="pl-[52px]">
                                        <p className="text-2xl font-bold text-foreground">{pluralItems(activeInventory.length)}</p>
                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><CountUp to={inventoryTotal} separator=" " duration={0.5} /> <Coins className="h-3 w-3" /></p>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                            <Box className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Открыто кейсов</span>
                                    </div>
                                    <div className="pl-[52px]">
                                        <p className="text-2xl font-bold text-foreground"><CountUp to={winsStats?.total_opened ?? 0} duration={0.5} /></p>
                                        <p className="text-xs text-muted-foreground mt-2">за всё время</p>
                                    </div>
                                </div>
                            </div>

                            {/* Последние выигрыши */}
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                <h3 className="text-sm font-semibold text-foreground mb-4">Последние выигрыши</h3>
                                {(winsStats?.recent_wins?.length ?? 0) > 0 ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {winsStats!.recent_wins.map((win) => (
                                            <WinTile key={win.id} win={win} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Пока нет выигрышей</p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "inventory" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {/* Header with total */}
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-6 backdrop-blur-xl mb-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="text-lg font-semibold text-foreground">Инвентарь</h2>
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            Всего: <span className="text-orange-500 font-semibold inline-flex items-center gap-1">{inventoryTotal.toLocaleString()} <Coins className="h-3.5 w-3.5" /></span>
                                        </p>
                                        {activeInventory.length > 0 && (
                                            <button
                                                onClick={() => setShowSellAllConfirm(true)}
                                                className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all duration-200"
                                            >
                                                Продать всё
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="mb-4">
                                <FilterPanel
                                    open={showInvFilters}
                                    onToggle={() => setShowInvFilters(v => !v)}
                                    filterCount={invFilterCount}
                                    onReset={resetInvFilters}
                                >
                                    <SortButtons
                                        options={[
                                            { id: "default" as InvSortMode, label: "По умолчанию" },
                                            { descId: "price-desc" as InvSortMode, ascId: "price-asc" as InvSortMode, label: "Цена" },
                                            { descId: "date-desc" as InvSortMode, ascId: "date-asc" as InvSortMode, label: "Дата" },
                                        ]}
                                        current={invSortMode}
                                        onChange={setInvSortMode}
                                        label="Сортировка"
                                        size="sm"
                                    />
                                    <PriceRangeInputs min={invPriceMin} max={invPriceMax} onMinChange={setInvPriceMin} onMaxChange={handleInvPriceMaxChange} maxValue={maxInventoryPrice} />
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Редкость</p>
                                        <RarityFilterButtons rarities={rarities} selected={invSelectedRarities} onToggle={toggleInvRarity} size="sm" />
                                    </div>
                                </FilterPanel>
                            </div>

                            {/* Inventory grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AnimatePresence>
                                {activeInventory.map((item) => {
                                    const isConfirming = confirmingSellId === item.id;
                                    return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                            whileHover={undefined}
                                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                            className={`card-hover group/card rounded-2xl border-2 bg-card/80 overflow-hidden backdrop-blur-xl hover:shadow-lg hover:shadow-orange-500/10 ${rarityColors[item.rarity]}`}
                                        >
                                            <div className="h-44 flex items-center justify-center bg-gradient-to-br from-orange-500/10 via-transparent to-transparent">
                                                {item.img_url ? (
                                                    <img
                                                        src={item.img_url}
                                                        alt={item.name}
                                                        className="h-40 w-40 object-contain"
                                                    />
                                                ) : (
                                                    <div>
                                                        <Box className="h-12 w-12 transition-colors duration-200 group-hover/card:text-orange-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <p className="font-medium text-foreground text-sm mb-1">{item.name}</p>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-bold text-orange-500 flex items-center gap-1">{item.price.toLocaleString()} <Coins className="h-3.5 w-3.5" /></span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(item.obtained_at).toLocaleDateString("ru-RU")}
                                                    </span>
                                                </div>
                                                <AnimatePresence mode="wait">
                                                {isConfirming ? (
                                                    <motion.div
                                                        key="confirm"
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="flex gap-2"
                                                    >
                                                        <button
                                                            onClick={() => handleSell(item.id)}
                                                            className="flex-1 py-2 rounded-xl bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5"
                                                        >
                                                            <Check className="h-3 w-3" /> Да, продать за {item.price.toLocaleString()}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmingSellId(null)}
                                                            className="px-3 py-2 rounded-xl bg-card/80 border border-border/60 text-muted-foreground hover:text-foreground text-xs font-medium transition-all duration-200"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="sell"
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        transition={{ duration: 0.15 }}
                                                    >
                                                        <button
                                                            onClick={() => handleSell(item.id)}
                                                            className="group w-full py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-green-500/15 hover:border-green-500/40 hover:text-green-400 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5"
                                                        >
                                                            <span className="group-hover:hidden flex items-center gap-1.5">Продать</span>
                                                            <span className="hidden group-hover:flex items-center gap-1.5">
                                                                <Coins className="h-3 w-3" /> Продать за {item.price.toLocaleString()}
                                                            </span>
                                                        </button>
                                                    </motion.div>
                                                )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                </AnimatePresence>
                            </div>
                            {activeInventory.length === 0 && (
                                <div className="text-center py-12">
                                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">
                                        {invFilterCount > 0 ? "Нет предметов по выбранным фильтрам" : "Инвентарь пуст"}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "history" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-6 backdrop-blur-xl">
                                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <History className="h-5 w-5 text-orange-500" /> История дропов
                                </h2>
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : winHistory.length > 0 ? (
                                    <div className="space-y-2">
                                        {winHistory.map((win) => (
                                            <WinRow key={win.id} win={win} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">История пуста</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "settings" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            {/* Изменение профиля */}
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5 text-orange-500" /> Профиль
                                </h2>
                                <AnimatePresence mode="wait">
                                    {profileStep === 'form' ? (
                                        <motion.form
                                            key="profile-form"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                            onSubmit={handleProfileSubmit}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="nickname" className="text-sm font-medium text-foreground">
                                                    Никнейм
                                                </Label>
                                                <Input
                                                    id="nickname"
                                                    type="text"
                                                    placeholder="Ваш никнейм"
                                                    value={nickname}
                                                    onChange={(e) => setNickname(e.target.value)}
                                                    className="rounded-xl border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                                />
                                            </div>
                                            {profileError && <p className="text-sm text-red-400">{profileError}</p>}
                                            <Button
                                                type="submit"
                                                disabled={profileCodeLoading}
                                                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-5 rounded-xl transition-all duration-300 flex items-center gap-2"
                                            >
                                                {profileCodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Получить код</>}
                                            </Button>
                                        </motion.form>
                                    ) : (
                                        <motion.form
                                            key="profile-code"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2 }}
                                            onSubmit={handleProfileCodeSubmit}
                                            className="space-y-4"
                                        >
                                            <p className="text-sm text-muted-foreground">
                                                Код подтверждения отправлен на <span className="text-orange-500 font-medium">{user?.email}</span>
                                            </p>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-foreground">
                                                    Код подтверждения
                                                </Label>
                                                <div className="flex justify-center">
                                                    <InputOTP
                                                        maxLength={6}
                                                        value={profileCode}
                                                        onChange={(value) => { setProfileCode(value); setProfileError(""); }}
                                                        autoFocus
                                                        disabled={profileCodeLoading}
                                                    >
                                                        <InputOTPGroup>
                                                            <InputOTPSlot index={0} />
                                                            <InputOTPSlot index={1} />
                                                            <InputOTPSlot index={2} />
                                                        </InputOTPGroup>
                                                        <InputOTPSeparator />
                                                        <InputOTPGroup>
                                                            <InputOTPSlot index={3} />
                                                            <InputOTPSlot index={4} />
                                                            <InputOTPSlot index={5} />
                                                        </InputOTPGroup>
                                                    </InputOTP>
                                                </div>
                                            </div>
                                            {profileError && <p className="text-sm text-red-400">{profileError}</p>}
                                            <Button
                                                type="submit"
                                                disabled={profileCodeLoading || profileCode.length !== 6}
                                                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-5 rounded-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {profileCodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" /> Сохранено!</> : <><Save className="h-4 w-4" /> Подтвердить и сохранить</>}
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() => { setProfileStep('form'); setProfileCode(""); setProfileError(""); }}
                                                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors cursor-pointer"
                                            >
                                                <ArrowLeft className="h-3.5 w-3.5" /> Назад
                                            </button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Внешний вид */}
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-orange-500" /> Внешний вид
                                </h2>
                                <div className="space-y-4">
                                    <label className="flex items-center justify-between gap-4 cursor-pointer group">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Кастомный курсор</p>
                                            <p className="text-xs text-muted-foreground">Курсор-прицел с уголками, прилипающий к кнопкам</p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={customCursor}
                                            onClick={() => setCustomCursor(!customCursor)}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                customCursor ? 'bg-orange-500' : 'bg-border'
                                            }`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition duration-200 ease-in-out ${
                                                customCursor ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                        </button>
                                    </label>
                                    <label className="flex items-center justify-between gap-4 cursor-pointer group">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Анимация чисел</p>
                                            <p className="text-xs text-muted-foreground">Плавное нарастание показателей баланса, инвентаря и статистики</p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={countUpAnimations}
                                            onClick={() => setCountUpAnimations(!countUpAnimations)}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                countUpAnimations ? 'bg-orange-500' : 'bg-border'
                                            }`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition duration-200 ease-in-out ${
                                                countUpAnimations ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                        </button>
                                    </label>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </main>

            {/* Sell All confirmation overlay */}
            <AnimatePresence>
                {showSellAllConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => !sellAllLoading && setShowSellAllConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl"
                        >
                            <h3 className="text-lg font-semibold text-foreground mb-2">Продать все предметы?</h3>
                            <p className="text-sm text-muted-foreground mb-1">
                                Будет продано <span className="text-foreground font-medium">{activeInventory.length}</span> предметов
                            </p>
                            <p className="text-sm text-muted-foreground mb-6">
                                Вы получите <span className="text-orange-500 font-semibold">{inventoryTotal.toLocaleString()}</span> <Coins className="h-3.5 w-3.5 inline" />
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSellAll}
                                    disabled={sellAllLoading}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                                >
                                    {sellAllLoading ? "Продаём..." : "Да, продать всё"}
                                </button>
                                <button
                                    onClick={() => setShowSellAllConfirm(false)}
                                    disabled={sellAllLoading}
                                    className="flex-1 py-2.5 rounded-xl bg-card/80 border border-border/60 text-muted-foreground hover:text-foreground text-sm font-medium transition-all duration-200"
                                >
                                    Отмена
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
