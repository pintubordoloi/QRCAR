import { useEffect, useMemo, useState } from 'react';
import { SidebarControls } from './components/SidebarControls';
import { PreviewPanel } from './components/PreviewPanel';
import { ManualTemplateBuilder } from './components/ManualTemplateBuilder';
import { useHistory } from './hooks/useHistory';
import { exportPng, exportSvg } from './utils/exportDesign';
import { buildQrSvg } from './utils/svgBuilder';
import { initialDesign } from './data/designSystem';
import { presets as builtInPresets } from './data/presets';
import { manualTemplateToPreset } from './utils/manualTemplates';
import {
  readLocalManualTemplates,
  readLocalPresets,
  readLocalSubmissions,
  writeLocalManualTemplates,
  writeLocalPresets,
  writeLocalSubmissions,
} from './utils/localData';

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').trim().replace(/\/+$/, '');
const API_URL = API_BASE ? `${API_BASE}/api` : '';
const QR_PRESET_FIELDS = [
  'seed',
  'bodyStyle',
  'eyeFrameStyle',
  'eyeBallStyle',
  'foregroundType',
  'foreground',
  'gradientStart',
  'gradientEnd',
  'gradientType',
  'useCustomEyeColor',
  'eyeFrameColor',
  'eyeBallColor',
  'backgroundType',
  'backgroundColor',
  'backgroundPattern',
  'logoSrc',
  'logoSize',
  'logoRadius',
  'logoPadding',
  'watermarkOpacity',
  'moduleDensity',
  'quietZone',
  'previewOverlay',
  'presetImageSrc',
];

function applyQrPresetToDesign(currentDesign, preset) {
  const nextDesign = { ...currentDesign };

  for (const field of QR_PRESET_FIELDS) {
    if (preset.design?.[field] !== undefined) {
      nextDesign[field] = preset.design[field];
    }
  }

  if (preset.previewImage && preset.useImageAsLogo) {
    nextDesign.logoSrc = preset.previewImage;
  }

  if (preset.previewImage) {
    nextDesign.presetImageSrc = preset.previewImage;
  }

  return nextDesign;
}

function SubmitModal({ isOpen, onClose, onSubmit, loading }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPhone('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="panel w-full max-w-xl p-6">
        <div className="space-y-2">
          <p className="label">Submit Design</p>
          <h3 className="font-display text-2xl font-bold text-white">Send this visual concept</h3>
          <p className="text-sm text-slate-300">
            The backend receives a low-quality preview plus the current design settings. No real QR data is ever created.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="space-y-2">
            <span className="label">Customer Name</span>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional" />
          </label>
          <label className="space-y-2">
            <span className="label">Phone Number</span>
            <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional" />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 px-4 py-3 font-semibold text-slate-200 transition hover:bg-white/5">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit({ customerName: name, phone })}
            disabled={loading}
            className="rounded-2xl bg-gradient-to-r from-cyan-400 to-orange-300 px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Design'}
          </button>
        </div>
      </div>
    </div>
  );
}

function backendEnabled() {
  return Boolean(API_URL);
}

function AdminPresetManager({ design, folderPresets, presetFolderPath, onRefresh }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailSrc, setThumbnailSrc] = useState('');
  const [useImageAsLogo, setUseImageAsLogo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const readFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setThumbnailSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event) => {
    const [file] = event.target.files ?? [];
    readFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const [file] = event.dataTransfer.files ?? [];
    readFile(file);
  };

  const handleCreatePreset = async () => {
    if (!name.trim()) {
      alert('Preset name is required.');
      return;
    }

    setSaving(true);
    try {
      const payloadDesign = {
        ...design,
        presetImageSrc: thumbnailSrc || design.presetImageSrc || '',
        logoSrc: useImageAsLogo && thumbnailSrc ? thumbnailSrc : design.logoSrc,
      };

      const response = await fetch(`${API_URL}/presets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || 'Admin uploaded preset',
          previewImage: thumbnailSrc,
          useImageAsLogo,
          design: payloadDesign,
        }),
      });

      if (!response.ok) throw new Error('Failed to save preset');

      setName('');
      setDescription('');
      setThumbnailSrc('');
      setUseImageAsLogo(true);
      await onRefresh();
    } catch (error) {
      if (!backendEnabled()) {
        const presets = readLocalPresets();
        const preset = {
          id: crypto.randomUUID(),
          name,
          description: description || 'Admin uploaded preset',
          previewImage: thumbnailSrc,
          useImageAsLogo,
          design: {
            ...design,
            presetImageSrc: thumbnailSrc || design.presetImageSrc || '',
            logoSrc: useImageAsLogo && thumbnailSrc ? thumbnailSrc : design.logoSrc,
          },
          source: 'Admin',
          createdAt: new Date().toISOString(),
        };
        writeLocalPresets([preset, ...presets]);
        setName('');
        setDescription('');
        setThumbnailSrc('');
        setUseImageAsLogo(true);
        await onRefresh();
        return;
      }
      console.error(error);
      alert('Could not save the preset.');
    } finally {
      setSaving(false);
    }
  };

  const importFolderPreset = async (preset) => {
    setSaving(true);
    try {
      const payloadDesign = {
        ...design,
        presetImageSrc: preset.previewImage,
        logoSrc: useImageAsLogo ? preset.previewImage : design.logoSrc,
      };

      const response = await fetch(`${API_URL}/presets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: preset.name,
          description: preset.description,
          previewImage: preset.previewImage,
          useImageAsLogo,
          design: payloadDesign,
        }),
      });

      if (!response.ok) throw new Error('Failed to import folder preset');

      await onRefresh();
    } catch (error) {
      if (!backendEnabled()) {
        const presets = readLocalPresets();
        const localPreset = {
          id: crypto.randomUUID(),
          name: preset.name,
          description: preset.description,
          previewImage: preset.previewImage,
          useImageAsLogo,
          design: {
            ...design,
            presetImageSrc: preset.previewImage,
            logoSrc: useImageAsLogo ? preset.previewImage : design.logoSrc,
          },
          source: 'Admin',
          createdAt: new Date().toISOString(),
        };
        writeLocalPresets([localPreset, ...presets]);
        await onRefresh();
        return;
      }
      console.error(error);
      alert('Could not import preset from the preset folder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <div className="space-y-2">
        <p className="label">Admin Presets</p>
        <h3 className="font-display text-xl font-bold text-white">Import presets from drag and drop or the preset folder</h3>
        <p className="text-sm text-slate-400">
          Add your preset assets by dropping an image here, or place files into the local preset folder and import them from the list below.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="label">Preset Name</span>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Luxury Brand Pack" />
        </label>
        <label className="space-y-2">
          <span className="label">Preset Description</span>
          <input className="input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Gold style with uploaded logo" />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer items-center justify-center rounded-3xl border border-dashed px-4 py-8 text-center transition ${
            dragActive
              ? 'border-cyan-300/60 bg-cyan-400/10'
              : 'border-white/15 bg-slate-950/50 hover:border-cyan-300/40 hover:bg-white/5'
          }`}
        >
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <div className="space-y-2">
            <p className="font-semibold text-white">{thumbnailSrc ? 'Replace preset image' : 'Drop preset image or click to upload'}</p>
            <p className="text-sm text-slate-400">Used for the preset thumbnail, and optionally as the center logo.</p>
          </div>
        </label>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
          {thumbnailSrc ? (
            <img src={thumbnailSrc} alt="Preset thumbnail" className="h-40 w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
              No image uploaded
            </div>
          )}
        </div>
      </div>

      <label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
        <input type="checkbox" checked={useImageAsLogo} onChange={(event) => setUseImageAsLogo(event.target.checked)} />
        Apply uploaded image as center logo when this preset is used
      </label>

      <button
        type="button"
        onClick={handleCreatePreset}
        disabled={saving}
        className="mt-4 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60"
      >
        {saving ? 'Saving preset...' : 'Save Current Design as Admin Preset'}
      </button>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="label">Preset Folder</p>
            <p className="mt-1 text-sm text-slate-400">{presetFolderPath || '/Users/dango/Documents/QR Scanner/preset'}</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {folderPresets.length} files found
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {folderPresets.length ? (
            folderPresets.map((preset) => (
              <div key={preset.fileName} className="rounded-3xl border border-white/10 bg-white/5 p-3">
                <img src={preset.previewImage} alt={preset.name} className="h-28 w-full rounded-2xl object-cover" />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{preset.name}</p>
                    <p className="truncate text-xs text-slate-400">{preset.fileName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => importFolderPreset(preset)}
                    disabled={saving}
                    className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    Import
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
              Add PNG, JPG, SVG, or WEBP files to the preset folder and they’ll appear here.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminView({
  submissions,
  loading,
  onChangeView,
  design,
  folderPresets,
  presetFolderPath,
  onRefreshPresets,
  manualTemplates,
  onSaveManualTemplate,
  onDeleteManualTemplate,
}) {
  return (
    <section className="panel h-full overflow-y-auto p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="label">Admin</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-white">Submitted design previews</h2>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => onChangeView('designer')} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
            Back to Designer
          </button>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            {loading ? 'Refreshing...' : `${submissions.length} submissions`}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <AdminPresetManager
          design={design}
          folderPresets={folderPresets}
          presetFolderPath={presetFolderPath}
          onRefresh={onRefreshPresets}
        />

        <ManualTemplateBuilder
          templates={manualTemplates}
          onSaveTemplate={onSaveManualTemplate}
          onDeleteTemplate={onDeleteManualTemplate}
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {submissions.length ? (
            submissions.map((submission) => (
              <article key={submission.id} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
                  <img src={submission.previewPng} alt="Submitted preview" className="h-40 w-full rounded-2xl border border-white/10 object-cover" />
                  <div className="space-y-3 text-sm text-slate-300">
                    <div>
                      <p className="font-semibold text-white">{submission.customerName || 'Unnamed customer'}</p>
                      <p>{submission.phone || 'No phone provided'}</p>
                    </div>
                    <p>Submitted: {new Date(submission.createdAt).toLocaleString()}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div className="rounded-2xl bg-white/5 px-3 py-2">
                        Body: <span className="capitalize text-slate-200">{submission.design.bodyStyle}</span>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-3 py-2">
                        Eye frame: <span className="capitalize text-slate-200">{submission.design.eyeFrameStyle}</span>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-3 py-2">
                        Foreground: <span className="capitalize text-slate-200">{submission.design.foregroundType}</span>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-3 py-2">
                        Background: <span className="capitalize text-slate-200">{submission.design.backgroundType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
              No submissions yet. Send a design from the designer view to populate this list.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const history = useHistory(initialDesign);
  const design = history.state;
  const [svgMarkup, setSvgMarkup] = useState(() => buildQrSvg(initialDesign));
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [view, setView] = useState('designer');
  const [adminPresets, setAdminPresets] = useState([]);
  const [folderPresets, setFolderPresets] = useState([]);
  const [presetFolderPath, setPresetFolderPath] = useState('');
  const [generatedTemplates, setGeneratedTemplates] = useState([]);
  const [manualTemplates, setManualTemplates] = useState([]);

  useEffect(() => {
    setSvgMarkup(buildQrSvg(design, { includeCanvasElements: false }));
  }, [design]);

  useEffect(() => {
    fetchSubmissions();
    fetchPresets();
    fetchPresetFolder();
    fetchGeneratedTemplates();
    fetchManualTemplates();
  }, []);

  const templateLibrary = useMemo(
    () => {
      const pinnedTemplates = ['meet-the-driver', 'driver-profile-modern'];
      const builderTemplates = manualTemplates.map((template) => manualTemplateToPreset(template));

      return [...builderTemplates, ...generatedTemplates
        .map((template) => ({
        id: template.id,
        name: template.templateName,
        description: 'Generated editable template from source image.',
        previewImage: template.previewImage,
        source: 'Generated',
        appDesign: template.appDesign,
        }))]
        .sort((left, right) => {
          const leftIndex = pinnedTemplates.indexOf(left.id);
          const rightIndex = pinnedTemplates.indexOf(right.id);

          if (leftIndex !== -1 || rightIndex !== -1) {
            if (leftIndex === -1) return 1;
            if (rightIndex === -1) return -1;
            return leftIndex - rightIndex;
          }

          return left.name.localeCompare(right.name);
        });
    },
    [generatedTemplates, manualTemplates],
  );

  const qrPresetLibrary = useMemo(
    () => [
      ...builtInPresets.map((preset) => ({ ...preset, source: 'Built in' })),
      ...adminPresets.map((preset) => ({ ...preset, source: 'Admin' })),
    ],
    [adminPresets],
  );

  const patchDesign = (field, value) => {
    history.setState({
      ...design,
      [field]: value,
    });
  };

  const applyPreset = (preset) => {
    if (preset.appDesign) {
      history.setState({
        ...design,
        ...preset.appDesign,
      });
      return;
    }

    history.setState(applyQrPresetToDesign(design, preset));
  };

  const addCanvasElement = (elementInput) => {
    const { url, x = 0.5, y = 0.5, width, height, ...rest } = elementInput;
    const defaultWidth = design.posterEnabled ? 0.12 : 0.16;
    const defaultHeight = design.posterEnabled ? 0.12 : 0.16;
    const elementWidth = width ?? defaultWidth;
    const elementHeight = height ?? defaultHeight;
    const maxLayer = Math.max(-1, ...(design.canvasElements ?? []).map((element) => element.layer ?? 0));
    const elementType = url ? 'image' : 'text';
    history.setState({
      ...design,
      canvasElements: [
        ...(design.canvasElements ?? []),
        {
          id: `${elementType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: elementType,
          url,
          text: 'Your text here',
          x: Math.max(0, Math.min(1 - elementWidth, x)),
          y: Math.max(0, Math.min(1 - elementHeight, y)),
          width: elementWidth,
          height: elementHeight,
          rotation: 0,
          layer: maxLayer + 1,
          lockAspectRatio: url ? true : false,
          fontFamily: 'Manrope, sans-serif',
          fontSize: 28,
          fontWeight: 700,
          fontStyle: 'normal',
          color: '#ffffff',
          textAlign: 'center',
          letterSpacing: 0,
          lineHeight: 1.2,
          ...(url ? {} : { url: '' }),
          ...rest,
        },
      ],
    });
  };

  const commitCanvasElements = (elements) => {
    history.setState({
      ...design,
      canvasElements: elements,
    });
  };

  const removeCanvasElement = (assetId) => {
    history.setState({
      ...design,
      canvasElements: (design.canvasElements ?? []).filter((asset) => asset.id !== assetId),
    });
  };

  const clearCanvasElements = () => {
    history.setState({
      ...design,
      canvasElements: [],
    });
  };

  const bringForward = (assetId) => {
    const ordered = [...(design.canvasElements ?? [])].sort((a, b) => a.layer - b.layer);
    const index = ordered.findIndex((element) => element.id === assetId);
    if (index < 0 || index === ordered.length - 1) return;
    const next = [...ordered];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    history.setState({
      ...design,
      canvasElements: next.map((element, layer) => ({ ...element, layer })),
    });
  };

  const sendBackward = (assetId) => {
    const ordered = [...(design.canvasElements ?? [])].sort((a, b) => a.layer - b.layer);
    const index = ordered.findIndex((element) => element.id === assetId);
    if (index <= 0) return;
    const next = [...ordered];
    [next[index], next[index - 1]] = [next[index - 1], next[index]];
    history.setState({
      ...design,
      canvasElements: next.map((element, layer) => ({ ...element, layer })),
    });
  };

  const toggleAspectLock = (assetId) => {
    history.setState({
      ...design,
      canvasElements: (design.canvasElements ?? []).map((element) =>
        element.id === assetId
          ? { ...element, lockAspectRatio: !element.lockAspectRatio }
          : element,
      ),
    });
  };

  const updateCanvasElement = (assetId, updates) => {
    history.setState({
      ...design,
      canvasElements: (design.canvasElements ?? []).map((element) =>
        element.id === assetId
          ? { ...element, ...updates }
          : element,
      ),
    });
  };

  const randomizeSeed = () => {
    history.setState({
      ...design,
      seed: `preview-${Math.random().toString(36).slice(2, 10)}`,
    });
  };

  const handleExportSvg = () => {
    exportSvg(design);
  };

  const handleExportPng = async () => {
    await exportPng(design);
  };

  async function fetchSubmissions() {
    try {
      setAdminLoading(true);
      if (!backendEnabled()) {
        setSubmissions(readLocalSubmissions());
        return;
      }
      const response = await fetch(`${API_URL}/submissions`);
      const data = await response.json();
      setSubmissions(data.submissions ?? []);
    } catch (error) {
      console.error('Unable to load submissions', error);
    } finally {
      setAdminLoading(false);
    }
  }

  async function fetchPresets() {
    try {
      if (!backendEnabled()) {
        setAdminPresets(readLocalPresets());
        return;
      }
      const response = await fetch(`${API_URL}/presets`);
      const data = await response.json();
      setAdminPresets(data.presets ?? []);
    } catch (error) {
      console.error('Unable to load presets', error);
    }
  }

  async function fetchPresetFolder() {
    try {
      if (!backendEnabled()) {
        setFolderPresets([]);
        setPresetFolderPath('');
        return;
      }
      const response = await fetch(`${API_URL}/preset-library`);
      const data = await response.json();
      setFolderPresets(data.presets ?? []);
      setPresetFolderPath(data.folder ?? '');
    } catch (error) {
      console.error('Unable to load preset folder', error);
    }
  }

  async function fetchGeneratedTemplates() {
    try {
      if (!backendEnabled()) {
        setGeneratedTemplates([]);
        return;
      }
      const response = await fetch(`${API_URL}/generated-templates`);
      const data = await response.json();
      setGeneratedTemplates(data.templates ?? []);
    } catch (error) {
      console.error('Unable to load generated templates', error);
    }
  }

  async function fetchManualTemplates() {
    try {
      if (!backendEnabled()) {
        setManualTemplates(readLocalManualTemplates());
        return;
      }
      const response = await fetch(`${API_URL}/manual-templates`);
      const data = await response.json();
      setManualTemplates(data.templates ?? []);
    } catch (error) {
      console.error('Unable to load manual templates', error);
    }
  }

  async function saveManualTemplate(template) {
    if (!backendEnabled()) {
      const templates = readLocalManualTemplates();
      const templateId = template.id || crypto.randomUUID();
      const nextTemplate = {
        ...template,
        id: templateId,
        createdAt: template.id
          ? templates.find((item) => item.id === templateId)?.createdAt ?? new Date().toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const existingIndex = templates.findIndex((item) => item.id === templateId);
      if (existingIndex >= 0) {
        templates[existingIndex] = nextTemplate;
      } else {
        templates.unshift(nextTemplate);
      }
      writeLocalManualTemplates(templates);
      await fetchManualTemplates();
      return nextTemplate;
    }

    const response = await fetch(`${API_URL}/manual-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      throw new Error('Failed to save manual template');
    }

    const data = await response.json();
    await fetchManualTemplates();
    return data.template;
  }

  async function deleteManualTemplate(templateId) {
    if (!backendEnabled()) {
      const templates = readLocalManualTemplates().filter((template) => template.id !== templateId);
      writeLocalManualTemplates(templates);
      await fetchManualTemplates();
      return;
    }

    const response = await fetch(`${API_URL}/manual-templates/${templateId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete manual template');
    }

    await fetchManualTemplates();
  }

  const handleSubmit = async ({ customerName, phone }) => {
    setSubmitLoading(true);

    try {
      const exportResult = await exportPng(design, 0.42, false);
      if (!backendEnabled()) {
        const submissions = readLocalSubmissions();
        const submission = {
          id: crypto.randomUUID(),
          customerName,
          phone,
          design,
          previewSvg: exportResult.svg,
          previewPng: exportResult.pngDataUrl,
          createdAt: new Date().toISOString(),
        };
        writeLocalSubmissions([submission, ...submissions]);
        await fetchSubmissions();
        setView('admin');
        setSubmitOpen(false);
        return;
      }
      const response = await fetch(`${API_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          phone,
          design,
          previewSvg: exportResult.svg,
          previewPng: exportResult.pngDataUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit design');
      }

      await fetchSubmissions();
      setView('admin');
      setSubmitOpen(false);
    } catch (error) {
      console.error(error);
      alert('Could not send the design.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-[1680px] px-4 py-6 sm:px-6 lg:h-screen lg:px-8 lg:py-6">
      <header className="mb-6 flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl lg:mb-6 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">QR Design Studio</p>
          <h1 className="mt-1 font-display text-xl font-bold text-white">Visual designer</h1>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
          Dummy only
        </div>
      </header>

      <main className={view === 'designer' ? 'grid gap-6 lg:h-[calc(100vh-9.5rem)] lg:grid-cols-[430px_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[460px_minmax(0,1fr)]' : 'grid gap-6 lg:h-[calc(100vh-9.5rem)] lg:overflow-hidden'}>
        {view === 'designer' ? (
          <>
            <SidebarControls
              design={design}
              templates={templateLibrary}
              qrPresets={qrPresetLibrary}
              folderPresets={folderPresets}
              onChange={patchDesign}
              onChangeTemplateTextValue={(fieldId, value) =>
                patchDesign('templateTextValues', {
                  ...(design.templateTextValues ?? {}),
                  [fieldId]: value,
                })}
              onApplyPreset={applyPreset}
              onUploadLogo={(logoSrc) => patchDesign('logoSrc', logoSrc)}
              onClearLogo={() => patchDesign('logoSrc', '')}
              onRandomizeSeed={randomizeSeed}
              onUndo={history.undo}
              onRedo={history.redo}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
            />

          <PreviewPanel
            svgMarkup={svgMarkup}
            design={design}
            activeView={view}
            onChangeView={setView}
            onDropPresetAsset={addCanvasElement}
            onCommitCanvasElements={commitCanvasElements}
            onDeleteCanvasElement={removeCanvasElement}
            onClearCanvasElements={clearCanvasElements}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
            onToggleAspectLock={toggleAspectLock}
            onUpdateCanvasElement={updateCanvasElement}
            onExportPng={handleExportPng}
            onExportSvg={handleExportSvg}
            onOpenSubmit={() => setSubmitOpen(true)}
          />
          </>
        ) : (
          <AdminView
            submissions={submissions}
            loading={adminLoading}
            onChangeView={setView}
            design={design}
            folderPresets={folderPresets}
            presetFolderPath={presetFolderPath}
            manualTemplates={manualTemplates}
            onSaveManualTemplate={saveManualTemplate}
            onDeleteManualTemplate={deleteManualTemplate}
            onRefreshPresets={async () => {
              await fetchPresets();
              await fetchPresetFolder();
            }}
          />
        )}
      </main>

      <SubmitModal isOpen={submitOpen} onClose={() => setSubmitOpen(false)} onSubmit={handleSubmit} loading={submitLoading} />
    </div>
  );
}
