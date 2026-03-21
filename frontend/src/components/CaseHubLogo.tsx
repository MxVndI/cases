import React from "react";

interface CaseHubLogoProps {
    className?: string;
    size?: number;
}

export const CaseHubLogo: React.FC<CaseHubLogoProps> = ({
    className = "",
    size = 40
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Стилизованный фон с паттерном */}
            <defs>
                <pattern id="dots" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="0.5" fill="white" fillOpacity="0.1" />
                </pattern>
                <linearGradient id="orangeGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F7971D" />
                    <stop offset="70%" stopColor="#F7971D" />
                    <stop offset="100%" stopColor="#F7971D" />
                </linearGradient>
            </defs>

            {/* Фон с текстурой */}
            <rect width="40" height="40" rx="14" fill="url(#orangeGrad)" />
            <rect width="40" height="40" rx="14" fill="url(#dots)" />

            {/* Буква H (нижний слой) - черная с прозрачностью */}
            <path
                d="M27 12H25V18H19V12H17V28H19V22H25V28H27V12Z"
                fill="#0F172A"
                opacity="0.9"
            />

            {/* Буква C (верхний слой) - белая, наезжает на H */}
            <path
                d="M15 11H9C7.9 11 7 11.9 7 13V27C7 28.1 7.9 29 9 29H15C16.1 29 17 28.1 17 27V23H15V25H11V15H15V17H17V13C17 11.9 16.1 11 15 11Z"
                fill="white"
            />

            {/* Дополнительный эффект - блик */}
            <path
                d="M8 8L12 12M32 32L28 28"
                stroke="white"
                strokeWidth="1"
                strokeOpacity="0.2"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default CaseHubLogo;
