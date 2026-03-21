interface StatusFilterButtonsProps {
    current: string;
    onChange: (value: string) => void;
    options?: readonly { value: string; label: string; activeClass?: string }[];
    size?: "sm" | "md";
}

const DEFAULT_OPTIONS = [
    { value: "all", label: "Все", activeClass: "bg-orange-500 border-orange-500 text-white" },
    { value: "active", label: "Активные", activeClass: "bg-green-500/15 border-green-500/40 text-green-400" },
    { value: "disabled", label: "Отключенные", activeClass: "bg-red-500/15 border-red-500/40 text-red-400" },
] as const;

export function StatusFilterButtons({
    current,
    onChange,
    options = DEFAULT_OPTIONS,
    size = "md",
}: StatusFilterButtonsProps) {
    const px = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
    const text = size === "sm" ? "text-xs" : "text-sm";

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`cursor-pointer ${px} rounded-lg ${text} font-medium border transition-all duration-200 ${
                        current === opt.value
                            ? opt.activeClass ?? "bg-orange-500 border-orange-500 text-white"
                            : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
