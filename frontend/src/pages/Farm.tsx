import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/AuthContext";
import { mockAuth } from "@/services/api";
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
    const [farm, setFarm] = useState<FarmState>(loadFarmState);
    const [isPressed, setIsPressed] = useState(false);
    const [particles, setParticles] = useState<ClickParticle[]>([]);
    const particleIdRef = useRef(0);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Save farm state on change
    useEffect(() => {
        saveFarmState(farm);
    }, [farm]);

    // Auto-clicker
    useEffect(() => {
        if (farm.autoClickerLevel <= 0) return;
        const interval_ms = AUTO_CLICK_INTERVALS[Math.min(farm.autoClickerSpeedLevel, AUTO_CLICK_INTERVALS.length - 1)];
        const interval = setInterval(() => {
            const gain = farm.autoClickerLevel;
            setFarm(prev => ({
                ...prev,
                pendingHC: prev.pendingHC + gain,
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
            mockAuth.updateBalance(gain);
        }
    }, [farm.clickPower, farm.clickMultiplierLevel, user]);

    const upgradeClickPower = () => {
        const cost = CLICK_POWER_COSTS[farm.clickPowerLevel] || 999999;
        if (farm.earnedHC < cost) return;
        setFarm(prev => ({
            ...prev,
            earnedHC: prev.earnedHC - cost,
            clickPower: prev.clickPower + 1,
            clickPowerLevel: prev.clickPowerLevel + 1,
        }));
        if (user) {
            mockAuth.updateBalance(-cost);
        }
    };

    const upgradeAutoClicker = () => {
        const cost = AUTO_CLICKER_COSTS[farm.autoClickerLevel] || 999999;
        if (farm.earnedHC < cost) return;
        setFarm(prev => ({
            ...prev,
            earnedHC: prev.earnedHC - cost,
            autoClickerLevel: prev.autoClickerLevel + 1,
        }));
        if (user) {
            mockAuth.updateBalance(-cost);
        }
    };

    const upgradeClickMultiplier = () => {
        const cost = CLICK_MULTIPLIER_COSTS[farm.clickMultiplierLevel];
        if (!cost || farm.earnedHC < cost) return;
        setFarm(prev => ({
            ...prev,
            earnedHC: prev.earnedHC - cost,
            clickMultiplierLevel: prev.clickMultiplierLevel + 1,
        }));
        if (user) {
            mockAuth.updateBalance(-cost);
        }
    };

    const upgradeAutoSpeed = () => {
        const cost = AUTO_SPEED_COSTS[farm.autoClickerSpeedLevel];
        if (!cost || farm.earnedHC < cost) return;
        setFarm(prev => ({
            ...prev,
            earnedHC: prev.earnedHC - cost,
            autoClickerSpeedLevel: prev.autoClickerSpeedLevel + 1,
        }));
        if (user) {
            mockAuth.updateBalance(-cost);
        }
    };

    const claimPending = () => {
        if (farm.pendingHC <= 0) return;
        const amount = farm.pendingHC;
        setFarm(prev => ({ ...prev, earnedHC: prev.earnedHC + amount, pendingHC: 0 }));
        if (user) {
            mockAuth.updateBalance(amount);
        }
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

                    {/* Earned total */}
                    <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-card/90 to-card/90 p-6 backdrop-blur-xl mb-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Заработано за всё время</p>
                        <p className="text-3xl font-bold text-orange-500 flex items-center justify-center gap-1.5">{farm.earnedHC.toLocaleString()} <Coins className="h-6 w-6" /></p>
                    </div>

                    {/* Pending pool */}
                    <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-card/90 to-card/90 p-5 backdrop-blur-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            <p className="text-sm text-muted-foreground mb-0.5">Банк авто-кликера</p>
                            <p className="text-2xl font-bold text-yellow-400 flex items-center gap-1.5">{farm.pendingHC.toLocaleString()} <Coins className="h-5 w-5" /></p>
                            <p className="text-xs text-muted-foreground mt-0.5">Накапливается автоматически — заберите вручную</p>
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
                                className={`relative w-48 h-48 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-2xl shadow-orange-500/40 flex items-center justify-center cursor-pointer transition-all duration-100 select-none ${
                                    isPressed ? "shadow-orange-500/60" : ""
                                }`}
                            >
                                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-300/30 to-transparent" />
                                <Coins className="h-20 w-20 text-white drop-shadow-lg relative z-10" />
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
                                disabled={farm.earnedHC < clickPowerCost}
                                className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
                                    farm.earnedHC >= clickPowerCost
                                        ? "border-orange-500/40 bg-card/80 hover:border-orange-500/60 cursor-pointer"
                                        : "border-border/40 bg-card/50 opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                                            <Zap className="h-6 w-6 text-yellow-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">Усиленный клик <span className="text-xs text-muted-foreground ml-1">Lv.{farm.clickPowerLevel + 1}/{CLICK_POWER_COSTS.length}</span></p>
                                            <p className="text-sm text-muted-foreground">
                                                +1 за клик (сейчас: {farm.clickPower})
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-orange-500 flex items-center gap-1">{clickPowerCost} <Coins className="h-3.5 w-3.5" /></span>
                                </div>
                            </motion.button>
                        ) : (
                            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                        <Zap className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-400">Усиленный клик — MAX</p>
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
                                disabled={farm.earnedHC < clickMultiplierCost}
                                className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
                                    farm.earnedHC >= clickMultiplierCost
                                        ? "border-purple-500/40 bg-card/80 hover:border-purple-500/60 cursor-pointer"
                                        : "border-border/40 bg-card/50 opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                            <Layers className="h-6 w-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">Мультипликатор <span className="text-xs text-muted-foreground ml-1">Lv.{farm.clickMultiplierLevel + 1}/{CLICK_MULTIPLIER_COSTS.length}</span></p>
                                            <p className="text-sm text-muted-foreground">
                                                Умножает доход с клика (сейчас: ×{farm.clickMultiplierLevel + 1})
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-purple-400 flex items-center gap-1">{clickMultiplierCost} <Coins className="h-3.5 w-3.5" /></span>
                                </div>
                            </motion.button>
                        ) : (
                            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                        <Layers className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-400">Мультипликатор — MAX</p>
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
                                disabled={farm.earnedHC < autoClickerCost}
                                className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
                                    farm.earnedHC >= autoClickerCost
                                        ? "border-orange-500/40 bg-card/80 hover:border-orange-500/60 cursor-pointer"
                                        : "border-border/40 bg-card/50 opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="h-6 w-6 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">Авто-кликер <span className="text-xs text-muted-foreground ml-1">Lv.{farm.autoClickerLevel + 1}/{AUTO_CLICKER_COSTS.length}</span></p>
                                            <p className="text-sm text-muted-foreground">
                                                +1/тик автоматически (сейчас: {farm.autoClickerLevel}/сек)
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-orange-500 flex items-center gap-1">{autoClickerCost} <Coins className="h-3.5 w-3.5" /></span>
                                </div>
                            </motion.button>
                        ) : (
                            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-400">Авто-кликер — MAX</p>
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
                                disabled={farm.earnedHC < autoSpeedCost}
                                className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
                                    farm.earnedHC >= autoSpeedCost
                                        ? "border-blue-500/40 bg-card/80 hover:border-blue-500/60 cursor-pointer"
                                        : "border-border/40 bg-card/50 opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                            <Timer className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">Авто-скорость <span className="text-xs text-muted-foreground ml-1">Lv.{farm.autoClickerSpeedLevel + 1}/{AUTO_SPEED_COSTS.length}</span></p>
                                            <p className="text-sm text-muted-foreground">
                                                Интервал: {currentIntervalLabel}мс → {nextIntervalLabel}мс
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-blue-400 flex items-center gap-1">{autoSpeedCost} <Coins className="h-3.5 w-3.5" /></span>
                                </div>
                            </motion.button>
                        ) : (
                            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                        <Timer className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-400">Авто-скорость — MAX</p>
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
