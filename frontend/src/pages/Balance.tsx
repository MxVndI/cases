import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/AuthContext";
import { paymentApi } from "@/services/api";
import { Coins, TrendingUp, TrendingDown, Gift, Pickaxe } from "lucide-react";

function loadFarmEarned(): number {
    try {
        const stored = localStorage.getItem("farmState");
        if (!stored) return 0;
        return Math.floor(JSON.parse(stored).earnedHC ?? 0);
    } catch {
        return 0;
    }
}

export function Balance() {
    const shouldReduceMotion = useReducedMotion();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const earnedHC = loadFarmEarned();
    const [bonusMsg, setBonusMsg] = useState<string | null>(null);
    const [bonusClaiming, setBonusClaiming] = useState(false);
    const [bonusClaimedToday, setBonusClaimedToday] = useState(false);

    const { data: balance = 0, isLoading: balanceLoading } = useQuery({
        queryKey: ['balance', user?.id],
        queryFn: () => paymentApi.getBalance(user!.id),
        enabled: !!user,
        staleTime: 30_000,
        refetchOnMount: 'always',
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['transactions', user?.id],
        queryFn: () => paymentApi.getTransactions(user!.id),
        enabled: !!user,
        staleTime: 30_000,
        refetchOnMount: 'always',
    });

    // Подсчет статистики из транзакций
    const totalSpent = Math.floor(transactions
        .filter(t => t.from === user?.id)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0));
    const allReceived = Math.floor(transactions
        .filter(t => t.to === user?.id)
        .reduce((sum, t) => sum + t.amount, 0));
    // Exclude farm earnings — they have a separate tile ("Заработано")
    const totalReceived = Math.max(0, allReceived - earnedHC);
    const profit = totalReceived - totalSpent;

    const sortedTransactions = [...transactions]
        .filter(tx => Boolean(tx.created_at))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const today = new Date().toDateString();
    const claimedFromTransactions = sortedTransactions.some((tx) =>
        tx.to === user?.id &&
        tx.from === "00000000-0000-0000-0000-000000000000" &&
        tx.amount === 100 &&
        new Date(tx.created_at).toDateString() === today
    );

    useEffect(() => {
        if (!user?.id) {
            setBonusClaimedToday(false);
            return;
        }

        const storedDate = localStorage.getItem(`daily_bonus_claimed:${user.id}`);
        const claimedFromStorage = storedDate === today;
        setBonusClaimedToday(claimedFromStorage || claimedFromTransactions);
    }, [user?.id, today, claimedFromTransactions]);

    const handleDailyBonus = async () => {
        if (bonusClaiming || bonusClaimedToday) return;
        setBonusClaiming(true);
        setBonusMsg(null);
        try {
            const result = await paymentApi.claimDailyBonus();
            setBonusMsg(result.message);
            if (result.success) {
                if (user?.id) {
                    localStorage.setItem(`daily_bonus_claimed:${user.id}`, today);
                }
                setBonusClaimedToday(true);
                queryClient.invalidateQueries({ queryKey: ['balance'] });
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
            } else {
                setBonusClaimedToday(true);
            }
        } catch {
            setBonusMsg("Ошибка при получении бонуса");
        } finally {
            setBonusClaiming(false);
        }
    };

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
                    <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-card/90 to-card/90 p-5 sm:p-8 backdrop-blur-xl shadow-2xl shadow-orange-500/10 mb-8">
                        <div className="flex items-center">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                    <Coins className="h-7 w-7 sm:h-10 sm:w-10 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Текущий баланс
                                    </p>
                                    <p className="text-3xl sm:text-4xl font-bold text-white">
                                        {balanceLoading ? "..." : balance.toLocaleString()}
                                    </p>

                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Статистика */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
                        <div className="rounded-2xl border border-border/60 bg-card/80 p-3 sm:p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                                </div>
                                <span className="text-xs sm:text-sm text-muted-foreground truncate">Потрачено</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalSpent.toLocaleString()}</p>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card/80 p-3 sm:p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                </div>
                                <span className="text-xs sm:text-sm text-muted-foreground truncate">Получено</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalReceived.toLocaleString()}</p>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card/80 p-3 sm:p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    profit >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                                }`}>
                                    {profit >= 0 ? (
                                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                                    )}
                                </div>
                                <span className="text-xs sm:text-sm text-muted-foreground truncate">Профит</span>
                            </div>
                            <p className={`text-xl sm:text-2xl font-bold ${
                                profit >= 0 ? "text-green-500" : "text-red-500"
                            }`}>
                                {profit >= 0 ? "+" : ""}{profit.toLocaleString()}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card/80 p-3 sm:p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Pickaxe className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                                </div>
                                <span className="text-xs sm:text-sm text-muted-foreground truncate">Заработано</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-orange-500">{earnedHC.toLocaleString()}</p>
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
                            whileHover={bonusClaimedToday ? undefined : { scale: 1.02 }}
                            whileTap={bonusClaimedToday ? undefined : { scale: 0.98 }}
                            onClick={handleDailyBonus}
                            disabled={bonusClaiming || bonusClaimedToday}
                            className={`rounded-2xl border p-6 text-left transition-colors ${
                                bonusClaimedToday
                                    ? "border-border/60 bg-card/70 cursor-not-allowed opacity-70"
                                    : "border-yellow-400/60 bg-gradient-to-br from-yellow-300/25 to-amber-400/20 hover:border-yellow-300 shadow-lg shadow-yellow-500/10 cursor-pointer"
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    bonusClaimedToday ? "bg-orange-500/10" : "bg-yellow-400/20"
                                }`}>
                                    <Gift className={`h-6 w-6 ${bonusClaimedToday ? "text-orange-500" : "text-yellow-300"}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">
                                        {bonusClaiming
                                            ? "Получение..."
                                            : bonusClaimedToday
                                                ? "Бонус уже забран"
                                                : "Получить бонус"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {bonusMsg ?? (bonusClaimedToday ? "Приходите завтра за новым бонусом" : "Ежедневная награда — 100 CHC")}
                                    </p>
                                </div>
                            </div>
                        </motion.button>
                    </div>

                    {/* История транзакций */}
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-5 sm:p-6 backdrop-blur-xl">
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
                            История транзакций
                        </h2>
                        <div className="space-y-3">
                            {sortedTransactions.slice(0, 10).map((tx) => {
                                const isIncoming = tx.to === user?.id;
                                const label = tx.description || (isIncoming ? "Получено" : "Списано");
                                const txDate = tx.created_at ? new Date(tx.created_at) : null;
                                const isFarm = tx.description?.startsWith("Фарм");
                                const isBonus = tx.description?.startsWith("Ежедневный бонус");

                                let iconBg: string;
                                let iconBorder: string;
                                let icon: React.ReactNode;

                                if (isFarm) {
                                    iconBg = "bg-orange-500/10";
                                    iconBorder = "border-orange-500";
                                    icon = <Pickaxe className="h-5 w-5 text-orange-500" />;
                                } else if (isBonus) {
                                    iconBg = "bg-purple-500/10";
                                    iconBorder = "border-purple-500";
                                    icon = <Gift className="h-5 w-5 text-purple-500" />;
                                } else if (isIncoming) {
                                    iconBg = "bg-green-500/10";
                                    iconBorder = "border-green-500";
                                    icon = <TrendingUp className="h-5 w-5 text-green-500" />;
                                } else {
                                    iconBg = "bg-red-500/10";
                                    iconBorder = "border-red-500";
                                    icon = <TrendingDown className="h-5 w-5 text-red-500" />;
                                }

                                const amountColor = isIncoming ? "text-green-500" : "text-red-500";

                                return (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${iconBorder} ${iconBg}`}>
                                                {icon}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {label}
                                                </p>
                                                {txDate && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {txDate.toLocaleDateString("ru-RU")} {txDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <p className={`font-semibold flex items-center gap-1 ${amountColor}`}>
                                            {isIncoming ? "+" : "-"}{Math.floor(Math.abs(tx.amount)).toLocaleString()}
                                        </p>
                                    </div>
                                );
                            })}
                            {sortedTransactions.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">Нет транзакций</p>
                            )}
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
