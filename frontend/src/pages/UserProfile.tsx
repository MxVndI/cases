import { motion, useReducedMotion } from "framer-motion";
import { useParams, Link } from "@tanstack/react-router";
import { dummyUsers, dummyRecentWins } from "@/data/dummy-data";
import { User, Calendar, Coins, Box, Trophy } from "lucide-react";
import { useAuth } from "@/AuthContext";

export function UserProfile() {
    const shouldReduceMotion = useReducedMotion();
    const { userName } = useParams({ strict: false });
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === "admin";
    const profileUser = dummyUsers.find((u) => u.nickname === userName);
    const userWins = dummyRecentWins.filter((w) => w.player === userName);

    if (!profileUser) {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground mb-2">Пользователь не найден</h2>
                        <Link to="/" className="text-orange-500 hover:text-orange-400 transition-colors">
                            На главную
                        </Link>
                    </div>
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

                    {/* Profile card */}
                    <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-orange-500/10 via-card/90 to-card/90 p-5 sm:p-8 backdrop-blur-xl shadow-xl mb-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                                <User className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                                        {profileUser.nickname}
                                    </h1>
                                    {isAdmin && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            profileUser.status === "active"
                                                ? "bg-green-500/20 border border-green-500/30 text-green-400"
                                                : "bg-red-500/20 border border-red-500/30 text-red-400"
                                        }`}>
                                            {profileUser.status === "active" ? "Активен" : "Заблокирован"}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Дата регистрации: {new Date(profileUser.registeredAt).toLocaleDateString("ru-RU")}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-border/60 bg-background/30 p-4 text-center">
                                <Coins className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                                <p className="text-lg font-bold text-foreground">{profileUser.balance.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Баланс</p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-background/30 p-4 text-center">
                                <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                                <p className="text-lg font-bold text-foreground">{userWins.length}</p>
                                <p className="text-xs text-muted-foreground">Открыто кейсов</p>
                            </div>
                            {isAdmin && (
                                <div className="rounded-xl border border-border/60 bg-background/30 p-4 text-center">
                                    <User className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-foreground">{profileUser.role === "admin" ? "Администратор" : "Пользователь"}</p>
                                    <p className="text-xs text-muted-foreground">Роль</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent wins */}
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl mb-8">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-orange-500" /> Последние выигрыши
                        </h2>
                        {userWins.length > 0 ? (
                            <div className="space-y-3">
                                {userWins.map((win, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                                                <Box className="h-5 w-5 text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{win.item}</p>
                                                <p className="text-sm text-muted-foreground">{win.caseName}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-orange-500 flex items-center gap-1">{win.price.toLocaleString()} <Coins className="h-3.5 w-3.5" /></span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-6">
                                У этого пользователя пока нет выигрышей
                            </p>
                        )}
                    </div>

                    {/* Stub notice */}
                    <div className="rounded-2xl border border-border/40 bg-card/50 p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Это страница-заглушка профиля другого игрока. 
                            Полная версия будет доступна после подключения бэкенда.
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
