export function RangeControl({ label, min, max, step = 1, value, onChange }) {
  return (
    <label className="space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-200">
        <span>{label}</span>
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300">{value}</span>
      </div>
      <input
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
