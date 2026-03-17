import { useMemo, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useParams, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    User, Shield, Box, Coins, Package, Crosshair,
    Ban, CheckCircle, Loader2, TrendingUp, TrendingDown,
    Pickaxe, Gift,
} from "lucide-react";
import { useAuth } from "@/AuthContext";
import {
    userApi, casesApi, inventoryApi, paymentApi, adminApi,
    type CaseItem, type WinHistoryEntry, type TransactionEntry,
} from "@/services/api";
import { useEffect } from "react";
import { useRarities } from "@/hooks/useRarities";
import { FilterPanel, PriceRangeInputs, RarityFilterButtons, SortButtons, SearchInput } from "@/components/filters";

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

type InvSortMode = "default" | "price-asc" | "price-desc" | "date-asc" | "date-desc";
type WinSortMode = "default" | "price-asc" | "price-desc";
type TxSortMode = "default" | "amount-asc" | "amount-desc";

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

function txIcon(tx: TransactionEntry, userId: string) {
    const isIncoming = tx.to === userId;
    const desc = tx.description ?? "";
    if (desc.startsWith("Фарм")) return <Pickaxe className="h-4 w-4 text-orange-500" />;
    if (desc.startsWith("Ежедн") || desc.includes("бонус")) return <Gift className="h-4 w-4 text-yellow-400" />;
    return isIncoming
        ? <TrendingUp className="h-4 w-4 text-green-500" />
        : <TrendingDown className="h-4 w-4 text-red-500" />;
}

export function UserProfile() {
    const shouldReduceMotion = useReducedMotion();
    const { userName } = useParams({ strict: false });
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === "admin";

    const nickname = (userName ?? "").trim();

    // Redirect to own profile
    useEffect(() => {
        if (currentUser && nickname && currentUser.nickname === nickname) {
            navigate({ to: "/profile", replace: true });
        }
    }, [currentUser, nickname, navigate]);

    // --- Data fetching ---
    const { data: profile, isLoading, isError } = useQuery({
        queryKey: ["publicUserProfile", nickname],
        queryFn: () => userApi.getPublicByNickname(nickname),
        enabled: nickname.length > 0 && currentUser?.nickname !== nickname,
        retry: 1,
    });

    const userId = profile?.id;

    const { data: winsStats } = useQuery({
        queryKey: ["userWinsStats", userId],
        queryFn: () => casesApi.getUserWinsStats(userId!),
        enabled: !!userId,
        staleTime: 30_000,
    });

    const { data: fullWinHistory = [], isLoading: historyLoading } = useQuery({
        queryKey: ["userWins", userId],
        queryFn: () => casesApi.getUserWins(userId!, 200),
        enabled: !!userId && isAdmin,
        staleTime: 30_000,
    });

    const { data: recentWins = [] } = useQuery({
        queryKey: ["userRecentWins", userId],
        queryFn: () => casesApi.getUserWins(userId!, 10),
        enabled: !!userId && !isAdmin,
        staleTime: 30_000,
    });

    const { data: rawInventory = [] } = useQuery({
        queryKey: ["userInventory", userId],
        queryFn: () => inventoryApi.getUserInventory(userId!),
        enabled: !!userId,
        staleTime: 30_000,
    });

    const { data: allCases = [] } = useQuery({
        queryKey: ["cases"],
        queryFn: casesApi.getAll,
        staleTime: 60_000,
    });

    // Fetch rarities from API
    const rarities = useRarities();

    const { data: balance } = useQuery({
        queryKey: ["userBalance", userId],
        queryFn: () => paymentApi.getBalance(userId!),
        enabled: !!userId && isAdmin,
        staleTime: 30_000,
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ["userTransactions", userId],
        queryFn: () => paymentApi.getTransactions(userId!),
        enabled: !!userId && isAdmin,
        staleTime: 30_000,
    });

    // Build item lookup
    const itemMap = useMemo(() => {
        const map = new Map<string, CaseItem>();
        for (const c of allCases) {
            for (const entry of c.case_content) {
                map.set(entry.item.id, entry.item);
            }
        }
        return map;
    }, [allCases]);

    // Enrich inventory
    const inventory: EnrichedInventoryItem[] = useMemo(() => {
        return rawInventory.map(inv => {
            const item = itemMap.get(inv.item_id);
            const rarityName = item ? (typeof item.rarity === "string" ? item.rarity : item.rarity.name) : "common";
            const rarityObj = item && typeof item.rarity !== "string" ? item.rarity : null;
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

    const inventoryTotal = inventory.reduce((sum, i) => sum + i.price, 0);

    // --- Filter & sort state ---
    // Inventory
    const [invSortMode, setInvSortMode] = useState<InvSortMode>("default");
    const [invSelectedRarities, setInvSelectedRarities] = useState<Set<string>>(new Set());
    const [invPriceMin, setInvPriceMin] = useState(0);
    const [invPriceMaxOverride, setInvPriceMaxOverride] = useState<number | null>(null);
    const [showInvFilters, setShowInvFilters] = useState(false);
    // Wins (admin)
    const [winSortMode, setWinSortMode] = useState<WinSortMode>("default");
    const [winSearch, setWinSearch] = useState("");
    const [showWinFilters, setShowWinFilters] = useState(false);
    // Transactions (admin)
    const [txSortMode, setTxSortMode] = useState<TxSortMode>("default");
    const [txSearch, setTxSearch] = useState("");
    const [showTxFilters, setShowTxFilters] = useState(false);

    const toggleInvRarity = (r: string) => {
        setInvSelectedRarities(prev => {
            const next = new Set(prev);
            next.has(r) ? next.delete(r) : next.add(r);
            return next;
        });
    };

    const maxInventoryPrice = useMemo(
        () => Math.max(100, inventory.reduce((highest, current) => Math.max(highest, current.price), 0)),
        [inventory],
    );
    const invPriceMax = invPriceMaxOverride ?? maxInventoryPrice;
    const handleInvPriceMaxChange = (value: number) => {
        setInvPriceMaxOverride(value >= maxInventoryPrice ? null : value);
    };

    const invFilterCount =
        (invSelectedRarities.size > 0 ? 1 : 0) +
        (invPriceMin > 0 || invPriceMaxOverride !== null ? 1 : 0) +
        (invSortMode !== "default" ? 1 : 0);
    const winFilterCount = (winSortMode !== "default" ? 1 : 0) + (winSearch.trim() ? 1 : 0);
    const txFilterCount = (txSortMode !== "default" ? 1 : 0) + (txSearch.trim() ? 1 : 0);

    const resetInvFilters = () => { setInvSortMode("default"); setInvSelectedRarities(new Set()); setInvPriceMin(0); setInvPriceMaxOverride(null); };
    const resetWinFilters = () => { setWinSortMode("default"); setWinSearch(""); };
    const resetTxFilters = () => { setTxSortMode("default"); setTxSearch(""); };

    const filteredInventory = useMemo(() => {
        let items = [...inventory];
        if (invSelectedRarities.size > 0) {
            items = items.filter(item => invSelectedRarities.has(item.rarity));
        }
        if (invPriceMin > 0) {
            items = items.filter(item => item.price >= invPriceMin);
        }
        if (invPriceMaxOverride !== null) {
            items = items.filter(item => item.price <= invPriceMax);
        }
        switch (invSortMode) {
            case "price-asc": items.sort((a, b) => a.price - b.price); break;
            case "price-desc": items.sort((a, b) => b.price - a.price); break;
            case "date-desc": items.sort((a, b) => new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime()); break;
            case "date-asc": items.sort((a, b) => new Date(a.obtained_at).getTime() - new Date(b.obtained_at).getTime()); break;
        }
        return items;
    }, [invPriceMax, invPriceMaxOverride, invPriceMin, invSelectedRarities, invSortMode, inventory]);

    const filteredInventoryTotal = filteredInventory.reduce((sum, i) => sum + i.price, 0);

    const winsToShow: WinHistoryEntry[] = isAdmin ? fullWinHistory : recentWins;

    const filteredWins = useMemo(() => {
        let wins = [...winsToShow];
        const q = winSearch.trim().toLowerCase();
        if (q) {
            wins = wins.filter(w =>
                w.item_name.toLowerCase().includes(q) ||
                w.case_name.toLowerCase().includes(q)
            );
        }
        switch (winSortMode) {
            case "price-asc": wins.sort((a, b) => a.item_price - b.item_price); break;
            case "price-desc": wins.sort((a, b) => b.item_price - a.item_price); break;
        }
        return wins;
    }, [winsToShow, winSearch, winSortMode]);

    // Block/unblock state
    const [blockModalAction, setBlockModalAction] = useState<"block" | "unblock" | null>(null);
    const [blockLoading, setBlockLoading] = useState(false);

    const handleBlockAction = async () => {
        if (!userId || !blockModalAction) return;
        setBlockLoading(true);
        try {
            if (blockModalAction === "block") {
                await adminApi.blockUser(userId);
            } else {
                await adminApi.unblockUser(userId);
            }
            queryClient.invalidateQueries({ queryKey: ["publicUserProfile", nickname] });
        } catch { /* ignore */ }
        setBlockLoading(false);
        setBlockModalAction(null);
    };

    // Admin transaction stats
    const filteredTransactions = useMemo(() => {
        let list = [...transactions]
            .filter(tx => Boolean(tx.created_at));
        const q = txSearch.trim().toLowerCase();
        if (q) {
            list = list.filter(tx =>
                (tx.description ?? "").toLowerCase().includes(q)
            );
        }
        switch (txSortMode) {
            case "amount-asc": list.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount)); break;
            case "amount-desc": list.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)); break;
            default: list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        return list.slice(0, 50);
    }, [transactions, txSearch, txSortMode]);

    if (currentUser?.nickname === nickname) return null;

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
                    transition={{ duration: 0.4, ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1] }}
                >
                    {/* Loading */}
                    {isLoading && (
                        <div className="rounded-2xl border border-border/40 bg-card/50 p-12 text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                            <p className="text-sm text-muted-foreground mt-3">Загружаем профиль...</p>
                        </div>
                    )}

                    {/* Error */}
                    {!isLoading && (isError || !profile) && (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
                            <p className="text-sm text-red-300">Профиль пользователя не найден.</p>
                        </div>
                    )}

                    {/* Profile loaded */}
                    {!isLoading && profile && (
                        <>
                            {/* ━━━ Header card ━━━ */}
                            <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-orange-500/10 via-card/90 to-card/90 p-5 sm:p-8 backdrop-blur-xl shadow-xl mb-8">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                                        <User className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                                            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                                                {profile.nickname}
                                            </h1>
                                            {isAdmin && profile.role === "admin" && (
                                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-xs font-medium text-red-400 flex items-center gap-1">
                                                    <Shield className="h-3 w-3" /> Администратор
                                                </span>
                                            )}
                                        </div>

                                        {/* Admin-only: role, status, id */}
                                        {isAdmin && (
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Shield className="h-3.5 w-3.5" />
                                                    Роль: {profile.role === "admin" ? "Администратор" : "Пользователь"}
                                                </span>
                                                <span className={`inline-flex items-center gap-1.5 ${
                                                    profile.status === "blocked" ? "text-red-400" : ""
                                                }`}>
                                                    {profile.status === "blocked"
                                                        ? <Ban className="h-3.5 w-3.5" />
                                                        : <CheckCircle className="h-3.5 w-3.5" />}
                                                    Статус: {profile.status === "blocked" ? "Заблокирован" : profile.status === "active" ? "Активен" : profile.status}
                                                </span>
                                            </div>
                                        )}
                                        {isAdmin && (
                                            <p className="mt-1 text-xs text-muted-foreground/80 break-all">
                                                ID: {profile.id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Admin: block/unblock button */}
                                    {isAdmin && profile.role !== "admin" && (
                                        <div className="flex-shrink-0">
                                            {profile.status === "blocked" ? (
                                                <button
                                                    onClick={() => setBlockModalAction("unblock")}
                                                    className="px-4 py-2 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-all duration-200 flex items-center gap-2"
                                                >
                                                    <CheckCircle className="h-4 w-4" /> Разблокировать
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setBlockModalAction("block")}
                                                    className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all duration-200 flex items-center gap-2"
                                                >
                                                    <Ban className="h-4 w-4" /> Заблокировать
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ━━━ Admin: Balance ━━━ */}
                            {isAdmin && balance !== undefined && (
                                <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-card/90 to-card/90 p-5 sm:p-6 backdrop-blur-xl mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                            <Coins className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Баланс</p>
                                            <p className="text-2xl font-bold text-white">{balance.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ━━━ Stats row ━━━ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                            <Box className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Открыто кейсов</span>
                                    </div>
                                    <div className="pl-[52px]">
                                        <p className="text-2xl font-bold text-foreground">{winsStats?.total_opened ?? 0}</p>
                                        <p className="text-xs text-muted-foreground mt-1">за всё время</p>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                            <Package className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Инвентарь</span>
                                    </div>
                                    <div className="pl-[52px]">
                                        <p className="text-2xl font-bold text-foreground">{pluralItems(inventory.length)}</p>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            {inventoryTotal.toLocaleString()} <Coins className="h-3 w-3" />
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ━━━ Wins ━━━ */}
                            <div className="mb-8">
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl mb-4">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {isAdmin ? "Полная история выпадений" : "Последние выигрыши"}
                                    </h3>
                                </div>
                                {isAdmin && winsToShow.length > 0 && (
                                    <div className="mb-4">
                                        <FilterPanel
                                            open={showWinFilters}
                                            onToggle={() => setShowWinFilters(v => !v)}
                                            filterCount={winFilterCount}
                                            onReset={resetWinFilters}
                                        >
                                            <SearchInput value={winSearch} onChange={setWinSearch} placeholder="Поиск по предмету или кейсу..." />
                                            <SortButtons
                                                options={[
                                                    { id: "default" as WinSortMode, label: "По дате" },
                                                    { descId: "price-desc" as WinSortMode, ascId: "price-asc" as WinSortMode, label: "Цена" },
                                                ]}
                                                current={winSortMode}
                                                onChange={setWinSortMode}
                                                label="Сортировка"
                                            />
                                        </FilterPanel>
                                    </div>
                                )}
                                {isAdmin && historyLoading && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
                                    </div>
                                )}
                                {filteredWins.length > 0 ? (
                                    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur-xl">
                                        <div className="space-y-2">
                                            {filteredWins.map((win) => (
                                                <div key={win.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/30 px-3 py-2.5">
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
                                                    <span className="text-sm font-semibold text-foreground flex items-center gap-1 flex-shrink-0">
                                                        {Math.floor(win.item_price).toLocaleString()} <Coins className="h-3.5 w-3.5 text-orange-500" />
                                                    </span>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                                                        {formatWinTime(win.timestamp)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                        <p className="text-sm text-muted-foreground">Пока нет выигрышей</p>
                                    </div>
                                )}
                            </div>

                            {/* ━━━ Inventory ━━━ */}
                            <div className="mb-8">
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl mb-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-foreground">Инвентарь</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Всего: <span className="text-orange-500 font-semibold inline-flex items-center gap-1">{filteredInventoryTotal.toLocaleString()} <Coins className="h-3.5 w-3.5" /></span>
                                        </p>
                                    </div>
                                </div>
                                {isAdmin && inventory.length > 0 && (
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
                                            />
                                            <PriceRangeInputs min={invPriceMin} max={invPriceMax} onMinChange={setInvPriceMin} onMaxChange={handleInvPriceMaxChange} maxValue={maxInventoryPrice} />
                                            <div>
                                                <p className="text-sm font-medium text-foreground mb-2">Редкость</p>
                                                <RarityFilterButtons rarities={rarities} selected={invSelectedRarities} onToggle={toggleInvRarity} />
                                            </div>
                                        </FilterPanel>
                                    </div>
                                )}
                                {filteredInventory.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredInventory.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`rounded-2xl border-2 bg-card/80 overflow-hidden backdrop-blur-xl ${rarityColors[item.rarity]}`}
                                            >
                                                <div className="h-36 flex items-center justify-center bg-gradient-to-br from-orange-500/10 via-transparent to-transparent">
                                                    {item.img_url ? (
                                                        <img src={item.img_url} alt={item.name} className="h-32 w-32 object-contain" />
                                                    ) : (
                                                        <Box className="h-12 w-12" />
                                                    )}
                                                </div>
                                                <div className="p-3">
                                                    <p className="font-medium text-foreground text-sm mb-1 truncate">{item.name}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-orange-500 flex items-center gap-1">
                                                            {item.price.toLocaleString()} <Coins className="h-3.5 w-3.5" />
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(item.obtained_at).toLocaleDateString("ru-RU")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                        <p className="text-sm text-muted-foreground">
                                            {invFilterCount > 0 ? "Нет предметов по выбранным фильтрам" : "Инвентарь пуст"}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* ━━━ Admin: Transactions ━━━ */}
                            {isAdmin && transactions.length > 0 && (
                                <div className="mb-8">
                                    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl mb-4">
                                        <h3 className="text-lg font-semibold text-foreground">История транзакций</h3>
                                    </div>
                                    <div className="mb-4">
                                        <FilterPanel
                                            open={showTxFilters}
                                            onToggle={() => setShowTxFilters(v => !v)}
                                            filterCount={txFilterCount}
                                            onReset={resetTxFilters}
                                        >
                                            <SearchInput value={txSearch} onChange={setTxSearch} placeholder="Поиск по описанию..." />
                                            <SortButtons
                                                options={[
                                                    { id: "default" as TxSortMode, label: "По дате" },
                                                    { descId: "amount-desc" as TxSortMode, ascId: "amount-asc" as TxSortMode, label: "Сумма" },
                                                ]}
                                                current={txSortMode}
                                                onChange={setTxSortMode}
                                                label="Сортировка"
                                            />
                                        </FilterPanel>
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur-xl">
                                        <div className="space-y-2">
                                            {filteredTransactions.map((tx) => {
                                                const isIncoming = tx.to === userId;
                                                return (
                                                    <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/30 px-3 py-2.5">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-card/80">
                                                            {txIcon(tx, userId!)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-foreground truncate">
                                                                {tx.description || (isIncoming ? "Пополнение" : "Списание")}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(tx.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                            </p>
                                                        </div>
                                                        <span className={`text-sm font-bold flex-shrink-0 ${isIncoming ? "text-green-500" : "text-red-500"}`}>
                                                            {isIncoming ? "+" : "−"}{Math.floor(Math.abs(tx.amount)).toLocaleString()}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {filteredTransactions.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">Нет транзакций по заданным фильтрам</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </main>

            {/* ━━━ Block/Unblock confirmation modal ━━━ */}
            <AnimatePresence>
                {blockModalAction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => !blockLoading && setBlockModalAction(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
                        >
                            <h3 className="text-lg font-semibold text-foreground mb-3">
                                {blockModalAction === "block" ? "Заблокировать пользователя?" : "Разблокировать пользователя?"}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                {blockModalAction === "block"
                                    ? `Пользователь ${profile?.nickname} будет заблокирован и не сможет пользоваться сервисом.`
                                    : `Пользователь ${profile?.nickname} будет разблокирован и сможет снова пользоваться сервисом.`}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setBlockModalAction(null)}
                                    disabled={blockLoading}
                                    className="flex-1 py-2.5 rounded-xl border border-border/60 bg-card/80 text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleBlockAction}
                                    disabled={blockLoading}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 ${
                                        blockModalAction === "block"
                                            ? "bg-red-500 hover:bg-red-600"
                                            : "bg-green-500 hover:bg-green-600"
                                    }`}
                                >
                                    {blockLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {blockModalAction === "block" ? "Заблокировать" : "Разблокировать"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
