import { motion, useReducedMotion } from "framer-motion";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import { dummyCases } from "@/data/dummy-data";
import { Box, ArrowRight, Coins } from "lucide-react";

export function Cases() {
    const shouldReduceMotion = useReducedMotion();
    const { caseId } = useParams({ strict: false });

    if (caseId) {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                            Кейсы
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Выберите кейс и испытайте удачу
                        </p>
                    </div>

                    {/* Сетка кейсов */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {dummyCases.map((caseItem, index) => (
                            <motion.div
                                key={caseItem.id}
                                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: index * 0.1,
                                    ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
                                }}
                                whileHover={{ y: -5 }}
                                className="group rounded-2xl border border-border/60 bg-card/80 overflow-hidden backdrop-blur-xl hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300"
                            >
                                {/* Изображение кейса */}
                                <div className="relative h-48 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent p-6">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-32 h-32 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                                            <Box className="h-16 w-16 text-white" />
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-xs font-medium text-orange-400">
                                        {caseItem.category}
                                    </div>
                                </div>

                                {/* Информация */}
                                <div className="p-5">
                                    <h3 className="text-lg font-semibold text-foreground mb-2">
                                        {caseItem.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {caseItem.description}
                                    </p>

                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Цена</p>
                                            <p className="text-lg font-bold text-orange-500 flex items-center gap-1">
                                                {caseItem.price.toLocaleString()} <Coins className="h-4 w-4" />
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Предметов</p>
                                            <p className="text-lg font-bold text-foreground">
                                                {caseItem.items.length}
                                            </p>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/cases/$caseId`}
                                        params={{ caseId: caseItem.id }}
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
                                    >
                                        Открыть кейс
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Пустое состояние (если нет кейсов) */}
                    {dummyCases.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Box className="h-10 w-10 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                Кейсы недоступны
                            </h3>
                            <p className="text-muted-foreground">
                                Попробуйте позже
                            </p>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
