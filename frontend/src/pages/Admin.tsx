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
    Calendar, LayoutGrid, List, Image, Loader2, Upload,
    Palette, Crosshair, Pencil, Tags,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type CaseItem, type AdminCaseResponse, type CreateCasePayload, type UpdateCasePayload, type RarityData, type TagData, type WeaponData, type WeaponTypeData } from "@/services/api";
import { FilterPanel, PriceRangeInputs, RarityFilterButtons, SearchInput, SortButtons, StatusFilterButtons, TagFilterButtons } from "@/components/filters";
import { type User } from "@/types/user";
import { Link } from "@tanstack/react-router";
import { NotFound } from "@/pages/NotFound";

type AdminTab = "cases" | "users" | "items" | "rarities" | "weapons";
type UserStatusFilter = "all" | "active" | "blocked";
type UserRoleFilter = "all" | "user" | "admin" | "superadmin";
type CaseStatusFilter = "all" | "active" | "disabled";
type CaseSortMode = "default" | "price-asc" | "price-desc" | "items-asc" | "items-desc" | "status-asc" | "status-desc";

function normalizeCaseStatus(status?: string): "active" | "disabled" {
    return status === "disabled" ? "disabled" : "active";
}

// Helper to normalise rarity from API {name, color} to a string key
function getRarityKey(item: CaseItem): string {
    return typeof item.rarity === "string" ? item.rarity : item.rarity.name;
}

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
function getWeaponTypes(items: CaseItem[]) {
    const types = new Set<string>();
    for (const item of items) {
        const sep = item.name.indexOf(" | ");
        types.add(sep !== -1 ? item.name.substring(0, sep) : "Другое");
    }
    return Array.from(types).sort();
}

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
    const dim = size === "sm" ? "w-10 h-10 sm:w-12 sm:h-12" : "w-24 h-24";
    const iconDim = size === "sm" ? "h-4 w-4" : "h-10 w-10";
    const rk = getRarityKey(item);
    const rarityGradient: Record<string, string> = {
        common: "from-gray-600/30 to-gray-800/30",
        rare: "from-blue-600/30 to-blue-900/30",
        epic: "from-purple-600/30 to-purple-900/30",
        legendary: "from-orange-500/30 to-orange-800/30",
        exotic: "from-red-500/30 to-red-900/30",
    };
    return (
        <div className={`${dim} rounded-lg bg-gradient-to-br ${rarityGradient[rk] ?? rarityGradient.common} flex items-center justify-center flex-shrink-0`}>
            {item.img_url ? (
                <img src={item.img_url} alt={item.name} className={`${dim} rounded-lg object-cover`} />
            ) : (
                <Image className={`${iconDim} text-white/60`} />
            )}
        </div>
    );
}

type PickerViewMode = "tree" | "gallery";
type RarityFilter = "all" | "common" | "rare" | "epic" | "legendary" | "exotic";

// ─── Item picker component (tree + gallery) ──────────────────────────────────
function ItemTreePicker({
    allItems,
    selectedIds,
    onToggle,
}: {
    allItems: CaseItem[];
    selectedIds: Set<string>;
    onToggle: (item: CaseItem) => void;
}) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<PickerViewMode>("tree");
    const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
    const [weaponFilter, setWeaponFilter] = useState<string>("all");
    const [priceMin, setPriceMin] = useState(0);
    const [priceMaxOverride, setPriceMaxOverride] = useState<number | null>(null);
    const [hoveredItem, setHoveredItem] = useState<CaseItem | null>(null);

    const weaponTypes = useMemo(() => getWeaponTypes(allItems), [allItems]);
    const maxPickerPrice = useMemo(
        () => Math.max(100, allItems.reduce((highest, current) => Math.max(highest, current.price), 0)),
        [allItems],
    );
    const priceMax = priceMaxOverride ?? maxPickerPrice;
    const handlePickerPriceMaxChange = (value: number) => {
        setPriceMaxOverride(value >= maxPickerPrice ? null : value);
    };

    // Apply all filters
    const filteredItems = useMemo(() => {
        let list = allItems;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(i => i.name.toLowerCase().includes(q));
        }
        if (rarityFilter !== "all") list = list.filter(i => getRarityKey(i) === rarityFilter);
        if (weaponFilter !== "all") {
            list = list.filter(i => {
                const sep = i.name.indexOf(" | ");
                const group = sep !== -1 ? i.name.substring(0, sep) : "Другое";
                return group === weaponFilter;
            });
        }
        if (priceMin > 0) list = list.filter(i => i.price >= priceMin);
        if (priceMaxOverride !== null) list = list.filter(i => i.price <= priceMax);
        return list;
    }, [allItems, priceMax, priceMaxOverride, priceMin, rarityFilter, search, weaponFilter]);

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

            <div className="flex flex-wrap gap-2">
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
                <select
                    value={weaponFilter}
                    onChange={e => setWeaponFilter(e.target.value)}
                    className="px-2 py-1 rounded-lg text-xs border border-border/60 bg-background/50 text-foreground appearance-none cursor-pointer"
                >
                    <option value="all">Все типы</option>
                    {weaponTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="basis-full rounded-xl border border-border/40 bg-background/30 p-3">
                    <PriceRangeInputs
                        min={priceMin}
                        max={priceMax}
                        onMinChange={setPriceMin}
                        onMaxChange={handlePickerPriceMaxChange}
                        maxValue={maxPickerPrice}
                        presets={null}
                    />
                </div>
            </div>

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
                                    {selectedCount > 0 && <span className="ml-auto text-xs text-orange-500 font-semibold">{selectedCount}</span>}
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
                                                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${sel ? "bg-orange-500/10 border border-orange-500/30" : "hover:bg-card/40 border border-transparent"}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${sel ? "bg-orange-500 border-orange-500" : "border-border/60"}`}>
                                                            {sel && <Check className="h-3 w-3 text-white" />}
                                                        </div>
                                                        <span className={RARITY_COLORS[getRarityKey(item)] ?? "text-foreground"}>{item.name}</span>
                                                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">{item.price.toLocaleString()} <Coins className="h-3 w-3" /></span>
                                                    </button>
                                                    {hoveredItem?.id === item.id && (
                                                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 rounded-xl border border-border/60 bg-card p-3 shadow-xl backdrop-blur-xl pointer-events-none w-44">
                                                            <ItemImage item={item} size="md" />
                                                            <p className={`text-xs font-medium mt-2 ${RARITY_COLORS[getRarityKey(item)]}`}>{item.name}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{RARITY_LABELS[getRarityKey(item)]}</p>
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
                    {filteredTree.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Ничего не найдено</p>}
                </div>
            )}

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
                                        className={`relative rounded-xl border p-2 text-left transition-all ${sel ? "border-orange-500/40 bg-orange-500/10" : `${RARITY_BG[getRarityKey(item)]} hover:border-orange-500/30`}`}
                                    >
                                        <div className={`absolute top-2 right-2 w-4 h-4 rounded flex items-center justify-center border ${sel ? "bg-orange-500 border-orange-500" : "border-border/60"}`}>
                                            {sel && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <div className="flex justify-center mb-2">
                                            <ItemImage item={item} size="md" />
                                        </div>
                                        <p className={`text-xs font-medium leading-tight line-clamp-2 ${RARITY_COLORS[getRarityKey(item)]}`}>{item.name}</p>
                                        <p className="text-xs text-orange-500 font-semibold mt-1 flex items-center gap-1">{item.price.toLocaleString()} <Coins className="h-3 w-3" /></p>
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

interface CaseFormState {
    name: string;
    price: string;
    imgUrl: string;
    systemName: string;
    tag: string;
    status: string;
    selectedItemIds: Set<string>;
    dropChances: Map<string, number>;
}

const emptyCaseForm: CaseFormState = { name: "", price: "", imgUrl: "", systemName: "", tag: "", status: "active", selectedItemIds: new Set(), dropChances: new Map() };

const CYRILLIC_TO_LATIN: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function generateSystemName(value: string): string {
    const transliterated = value
        .toLowerCase()
        .split("")
        .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
        .join("");

    return transliterated
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "") || "case";
}

function caseFormFromAdminCase(c: AdminCaseResponse): CaseFormState {
    const ids = new Set<string>();
    const chances = new Map<string, number>();
    for (const entry of c.case_content) {
        if (entry.item) {
            ids.add(entry.item.id);
            chances.set(entry.item.id, entry.drop_chance);
        }
    }
    return {
        name: c.name,
        price: String(c.price),
        imgUrl: c.img_url ?? "",
        systemName: c.system_name ?? "",
        tag: c.tag ?? "",
        status: c.status ?? "active",
        selectedItemIds: ids,
        dropChances: chances,
    };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Admin() {
    const shouldReduceMotion = useReducedMotion();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<AdminTab>("users");

    // ── Data queries ──
    const { data: users = [], isLoading: usersLoading } = useQuery({
        queryKey: ["admin-users"],
        queryFn: () => adminApi.getUsers(),
    });
    const { data: cases = [], isLoading: casesLoading } = useQuery({
        queryKey: ["admin-cases"],
        queryFn: () => adminApi.getCases(),
    });
    const { data: allItems = [], isLoading: itemsLoading } = useQuery({
        queryKey: ["admin-items"],
        queryFn: () => adminApi.getItems(),
    });
    const { data: rarities = [], isLoading: raritiesLoading } = useQuery({
        queryKey: ["admin-rarities"],
        queryFn: () => adminApi.getRarities(),
    });
    const { data: caseTags = [], isLoading: caseTagsLoading } = useQuery({
        queryKey: ["admin-case-tags"],
        queryFn: () => adminApi.getCaseTags(),
    });
    const { data: weaponTypes = [], isLoading: weaponTypesLoading } = useQuery({
        queryKey: ["admin-weapon-types"],
        queryFn: () => adminApi.getWeaponTypes(),
    });
    const { data: weapons = [], isLoading: weaponsLoading } = useQuery({
        queryKey: ["admin-weapons"],
        queryFn: () => adminApi.getWeapons(),
    });

    // ── Mutation state ──
    const [mutating, setMutating] = useState(false);

    // ── User filters ──
    const [userSearch, setUserSearch]         = useState("");
    const [statusFilter, setStatusFilter]     = useState<UserStatusFilter>("all");
    const [roleFilter, setRoleFilter]         = useState<UserRoleFilter>("all");

    // ── Case filters ──
    const [caseSearch, setCaseSearch] = useState("");
    const [caseSort, setCaseSort] = useState<CaseSortMode>("default");
    const [caseRarityFilter, setCaseRarityFilter] = useState<Set<string>>(new Set());
    const [caseTagFilter, setCaseTagFilter] = useState<Set<string>>(new Set());
    const [caseStatusFilter, setCaseStatusFilter] = useState<CaseStatusFilter>("all");
    const [casePriceMin, setCasePriceMin] = useState(0);
    const [casePriceMaxOverride, setCasePriceMaxOverride] = useState<number | null>(null);
    const [showCaseFilters, setShowCaseFilters] = useState(false);
    const toggleCaseRarity = (name: string) => {
        setCaseRarityFilter(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };
    const toggleCaseTag = (name: string) => {
        setCaseTagFilter(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    // ── Item filters ──
    const [itemSearch, setItemSearch] = useState("");
    const [itemSort, setItemSort] = useState<"default" | "name-asc" | "name-desc" | "price-asc" | "price-desc">("default");
    const [itemRarityFilter, setItemRarityFilter] = useState<Set<string>>(new Set());
    const [itemPriceMin, setItemPriceMin] = useState(0);
    const [itemPriceMaxOverride, setItemPriceMaxOverride] = useState<number | null>(null);
    const [showItemFilters, setShowItemFilters] = useState(false);
    const toggleItemRarity = (name: string) => {
        setItemRarityFilter(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };
    const itemFilterCount =
        (itemRarityFilter.size > 0 ? 1 : 0) +
        (itemPriceMin > 0 || itemPriceMaxOverride !== null ? 1 : 0) +
        (itemSort !== "default" ? 1 : 0) +
        (itemSearch.trim() ? 1 : 0);
    const resetItemFilters = () => {
        setItemSearch("");
        setItemSort("default");
        setItemRarityFilter(new Set());
        setItemPriceMin(0);
        setItemPriceMaxOverride(null);
    };

    // ── Case dialogs ──
    const [addCaseOpen, setAddCaseOpen]       = useState(false);
    const [editCaseOpen, setEditCaseOpen]     = useState(false);
    const [deleteCaseOpen, setDeleteCaseOpen] = useState(false);
    const [targetCase, setTargetCase]         = useState<AdminCaseResponse | null>(null);
    const [caseForm, setCaseForm]             = useState<CaseFormState>(emptyCaseForm);

    // ── Tag dialogs ──
    const [addTagOpen, setAddTagOpen] = useState(false);
    const [editTagOpen, setEditTagOpen] = useState(false);
    const [deleteTagOpen, setDeleteTagOpen] = useState(false);
    const [targetTag, setTargetTag] = useState<TagData | null>(null);
    const [tagForm, setTagForm] = useState({ name: "" });

    // ── Block confirmation ──
    const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
    const [targetUser, setTargetUser]             = useState<User | null>(null);

    // ── Role confirmation ──
    const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);
    const [roleTargetUser, setRoleTargetUser]   = useState<User | null>(null);

    // ── Grant balance dialog ──
    const [grantBalanceOpen, setGrantBalanceOpen]     = useState(false);
    const [grantBalanceUser, setGrantBalanceUser]     = useState<User | null>(null);
    const [grantBalanceAmount, setGrantBalanceAmount] = useState("");

    // ── Item dialogs ──
    const [addItemOpen, setAddItemOpen]         = useState(false);
    const [editItemOpen, setEditItemOpen]       = useState(false);
    const [deleteItemOpen, setDeleteItemOpen]   = useState(false);
    const [targetItem, setTargetItem]           = useState<CaseItem | null>(null);
    const [itemForm, setItemForm]               = useState({ name: "", price: "", imgUrl: "", weaponId: "", weaponTypeId: "", weaponName: "", weaponType: "", rarityName: "", rarityColor: "" });

    // ── Rarity dialogs ──
    const [addRarityOpen, setAddRarityOpen]       = useState(false);
    const [editRarityOpen, setEditRarityOpen]     = useState(false);
    const [deleteRarityOpen, setDeleteRarityOpen] = useState(false);
    const [targetRarity, setTargetRarity]         = useState<RarityData | null>(null);
    const [rarityForm, setRarityForm]             = useState({ name: "", color: "" });

    // ── Weapon type dialogs ──
    const [addWeaponTypeOpen, setAddWeaponTypeOpen] = useState(false);
    const [editWeaponTypeOpen, setEditWeaponTypeOpen] = useState(false);
    const [deleteWeaponTypeOpen, setDeleteWeaponTypeOpen] = useState(false);
    const [targetWeaponType, setTargetWeaponType] = useState<WeaponTypeData | null>(null);
    const [weaponTypeForm, setWeaponTypeForm] = useState({ name: "" });

    // ── Weapon dialogs ──
    const [addWeaponOpen, setAddWeaponOpen] = useState(false);
    const [editWeaponOpen, setEditWeaponOpen] = useState(false);
    const [deleteWeaponOpen, setDeleteWeaponOpen] = useState(false);
    const [targetWeapon, setTargetWeapon] = useState<WeaponData | null>(null);
    const [weaponForm, setWeaponForm] = useState({ name: "", typeId: "", typeName: "" });

    // ── Access control ──
    if (user?.role !== "admin" && user?.role !== "superadmin") {
        return <NotFound />;
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

    const maxCasePrice = useMemo(
        () => Math.max(100, cases.reduce((highest, current) => Math.max(highest, current.price), 0)),
        [cases],
    );
    const casePriceMax = casePriceMaxOverride ?? maxCasePrice;
    const handleCasePriceMaxChange = (value: number) => {
        setCasePriceMaxOverride(value >= maxCasePrice ? null : value);
    };

    const filteredCases = useMemo(() => {
        let list = [...cases];
        const q = caseSearch.trim().toLowerCase();
        if (q) {
            list = list.filter(c =>
                c.name.toLowerCase().includes(q) ||
                (c.system_name ?? "").toLowerCase().includes(q) ||
                (c.tag ?? "").toLowerCase().includes(q)
            );
        }
        if (caseRarityFilter.size > 0) {
            list = list.filter(c =>
                c.case_content.some(entry => caseRarityFilter.has(getRarityKey(entry.item)))
            );
        }
        if (caseTagFilter.size > 0) {
            list = list.filter(c => c.tag && caseTagFilter.has(c.tag));
        }
        if (caseStatusFilter !== "all") {
            list = list.filter(c => normalizeCaseStatus(c.status) === caseStatusFilter);
        }
        if (casePriceMin > 0) {
            list = list.filter(c => c.price >= casePriceMin);
        }
        if (casePriceMaxOverride !== null) {
            list = list.filter(c => c.price <= casePriceMax);
        }
        switch (caseSort) {
            case "price-asc":
                list.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                list.sort((a, b) => b.price - a.price);
                break;
            case "items-asc":
                list.sort((a, b) => a.case_content.length - b.case_content.length);
                break;
            case "items-desc":
                list.sort((a, b) => b.case_content.length - a.case_content.length);
                break;
            case "status-asc":
                list.sort((a, b) => normalizeCaseStatus(a.status).localeCompare(normalizeCaseStatus(b.status), "ru"));
                break;
            case "status-desc":
                list.sort((a, b) => normalizeCaseStatus(b.status).localeCompare(normalizeCaseStatus(a.status), "ru"));
                break;
            default:
                list.sort((a, b) => a.name.localeCompare(b.name));
        }
        return list;
    }, [casePriceMax, casePriceMaxOverride, casePriceMin, caseRarityFilter, caseSearch, caseSort, caseStatusFilter, caseTagFilter, cases]);

    const caseSortOptions = [
        { id: "default" as const, label: "По умолчанию" },
        { descId: "price-desc" as const, ascId: "price-asc" as const, label: "Цена" },
        { descId: "items-desc" as const, ascId: "items-asc" as const, label: "Предметов" },
        { descId: "status-desc" as const, ascId: "status-asc" as const, label: "Статус" },
    ];

    const activeCaseFilterCount =
        (casePriceMin > 0 || casePriceMaxOverride !== null ? 1 : 0) +
        (caseRarityFilter.size > 0 ? 1 : 0) +
        (caseTagFilter.size > 0 ? 1 : 0) +
        (caseStatusFilter !== "all" ? 1 : 0) +
        (caseSort !== "default" ? 1 : 0);

    const resetCaseFilters = () => {
        setCasePriceMin(0);
        setCasePriceMaxOverride(null);
        setCaseRarityFilter(new Set());
        setCaseTagFilter(new Set());
        setCaseStatusFilter("all");
        setCaseSort("default");
    };

    const tagUsageCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const caseItem of cases) {
            if (!caseItem.tag) {
                continue;
            }
            counts.set(caseItem.tag, (counts.get(caseItem.tag) ?? 0) + 1);
        }
        return counts;
    }, [cases]);

    const caseFormTagOptions = useMemo(() => {
        const entries = [...caseTags];
        if (caseForm.tag && !entries.some(tag => tag.name === caseForm.tag)) {
            entries.push({ id: `current-${caseForm.tag}`, name: caseForm.tag, created_at: "" });
        }
        return entries.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }, [caseForm.tag, caseTags]);

    const maxItemPrice = useMemo(
        () => Math.max(100, allItems.reduce((highest, current) => Math.max(highest, current.price), 0)),
        [allItems],
    );
    const itemPriceMax = itemPriceMaxOverride ?? maxItemPrice;
    const handleItemPriceMaxChange = (value: number) => {
        setItemPriceMaxOverride(value >= maxItemPrice ? null : value);
    };

    const filteredItems = useMemo(() => {
        let list = [...allItems];
        const q = itemSearch.trim().toLowerCase();
        if (q) {
            list = list.filter(i =>
                i.name.toLowerCase().includes(q) ||
                i.weapon.name.toLowerCase().includes(q) ||
                i.weapon.type.toLowerCase().includes(q)
            );
        }
        if (itemRarityFilter.size > 0) {
            list = list.filter(i => itemRarityFilter.has(getRarityKey(i)));
        }
        if (itemPriceMin > 0) {
            list = list.filter(i => i.price >= itemPriceMin);
        }
        if (itemPriceMaxOverride !== null) {
            list = list.filter(i => i.price <= itemPriceMax);
        }
        switch (itemSort) {
            case "name-asc":
                list.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "name-desc":
                list.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case "price-asc":
                list.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                list.sort((a, b) => b.price - a.price);
                break;
            default:
                list.sort((a, b) => a.name.localeCompare(b.name));
        }
        return list;
    }, [allItems, itemPriceMax, itemPriceMaxOverride, itemPriceMin, itemRarityFilter, itemSearch, itemSort]);

    // ── User actions ──
    const openBlockConfirm = (u: User) => {
        setTargetUser(u);
        setBlockConfirmOpen(true);
    };

    const openRoleConfirm = (u: User) => {
        setRoleTargetUser(u);
        setRoleConfirmOpen(true);
    };

    const openGrantBalance = (u: User) => {
        setGrantBalanceUser(u);
        setGrantBalanceAmount("");
        setGrantBalanceOpen(true);
    };

    const handleGrantBalance = async () => {
        if (!grantBalanceUser) return;
        const amount = parseFloat(grantBalanceAmount);
        if (isNaN(amount) || amount <= 0) return;
        setMutating(true);
        try {
            await adminApi.grantBalance(grantBalanceUser.id, amount);
        } catch (e) {
            console.error("Failed to grant balance:", e);
        } finally {
            setMutating(false);
            setGrantBalanceOpen(false);
            setGrantBalanceUser(null);
            setGrantBalanceAmount("");
        }
    };

    const handleToggleBlock = async () => {
        if (!targetUser) return;
        setMutating(true);
        try {
            if (targetUser.status === "active") {
                await adminApi.blockUser(targetUser.id);
            } else {
                await adminApi.unblockUser(targetUser.id);
            }
            await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        } catch (e) {
            console.error("Failed to toggle block:", e);
        } finally {
            setMutating(false);
            setBlockConfirmOpen(false);
            setTargetUser(null);
        }
    };

    const handleToggleRole = async () => {
        if (!roleTargetUser) return;
        setMutating(true);
        try {
            const newRole = roleTargetUser.role === "admin" ? "user" : "admin";
            await adminApi.updateUserRole(roleTargetUser.id, newRole);
            await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        } catch (e) {
            console.error("Failed to toggle role:", e);
        } finally {
            setMutating(false);
            setRoleConfirmOpen(false);
            setRoleTargetUser(null);
        }
    };

    // ── Case actions ──
    const toggleFormItem = (item: CaseItem) => {
        setCaseForm(prev => {
            const nextIds = new Set(prev.selectedItemIds);
            const nextChances = new Map(prev.dropChances);
            if (nextIds.has(item.id)) {
                nextIds.delete(item.id);
                nextChances.delete(item.id);
            } else {
                nextIds.add(item.id);
                nextChances.set(item.id, 0);
            }
            return { ...prev, selectedItemIds: nextIds, dropChances: nextChances };
        });
    };

    const setItemChance = (itemId: string, value: number) => {
        setCaseForm(prev => {
            const next = new Map(prev.dropChances);
            next.set(itemId, value);
            return { ...prev, dropChances: next };
        });
    };

    const [calculating, setCalculating] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await adminApi.uploadImage(file);
            setCaseForm(prev => ({ ...prev, imgUrl: url }));
        } catch (err) {
            console.error("Failed to upload image:", err);
        } finally {
            setUploading(false);
        }
    };

    const autoCalculateChances = async () => {
        const ids = Array.from(caseForm.selectedItemIds);
        if (ids.length === 0) return;
        setCalculating(true);
        try {
            const result = await adminApi.calculateChances(ids);
            setCaseForm(prev => {
                const next = new Map(prev.dropChances);
                for (const { item_id, drop_chance } of result) {
                    next.set(item_id, drop_chance);
                }
                return { ...prev, dropChances: next };
            });
        } catch (e) {
            console.error("Failed to calculate chances:", e);
        } finally {
            setCalculating(false);
        }
    };

    const [calculatingPrice, setCalculatingPrice] = useState(false);
    const autoCalculatePrice = async () => {
        if (caseForm.selectedItemIds.size === 0 || !chancesValid || chancesSum === 0) return;
        setCalculatingPrice(true);
        try {
            const items = Array.from(caseForm.dropChances.entries()).map(([item_id, drop_chance]) => ({ item_id, drop_chance }));
            const result = await adminApi.calculatePrice(items);
            setCaseForm(prev => ({ ...prev, price: String(result.suggested_price) }));
        } catch (e) {
            console.error("Failed to calculate price:", e);
        } finally {
            setCalculatingPrice(false);
        }
    };

    const chancesSum = useMemo(() => {
        let sum = 0;
        for (const v of caseForm.dropChances.values()) sum += v;
        return sum;
    }, [caseForm.dropChances]);

    const chancesValid = caseForm.selectedItemIds.size === 0 || Math.abs(chancesSum - 1) <= 0.001;

    // ── Item actions ──
    const openAddItem = () => {
        setItemForm({ name: "", price: "", imgUrl: "", weaponId: "", weaponTypeId: "", weaponName: "", weaponType: "", rarityName: "", rarityColor: "" });
        setAddItemOpen(true);
    };
    const openEditItem = (item: CaseItem) => {
        const matchedWeapon = weapons.find(w => w.name === item.weapon.name && w.type === item.weapon.type);
        const matchedWeaponType = weaponTypes.find(wt => wt.name === item.weapon.type);
        setTargetItem(item);
        setItemForm({
            name: item.name,
            price: String(item.price),
            imgUrl: item.img_url ?? "",
            weaponId: matchedWeapon?.id ?? "",
            weaponTypeId: matchedWeaponType?.id ?? "",
            weaponName: item.weapon.name,
            weaponType: item.weapon.type,
            rarityName: typeof item.rarity === "string" ? item.rarity : item.rarity.name,
            rarityColor: typeof item.rarity === "string" ? "" : item.rarity.color,
        });
        setEditItemOpen(true);
    };
    const openDeleteItem = (item: CaseItem) => { setTargetItem(item); setDeleteItemOpen(true); };

    const handleAddItem = async () => {
        if (!itemForm.name || !itemForm.price || !itemForm.rarityName || !itemForm.weaponName || !itemForm.weaponType) return;
        setMutating(true);
        try {
            await adminApi.createItem({
                name: itemForm.name,
                price: parseFloat(itemForm.price),
                img_url: itemForm.imgUrl || null,
                weapon: { name: itemForm.weaponName, type: itemForm.weaponType },
                rarity: { name: itemForm.rarityName, color: itemForm.rarityColor || "#ffffff" },
            });
            await queryClient.invalidateQueries({ queryKey: ["admin-items"] });
            setAddItemOpen(false);
        } catch (e) { console.error("Failed to create item:", e); }
        finally { setMutating(false); }
    };

    const handleEditItem = async () => {
        if (!targetItem || !itemForm.name || !itemForm.price || !itemForm.weaponName || !itemForm.weaponType) return;
        setMutating(true);
        try {
            await adminApi.updateItem({
                id: targetItem.id,
                name: itemForm.name,
                price: parseFloat(itemForm.price),
                img_url: itemForm.imgUrl || null,
                weapon: { name: itemForm.weaponName, type: itemForm.weaponType },
                rarity: { name: itemForm.rarityName, color: itemForm.rarityColor || "#ffffff" },
            });
            await queryClient.invalidateQueries({ queryKey: ["admin-items"] });
            setEditItemOpen(false);
        } catch (e) { console.error("Failed to update item:", e); }
        finally { setMutating(false); }
    };

    const handleDeleteItem = async () => {
        if (!targetItem) return;
        setMutating(true);
        try {
            await adminApi.deleteItem(targetItem.id);
            await queryClient.invalidateQueries({ queryKey: ["admin-items"] });
        } catch (e) { console.error("Failed to delete item:", e); }
        finally { setMutating(false); setDeleteItemOpen(false); setTargetItem(null); }
    };

    const [itemUploading, setItemUploading] = useState(false);
    const handleItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setItemUploading(true);
        try {
            const url = await adminApi.uploadImage(file);
            setItemForm(prev => ({ ...prev, imgUrl: url }));
        } catch (err) { console.error("Failed to upload image:", err); }
        finally { setItemUploading(false); }
    };

    // ── Rarity actions ──
    const openAddRarity = () => { setRarityForm({ name: "", color: "#ffffff" }); setAddRarityOpen(true); };
    const openEditRarity = (r: RarityData) => { setTargetRarity(r); setRarityForm({ name: r.name, color: r.color }); setEditRarityOpen(true); };
    const openDeleteRarity = (r: RarityData) => { setTargetRarity(r); setDeleteRarityOpen(true); };

    const handleAddRarity = async () => {
        if (!rarityForm.name || !rarityForm.color) return;
        setMutating(true);
        try {
            await adminApi.createRarity({ name: rarityForm.name, color: rarityForm.color });
            await queryClient.invalidateQueries({ queryKey: ["admin-rarities"] });
            setAddRarityOpen(false);
        } catch (e) { console.error("Failed to create rarity:", e); }
        finally { setMutating(false); }
    };

    const handleEditRarity = async () => {
        if (!targetRarity) return;
        setMutating(true);
        try {
            await adminApi.updateRarity(targetRarity.id, { name: rarityForm.name, color: rarityForm.color });
            await queryClient.invalidateQueries({ queryKey: ["admin-rarities"] });
            setEditRarityOpen(false);
        } catch (e) { console.error("Failed to update rarity:", e); }
        finally { setMutating(false); }
    };

    const handleDeleteRarity = async () => {
        if (!targetRarity) return;
        setMutating(true);
        try {
            await adminApi.deleteRarity(targetRarity.id);
            await queryClient.invalidateQueries({ queryKey: ["admin-rarities"] });
        } catch (e) { console.error("Failed to delete rarity:", e); }
        finally { setMutating(false); setDeleteRarityOpen(false); setTargetRarity(null); }
    };

    // ── Weapon type actions ──
    const openAddWeaponType = () => {
        setWeaponTypeForm({ name: "" });
        setAddWeaponTypeOpen(true);
    };
    const openEditWeaponType = (weaponType: WeaponTypeData) => {
        setTargetWeaponType(weaponType);
        setWeaponTypeForm({ name: weaponType.name });
        setEditWeaponTypeOpen(true);
    };
    const openDeleteWeaponType = (weaponType: WeaponTypeData) => {
        setTargetWeaponType(weaponType);
        setDeleteWeaponTypeOpen(true);
    };

    const handleAddWeaponType = async () => {
        if (!weaponTypeForm.name) return;
        setMutating(true);
        try {
            await adminApi.createWeaponType({ name: weaponTypeForm.name });
            await queryClient.invalidateQueries({ queryKey: ["admin-weapon-types"] });
            setAddWeaponTypeOpen(false);
        } catch (e) { console.error("Failed to create weapon type:", e); }
        finally { setMutating(false); }
    };

    const handleEditWeaponType = async () => {
        if (!targetWeaponType) return;
        setMutating(true);
        try {
            await adminApi.updateWeaponType(targetWeaponType.id, { name: weaponTypeForm.name });
            await queryClient.invalidateQueries({ queryKey: ["admin-weapon-types"] });
            await queryClient.invalidateQueries({ queryKey: ["admin-weapons"] });
            setEditWeaponTypeOpen(false);
        } catch (e) { console.error("Failed to update weapon type:", e); }
        finally { setMutating(false); }
    };

    const handleDeleteWeaponType = async () => {
        if (!targetWeaponType) return;
        setMutating(true);
        try {
            await adminApi.deleteWeaponType(targetWeaponType.id);
            await queryClient.invalidateQueries({ queryKey: ["admin-weapon-types"] });
            await queryClient.invalidateQueries({ queryKey: ["admin-weapons"] });
        } catch (e) { console.error("Failed to delete weapon type:", e); }
        finally { setMutating(false); setDeleteWeaponTypeOpen(false); setTargetWeaponType(null); }
    };

    // ── Weapon actions ──
    const openAddWeapon = () => {
        setWeaponForm({ name: "", typeId: "", typeName: "" });
        setAddWeaponOpen(true);
    };
    const openEditWeapon = (weapon: WeaponData) => {
        const matchedType = weaponTypes.find(t => t.name === weapon.type);
        setTargetWeapon(weapon);
        setWeaponForm({
            name: weapon.name,
            typeId: matchedType?.id ?? "",
            typeName: weapon.type,
        });
        setEditWeaponOpen(true);
    };
    const openDeleteWeapon = (weapon: WeaponData) => {
        setTargetWeapon(weapon);
        setDeleteWeaponOpen(true);
    };

    const handleAddWeapon = async () => {
        if (!weaponForm.name || !weaponForm.typeName) return;
        setMutating(true);
        try {
            await adminApi.createWeapon({ name: weaponForm.name, type: weaponForm.typeName });
            await queryClient.invalidateQueries({ queryKey: ["admin-weapons"] });
            setAddWeaponOpen(false);
        } catch (e) { console.error("Failed to create weapon:", e); }
        finally { setMutating(false); }
    };

    const handleEditWeapon = async () => {
        if (!targetWeapon) return;
        setMutating(true);
        try {
            await adminApi.updateWeapon(targetWeapon.id, { name: weaponForm.name, type: weaponForm.typeName });
            await queryClient.invalidateQueries({ queryKey: ["admin-weapons"] });
            setEditWeaponOpen(false);
        } catch (e) { console.error("Failed to update weapon:", e); }
        finally { setMutating(false); }
    };

    const handleDeleteWeapon = async () => {
        if (!targetWeapon) return;
        setMutating(true);
        try {
            await adminApi.deleteWeapon(targetWeapon.id);
            await queryClient.invalidateQueries({ queryKey: ["admin-weapons"] });
        } catch (e) { console.error("Failed to delete weapon:", e); }
        finally { setMutating(false); setDeleteWeaponOpen(false); setTargetWeapon(null); }
    };

    // Build list of selected items with their details for drop chance UI
    const selectedItemsList = useMemo(() => {
        return allItems.filter(i => caseForm.selectedItemIds.has(i.id));
    }, [allItems, caseForm.selectedItemIds]);

    const openAddCase = () => {
        setCaseForm(emptyCaseForm);
        setAddCaseOpen(true);
    };

    const handleGenerateSystemName = () => {
        setCaseForm((prev) => ({
            ...prev,
            systemName: generateSystemName(prev.name || prev.systemName),
        }));
    };

    const openEditCase = (c: AdminCaseResponse) => {
        setTargetCase(c);
        setCaseForm(caseFormFromAdminCase(c));
        setEditCaseOpen(true);
    };

    const openDeleteCase = (c: AdminCaseResponse) => {
        setTargetCase(c);
        setDeleteCaseOpen(true);
    };

    const handleAddCase = async () => {
        if (!caseForm.name || !caseForm.price || !chancesValid) return;
        setMutating(true);
        try {
            const caseContent = Array.from(caseForm.dropChances.entries()).map(
                ([item_id, drop_chance]) => ({ item_id, drop_chance })
            );
            const payload: CreateCasePayload = {
                name: caseForm.name,
                price: parseInt(caseForm.price),
                img_url: caseForm.imgUrl || null,
                system_name: caseForm.systemName || null,
                tag: caseForm.tag || null,
                status: caseForm.status || "active",
                case_content: caseContent,
            };
            await adminApi.createCase(payload);
            await queryClient.invalidateQueries({ queryKey: ["admin-cases"] });
            setAddCaseOpen(false);
        } catch (e) {
            console.error("Failed to create case:", e);
        } finally {
            setMutating(false);
        }
    };

    const handleEditCase = async () => {
        if (!targetCase || !caseForm.name || !caseForm.price || !chancesValid) return;
        setMutating(true);
        try {
            const caseContent = Array.from(caseForm.dropChances.entries()).map(
                ([item_id, drop_chance]) => ({ item_id, drop_chance })
            );
            const payload: UpdateCasePayload = {
                id: targetCase.id,
                name: caseForm.name,
                price: parseInt(caseForm.price),
                img_url: caseForm.imgUrl || null,
                system_name: caseForm.systemName || null,
                tag: caseForm.tag || null,
                status: caseForm.status || "active",
                case_content: caseContent,
            };
            await adminApi.updateCase(payload);
            await queryClient.invalidateQueries({ queryKey: ["admin-cases"] });
            setEditCaseOpen(false);
        } catch (e) {
            console.error("Failed to update case:", e);
        } finally {
            setMutating(false);
        }
    };

    const handleDeleteCase = async () => {
        if (!targetCase) return;
        setMutating(true);
        try {
            await adminApi.deleteCase(targetCase.id);
            await queryClient.invalidateQueries({ queryKey: ["admin-cases"] });
            setDeleteCaseOpen(false);
            setTargetCase(null);
        } catch (e) {
            console.error("Failed to delete case:", e);
        } finally {
            setMutating(false);
        }
    };

    // ── Tag actions ──
    const openAddTag = () => {
        setTagForm({ name: "" });
        setAddTagOpen(true);
    };

    const openEditTag = (tag: TagData) => {
        setTargetTag(tag);
        setTagForm({ name: tag.name });
        setEditTagOpen(true);
    };

    const openDeleteTag = (tag: TagData) => {
        setTargetTag(tag);
        setDeleteTagOpen(true);
    };

    const handleAddTag = async () => {
        if (!tagForm.name.trim()) return;
        setMutating(true);
        try {
            await adminApi.createCaseTag({ name: tagForm.name.trim() });
            await queryClient.invalidateQueries({ queryKey: ["admin-case-tags"] });
            setAddTagOpen(false);
        } catch (e) {
            console.error("Failed to create tag:", e);
        } finally {
            setMutating(false);
        }
    };

    const handleEditTag = async () => {
        if (!targetTag || !tagForm.name.trim()) return;
        setMutating(true);
        try {
            await adminApi.updateCaseTag(targetTag.id, { name: tagForm.name.trim() });
            await queryClient.invalidateQueries({ queryKey: ["admin-case-tags"] });
            await queryClient.invalidateQueries({ queryKey: ["admin-cases"] });
            setEditTagOpen(false);
            setTargetTag(null);
        } catch (e) {
            console.error("Failed to update tag:", e);
        } finally {
            setMutating(false);
        }
    };

    const handleDeleteTag = async () => {
        if (!targetTag) return;
        setMutating(true);
        try {
            await adminApi.deleteCaseTag(targetTag.id);
            await queryClient.invalidateQueries({ queryKey: ["admin-case-tags"] });
            await queryClient.invalidateQueries({ queryKey: ["admin-cases"] });
            setDeleteTagOpen(false);
            setTargetTag(null);
        } catch (e) {
            console.error("Failed to delete tag:", e);
        } finally {
            setMutating(false);
        }
    };

    // ── Tab config ──
    const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
        { id: "users", label: "Пользователи", icon: <Users className="h-4 w-4" /> },
        { id: "cases", label: "Кейсы", icon: <Package className="h-4 w-4" /> },
        { id: "items", label: "Предметы", icon: <Crosshair className="h-4 w-4" /> },
        { id: "weapons", label: "Оружие", icon: <Crosshair className="h-4 w-4" /> },
        { id: "rarities", label: "Редкости", icon: <Palette className="h-4 w-4" /> },
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
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            value={caseForm.price}
                            onChange={e => setCaseForm(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="100"
                            className="rounded-xl border-border/60 bg-background/50 text-foreground"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={autoCalculatePrice}
                            disabled={calculatingPrice || caseForm.selectedItemIds.size === 0 || !chancesValid || chancesSum === 0}
                            title="Рассчитать цену на основе предметов и шансов"
                            className="rounded-xl border-orange-500/30 text-orange-400 hover:bg-orange-500/10 shrink-0"
                        >
                            {calculatingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : "Рассчитать"}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm text-foreground">Системное название</Label>
                    <div className="flex gap-2">
                        <Input
                            value={caseForm.systemName}
                            onChange={e => setCaseForm(prev => ({ ...prev, systemName: e.target.value }))}
                            placeholder="prisma_2_case"
                            className="rounded-xl border-border/60 bg-background/50 text-foreground"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGenerateSystemName}
                            className="rounded-xl border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        >
                            Сгенерировать
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Используется в URL кейса вместо обычного названия.</p>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm text-foreground">Статус</Label>
                    <select
                        value={caseForm.status}
                        onChange={e => setCaseForm(prev => ({ ...prev, status: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-border/60 bg-background/50 px-3 text-sm text-foreground"
                    >
                        <option value="active">Активен</option>
                        <option value="disabled">Отключен</option>
                    </select>
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-sm text-foreground">Тег</Label>
                <select
                    value={caseForm.tag}
                    onChange={e => setCaseForm(prev => ({ ...prev, tag: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-border/60 bg-background/50 px-3 text-sm text-foreground"
                >
                    <option value="">Без тега</option>
                    {caseFormTagOptions.map(tag => <option key={tag.id} value={tag.name}>{tag.name}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">
                    {caseTagsLoading ? "Загружаем теги..." : "Теги управляются отдельно в правой панели раздела кейсов."}
                </p>
            </div>
            {/* Image upload */}
            <div className="space-y-2">
                <Label className="text-sm text-foreground">Изображение</Label>
                <div className="flex items-center gap-3">
                    {caseForm.imgUrl ? (
                        <img
                            src={caseForm.imgUrl}
                            alt="case"
                            className="w-16 h-16 rounded-xl object-cover border border-border/60"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-background/50 border border-border/60 flex items-center justify-center">
                            <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-background/50 text-sm text-muted-foreground hover:text-foreground hover:border-orange-500/30 cursor-pointer transition-all">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploading ? "Загрузка..." : "Загрузить"}
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                    {caseForm.imgUrl && (
                        <button
                            onClick={() => setCaseForm(prev => ({ ...prev, imgUrl: "" }))}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            Удалить
                        </button>
                    )}
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-sm text-foreground">Предметы кейса</Label>
                {itemsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    </div>
                ) : (
                    <ItemTreePicker
                        allItems={allItems}
                        selectedIds={caseForm.selectedItemIds}
                        onToggle={toggleFormItem}
                    />
                )}
            </div>

            {/* ── Drop chance section ── */}
            {selectedItemsList.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm text-foreground">Шансы выпадения</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={autoCalculateChances}
                            disabled={calculating}
                            className="rounded-xl border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs"
                        >
                            {calculating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Settings className="h-3.5 w-3.5 mr-1" />}
                            Авто-расчёт
                        </Button>
                    </div>

                    <div className="max-h-48 overflow-y-auto rounded-xl border border-border/40 bg-background/30 divide-y divide-border/30">
                        {selectedItemsList.map(item => {
                            const rk = getRarityKey(item);
                            const chance = caseForm.dropChances.get(item.id) ?? 0;
                            return (
                                <div key={item.id} className="flex items-center gap-3 px-3 py-2">
                                    <ItemImage item={item} size="sm" />
                                    <span className={`flex-1 text-xs font-medium truncate ${RARITY_COLORS[rk] ?? "text-foreground"}`}>
                                        {item.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                        {item.price.toLocaleString()} <Coins className="h-2.5 w-2.5" />
                                    </span>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        max="1"
                                        value={chance || ""}
                                        onChange={e => setItemChance(item.id, parseFloat(e.target.value) || 0)}
                                        className="w-20 h-7 rounded-lg text-xs border-border/60 bg-background/50 text-foreground px-2 text-right"
                                        placeholder="0.00"
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Sum indicator */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-medium ${
                        chancesValid
                            ? "border-green-500/30 bg-green-500/5 text-green-400"
                            : "border-red-500/30 bg-red-500/5 text-red-400"
                    }`}>
                        <span>Сумма шансов</span>
                        <span>{chancesSum.toFixed(4)} {chancesValid ? "✓" : `≠ 1.0`}</span>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="relative min-h-screen bg-background">
            {/* Full-left "На главную" edge button — fixed to viewport */}
            <Link
                to="/"
                aria-label="На главную"
                className="peer/home-edge hidden lg:block fixed inset-y-0 left-0 z-10 w-24 cursor-pointer"
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

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                        <p className="text-sm text-muted-foreground">Управление кейсами, предметами, редкостями и пользователями</p>
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
                                        {([["all", "Все роли"], ["user", "Пользователи"], ["admin", "Администраторы"], ...(user?.role === "superadmin" ? [["superadmin", "Суперадминистраторы"]] : [])] as const).map(([val, label]) => (
                                            <button
                                                key={val}
                                                onClick={() => setRoleFilter(val as UserRoleFilter)}
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
                            {usersLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                                </div>
                            ) : (
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
                                                            to="/user/$userName"
                                                            params={{ userName: u.nickname }}
                                                            className="font-medium text-foreground hover:text-orange-400 transition-colors"
                                                        >
                                                            {u.nickname}
                                                        </Link>
                                                        {u.role === "superadmin" ? (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-xs text-purple-400">Суперадминистратор</span>
                                                        ) : u.role === "admin" ? (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-xs text-red-400">Администратор</span>
                                                        ) : (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-xs text-blue-400">Пользователь</span>
                                                        )}
                                                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                                            u.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                                        }`}>
                                                            {u.status === "active" ? "Активен" : "Заблокирован"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                                                    {u.registeredAt && (
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                Рег: {new Date(u.registeredAt).toLocaleDateString("ru-RU")}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                {u.role !== "superadmin" && (
                                                    <>
                                                        {user?.role === "superadmin" && (
                                                            <Button
                                                                onClick={() => openRoleConfirm(u)}
                                                                variant="outline"
                                                                size="sm"
                                                                title={u.role === "admin" ? "Снять администратора" : "Назначить администратором"}
                                                                className={`rounded-xl text-xs ${
                                                                    u.role === "admin"
                                                                        ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                                                                        : "border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
                                                                }`}
                                                            >
                                                                <Shield className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
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
                                                        <Button
                                                            onClick={() => openGrantBalance(u)}
                                                            variant="outline"
                                                            size="sm"
                                                            title="Выдать баланс"
                                                            className="rounded-xl text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
                                                        >
                                                            <Coins className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </>
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
                            )}
                        </motion.div>
                    )}

                    {/* ════════════════════  CASES TAB  ════════════════════ */}
                    {activeTab === "cases" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)] gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-foreground">Кейсы ({filteredCases.length})</h2>
                                        <Button onClick={openAddCase} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center gap-2">
                                            <Plus className="h-4 w-4" /> Добавить кейс
                                        </Button>
                                    </div>

                                    <FilterPanel open={showCaseFilters} onToggle={() => setShowCaseFilters(prev => !prev)} filterCount={activeCaseFilterCount} onReset={resetCaseFilters}>
                                            <SearchInput value={caseSearch} onChange={setCaseSearch} placeholder="Поиск по названию, системному имени или тегу..." />
                                            <SortButtons options={caseSortOptions} current={caseSort} onChange={setCaseSort} label="Сортировка" />
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div>
                                                    <PriceRangeInputs min={casePriceMin} max={casePriceMax} onMinChange={setCasePriceMin} onMaxChange={handleCasePriceMaxChange} maxValue={maxCasePrice} />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-foreground">Статус</p>
                                                    <StatusFilterButtons current={caseStatusFilter} onChange={v => setCaseStatusFilter(v as CaseStatusFilter)} />
                                                </div>
                                            </div>

                                            {caseTags.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-foreground mb-2">Теги</p>
                                                    <TagFilterButtons tags={caseTags.map(t => t.name)} selected={caseTagFilter} onToggle={toggleCaseTag} />
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-sm font-medium text-foreground mb-2">Редкость</p>
                                                <RarityFilterButtons rarities={rarities} selected={caseRarityFilter} onToggle={toggleCaseRarity} onReset={() => setCaseRarityFilter(new Set())} />
                                            </div>
                                    </FilterPanel>

                                    {casesLoading ? (
                                        <div className="flex items-center justify-center py-16">
                                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                                        </div>
                                    ) : (
                                    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden">
                                        <div className="divide-y divide-border/40">
                                            {filteredCases.map(c => (
                                                <div key={c.id} className="flex items-center justify-between p-3 sm:p-4 gap-2 hover:bg-background/30 transition-colors">
                                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                        {c.img_url ? (
                                                            <img src={c.img_url} alt={c.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-border/60 flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-medium text-foreground truncate">{c.name}</p>
                                                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${c.status === "disabled" ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"}`}>
                                                                    {c.status === "disabled" ? "Отключен" : "Активен"}
                                                                </span>
                                                                {c.tag && <span className="px-1.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-medium text-white/90">{c.tag}</span>}
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{c.system_name || "без системного имени"} · {c.case_content.length} предметов</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                                        <span className="text-sm font-bold text-orange-500 flex items-center gap-1">{c.price.toLocaleString()} <Coins className="h-3.5 w-3.5" /></span>
                                                        <Button onClick={() => openEditCase(c)} variant="outline" size="sm" className="rounded-xl border-border/60 text-muted-foreground hover:text-foreground hover:border-orange-500/30"><Settings className="h-3.5 w-3.5" /></Button>
                                                        <Button onClick={() => openDeleteCase(c)} variant="outline" size="sm" className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredCases.length === 0 && <div className="p-8 text-center text-muted-foreground">Кейсы не найдены</div>}
                                        </div>
                                    </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-foreground">Теги ({caseTags.length})</h2>
                                        <Button onClick={openAddTag} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center gap-2">
                                            <Plus className="h-4 w-4" /> Добавить тег
                                        </Button>
                                    </div>

                                    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden mt-4 xl:mt-[70px]">
                                        {caseTagsLoading ? (
                                            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
                                        ) : (
                                            <div className="divide-y divide-border/40">
                                                {caseTags.map(tag => (
                                                    <div key={tag.id} className="flex items-center justify-between p-4 hover:bg-background/30 transition-colors gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Tags className="h-4 w-4 text-orange-400" />
                                                                <p className="font-medium text-foreground truncate">{tag.name}</p>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">Используется в {tagUsageCounts.get(tag.name) ?? 0} кейсах</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button onClick={() => openEditTag(tag)} variant="outline" size="sm" className="rounded-xl border-border/60 text-muted-foreground hover:text-foreground hover:border-orange-500/30"><Pencil className="h-3.5 w-3.5" /></Button>
                                                            <Button onClick={() => openDeleteTag(tag)} variant="outline" size="sm" className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {caseTags.length === 0 && <div className="p-8 text-center text-muted-foreground">Тегов пока нет</div>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ════════════════════  ITEMS TAB  ════════════════════ */}
                    {activeTab === "items" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-foreground">Предметы ({filteredItems.length})</h2>
                                <Button onClick={openAddItem} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Добавить предмет
                                </Button>
                            </div>

                            <FilterPanel
                                open={showItemFilters}
                                onToggle={() => setShowItemFilters(v => !v)}
                                filterCount={itemFilterCount}
                                onReset={resetItemFilters}
                            >
                                <SearchInput value={itemSearch} onChange={setItemSearch} placeholder="Поиск по названию/оружию/типу..." />
                                <SortButtons
                                    options={[
                                        { id: "default" as const, label: "По умолчанию" },
                                        { descId: "name-asc" as const, ascId: "name-desc" as const, label: "Название" },
                                        { descId: "price-desc" as const, ascId: "price-asc" as const, label: "Цена" },
                                    ]}
                                    current={itemSort}
                                    onChange={setItemSort as (v: string) => void}
                                    label="Сортировка"
                                />
                                <PriceRangeInputs min={itemPriceMin} max={itemPriceMax} onMinChange={setItemPriceMin} onMaxChange={handleItemPriceMaxChange} maxValue={maxItemPrice} />
                                <div>
                                    <p className="text-sm font-medium text-foreground mb-2">Редкость</p>
                                    <RarityFilterButtons rarities={rarities} selected={itemRarityFilter} onToggle={toggleItemRarity} onReset={() => setItemRarityFilter(new Set())} />
                                </div>
                            </FilterPanel>
                            {itemsLoading ? (
                                <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
                            ) : (
                            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden">
                                <div className="divide-y divide-border/40">
                                    {filteredItems.map(item => {
                                        const rk = getRarityKey(item);
                                        return (
                                            <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 gap-2 hover:bg-background/30 transition-colors">
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                    <ItemImage item={item} size="sm" />
                                                    <div className="min-w-0">
                                                        <p className={`font-medium truncate ${RARITY_COLORS[rk] ?? "text-foreground"}`}>{item.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{item.weapon.name} · {item.weapon.type} · <span style={{ color: typeof item.rarity !== "string" ? item.rarity.color : undefined }}>{rk}</span></p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                                    <span className="text-sm font-bold text-orange-500 flex items-center gap-1">{item.price.toLocaleString()} <Coins className="h-3.5 w-3.5" /></span>
                                                    <Button onClick={() => openEditItem(item)} variant="outline" size="sm" className="rounded-xl border-border/60 text-muted-foreground hover:text-foreground hover:border-orange-500/30"><Pencil className="h-3.5 w-3.5" /></Button>
                                                    <Button onClick={() => openDeleteItem(item)} variant="outline" size="sm" className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {filteredItems.length === 0 && <div className="p-8 text-center text-muted-foreground">Предметов пока нет</div>}
                            </div>
                            )}
                        </motion.div>
                    )}

                    {/* ════════════════════  WEAPONS TAB  ════════════════════ */}
                    {activeTab === "weapons" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-foreground">Типы оружия ({weaponTypes.length})</h2>
                                        <Button onClick={openAddWeaponType} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center gap-2">
                                            <Plus className="h-4 w-4" /> Добавить тип
                                        </Button>
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden">
                                        {weaponTypesLoading ? (
                                            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
                                        ) : (
                                            <div className="divide-y divide-border/40">
                                                {weaponTypes.map(type => (
                                                    <div key={type.id} className="flex items-center justify-between p-4 hover:bg-background/30 transition-colors">
                                                        <p className="font-medium text-foreground">{type.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <Button onClick={() => openEditWeaponType(type)} variant="outline" size="sm" className="rounded-xl border-border/60 text-muted-foreground hover:text-foreground hover:border-orange-500/30">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button onClick={() => openDeleteWeaponType(type)} variant="outline" size="sm" className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {weaponTypes.length === 0 && <div className="p-8 text-center text-muted-foreground">Типов оружия пока нет</div>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-foreground">Оружие ({weapons.length})</h2>
                                        <Button onClick={openAddWeapon} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center gap-2">
                                            <Plus className="h-4 w-4" /> Добавить оружие
                                        </Button>
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden">
                                        {weaponsLoading ? (
                                            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
                                        ) : (
                                            <div className="divide-y divide-border/40">
                                                {weapons.map(weapon => (
                                                    <div key={weapon.id} className="flex items-center justify-between p-4 hover:bg-background/30 transition-colors">
                                                        <div>
                                                            <p className="font-medium text-foreground">{weapon.name}</p>
                                                            <p className="text-xs text-muted-foreground">Тип: {weapon.type}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button onClick={() => openEditWeapon(weapon)} variant="outline" size="sm" className="rounded-xl border-border/60 text-muted-foreground hover:text-foreground hover:border-orange-500/30">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button onClick={() => openDeleteWeapon(weapon)} variant="outline" size="sm" className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {weapons.length === 0 && <div className="p-8 text-center text-muted-foreground">Оружия пока нет</div>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ════════════════════  RARITIES TAB  ════════════════════ */}
                    {activeTab === "rarities" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-foreground">Редкости ({rarities.length})</h2>
                                <Button onClick={openAddRarity} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Добавить редкость
                                </Button>
                            </div>
                            {raritiesLoading ? (
                                <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
                            ) : (
                            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden">
                                <div className="divide-y divide-border/40">
                                    {rarities.map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-3 sm:p-4 gap-2 hover:bg-background/30 transition-colors">
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-xl border border-border/60 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: r.color + "20", borderColor: r.color + "40" }}>
                                                    <Palette className="h-5 w-5" style={{ color: r.color }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-foreground">{r.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: r.color }} />
                                                        {r.color}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button onClick={() => openEditRarity(r)} variant="outline" size="sm" className="rounded-xl border-border/60 text-muted-foreground hover:text-foreground hover:border-orange-500/30">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button onClick={() => openDeleteRarity(r)} variant="outline" size="sm" className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {rarities.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">Редкостей пока нет</div>
                                )}
                            </div>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </main>

            {/* ════════════  ADD CASE DIALOG  ════════════ */}
            <Dialog open={addCaseOpen} onOpenChange={setAddCaseOpen}>
                <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[85vh] overflow-hidden">
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
                            disabled={!caseForm.name || !caseForm.price || !chancesValid || mutating}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50"
                        >
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Создать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  EDIT CASE DIALOG  ════════════ */}
            <Dialog open={editCaseOpen} onOpenChange={setEditCaseOpen}>
                <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[85vh] overflow-hidden">
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
                            disabled={!caseForm.name || !caseForm.price || !chancesValid || mutating}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50"
                        >
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />} Сохранить
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

            {/* ════════════  ROLE TOGGLE CONFIRMATION  ════════════ */}
            <Dialog open={roleConfirmOpen} onOpenChange={setRoleConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-yellow-400" />
                            {roleTargetUser?.role === "admin" ? "Снять администратора?" : "Назначить администратором?"}
                        </DialogTitle>
                        <DialogDescription>
                            {roleTargetUser?.role === "admin" ? (
                                <>Пользователь <span className="font-semibold text-foreground">{roleTargetUser?.nickname}</span> потеряет права администратора.</>
                            ) : (
                                <>Пользователь <span className="font-semibold text-foreground">{roleTargetUser?.nickname}</span> получит права администратора.</>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleConfirmOpen(false)} className="rounded-xl">
                            Отмена
                        </Button>
                        <Button
                            onClick={handleToggleRole}
                            disabled={mutating}
                            className="rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white"
                        >
                            <Shield className="h-4 w-4 mr-1" />
                            {roleTargetUser?.role === "admin" ? "Снять" : "Назначить"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  GRANT BALANCE DIALOG  ════════════ */}
            <Dialog open={grantBalanceOpen} onOpenChange={setGrantBalanceOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-orange-400" />
                            Выдать баланс
                        </DialogTitle>
                        <DialogDescription>
                            Укажите сумму для пополнения баланса пользователя{" "}
                            <span className="font-semibold text-foreground">{grantBalanceUser?.nickname}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label className="text-sm text-foreground flex items-center gap-1.5">
                            Сумма <Coins className="h-3.5 w-3.5 text-orange-500" />
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            value={grantBalanceAmount}
                            onChange={e => setGrantBalanceAmount(e.target.value)}
                            placeholder="1000"
                            className="rounded-xl border-border/60 bg-background/50 text-foreground"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGrantBalanceOpen(false)} className="rounded-xl">
                            Отмена
                        </Button>
                        <Button
                            onClick={handleGrantBalance}
                            disabled={mutating || !grantBalanceAmount || parseFloat(grantBalanceAmount) <= 0}
                            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            <Coins className="h-4 w-4 mr-1" />
                            Выдать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-orange-500" /> Новый предмет</DialogTitle>
                        <DialogDescription>Заполните информацию о предмете</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground">Название</Label>
                                <Input value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} placeholder="AK-47 | Красная линия" className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground flex items-center gap-1.5">Цена <Coins className="h-3.5 w-3.5 text-orange-500" /></Label>
                                <Input type="number" value={itemForm.price} onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))} placeholder="100" className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground">Оружие</Label>
                                <select
                                    value={itemForm.weaponId}
                                    onChange={e => {
                                        const selectedWeapon = weapons.find(w => w.id === e.target.value);
                                        const selectedType = weaponTypes.find(t => t.name === selectedWeapon?.type);
                                        setItemForm(p => ({
                                            ...p,
                                            weaponId: e.target.value,
                                            weaponName: selectedWeapon?.name ?? "",
                                            weaponType: selectedWeapon?.type ?? p.weaponType,
                                            weaponTypeId: selectedType?.id ?? p.weaponTypeId,
                                        }));
                                    }}
                                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm"
                                >
                                    <option value="">Выберите оружие</option>
                                    {weapons.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground">Тип оружия</Label>
                                <select
                                    value={itemForm.weaponTypeId}
                                    onChange={e => {
                                        const selectedType = weaponTypes.find(t => t.id === e.target.value);
                                        setItemForm(p => ({ ...p, weaponTypeId: e.target.value, weaponType: selectedType?.name ?? "" }));
                                    }}
                                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm"
                                >
                                    <option value="">Выберите тип оружия</option>
                                    {weaponTypes.map(wt => <option key={wt.id} value={wt.id}>{wt.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground">Редкость</Label>
                                {rarities.length > 0 ? (
                                    <select
                                        value={itemForm.rarityName}
                                        onChange={e => {
                                            const sel = rarities.find(r => r.name === e.target.value);
                                            setItemForm(p => ({ ...p, rarityName: sel?.name ?? e.target.value, rarityColor: sel?.color ?? p.rarityColor }));
                                        }}
                                        className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm"
                                    >
                                        <option value="">Выберите редкость</option>
                                        {rarities.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    </select>
                                ) : (
                                    <Input value={itemForm.rarityName} onChange={e => setItemForm(p => ({ ...p, rarityName: e.target.value }))} placeholder="legendary" className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground">Цвет редкости</Label>
                                <div className="flex gap-2">
                                    <Input value={itemForm.rarityColor} onChange={e => setItemForm(p => ({ ...p, rarityColor: e.target.value }))} placeholder="#ff9900" className="rounded-xl border-border/60 bg-background/50 text-foreground flex-1" />
                                    <input type="color" value={itemForm.rarityColor || "#ffffff"} onChange={e => setItemForm(p => ({ ...p, rarityColor: e.target.value }))} className="w-10 h-10 rounded-xl border border-border/60 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                        {/* Image */}
                        <div className="space-y-2">
                            <Label className="text-sm text-foreground">Изображение</Label>
                            <div className="flex items-center gap-3">
                                {itemForm.imgUrl ? (
                                    <img src={itemForm.imgUrl} alt="item" className="w-16 h-16 rounded-xl object-cover border border-border/60" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-background/50 border border-border/60 flex items-center justify-center"><Image className="h-6 w-6 text-muted-foreground" /></div>
                                )}
                                <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-background/50 text-sm text-muted-foreground hover:text-foreground hover:border-orange-500/30 cursor-pointer transition-all">
                                    {itemUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    {itemUploading ? "Загрузка..." : "Загрузить"}
                                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleItemImageUpload} className="hidden" disabled={itemUploading} />
                                </label>
                                {itemForm.imgUrl && <button onClick={() => setItemForm(p => ({ ...p, imgUrl: "" }))} className="text-xs text-red-400 hover:text-red-300 transition-colors">Удалить</button>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddItemOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleAddItem} disabled={!itemForm.name || !itemForm.price || !itemForm.rarityName || !itemForm.weaponName || !itemForm.weaponType || mutating} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50">
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Создать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  EDIT ITEM DIALOG  ════════════ */}
            <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-orange-500" /> Редактировать предмет</DialogTitle>
                        <DialogDescription>Измените параметры предмета</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground">Название</Label>
                                <Input value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground flex items-center gap-1.5">Цена <Coins className="h-3.5 w-3.5 text-orange-500" /></Label>
                                <Input type="number" value={itemForm.price} onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))} className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground">Оружие</Label>
                                <select
                                    value={itemForm.weaponId}
                                    onChange={e => {
                                        const selectedWeapon = weapons.find(w => w.id === e.target.value);
                                        const selectedType = weaponTypes.find(t => t.name === selectedWeapon?.type);
                                        setItemForm(p => ({
                                            ...p,
                                            weaponId: e.target.value,
                                            weaponName: selectedWeapon?.name ?? "",
                                            weaponType: selectedWeapon?.type ?? p.weaponType,
                                            weaponTypeId: selectedType?.id ?? p.weaponTypeId,
                                        }));
                                    }}
                                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm"
                                >
                                    <option value="">Выберите оружие</option>
                                    {weapons.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground">Тип оружия</Label>
                                <select
                                    value={itemForm.weaponTypeId}
                                    onChange={e => {
                                        const selectedType = weaponTypes.find(t => t.id === e.target.value);
                                        setItemForm(p => ({ ...p, weaponTypeId: e.target.value, weaponType: selectedType?.name ?? "" }));
                                    }}
                                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm"
                                >
                                    <option value="">Выберите тип оружия</option>
                                    {weaponTypes.map(wt => <option key={wt.id} value={wt.id}>{wt.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground">Редкость</Label>
                                {rarities.length > 0 ? (
                                    <select
                                        value={itemForm.rarityName}
                                        onChange={e => {
                                            const sel = rarities.find(r => r.name === e.target.value);
                                            setItemForm(p => ({ ...p, rarityName: sel?.name ?? e.target.value, rarityColor: sel?.color ?? p.rarityColor }));
                                        }}
                                        className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm"
                                    >
                                        <option value="">Выберите редкость</option>
                                        {rarities.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    </select>
                                ) : (
                                    <Input value={itemForm.rarityName} onChange={e => setItemForm(p => ({ ...p, rarityName: e.target.value }))} className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-foreground">Цвет редкости</Label>
                                <div className="flex gap-2">
                                    <Input value={itemForm.rarityColor} onChange={e => setItemForm(p => ({ ...p, rarityColor: e.target.value }))} className="rounded-xl border-border/60 bg-background/50 text-foreground flex-1" />
                                    <input type="color" value={itemForm.rarityColor || "#ffffff"} onChange={e => setItemForm(p => ({ ...p, rarityColor: e.target.value }))} className="w-10 h-10 rounded-xl border border-border/60 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-foreground">Изображение</Label>
                            <div className="flex items-center gap-3">
                                {itemForm.imgUrl ? (
                                    <img src={itemForm.imgUrl} alt="item" className="w-16 h-16 rounded-xl object-cover border border-border/60" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-background/50 border border-border/60 flex items-center justify-center"><Image className="h-6 w-6 text-muted-foreground" /></div>
                                )}
                                <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-background/50 text-sm text-muted-foreground hover:text-foreground hover:border-orange-500/30 cursor-pointer transition-all">
                                    {itemUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    {itemUploading ? "Загрузка..." : "Загрузить"}
                                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleItemImageUpload} className="hidden" disabled={itemUploading} />
                                </label>
                                {itemForm.imgUrl && <button onClick={() => setItemForm(p => ({ ...p, imgUrl: "" }))} className="text-xs text-red-400 hover:text-red-300 transition-colors">Удалить</button>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditItemOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleEditItem} disabled={!itemForm.name || !itemForm.price || !itemForm.weaponName || !itemForm.weaponType || mutating} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50">
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />} Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  DELETE ITEM CONFIRMATION  ════════════ */}
            <Dialog open={deleteItemOpen} onOpenChange={setDeleteItemOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400"><Trash2 className="h-5 w-5" /> Удалить предмет?</DialogTitle>
                        <DialogDescription>
                            Предмет <span className="font-semibold text-foreground">{targetItem?.name}</span> будет удалён безвозвратно.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteItemOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleDeleteItem} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
                            <Trash2 className="h-4 w-4 mr-1" /> Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  ADD RARITY DIALOG  ════════════ */}
            <Dialog open={addRarityOpen} onOpenChange={setAddRarityOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-orange-500" /> Новая редкость</DialogTitle>
                        <DialogDescription>Задайте название и цвет</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm text-foreground">Название</Label>
                            <Input value={rarityForm.name} onChange={e => setRarityForm(p => ({ ...p, name: e.target.value }))} placeholder="legendary" className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-foreground">Цвет</Label>
                            <div className="flex gap-2">
                                <Input value={rarityForm.color} onChange={e => setRarityForm(p => ({ ...p, color: e.target.value }))} placeholder="#ff9900" className="rounded-xl border-border/60 bg-background/50 text-foreground flex-1" />
                                <input type="color" value={rarityForm.color || "#ffffff"} onChange={e => setRarityForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded-xl border border-border/60 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddRarityOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleAddRarity} disabled={!rarityForm.name || !rarityForm.color || mutating} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50">
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Создать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  EDIT RARITY DIALOG  ════════════ */}
            <Dialog open={editRarityOpen} onOpenChange={setEditRarityOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-orange-500" /> Редактировать редкость</DialogTitle>
                        <DialogDescription>Измените параметры редкости</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm text-foreground">Название</Label>
                            <Input value={rarityForm.name} onChange={e => setRarityForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-foreground">Цвет</Label>
                            <div className="flex gap-2">
                                <Input value={rarityForm.color} onChange={e => setRarityForm(p => ({ ...p, color: e.target.value }))} className="rounded-xl border-border/60 bg-background/50 text-foreground flex-1" />
                                <input type="color" value={rarityForm.color || "#ffffff"} onChange={e => setRarityForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded-xl border border-border/60 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditRarityOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleEditRarity} disabled={!rarityForm.name || !rarityForm.color || mutating} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50">
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />} Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  ADD TAG DIALOG  ════════════ */}
            <Dialog open={addTagOpen} onOpenChange={setAddTagOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-orange-500" /> Новый тег</DialogTitle>
                        <DialogDescription>Введите название тега для кейсов</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label className="text-sm text-foreground">Название</Label>
                        <Input value={tagForm.name} onChange={e => setTagForm({ name: e.target.value })} placeholder="Прайм" className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddTagOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleAddTag} disabled={!tagForm.name.trim() || mutating} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50">
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Создать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  EDIT TAG DIALOG  ════════════ */}
            <Dialog open={editTagOpen} onOpenChange={setEditTagOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-orange-500" /> Редактировать тег</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label className="text-sm text-foreground">Название</Label>
                        <Input value={tagForm.name} onChange={e => setTagForm({ name: e.target.value })} className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTagOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleEditTag} disabled={!tagForm.name.trim() || mutating} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50">
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />} Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  DELETE TAG DIALOG  ════════════ */}
            <Dialog open={deleteTagOpen} onOpenChange={setDeleteTagOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400"><Trash2 className="h-5 w-5" /> Удалить тег?</DialogTitle>
                        <DialogDescription>
                            Тег <span className="font-semibold text-foreground">{targetTag?.name}</span> будет удалён. У связанных кейсов тег очистится.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTagOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleDeleteTag} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
                            <Trash2 className="h-4 w-4 mr-1" /> Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  DELETE RARITY CONFIRMATION  ════════════ */}
            <Dialog open={deleteRarityOpen} onOpenChange={setDeleteRarityOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400"><Trash2 className="h-5 w-5" /> Удалить редкость?</DialogTitle>
                        <DialogDescription>
                            Редкость <span className="font-semibold text-foreground">{targetRarity?.name}</span> будет удалена безвозвратно.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteRarityOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleDeleteRarity} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
                            <Trash2 className="h-4 w-4 mr-1" /> Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  ADD WEAPON TYPE DIALOG  ════════════ */}
            <Dialog open={addWeaponTypeOpen} onOpenChange={setAddWeaponTypeOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-orange-500" /> Новый тип оружия</DialogTitle>
                        <DialogDescription>Введите название типа оружия</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label className="text-sm text-foreground">Название</Label>
                        <Input value={weaponTypeForm.name} onChange={e => setWeaponTypeForm({ name: e.target.value })} placeholder="rifle" className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddWeaponTypeOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleAddWeaponType} disabled={!weaponTypeForm.name || mutating} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50">
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Создать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  EDIT WEAPON TYPE DIALOG  ════════════ */}
            <Dialog open={editWeaponTypeOpen} onOpenChange={setEditWeaponTypeOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-orange-500" /> Редактировать тип оружия</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label className="text-sm text-foreground">Название</Label>
                        <Input value={weaponTypeForm.name} onChange={e => setWeaponTypeForm({ name: e.target.value })} className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditWeaponTypeOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleEditWeaponType} disabled={!weaponTypeForm.name || mutating} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50">
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />} Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  DELETE WEAPON TYPE DIALOG  ════════════ */}
            <Dialog open={deleteWeaponTypeOpen} onOpenChange={setDeleteWeaponTypeOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400"><Trash2 className="h-5 w-5" /> Удалить тип оружия?</DialogTitle>
                        <DialogDescription>
                            Тип <span className="font-semibold text-foreground">{targetWeaponType?.name}</span> будет удалён безвозвратно.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteWeaponTypeOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleDeleteWeaponType} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
                            <Trash2 className="h-4 w-4 mr-1" /> Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  ADD WEAPON DIALOG  ════════════ */}
            <Dialog open={addWeaponOpen} onOpenChange={setAddWeaponOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-orange-500" /> Новое оружие</DialogTitle>
                        <DialogDescription>Введите название оружия и выберите тип</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm text-foreground">Название</Label>
                            <Input value={weaponForm.name} onChange={e => setWeaponForm(p => ({ ...p, name: e.target.value }))} placeholder="AK-47" className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-foreground">Тип оружия</Label>
                            <select
                                value={weaponForm.typeId}
                                onChange={e => {
                                    const selectedType = weaponTypes.find(t => t.id === e.target.value);
                                    setWeaponForm(p => ({ ...p, typeId: e.target.value, typeName: selectedType?.name ?? "" }));
                                }}
                                className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm"
                            >
                                <option value="">Выберите тип</option>
                                {weaponTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddWeaponOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleAddWeapon} disabled={!weaponForm.name || !weaponForm.typeName || mutating} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50">
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Создать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  EDIT WEAPON DIALOG  ════════════ */}
            <Dialog open={editWeaponOpen} onOpenChange={setEditWeaponOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-orange-500" /> Редактировать оружие</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm text-foreground">Название</Label>
                            <Input value={weaponForm.name} onChange={e => setWeaponForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl border-border/60 bg-background/50 text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-foreground">Тип оружия</Label>
                            <select
                                value={weaponForm.typeId}
                                onChange={e => {
                                    const selectedType = weaponTypes.find(t => t.id === e.target.value);
                                    setWeaponForm(p => ({ ...p, typeId: e.target.value, typeName: selectedType?.name ?? "" }));
                                }}
                                className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm"
                            >
                                <option value="">Выберите тип</option>
                                {weaponTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditWeaponOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleEditWeapon} disabled={!weaponForm.name || !weaponForm.typeName || mutating} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-50">
                            {mutating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />} Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════════  DELETE WEAPON DIALOG  ════════════ */}
            <Dialog open={deleteWeaponOpen} onOpenChange={setDeleteWeaponOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400"><Trash2 className="h-5 w-5" /> Удалить оружие?</DialogTitle>
                        <DialogDescription>
                            Оружие <span className="font-semibold text-foreground">{targetWeapon?.name}</span> будет удалено безвозвратно.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteWeaponOpen(false)} className="rounded-xl">Отмена</Button>
                        <Button onClick={handleDeleteWeapon} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
                            <Trash2 className="h-4 w-4 mr-1" /> Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
