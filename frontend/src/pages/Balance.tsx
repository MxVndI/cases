import { motion, useReducedMotion } from "framer-motion";
import { Coins, TrendingUp, TrendingDown, Wallet, Gift } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { dummyBalance, dummySpinHistory } from "@/data/dummy-data";
import { CaseHubLogo } from "@/components/CaseHubLogo";

export function Balance() {
    const shouldReduceMotion = useReducedMotion();
    const balance = dummyBalance.hubCoins;
    const history = dummySpinHistory;

    // Подсчет статистики
    const totalSpent = history.reduce((sum, h) => sum + h.cost, 0);
    const totalWon = history.reduce((sum, h) => sum + h.wonItem.price, 0);
    const profit = totalWon - totalSpent;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Баланс
                        </h1>
                        <p className="text-muted-foreground">
                            Управляйте своими HubCoin и отслеживайте статистику
                        </p>
                    </div>

                    {/* Карточка баланса */}
                    <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-card/90 to-card/90 p-8 backdrop-blur-xl shadow-2xl shadow-orange-500/10 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                    <Coins className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Текущий баланс
                                    </p>
                                    <p className="text-4xl font-bold text-white">
                                        {balance.toLocaleString()} HC
                                    </p>
                                    <p className="text-sm text-orange-400 mt-1">
                                        ≈ ${(balance * 0.01).toFixed(2)} USD
                                    </p>
                                </div>
                            </div>
                            <div className="opacity-50">
                                <CaseHubLogo size={80} />
                            </div>
                        </div>
                    </div>

                    {/* Статистика */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                </div>
                                <span className="text-sm text-muted-foreground">Потрачено</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                {totalSpent} HC
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                </div>
                                <span className="text-sm text-muted-foreground">Выиграно</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                {totalWon} HC
                            </p>
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
                                {profit >= 0 ? "+" : ""}{profit} HC
                            </p>
                        </div>
                    </div>

                    {/* Действия */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="rounded-2xl border border-orange-500/50 bg-orange-500 p-6 text-left hover:bg-orange-600 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Wallet className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">Пополнить баланс</p>
                                    <p className="text-sm text-white/70">Быстро и безопасно</p>
                                </div>
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="rounded-2xl border border-border/60 bg-card/80 p-6 text-left hover:border-orange-500/50 transition-colors"
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
                            История прокруток
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
                                        <p className="font-semibold text-orange-500">+{item.wonItem.price} HC</p>
                                        <p className="text-xs text-muted-foreground">-{item.cost} HC</p>
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
