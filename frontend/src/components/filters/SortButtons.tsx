import { ArrowDown } from "lucide-react";

export interface SortOption<T extends string = string> {
    /** For simple options: just an id. For toggle options: provide descId + ascId */
    id?: T;
    descId?: T;
    ascId?: T;
    label: string;
}

interface SortButtonsProps<T extends string = string> {
    options: SortOption<T>[];
    current: T;
    onChange: (id: T) => void;
    label?: string;
    size?: "sm" | "md";
}

export function SortButtons<T extends string = string>({
    options,
    current,
    onChange,
    label,
    size = "md",
}: SortButtonsProps<T>) {
    const px = size === "sm" ? "px-3 py-1.5" : "px-3 py-1.5";
    const text = size === "sm" ? "text-xs" : "text-sm";
    const labelTextClass = size === "sm" ? "text-xs text-muted-foreground" : "text-sm text-foreground";

    return (
        <div>
            {label && (
                <p className={`${labelTextClass} font-medium mb-2`}>
                    {label}
                </p>
            )}
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                    const isToggle = opt.descId && opt.ascId;

                    if (isToggle) {
                        const isDesc = current === opt.descId;
                        const isAsc = current === opt.ascId;
                        const isActive = isDesc || isAsc;

                        const handleClick = () => {
                            if (!isActive) {
                                onChange(opt.descId!);
                            } else if (isDesc) {
                                onChange(opt.ascId!);
                            } else {
                                onChange(opt.descId!);
                            }
                        };

                        return (
                            <button
                                key={opt.descId}
                                onClick={handleClick}
                                className={`cursor-pointer ${px} rounded-lg ${text} font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                                    isActive
                                        ? size === "sm"
                                            ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                                            : "bg-orange-500 border-orange-500 text-white"
                                        : "border-border/60 text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
                                }`}
                            >
                                {opt.label}
                                <span className={`inline-flex transition-transform duration-200 ${isAsc ? "rotate-180" : ""}`}>
                                    <ArrowDown className="h-3 w-3" />
                                </span>
                            </button>
                        );
                    }

                    // Simple option (e.g. "По умолчанию")
                    return (
                        <button
                            key={opt.id}
                            onClick={() => onChange(opt.id!)}
                            className={`cursor-pointer ${px} rounded-lg ${text} font-medium border transition-all duration-200 ${
                                current === opt.id
                                    ? size === "sm"
                                        ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                                        : "bg-orange-500 border-orange-500 text-white"
                                    : "border-border/60 text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
                            }`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
