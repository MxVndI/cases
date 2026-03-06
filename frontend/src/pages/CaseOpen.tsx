import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Link, useParams, useNavigate } from "@tanstack/react-router";
import { dummyCases, rarityColors, rarityLabels, dummyBalance } from "@/data/dummy-data";
import { Box, ChevronLeft, RefreshCw, Check, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CaseOpen() {
    const shouldReduceMotion = useReducedMotion();
    const { caseId } = useParams({ strict: false });
    const navigate = useNavigate();
    const caseItem = dummyCases.find((c) => c.id === caseId);
    
    const [isSpinning, setIsSpinning] = useState(false);
    const [hasSpun, setHasSpun] = useState(false);
    const [wonItem, setWonItem] = useState<typeof dummyCases[0]["items"][0] | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [balance] = useState(dummyBalance.hubCoins);

    // Генерация ленты предметов для рулетки
    const generateRouletteItems = () => {
        if (!caseItem) return [];
        const items = [];
        // Создаем ленту из 50 предметов
        for (let i = 0; i < 50; i++) {
            const randomItem = caseItem.items[Math.floor(Math.random() * caseItem.items.length)];
            items.push({ ...randomItem, uniqueId: `${i}-${randomItem.id}` });
        }
        return items;
    };

    const [rouletteItems] = useState(generateRouletteItems());
    const [scrollPosition, setScrollPosition] = useState(0);

    const handleSpin = () => {
        if (!caseItem || isSpinning || hasSpun) return;
        
        setIsSpinning(true);
        
        // Выбираем случайный предмет (смещаем на 40-45 позицию для плавной остановки)
        const winIndex = 40 + Math.floor(Math.random() * 5);
        const item = rouletteItems[winIndex];
        setWonItem(item);

        // Вычисляем позицию остановки (центр элемента)
        const cardWidth = 120; // ширина карточки + отступ
        const containerCenter = window.innerWidth / 2;
        const stopPosition = (winIndex * cardWidth) - containerCenter + (cardWidth / 2);

        // Анимация прокрутки
        setTimeout(() => {
            setScrollPosition(stopPosition);
        }, 100);

        // Показ результата через 4 секунды
        setTimeout(() => {
            setIsSpinning(false);
            setHasSpun(true);
            setShowResult(true);
        }, 4000);
    };

    if (!caseItem) {
        return (
            <div className="min-h-screen bg-background">
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                        to={`/cases/$caseId`}
                        params={{ caseId: caseItem.id }}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Назад к кейсу
                    </Link>

                    {/* Заголовок */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            {caseItem.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Стоимость: <span className="text-orange-500 font-semibold inline-flex items-center gap-1">{caseItem.price} <Coins className="h-4 w-4" /></span>
                            {hasSpun && (
                                <span className="ml-4 text-sm inline-flex items-center gap-1">
                                    Баланс: <span className="text-orange-500 inline-flex items-center gap-1">{balance - caseItem.price} <Coins className="h-3.5 w-3.5" /></span>
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Рулетка */}
                    <div className="relative mb-8 overflow-hidden rounded-2xl border border-orange-500/30 bg-card/80 backdrop-blur-xl">
                        {/* Центральная линия */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-orange-500/50 -translate-x-1/2 z-20">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-orange-500" />
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-orange-500" />
                        </div>

                        {/* Лента предметов */}
                        <div className="relative h-40 overflow-hidden">
                            <motion.div
                                className="flex items-center h-full px-[50vw]"
                                style={{ x: -scrollPosition }}
                                transition={{
                                    duration: isSpinning ? 4 : 0,
                                    ease: [0.15, 0, 0.1, 1],
                                }}
                            >
                                {rouletteItems.map((item) => (
                                    <div
                                        key={item.uniqueId}
                                        className={`flex-shrink-0 w-28 h-32 mx-1 rounded-xl border-2 flex flex-col items-center justify-center gap-2 ${rarityColors[item.rarity]} bg-background/50`}
                                    >
                                        <Box className="h-10 w-10" />
                                        <span className="text-xs font-medium text-center px-2 line-clamp-2">
                                            {item.name}
                                        </span>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Градиенты по краям */}
                        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
                        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
                    </div>

                    {/* Кнопка прокрутки */}
                    {!hasSpun && (
                        <div className="text-center">
                            <Button
                                onClick={handleSpin}
                                disabled={isSpinning}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-12 py-8 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30"
                            >
                                {isSpinning ? (
                                    <>
                                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                        Прокрутка...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-5 w-5" />
                                        Прокрутить за {caseItem.price} <Coins className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Результат */}
                    <AnimatePresence>
                        {showResult && wonItem && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{
                                    duration: 0.5,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                                onClick={() => navigate({ to: "/cases" })}
                            >
                                <motion.div
                                    initial={{ y: 50 }}
                                    animate={{ y: 0 }}
                                    className="relative max-w-md w-full"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Карточка результата */}
                                    <div className={`rounded-3xl border-2 p-8 text-center ${rarityColors[wonItem.rarity]} bg-card/95 backdrop-blur-xl`}>
                                        {/* Иконка победы */}
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                            className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500 flex items-center justify-center"
                                        >
                                            <Check className="h-10 w-10 text-white" />
                                        </motion.div>

                                        {/* Название предмета */}
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-sm text-muted-foreground mb-2"
                                        >
                                            Вы выиграли
                                        </motion.p>
                                        <motion.h2
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="text-2xl font-bold text-foreground mb-4"
                                        >
                                            {wonItem.name}
                                        </motion.h2>

                                        {/* Редкость */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                            className={`inline-block px-4 py-2 rounded-full border ${rarityColors[wonItem.rarity]} text-sm font-medium mb-6`}
                                        >
                                            {rarityLabels[wonItem.rarity]}
                                        </motion.div>

                                        {/* Цена */}
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.7 }}
                                            className="text-3xl font-bold text-orange-500"
                                        >
                                            <span className="flex items-center justify-center gap-1">{wonItem.price} <Coins className="h-6 w-6" /></span>
                                        </motion.p>

                                        {/* Кнопка */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.8 }}
                                            className="mt-8"
                                        >
                                            <Button
                                                onClick={() => navigate({ to: "/cases" })}
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 rounded-xl"
                                            >
                                                Продолжить
                                            </Button>
                                        </motion.div>
                                    </div>

                                    {/* Эффекты свечения */}
                                    <div className={`absolute -inset-4 rounded-3xl opacity-30 blur-xl -z-10 ${
                                        wonItem.rarity === "legendary" || wonItem.rarity === "exotic" 
                                            ? "bg-orange-500" 
                                            : "bg-purple-500"
                                    }`} />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>
        </div>
    );
}
