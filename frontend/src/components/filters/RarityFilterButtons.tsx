import { X } from "lucide-react";
import type { RarityData } from "@/services/api";

interface RarityFilterButtonsProps {
    rarities: RarityData[];
    selected: Set<string>;
    onToggle: (name: string) => void;
    onReset?: () => void;
    size?: "sm" | "md";
}

export function RarityFilterButtons({ rarities, selected, onToggle, onReset, size = "md" }: RarityFilterButtonsProps) {
    if (rarities.length === 0) return null;

    const px = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
    const text = size === "sm" ? "text-xs" : "text-sm";

    return (
        <div className="flex flex-wrap gap-2">
            {rarities.map((r) => (
                <button
                    key={r.id}
                    onClick={() => onToggle(r.name)}
                    className={`cursor-pointer ${px} rounded-lg ${text} font-medium border transition-all duration-200 ${
                        selected.has(r.name)
                            ? "border-current bg-current/15"
                            : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                    style={{
                        color: selected.has(r.name) ? r.color : undefined,
                        borderColor: selected.has(r.name) ? r.color : undefined,
                    }}
                >
                    {r.name}
                </button>
            ))}
            {onReset && selected.size > 0 && (
                <button
                    onClick={onReset}
                    className={`${px} rounded-lg ${text} text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1`}
                >
                    <X className="h-3 w-3" /> Сбросить
                </button>
            )}
        </div>
    );
}
