import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Shield, Users, Package, Plus, Ban, CheckCircle, Trash2,
    Search, Coins, Settings, ChevronRight, ChevronDown, Check,
    Calendar, Clock, LayoutGrid, List, Image,
} from "lucide-react";
import { dummyUsers, dummyCases, type DummyUser, type Case, type CaseItem } from "@/data/dummy-data";
import { Link } from "@tanstack/react-router";

type AdminTab = "cases" | "users";
type UserStatusFilter = "all" | "active" | "blocked";
type UserRoleFilter = "all" | "user" | "admin";

// ─── All available items for item-tree picker ─────────────────────────────────
const ALL_ITEMS: CaseItem[] = [
    // AK-47
    { id: "item-ak-wild", name: "AK-47 | Wild Lotus", rarity: "exotic", price: 14500 },
    { id: "item-ak-fire", name: "AK-47 | Fire Serpent", rarity: "legendary", price: 7600 },
    { id: "item-ak-neon", name: "AK-47 | Neon Rider", rarity: "legendary", price: 2800 },
    { id: "item-ak-blood", name: "AK-47 | Bloodsport", rarity: "epic", price: 1250 },
    { id: "item-ak-red", name: "AK-47 | Redline", rarity: "rare", price: 350 },
    { id: "item-ak-elite", name: "AK-47 | Elite Build", rarity: "common", price: 50 },
    // AWP
    { id: "item-awp-dragon", name: "AWP | Dragon Lore", rarity: "exotic", price: 22000 },
    { id: "item-awp-gungnir", name: "AWP | Gungnir", rarity: "exotic", price: 18500 },
    { id: "item-awp-asii", name: "AWP | Asiimov", rarity: "legendary", price: 4500 },
    { id: "item-awp-hyper", name: "AWP | Hyper Beast", rarity: "epic", price: 980 },
    { id: "item-awp-neo", name: "AWP | Neo-Noir", rarity: "rare", price: 320 },
    { id: "item-awp-ath", name: "AWP | Atheris", rarity: "common", price: 65 },
    // M4A4
    { id: "item-m4a4-howl", name: "M4A4 | Howl", rarity: "exotic", price: 15000 },
    { id: "item-m4a4-asii", name: "M4A4 | Asiimov", rarity: "legendary", price: 4100 },
    { id: "item-m4a4-neo", name: "M4A4 | Neo-Noir", rarity: "epic", price: 1250 },
    { id: "item-m4a4-emp", name: "M4A4 | The Emperor", rarity: "epic", price: 980 },
    { id: "item-m4a4-deso", name: "M4A4 | Desolate Space", rarity: "rare", price: 340 },
    { id: "item-m4a4-mag", name: "M4A4 | Magnesium", rarity: "common", price: 24 },
    // M4A1-S
    { id: "item-m4a1s-print", name: "M4A1-S | Printstream", rarity: "legendary", price: 3500 },
    { id: "item-m4a1s-jungle", name: "M4A1-S | Welcome to the Jungle", rarity: "exotic", price: 13200 },
    { id: "item-m4a1s-player", name: "M4A1-S | Player Two", rarity: "epic", price: 970 },
    { id: "item-m4a1s-hyper", name: "M4A1-S | Hyper Beast", rarity: "epic", price: 840 },
    { id: "item-m4a1s-night", name: "M4A1-S | Nightmare", rarity: "rare", price: 180 },
    { id: "item-m4a1s-terror", name: "M4A1-S | Night Terror", rarity: "common", price: 40 },
    // Ножи
    { id: "item-kara-dopp", name: "Karambit | Doppler", rarity: "exotic", price: 12000 },
    { id: "item-m9-fade", name: "M9 Bayonet | Fade", rarity: "exotic", price: 18000 },
    { id: "item-bfly-tiger", name: "Butterfly Knife | Tiger Tooth", rarity: "legendary", price: 7500 },
    { id: "item-hunts-saf", name: "Huntsman Knife | Safari", rarity: "epic", price: 450 },
    { id: "item-flip-marble", name: "Flip Knife | Marble Fade", rarity: "legendary", price: 5200 },
    { id: "item-gut-auto", name: "Gut Knife | Autotronic", rarity: "rare", price: 180 },
    // Перчатки
    { id: "item-sport-pandora", name: "Sport Gloves | Pandora", rarity: "exotic", price: 8500 },
    { id: "item-driver-king", name: "Driver Gloves | King Snake", rarity: "legendary", price: 3200 },
    { id: "item-wraps-cobalt", name: "Hand Wraps | Cobalt Skulls", rarity: "epic", price: 1100 },
    { id: "item-moto-boom", name: "Moto Gloves | Boom!", rarity: "epic", price: 950 },
    { id: "item-spec-crimson", name: "Specialist Gloves | Crimson", rarity: "legendary", price: 4800 },
    // Агенты
    { id: "item-agent-darryl", name: "Sir Bloody Darryl", rarity: "legendary", price: 4200 },
    { id: "item-agent-numberk", name: "Number K", rarity: "epic", price: 1400 },
    { id: "item-agent-rezan", name: "Rezan The Ready", rarity: "epic", price: 1250 },
    { id: "item-agent-syfers", name: "Michael Syfers", rarity: "rare", price: 380 },
    { id: "item-agent-enforcer", name: "Enforcer", rarity: "common", price: 90 },
    // Наклейки
    { id: "item-stk-crown", name: "Sticker | Crown (Foil)", rarity: "exotic", price: 9800 },
    { id: "item-stk-titan", name: "Sticker | Titan (Holo)", rarity: "legendary", price: 6300 },
    { id: "item-stk-howl", name: "Sticker | Howling Dawn", rarity: "legendary", price: 5200 },
    { id: "item-stk-battle", name: "Sticker | Battle Scarred", rarity: "epic", price: 850 },
    { id: "item-stk-dragon", name: "Sticker | Dragon", rarity: "rare", price: 260 },
    { id: "item-stk-smiley", name: "Sticker | Smiley", rarity: "common", price: 45 },
];

const CATEGORIES = ["Оружие", "Ножи", "Перчатки", "Агенты", "Наклейки"];

const RARITY_COLORS: Record<string, string> = {
    common: "text-gray-400",
    rare: "text-blue-400",
    epic: "text-purple-400",
    legendary: "text-orange-400",
    exotic: "text-red-500",
};

const RARITY_BG: Record<string, string> = {
    common: "border-gray-500/30 bg-gray-500/5",
    rare: "border-blue-500/30 bg-blue-500/5",
    epic: "border-purple-500/30 bg-purple-500/5",
    legendary: "border-orange-500/30 bg-orange-500/5",
    exotic: "border-red-500/30 bg-red-500/5",
};

const RARITY_LABELS: Record<string, string> = {
    common: "Обычное",
    rare: "Редкое",
    epic: "Эпическое",
    legendary: "Легендарное",
    exotic: "Экзотическое",
};

// Weapon type groups for filtering
const WEAPON_TYPES = (() => {
    const types = new Set<string>();
    for (const item of ALL_ITEMS) {
        const sep = item.name.indexOf(" | ");
        types.add(sep !== -1 ? item.name.substring(0, sep) : "Другое");
    }
    return Array.from(types).sort();
})();

// Group items by weapon prefix for tree display
function buildItemTree(items: CaseItem[]) {
    const groups: Record<string, CaseItem[]> = {};
    for (const item of items) {
        const sep = item.name.indexOf(" | ");
        const group = sep !== -1 ? item.name.substring(0, sep) : "Другое";
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

// Placeholder image for items (CS-style gradient)
function ItemImage({ item, size = "md" }: { item: CaseItem; size?: "sm" | "md" }) {
    const dim = size === "sm" ? "w-8 h-8" : "w-24 h-24";
    const iconDim = size === "sm" ? "h-4 w-4" : "h-10 w-10";
    const rarityGradient: Record<string, string> = {
        common: "from-gray-600/30 to-gray-800/30",
        rare: "from-blue-600/30 to-blue-900/30",
        epic: "from-purple-600/30 to-purple-900/30",
        legendary: "from-orange-500/30 to-orange-800/30",
        exotic: "from-red-500/30 to-red-900/30",
    };
    return (
        <div className={`${dim} rounded-lg bg-gradient-to-br ${rarityGradient[item.rarity] ?? rarityGradient.common} flex items-center justify-center flex-shrink-0`}>
            <Image className={`${iconDim} text-white/60`} />
        </div>
    );
}

type PickerViewMode = "tree" | "gallery";
type RarityFilter = "all" | "common" | "rare" | "epic" | "legendary" | "exotic";

// ─── Item picker component (tree + gallery) ──────────────────────────────────
function ItemTreePicker({
    selectedIds,
    onToggle,
}: {
    selectedIds: Set<string>;
    onToggle: (item: CaseItem) => void;
}) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<PickerViewMode>("tree");
    const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
    const [weaponFilter, setWeaponFilter] = useState<string>("all");
    const [priceMin, setPriceMin] = useState("");
    const [priceMax, setPriceMax] = useState("");
    const [hoveredItem, setHoveredItem] = useState<CaseItem | null>(null);

    // Apply all filters
    const filteredItems = useMemo(() => {
        let list = ALL_ITEMS;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(i => i.name.toLowerCase().includes(q));
        }
        if (rarityFilter !== "all") list = list.filter(i => i.rarity === rarityFilter);
        if (weaponFilter !== "all") {
            list = list.filter(i => {
                const sep = i.name.indexOf(" | ");
                const group = sep !== -1 ? i.name.substring(0, sep) : "Другое";
                return group === weaponFilter;
            });
        }
        if (priceMin) list = list.filter(i => i.price >= parseInt(priceMin));
        if (priceMax) list = list.filter(i => i.price <= parseInt(priceMax));
        return list;
    }, [search, rarityFilter, weaponFilter, priceMin, priceMax]);

    const filteredTree = useMemo(() => buildItemTree(filteredItems), [filteredItems]);

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            next.has(group) ? next.delete(group) : next.add(group);
            return next;
        });
    };

    const allRarities: RarityFilter[] = ["all", "common", "rare", "epic", "legendary", "exotic"];

    return (
        <div className="space-y-3">
            {/* Search + view toggle */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Поиск предметов..."
                        className="pl-9 rounded-xl border-border/60 bg-background/50 text-foreground"
                    />
                </div>
                <div className="flex rounded-xl border border-border/60 overflow-hidden flex-shrink-0">
                    <button
                        onClick={() => setViewMode("tree")}
                        className={`px-3 py-2 text-xs transition-colors ${viewMode === "tree" ? "bg-orange-500 text-white" : "bg-background/50 text-muted-foreground hover:text-foreground"}`}
                        title="Дерево"
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("gallery")}
                        className={`px-3 py-2 text-xs transition-colors ${viewMode === "gallery" ? "bg-orange-500 text-white" : "bg-background/50 text-muted-foreground hover:text-foreground"}`}
                        title="Галерея"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-2">
                {/* Rarity */}
                <div className="flex gap-1 flex-wrap">
                    {allRarities.map(r => (
                        <button
                            key={r}
                            onClick={() => setRarityFilter(r)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                                rarityFilter === r
                                    ? r === "all" ? "bg-orange-500 text-white border-orange-500"
                                    : `${RARITY_BG[r]} ${RARITY_COLORS[r]} border`
                                    : "bg-background/50 border-border/60 text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {r === "all" ? "Все" : RARITY_LABELS[r]}
                        </button>
                    ))}
                </div>
                {/* Weapon type */}
                <select
                    value={weaponFilter}
                    onChange={e => setWeaponFilter(e.target.value)}
                    className="px-2 py-1 rounded-lg text-xs border border-border/60 bg-background/50 text-foreground appearance-none cursor-pointer"
                >
                    <option value="all">Все типы</option>
                    {WEAPON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {/* Price range */}
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        value={priceMin}
                        onChange={e => setPriceMin(e.target.value)}
                        placeholder="Мин."
                        className="w-20 h-7 rounded-lg text-xs border-border/60 bg-background/50 text-foreground px-2"
                    />
                    <span className="text-xs text-muted-foreground">—</span>
                    <Input
                        type="number"
                        value={priceMax}
                        onChange={e => setPriceMax(e.target.value)}
                        placeholder="Макс."
                        className="w-20 h-7 rounded-lg text-xs border-border/60 bg-background/50 text-foreground px-2"
                    />
                    <Coins className="h-3 w-3 text-muted-foreground" />
                </div>
            </div>

            {/* ── TREE VIEW ── */}
            {viewMode === "tree" && (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-border/40 bg-background/30 p-1 space-y-0.5">
                    {filteredTree.map(([group, items]) => {
                        const isOpen = expandedGroups.has(group) || search.trim().length > 0;
                        const selectedCount = items.filter(i => selectedIds.has(i.id)).length;
                        return (
                            <div key={group}>
                                <button
                                    onClick={() => toggleGroup(group)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-card/60 transition-colors"
                                >
                                    {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                    {group}
                                    {selectedCount > 0 && (
                                        <span className="ml-auto text-xs text-orange-500 font-semibold">{selectedCount}</span>
                                    )}
                                </button>
                                {isOpen && (
                                    <div className="ml-5 space-y-0.5">
                                        {items.map(item => {
                                            const sel = selectedIds.has(item.id);
                                            return (
                                                <div key={item.id} className="relative group/item">
                                                    <button
                                                        onClick={() => onToggle(item)}
                                                        onMouseEnter={() => setHoveredItem(item)}
                                                        onMouseLeave={() => setHoveredItem(null)}
                                                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                                                            sel
                                                                ? "bg-orange-500/10 border border-orange-500/30"
                                                                : "hover:bg-card/40 border border-transparent"
                                                        }`}
                                                    >
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                                            sel ? "bg-orange-500 border-orange-500" : "border-border/60"
                                                        }`}>
                                                            {sel && <Check className="h-3 w-3 text-white" />}
                                                        </div>
                                                        <span className={RARITY_COLORS[item.rarity] ?? "text-foreground"}>
                                                            {item.name}
                                                        </span>
                                                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                                                            {item.price.toLocaleString()} <Coins className="h-3 w-3" />
                                                        </span>
                                                    </button>
                                                    {/* Hover preview */}
                                                    {hoveredItem?.id === item.id && (
                                                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 rounded-xl border border-border/60 bg-card p-3 shadow-xl backdrop-blur-xl pointer-events-none w-44">
                                                            <ItemImage item={item} size="md" />
                                                            <p className={`text-xs font-medium mt-2 ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{RARITY_LABELS[item.rarity]}</p>
                                                            <p className="text-xs text-orange-500 font-semibold mt-1 flex items-center gap-1">{item.price.toLocaleString()} <Coins className="h-3 w-3" /></p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {filteredTree.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">Ничего не найдено</p>
                    )}
                </div>
            )}

            {/* ── GALLERY VIEW ── */}
            {viewMode === "gallery" && (
                <div className="max-h-80 overflow-y-auto rounded-xl border border-border/40 bg-background/30 p-2">
                    {filteredItems.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {filteredItems.map(item => {
                                const sel = selectedIds.has(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onToggle(item)}
                                        className={`relative rounded-xl border p-2 text-left transition-all ${
                                            sel
                                                ? "border-orange-500/40 bg-orange-500/10"
                                                : `${RARITY_BG[item.rarity]} hover:border-orange-500/30`
                                        }`}
                                    >
                                        {/* Selection indicator */}
                                        <div className={`absolute top-2 right-2 w-4 h-4 rounded flex items-center justify-center border ${
                                            sel ? "bg-orange-500 border-orange-500" : "border-border/60"
                                        }`}>
                                            {sel && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        {/* Image */}
                                        <div className="flex justify-center mb-2">
                                            <ItemImage item={item} size="md" />
                                        </div>
                                        {/* Info */}
                                        <p className={`text-xs font-medium leading-tight line-clamp-2 ${RARITY_COLORS[item.rarity]}`}>
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-orange-500 font-semibold mt-1 flex items-center gap-1">
                                            {item.price.toLocaleString()} <Coins className="h-3 w-3" />
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">Ничего не найдено</p>
                    )}
                </div>
            )}

            {selectedIds.size > 0 && (
                <p className="text-xs text-muted-foreground">Выбрано предметов: <span className="text-orange-500 font-semibold">{selectedIds.size}</span></p>
            )}
        </div>
    );
}

// ─── Case form state helpers ──────────────────────────────────────────────────
interface CaseFormState {
    name: string;
    description: string;
    price: string;
    category: string;
    selectedItemIds: Set<string>;
}

const emptyCaseForm: CaseFormState = { name: "", description: "", price: "", category: "", selectedItemIds: new Set() };

function caseFormFromCase(c: Case): CaseFormState {
    return {
        name: c.name,
        description: c.description,
        price: String(c.price),
        category: c.category,
        selectedItemIds: new Set(c.items.map(i => {
            const match = ALL_ITEMS.find(ai => ai.name === i.name);
            return match?.id ?? i.id;
        })),
    };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Admin() {
    const shouldReduceMotion = useReducedMotion();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<AdminTab>("users");
    const [users, setUsers]   = useState<DummyUser[]>(dummyUsers);
    const [cases, setCases]   = useState<Case[]>(dummyCases);

    // ── User filters ──
    const [userSearch, setUserSearch]         = useState("");
    const [statusFilter, setStatusFilter]     = useState<UserStatusFilter>("all");
    const [roleFilter, setRoleFilter]         = useState<UserRoleFilter>("all");

    // ── Case dialogs ──
    const [addCaseOpen, setAddCaseOpen]       = useState(false);
    const [editCaseOpen, setEditCaseOpen]     = useState(false);
    const [deleteCaseOpen, setDeleteCaseOpen] = useState(false);
    const [targetCase, setTargetCase]         = useState<Case | null>(null);
    const [caseForm, setCaseForm]             = useState<CaseFormState>(emptyCaseForm);

    // ── Block confirmation ──
    const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
    const [targetUser, setTargetUser]             = useState<DummyUser | null>(null);

    // ── Access control ──
    if (user?.role !== "admin") {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground mb-2">Доступ запрещён</h2>
                        <p className="text-muted-foreground mb-4">У вас нет прав администратора</p>
                        <Link to="/" className="text-orange-500 hover:text-orange-400 transition-colors">
                            На главную
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Filtered users ──
    const filteredUsers = useMemo(() => {
        let list = users;
        if (statusFilter !== "all") list = list.filter(u => u.status === statusFilter);
        if (roleFilter   !== "all") list = list.filter(u => u.role   === roleFilter);
        if (userSearch.trim()) {
            const q = userSearch.toLowerCase();
            list = list.filter(u =>
                u.nickname.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
            );
        }
        return list;
    }, [users, statusFilter, roleFilter, userSearch]);

    // ── User actions ──
    const openBlockConfirm = (u: DummyUser) => {
        setTargetUser(u);
        setBlockConfirmOpen(true);
    };

    const handleToggleBlock = () => {
        if (!targetUser) return;
        setUsers(prev => prev.map(u =>
            u.id === targetUser.id ? { ...u, status: u.status === "active" ? "blocked" : "active" } : u
        ));
        setBlockConfirmOpen(false);
        setTargetUser(null);
    };

    // ── Case actions ──
    const toggleFormItem = (item: CaseItem) => {
        setCaseForm(prev => {
            const next = new Set(prev.selectedItemIds);
            next.has(item.id) ? next.delete(item.id) : next.add(item.id);
            return { ...prev, selectedItemIds: next };
        });
    };

    const openAddCase = () => {
        setCaseForm(emptyCaseForm);
        setAddCaseOpen(true);
    };

    const openEditCase = (c: Case) => {
        setTargetCase(c);
        setCaseForm(caseFormFromCase(c));
        setEditCaseOpen(true);
    };

    const openDeleteCase = (c: Case) => {
        setTargetCase(c);
        setDeleteCaseOpen(true);
    };

    const buildItemsFromIds = (ids: Set<string>): CaseItem[] =>
        ALL_ITEMS.filter(i => ids.has(i.id));

    const handleAddCase = () => {
        if (!caseForm.name || !caseForm.price || !caseForm.category) return;
        const newCase: Case = {
            id: `new-${Date.now()}`,
            name: caseForm.name,
            description: caseForm.description,
            image: "",
            price: parseInt(caseForm.price),
            category: caseForm.category,
            items: buildItemsFromIds(caseForm.selectedItemIds),
        };
        setCases(prev => [newCase, ...prev]);
        setAddCaseOpen(false);
    };

    const handleEditCase = () => {
        if (!targetCase || !caseForm.name || !caseForm.price || !caseForm.category) return;
        setCases(prev => prev.map(c =>
            c.id === targetCase.id
                ? { ...c, name: caseForm.name, description: caseForm.description, price: parseInt(caseForm.price), category: caseForm.category, items: buildItemsFromIds(caseForm.selectedItemIds) }
                : c
        ));
        setEditCaseOpen(false);
    };

    const handleDeleteCase = () => {
        if (!targetCase) return;
        setCases(prev => prev.filter(c => c.id !== targetCase.id));
        setDeleteCaseOpen(false);
        setTargetCase(null);
    };

    // ── Tab config ──
    const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
        { id: "users", label: "Пользователи", icon: <Users className="h-4 w-4" /> },
        { id: "cases", label: "Кейсы", icon: <Package className="h-4 w-4" /> },
    ];

    // ── Case form dialog body (shared between add/edit) ──
    const caseFormBody = (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm text-foreground">Название</Label>
                    <Input
                        value={caseForm.name}
                        onChange={e => setCaseForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Кейс: Название"
                        className="rounded-xl border-border/60 bg-background/50 text-foreground"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">Цена <Coins className="h-3.5 w-3.5 text-orange-500" /></Label>
                    <Input
                        type="number"
                        value={caseForm.price}
                        onChange={e => setCaseForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="100"
                        className="rounded-xl border-border/60 bg-background/50 text-foreground"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-sm text-foreground">Описание</Label>
                <Input
                    value={caseForm.description}
                    onChange={e => setCaseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Описание кейса"
                    className="rounded-xl border-border/60 bg-background/50 text-foreground"
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm text-foreground">Категория</Label>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCaseForm(prev => ({ ...prev, category: cat }))}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                caseForm.category === cat
                                    ? "bg-orange-500 text-white border-orange-500"
                                    : "bg-background/50 border-border/60 text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-sm text-foreground">Предметы кейса</Label>
                <ItemTreePicker
                    selectedIds={caseForm.selectedItemIds}
                    onToggle={toggleFormItem}
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1] }}
                >
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="h-8 w-8 text-red-500" />
                            <h1 className="text-2xl font-bold text-foreground">Панель администратора</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">Управление кейсами и пользователями</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                        : "bg-card/80 text-muted-foreground hover:text-foreground border border-border/60 hover:border-orange-500/30"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ════════════════════  USERS TAB  ════════════════════ */}
                    {activeTab === "users" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* Filters */}
                            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 mb-4 space-y-3">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Search */}
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={userSearch}
                                            onChange={e => setUserSearch(e.target.value)}
                                            placeholder="Поиск по нику или email..."
                                            className="pl-9 rounded-xl border-border/60 bg-background/50 text-foreground"
                                        />
                                    </div>
                                    {/* Status filter */}
                                    <div className="flex gap-2">
                                        {([["all", "Все"], ["active", "Активные"], ["blocked", "Заблокированные"]] as const).map(([val, label]) => (
                                            <button
                                                key={val}
                                                onClick={() => setStatusFilter(val)}
                                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                                                    statusFilter === val
                                                        ? val === "blocked"
                                                            ? "bg-red-500/15 border-red-500/40 text-red-400"
                                                            : val === "active"
                                                                ? "bg-green-500/15 border-green-500/40 text-green-400"
                                                                : "bg-orange-500 text-white border-orange-500"
                                                        : "bg-background/50 border-border/60 text-muted-foreground hover:text-foreground"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Role filter */}
                                    <div className="flex gap-2">
                                        {([["all", "Все роли"], ["user", "Пользователи"], ["admin", "Администраторы"]] as const).map(([val, label]) => (
                                            <button
                                                key={val}
                                                onClick={() => setRoleFilter(val)}
                                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                                                    roleFilter === val
                                                        ? "bg-orange-500 text-white border-orange-500"
                                                        : "bg-background/50 border-border/60 text-muted-foreground hover:text-foreground"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* User list */}
                            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden">
                                <div className="p-6 border-b border-border/40">
                                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                        <Users className="h-5 w-5 text-orange-500" />
                                        Пользователи ({filteredUsers.length})
                                    </h2>
                                </div>
                                <div className="divide-y divide-border/40">
                                    {filteredUsers.map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-4 hover:bg-background/30 transition-colors">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                                                    u.status === "active" ? "bg-green-500/10" : "bg-red-500/10"
                                                }`}>
                                                    <Users className={`h-5 w-5 ${u.status === "active" ? "text-green-500" : "text-red-500"}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Link
                                                            to="/user/$userId"
                                                            params={{ userId: u.id }}
                                                            className="font-medium text-foreground hover:text-orange-400 transition-colors"
                                                        >
                                                            {u.nickname}
                                                        </Link>
                                                        {u.role === "admin" && (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-xs text-red-400">Администратор</span>
                                                        )}
                                                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                                            u.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                                        }`}>
                                                            {u.status === "active" ? "Активен" : "заблокирован"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Рег: {new Date(u.registeredAt).toLocaleDateString("ru-RU")}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Последний вход: {new Date(u.lastLoginAt).toLocaleDateString("ru-RU")}{" "}
                                                            {new Date(u.lastLoginAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                <div className="text-right mr-2">
                                                    <p className="text-sm font-semibold text-orange-500 flex items-center gap-1 justify-end">
                                                        {u.balance.toLocaleString()} <Coins className="h-3.5 w-3.5" />
                                                    </p>
                                                </div>
                                                {u.role !== "admin" && (
                                                    <Button
                                                        onClick={() => openBlockConfirm(u)}
                                                        variant="outline"
                                                        size="sm"
                                                        className={`rounded-xl text-xs ${
                                                            u.status === "active"
                                                                ? "border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                                : "border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                                                        }`}
                                                    >
                                                        {u.status === "active" ? (
                                                            <Ban className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <CheckCircle className="h-3.5 w-3.5" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            Пользователи не найдены
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ════════════════════  CASES TAB  ════════════════════ */}
                    {activeTab === "cases" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-foreground">Кейсы ({cases.length})</h2>
                                <Button
                                    onClick={openAddCase}
                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Добавить кейс
                                </Button>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden">
                                <div className="divide-y divide-border/40">
                                    {cases.map(c => (
                                        <div key={c.id} className="flex items-center justify-between p-4 hover:bg-background/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-orange-500" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{c.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {c.category} &bull; {c.items.length} предметов
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-orange-500 flex items-center gap-1">
                                                    {c.price.toLocaleString()} <Coins className="h-3.5 w-3.5" />
                                                </span>
                                                <Button
                                                    onClick={() => openEditCase(c)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl border-border/60 text-muted-foreground hover:text-foreground hover:border-orange-500/30"
                                                >
                                                    <Settings className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    onClick={() => openDeleteCase(c)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </main>

            {/* ════════════  ADD CASE DIALOG  ════════════ */}
            <Dialog open={addCaseOpen} onOpenChange={setAddCaseOpen}>
                <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-orange-500" /> Новый кейс
                        </DialogTitle>
                        <DialogDescription>Заполните информацию и выберите предметы для кейса</DialogDescription>
                    </DialogHeader>
                    {caseFormBody}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddCaseOpen(false)} className="rounded-xl">
                            Отмена
                        </Button>
                        <Button
                            onClick={handleAddCase}
                            disabled={!caseForm.name || !caseForm.price || !caseForm.category}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Создать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  EDIT CASE DIALOG  ════════════ */}
            <Dialog open={editCaseOpen} onOpenChange={setEditCaseOpen}>
                <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-orange-500" /> Редактировать кейс
                        </DialogTitle>
                        <DialogDescription>Измените параметры кейса</DialogDescription>
                    </DialogHeader>
                    {caseFormBody}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditCaseOpen(false)} className="rounded-xl">
                            Отмена
                        </Button>
                        <Button
                            onClick={handleEditCase}
                            disabled={!caseForm.name || !caseForm.price || !caseForm.category}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50"
                        >
                            <Check className="h-4 w-4 mr-1" /> Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  DELETE CASE CONFIRMATION  ════════════ */}
            <Dialog open={deleteCaseOpen} onOpenChange={setDeleteCaseOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400">
                            <Trash2 className="h-5 w-5" /> Удалить кейс?
                        </DialogTitle>
                        <DialogDescription>
                            Кейс <span className="font-semibold text-foreground">{targetCase?.name}</span> будет
                            удалён безвозвратно. Это действие нельзя отменить.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteCaseOpen(false)} className="rounded-xl">
                            Отмена
                        </Button>
                        <Button
                            onClick={handleDeleteCase}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                        >
                            <Trash2 className="h-4 w-4 mr-1" /> Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  BLOCK/UNBLOCK USER CONFIRMATION  ════════════ */}
            <Dialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {targetUser?.status === "active" ? (
                                <><Ban className="h-5 w-5 text-red-400" /> Заблокировать пользователя?</>
                            ) : (
                                <><CheckCircle className="h-5 w-5 text-green-400" /> Разблокировать пользователя?</>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {targetUser?.status === "active" ? (
                                <>Пользователь <span className="font-semibold text-foreground">{targetUser?.nickname}</span> будет заблокирован и потеряет доступ к сайту.</>
                            ) : (
                                <>Пользователь <span className="font-semibold text-foreground">{targetUser?.nickname}</span> будет разблокирован и сможет снова пользоваться сайтом.</>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBlockConfirmOpen(false)} className="rounded-xl">
                            Отмена
                        </Button>
                        <Button
                            onClick={handleToggleBlock}
                            className={`rounded-xl text-white ${
                                targetUser?.status === "active"
                                    ? "bg-red-500 hover:bg-red-600"
                                    : "bg-green-500 hover:bg-green-600"
                            }`}
                        >
                            {targetUser?.status === "active" ? (
                                <><Ban className="h-4 w-4 mr-1" /> Заблокировать</>
                            ) : (
                                <><CheckCircle className="h-4 w-4 mr-1" /> Разблокировать</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
