import { pool } from '../db/client'

export async function generateEstimateHtml(
    tenantId: string | null,
    params: {
        area: string
        rooms: string
        repairType: string
        design?: string
        condition?: string
        ceilingHeight?: string
        wallMaterial?: string
    },
    segmentName: string,
    estimateMin: number,
    estimateMax: number
): Promise<string> {

    // Fetch branding
    let branding = {
        primaryColor: '#3b82f6', // blue-500
        pageTitle: 'Смета на ремонт',
        companyDescription: 'Профессиональный ремонт квартир',
    }

    if (tenantId) {
        const brandRes = await pool.query(
            `SELECT primary_color, page_title, company_description FROM tenant_branding WHERE tenant_id = $1`,
            [tenantId]
        )
        if (brandRes.rows.length > 0) {
            branding.primaryColor = brandRes.rows[0].primary_color || branding.primaryColor
            branding.pageTitle = brandRes.rows[0].page_title || branding.pageTitle
            branding.companyDescription = brandRes.rows[0].company_description || branding.companyDescription
        }
    }

    // Generate breakdown based on estimate amounts (roughly: 40% materials, 60% work)
    const avg = (estimateMin + estimateMax) / 2
    const breakdown = [
        { name: 'Демонтажные работы и вывоз мусора', percent: 0.05 },
        { name: 'Черновые работы (стяжка, штукатурка)', percent: 0.25 },
        { name: 'Инженерные сети (электрика, сантехника)', percent: 0.20 },
        { name: 'Чистовые работы (обои, ламинат, плитка)', percent: 0.25 },
        { name: 'Черновые материалы (доставка и подъем)', percent: 0.25 }
    ]

    const areaVal = parseFloat(params.area) || 0
    const pricePerSqM = areaVal > 0 ? Math.round(avg / areaVal) : 0

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style>
</head>
<body class="bg-gray-50 text-gray-800 p-8 pt-10">
    <div class="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-gray-200">
        <!-- Header -->
        <div class="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
            <div>
                <h1 class="text-3xl font-bold" style="color: ${branding.primaryColor}">${branding.pageTitle}</h1>
                <p class="text-gray-500 mt-2">${branding.companyDescription}</p>
            </div>
            <div class="text-right">
                <p class="text-sm text-gray-400">Дата расчета</p>
                <p class="font-medium">${new Date().toLocaleDateString('ru-RU')}</p>
                <div class="mt-4 px-3 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700">
                    Уровень: ${segmentName}
                </div>
            </div>
        </div>

        <!-- Params -->
        <div class="grid grid-cols-2 gap-8 mb-8">
            <div>
                <h3 class="text-lg font-semibold mb-4 border-b pb-2">Объект</h3>
                <ul class="space-y-2 text-sm">
                    <li class="flex justify-between"><span class="text-gray-500">Площадь:</span> <span class="font-medium">${params.area} м²</span></li>
                    <li class="flex justify-between"><span class="text-gray-500">Комнат:</span> <span class="font-medium">${params.rooms || '-'}</span></li>
                    <li class="flex justify-between"><span class="text-gray-500">Состояние:</span> <span class="font-medium">${params.condition || '-'}</span></li>
                    <li class="flex justify-between"><span class="text-gray-500">Высота потолков:</span> <span class="font-medium">${params.ceilingHeight || '-'}</span></li>
                </ul>
            </div>
            <div>
                <h3 class="text-lg font-semibold mb-4 border-b pb-2">Тип ремонта</h3>
                <ul class="space-y-2 text-sm">
                    <li class="flex justify-between"><span class="text-gray-500">Вид:</span> <span class="font-medium">${params.repairType}</span></li>
                    <li class="flex justify-between"><span class="text-gray-500">Дизайн:</span> <span class="font-medium">${params.design || 'Нет'}</span></li>
                </ul>
            </div>
        </div>

        <!-- Estimate Table -->
        <h3 class="text-lg font-semibold mb-4 border-b pb-2">Предварительный расчет (Ориентировочно)</h3>
        <table class="w-full text-sm text-left mb-8">
            <thead class="bg-gray-50 text-gray-600">
                <tr>
                    <th class="py-3 px-4 rounded-tl-lg">Вид работ / затрат</th>
                    <th class="py-3 px-4 text-right rounded-tr-lg">Ориентировочная сумма</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                ${breakdown.map(item => `
                <tr>
                    <td class="py-3 px-4">${item.name}</td>
                    <td class="py-3 px-4 text-right font-medium">${Math.round(avg * item.percent).toLocaleString('ru-RU')} руб.</td>
                </tr>
                `).join('')}
            </tbody>
            <tfoot class="bg-gray-50 font-semibold text-gray-800">
                <tr>
                    <td class="py-4 px-4 rounded-bl-lg">Итого (среднее)</td>
                    <td class="py-4 px-4 text-right rounded-br-lg text-lg" style="color: ${branding.primaryColor}">${Math.round(avg).toLocaleString('ru-RU')} руб.</td>
                </tr>
            </tfoot>
        </table>

        <!-- Summary -->
        <div class="bg-blue-50 border-l-4 p-4 mb-8" style="border-left-color: ${branding.primaryColor}; background-color: #eff6ff;">
            <p class="text-sm text-gray-700">
                <strong>Внимание:</strong> Указан предварительный диапазон стоимости: 
                <span class="font-bold whitespace-nowrap">${estimateMin.toLocaleString('ru-RU')} — ${estimateMax.toLocaleString('ru-RU')} руб.</span> 
                (~${pricePerSqM.toLocaleString('ru-RU')} руб/м²). 
                Точная стоимость фиксируется после бесплатного выезда инженера-сметчика на объект.
            </p>
        </div>

        <!-- Footer -->
        <div class="text-center text-gray-400 text-xs mt-12 pt-8 border-t border-gray-100">
            Документ создан автоматически платформой AI Chat
        </div>
    </div>
</body>
</html>
    `
}
