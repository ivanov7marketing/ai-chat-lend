import dotenv from 'dotenv'
dotenv.config()

// Override host for local run
if (!process.env.POSTGRES_HOST) {
    process.env.POSTGRES_HOST = 'localhost'
}

import { pool } from './client'

const CATEGORY = 'Демонтажные работы'
const SLUG = process.env.DEFAULT_TENANT_SLUG || 'default'

const WORKS = [
    { name: 'Демонтаж натяжного потолка (ПВХ)', unit: 'м²', price: 50 },
    { name: 'Демонтаж потолка из ГКЛ (с каркасом)', unit: 'м²', price: 120 },
    { name: 'Демонтаж реечного потолка', unit: 'м²', price: 100 },
    { name: 'Демонтаж потолка «Армстронг»', unit: 'м²', price: 100 },
    { name: 'Демонтаж потолочной плитки (полистирол)', unit: 'м²', price: 60 },
    { name: 'Размывка побелки / мела с потолка', unit: 'м²', price: 80 },
    { name: 'Очистка потолка от водоэмульсионной краски', unit: 'м²', price: 80 },
    { name: 'Очистка потолка от масляной краски', unit: 'м²', price: 120 },
    { name: 'Удаление штукатурки с потолка', unit: 'м²', price: 120 },
    { name: 'Демонтаж потолочного плинтуса', unit: 'пог. м', price: 35 },
    { name: 'Демонтаж люстры', unit: 'шт.', price: 250 },
    { name: 'Демонтаж точечного светильника', unit: 'шт.', price: 80 },
    { name: 'Снятие обоев бумажных', unit: 'м²', price: 80 },
    { name: 'Снятие обоев флизелиновых', unit: 'м²', price: 180 },
    { name: 'Снятие обоев виниловых', unit: 'м²', price: 200 },
    { name: 'Размывка побелки / мела со стен', unit: 'м²', price: 100 },
    { name: 'Очистка стен от водоэмульсионной краски', unit: 'м²', price: 120 },
    { name: 'Очистка стен от масляной краски', unit: 'м²', price: 350 },
    { name: 'Удаление штукатурки со стен', unit: 'м²', price: 250 },
    { name: 'Демонтаж керамической плитки со стен', unit: 'м²', price: 350 },
    { name: 'Демонтаж стеновых панелей ПВХ', unit: 'м²', price: 350 },
    { name: 'Демонтаж стеновых панелей МДФ', unit: 'м²', price: 400 },
    { name: 'Демонтаж деревянной вагонки', unit: 'м²', price: 300 },
    { name: 'Демонтаж перегородки из ГКЛ', unit: 'м²', price: 280 },
    { name: 'Демонтаж перегородки из кирпича (½ кирпича)', unit: 'м²', price: 700 },
    { name: 'Демонтаж перегородки из пеноблока', unit: 'м²', price: 550 },
    { name: 'Пробивка проёма в кирпичной стене', unit: 'м²', price: 1200 },
    { name: 'Пробивка проёма в бетонной стене', unit: 'м²', price: 2200 },
    { name: 'Демонтаж межкомнатной двери (полотно + коробка)', unit: 'шт.', price: 800 },
    { name: 'Демонтаж входной металлической двери', unit: 'шт.', price: 1500 },
    { name: 'Демонтаж пластикового окна', unit: 'шт.', price: 800 },
    { name: 'Демонтаж деревянного окна', unit: 'шт.', price: 600 },
    { name: 'Демонтаж подоконника', unit: 'шт.', price: 350 },
    { name: 'Демонтаж откосов из ГКЛ', unit: 'шт.', price: 300 },
    { name: 'Демонтаж напольного плинтуса ПВХ', unit: 'пог. м', price: 50 },
    { name: 'Демонтаж линолеума', unit: 'м²', price: 80 },
    { name: 'Демонтаж ковролина', unit: 'м²', price: 80 },
    { name: 'Демонтаж ламината', unit: 'м²', price: 120 },
    { name: 'Демонтаж паркетной доски', unit: 'м²', price: 150 },
    { name: 'Демонтаж керамической плитки пола', unit: 'м²', price: 350 },
    { name: 'Демонтаж керамогранита', unit: 'м²', price: 400 },
    { name: 'Демонтаж фанеры', unit: 'м²', price: 150 },
    { name: 'Демонтаж деревянного пола (доска)', unit: 'м²', price: 250 },
    { name: 'Демонтаж деревянных лаг', unit: 'пог. м', price: 120 },
    { name: 'Демонтаж цементной стяжки (до 50 мм)', unit: 'м²', price: 350 },
    { name: 'Демонтаж цементной стяжки (50–100 мм)', unit: 'м²', price: 500 },
    { name: 'Демонтаж наливного пола', unit: 'м²', price: 350 },
    { name: 'Демонтаж розетки', unit: 'шт.', price: 80 },
    { name: 'Демонтаж выключателя', unit: 'шт.', price: 80 },
    { name: 'Демонтаж скрытой проводки', unit: 'пог. м', price: 100 },
    { name: 'Демонтаж открытой проводки', unit: 'пог. м', price: 50 },
    { name: 'Демонтаж кабель-канала', unit: 'пог. м', price: 40 },
    { name: 'Демонтаж электрощита с автоматами', unit: 'шт.', price: 800 },
    { name: 'Демонтаж автоматического выключателя', unit: 'шт.', price: 100 },
    { name: 'Демонтаж накопительного водонагревателя', unit: 'шт.', price: 500 },
    { name: 'Демонтаж вытяжного вентилятора', unit: 'шт.', price: 200 },
    { name: 'Демонтаж ванны акриловой', unit: 'шт.', price: 800 },
    { name: 'Демонтаж ванны чугунной', unit: 'шт.', price: 1500 },
    { name: 'Демонтаж душевой кабины', unit: 'шт.', price: 1500 },
    { name: 'Демонтаж раковины', unit: 'шт.', price: 400 },
    { name: 'Демонтаж кухонной мойки', unit: 'шт.', price: 400 },
    { name: 'Демонтаж унитаза напольного', unit: 'шт.', price: 600 },
    { name: 'Демонтаж смесителя', unit: 'шт.', price: 350 },
    { name: 'Демонтаж сифона', unit: 'шт.', price: 200 },
    { name: 'Демонтаж труб водоснабжения (ПВХ)', unit: 'пог. м', price: 150 },
    { name: 'Демонтаж труб водоснабжения (металл)', unit: 'пог. м', price: 350 },
    { name: 'Демонтаж труб канализации (ПВХ)', unit: 'пог. м', price: 280 },
    { name: 'Демонтаж труб канализации (чугун)', unit: 'пог. м', price: 1200 },
    { name: 'Демонтаж радиатора отопления', unit: 'шт.', price: 800 },
    { name: 'Демонтаж полотенцесушителя', unit: 'шт.', price: 500 },
    { name: 'Демонтаж счётчика воды', unit: 'шт.', price: 350 },
]

async function main() {
    const tenantRes = await pool.query('SELECT id FROM tenants WHERE slug = $1', [SLUG])
    if (tenantRes.rows.length === 0) {
        console.error(`Tenant with slug "${SLUG}" not found. Ensure seeding has been done.`)
        process.exit(1)
    }
    const tenantId = tenantRes.rows[0].id

    console.log(`Using tenant ID: ${tenantId}`)

    for (const work of WORKS) {
        const client = await pool.connect()
        try {
            await client.query('BEGIN')
            const wtRes = await client.query(
                `INSERT INTO work_types (name, unit, category, tenant_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [work.name, work.unit, CATEGORY, tenantId]
            )
            const workTypeId = wtRes.rows[0].id

            // Insert into price matrix for 'Стандарт' segment
            await client.query(
                `INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at)
                 VALUES ($1, 'Стандарт', $2, $2, NOW())`,
                [workTypeId, work.price]
            )
            await client.query('COMMIT')
            console.log(`Added: ${work.name}`)
        } catch (err) {
            await client.query('ROLLBACK')
            console.error(`Failed to add: ${work.name}`, err)
        } finally {
            client.release()
        }
    }

    console.log('Seed demolition complete!')
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
