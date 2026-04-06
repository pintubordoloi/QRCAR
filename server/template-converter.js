import fs from 'node:fs/promises';
import path from 'node:path';
import { templateOverrides } from './template-overrides.js';

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function readImageMetadata(filePath) {
  const buffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.png') {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      const isStartOfFrame =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);

      if (isStartOfFrame) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }

      offset += 2 + length;
    }
  }

  throw new Error(`Unsupported image format for ${filePath}`);
}

function buildHeuristicTemplate(fileName, width, height) {
  const baseName = path.basename(fileName, path.extname(fileName));
  const humanName = baseName.replace(/[-_]/g, ' ').toUpperCase();
  const qrSize = Math.round(Math.min(width, height) * 0.32);
  const qrX = Math.round((width - qrSize) / 2);
  const qrY = Math.round(height * 0.24);

  return {
    templateName: humanName,
    editableFields: [
      {
        id: 'title',
        type: 'text',
        default: humanName,
        x: Math.round(width / 2),
        y: Math.round(height * 0.12),
        width: Math.round(width * 0.6),
        height: Math.round(height * 0.1),
        fontSize: Math.round(Math.min(width, height) * 0.06),
        fontWeight: 800,
        textAnchor: 'middle',
        fill: '#ffffff',
      },
      {
        id: 'footer',
        type: 'text',
        default: 'SCAN TO VIEW DETAILS',
        x: Math.round(width / 2),
        y: Math.round(height * 0.86),
        width: Math.round(width * 0.66),
        height: Math.round(height * 0.08),
        fontSize: Math.round(Math.min(width, height) * 0.04),
        fontWeight: 700,
        textAnchor: 'middle',
        fill: '#ffffff',
      },
    ],
    qr: {
      id: 'qr-area',
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    },
    overlayRegions: [
      {
        id: 'title-mask',
        x: Math.round(width * 0.2),
        y: Math.round(height * 0.04),
        width: Math.round(width * 0.6),
        height: Math.round(height * 0.12),
        radius: 18,
        fill: '#111827',
        opacity: 0.9,
      },
      {
        id: 'qr-mask',
        x: qrX - 12,
        y: qrY - 12,
        width: qrSize + 24,
        height: qrSize + 24,
        radius: 22,
        fill: '#ffffff',
        opacity: 0.95,
      },
      {
        id: 'footer-mask',
        x: Math.round(width * 0.18),
        y: Math.round(height * 0.78),
        width: Math.round(width * 0.64),
        height: Math.round(height * 0.11),
        radius: 18,
        fill: '#111827',
        opacity: 0.88,
      },
    ],
  };
}

function normalizeEditableFields(fields = []) {
  return fields.map((field) => ({
    ...field,
    dataEditable: true,
  }));
}

function buildSvg(templateConfig) {
  const { width, height, sourceImageUrl, editableFields, qr, overlayRegions = [], canvasElements = [] } = templateConfig;

  const overlays = overlayRegions
    .map(
      (region) => `
        <rect
          id="${region.id}"
          x="${region.x}"
          y="${region.y}"
          width="${region.width}"
          height="${region.height}"
          rx="${region.radius ?? 0}"
          fill="${region.fill}"
          fill-opacity="${region.opacity ?? 1}"
        />
      `,
    )
    .join('');

  const texts = editableFields
    .map(
      (field) => `
        <text
          id="${field.id}"
          data-editable="true"
          x="${field.x}"
          y="${field.y}"
          fill="${field.fill ?? '#ffffff'}"
          font-size="${field.fontSize ?? 28}"
          font-weight="${field.fontWeight ?? 700}"
          text-anchor="${field.textAnchor ?? 'start'}"
          font-family="Arial, sans-serif"
        >
          ${field.default}
        </text>
      `,
    )
    .join('');

  const extras = canvasElements
    .map(
      (element) => `
        <image
          id="${element.id}"
          href="${element.url}"
          x="${Math.round(element.x * width)}"
          y="${Math.round(element.y * height)}"
          width="${Math.round(element.width * width)}"
          height="${Math.round(element.height * height)}"
          preserveAspectRatio="xMidYMid meet"
          data-editable="true"
        />
      `,
    )
    .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <image href="${sourceImageUrl}" width="${width}" height="${height}" preserveAspectRatio="none" />
      ${templateConfig.background?.fill ? `<rect x="0" y="0" width="${width}" height="${height}" fill="${templateConfig.background.fill}" />` : ''}
      ${templateConfig.background?.frame ? `<rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="28" fill="none" stroke="${templateConfig.background.frame}" stroke-width="8" />` : ''}
      ${overlays}
      <rect
        id="${qr.id}"
        data-type="qr-placeholder"
        x="${qr.x}"
        y="${qr.y}"
        width="${qr.width}"
        height="${qr.height}"
        rx="18"
        fill="rgba(255,255,255,0.92)"
        stroke="rgba(15,23,42,0.24)"
        stroke-width="4"
      />
      ${texts}
      ${extras}
    </svg>
  `.trim();
}

function buildAppDesign(templateConfig) {
  const textMap = Object.fromEntries(templateConfig.editableFields.map((field) => [field.id, field.default]));

  return {
    templateMode: 'image-derived',
    templateDefinition: {
      templateName: templateConfig.templateName,
      width: templateConfig.width,
      height: templateConfig.height,
      backgroundImage: templateConfig.sourceImageUrl,
      editableFields: templateConfig.editableFields,
      overlayRegions: templateConfig.overlayRegions ?? [],
      qr: templateConfig.qr,
      background: templateConfig.background ?? null,
    },
    templateTextValues: textMap,
    canvasElements: templateConfig.canvasElements ?? [],
    posterEnabled: false,
  };
}

export async function generateTemplateFromImage({
  imagePath,
  imageBaseUrl,
  outputRoot,
}) {
  const fileName = path.basename(imagePath);
  const fileExtension = path.extname(fileName).toLowerCase();
  const { width, height } = await readImageMetadata(imagePath);
  const override = templateOverrides[fileName];
  const generated = override ?? buildHeuristicTemplate(fileName, width, height);
  const slug = slugify(generated.templateName || fileName);
  const outputDir = path.join(outputRoot, slug);
  await fs.mkdir(outputDir, { recursive: true });

  const sourceImageUrl = `${imageBaseUrl}/${encodeURIComponent(fileName)}`;
  const serverBaseUrl = imageBaseUrl.replace(/\/template$/, '');
  const previewFileName = `preview${fileExtension}`;
  const previewImageUrl = `${serverBaseUrl}/generated-templates/${slug}/${previewFileName}`;
  const canvasElements = (generated.canvasElements ?? []).map((element) => ({
    ...element,
    url: `${imageBaseUrl}/${encodeURIComponent(element.sourceImage)}`,
  }));

  const templateConfig = {
    id: slug,
    templateName: generated.templateName,
    sourceImage: fileName,
    sourceImageUrl,
    width,
    height,
    editableFields: normalizeEditableFields(generated.editableFields),
    qr: generated.qr,
    overlayRegions: generated.overlayRegions ?? [],
    canvasElements,
    background: generated.background ?? null,
    appDesign: null,
  };

  templateConfig.appDesign = buildAppDesign(templateConfig);
  const svg = buildSvg(templateConfig);
  const templateJson = {
    templateName: templateConfig.templateName,
    sourceImage: templateConfig.sourceImage,
    width: templateConfig.width,
    height: templateConfig.height,
    editableFields: templateConfig.editableFields,
    qr: templateConfig.qr,
    overlayRegions: templateConfig.overlayRegions,
    canvasElements: templateConfig.canvasElements,
    appDesign: templateConfig.appDesign,
  };

  await fs.writeFile(path.join(outputDir, 'template.svg'), svg);
  await fs.writeFile(path.join(outputDir, 'template.json'), JSON.stringify(templateJson, null, 2));
  await fs.copyFile(imagePath, path.join(outputDir, previewFileName));

  return {
    id: slug,
    templateName: templateConfig.templateName,
    previewImage: previewImageUrl,
    sourceImage: templateConfig.sourceImage,
    svgUrl: `/generated-templates/${slug}/template.svg`,
    jsonUrl: `/generated-templates/${slug}/template.json`,
    appDesign: templateConfig.appDesign,
    editableFields: templateConfig.editableFields,
    qr: templateConfig.qr,
  };
}
