import { Search } from "lucide-react";

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Поиск...", className = "" }: SearchInputProps) {
    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/60 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-orange-500/50 transition-colors"
            />
        </div>
    );
}
