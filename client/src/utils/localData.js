const KEYS = {
  submissions: 'qr-design-studio.submissions',
  presets: 'qr-design-studio.presets',
  manualTemplates: 'qr-design-studio.manualTemplates',
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function read(key) {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (_error) {
    return [];
  }
}

function write(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readLocalSubmissions() {
  return read(KEYS.submissions);
}

export function writeLocalSubmissions(value) {
  write(KEYS.submissions, value);
}

export function readLocalPresets() {
  return read(KEYS.presets);
}

export function writeLocalPresets(value) {
  write(KEYS.presets, value);
}

export function readLocalManualTemplates() {
  return read(KEYS.manualTemplates);
}

export function writeLocalManualTemplates(value) {
  write(KEYS.manualTemplates, value);
}
