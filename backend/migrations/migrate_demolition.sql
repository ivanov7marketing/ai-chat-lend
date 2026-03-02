-- Миграция: обновление "Демонтажные работы" — добавление подкатегорий
-- Выполнить на сервере: psql -U chatbot -d chatbot -f migrate_demolition.sql

-- 1. Получаем tenant_id (берём первый тенант)
-- Если нужен конкретный, замените на UUID
DO $$
DECLARE
    v_tenant_id UUID;
    v_wt_id INT;
BEGIN
    -- Автоопределение tenant_id по существующим работам с категорией "Демонтажные работы"
    SELECT DISTINCT tenant_id INTO v_tenant_id
    FROM work_types
    WHERE category = 'Демонтажные работы'
    LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant not found, trying first tenant...';
        SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
    END IF;

    RAISE NOTICE 'Using tenant_id: %', v_tenant_id;

    -- 2. Удаляем старые записи price_matrix для демонтажных работ этого тенанта
    DELETE FROM price_matrix
    WHERE work_type_id IN (
        SELECT id FROM work_types
        WHERE category = 'Демонтажные работы' AND tenant_id = v_tenant_id
    );

    -- 3. Удаляем старые work_types
    DELETE FROM work_types
    WHERE category = 'Демонтажные работы' AND tenant_id = v_tenant_id;

    RAISE NOTICE 'Old demolition work types deleted';

    -- ===================== ПОТОЛКИ =====================
    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж натяжного потолка (ПВХ)', 'м²', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 50, 50, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж потолка из ГКЛ (с каркасом)', 'м²', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 120, 120, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж реечного потолка', 'м²', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 100, 100, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж потолка «Армстронг»', 'м²', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 100, 100, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж потолочной плитки (полистирол)', 'м²', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 60, 60, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Размывка побелки / мела с потолка', 'м²', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 80, 80, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Очистка потолка от водоэмульсионной краски', 'м²', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 80, 80, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Очистка потолка от масляной краски', 'м²', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 120, 120, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Удаление штукатурки с потолка', 'м²', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 120, 120, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж потолочного плинтуса', 'пог. м', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 35, 35, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж люстры', 'шт.', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 250, 250, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж точечного светильника', 'шт.', 'Демонтажные работы', 'Потолки', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 80, 80, NOW());

    -- ===================== СТЕНЫ =====================
    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Снятие обоев бумажных', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 80, 80, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Снятие обоев флизелиновых', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 180, 180, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Снятие обоев виниловых', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 200, 200, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Размывка побелки / мела со стен', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 100, 100, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Очистка стен от водоэмульсионной краски', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 120, 120, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Очистка стен от масляной краски', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 350, 350, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Удаление штукатурки со стен', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 250, 250, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж керамической плитки со стен', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 350, 350, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж стеновых панелей ПВХ', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 350, 350, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж стеновых панелей МДФ', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 400, 400, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж деревянной вагонки', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 300, 300, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж перегородки из ГКЛ', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 280, 280, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж перегородки из кирпича (½ кирпича)', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 700, 700, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж перегородки из пеноблока', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 550, 550, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Пробивка проёма в кирпичной стене', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 1200, 1200, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Пробивка проёма в бетонной стене', 'м²', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 2200, 2200, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж межкомнатной двери (полотно + коробка)', 'шт.', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 800, 800, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж входной металлической двери', 'шт.', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 1500, 1500, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж пластикового окна', 'шт.', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 800, 800, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж деревянного окна', 'шт.', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 600, 600, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж подоконника', 'шт.', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 350, 350, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж откосов из ГКЛ', 'шт.', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 300, 300, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж напольного плинтуса ПВХ', 'пог. м', 'Демонтажные работы', 'Стены', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 50, 50, NOW());

    -- ===================== ПОЛЫ =====================
    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж линолеума', 'м²', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 80, 80, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж ковролина', 'м²', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 80, 80, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж ламината', 'м²', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 120, 120, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж паркетной доски', 'м²', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 150, 150, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж керамической плитки пола', 'м²', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 350, 350, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж керамогранита', 'м²', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 400, 400, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж фанеры', 'м²', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 150, 150, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж деревянного пола (доска)', 'м²', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 250, 250, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж деревянных лаг', 'пог. м', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 120, 120, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж цементной стяжки (до 50 мм)', 'м²', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 350, 350, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж цементной стяжки (50–100 мм)', 'м²', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 500, 500, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж наливного пола', 'м²', 'Демонтажные работы', 'Полы', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 350, 350, NOW());

    -- ===================== ЭЛЕКТРИКА =====================
    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж розетки', 'шт.', 'Демонтажные работы', 'Электрика', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 80, 80, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж выключателя', 'шт.', 'Демонтажные работы', 'Электрика', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 80, 80, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж люстры', 'шт.', 'Демонтажные работы', 'Электрика', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 250, 250, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж точечного светильника', 'шт.', 'Демонтажные работы', 'Электрика', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 80, 80, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж скрытой проводки', 'пог. м', 'Демонтажные работы', 'Электрика', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 100, 100, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж открытой проводки', 'пог. м', 'Демонтажные работы', 'Электрика', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 50, 50, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж кабель-канала', 'пог. м', 'Демонтажные работы', 'Электрика', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 40, 40, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж электрощита с автоматами', 'шт.', 'Демонтажные работы', 'Электрика', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 800, 800, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж автоматического выключателя', 'шт.', 'Демонтажные работы', 'Электрика', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 100, 100, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж накопительного водонагревателя', 'шт.', 'Демонтажные работы', 'Электрика', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 500, 500, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж вытяжного вентилятора', 'шт.', 'Демонтажные работы', 'Электрика', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 200, 200, NOW());

    -- ===================== САНТЕХНИКА =====================
    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж ванны акриловой', 'шт.', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 800, 800, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж ванны чугунной', 'шт.', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 1500, 1500, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж душевой кабины', 'шт.', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 1500, 1500, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж раковины', 'шт.', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 400, 400, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж кухонной мойки', 'шт.', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 400, 400, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж унитаза напольного', 'шт.', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 600, 600, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж смесителя', 'шт.', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 350, 350, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж сифона', 'шт.', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 200, 200, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж труб водоснабжения (ПВХ)', 'пог. м', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 150, 150, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж труб водоснабжения (металл)', 'пог. м', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 350, 350, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж труб канализации (ПВХ)', 'пог. м', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 280, 280, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж труб канализации (чугун)', 'пог. м', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 1200, 1200, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж радиатора отопления', 'шт.', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 800, 800, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж полотенцесушителя', 'шт.', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 500, 500, NOW());

    INSERT INTO work_types (name, unit, category, subcategory, tenant_id) VALUES ('Демонтаж счётчика воды', 'шт.', 'Демонтажные работы', 'Сантехника', v_tenant_id) RETURNING id INTO v_wt_id;
    INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at) VALUES (v_wt_id, 'Стандарт', 350, 350, NOW());

    RAISE NOTICE 'Migration complete! Inserted 75 demolition work types with subcategories.';
END $$;
