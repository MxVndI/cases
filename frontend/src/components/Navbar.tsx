import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { paymentApi } from "@/services/api";
import { Coins, ChevronDown, LogOut, User } from "lucide-react";
import caseHubLogo from "@/assets/casehub-logo.svg";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
    const { user, logout } = useAuth();

    const { data: balance } = useQuery({
        queryKey: ['balance', user?.id],
        queryFn: () => paymentApi.getBalance(user!.id),
        enabled: !!user,
        staleTime: 5_000,
        refetchInterval: 10_000,
    });

    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-lg"
        >
            <div className="px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="inline-flex h-full flex-shrink-0 items-center">
                        <img src={caseHubLogo} alt="CaseHub" className="h-8 w-auto" />
                    </Link>

                    <div className="flex items-center gap-3 sm:gap-5">
                        {user ? (
                            <>
                                {/* Balance — visible sm+ */}
                                <Link
                                    to="/balance"
                                    className="hidden sm:flex items-center gap-1.5 text-lg text-orange-500 font-bold hover:text-orange-400 transition-colors"
                                >
                                    <Coins className="h-4 w-4" />
                                    {(balance ?? 0).toLocaleString()}
                                </Link>

                                {/* Username dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-white hover:text-white/80 transition-colors cursor-pointer outline-none select-none rounded-lg border border-border/40 px-2.5 sm:px-3 py-1.5 hover:border-orange-500/40 max-w-[160px] sm:max-w-none truncate">
                                            <span className="truncate">{user.nickname || user.email || "Пользователь"}</span>
                                            <ChevronDown className="h-4 w-4 opacity-60 flex-shrink-0" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-card border-border/60 text-foreground backdrop-blur-xl">
                                        {/* Balance — only on mobile (hidden sm+) */}
                                        <DropdownMenuItem asChild className="sm:hidden">
                                            <Link to="/balance" className="flex items-center gap-2 cursor-pointer">
                                                <Coins className="h-4 w-4 text-orange-500" />
                                                <span className="text-orange-500 font-semibold">{(balance ?? 0).toLocaleString()}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="sm:hidden" />
                                        <DropdownMenuItem asChild>
                                            <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                                                <User className="h-4 w-4" />
                                                Профиль
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => logout()}
                                            className="flex items-center gap-2 text-red-400 focus:text-red-400 cursor-pointer"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Выйти
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="group/button inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 sm:px-5 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-all duration-300 ease-out"
                            >
                                <span className="transition-all duration-300 ease-out">Войти</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
