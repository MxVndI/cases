import { motion, useReducedMotion } from "framer-motion";
import { Link, useParams } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { dummyCases, rarityColors, rarityLabels } from "@/data/dummy-data";
import { Box, ArrowLeft, Play } from "lucide-react";

export function CaseDetail() {
    const shouldReduceMotion = useReducedMotion();
    const { caseId } = useParams({ strict: false });
    const caseItem = dummyCases.find((c) => c.id === caseId);

    if (!caseItem) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-2">Кейс не найден</h2>
                        <Link to="/cases" className="text-orange-500 hover:text-orange-400">
                            Вернуться к списку
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.4,
                        ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
                    }}
                >
                    {/* Навигация */}
                    <Link
                        to="/cases"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Назад к кейсам
                    </Link>

                    {/* Заголовок кейса */}
                    <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-card/90 to-card/90 p-8 backdrop-blur-xl shadow-2xl shadow-orange-500/10 mb-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-48 h-48 bg-orange-500 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                                <Box className="h-24 w-24 text-white" />
                            </div>
                            <div className="text-center md:text-left">
                                <div className="inline-block px-4 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-sm font-medium text-orange-400 mb-3">
                                    {caseItem.category}
                                </div>
                                <h1 className="text-3xl font-bold text-foreground mb-3">
                                    {caseItem.name}
                                </h1>
                                <p className="text-muted-foreground mb-6 max-w-md">
                                    {caseItem.description}
                                </p>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Цена</p>
                                        <p className="text-2xl font-bold text-orange-500">
                                            {caseItem.price} HC
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Предметов</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {caseItem.items.length}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Редкость</p>
                                        <p className="text-sm font-medium text-foreground">
                                            от {rarityLabels[caseItem.items[caseItem.items.length - 1].rarity]} до{" "}
                                            {rarityLabels[caseItem.items[0]?.rarity || "common"]}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Кнопка прокрутки */}
                    <div className="mb-8">
                        <Link
                            to={`/cases/$caseId/open`}
                            params={{ caseId: caseItem.id }}
                            className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30"
                        >
                            <Play className="h-6 w-6" />
                            Прокрутить кейс за {caseItem.price} HC
                        </Link>
                    </div>

                    {/* Содержимое кейса */}
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl">
                        <h2 className="text-xl font-semibold text-foreground mb-6">
                            Содержимое кейса
                        </h2>
                        <div className="space-y-3">
                            {caseItem.items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.05,
                                        ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
                                    }}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 ${rarityColors[item.rarity]} bg-background/30`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 ${rarityColors[item.rarity].split(" ")[1]}`}>
                                            <Box className={`h-6 w-6 ${rarityColors[item.rarity].split(" ")[0]}`} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{item.name}</p>
                                            <p className={`text-xs ${rarityColors[item.rarity].split(" ")[0]}`}>
                                                {rarityLabels[item.rarity]}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-foreground">
                                        {item.price} HC
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
