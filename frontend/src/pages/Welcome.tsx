import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Box, Layers, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { CaseHubLogo } from "@/components/CaseHubLogo";
import { useAuth } from "@/AuthContext";
const features = [
    {
        icon: Box,
        title: "Управление кейсами",
        description: "Организуйте и отслеживайте все ваши кейсы в одном месте",
    },
    {
        icon: Layers,
        title: "Структурирование",
        description: "Создавайте иерархии и связи между проектами",
    },
    {
        icon: Zap,
        title: "Быстрый доступ",
        description: "Мгновенный доступ к нужной информации",
    },
];

export function Welcome() {
    const shouldReduceMotion = useReducedMotion();
    const { user, isLoading, login, logout } = useAuth();
    console.log(user)
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
                    }}
                    className="text-center mb-20"
                >
                    <div className="flex justify-center mb-8">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CaseHubLogo size={96} />
                        </motion.div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                        Добро пожаловать в{" "}
                        <span className="text-orange-500">CaseHub</span>
                    </h1>

                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                        Централизованная платформа для управления кейсами, проектами и документами.
                        Организуйте работу эффективно и достигайте результатов быстрее.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/login">
                            <Button
                                size="lg"
                                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-6 text-base rounded-full"
                            >
                                Начать работу
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Button
                            size="lg"
                            variant="outline"
                            className="px-8 py-6 text-base text-white rounded-full border-border/60"
                        >
                            Узнать больше
                        </Button>
                    </div>
                </motion.div>

                {/* Features Section */}
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        delay: 0.2,
                        ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
                    }}
                    className="grid md:grid-cols-3 gap-8"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            whileHover={{ y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="group rounded-2xl border border-border/60 bg-card/80 p-8 backdrop-blur-xl hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300"
                        >
                            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition-colors">
                                <feature.icon className="h-6 w-6 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        delay: 0.4,
                        ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
                    }}
                    className="mt-20 text-center"
                >
                    <div className="rounded-3xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20 p-12">
                        <h2 className="text-3xl font-bold text-foreground mb-4">
                            Готовы начать?
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                            Присоединяйтесь к CaseHub и организуйте свою работу по-новому
                        </p>
                        <Link to="/login">
                            <Button
                                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-6 rounded-full"
                            >
                                Войти в аккаунт
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <CaseHubLogo size={32} />
                            <span className="text-sm text-muted-foreground">
                                © 2026 CaseHub. Все права защищены.
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
