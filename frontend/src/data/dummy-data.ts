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
        id: "1",
        name: "Оружейный кейс",
        description: "Кейс с различным оружием от пистолетов до винтовок",
        image: "/cases/weapon-case.png",
        price: 100,
        category: "Оружие",
        items: [
            { id: "1-1", name: "AK-47 | Redline", rarity: "legendary", price: 2500 },
            { id: "1-2", name: "AWP | Asiimov", rarity: "legendary", price: 4500 },
            { id: "1-3", name: "M4A4 | Howl", rarity: "exotic", price: 15000 },
            { id: "1-4", name: "Glock-18 | Fade", rarity: "epic", price: 800 },
            { id: "1-5", name: "USP-S | Kill Confirmed", rarity: "epic", price: 650 },
            { id: "1-6", name: "Deagle | Blaze", rarity: "rare", price: 350 },
            { id: "1-7", name: "P250 | Sand Dune", rarity: "common", price: 10 },
        ],
    },
    {
        id: "2",
        name: "Кейс перчаток",
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
        name: "Ножной кейс",
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
        id: "4",
        name: "Кейс скинов",
        description: "Разнообразные скины для вашего арсенала",
        image: "/cases/skins-case.png",
        price: 150,
        category: "Скины",
        items: [
            { id: "4-1", name: "AK-47 | Neon Rider", rarity: "legendary", price: 2800 },
            { id: "4-2", name: "M4A1-S | Printstream", rarity: "legendary", price: 3500 },
            { id: "4-3", name: "UMP-45 | Primal Saber", rarity: "epic", price: 420 },
            { id: "4-4", name: "FAMAS | Commemoration", rarity: "epic", price: 380 },
            { id: "4-5", name: "SSG 08 | Dragon Fire", rarity: "rare", price: 120 },
            { id: "4-6", name: "MP9 | Bioleak", rarity: "rare", price: 95 },
        ],
    },
];

export const dummySpinHistory: SpinHistory[] = [
    {
        id: "h1",
        caseId: "1",
        caseName: "Оружейный кейс",
        wonItem: { id: "1-4", name: "Glock-18 | Fade", rarity: "epic", price: 800 },
        spinDate: "2026-03-01T14:30:00",
        cost: 100,
    },
    {
        id: "h2",
        caseId: "3",
        caseName: "Ножной кейс",
        wonItem: { id: "3-6", name: "Gut Knife | Autotronic", rarity: "rare", price: 180 },
        spinDate: "2026-02-28T10:15:00",
        cost: 500,
    },
    {
        id: "h3",
        caseId: "2",
        caseName: "Кейс перчаток",
        wonItem: { id: "2-3", name: "Hand Wraps | Cobalt Skulls", rarity: "epic", price: 1100 },
        spinDate: "2026-02-27T18:45:00",
        cost: 250,
    },
    {
        id: "h4",
        caseId: "1",
        caseName: "Оружейный кейс",
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
