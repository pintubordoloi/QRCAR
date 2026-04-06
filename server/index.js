import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateTemplateFromImage } from './template-converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, 'data', 'submissions.json');
const qrPresetFolder = path.join(__dirname, '..', 'qr-preset');
const presetsFile = path.join(qrPresetFolder, 'presets.json');
const templatesFile = path.join(__dirname, 'data', 'manual-templates.json');
const presetFolder = path.join(__dirname, '..', 'preset');
const templateFolder = path.join(__dirname, '..', 'template');
const generatedTemplatesFolder = path.join(__dirname, '..', 'generated-templates');

const app = express();
const port = 4000;
const host = '127.0.0.1';

app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use('/preset', express.static(presetFolder));
app.use('/template', express.static(templateFolder));
app.use('/generated-templates', express.static(generatedTemplatesFolder));

async function readSubmissions() {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeSubmissions(submissions) {
  await fs.writeFile(dataFile, JSON.stringify(submissions, null, 2));
}

async function readPresets() {
  try {
    const raw = await fs.readFile(presetsFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writePresets(presets) {
  await fs.writeFile(presetsFile, JSON.stringify(presets, null, 2));
}

async function readManualTemplates() {
  try {
    const raw = await fs.readFile(templatesFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeManualTemplates(templates) {
  await fs.writeFile(templatesFile, JSON.stringify(templates, null, 2));
}

async function ensurePresetFolder() {
  if (!fsSync.existsSync(qrPresetFolder)) {
    await fs.mkdir(qrPresetFolder, { recursive: true });
  }
  if (!fsSync.existsSync(presetFolder)) {
    await fs.mkdir(presetFolder, { recursive: true });
  }
  if (!fsSync.existsSync(templateFolder)) {
    await fs.mkdir(templateFolder, { recursive: true });
  }
  if (!fsSync.existsSync(generatedTemplatesFolder)) {
    await fs.mkdir(generatedTemplatesFolder, { recursive: true });
  }
}

async function readPresetFolderFiles() {
  await ensurePresetFolder();
  const entries = await fs.readdir(presetFolder, { withFileTypes: true });
  const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.svg', '.webp']);

  return entries
    .filter((entry) => entry.isFile() && allowedExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => {
      const id = entry.name.replace(/\.[^.]+$/, '');
      return {
        id,
        name: id.replace(/[-_]/g, ' '),
        description: 'Preset image discovered from preset',
        previewImage: `http://${host}:${port}/preset/${encodeURIComponent(entry.name)}`,
        fileName: entry.name,
        source: 'Folder',
      };
    });
}

async function readTemplateSourceFiles() {
  await ensurePresetFolder();
  const entries = await fs.readdir(templateFolder, { withFileTypes: true });
  const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

  return entries
    .filter((entry) => entry.isFile() && allowedExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => ({
      id: entry.name.replace(/\.[^.]+$/, ''),
      name: entry.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      fileName: entry.name,
      imageUrl: `/template/${encodeURIComponent(entry.name)}`,
    }));
}

async function generateAllTemplates() {
  const sources = await readTemplateSourceFiles();
  const templates = [];
  const imageBaseUrl = `http://${host}:${port}/template`;

  for (const source of sources) {
    const generated = await generateTemplateFromImage({
      imagePath: path.join(templateFolder, source.fileName),
      imageBaseUrl,
      outputRoot: generatedTemplatesFolder,
    });
    templates.push(generated);
  }

  return templates;
}

app.get('/api/submissions', async (_request, response) => {
  const submissions = await readSubmissions();
  response.json({ submissions });
});

app.post('/api/submissions', async (request, response) => {
  const { customerName = '', phone = '', design, previewSvg = '', previewPng = '' } = request.body;

  if (!design || !previewSvg || !previewPng) {
    response.status(400).json({ error: 'Design, previewSvg, and previewPng are required.' });
    return;
  }

  const submissions = await readSubmissions();
  const submission = {
    id: crypto.randomUUID(),
    customerName,
    phone,
    design,
    previewSvg,
    previewPng,
    createdAt: new Date().toISOString(),
  };

  submissions.unshift(submission);
  await writeSubmissions(submissions);

  response.status(201).json({ submission });
});

app.get('/api/presets', async (_request, response) => {
  const presets = await readPresets();
  response.json({ presets });
});

app.get('/api/manual-templates', async (_request, response) => {
  const templates = await readManualTemplates();
  response.json({ templates });
});

app.get('/api/preset-library', async (_request, response) => {
  const presets = await readPresetFolderFiles();
  response.json({ presets, folder: presetFolder });
});

app.get('/api/template-sources', async (_request, response) => {
  const templates = await readTemplateSourceFiles();
  response.json({ templates, folder: templateFolder });
});

app.get('/api/generated-templates', async (_request, response) => {
  const templates = await generateAllTemplates();
  response.json({ templates, folder: generatedTemplatesFolder });
});

app.post('/api/generated-templates/generate', async (_request, response) => {
  const templates = await generateAllTemplates();
  response.status(201).json({ templates, folder: generatedTemplatesFolder });
});

app.post('/api/presets', async (request, response) => {
  const { name = '', description = '', previewImage = '', useImageAsLogo = false, design } = request.body;

  if (!name.trim() || !design) {
    response.status(400).json({ error: 'name and design are required.' });
    return;
  }

  const presets = await readPresets();
  const preset = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description.trim() || 'Admin uploaded preset',
    previewImage,
    useImageAsLogo,
    design,
    source: 'Admin',
    createdAt: new Date().toISOString(),
  };

  presets.unshift(preset);
  await writePresets(presets);

  response.status(201).json({ preset });
});

app.post('/api/manual-templates', async (request, response) => {
  const {
    id = '',
    templateName = '',
    width,
    height,
    backgroundImage = '',
    elements = [],
    category = '',
    previewImage = '',
  } = request.body;

  if (!templateName.trim() || !backgroundImage || !width || !height) {
    response.status(400).json({ error: 'templateName, backgroundImage, width, and height are required.' });
    return;
  }

  const templates = await readManualTemplates();
  const templateId = id || crypto.randomUUID();
  const manualTemplate = {
    id: templateId,
    templateName: templateName.trim(),
    width,
    height,
    backgroundImage,
    previewImage: previewImage || backgroundImage,
    elements,
    category: category.trim(),
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = templates.findIndex((template) => template.id === templateId);
  if (existingIndex >= 0) {
    templates[existingIndex] = {
      ...templates[existingIndex],
      ...manualTemplate,
    };
  } else {
    templates.unshift({
      ...manualTemplate,
      createdAt: new Date().toISOString(),
    });
  }

  await writeManualTemplates(templates);
  response.status(201).json({ template: manualTemplate });
});

app.delete('/api/manual-templates/:id', async (request, response) => {
  const { id } = request.params;
  const templates = await readManualTemplates();
  const nextTemplates = templates.filter((template) => template.id !== id);

  if (nextTemplates.length === templates.length) {
    response.status(404).json({ error: 'Template not found.' });
    return;
  }

  await writeManualTemplates(nextTemplates);
  response.status(204).send();
});

ensurePresetFolder()
  .then(() => generateAllTemplates())
  .catch((error) => {
    console.error('Template generation bootstrap failed', error);
  });

app.listen(port, host, () => {
  console.log(`Mock QR design API running on http://${host}:${port}`);
});
