import { useState } from 'react';

export default function Settings() {
    const [model, setModel] = useState('gpt-4o');
    const [file, setFile] = useState<File | null>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        // В будущем тут будет отправка FormData на /api/admin/rag/upload
        alert(`Файл ${file.name} отправлен на векторизацию (mock)`);
        setFile(null);
    };

    return (
        <div className="p-8 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Настройки системы</h1>

            <div className="space-y-8">
                {/* RouterAI Settings */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">RouterAI (LLM Шлюз)</h2>
                    <div className="max-w-md space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Активная модель бота
                            </label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full border-gray-200 rounded-lg text-sm px-3 py-2 border focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="openai/gpt-5.2">GPT-5.2</option>
                                <option value="anthropic/claude-sonnet-4.6">Claude Sonnet 4.6</option>
                                <option value="deepseek/deepseek-v3.2">DeepSeek v3.2</option>
                            </select>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Сохранить модель
                        </button>
                    </div>
                </section>

                {/* Knowledge Base (RAG) Settings */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-1 text-gray-900">База знаний (RAG)</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Загрузите прайс-листы, технологии ремонта или регламенты. Бот будет использовать эти данные для ответов на вопросы.
                    </p>

                    <form onSubmit={handleUpload} className="max-w-md space-y-4 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                        <input
                            type="file"
                            accept=".pdf,.txt,.docx"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <button
                            type="submit"
                            disabled={!file}
                            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                        >
                            Добавить в Qdrant
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}
