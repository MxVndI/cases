import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, useReducedMotion } from "framer-motion";
import type { FormEvent } from "react";
import { useState } from 'react';
import { useAuth } from '@/AuthContext';
import { FaDiscord, FaYandexInternational } from "react-icons/fa";
import { KeyRound, Mail } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { mockAuth } from "@/services/api";
import caseHubLogo from "@/assets/casehub-logo.svg";
const socialProviders = [
    // { name: "Google", icon: FaGoogle, id: "google" },
    { name: "Discord", icon: FaDiscord, id: "discord" },
    { name: "Яндекс", icon: FaYandexInternational, id: "yandex" },
];

export function Login() {
    const shouldReduceMotion = useReducedMotion();
    const { user, login, refetchUser } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        mockAuth.login(email, password);
        await refetchUser();
        navigate({ to: '/' });
    };

    // Если пользователь уже авторизован, редиректим на профиль
    if (user) {
        navigate({ to: '/' });
        return null;
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
            <Link
                to="/"
                aria-label="На главную"
                className="peer/home-edge fixed inset-y-0 left-0 z-10 w-24 cursor-pointer"
            />
            <Link
                to="/register"
                aria-label="Нет аккаунта?"
                className="peer/register-edge fixed inset-y-0 right-0 z-10 w-24 cursor-pointer"
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
            <Link
                to="/register"
                className="peer/register fixed right-8 top-1/2 z-20 -translate-y-1/2 origin-right transform-gpu text-2xl font-semibold text-muted-foreground transition-all duration-300 ease-out hover:scale-110 hover:text-white peer-hover/register-edge:scale-110 peer-hover/register-edge:text-white"
            >
                Нет аккаунта?
            </Link>
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-y-0 right-0 z-0 w-[30vw] max-w-[440px] opacity-0 transition-opacity duration-300 ease-out peer-hover/register:opacity-100 peer-hover/register-edge:opacity-100 bg-[linear-gradient(to_left,rgba(255,255,255,0.09),rgba(255,255,255,0.045)_35%,rgba(255,255,255,0.015)_65%,transparent),conic-gradient(from_250deg_at_100%_50%,rgba(255,255,255,0.055),rgba(255,255,255,0.02),transparent,rgba(255,255,255,0.04))] blur-xl"
            />
            <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.45,
                    ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
                }}
                className="group relative z-10 w-full max-w-md rounded-3xl overflow-hidden border border-orange-500/30 bg-card/90 p-8 backdrop-blur-xl sm:p-10 shadow-2xl shadow-orange-500/10"
                role="form"
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-100"
                >
                    <div className="absolute -left-10 -top-8 h-52 w-80 rounded-[28%_72%_55%_45%/44%_41%_59%_56%] bg-orange-500/14 blur-[110px] rotate-[-10deg]" />
                    <div className="absolute -right-14 top-10 h-60 w-72 rounded-[64%_36%_42%_58%/50%_38%_62%_50%] bg-orange-400/12 blur-[125px] rotate-[14deg]" />
                    <div className="absolute left-6 bottom-0 h-56 w-96 rounded-[37%_63%_70%_30%/34%_44%_56%_66%] bg-white/8 blur-[130px] rotate-[-6deg]" />
                    <div className="absolute right-8 -bottom-14 h-48 w-64 rounded-[58%_42%_33%_67%/52%_62%_38%_48%] bg-orange-500/10 blur-[115px] rotate-[18deg]" />
                </div>

                {/* Логотип */}
                <div className="flex justify-center mb-10">
                    <img src={caseHubLogo} alt="CaseHub" className="h-14 w-auto" />
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
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 rounded-xl border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-border/60 bg-black/60 text-orange-500 focus:ring-orange-500/20"
                            />
                            <span className="text-sm text-muted-foreground">Запомнить меня</span>
                        </label>
                        <a
                            href="#"
                            className="text-sm text-orange-500 hover:text-white transition-colors duration-300 ease-out"
                        >
                            Забыли пароль?
                        </a>
                    </div>

                    <Button
                        type="submit"
                        className="w-full cursor-pointer bg-orange-500 hover:bg-white text-white hover:text-black font-semibold py-6 rounded-xl transition-all duration-300 ease-out"
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
                            или
                        </span>
                    </div>
                </div>

                {/* Социальные сети */}
                <div className="mx-auto mb-6 grid w-full max-w-xs grid-cols-2 gap-3">
                    {socialProviders.map((provider) => (
                        <Button
                            key={provider.name}
                            variant="outline"
                            onClick={() => login(provider.id)}
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-border/60 bg-card/70 text-sm text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:text-orange-500"
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
