interface TagFilterButtonsProps {
    tags: string[];
    selected: Set<string>;
    onToggle: (tag: string) => void;
    size?: "sm" | "md";
}

export function TagFilterButtons({ tags, selected, onToggle, size = "md" }: TagFilterButtonsProps) {
    if (tags.length === 0) return null;

    const px = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
    const text = size === "sm" ? "text-xs" : "text-sm";

    return (
        <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
                <button
                    key={tag}
                    onClick={() => onToggle(tag)}
                    className={`cursor-pointer ${px} rounded-lg ${text} font-medium border transition-all duration-200 ${
                        selected.has(tag)
                            ? "bg-white/15 border-white/30 text-white"
                            : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {tag}
                </button>
            ))}
        </div>
    );
}
