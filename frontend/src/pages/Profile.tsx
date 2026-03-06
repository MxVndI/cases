import { useState, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    User, Mail, KeyRound, Save, Check, Coins, Package, History,
    Settings, Box, Shield, ArrowUpDown, SlidersHorizontal, X
} from "lucide-react";
import { dummySpinHistory, dummyInventory, rarityColors } from "@/data/dummy-data";

type Tab = "overview" | "history" | "inventory" | "settings";
type Rarity = "common" | "rare" | "epic" | "legendary" | "exotic";
type InvSortMode = "default" | "price-asc" | "price-desc";

const rarityFilters: { id: Rarity; label: string; color: string; active: string }[] = [
    { id: "common",    label: "Обычное",      color: "border-gray-400   text-gray-400",   active: "bg-gray-400/15   border-gray-400   text-gray-300"   },
    { id: "rare",      label: "Редкое",       color: "border-blue-400   text-blue-400",   active: "bg-blue-400/15   border-blue-400   text-blue-300"   },
    { id: "epic",      label: "Эпическое",    color: "border-purple-400 text-purple-400", active: "bg-purple-400/15 border-purple-400 text-purple-300" },
    { id: "legendary", label: "Легендарное",  color: "border-orange-400 text-orange-400", active: "bg-orange-400/15 border-orange-400 text-orange-300" },
    { id: "exotic",    label: "Экзотическое", color: "border-red-500    text-red-500",    active: "bg-red-500/15    border-red-500    text-red-400"    },
];

export function Profile() {
    const shouldReduceMotion = useReducedMotion();
    const { user, updateProfile, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [nickname, setNickname] = useState(user?.nickname || "");
    const [email, setEmail] = useState(user?.email || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [passwordSaved, setPasswordSaved] = useState(false);

    const history = dummySpinHistory;
    const inventory = dummyInventory;
    const [soldItems, setSoldItems] = useState<Set<string>>(new Set());
    const [confirmingSellId, setConfirmingSellId] = useState<string | null>(null);

    // Inventory filters & sorting
    const [invSortMode, setInvSortMode] = useState<InvSortMode>("default");
    const [invSelectedRarities, setInvSelectedRarities] = useState<Set<Rarity>>(new Set());
    const [showInvFilters, setShowInvFilters] = useState(false);

    const toggleInvRarity = (r: Rarity) => {
        setInvSelectedRarities(prev => {
            const next = new Set(prev);
            next.has(r) ? next.delete(r) : next.add(r);
            return next;
        });
    };

    const invFilterCount = (invSelectedRarities.size > 0 ? invSelectedRarities.size : 0) + (invSortMode !== "default" ? 1 : 0);

    const resetInvFilters = () => {
        setInvSelectedRarities(new Set());
        setInvSortMode("default");
    };

    const activeInventory = useMemo(() => {
        let items = inventory.filter(item => !soldItems.has(item.id));

        // Rarity filter
        if (invSelectedRarities.size > 0) {
            items = items.filter(item => invSelectedRarities.has(item.rarity));
        }

        // Sort
        if (invSortMode === "price-asc") {
            items = [...items].sort((a, b) => a.price - b.price);
        } else if (invSortMode === "price-desc") {
            items = [...items].sort((a, b) => b.price - a.price);
        }

        return items;
    }, [inventory, soldItems, invSelectedRarities, invSortMode]);

    const inventoryTotal = activeInventory.reduce((sum, item) => sum + item.price, 0);

    const handleSell = (itemId: string) => {
        if (confirmingSellId === itemId) {
            setSoldItems(prev => new Set([...prev, itemId]));
            setConfirmingSellId(null);
        } else {
            setConfirmingSellId(itemId);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateProfile({ nickname: nickname || undefined, email: email || undefined });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Ошибка обновления профиля:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) return;
        setIsSaving(true);
        try {
            await updateProfile({ password: newPassword });
            setPasswordSaved(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setTimeout(() => setPasswordSaved(false), 2000);
        } catch (error) {
            console.error("Ошибка смены пароля:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: "overview", label: "Обзор", icon: <User className="h-4 w-4" /> },
        { id: "history", label: "История", icon: <History className="h-4 w-4" /> },
        { id: "inventory", label: "Инвентарь", icon: <Package className="h-4 w-4" /> },
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
                                {user?.registeredAt && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Дата регистрации: {new Date(user.registeredAt).toLocaleDateString("ru-RU")}
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
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                            <Package className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Инвентарь</span>
                                    </div>
                                    <div className="pl-[52px]">
                                        <p className="text-2xl font-bold text-foreground">{activeInventory.length} предм.</p>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">≈ {inventoryTotal.toLocaleString()} <Coins className="h-3 w-3" /></p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                            <History className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Открыто кейсов</span>
                                    </div>
                                    <div className="pl-[52px]">
                                        <p className="text-2xl font-bold text-foreground">{history.length}</p>
                                        <p className="text-xs text-muted-foreground mt-1">за всё время</p>
                                    </div>
                                </div>
                            </div>

                            {/* Последние выигрыши */}
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-6 backdrop-blur-xl">
                                <h2 className="text-lg font-semibold text-foreground mb-4">Последние выигрыши</h2>
                                <div className="space-y-3">
                                    {history.slice(0, 3).map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/50 gap-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${rarityColors[item.wonItem.rarity]}`}>
                                                    <Box className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{item.wonItem.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{item.caseName}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold text-orange-500 flex items-center gap-1 flex-shrink-0">+{item.wonItem.price} <Coins className="h-3.5 w-3.5" /></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "history" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-6 backdrop-blur-xl">
                                <h2 className="text-lg font-semibold text-foreground mb-4">История открытий</h2>
                                <div className="space-y-3">
                                    {history.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-border/40 bg-background/50 gap-2">
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center border-2 flex-shrink-0 ${rarityColors[item.wonItem.rarity]}`}>
                                                    <Box className="h-4 w-4 sm:h-5 sm:w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-foreground truncate">{item.wonItem.name}</p>
                                                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                                        {item.caseName} &bull; {new Date(item.spinDate).toLocaleDateString("ru-RU")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-semibold text-orange-500 flex items-center gap-1">+{item.wonItem.price} <Coins className="h-3.5 w-3.5" /></p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">-{item.cost} <Coins className="h-3 w-3" /></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {history.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">Пока нет открытий</p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "inventory" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {/* Header with total + filter toggle */}
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-6 backdrop-blur-xl mb-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-semibold text-foreground">Инвентарь</h2>
                                        <button
                                            onClick={() => setShowInvFilters(v => !v)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                                                showInvFilters
                                                    ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                                                    : "bg-card/80 border-border/60 text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
                                            }`}
                                        >
                                            <SlidersHorizontal className="h-3.5 w-3.5" />
                                            Фильтры
                                            {invFilterCount > 0 && (
                                                <span className="ml-1 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                                    {invFilterCount}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Всего: <span className="text-orange-500 font-semibold inline-flex items-center gap-1">{inventoryTotal.toLocaleString()} <Coins className="h-3.5 w-3.5" /></span>
                                    </p>
                                </div>

                                {/* Filters panel */}
                                <AnimatePresence>
                                    {showInvFilters && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-4 mt-4 border-t border-border/40 space-y-4">
                                                {/* Sorting */}
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                                        <ArrowUpDown className="h-3 w-3" /> Сортировка
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {([
                                                            { id: "default" as InvSortMode, label: "По умолчанию" },
                                                            { id: "price-asc" as InvSortMode, label: "Цена ↑" },
                                                            { id: "price-desc" as InvSortMode, label: "Цена ↓" },
                                                        ]).map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => setInvSortMode(opt.id)}
                                                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                                                                    invSortMode === opt.id
                                                                        ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                                                                        : "border-border/60 text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
                                                                }`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Rarity */}
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">Редкость</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {rarityFilters.map((r) => (
                                                            <button
                                                                key={r.id}
                                                                onClick={() => toggleInvRarity(r.id)}
                                                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                                                                    invSelectedRarities.has(r.id)
                                                                        ? r.active
                                                                        : "border-border/60 text-muted-foreground hover:text-foreground"
                                                                }`}
                                                            >
                                                                {r.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Reset */}
                                                {invFilterCount > 0 && (
                                                    <button
                                                        onClick={resetInvFilters}
                                                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        <X className="h-3 w-3" /> Сбросить фильтры
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
                                            whileHover={{ y: -6, scale: 1.02 }}
                                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                            className={`group/card rounded-2xl border-2 bg-card/80 overflow-hidden backdrop-blur-xl transition-shadow duration-300 hover:shadow-lg hover:shadow-orange-500/10 ${rarityColors[item.rarity]}`}
                                        >
                                            <div className="h-32 flex items-center justify-center bg-gradient-to-br from-orange-500/10 via-transparent to-transparent">
                                                <motion.div
                                                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                                                    transition={{ duration: 0.4 }}
                                                >
                                                    <Box className="h-12 w-12 transition-colors duration-200 group-hover/card:text-orange-400" />
                                                </motion.div>
                                            </div>
                                            <div className="p-4">
                                                <p className="font-medium text-foreground text-sm mb-1">{item.name}</p>
                                                <p className="text-xs text-muted-foreground mb-2">из {item.wonFrom}</p>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-bold text-orange-500 flex items-center gap-1">{item.price.toLocaleString()} <Coins className="h-3.5 w-3.5" /></span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(item.wonDate).toLocaleDateString("ru-RU")}
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
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
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
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                            Электронная почта
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="email@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="rounded-xl border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-5 rounded-xl transition-all duration-300 flex items-center gap-2"
                                    >
                                        {saved ? <><Check className="h-4 w-4" /> Сохранено!</> : <><Save className="h-4 w-4" /> Сохранить</>}
                                    </Button>
                                </form>
                            </div>

                            {/* Смена пароля */}
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <KeyRound className="h-5 w-5 text-orange-500" /> Смена пароля
                                </h2>
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password" className="text-sm font-medium text-foreground">
                                            Текущий пароль
                                        </Label>
                                        <Input
                                            id="current-password"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="rounded-xl border-border/60 bg-background/50 text-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                                            Новый пароль
                                        </Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="rounded-xl border-border/60 bg-background/50 text-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-new-password" className="text-sm font-medium text-foreground">
                                            Подтвердите новый пароль
                                        </Label>
                                        <Input
                                            id="confirm-new-password"
                                            type="password"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            className="rounded-xl border-border/60 bg-background/50 text-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                            required
                                        />
                                        {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                                            <p className="text-xs text-red-500">Пароли не совпадают</p>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isSaving || !newPassword || newPassword !== confirmNewPassword}
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-5 rounded-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {passwordSaved ? <><Check className="h-4 w-4" /> Пароль изменён!</> : <><KeyRound className="h-4 w-4" /> Изменить пароль</>}
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
