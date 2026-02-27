import { useEffect, useState } from 'react';
import {
    getKnowledgeDocuments,
    uploadDocument,
    deleteDocument,
    getKnowledgeArticles,
    getKnowledgeGaps,
    addQAPair
} from '../../../services/adminApi';
import type { KnowledgeDocument, KnowledgeArticle, KnowledgeGap } from '../../../types/admin';
import {
    Upload,
    Trash2,
    FileText,
    Plus,
    AlertCircle,
    RefreshCw,
    CheckCircle2,
    Loader2,
} from 'lucide-react';

type SubTab = 'documents' | 'articles' | 'gaps';

export default function BotKnowledge() {
    const [subTab, setSubTab] = useState<SubTab>('documents');
    const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
    const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
    const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        Promise.all([
            getKnowledgeDocuments(),
            getKnowledgeArticles(),
            getKnowledgeGaps(),
        ])
            .then(([d, a, g]) => {
                setDocs(d);
                setArticles(a);
                setGaps(g);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await uploadDocument(file);
            const newDoc: KnowledgeDocument = {
                id: crypto.randomUUID(),
                filename: file.name,
                uploadedAt: new Date().toISOString(),
                sizeBytes: file.size,
                status: 'indexing',
            };
            setDocs((prev) => [newDoc, ...prev]);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        await deleteDocument(id);
        setDocs((prev) => prev.filter((d) => d.id !== id));
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const statusBadge = (status: KnowledgeDocument['status']) => {
        const config = {
            ready: { icon: CheckCircle2, text: 'Готово', cls: 'bg-green-50 text-green-700' },
            indexing: { icon: Loader2, text: 'Индексируется', cls: 'bg-amber-50 text-amber-700' },
            error: { icon: AlertCircle, text: 'Ошибка', cls: 'bg-red-50 text-red-600' },
        }[status];
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.cls}`}>
                <Icon className={`w-3 h-3 ${status === 'indexing' ? 'animate-spin' : ''}`} strokeWidth={2} />
                {config.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="bg-gray-200 rounded-xl h-12" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-50 rounded-xl p-1 w-fit">
                {([
                    { key: 'documents' as const, label: 'Документы', count: docs.length },
                    { key: 'articles' as const, label: 'Статьи', count: articles.length },
                    { key: 'gaps' as const, label: 'Белые пятна', count: gaps.length },
                ]).map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setSubTab(t.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${subTab === t.key
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {t.label}
                        <span className="ml-1.5 text-xs text-gray-400">({t.count})</span>
                    </button>
                ))}
            </div>

            {/* Documents */}
            {subTab === 'documents' && (
                <div className="space-y-4">
                    {/* Upload Zone */}
                    <label className="block bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm p-8 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-200">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" strokeWidth={1.5} />
                        <div className="text-sm font-medium text-gray-700 mb-1">
                            {uploading ? 'Загрузка...' : 'Нажмите или перетащите файл'}
                        </div>
                        <div className="text-xs text-gray-400">PDF, DOCX, TXT • до 10 MB</div>
                        <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>

                    {/* Documents Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <th className="px-4 py-3">Файл</th>
                                    <th className="px-4 py-3">Размер</th>
                                    <th className="px-4 py-3">Дата</th>
                                    <th className="px-4 py-3">Статус</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.map((doc) => (
                                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                                                <span className="font-medium text-gray-900">{doc.filename}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-500">{formatBytes(doc.sizeBytes)}</td>
                                        <td className="px-4 py-3.5 text-gray-500">
                                            {new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}
                                        </td>
                                        <td className="px-4 py-3.5">{statusBadge(doc.status)}</td>
                                        <td className="px-4 py-3.5">
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                            >
                                                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {docs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                            Нет загруженных документов.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Re-index */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Последняя индексация: <span className="font-medium text-gray-700">26 февраля 2026</span>
                        </div>
                        <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-full text-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300">
                            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                            Переиндексировать всё
                        </button>
                    </div>
                </div>
            )}

            {/* Articles */}
            {subTab === 'articles' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white font-medium rounded-full shadow-sm text-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md">
                            <Plus className="w-4 h-4" strokeWidth={1.5} />
                            Создать статью
                        </button>
                    </div>
                    <div className="space-y-3">
                        {articles.map((art) => (
                            <div key={art.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-300 cursor-pointer">
                                <h3 className="font-medium text-gray-900 mb-1">{art.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{art.content}</p>
                                <div className="flex gap-2 mt-3">
                                    {art.keywords.map((kw) => (
                                        <span key={kw} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {articles.length === 0 && (
                            <div className="text-center text-gray-400 py-12">Нет статей. Создайте первую.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Knowledge Gaps */}
            {subTab === 'gaps' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <th className="px-4 py-3">Вопрос</th>
                                <th className="px-4 py-3">Кол-во</th>
                                <th className="px-4 py-3">Дата</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {gaps.sort((a, b) => b.count - a.count).map((gap) => (
                                <tr key={gap.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" strokeWidth={1.5} />
                                            <span className="text-gray-900">{gap.question}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${gap.count >= 5 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {gap.count}×
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-500">
                                        {new Date(gap.createdAt).toLocaleDateString('ru-RU')}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <button
                                            onClick={async () => {
                                                const answer = prompt(`Ответ на вопрос: "${gap.question}"`);
                                                if (answer) {
                                                    try {
                                                        await addQAPair(gap.question, answer);
                                                        setGaps(prev => prev.filter(g => g.id !== gap.id));
                                                        alert('Ответ сохранен в базу знаний!');
                                                    } catch (err) {
                                                        alert('Ошибка сохранения');
                                                    }
                                                }
                                            }}
                                            className="text-primary-600 hover:text-primary-700 font-medium text-xs transition-colors"
                                        >
                                            Заполнить →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {gaps.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                                        Нет белых пятен. Бот отвечает на все вопросы.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
