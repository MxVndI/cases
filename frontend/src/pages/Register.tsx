import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowLeft, User } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "@/AuthContext";
import { authApi } from "@/services/api";
import caseHubLogo from "@/assets/casehub-logo.svg";

export function Register() {
    const shouldReduceMotion = useReducedMotion();
    const navigate = useNavigate();
    const { refetchUser, user } = useAuth();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [nickname, setNickname] = useState("");
    const [step, setStep] = useState<'email' | 'code'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            await authApi.sendCode(email);
            setStep('code');
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Не удалось отправить код");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            await authApi.verifyCode(code, nickname);
            await refetchUser();
            navigate({ to: '/' });
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Неверный код");
        } finally {
            setLoading(false);
        }
    };

    if (user) {
        navigate({ to: '/' });
        return null;
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
            <Link
                to="/"
                aria-label="На главную"
                className="peer/home-edge hidden lg:block fixed inset-y-0 left-0 z-10 w-24 cursor-pointer"
            />
            <Link
                to="/login"
                aria-label="Уже есть аккаунт?"
                className="peer/login-edge hidden lg:block fixed inset-y-0 right-0 z-10 w-24 cursor-pointer"
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
            <Link
                to="/login"
                className="peer/login hidden lg:block fixed right-8 top-1/2 z-20 -translate-y-1/2 origin-right transform-gpu text-2xl font-semibold text-muted-foreground transition-all duration-300 ease-out hover:scale-110 hover:text-white peer-hover/login-edge:scale-110 peer-hover/login-edge:text-white"
            >
                Уже есть аккаунт?
            </Link>
            <div
                aria-hidden="true"
                className="hidden lg:block pointer-events-none fixed inset-y-0 right-0 z-0 w-[30vw] max-w-[440px] opacity-0 transition-opacity duration-300 ease-out peer-hover/login:opacity-100 peer-hover/login-edge:opacity-100 bg-[linear-gradient(to_left,rgba(255,255,255,0.09),rgba(255,255,255,0.045)_35%,rgba(255,255,255,0.015)_65%,transparent),conic-gradient(from_250deg_at_100%_50%,rgba(255,255,255,0.055),rgba(255,255,255,0.02),transparent,rgba(255,255,255,0.04))] blur-xl"
            />
            <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.45,
                    ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
                }}
                className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden border border-white/30 bg-card/90 p-8 backdrop-blur-xl sm:p-10 shadow-2xl shadow-orange-500/10"
            >
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-100">
                    <div className="absolute -left-10 -top-8 h-52 w-80 rounded-[28%_72%_55%_45%/44%_41%_59%_56%] bg-white/14 blur-[110px] rotate-[-10deg]" />
                    <div className="absolute -right-14 top-10 h-60 w-72 rounded-[64%_36%_42%_58%/50%_38%_62%_50%] bg-white/12 blur-[125px] rotate-[14deg]" />
                    <div className="absolute left-6 bottom-0 h-56 w-96 rounded-[37%_63%_70%_30%/34%_44%_56%_66%] bg-white/10 blur-[130px] rotate-[-6deg]" />
                    <div className="absolute right-8 -bottom-14 h-48 w-64 rounded-[58%_42%_33%_67%/52%_62%_38%_48%] bg-white/10 blur-[115px] rotate-[18deg]" />
                </div>

                <div className="flex justify-center mb-10">
                    <img src={caseHubLogo} alt="CaseHub" className="h-14 w-auto" />
                </div>

                <AnimatePresence mode="wait">
                    {step === 'email' ? (
                        <motion.form
                            key="email-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            onSubmit={handleSendCode}
                            className="space-y-4 mb-6"
                        >
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
                                        onChange={(event) => setEmail(event.target.value)}
                                        className="pl-10 rounded-xl border-border/60 bg-background/50 text-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                        required
                                    />
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-400">{error}</p>}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="cursor-target mt-4 w-full cursor-pointer bg-orange-500 hover:bg-white text-white hover:text-black font-semibold py-6 rounded-xl transition-all duration-300 ease-out"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Получить код"}
                            </Button>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="code-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.25 }}
                            onSubmit={handleVerifyCode}
                            className="space-y-4 mb-6"
                        >
                            <p className="text-sm text-muted-foreground text-center">
                                Код отправлен на <span className="text-white">{email}</span>
                            </p>

                            <div className="space-y-2">
                                <Label htmlFor="nickname" className="text-sm font-medium text-foreground">
                                    Имя пользователя
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="nickname"
                                        value={nickname}
                                        onChange={(event) => setNickname(event.target.value)}
                                        placeholder="Ваш никнейм"
                                        className="pl-10 rounded-xl border-border/60 bg-background/50 text-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-sm font-medium text-foreground">
                                    Код подтверждения
                                </Label>
                                <Input
                                    id="code"
                                    value={code}
                                    onChange={(event) => setCode(event.target.value)}
                                    className="rounded-xl border-border/60 bg-background/50 text-foreground text-center text-2xl tracking-[0.5em] font-mono focus:border-orange-500/50 focus:ring-orange-500/20"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            {error && <p className="text-sm text-red-400">{error}</p>}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="cursor-target mt-4 w-full cursor-pointer bg-orange-500 hover:bg-white text-white hover:text-black font-semibold py-6 rounded-xl transition-all duration-300 ease-out"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Зарегистрироваться"}
                            </Button>

                            <button
                                type="button"
                                onClick={() => { setStep('email'); setError(''); setCode(''); setNickname(''); }}
                                className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-white transition-colors cursor-pointer"
                            >
                                <ArrowLeft className="h-4 w-4" /> Изменить почту
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <p className="text-center text-xs text-muted-foreground">
                    Продолжая, вы соглашаетесь с нашими{" "}
                    <a href="#" className="text-white transition-colors duration-300 hover:text-white/80">
                        условиями использования
                    </a>{" "}
                    и{" "}
                    <a href="#" className="text-white transition-colors duration-300 hover:text-white/80">
                        политикой конфиденциальности
                    </a>
                    .
                </p>
            </motion.div>
        </div>
    );
}
