import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, useReducedMotion } from "framer-motion";
import type { FormEvent } from "react";
import { useState } from 'react';
import { useAuth } from '@/AuthContext';
import { FaDiscord, FaGoogle, FaYandexInternational } from "react-icons/fa";
import { Mail } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { CaseHubLogo } from "@/components/CaseHubLogo";
const socialProviders = [
    // { name: "Google", icon: FaGoogle, id: "google" },
    { name: "Discord", icon: FaDiscord, id: "discord" },
    { name: "Яндекс", icon: FaYandexInternational, id: "yandex" },
];

export function Login() {
    const shouldReduceMotion = useReducedMotion();
    const { user, isLoading, login, logout } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log("Email login:", email, password);
        // После успешного входа редиректим на профиль
        navigate({ to: '/profile' });
    };

    // Если пользователь уже авторизован, редиректим на профиль
    if (user) {
        navigate({ to: '/profile' });
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.45,
                    ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
                }}
                className="group w-full max-w-md rounded-3xl overflow-hidden border border-orange-500/30 bg-card/90 p-8 backdrop-blur-xl sm:p-10 relative shadow-2xl shadow-orange-500/10"
                role="form"
                aria-labelledby="login-title"
            >
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10"
                />

                {/* Логотип */}
                <div className="flex justify-center mb-6">
                    <CaseHubLogo size={64} />
                </div>

                <div className="mb-8 space-y-2 text-center">
                    <h1
                        id="login-title"
                        className="text-2xl font-semibold text-foreground sm:text-3xl"
                    >
                        Вход в CaseHub
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Войдите, чтобы продолжить работу
                    </p>
                </div>

                {/* Форма email */}
                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-foreground">
                            Электронная почта
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 rounded-xl border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground">
                            Пароль
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="rounded-xl border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-border/60 bg-background/50 text-orange-500 focus:ring-orange-500/20"
                            />
                            <span className="text-sm text-muted-foreground">Запомнить меня</span>
                        </label>
                        <a href="#" className="text-sm text-orange-500 hover:text-orange-400 transition-colors">
                            Забыли пароль?
                        </a>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20"
                    >
                        Войти
                    </Button>
                </form>

                {/* Разделитель */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/40"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card/90 px-4 text-muted-foreground backdrop-blur-sm rounded-full">
                            или через
                        </span>
                    </div>
                </div>

                {/* Социальные сети */}
                <div className="grid gap-3 sm:grid-cols-3 mb-6">
                    {socialProviders.map((provider) => (
                        <Button
                            key={provider.name}
                            variant="outline"
                            onClick={() => login(provider.id)}
                            className="flex items-center justify-center gap-2 rounded-xl border-border/60 bg-card/70 text-sm text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:text-orange-500"
                            aria-label={`Войти через ${provider.name}`}
                        >
                            <provider.icon className="h-4 w-4" aria-hidden />
                            <span className="hidden sm:inline">{provider.name}</span>
                        </Button>
                    ))}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Продолжая, вы соглашаетесь с нашими{" "}
                    <a href="#" className="text-orange-500 hover:text-orange-400 transition-colors">
                        условиями использования
                    </a>{" "}
                    и{" "}
                    <a href="#" className="text-orange-500 hover:text-orange-400 transition-colors">
                        политикой конфиденциальности
                    </a>
                    .
                </p>
            </motion.div>
        </div>
    );
}
