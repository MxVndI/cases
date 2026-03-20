import argparse
import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from models.case import Case
from models.item import Item
from models.item import Rarity as EmbeddedRarity
from models.item import Weapon as EmbeddedWeapon
from services.case import CaseService
from services.db import connect_db

CASES_TO_SEED = [
    {"name": "Галерейный кейс",                   "img_url": "./csgo_images/case/case_001.png"},
    {"name": "Кейс «Киловатт»",                   "img_url": "./csgo_images/case/case_002.png"},
    {"name": "Кейс «Грёзы и кошмары»",            "img_url": "./csgo_images/case/case_003.png"},
    {"name": "Кейс операции «Хищные воды»",       "img_url": "./csgo_images/case/case_004.png"},
    {"name": "Кейс «Змеиный укус»",               "img_url": "./csgo_images/case/case_005.png"},
    {"name": "Кейс операции «Сломанный клык»",    "img_url": "./csgo_images/case/case_006.png"},
    {"name": "Кейс «Разлом»",                     "img_url": "./csgo_images/case/case_007.png"},
    {"name": "Кейс «Расколотая сеть»",            "img_url": "./csgo_images/case/case_008.png"},
    {"name": "Кейс «Призма»",                     "img_url": "./csgo_images/case/case_009.png"},
    {"name": "Кейс «Запретная зона»",             "img_url": "./csgo_images/case/case_010.png"},
]

# Rarity color mapping (name -> hex color)
RARITY_COLORS = {
    "Ширпотреб":    "#b0c3d9",
    "Промышленное": "#5e98d9",
    "Армейское":    "#4b69ff",
    "Запрещенное":  "#8847ff",
    "Засекреченное":"#d32ce6",
    "Тайное":       "#eb4b4b",
    "Экстраординарное": "#e4ae39",
}
DEFAULT_RARITY_COLOR = "#b0c3d9"

ITEMS_TO_SEED = [
    {"type": "Нож",               "rarity": "Тайное",       "name": "Кукри | Кровавая паутина",       "img_url": "./csgo_images/weapons/weapon_001.png"},
    {"type": "Винтовки",          "rarity": "Тайное",       "name": "AK-47 | Пожелание на ночь",      "img_url": "./csgo_images/weapons/weapon_002.png"},
    {"type": "Пистолет",          "rarity": "Засекреченное","name": "Glock-18 | Сумеречная галактика", "img_url": "./csgo_images/weapons/weapon_003.png"},
    {"type": "Нож",               "rarity": "Тайное",       "name": "Штык-нож | Легенды",             "img_url": "./csgo_images/weapons/weapon_004.png"},
    {"type": "Дробовик",          "rarity": "Армейское",    "name": "Nova | Буря",                    "img_url": "./csgo_images/weapons/weapon_005.png"},
    {"type": "Пулемет",           "rarity": "Ширпотреб",    "name": "M249 | Контрастные цвета",       "img_url": "./csgo_images/weapons/weapon_006.png"},
    {"type": "Дробовик",          "rarity": "Армейское",    "name": "MAG-7 | Антитерраса",            "img_url": "./csgo_images/weapons/weapon_007.png"},
    {"type": "Нож",               "rarity": "Тайное",       "name": "Стилет | Зуб тигра",             "img_url": "./csgo_images/weapons/weapon_008.png"},
    {"type": "Пистолет",          "rarity": "Тайное",       "name": "P2000 | Дух огня",               "img_url": "./csgo_images/weapons/weapon_009.png"},
    {"type": "Винтовка",          "rarity": "Запрещенное",  "name": "FAMAS | Пульс",                  "img_url": "./csgo_images/weapons/weapon_010.png"},
    {"type": "Пистолет-пулемет",  "rarity": "Армейское",    "name": "MP9 | Закат",                    "img_url": "./csgo_images/weapons/weapon_011.png"},
    {"type": "Нож",               "rarity": "Тайное",       "name": "Нож-бабочка | Автотроника",      "img_url": "./csgo_images/weapons/weapon_012.png"},
    {"type": "Пистолет",          "rarity": "Промышленное", "name": "Desert Eagle | Ночная буря",     "img_url": "./csgo_images/weapons/weapon_013.png"},
    {"type": "Пистолет-пулемет",  "rarity": "Запрещенное",  "name": "MP9 | Гипноз",                   "img_url": "./csgo_images/weapons/weapon_014.png"},
    {"type": "Пистолет-пулемет",  "rarity": "Армейское",    "name": "PP-Bizon | Жнец",                "img_url": "./csgo_images/weapons/weapon_015.png"},
    {"type": "Нож",               "rarity": "Тайное",       "name": "Нож «Бродяга» | Вороненая сталь","img_url": "./csgo_images/weapons/weapon_016.png"},
    {"type": "Пистолет",          "rarity": "Ширпотреб",    "name": "CZ75-Auto | Фреймворк",          "img_url": "./csgo_images/weapons/weapon_017.png"},
    {"type": "Винтовка",          "rarity": "Засекреченное","name": "Galil AR | Эко",                  "img_url": "./csgo_images/weapons/weapon_018.png"},
    {"type": "Пулемет",           "rarity": "Засекреченное","name": "Negev | Мьёльнир",               "img_url": "./csgo_images/weapons/weapon_019.png"},
    {"type": "Винтовка",          "rarity": "Ширпотреб",    "name": "SCAR-20 | Гроза",                "img_url": "./csgo_images/weapons/weapon_020.png"},
    {"type": "Дробовик",          "rarity": "Ширпотреб",    "name": "Sawed-Off | Тень бамбука",       "img_url": "./csgo_images/weapons/weapon_021.png"},
    {"type": "Пистолет-пулемет",  "rarity": "Армейское",    "name": "UMP-45 | Осциллятор",            "img_url": "./csgo_images/weapons/weapon_022.png"},
    {"type": "Пистолет",          "rarity": "Армейское",    "name": "Револьвер R8 | Автосвалка",      "img_url": "./csgo_images/weapons/weapon_023.png"},
    {"type": "Нож",               "rarity": "Тайное",       "name": "Коготь | Волны Рубин",           "img_url": "./csgo_images/weapons/weapon_024.png"},
    {"type": "Винтовка",          "rarity": "Ширпотреб",    "name": "SSG 08 | Параллакс",             "img_url": "./csgo_images/weapons/weapon_025.png"},
]


async def seed_cases(dry_run: bool) -> tuple[int, int]:
    inserted = 0
    skipped = 0

    for entry in CASES_TO_SEED:
        name = entry["name"]
        img_url = entry["img_url"]
        system_name = CaseService._transliterate(name)

        existing = await Case.find_one({"$or": [{"name": name}, {"system_name": system_name}]})
        if existing:
            print(f"[CASE SKIP]   '{name}' already exists (id={existing.id})")
            skipped += 1
            continue

        print(f"[CASE INSERT] '{name}' -> system_name='{system_name}'")
        if not dry_run:
            await Case(name=name, img_url=img_url, system_name=system_name).insert()
        inserted += 1

    return inserted, skipped


async def seed_items(dry_run: bool) -> tuple[int, int]:
    inserted = 0
    skipped = 0

    for entry in ITEMS_TO_SEED:
        name = entry["name"]
        weapon_type = entry["type"]
        rarity_name = entry["rarity"] or "Ширпотреб"
        img_url = entry["img_url"]
        rarity_color = RARITY_COLORS.get(rarity_name, DEFAULT_RARITY_COLOR)

        existing = await Item.find_one({"name": name})
        if existing:
            print(f"[ITEM SKIP]   '{name}' already exists (id={existing.id})")
            skipped += 1
            continue

        print(f"[ITEM INSERT] '{name}' | {weapon_type} | {rarity_name}")
        if not dry_run:
            item = Item(
                name=name,
                img_url=img_url,
                price=0.0,
                weapon=EmbeddedWeapon(name=name.split("|")[0].strip(), type=weapon_type),
                rarity=EmbeddedRarity(name=rarity_name, color=rarity_color),
            )
            await item.insert()
        inserted += 1

    return inserted, skipped


async def seed(dry_run: bool) -> None:
    await connect_db()

    print("=== Seeding cases ===")
    c_ins, c_skip = await seed_cases(dry_run)
    print(f"Cases:  {c_ins} inserted, {c_skip} skipped.\n")

    print("=== Seeding items ===")
    i_ins, i_skip = await seed_items(dry_run)
    print(f"Items:  {i_ins} inserted, {i_skip} skipped.\n")

    if dry_run:
        print("Dry run only — no documents were written.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed cases and items into the database")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be inserted without writing")
    args = parser.parse_args()
    asyncio.run(seed(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
