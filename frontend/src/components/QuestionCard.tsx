import React from 'react';

interface QuestionCardProps {
    question: string;
    onClick: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="cursor-pointer rounded-2xl bg-surface shadow-card border border-gray-100 px-5 py-4 text-gray-700 text-sm font-medium hover:border-primary-300 hover:text-primary-600 hover:shadow-md transition-all duration-200 ease-out"
        >
            {question}
        </div>
    );
};

export default QuestionCard;
