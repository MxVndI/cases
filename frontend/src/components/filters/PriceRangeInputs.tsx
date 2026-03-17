import { Coins } from "lucide-react";

const RANGE_STYLE = `
.range-thumb {
    pointer-events: none;
    margin: 0;
}
.range-thumb::-webkit-slider-runnable-track {
    height: 6px;
    background: transparent;
}
.range-thumb::-moz-range-track {
    height: 6px;
    background: transparent;
}
.range-thumb::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    pointer-events: auto;
    cursor: pointer;
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: #f97316;
    border: 2px solid rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.18);
    margin-top: -5px;
}
.range-thumb::-moz-range-thumb {
    pointer-events: auto;
    cursor: pointer;
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: #f97316;
    border: 2px solid rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.18);
}
`;

interface PriceRangeInputsProps {
    min: number;
    max: number;
    onMinChange: (value: number) => void;
    onMaxChange: (value: number) => void;
    /** Upper bound for the slider (default 600) */
    maxValue?: number;
    /** Slider step (default 10) */
    step?: number;
    /** Quick-select presets; pass `null` to hide */
    presets?: { label: string; min: number; max: number }[] | null;
}

const DEFAULT_PRESETS = [
    { label: "Все",     min: 0,   max: 600 },
    { label: "до 100",  min: 0,   max: 100 },
    { label: "100–200", min: 100, max: 200 },
    { label: "200–500", min: 200, max: 500 },
    { label: "500+",    min: 500, max: 600 },
];

export function PriceRangeInputs({
    min,
    max,
    onMinChange,
    onMaxChange,
    maxValue = 600,
    step = 10,
    presets,
}: PriceRangeInputsProps) {
    // Round maxValue up to nearest step so the slider thumb can reach the right edge
    const sliderMax = Math.ceil(maxValue / step) * step;
    // When max >= maxValue (unfiltered), show thumb at sliderMax so it sits at 100%
    const displayMax = max >= maxValue ? sliderMax : max;

    const minRatio = sliderMax > 0 ? min / sliderMax : 0;
    const maxRatio = sliderMax > 0 ? displayMax / sliderMax : 1;
    const effectivePresets = presets === null
        ? null
        : (presets ?? DEFAULT_PRESETS.map(p => ({
              ...p,
              max: p.max === 600 ? maxValue : p.max,
          })));

    const activePreset = effectivePresets?.findIndex(p => p.min === min && p.max === max) ?? -1;

    const priceFiltered = min > 0 || max < maxValue;

    const handleMinInput = (raw: string) => {
        const v = Math.max(0, Math.min(Number(raw) || 0, max - step));
        onMinChange(v);
    };

    const handleMaxInput = (raw: string) => {
        const v = Math.min(maxValue, Math.max(Number(raw) || 0, min + step));
        onMaxChange(v);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">Цена</p>
                {priceFiltered && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-orange-500">
                        {min}–{max} <Coins className="h-3.5 w-3.5" />
                    </span>
                )}
            </div>

            {/* Preset buttons */}
            {effectivePresets && effectivePresets.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                    {effectivePresets.map((preset, idx) => (
                        <button
                            key={preset.label}
                            onClick={() => { onMinChange(preset.min); onMaxChange(preset.max); }}
                            className={`cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                activePreset === idx
                                    ? "bg-orange-500 text-white"
                                    : "bg-background/50 text-muted-foreground border border-border/60 hover:border-orange-500/30 hover:text-foreground"
                            }`}
                        >
                            {preset.label}
                            {idx > 0 && <Coins className="h-3 w-3 opacity-70" />}
                        </button>
                    ))}
                </div>
            )}

            {/* Dual range slider */}
            <style>{RANGE_STYLE}</style>
            <div className="relative h-6 flex items-center mb-4">
                <div className="absolute left-0 right-0 h-1.5 rounded-full bg-border/60" />
                <div
                    className="absolute h-1.5 rounded-full bg-orange-500 pointer-events-none"
                    style={{
                        left: `${minRatio * 100}%`,
                        right: `${(1 - maxRatio) * 100}%`,
                    }}
                />
                <input
                    type="range"
                    min={0}
                    max={sliderMax}
                    step={step}
                    value={min}
                    onChange={e => onMinChange(Math.min(Number(e.target.value), max - step))}
                    className="range-thumb absolute inset-y-0 w-full appearance-none bg-transparent"
                />
                <input
                    type="range"
                    min={0}
                    max={sliderMax}
                    step={step}
                    value={displayMax}
                    onChange={e => onMaxChange(Math.max(Number(e.target.value), min + step))}
                    className="range-thumb absolute inset-y-0 w-full appearance-none bg-transparent"
                />
            </div>

            {/* Manual inputs */}
            <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-3 py-2 focus-within:border-orange-500/50 transition-colors">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">от</span>
                    <input
                        type="number"
                        min={0}
                        max={max - step}
                        step={step}
                        value={min}
                        onChange={e => handleMinInput(e.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Coins className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                </div>
                <span className="text-muted-foreground text-sm">—</span>
                <div className="flex-1 flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-3 py-2 focus-within:border-orange-500/50 transition-colors">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">до</span>
                    <input
                        type="number"
                        min={min + step}
                        max={maxValue}
                        step={step}
                        value={max}
                        onChange={e => handleMaxInput(e.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Coins className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                </div>
            </div>
        </div>
    );
}
