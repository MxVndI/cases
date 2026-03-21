// Seed script for mongosh
// Usage:
//   docker cp backend/cases/scripts/seed.js mongodb-ch:/tmp/seed.js
//   docker exec mongodb-ch mongosh cases_db /tmp/seed.js

const db = db.getSiblingDB('cases_db');

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const now = new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// WEAPON TYPES
// ─────────────────────────────────────────────────────────────────────────────
const weaponTypes = [
  'Нож', 'Винтовки', 'Винтовка', 'Пистолет', 'Дробовик', 'Пулемет', 'Пистолет-пулемет',
];

let wtIns = 0, wtSkip = 0;
for (const typeName of weaponTypes) {
  const r = db.WeaponType.updateOne(
    { name: typeName },
    { $setOnInsert: { _id: uuidv4(), name: typeName, created_at: now } },
    { upsert: true }
  );
  if (r.upsertedCount > 0) { print('[WTYPE INSERT] ' + typeName); wtIns++; }
  else                      { print('[WTYPE SKIP]   ' + typeName); wtSkip++; }
}
print('WeaponTypes: ' + wtIns + ' inserted, ' + wtSkip + ' skipped.\n');

// ─────────────────────────────────────────────────────────────────────────────
// WEAPONS
// ─────────────────────────────────────────────────────────────────────────────
// Unique weapon name + type pairs derived from items
const weapons = [
  { name: 'Кукри',           type: 'Нож' },
  { name: 'AK-47',           type: 'Винтовки' },
  { name: 'Glock-18',        type: 'Пистолет' },
  { name: 'Штык-нож',        type: 'Нож' },
  { name: 'Nova',            type: 'Дробовик' },
  { name: 'M249',            type: 'Пулемет' },
  { name: 'MAG-7',           type: 'Дробовик' },
  { name: 'Стилет',          type: 'Нож' },
  { name: 'P2000',           type: 'Пистолет' },
  { name: 'FAMAS',           type: 'Винтовка' },
  { name: 'MP9',             type: 'Пистолет-пулемет' },
  { name: 'Нож-бабочка',     type: 'Нож' },
  { name: 'Desert Eagle',    type: 'Пистолет' },
  { name: 'PP-Bizon',        type: 'Пистолет-пулемет' },
  { name: 'Нож «Бродяга»',   type: 'Нож' },
  { name: 'CZ75-Auto',       type: 'Пистолет' },
  { name: 'Galil AR',        type: 'Винтовка' },
  { name: 'Negev',           type: 'Пулемет' },
  { name: 'SCAR-20',         type: 'Винтовка' },
  { name: 'Sawed-Off',       type: 'Дробовик' },
  { name: 'UMP-45',          type: 'Пистолет-пулемет' },
  { name: 'Револьвер R8',    type: 'Пистолет' },
  { name: 'Коготь',          type: 'Нож' },
  { name: 'SSG 08',          type: 'Винтовка' },
];

let wIns = 0, wSkip = 0;
for (const w of weapons) {
  const r = db.Weapon.updateOne(
    { name: w.name, type: w.type },
    { $setOnInsert: { _id: uuidv4(), name: w.name, type: w.type, created_at: now } },
    { upsert: true }
  );
  if (r.upsertedCount > 0) { print('[WEAPON INSERT] ' + w.name + ' (' + w.type + ')'); wIns++; }
  else                      { print('[WEAPON SKIP]   ' + w.name); wSkip++; }
}
print('Weapons: ' + wIns + ' inserted, ' + wSkip + ' skipped.\n');

// ─────────────────────────────────────────────────────────────────────────────
// CASES
// ─────────────────────────────────────────────────────────────────────────────
const cases = [
  { name: 'Галерейный кейс',                system_name: 'galereynyy_keys',                img_url: './csgo_images/case/case_001.png' },
  { name: 'Кейс «Киловатт»',                system_name: 'keys_kilovatt',                  img_url: './csgo_images/case/case_002.png' },
  { name: 'Кейс «Грёзы и кошмары»',         system_name: 'keys_grezy_i_koshmary',          img_url: './csgo_images/case/case_003.png' },
  { name: 'Кейс операции «Хищные воды»',    system_name: 'keys_operatsii_hischnye_vody',   img_url: './csgo_images/case/case_004.png' },
  { name: 'Кейс «Змеиный укус»',            system_name: 'keys_zmeinyy_ukus',              img_url: './csgo_images/case/case_005.png' },
  { name: 'Кейс операции «Сломанный клык»', system_name: 'keys_operatsii_slomannyy_klyk',  img_url: './csgo_images/case/case_006.png' },
  { name: 'Кейс «Разлом»',                  system_name: 'keys_razlom',                    img_url: './csgo_images/case/case_007.png' },
  { name: 'Кейс «Расколотая сеть»',         system_name: 'keys_raskolotaya_set',           img_url: './csgo_images/case/case_008.png' },
  { name: 'Кейс «Призма»',                  system_name: 'keys_prizma',                    img_url: './csgo_images/case/case_009.png' },
  { name: 'Кейс «Запретная зона»',          system_name: 'keys_zapretnaya_zona',           img_url: './csgo_images/case/case_010.png' },
];

let cIns = 0, cSkip = 0;
for (const c of cases) {
  const r = db.Case.updateOne(
    { $or: [{ name: c.name }, { system_name: c.system_name }] },
    { $setOnInsert: { _id: uuidv4(), name: c.name, system_name: c.system_name, img_url: c.img_url,
        price: 100, status: 'active', tag: null, created_at: now, case_content: [] } },
    { upsert: true }
  );
  if (r.upsertedCount > 0) { print('[CASE INSERT] ' + c.name); cIns++; }
  else                      { print('[CASE SKIP]   ' + c.name); cSkip++; }
}
print('Cases: ' + cIns + ' inserted, ' + cSkip + ' skipped.\n');

// ─────────────────────────────────────────────────────────────────────────────
// ITEMS
// ─────────────────────────────────────────────────────────────────────────────
const rarityColors = {
  'Ширпотреб':     '#b0c3d9',
  'Промышленное':  '#5e98d9',
  'Армейское':     '#4b69ff',
  'Запрещенное':   '#8847ff',
  'Засекреченное': '#d32ce6',
  'Тайное':        '#eb4b4b',
  'Экстраординарное': '#e4ae39',
};

const items = [
  { type: 'Нож',              rarity: 'Тайное',        name: 'Кукри | Кровавая паутина',        img_url: './csgo_images/weapons/weapon_001.png' },
  { type: 'Винтовки',         rarity: 'Тайное',        name: 'AK-47 | Пожелание на ночь',       img_url: './csgo_images/weapons/weapon_002.png' },
  { type: 'Пистолет',         rarity: 'Засекреченное', name: 'Glock-18 | Сумеречная галактика', img_url: './csgo_images/weapons/weapon_003.png' },
  { type: 'Нож',              rarity: 'Тайное',        name: 'Штык-нож | Легенды',              img_url: './csgo_images/weapons/weapon_004.png' },
  { type: 'Дробовик',         rarity: 'Армейское',     name: 'Nova | Буря',                     img_url: './csgo_images/weapons/weapon_005.png' },
  { type: 'Пулемет',          rarity: 'Ширпотреб',     name: 'M249 | Контрастные цвета',        img_url: './csgo_images/weapons/weapon_006.png' },
  { type: 'Дробовик',         rarity: 'Армейское',     name: 'MAG-7 | Антитерраса',             img_url: './csgo_images/weapons/weapon_007.png' },
  { type: 'Нож',              rarity: 'Тайное',        name: 'Стилет | Зуб тигра',              img_url: './csgo_images/weapons/weapon_008.png' },
  { type: 'Пистолет',         rarity: 'Тайное',        name: 'P2000 | Дух огня',                img_url: './csgo_images/weapons/weapon_009.png' },
  { type: 'Винтовка',         rarity: 'Запрещенное',   name: 'FAMAS | Пульс',                   img_url: './csgo_images/weapons/weapon_010.png' },
  { type: 'Пистолет-пулемет', rarity: 'Армейское',     name: 'MP9 | Закат',                     img_url: './csgo_images/weapons/weapon_011.png' },
  { type: 'Нож',              rarity: 'Тайное',        name: 'Нож-бабочка | Автотроника',       img_url: './csgo_images/weapons/weapon_012.png' },
  { type: 'Пистолет',         rarity: 'Промышленное',  name: 'Desert Eagle | Ночная буря',      img_url: './csgo_images/weapons/weapon_013.png' },
  { type: 'Пистолет-пулемет', rarity: 'Запрещенное',   name: 'MP9 | Гипноз',                    img_url: './csgo_images/weapons/weapon_014.png' },
  { type: 'Пистолет-пулемет', rarity: 'Армейское',     name: 'PP-Bizon | Жнец',                 img_url: './csgo_images/weapons/weapon_015.png' },
  { type: 'Нож',              rarity: 'Тайное',        name: 'Нож «Бродяга» | Вороненая сталь', img_url: './csgo_images/weapons/weapon_016.png' },
  { type: 'Пистолет',         rarity: 'Ширпотреб',     name: 'CZ75-Auto | Фреймворк',           img_url: './csgo_images/weapons/weapon_017.png' },
  { type: 'Винтовка',         rarity: 'Засекреченное', name: 'Galil AR | Эко',                  img_url: './csgo_images/weapons/weapon_018.png' },
  { type: 'Пулемет',          rarity: 'Засекреченное', name: 'Negev | Мьёльнир',                img_url: './csgo_images/weapons/weapon_019.png' },
  { type: 'Винтовка',         rarity: 'Ширпотреб',     name: 'SCAR-20 | Гроза',                 img_url: './csgo_images/weapons/weapon_020.png' },
  { type: 'Дробовик',         rarity: 'Ширпотреб',     name: 'Sawed-Off | Тень бамбука',        img_url: './csgo_images/weapons/weapon_021.png' },
  { type: 'Пистолет-пулемет', rarity: 'Армейское',     name: 'UMP-45 | Осциллятор',             img_url: './csgo_images/weapons/weapon_022.png' },
  { type: 'Пистолет',         rarity: 'Армейское',     name: 'Револьвер R8 | Автосвалка',       img_url: './csgo_images/weapons/weapon_023.png' },
  { type: 'Нож',              rarity: 'Тайное',        name: 'Коготь | Волны Рубин',            img_url: './csgo_images/weapons/weapon_024.png' },
  { type: 'Винтовка',         rarity: 'Ширпотреб',     name: 'SSG 08 | Параллакс',              img_url: './csgo_images/weapons/weapon_025.png' },
];

let iIns = 0, iSkip = 0;
for (const it of items) {
  const weaponName = it.name.split('|')[0].trim();
  const rarityName = it.rarity || 'Ширпотреб';
  const rarityColor = rarityColors[rarityName] || '#b0c3d9';

  const r = db.Item.updateOne(
    { name: it.name },
    { $setOnInsert: { _id: uuidv4(), name: it.name, img_url: it.img_url, price: 0,
        weapon: { name: weaponName, type: it.type },
        rarity: { name: rarityName, color: rarityColor },
        created_at: now } },
    { upsert: true }
  );
  if (r.upsertedCount > 0) { print('[ITEM INSERT] ' + it.name); iIns++; }
  else                      { print('[ITEM SKIP]   ' + it.name); iSkip++; }
}
print('Items: ' + iIns + ' inserted, ' + iSkip + ' skipped.');
