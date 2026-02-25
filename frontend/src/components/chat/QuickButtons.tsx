interface Props {
    buttons: string[]
    onSelect: (btn: string) => void
}

export default function QuickButtons({ buttons, onSelect }: Props) {
    return (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
            {buttons.map((btn, i) => (
                <button
                    key={btn}
                    onClick={() => onSelect(btn)}
                    className={
                        i === 0
                            ? 'rounded-full text-sm px-4 py-2 font-medium transition-all duration-200 ease-out cursor-pointer bg-primary-500 text-white border border-primary-500 hover:bg-primary-600 hover:border-primary-600'
                            : 'rounded-full text-sm px-4 py-2 font-medium transition-all duration-200 ease-out cursor-pointer bg-white text-primary-700 border border-primary-200 hover:bg-primary-50 hover:border-primary-400'
                    }
                >
                    {btn}
                </button>
            ))}
        </div>
    )
}
