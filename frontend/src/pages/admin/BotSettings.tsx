import { useState } from 'react';
import BotPersonality from './tabs/BotPersonality';
import BotSegments from './tabs/BotSegments';
import BotBehavior from './tabs/BotBehavior';
import BotKnowledge from './tabs/BotKnowledge';
import { User, Layers, ShieldCheck, BookOpen } from 'lucide-react';

const TABS = [
    { key: 'personality', label: 'Личность', icon: User },
    { key: 'segments', label: 'Сегменты', icon: Layers },
    { key: 'behavior', label: 'Поведение', icon: ShieldCheck },
    { key: 'knowledge', label: 'База знаний', icon: BookOpen },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function BotSettings() {
    const [activeTab, setActiveTab] = useState<TabKey>('personality');

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройка бота</h1>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === key
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'personality' && <BotPersonality />}
            {activeTab === 'segments' && <BotSegments />}
            {activeTab === 'behavior' && <BotBehavior />}
            {activeTab === 'knowledge' && <BotKnowledge />}
        </div>
    );
}
