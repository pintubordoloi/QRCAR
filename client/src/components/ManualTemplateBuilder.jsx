import { useMemo, useRef, useState } from 'react';
import { Copy, Layers, Plus, Save, Trash2, Upload } from 'lucide-react';
import { RangeControl } from './RangeControl';
import { TemplateBuilderCanvas } from './TemplateBuilderCanvas';
import {
  buildManualTemplatePayload,
  createTemplateElement,
  defaultTemplateNameFromFile,
  templateElementsFromCanvas,
} from '../utils/manualTemplates';

const FONT_OPTIONS = [
  { label: 'Manrope', value: 'Manrope, sans-serif' },
  { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAbsoluteElement(element, dimensions) {
  return {
    ...element,
    x: element.x / dimensions.width,
    y: element.y / dimensions.height,
    width: element.width / dimensions.width,
    height: element.height / dimensions.height,
    rotation: element.rotation ?? 0,
  };
}

function denormalizeValue(value, max) {
  return Math.round(value * max);
}

function loadImageDimensions(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = dataUrl;
  });
}

export function ManualTemplateBuilder({ templates, onSaveTemplate, onDeleteTemplate }) {
  const fileInputRef = useRef(null);
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedElementId) ?? null,
    [elements, selectedElementId],
  );

  const updateElement = (id, updates) => {
    setElements((current) => current.map((element) => (element.id === id ? { ...element, ...updates } : element)));
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const src = String(reader.result || '');
      const nextDimensions = await loadImageDimensions(src);
      setBackgroundImage(src);
      setDimensions(nextDimensions);
      setTemplateName((current) => current || defaultTemplateNameFromFile(file.name));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateElement = ({ type, ...bounds }) => {
    const nextIndex = elements.length;
    const element = createTemplateElement(type, {
      x: bounds.x * dimensions.width,
      y: bounds.y * dimensions.height,
      width: bounds.width * dimensions.width,
      height: bounds.height * dimensions.height,
    }, nextIndex);

    const normalized = normalizeAbsoluteElement(element, dimensions);
    setElements((current) => {
      const withoutQr = type === 'qr' ? current.filter((item) => item.type !== 'qr') : current;
      return [...withoutQr, { ...normalized, layer: withoutQr.length }];
    });
    setSelectedElementId(element.id);
    setStatusMessage(`${type.toUpperCase()} region added.`);
  };

  const addQuickElement = (type) => {
    if (!backgroundImage) {
      window.alert('Upload a background image first.');
      return;
    }

    const presets = {
      text: { x: 0.14, y: 0.1, width: 0.34, height: 0.12 },
      qr: { x: 0.36, y: 0.28, width: 0.28, height: 0.28 },
      image: { x: 0.72, y: 0.12, width: 0.18, height: 0.18 },
    };

    handleCreateElement({
      type,
      ...presets[type],
    });
  };

  const handleLoadTemplate = (template) => {
    setTemplateId(template.id);
    setTemplateName(template.templateName);
    setCategory(template.category || '');
    setBackgroundImage(template.backgroundImage);
    setDimensions({ width: template.width, height: template.height });
    setElements((template.elements ?? []).map((element, index) => ({
      ...normalizeAbsoluteElement(element, { width: template.width, height: template.height }),
      layer: element.layer ?? index,
    })));
    setSelectedElementId(null);
    setStatusMessage(`Loaded template: ${template.templateName}`);
  };

  const clearBuilder = () => {
    setTemplateId('');
    setTemplateName('');
    setCategory('');
    setBackgroundImage('');
    setDimensions({ width: 1200, height: 800 });
    setElements([]);
    setSelectedElementId(null);
    setStatusMessage('');
  };

  const duplicateSelected = () => {
    if (!selectedElement) return;
    const duplicate = {
      ...selectedElement,
      id: `${selectedElement.type}_${Date.now().toString(36)}`,
      x: clamp(selectedElement.x + 0.02, 0, 1 - selectedElement.width),
      y: clamp(selectedElement.y + 0.02, 0, 1 - selectedElement.height),
      layer: elements.length,
    };
    setElements((current) => [...current, duplicate]);
    setSelectedElementId(duplicate.id);
  };

  const bringForward = () => {
    if (!selectedElement) return;
    const ordered = [...elements].sort((a, b) => a.layer - b.layer);
    const index = ordered.findIndex((item) => item.id === selectedElement.id);
    if (index < 0 || index === ordered.length - 1) return;
    [ordered[index], ordered[index + 1]] = [ordered[index + 1], ordered[index]];
    setElements(ordered.map((element, layer) => ({ ...element, layer })));
  };

  const sendBackward = () => {
    if (!selectedElement) return;
    const ordered = [...elements].sort((a, b) => a.layer - b.layer);
    const index = ordered.findIndex((item) => item.id === selectedElement.id);
    if (index <= 0) return;
    [ordered[index], ordered[index - 1]] = [ordered[index - 1], ordered[index]];
    setElements(ordered.map((element, layer) => ({ ...element, layer })));
  };

  const handleSave = async () => {
    if (!templateName.trim() || !backgroundImage) {
      window.alert('Upload a background image and name the template before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildManualTemplatePayload({
        id: templateId,
        templateName,
        category,
        backgroundImage,
        width: dimensions.width,
        height: dimensions.height,
        elements: templateElementsFromCanvas(elements, dimensions),
      });

      const saved = await onSaveTemplate(payload);
      setTemplateId(saved.id);
      setStatusMessage(`Saved template: ${saved.templateName}`);
    } catch (error) {
      console.error(error);
      window.alert('Could not save the template. Make sure the backend is running.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label">Template Builder</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-white">Create reusable editable templates</h3>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Upload a blank background, drag to draw regions on top of it, choose whether each one is text, QR, or image/logo, then save the template for customers to edit later.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={clearBuilder} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5">
            New Template
          </button>
          {templateId ? (
            <button
              type="button"
              onClick={async () => {
                const confirmed = window.confirm(`Delete template "${templateName}"?`);
                if (!confirmed) return;
                await onDeleteTemplate(templateId);
                clearBuilder();
                setStatusMessage(`Deleted template: ${templateName}`);
              }}
              className="flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
            >
              <Trash2 size={16} />
              Delete Current Template
            </button>
          ) : null}
          <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-4">
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/90 p-4 backdrop-blur">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20">
              <Upload size={16} />
              Upload Background
            </button>
            <button type="button" onClick={() => addQuickElement('text')} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              <Plus size={16} />
              Text Box
            </button>
            <button type="button" onClick={() => addQuickElement('qr')} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              <Plus size={16} />
              QR Region
            </button>
            <button type="button" onClick={() => addQuickElement('image')} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              <Plus size={16} />
              Image Slot
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(event) => {
                const [file] = event.target.files ?? [];
                handleUpload(file);
              }}
            />
            <div className="text-sm text-slate-400">
              Use the quick buttons for instant regions, or drag on the canvas to draw a custom box and choose its type.
            </div>
          </div>

          {statusMessage ? (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {statusMessage}
            </div>
          ) : null}

          <TemplateBuilderCanvas
            backgroundImage={backgroundImage}
            elements={elements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onChangeElements={setElements}
            onCreateElement={handleCreateElement}
            onDeleteElement={(elementId) => {
              setElements((current) => current.filter((element) => element.id !== elementId));
              if (selectedElementId === elementId) {
                setSelectedElementId(null);
              }
            }}
          />
        </div>

        <div className="designer-scroll space-y-4 overflow-y-auto xl:max-h-[72vh] xl:pr-1">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <label className="space-y-2">
              <span className="label">Template Name</span>
              <input className="input" value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Driver Profile Hero" />
            </label>
            <label className="mt-4 space-y-2">
              <span className="label">Category</span>
              <input className="input" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Transport / Automotive / Hospitality" />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-slate-950/50 px-3 py-3">
                Width: <span className="text-white">{dimensions.width}px</span>
              </div>
              <div className="rounded-2xl bg-slate-950/50 px-3 py-3">
                Height: <span className="text-white">{dimensions.height}px</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="label">Selection</p>
              {selectedElement ? (
                <div className="flex gap-2">
                  <button type="button" onClick={duplicateSelected} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/10">
                    <Copy size={12} className="inline-block" /> Duplicate
                  </button>
                  <button type="button" onClick={() => {
                    setElements((current) => current.filter((element) => element.id !== selectedElement.id));
                    setSelectedElementId(null);
                  }} className="rounded-full border border-rose-300/20 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/20">
                    <Trash2 size={12} className="inline-block" /> Delete
                  </button>
                </div>
              ) : null}
            </div>

            {selectedElement ? (
              <div className="mt-4 space-y-4">
                <label className="space-y-2">
                  <span className="label">Region Id</span>
                  <input className="input" value={selectedElement.id} onChange={(event) => updateElement(selectedElement.id, { id: event.target.value })} />
                </label>

                <label className="space-y-2">
                  <span className="label">Type</span>
                  <select
                    className="select"
                    value={selectedElement.type}
                    onChange={(event) => updateElement(selectedElement.id, { type: event.target.value })}
                  >
                    <option value="text">Text</option>
                    <option value="qr">QR</option>
                    <option value="image">Image / Logo</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['x', selectedElement.x, dimensions.width],
                    ['y', selectedElement.y, dimensions.height],
                    ['width', selectedElement.width, dimensions.width],
                    ['height', selectedElement.height, dimensions.height],
                  ].map(([field, value, max]) => (
                    <label key={field} className="space-y-2">
                      <span className="label">{field}</span>
                      <input
                        className="input"
                        type="number"
                        value={denormalizeValue(value, max)}
                        onChange={(event) => updateElement(selectedElement.id, {
                          [field]: clamp(Number(event.target.value) / max, 0, 1),
                        })}
                      />
                    </label>
                  ))}
                </div>

                {selectedElement.type === 'text' ? (
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <label className="space-y-2">
                      <span className="label">Default Text</span>
                      <textarea className="input min-h-24 resize-y" value={selectedElement.text ?? ''} onChange={(event) => updateElement(selectedElement.id, { text: event.target.value })} />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-2">
                        <span className="label">Color</span>
                        <input className="input h-14 cursor-pointer p-2" type="color" value={selectedElement.color ?? '#ffffff'} onChange={(event) => updateElement(selectedElement.id, { color: event.target.value })} />
                      </label>
                      <label className="space-y-2">
                        <span className="label">Alignment</span>
                        <select className="select" value={selectedElement.textAlign ?? 'center'} onChange={(event) => updateElement(selectedElement.id, { textAlign: event.target.value })}>
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </label>
                    </div>
                    <label className="space-y-2">
                      <span className="label">Font Family</span>
                      <select className="select" value={selectedElement.fontFamily ?? 'Manrope, sans-serif'} onChange={(event) => updateElement(selectedElement.id, { fontFamily: event.target.value })}>
                        {FONT_OPTIONS.map((font) => (
                          <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                      </select>
                    </label>
                    <RangeControl label="Font Size" min={14} max={96} value={selectedElement.fontSize ?? 32} onChange={(value) => updateElement(selectedElement.id, { fontSize: value })} />
                    <RangeControl label="Font Weight" min={400} max={900} step={100} value={selectedElement.fontWeight ?? 700} onChange={(value) => updateElement(selectedElement.id, { fontWeight: value })} />
                  </div>
                ) : null}

                {selectedElement.type === 'image' ? (
                  <label className="space-y-2">
                    <span className="label">Placeholder Label</span>
                    <input className="input" value={selectedElement.placeholderLabel ?? 'Upload image'} onChange={(event) => updateElement(selectedElement.id, { placeholderLabel: event.target.value })} />
                  </label>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={bringForward} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                    <Layers size={16} /> Bring Forward
                  </button>
                  <button type="button" onClick={sendBackward} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                    <Layers size={16} /> Send Backward
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                  {[
                    ['draggable', 'Draggable'],
                    ['resizable', 'Resizable'],
                    ['deletable', 'Deletable'],
                    ['locked', 'Locked'],
                  ].map(([field, label]) => (
                    <label key={field} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                      <input type="checkbox" checked={Boolean(selectedElement[field])} onChange={(event) => updateElement(selectedElement.id, { [field]: event.target.checked })} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Select a region to edit its properties, styling, and interaction flags.</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="label">Saved Templates</p>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{templates.length}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {templates.length ? templates.map((template) => (
                <div
                  key={template.id}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 transition hover:border-cyan-300/40 hover:bg-white/5"
                >
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = window.confirm(`Delete template "${template.templateName}"?`);
                      if (!confirmed) return;
                      await onDeleteTemplate(template.id);
                      if (template.id === templateId) {
                        clearBuilder();
                      }
                      setStatusMessage(`Deleted template: ${template.templateName}`);
                    }}
                    className="absolute right-3 top-3 z-10 rounded-full border border-rose-300/20 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/20"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadTemplate(template)}
                    className="block w-full text-left"
                  >
                    <img src={template.previewImage || template.backgroundImage} alt={template.templateName} className="h-32 w-full object-cover" />
                    <div className="p-4">
                      <p className="font-semibold text-white">{template.templateName}</p>
                      <p className="mt-1 text-sm text-slate-400">{template.category || 'Uncategorized'}</p>
                    </div>
                  </button>
                  <div className="flex gap-2 border-t border-white/10 p-3">
                    <button
                      type="button"
                      onClick={() => handleLoadTemplate(template)}
                      className="flex-1 rounded-2xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                    >
                      Load
                    </button>
                  </div>
                </div>
              )) : (
                <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
                  Saved templates will appear here once you save your first builder layout.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
