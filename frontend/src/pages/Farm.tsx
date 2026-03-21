import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/AuthContext";
import { paymentApi, farmApi } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Zap, MousePointerClick, TrendingUp, ShoppingCart, Layers, Timer } from "lucide-react";

interface FarmState {
    totalClicks: number;
    earnedHC: number;
    pendingHC: number;
    clickPower: number;
    autoClickerLevel: number;
    clickPowerLevel: number;
    clickMultiplierLevel: number;
    autoClickerSpeedLevel: number;
}

const DEFAULT_FARM_STATE: FarmState = {
    totalClicks: 0,
    earnedHC: 0,
    pendingHC: 0,
    clickPower: 1,
    autoClickerLevel: 0,
    clickPowerLevel: 0,
    clickMultiplierLevel: 0,
    autoClickerSpeedLevel: 0,
};

const CLICK_POWER_COSTS =     [10, 25, 50, 100, 250, 500, 1000, 3000, 8000, 20000];
const AUTO_CLICKER_COSTS =    [50, 150, 400, 1000, 2500, 7000, 20000, 60000];
const CLICK_MULTIPLIER_COSTS = [500, 2000, 8000, 25000, 100000];
const AUTO_SPEED_COSTS =       [750, 3000, 12000, 50000];
const AUTO_CLICK_INTERVALS =   [1000, 750, 500, 333, 250];

function loadFarmState(): FarmState {
    try {
        const stored = localStorage.getItem("farmState");
        return stored ? { ...DEFAULT_FARM_STATE, ...JSON.parse(stored) } : { ...DEFAULT_FARM_STATE };
    } catch {
        return { ...DEFAULT_FARM_STATE };
    }
}

function saveFarmState(state: FarmState) {
    localStorage.setItem("farmState", JSON.stringify(state));
}

interface ClickParticle {
    id: number;
    x: number;
    y: number;
    value: number;
}

export function Farm() {
    const shouldReduceMotion = useReducedMotion();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [farm, setFarm] = useState<FarmState>(loadFarmState);
    const [isPressed, setIsPressed] = useState(false);
    const [particles, setParticles] = useState<ClickParticle[]>([]);
    const particleIdRef = useRef(0);

    const { data: realBalance = 0 } = useQuery({
        queryKey: ['balance', user?.id],
        queryFn: () => paymentApi.getBalance(user!.id),
        enabled: !!user,
        refetchInterval: 5000,
    });
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Batching: accumulate tap amounts and send periodically
    const pendingTapRef = useRef(0);
    const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flushTap = useCallback(() => {
        const amount = pendingTapRef.current;
        if (amount <= 0 || !user) return;
        pendingTapRef.current = 0;
        paymentApi.tap(amount).then(() => {
            queryClient.invalidateQueries({ queryKey: ['balance'] });
        }).catch(() => {
            // rate limited or error — silently ignore
        });
    }, [user, queryClient]);

    const scheduleTap = useCallback((amount: number) => {
        pendingTapRef.current += amount;
        // Optimistic balance update
        if (user) {
            queryClient.setQueryData(['balance', user.id], (old: number | undefined) => (old ?? 0) + amount);
        }
        if (tapTimerRef.current) return; // already scheduled
        tapTimerRef.current = setTimeout(() => {
            tapTimerRef.current = null;
            flushTap();
        }, 1500);
    }, [flushTap, user, queryClient]);

    // Flush pending taps on unmount
    useEffect(() => {
        return () => {
            if (tapTimerRef.current) {
                clearTimeout(tapTimerRef.current);
                tapTimerRef.current = null;
            }
            flushTap();
        };
    }, [flushTap]);

    // Save farm state on change
    useEffect(() => {
        saveFarmState(farm);
    }, [farm]);

    // Sync farm state with server on mount — get offline earnings
    const hasSyncedRef = useRef(false);
    useEffect(() => {
        if (!user || hasSyncedRef.current) return;
        hasSyncedRef.current = true;
        farmApi.sync(farm.autoClickerLevel, farm.autoClickerSpeedLevel).then(res => {
            if (res.pending > 0) {
                setFarm(prev => ({ ...prev, pendingHC: Math.floor(res.pending) }));
            }
        }).catch(() => {});
    }, [user]);

    // Sync levels to server when they change
    const prevLevelsRef = useRef({ level: farm.autoClickerLevel, speed: farm.autoClickerSpeedLevel });
    useEffect(() => {
        if (!user) return;
        if (
            prevLevelsRef.current.level !== farm.autoClickerLevel ||
            prevLevelsRef.current.speed !== farm.autoClickerSpeedLevel
        ) {
            prevLevelsRef.current = { level: farm.autoClickerLevel, speed: farm.autoClickerSpeedLevel };
            farmApi.sync(farm.autoClickerLevel, farm.autoClickerSpeedLevel).catch(() => {});
        }
    }, [farm.autoClickerLevel, farm.autoClickerSpeedLevel, user]);

    // Periodically sync pending to server (every 30s)
    useEffect(() => {
        if (!user) return;
        const id = setInterval(() => {
            farmApi.sync(farm.autoClickerLevel, farm.autoClickerSpeedLevel).catch(() => {});
        }, 30_000);
        return () => clearInterval(id);
    }, [user, farm.autoClickerLevel, farm.autoClickerSpeedLevel]);

    // Auto-clicker
    useEffect(() => {
        if (farm.autoClickerLevel <= 0) return;
        const interval_ms = AUTO_CLICK_INTERVALS[Math.min(farm.autoClickerSpeedLevel, AUTO_CLICK_INTERVALS.length - 1)];
        const interval = setInterval(() => {
            const gain = farm.autoClickerLevel;
            setFarm(prev => ({
                ...prev,
                pendingHC: Math.min(Math.floor(prev.pendingHC + gain), 1000),
            }));
        }, interval_ms);
        return () => clearInterval(interval);
    }, [farm.autoClickerLevel, farm.autoClickerSpeedLevel, user]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = buttonRef.current?.getBoundingClientRect();
        const x = rect ? e.clientX - rect.left : 50;
        const y = rect ? e.clientY - rect.top : 50;

        const multiplier = farm.clickMultiplierLevel + 1;
        const gain = farm.clickPower * multiplier;

        const newParticle: ClickParticle = {
            id: particleIdRef.current++,
            x,
            y,
            value: gain,
        };

        setParticles(prev => [...prev.slice(-15), newParticle]);
        setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== newParticle.id));
        }, 800);

        setFarm(prev => ({
            ...prev,
            totalClicks: prev.totalClicks + 1,
            earnedHC: prev.earnedHC + gain,
        }));

        if (user) {
            scheduleTap(gain);
        }
    }, [farm.clickPower, farm.clickMultiplierLevel, user, scheduleTap]);

    const upgradeClickPower = () => {
        const cost = CLICK_POWER_COSTS[farm.clickPowerLevel] || 999999;
        if (realBalance < cost) return;
        // Optimistic balance deduction
        queryClient.setQueryData(['balance', user?.id], (old: number | undefined) => (old ?? 0) - cost);
        paymentApi.tap(-cost).catch(() => {
            queryClient.invalidateQueries({ queryKey: ['balance'] });
        });
        setFarm(prev => ({
            ...prev,
            clickPower: prev.clickPower + 1,
            clickPowerLevel: prev.clickPowerLevel + 1,
        }));
    };

    const upgradeAutoClicker = () => {
        const cost = AUTO_CLICKER_COSTS[farm.autoClickerLevel] || 999999;
        if (realBalance < cost) return;
        queryClient.setQueryData(['balance', user?.id], (old: number | undefined) => (old ?? 0) - cost);
        paymentApi.tap(-cost).catch(() => {
            queryClient.invalidateQueries({ queryKey: ['balance'] });
        });
        setFarm(prev => ({
            ...prev,
            autoClickerLevel: prev.autoClickerLevel + 1,
        }));
    };

    const upgradeClickMultiplier = () => {
        const cost = CLICK_MULTIPLIER_COSTS[farm.clickMultiplierLevel];
        if (!cost || realBalance < cost) return;
        queryClient.setQueryData(['balance', user?.id], (old: number | undefined) => (old ?? 0) - cost);
        paymentApi.tap(-cost).catch(() => {
            queryClient.invalidateQueries({ queryKey: ['balance'] });
        });
        setFarm(prev => ({
            ...prev,
            clickMultiplierLevel: prev.clickMultiplierLevel + 1,
        }));
    };

    const upgradeAutoSpeed = () => {
        const cost = AUTO_SPEED_COSTS[farm.autoClickerSpeedLevel];
        if (!cost || realBalance < cost) return;
        queryClient.setQueryData(['balance', user?.id], (old: number | undefined) => (old ?? 0) - cost);
        paymentApi.tap(-cost).catch(() => {
            queryClient.invalidateQueries({ queryKey: ['balance'] });
        });
        setFarm(prev => ({
            ...prev,
            autoClickerSpeedLevel: prev.autoClickerSpeedLevel + 1,
        }));
    };

    const claimPending = () => {
        if (farm.pendingHC <= 0 || !user) return;
        const amount = farm.pendingHC;
        setFarm(prev => ({ ...prev, pendingHC: 0, earnedHC: Math.floor(prev.earnedHC + amount) }));
        queryClient.setQueryData(['balance', user.id], (old: number | undefined) => (old ?? 0) + amount);
        farmApi.claim().then(() => {
            queryClient.invalidateQueries({ queryKey: ['balance'] });
        }).catch(() => {
            queryClient.invalidateQueries({ queryKey: ['balance'] });
        });
    };

    const clickPowerCost = CLICK_POWER_COSTS[farm.clickPowerLevel] ?? null;
    const autoClickerCost = AUTO_CLICKER_COSTS[farm.autoClickerLevel] ?? null;
    const clickMultiplierCost = CLICK_MULTIPLIER_COSTS[farm.clickMultiplierLevel] ?? null;
    const autoSpeedCost = AUTO_SPEED_COSTS[farm.autoClickerSpeedLevel] ?? null;
    const currentIntervalLabel = ["1 000", "750", "500", "333", "250"][Math.min(farm.autoClickerSpeedLevel, 4)];
    const nextIntervalLabel = ["750", "500", "333", "250"][farm.autoClickerSpeedLevel] ?? null;

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.4,
                        ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
                    }}
                >
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            Фарм CaseHubCoin
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Кликайте и зарабатывайте внутреннюю валюту
                        </p>
                    </div>

                    {/* Pending pool */}
                    <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-card/90 to-card/90 p-5 backdrop-blur-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            <p className="text-sm text-muted-foreground mb-0.5">Банк авто-кликера</p>
                            <p className="text-2xl font-bold text-yellow-400 flex items-center gap-1.5">{farm.pendingHC.toLocaleString()} <Coins className="h-5 w-5" /></p>
                            <p className="text-xs text-muted-foreground mt-0.5">Накапливается автоматически (макс. 1 000)</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={claimPending}
                            disabled={farm.pendingHC <= 0}
                            className={`w-full sm:w-auto flex-shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                farm.pendingHC > 0
                                    ? "bg-yellow-500 text-black hover:bg-yellow-400 cursor-pointer"
                                    : "bg-border/40 text-muted-foreground cursor-not-allowed opacity-50"
                            }`}
                        >
                            Забрать
                        </motion.button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        <div className="rounded-xl border border-border/60 bg-card/80 p-4 text-center backdrop-blur-xl">
                            <MousePointerClick className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-foreground">{farm.totalClicks.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Кликов</p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-card/80 p-4 text-center backdrop-blur-xl">
                            <Zap className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-foreground flex items-center justify-center gap-1">{farm.clickPower * (farm.clickMultiplierLevel + 1)} <Coins className="h-4 w-4 text-orange-500" /></p>
                            <p className="text-xs text-muted-foreground">За клик</p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-card/80 p-4 text-center backdrop-blur-xl">
                            <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-foreground">{farm.autoClickerLevel}/сек</p>
                            <p className="text-xs text-muted-foreground">Авто</p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-card/80 p-4 text-center backdrop-blur-xl">
                            <Timer className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-foreground">{currentIntervalLabel}мс</p>
                            <p className="text-xs text-muted-foreground">Интервал</p>
                        </div>
                    </div>

                    {/* Clicker button */}
                    <div className="flex justify-center mb-10">
                        <div className="relative">
                            <motion.button
                                ref={buttonRef}
                                onClick={handleClick}
                                onMouseDown={() => setIsPressed(true)}
                                onMouseUp={() => setIsPressed(false)}
                                onMouseLeave={() => setIsPressed(false)}
                                whileTap={{ scale: 0.92 }}
                                className={`cursor-target relative w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-2xl shadow-orange-500/40 flex items-center justify-center cursor-pointer transition-all duration-100 select-none ${
                                    isPressed ? "shadow-orange-500/60" : ""
                                }`}
                            >
                                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-300/30 to-transparent" />
                                <Coins className="h-14 w-14 sm:h-20 sm:w-20 text-white drop-shadow-lg relative z-10" />
                            </motion.button>

                            {/* Click particles */}
                            <AnimatePresence>
                                {particles.map((p) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                                        animate={{ opacity: 0, y: -80, x: (Math.random() - 0.5) * 60, scale: 1.3 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.7, ease: "easeOut" }}
                                        className="absolute pointer-events-none text-white font-bold text-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
                                        style={{ left: p.x - 15, top: p.y - 15 }}
                                    >
                                        +{p.value}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Upgrades */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-orange-500" /> Улучшения
                        </h2>

                        {/* Click power upgrade */}
                        {clickPowerCost !== null ? (
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={upgradeClickPower}
                                disabled={realBalance < clickPowerCost}
                                className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
                                    realBalance >= clickPowerCost
                                        ? "border-orange-500/40 bg-card/80 hover:border-orange-500/60 cursor-pointer"
                                        : "border-border/40 bg-card/50 opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground text-sm sm:text-base">Усиленный клик <span className="text-xs text-muted-foreground ml-1">Lv.{farm.clickPowerLevel + 1}/{CLICK_POWER_COSTS.length}</span></p>
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                +1 за клик (сейчас: {farm.clickPower})
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-orange-500 flex items-center gap-1 flex-shrink-0">{clickPowerCost} <Coins className="h-3.5 w-3.5" /></span>
                                </div>
                            </motion.button>
                        ) : (
                            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-400 text-sm sm:text-base">Усиленный клик — MAX</p>
                                        <p className="text-sm text-muted-foreground">{farm.clickPower} за клик</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Click multiplier upgrade */}
                        {clickMultiplierCost !== null ? (
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={upgradeClickMultiplier}
                                disabled={realBalance < clickMultiplierCost}
                                className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
                                    realBalance >= clickMultiplierCost
                                        ? "border-purple-500/40 bg-card/80 hover:border-purple-500/60 cursor-pointer"
                                        : "border-border/40 bg-card/50 opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground text-sm sm:text-base">Мультипликатор <span className="text-xs text-muted-foreground ml-1">Lv.{farm.clickMultiplierLevel + 1}/{CLICK_MULTIPLIER_COSTS.length}</span></p>
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                Умножает доход с клика (сейчас: ×{farm.clickMultiplierLevel + 1})
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-purple-400 flex items-center gap-1 flex-shrink-0">{clickMultiplierCost} <Coins className="h-3.5 w-3.5" /></span>
                                </div>
                            </motion.button>
                        ) : (
                            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-400 text-sm sm:text-base">Мультипликатор — MAX</p>
                                        <p className="text-sm text-muted-foreground">×{farm.clickMultiplierLevel + 1} к каждому клику</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Auto-clicker upgrade */}
                        {autoClickerCost !== null ? (
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={upgradeAutoClicker}
                                disabled={realBalance < autoClickerCost}
                                className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
                                    realBalance >= autoClickerCost
                                        ? "border-orange-500/40 bg-card/80 hover:border-orange-500/60 cursor-pointer"
                                        : "border-border/40 bg-card/50 opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground text-sm sm:text-base">Авто-кликер <span className="text-xs text-muted-foreground ml-1">Lv.{farm.autoClickerLevel + 1}/{AUTO_CLICKER_COSTS.length}</span></p>
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                +1/тик автоматически (сейчас: {farm.autoClickerLevel}/сек)
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-orange-500 flex items-center gap-1 flex-shrink-0">{autoClickerCost} <Coins className="h-3.5 w-3.5" /></span>
                                </div>
                            </motion.button>
                        ) : (
                            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-400 text-sm sm:text-base">Авто-кликер — MAX</p>
                                        <p className="text-sm text-muted-foreground">{farm.autoClickerLevel}/сек</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Auto speed upgrade */}
                        {autoSpeedCost !== null ? (
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={upgradeAutoSpeed}
                                disabled={realBalance < autoSpeedCost}
                                className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
                                    realBalance >= autoSpeedCost
                                        ? "border-blue-500/40 bg-card/80 hover:border-blue-500/60 cursor-pointer"
                                        : "border-border/40 bg-card/50 opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground text-sm sm:text-base">Авто-скорость <span className="text-xs text-muted-foreground ml-1">Lv.{farm.autoClickerSpeedLevel + 1}/{AUTO_SPEED_COSTS.length}</span></p>
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                Интервал: {currentIntervalLabel}мс → {nextIntervalLabel}мс
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-blue-400 flex items-center gap-1 flex-shrink-0">{autoSpeedCost} <Coins className="h-3.5 w-3.5" /></span>
                                </div>
                            </motion.button>
                        ) : (
                            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-400 text-sm sm:text-base">Авто-скорость — MAX</p>
                                        <p className="text-sm text-muted-foreground">Интервал: {currentIntervalLabel}мс</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!user && (
                        <p className="text-center text-sm text-muted-foreground mt-8">
                            Войдите в аккаунт, чтобы заработанное начислялось на баланс
                        </p>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
