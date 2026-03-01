import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Link as LinkIcon, Save, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { CaseHubLogo } from "@/components/CaseHubLogo";

export function Profile() {
    const shouldReduceMotion = useReducedMotion();
    const { user, updateProfile, isLoading } = useAuth();
    const [nickname, setNickname] = useState(user?.nickname || "");
    const [tradeLink, setTradeLink] = useState(user?.trade_link || "");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateProfile({
                nickname: nickname || undefined,
                trade_link: tradeLink || undefined,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Ошибка обновления профиля:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center h-full">
                    <div className="text-muted-foreground">Загрузка...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Профиль
                        </h1>
                        <p className="text-muted-foreground">
                            Управляйте настройками вашего аккаунта
                        </p>
                    </div>

                    {/* Карточка профиля */}
                    <div className="rounded-3xl border border-orange-500/30 bg-card/90 p-8 backdrop-blur-xl shadow-2xl shadow-orange-500/10">
                        {/* Аватар и информация */}
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border/40">
                            <CaseHubLogo size={80} />
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">
                                    {user?.nickname || "Пользователь"}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </div>

                        {/* Форма */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="nickname"
                                    className="text-sm font-medium text-foreground flex items-center gap-2"
                                >
                                    <User className="h-4 w-4 text-orange-500" />
                                    Никнейм
                                </Label>
                                <Input
                                    id="nickname"
                                    type="text"
                                    placeholder="Ваш никнейм"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="rounded-xl border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Отображаемое имя в вашем профиле
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="tradeLink"
                                    className="text-sm font-medium text-foreground flex items-center gap-2"
                                >
                                    <LinkIcon className="h-4 w-4 text-orange-500" />
                                    Trade Link
                                </Label>
                                <Input
                                    id="tradeLink"
                                    type="url"
                                    placeholder="https://steamcommunity.com/tradeoffer/new/..."
                                    value={tradeLink}
                                    onChange={(e) => setTradeLink(e.target.value)}
                                    className="rounded-xl border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:ring-orange-500/20"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Ссылка для обмена предметами (Steam, CSGO и т.д.)
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saved ? (
                                        <>
                                            <Check className="h-5 w-5" />
                                            Сохранено!
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-5 w-5" />
                                            {isSaving ? "Сохранение..." : "Сохранить изменения"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
