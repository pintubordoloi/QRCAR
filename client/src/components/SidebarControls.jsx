import { RotateCcw, RotateCw, Shuffle } from 'lucide-react';
import { LogoUploader } from './LogoUploader';
import { PresetGallery } from './PresetGallery';
import { RangeControl } from './RangeControl';
import {
  backgroundPatterns,
  bodyStyles,
  eyeBallStyles,
  eyeFrameStyles,
  gradientTypes,
} from '../data/designSystem';

const quickLinks = [
  { id: 'assets', label: 'Assets' },
  { id: 'templates', label: 'Templates' },
  { id: 'template-fields', label: 'Template' },
  { id: 'logo', label: 'Logo' },
  { id: 'styles', label: 'Styles' },
  { id: 'qr-presets', label: 'QR Presets' },
];

function SectionShell({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5">
      <div className="space-y-1">
        <p className="label">{eyebrow}</p>
        <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PresetAssetLibrary({ assets }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData(
            'application/x-canvas-element',
            JSON.stringify({
              type: 'text',
              text: 'Your text here',
              width: 0.28,
              height: 0.12,
              fontFamily: 'Manrope, sans-serif',
              fontSize: 28,
              fontWeight: 700,
              fontStyle: 'normal',
              color: '#ffffff',
              textAlign: 'center',
              letterSpacing: 0,
              lineHeight: 1.2,
              lockAspectRatio: false,
              rotation: 0,
            }),
          );
          event.dataTransfer.effectAllowed = 'copy';
        }}
        className="group flex aspect-square cursor-grab flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-cyan-300/30 bg-cyan-400/10 p-3 text-center transition hover:border-cyan-300/50 hover:bg-cyan-400/15 active:cursor-grabbing"
      >
        <div className="rounded-2xl border border-cyan-200/40 bg-slate-950/60 px-3 py-2 text-base font-extrabold text-white">
          T
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">Text Box</p>
      </div>

      {assets.length ? (
        assets.map((asset) => (
          <div
            key={asset.fileName}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/preset-asset-url', asset.previewImage);
              event.dataTransfer.setData('text/plain', asset.previewImage);
              event.dataTransfer.effectAllowed = 'copy';
            }}
            className="group flex aspect-square cursor-grab items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2 transition hover:border-cyan-300/40 active:cursor-grabbing"
          >
            <img src={asset.previewImage} alt={asset.name} className="h-full w-full select-none object-contain transition group-hover:scale-[1.02]" />
          </div>
        ))
      ) : (
        <div className="col-span-2 rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
          Add images to the `preset` folder to see draggable assets here.
        </div>
      )}
    </div>
  );
}

export function SidebarControls({
  design,
  templates,
  qrPresets,
  folderPresets,
  onChange,
  onChangeTemplateTextValue,
  onApplyPreset,
  onUploadLogo,
  onClearLogo,
  onRandomizeSeed,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  return (
    <aside className="panel flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label">Controls</p>
            <h2 className="mt-1 font-display text-xl font-bold text-white">Build while the preview stays pinned</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCw size={16} />
            </button>
            <button
              type="button"
              onClick={onRandomizeSeed}
              className="rounded-full border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-200 transition hover:bg-cyan-400/20"
            >
              <Shuffle size={16} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {quickLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:bg-white/10"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="designer-scroll flex-1 space-y-5 overflow-y-auto px-5 py-5 lg:px-6">
        <SectionShell id="assets" eyebrow="Preset Assets" title="Drop these straight onto the QR preview">
          <PresetAssetLibrary assets={folderPresets} />
        </SectionShell>

        <SectionShell id="templates" eyebrow="Template Selection" title="Choose the overall design template">
          <PresetGallery
            presets={templates}
            onApplyPreset={onApplyPreset}
            eyebrow="Templates"
            title="Generated and curated layout templates"
            emptyMessage="No templates available yet."
          />
        </SectionShell>

        {design.templateMode === 'image-derived' && design.templateDefinition ? (
          <SectionShell id="template-fields" eyebrow="Template Fields" title="Edit detected text regions from the generated template">
            <div className="grid gap-4">
              {design.templateDefinition.editableFields?.map((field) => (
                <label key={field.id} className="space-y-2">
                  <span className="label">{field.id}</span>
                  <input
                    className="input"
                    value={design.templateTextValues?.[field.id] ?? field.default ?? ''}
                    onChange={(event) => onChangeTemplateTextValue(field.id, event.target.value)}
                  />
                </label>
              ))}
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                The QR placeholder area and editable text come from the generated `template.json` structure.
              </div>
            </div>
          </SectionShell>
        ) : null}

        <SectionShell id="logo" eyebrow="Logo" title="Upload or drop a center image">
          <LogoUploader logoSrc={design.logoSrc} onUpload={onUploadLogo} onClear={onClearLogo} />
          <div className="mt-5 grid gap-4">
            <RangeControl label="Logo Size" min={52} max={180} value={design.logoSize} onChange={(value) => onChange('logoSize', value)} />
            <RangeControl label="Logo Radius" min={0} max={56} value={design.logoRadius} onChange={(value) => onChange('logoRadius', value)} />
            <RangeControl label="Logo Padding" min={0} max={40} value={design.logoPadding} onChange={(value) => onChange('logoPadding', value)} />
          </div>
        </SectionShell>

        <SectionShell id="styles" eyebrow="QR Style" title="Shape, color, and background">
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="label">Body Shape</span>
                <select className="select" value={design.bodyStyle} onChange={(event) => onChange('bodyStyle', event.target.value)}>
                  {bodyStyles.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="label">Eye Frame Shape</span>
                <select className="select" value={design.eyeFrameStyle} onChange={(event) => onChange('eyeFrameStyle', event.target.value)}>
                  {eyeFrameStyles.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="label">Eye Ball Shape</span>
                <select className="select" value={design.eyeBallStyle} onChange={(event) => onChange('eyeBallStyle', event.target.value)}>
                  {eyeBallStyles.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="label">Gradient Type</span>
                <select className="select" value={design.gradientType} onChange={(event) => onChange('gradientType', event.target.value)}>
                  {gradientTypes.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="label">Foreground Type</span>
                <select className="select" value={design.foregroundType} onChange={(event) => onChange('foregroundType', event.target.value)}>
                  <option value="solid">Solid</option>
                  <option value="gradient">Gradient</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="label">Background Type</span>
                <select className="select" value={design.backgroundType} onChange={(event) => onChange('backgroundType', event.target.value)}>
                  <option value="solid">Solid</option>
                  <option value="transparent">Transparent</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="label">Solid Foreground</span>
                <input className="input h-14 cursor-pointer p-2" type="color" value={design.foreground} onChange={(event) => onChange('foreground', event.target.value)} />
              </label>
              <label className="space-y-2">
                <span className="label">Background Color</span>
                <input className="input h-14 cursor-pointer p-2" type="color" value={design.backgroundColor} onChange={(event) => onChange('backgroundColor', event.target.value)} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="label">Gradient Start</span>
                <input className="input h-14 cursor-pointer p-2" type="color" value={design.gradientStart} onChange={(event) => onChange('gradientStart', event.target.value)} />
              </label>
              <label className="space-y-2">
                <span className="label">Gradient End</span>
                <input className="input h-14 cursor-pointer p-2" type="color" value={design.gradientEnd} onChange={(event) => onChange('gradientEnd', event.target.value)} />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" checked={design.useCustomEyeColor} onChange={(event) => onChange('useCustomEyeColor', event.target.checked)} />
              Use custom eye colors
            </label>

            {design.useCustomEyeColor ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="label">Eye Frame Color</span>
                  <input className="input h-14 cursor-pointer p-2" type="color" value={design.eyeFrameColor} onChange={(event) => onChange('eyeFrameColor', event.target.value)} />
                </label>
                <label className="space-y-2">
                  <span className="label">Eye Ball Color</span>
                  <input className="input h-14 cursor-pointer p-2" type="color" value={design.eyeBallColor} onChange={(event) => onChange('eyeBallColor', event.target.value)} />
                </label>
              </div>
            ) : null}

            <label className="space-y-2">
              <span className="label">Background Pattern</span>
              <select className="select" value={design.backgroundPattern} onChange={(event) => onChange('backgroundPattern', event.target.value)}>
                {backgroundPatterns.map((pattern) => (
                  <option key={pattern} value={pattern}>{pattern}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="label">Preview Overlay</span>
              <select className="select" value={design.previewOverlay} onChange={(event) => onChange('previewOverlay', event.target.value)}>
                <option value="lines">Diagonal lines</option>
                <option value="mesh">Mesh overlay</option>
                <option value="none">None</option>
              </select>
            </label>

            <RangeControl label="Watermark Strength" min={0.08} max={0.3} step={0.01} value={design.watermarkOpacity} onChange={(value) => onChange('watermarkOpacity', value)} />
            <RangeControl label="Quiet Zone" min={56} max={120} value={design.quietZone} onChange={(value) => onChange('quietZone', value)} />
          </div>
        </SectionShell>

        <SectionShell id="qr-presets" eyebrow="QR Presets" title="Change the QR styling without changing the template">
          <PresetGallery
            presets={qrPresets}
            onApplyPreset={onApplyPreset}
            eyebrow="QR Presets"
            title="Saved QR design looks"
            emptyMessage="No QR presets available yet."
          />
        </SectionShell>
      </div>
    </aside>
  );
}
