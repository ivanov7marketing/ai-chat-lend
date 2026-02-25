interface Props {
    currentStep: number
    totalSteps: number
    visible: boolean
}

export default function ProgressBar({ currentStep, totalSteps, visible }: Props) {
    if (!visible) return null
    const percent = ((currentStep + 1) / totalSteps) * 100

    return (
        <div className="px-4 pt-3">
            <p className="text-xs text-gray-400 text-right mb-1">
                Шаг {currentStep + 1} из {totalSteps}
            </p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div
                    className="bg-primary-500 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    )
}
