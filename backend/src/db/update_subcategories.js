const { Pool } = require('pg');
require('dotenv').config();

const CATEGORY = 'Демонтажные работы';

const SUB_GROUPS = {
    'ПОТОЛКИ': [
        'Демонтаж натяжного потолка',
        'Демонтаж потолка из ГКЛ',
        'Демонтаж реечного потолка',
        'Демонтаж потолка «Армстронг»',
        'Демонтаж потолочной плитки',
        'Размывка побелки / мела с потолка',
        'Очистка потолка от водоэмульсионной краски',
        'Очистка потолка от масляной краски',
        'Удаление штукатурки с потолка',
        'Демонтаж потолочного плинтуса',
        'Демонтаж люстры',
        'Демонтаж точечного светильника'
    ],
    'СТЕНЫ': [
        'Снятие обоев',
        'Размывка побелки / мела со стен',
        'Очистка стен от водоэмульсионной краски',
        'Очистка стен от масляной краски',
        'Удаление штукатурки со стен',
        'Демонтаж керамической плитки со стен',
        'Демонтаж стеновых панелей',
        'Демонтаж деревянной вагонки',
        'Демонтаж перегородки',
        'Пробивка проёма',
        'Демонтаж межкомнатной двери',
        'Демонтаж входной металлической двери',
        'Демонтаж пластикового окна',
        'Демонтаж деревянного окна',
        'Демонтаж подоконника',
        'Демонтаж откосов',
        'Демонтаж напольного плинтуса'
    ],
    'ПОЛЫ': [
        'Демонтаж линолеума',
        'Демонтаж ковролина',
        'Демонтаж ламината',
        'Демонтаж паркетной доски',
        'Демонтаж керамической плитки пола',
        'Демонтаж керамогранита',
        'Демонтаж фанеры',
        'Демонтаж деревянного пола',
        'Демонтаж деревянных лаг',
        'Демонтаж цементной стяжки',
        'Демонтаж наливного пола'
    ],
    'ЭЛЕКТРИКА': [
        'Демонтаж розетки',
        'Демонтаж выключателя',
        'Демонтаж скрытой проводки',
        'Демонтаж открытой проводки',
        'Демонтаж кабель-канала',
        'Демонтаж электрощита',
        'Демонтаж автоматического выключателя',
        'Демонтаж накопительного водонагревателя',
        'Демонтаж вытяжного вентилятора'
    ],
    'САНТЕХНИКА': [
        'Демонтаж ванны',
        'Демонтаж душевой кабины',
        'Демонтаж раковины',
        'Демонтаж кухонной мойки',
        'Демонтаж унитаза',
        'Демонтаж смесителя',
        'Демонтаж сифона',
        'Демонтаж труб водоснабжения',
        'Демонтаж труб канализации',
        'Демонтаж радиатора отопления',
        'Демонтаж полотенцесушителя',
        'Демонтаж счётчика воды'
    ]
};

const DB_USER = process.env.POSTGRES_USER || 'chatbot';
const DB_PASS = process.env.POSTGRES_PASSWORD || 'paa0Sgres775$';
const DB_NAME = process.env.POSTGRES_DB || 'chatbot';

async function getClient() {
    const hosts = ['localhost', '127.0.0.1', 'postgres'];
    for (const host of hosts) {
        const pool = new Pool({
            host,
            port: 5432,
            user: DB_USER,
            password: DB_PASS,
            database: DB_NAME,
            connectionTimeoutMillis: 5000
        });
        try {
            await pool.connect();
            console.log(`Successfully connected to DB at ${host}`);
            return pool;
        } catch (err) {
            console.log(`Failed to connect to ${host}: ${err.message}`);
            await pool.end().catch(() => { });
        }
    }
    throw new Error('Could not connect to database with any provided hostname');
}

async function run() {
    let pool;
    try {
        pool = await getClient();
        console.log(`Starting subcategory update for category: ${CATEGORY}`);

        for (const [sub, keywords] of Object.entries(SUB_GROUPS)) {
            console.log(`Updating subcategory: ${sub}...`);
            for (const keyword of keywords) {
                const res = await pool.query(
                    `UPDATE work_types 
                     SET subcategory = $1 
                     WHERE category = $2 AND name ILIKE $3`,
                    [sub, CATEGORY, `%${keyword}%`]
                );
                if (res.rowCount > 0) {
                    console.log(`  Updated ${res.rowCount} rows matching "${keyword}"`);
                }
            }
        }

        console.log('Update complete!');
    } catch (err) {
        console.error('Error during update:', err);
    } finally {
        if (pool) await pool.end();
    }
}

run();
