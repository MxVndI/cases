import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import type { FormEvent } from "react";
import { useState } from 'react';
import { useAuth } from '@/AuthContext';
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { authApi } from "@/services/api";
import caseHubLogo from "@/assets/casehub-logo.svg";

export function Login() {
    const shouldReduceMotion = useReducedMotion();
    const { user, refetchUser } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
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
            await authApi.verifyCode(code);
            await refetchUser();
            navigate({ to: '/' });
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Неверный код");
        } finally {
            setLoading(false);
        }
    };

    // Если пользователь уже авторизован, редиректим на профиль
    if (user) {
        navigate({ to: '/' });
        return null;
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
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

                <AnimatePresence mode="wait">
                    {step === 'email' ? (
                        <motion.div
                            key="email-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Форма email */}
                            <form onSubmit={handleSendCode} className="space-y-4 mb-6">
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
                                            onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                            placeholder="you@example.com"
                                            className="pl-10 rounded-xl border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-red-400 text-center">{error}</p>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="cursor-target w-full cursor-pointer bg-orange-500 hover:bg-white text-white hover:text-black font-semibold py-6 rounded-xl transition-all duration-300 ease-out disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        "Получить код"
                                    )}
                                </Button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="code-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Шаг 2: ввод кода */}
                            <form onSubmit={handleVerifyCode} className="space-y-4 mb-6">
                                <div className="text-center mb-2">
                                    <p className="text-sm text-muted-foreground">
                                        Код отправлен на <span className="text-orange-500 font-medium">{email}</span>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground">
                                        Код подтверждения
                                    </Label>
                                    <div className="flex justify-center">
                                        <InputOTP
                                            maxLength={6}
                                            value={code}
                                            onChange={(value) => { setCode(value); setError(""); }}
                                            autoFocus
                                            disabled={loading}
                                        >
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                            </InputOTPGroup>
                                            <InputOTPSeparator />
                                            <InputOTPGroup>
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-red-400 text-center">{error}</p>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading || code.length !== 6}
                                    className="cursor-target w-full cursor-pointer bg-orange-500 hover:bg-white text-white hover:text-black font-semibold py-6 rounded-xl transition-all duration-300 ease-out disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        "Войти"
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setCode(""); setError(""); }}
                                    className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors cursor-pointer"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Изменить почту
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

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
