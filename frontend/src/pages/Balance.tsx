import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Coins, TrendingUp, TrendingDown, Gift, Pickaxe } from "lucide-react";
import { dummyBalance, dummySpinHistory } from "@/data/dummy-data";

function loadFarmEarned(): number {
    try {
        const stored = localStorage.getItem("farmState");
        if (!stored) return 0;
        return JSON.parse(stored).earnedHC ?? 0;
    } catch {
        return 0;
    }
}

export function Balance() {
    const shouldReduceMotion = useReducedMotion();
    const balance = dummyBalance.hubCoins;
    const history = dummySpinHistory;
    const earnedHC = loadFarmEarned();

    // Подсчет статистики
    const totalSpent = history.reduce((sum, h) => sum + h.cost, 0);
    const totalWon = history.reduce((sum, h) => sum + h.wonItem.price, 0);
    const profit = totalWon - totalSpent;

    return (
        <div className="relative min-h-screen bg-background">
            {/* Full-left "На главную" edge button — fixed to viewport */}
            <Link
                to="/"
                aria-label="На главную"
                className="peer/home-edge fixed inset-y-0 left-0 z-10 w-24 cursor-pointer"
            />
            <Link
                to="/"
                className="peer/home fixed left-8 top-1/2 z-20 -translate-y-1/2 origin-left transform-gpu text-2xl font-semibold text-muted-foreground transition-all duration-300 ease-out hover:scale-110 hover:text-white peer-hover/home-edge:scale-110 peer-hover/home-edge:text-white"
            >
                На главную
            </Link>
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-y-0 left-0 z-0 w-[30vw] max-w-[440px] opacity-0 transition-opacity duration-300 ease-out peer-hover/home:opacity-100 peer-hover/home-edge:opacity-100 bg-[linear-gradient(to_right,rgba(249,115,22,0.11),rgba(251,146,60,0.055)_35%,rgba(255,200,120,0.02)_65%,transparent),conic-gradient(from_290deg_at_0%_50%,rgba(249,115,22,0.06),rgba(251,146,60,0.025),transparent,rgba(249,115,22,0.04))] blur-xl"
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
                    {/* Заголовок */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            Баланс
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Управляйте своими CaseHubCoin и отслеживайте статистику
                        </p>
                    </div>

                    {/* Карточка баланса */}
                    <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-card/90 to-card/90 p-8 backdrop-blur-xl shadow-2xl shadow-orange-500/10 mb-8">
                        <div className="flex items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                    <Coins className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Текущий баланс
                                    </p>
                                    <p className="text-4xl font-bold text-white">
                                        {balance.toLocaleString()}
                                    </p>

                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Статистика */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                </div>
                                <span className="text-sm text-muted-foreground">Потрачено</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground flex items-center gap-1">{totalSpent} <Coins className="h-5 w-5 text-red-500" /></p>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                </div>
                                <span className="text-sm text-muted-foreground">Выиграно</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground flex items-center gap-1">{totalWon} <Coins className="h-5 w-5 text-green-500" /></p>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                    <Coins className="h-5 w-5 text-orange-500" />
                                </div>
                                <span className="text-sm text-muted-foreground">Заработано</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-500 flex items-center gap-1">{earnedHC.toLocaleString()} <Coins className="h-5 w-5" /></p>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    profit >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                                }`}>
                                    {profit >= 0 ? (
                                        <TrendingUp className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <TrendingDown className="h-5 w-5 text-red-500" />
                                    )}
                                </div>
                                <span className="text-sm text-muted-foreground">Профит</span>
                            </div>
                            <p className={`text-2xl font-bold ${
                                profit >= 0 ? "text-green-500" : "text-red-500"
                            }`}>
                                {profit >= 0 ? "+" : ""}{profit} <Coins className="h-5 w-5 ml-1" />
                            </p>
                        </div>
                    </div>

                    {/* Действия */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <Link to="/farm">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="rounded-2xl border border-border/60 bg-card/80 p-6 text-left hover:border-orange-500/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                        <Pickaxe className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Фарм CaseHubCoin</p>
                                        <p className="text-sm text-muted-foreground">Кликайте и зарабатывайте</p>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="rounded-2xl border border-border/60 bg-card/80 p-6 text-left hover:border-orange-500/50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                    <Gift className="h-6 w-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">Получить бонус</p>
                                    <p className="text-sm text-muted-foreground">Ежедневная награда</p>
                                </div>
                            </div>
                        </motion.button>
                    </div>

                    {/* История транзакций */}
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                        <h2 className="text-xl font-semibold text-foreground mb-4">
                            История открытий
                        </h2>
                        <div className="space-y-3">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${
                                            item.wonItem.rarity === "legendary" ? "border-orange-500 bg-orange-500/10" :
                                            item.wonItem.rarity === "epic" ? "border-purple-500 bg-purple-500/10" :
                                            item.wonItem.rarity === "rare" ? "border-blue-500 bg-blue-500/10" :
                                            "border-gray-500 bg-gray-500/10"
                                        }`}>
                                            <Gift className={`h-5 w-5 ${
                                                item.wonItem.rarity === "legendary" ? "text-orange-500" :
                                                item.wonItem.rarity === "epic" ? "text-purple-500" :
                                                item.wonItem.rarity === "rare" ? "text-blue-500" :
                                                "text-gray-500"
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{item.wonItem.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.caseName} • {new Date(item.spinDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-orange-500 flex items-center gap-1">+{item.wonItem.price} <Coins className="h-3.5 w-3.5" /></p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">-{item.cost} <Coins className="h-3 w-3" /></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
