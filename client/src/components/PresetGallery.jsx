export function PresetGallery({
  presets,
  onApplyPreset,
  eyebrow = 'Presets',
  title = 'Template gallery',
  emptyMessage = 'No items available yet.',
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="label">{eyebrow}</p>
        <h3 className="mt-2 font-display text-lg font-bold text-white">{title}</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {presets.length ? (
          presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset)}
              className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-white/10"
            >
              {preset.previewImage ? (
                <div className="flex h-28 items-center justify-center bg-slate-950/70 p-2">
                  <img src={preset.previewImage} alt={preset.name} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className={`h-2 bg-gradient-to-r ${preset.accent || 'from-cyan-300 to-orange-300'}`} />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{preset.name}</p>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {preset.source || 'Built in'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{preset.description}</p>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
