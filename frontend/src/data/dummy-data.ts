export interface CaseItem {
    id: string;
    name: string;
    rarity: "common" | "rare" | "epic" | "legendary" | "exotic";
    image?: string;
    price: number;
}

export interface Case {
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
    items: CaseItem[];
    category: string;
}

export interface SpinHistory {
    id: string;
    caseId: string;
    caseName: string;
    wonItem: CaseItem;
    spinDate: string;
    cost: number;
}

export interface Balance {
    hubCoins: number;
}

// Dummy data
export const dummyCases: Case[] = [
    {
        id: "5",
        name: "Кейс: AK-47",
        description: "Коллекция культовых и редких скинов для AK-47",
        image: "/cases/weapon-case.png",
        price: 130,
        category: "Оружие",
        items: [
            { id: "5-1", name: "AK-47 | Wild Lotus", rarity: "exotic", price: 14500 },
            { id: "5-2", name: "AK-47 | Fire Serpent", rarity: "legendary", price: 7600 },
            { id: "5-3", name: "AK-47 | Neon Rider", rarity: "legendary", price: 2800 },
            { id: "5-4", name: "AK-47 | Bloodsport", rarity: "epic", price: 1250 },
            { id: "5-5", name: "AK-47 | Redline", rarity: "rare", price: 350 },
            { id: "5-6", name: "AK-47 | Elite Build", rarity: "common", price: 50 },
        ],
    },
    {
        id: "6",
        name: "Кейс: AWP",
        description: "Собрание лучших и легендарных скинов для AWP",
        image: "/cases/skins-case.png",
        price: 160,
        category: "Оружие",
        items: [
            { id: "6-1", name: "AWP | Dragon Lore", rarity: "exotic", price: 22000 },
            { id: "6-2", name: "AWP | Gungnir", rarity: "exotic", price: 18500 },
            { id: "6-3", name: "AWP | Asiimov", rarity: "legendary", price: 4500 },
            { id: "6-4", name: "AWP | Hyper Beast", rarity: "epic", price: 980 },
            { id: "6-5", name: "AWP | Neo-Noir", rarity: "rare", price: 320 },
            { id: "6-6", name: "AWP | Atheris", rarity: "common", price: 65 },
        ],
    },
    {
        id: "1",
        name: "Кейс: M4A4",
        description: "Подборка скинов и редких вариантов для M4A4",
        image: "/cases/weapon-case.png",
        price: 120,
        category: "Оружие",
        items: [
            { id: "1-1", name: "M4A4 | Howl", rarity: "exotic", price: 15000 },
            { id: "1-2", name: "M4A4 | Asiimov", rarity: "legendary", price: 4100 },
            { id: "1-3", name: "M4A4 | Howl", rarity: "exotic", price: 15000 },
            { id: "1-4", name: "M4A4 | Neo-Noir", rarity: "epic", price: 1250 },
            { id: "1-5", name: "M4A4 | The Emperor", rarity: "epic", price: 980 },
            { id: "1-6", name: "M4A4 | Desolate Space", rarity: "rare", price: 340 },
            { id: "1-7", name: "M4A4 | Magnesium", rarity: "common", price: 24 },
        ],
    },
    {
        id: "4",
        name: "Кейс: M4A1-S",
        description: "Лучшие скины и редкости для M4A1-S",
        image: "/cases/skins-case.png",
        price: 140,
        category: "Оружие",
        items: [
            { id: "4-2", name: "M4A1-S | Printstream", rarity: "legendary", price: 3500 },
            { id: "4-1", name: "M4A1-S | Welcome to the Jungle", rarity: "exotic", price: 13200 },
            { id: "4-3", name: "M4A1-S | Player Two", rarity: "epic", price: 970 },
            { id: "4-4", name: "M4A1-S | Hyper Beast", rarity: "epic", price: 840 },
            { id: "4-5", name: "M4A1-S | Nightmare", rarity: "rare", price: 180 },
            { id: "4-6", name: "M4A1-S | Night Terror", rarity: "common", price: 40 },
        ],
    },
    {
        id: "2",
        name: "Кейс: Перчатки",
        description: "Эксклюзивные перчатки для ваших персонажей",
        image: "/cases/gloves-case.png",
        price: 250,
        category: "Перчатки",
        items: [
            { id: "2-1", name: "Sport Gloves | Pandora", rarity: "exotic", price: 8500 },
            { id: "2-2", name: "Driver Gloves | King Snake", rarity: "legendary", price: 3200 },
            { id: "2-3", name: "Hand Wraps | Cobalt Skulls", rarity: "epic", price: 1100 },
            { id: "2-4", name: "Moto Gloves | Boom!", rarity: "epic", price: 950 },
            { id: "2-5", name: "Specialist Gloves | Crimson", rarity: "legendary", price: 4800 },
        ],
    },
    {
        id: "3",
        name: "Кейс: Ножи",
        description: "Редкие ножи для коллекционеров",
        image: "/cases/knife-case.png",
        price: 500,
        category: "Ножи",
        items: [
            { id: "3-1", name: "Karambit | Doppler", rarity: "exotic", price: 12000 },
            { id: "3-2", name: "M9 Bayonet | Fade", rarity: "exotic", price: 18000 },
            { id: "3-3", name: "Butterfly Knife | Tiger Tooth", rarity: "legendary", price: 7500 },
            { id: "3-4", name: "Huntsman Knife | Safari", rarity: "epic", price: 450 },
            { id: "3-5", name: "Flip Knife | Marble Fade", rarity: "legendary", price: 5200 },
            { id: "3-6", name: "Gut Knife | Autotronic", rarity: "rare", price: 180 },
        ],
    },
    {
        id: "7",
        name: "Кейс: Агенты",
        description: "Уникальные агенты с разной редкостью и стилем",
        image: "/cases/skins-case.png",
        price: 180,
        category: "Агенты",
        items: [
            { id: "7-1", name: "Sir Bloody Darryl", rarity: "legendary", price: 4200 },
            { id: "7-2", name: "Number K", rarity: "epic", price: 1400 },
            { id: "7-3", name: "Rezan The Ready", rarity: "epic", price: 1250 },
            { id: "7-4", name: "Michael Syfers", rarity: "rare", price: 380 },
            { id: "7-5", name: "Enforcer", rarity: "common", price: 90 },
        ],
    },
    {
        id: "8",
        name: "Кейс: Наклейки",
        description: "Яркие наклейки для кастомизации оружия",
        image: "/cases/weapon-case.png",
        price: 90,
        category: "Наклейки",
        items: [
            { id: "8-1", name: "Sticker | Crown (Foil)", rarity: "exotic", price: 9800 },
            { id: "8-2", name: "Sticker | Titan (Holo)", rarity: "legendary", price: 6300 },
            { id: "8-3", name: "Sticker | Howling Dawn", rarity: "legendary", price: 5200 },
            { id: "8-4", name: "Sticker | Battle Scarred", rarity: "epic", price: 850 },
            { id: "8-5", name: "Sticker | Dragon", rarity: "rare", price: 260 },
            { id: "8-6", name: "Sticker | Smiley", rarity: "common", price: 45 },
        ],
    },
];

export const dummySpinHistory: SpinHistory[] = [
    {
        id: "h1",
        caseId: "1",
        caseName: "Кейс: M4A4",
        wonItem: { id: "1-4", name: "Glock-18 | Fade", rarity: "epic", price: 800 },
        spinDate: "2026-03-01T14:30:00",
        cost: 100,
    },
    {
        id: "h2",
        caseId: "3",
        caseName: "Кейс: Ножи",
        wonItem: { id: "3-6", name: "Gut Knife | Autotronic", rarity: "rare", price: 180 },
        spinDate: "2026-02-28T10:15:00",
        cost: 500,
    },
    {
        id: "h3",
        caseId: "2",
        caseName: "Кейс: Перчатки",
        wonItem: { id: "2-3", name: "Hand Wraps | Cobalt Skulls", rarity: "epic", price: 1100 },
        spinDate: "2026-02-27T18:45:00",
        cost: 250,
    },
    {
        id: "h4",
        caseId: "1",
        caseName: "Кейс: M4A4",
        wonItem: { id: "1-7", name: "P250 | Sand Dune", rarity: "common", price: 10 },
        spinDate: "2026-02-26T09:00:00",
        cost: 100,
    },
];

export const dummyBalance: Balance = {
    hubCoins: 2450,
};

export const rarityColors = {
    common: "text-gray-400 border-gray-400 bg-gray-400/10",
    rare: "text-blue-400 border-blue-400 bg-blue-400/10",
    epic: "text-purple-400 border-purple-400 bg-purple-400/10",
    legendary: "text-orange-400 border-orange-400 bg-orange-400/10",
    exotic: "text-red-500 border-red-500 bg-red-500/10",
};

export const rarityLabels = {
    common: "Обычное",
    rare: "Редкое",
    epic: "Эпическое",
    legendary: "Легендарное",
    exotic: "Экзотическое",
};

// --- Inventory ---
export interface InventoryItem {
    id: string;
    name: string;
    rarity: "common" | "rare" | "epic" | "legendary" | "exotic";
    price: number;
    wonFrom: string;
    wonDate: string;
}

export const dummyInventory: InventoryItem[] = [
    { id: "inv-1", name: "AK-47 | Redline", rarity: "rare", price: 350, wonFrom: "Кейс: AK-47", wonDate: "2026-03-01" },
    { id: "inv-2", name: "Hand Wraps | Cobalt Skulls", rarity: "epic", price: 1100, wonFrom: "Кейс: Перчатки", wonDate: "2026-02-27" },
    { id: "inv-3", name: "M4A4 | Neo-Noir", rarity: "epic", price: 1250, wonFrom: "Кейс: M4A4", wonDate: "2026-02-20" },
    { id: "inv-4", name: "Glock-18 | Fade", rarity: "epic", price: 800, wonFrom: "Кейс: M4A4", wonDate: "2026-02-15" },
    { id: "inv-5", name: "P250 | Sand Dune", rarity: "common", price: 10, wonFrom: "Кейс: M4A4", wonDate: "2026-02-10" },
    { id: "inv-6", name: "AWP | Asiimov", rarity: "legendary", price: 4500, wonFrom: "Кейс: AWP", wonDate: "2026-01-28" },
];

// --- Users for admin ---
export interface DummyUser {
    id: string;
    nickname: string;
    email: string;
    status: "active" | "blocked";
    role: "user" | "admin";
    balance: number;
    registeredAt: string;
    lastLoginAt: string;
}

export const dummyUsers: DummyUser[] = [
    { id: "1", nickname: "CaseKing", email: "caseking@mail.ru", status: "active", role: "user", balance: 2450, registeredAt: "2026-01-15", lastLoginAt: "2026-03-03T10:25:00" },
    { id: "2", nickname: "Admin", email: "admin@casehub.ru", status: "active", role: "admin", balance: 99999, registeredAt: "2025-12-01", lastLoginAt: "2026-03-03T09:00:00" },
    { id: "3", nickname: "LuckyShot", email: "lucky@gmail.com", status: "active", role: "user", balance: 780, registeredAt: "2026-02-01", lastLoginAt: "2026-03-02T22:10:00" },
    { id: "4", nickname: "ProGamer", email: "pro@yandex.ru", status: "active", role: "user", balance: 5200, registeredAt: "2026-01-20", lastLoginAt: "2026-03-01T16:45:00" },
    { id: "5", nickname: "NovicePlayer", email: "novice@mail.ru", status: "blocked", role: "user", balance: 0, registeredAt: "2026-02-15", lastLoginAt: "2026-02-20T12:00:00" },
    { id: "6", nickname: "CS2Fan", email: "cs2fan@gmail.com", status: "active", role: "user", balance: 1500, registeredAt: "2026-02-10", lastLoginAt: "2026-03-03T08:30:00" },
    { id: "7", nickname: "SkinCollector", email: "collector@mail.ru", status: "active", role: "user", balance: 8900, registeredAt: "2026-01-05", lastLoginAt: "2026-03-02T19:55:00" },
    { id: "8", nickname: "CaseLover", email: "lover@yandex.ru", status: "active", role: "user", balance: 320, registeredAt: "2026-02-20", lastLoginAt: "2026-02-28T14:20:00" },
];

// --- Recent wins (for main page conveyor) ---
export interface RecentWin {
    userId: string;
    player: string;
    item: string;
    caseName: string;
    rarity: "common" | "rare" | "epic" | "legendary" | "exotic";
    price: number;
}

export const dummyRecentWins: RecentWin[] = [
    { userId: "1", player: "CaseKing", item: "AK-47 | Neon Rider", caseName: "Кейс: AK-47", rarity: "legendary", price: 2800 },
    { userId: "3", player: "LuckyShot", item: "M4A1-S | Printstream", caseName: "Кейс: M4A1-S", rarity: "legendary", price: 3500 },
    { userId: "4", player: "ProGamer", item: "AWP | Dragon Lore", caseName: "Кейс: AWP", rarity: "exotic", price: 22000 },
    { userId: "6", player: "CS2Fan", item: "Karambit | Doppler", caseName: "Кейс: Ножи", rarity: "exotic", price: 12000 },
    { userId: "7", player: "SkinCollector", item: "Sport Gloves | Pandora", caseName: "Кейс: Перчатки", rarity: "exotic", price: 8500 },
    { userId: "8", player: "CaseLover", item: "Sticker | Crown (Foil)", caseName: "Кейс: Наклейки", rarity: "exotic", price: 9800 },
    { userId: "1", player: "CaseKing", item: "USP-S | Flow", caseName: "Кейс: M4A1-S", rarity: "rare", price: 180 },
    { userId: "3", player: "LuckyShot", item: "Desert Eagle | Gold", caseName: "Кейс: AK-47", rarity: "epic", price: 1250 },
];
