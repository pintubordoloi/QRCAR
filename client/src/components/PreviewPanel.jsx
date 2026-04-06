import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, Eye, Send, Trash2, Unlock, Lock } from 'lucide-react';
import { DesignCanvas } from './DesignCanvas';
import { RangeControl } from './RangeControl';

const FONT_OPTIONS = [
  { label: 'Manrope', value: 'Manrope, sans-serif' },
  { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
];

function getForbiddenQrRect(design) {
  if ((design.templateMode === 'image-derived' || design.templateMode === 'manual-builder') && design.templateDefinition?.qr) {
    const { qr, width, height } = design.templateDefinition;
    return {
      x: qr.x / width,
      y: qr.y / height,
      width: qr.width / width,
      height: qr.height / height,
    };
  }

  if (design.posterEnabled) {
    return {
      x: 270 / 960,
      y: 196 / 760,
      width: 420 / 960,
      height: 420 / 760,
    };
  }

  return {
    x: 84 / 640,
    y: 84 / 640,
    width: 472 / 640,
    height: 472 / 640,
  };
}

export function PreviewPanel({
  svgMarkup,
  design,
  onExportPng,
  onExportSvg,
  onOpenSubmit,
  activeView,
  onChangeView,
  onDropPresetAsset,
  onCommitCanvasElements,
  onDeleteCanvasElement,
  onClearCanvasElements,
  onBringForward,
  onSendBackward,
  onToggleAspectLock,
  onUpdateCanvasElement,
}) {
  const [selectedElementId, setSelectedElementId] = useState(null);
  const imageUploadRef = useRef(null);

  useEffect(() => {
    if (!design.canvasElements?.some((element) => element.id === selectedElementId)) {
      setSelectedElementId(null);
    }
  }, [design.canvasElements, selectedElementId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' && selectedElementId) {
        onDeleteCanvasElement(selectedElementId);
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDeleteCanvasElement, selectedElementId]);

  const selectedElement = useMemo(
    () => design.canvasElements?.find((element) => element.id === selectedElementId) ?? null,
    [design.canvasElements, selectedElementId],
  );
  const forbiddenRect = useMemo(() => getForbiddenQrRect(design), [design]);
  const newElementSize = useMemo(
    () => ({
      width: design.posterEnabled ? 0.12 : 0.16,
      height: design.posterEnabled ? 0.12 : 0.16,
    }),
    [design.posterEnabled],
  );
  const selectedElementLabel =
    selectedElement?.type === 'text'
      ? 'Text box'
      : selectedElement?.type === 'image'
        ? 'Image / Logo'
        : 'Canvas element';

  return (
    <section className="panel relative flex h-full min-h-0 flex-col overflow-hidden p-5 lg:sticky lg:top-6 lg:p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/8 via-transparent to-orange-300/8" />
      <div className="relative z-10 flex h-full min-h-0 flex-col space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="label">Preview</p>
            <h2 className="font-display text-2xl font-bold text-white">Interactive design canvas</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onChangeView('designer')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeView === 'designer'
                  ? 'bg-white text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              Designer
            </button>
            <button
              type="button"
              onClick={() => onChangeView('admin')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeView === 'admin'
                  ? 'bg-white text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              Admin View
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="panel relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[2rem] border-white/10 bg-slate-950/60 p-4 shadow-glow xl:min-h-0">
            <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className={`${design.backgroundType === 'transparent' ? 'checker-bg' : ''} rounded-[2rem] p-3`}>
              <DesignCanvas
                svgMarkup={svgMarkup}
                elements={design.canvasElements ?? []}
                selectedElementId={selectedElementId}
                forbiddenRect={forbiddenRect}
                newElementSize={newElementSize}
                onSelectElement={setSelectedElementId}
                onDropAsset={onDropPresetAsset}
                onCommitElements={onCommitCanvasElements}
                onDeleteElement={(elementId) => {
                  onDeleteCanvasElement(elementId);
                  if (selectedElementId === elementId) {
                    setSelectedElementId(null);
                  }
                }}
              />
            </div>
          </div>

          <div className="designer-scroll space-y-4 overflow-y-auto xl:pr-1">
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <p className="label">Canvas Tips</p>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Drag preset assets anywhere onto the poster.</p>
                <p>Click an element to select it.</p>
                <p>Drag to move, use corners to resize, and the top handle to rotate.</p>
                <p>Text boxes stay outside the real QR area, just like dropped assets.</p>
                <p>Press `Delete` to remove the selected element.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="label">Selection</p>
                {design.canvasElements?.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClearCanvasElements();
                      setSelectedElementId(null);
                    }}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                  >
                    Clear canvas items
                  </button>
                ) : null}
              </div>

              {selectedElement ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>Selected</span>
                      <span className="text-white">{selectedElementLabel}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Rotation</span>
                      <span className="text-white">{Math.round(selectedElement.rotation)}deg</span>
                    </div>
                  </div>

                  {selectedElement.type === 'text' ? (
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="space-y-2">
                        <span className="label">Text</span>
                        <textarea
                          className="input min-h-24 resize-y"
                          value={selectedElement.text ?? ''}
                          onChange={(event) => onUpdateCanvasElement(selectedElement.id, { text: event.target.value })}
                          placeholder="Type your message"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="label">Font</span>
                        <select
                          className="select"
                          value={selectedElement.fontFamily ?? 'Manrope, sans-serif'}
                          onChange={(event) => onUpdateCanvasElement(selectedElement.id, { fontFamily: event.target.value })}
                        >
                          {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                          ))}
                        </select>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-2">
                          <span className="label">Color</span>
                          <input
                            className="input h-14 cursor-pointer p-2"
                            type="color"
                            value={selectedElement.color ?? '#ffffff'}
                            onChange={(event) => onUpdateCanvasElement(selectedElement.id, { color: event.target.value })}
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="label">Align</span>
                          <select
                            className="select"
                            value={selectedElement.textAlign ?? 'center'}
                            onChange={(event) => onUpdateCanvasElement(selectedElement.id, { textAlign: event.target.value })}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-2">
                          <span className="label">Weight</span>
                          <select
                            className="select"
                            value={String(selectedElement.fontWeight ?? 700)}
                            onChange={(event) => onUpdateCanvasElement(selectedElement.id, { fontWeight: Number(event.target.value) })}
                          >
                            <option value="400">Regular</option>
                            <option value="500">Medium</option>
                            <option value="600">Semibold</option>
                            <option value="700">Bold</option>
                            <option value="800">Extra Bold</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                          <input
                            type="checkbox"
                            checked={(selectedElement.fontStyle ?? 'normal') === 'italic'}
                            onChange={(event) =>
                              onUpdateCanvasElement(selectedElement.id, { fontStyle: event.target.checked ? 'italic' : 'normal' })
                            }
                          />
                          Italic
                        </label>
                      </div>

                      <RangeControl
                        label="Font Size"
                        min={14}
                        max={96}
                        value={selectedElement.fontSize ?? 28}
                        onChange={(value) => onUpdateCanvasElement(selectedElement.id, { fontSize: value })}
                      />
                      <RangeControl
                        label="Letter Spacing"
                        min={-1}
                        max={8}
                        step={0.5}
                        value={selectedElement.letterSpacing ?? 0}
                        onChange={(value) => onUpdateCanvasElement(selectedElement.id, { letterSpacing: value })}
                      />
                      <RangeControl
                        label="Line Height"
                        min={0.9}
                        max={1.8}
                        step={0.05}
                        value={selectedElement.lineHeight ?? 1.2}
                        onChange={(value) => onUpdateCanvasElement(selectedElement.id, { lineHeight: value })}
                      />
                    </div>
                  ) : null}

                  {selectedElement.type === 'image' ? (
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <input
                        ref={imageUploadRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const [file] = event.target.files ?? [];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => onUpdateCanvasElement(selectedElement.id, { url: reader.result });
                          reader.readAsDataURL(file);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => imageUploadRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                      >
                        {selectedElement.url ? 'Replace image' : 'Upload image'}
                      </button>
                      <label className="space-y-2">
                        <span className="label">Placeholder Label</span>
                        <input
                          className="input"
                          value={selectedElement.placeholderLabel ?? 'Upload image'}
                          onChange={(event) => onUpdateCanvasElement(selectedElement.id, { placeholderLabel: event.target.value })}
                        />
                      </label>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onBringForward(selectedElement.id)}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                    >
                      <ArrowUp size={16} />
                      Bring forward
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendBackward(selectedElement.id)}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                    >
                      <ArrowDown size={16} />
                      Send backward
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleAspectLock(selectedElement.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    {selectedElement.lockAspectRatio ? <Lock size={16} /> : <Unlock size={16} />}
                    {selectedElement.lockAspectRatio ? 'Keep aspect ratio' : 'Free resize'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDeleteCanvasElement(selectedElement.id);
                      setSelectedElementId(null);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-3 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
                  >
                    <Trash2 size={16} />
                    Delete element
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Select a dropped image or text box to edit, layer, or delete it.</p>
              )}
            </div>

            <button
              type="button"
              onClick={onExportPng}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.01]"
            >
              <Download size={18} />
              Download Low-Quality PNG
            </button>
            <button
              type="button"
              onClick={onExportSvg}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              <Eye size={18} />
              Export SVG Preview
            </button>
            <button
              type="button"
              onClick={onOpenSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-orange-300 px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.01]"
            >
              <Send size={18} />
              Send Design
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
