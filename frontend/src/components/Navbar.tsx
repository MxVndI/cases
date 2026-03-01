import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/AuthContext";
import { User, LogOut, Coins } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaseHubLogo } from "@/components/CaseHubLogo";
import { dummyBalance } from "@/data/dummy-data";

export function Navbar() {
    const { user, logout } = useAuth();
    const balance = dummyBalance.hubCoins;

    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full border-b border-border/40 bg-card/80 backdrop-blur-xl sticky top-0 z-50"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <CaseHubLogo size={40} />
                            <span className="text-lg font-semibold text-foreground">CaseHub</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link
                            to="/"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Главная
                        </Link>
                        <Link
                            to="/cases"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Кейсы
                        </Link>
                        {user &&
                            <Link
                                to="/balance"
                                className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 transition-colors"
                            >
                                <Coins className="h-4 w-4" />
                                <span className="font-medium">{balance} HC</span>
                            </Link>
                        }
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 rounded-full bg-orange-500/10 p-1.5 hover:bg-orange-500/20 transition-colors">
                                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56 rounded-xl border-border/60 bg-card/95 backdrop-blur-xl"
                                >
                                    <div className="px-4 py-3 border-b border-border/40">
                                        <p className="text-sm font-medium text-foreground">
                                            {user.nickname || "Пользователь"}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile" className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            Профиль
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/40" />
                                    <DropdownMenuItem
                                        onClick={() => logout()}
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Выйти
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link
                                to="/login"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Войти
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
