import { buildDummyMatrix, DUMMY_QR_SIZE, isInCorner } from './dummyQr';

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createGradient(design) {
  if (design.gradientType === 'radial') {
    return `
      <radialGradient id="fgGradient" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="${design.gradientStart}" />
        <stop offset="100%" stop-color="${design.gradientEnd}" />
      </radialGradient>
    `;
  }

  return `
    <linearGradient id="fgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${design.gradientStart}" />
      <stop offset="100%" stop-color="${design.gradientEnd}" />
    </linearGradient>
  `;
}

function getBackgroundPattern(pattern, backgroundColor) {
  if (pattern === 'none') return '';

  if (pattern === 'grid') {
    return `
      <pattern id="bgPattern" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="${backgroundColor}" />
        <path d="M24 0H0V24" fill="none" stroke="rgba(15,23,42,0.08)" stroke-width="1" />
      </pattern>
    `;
  }

  if (pattern === 'diagonal') {
    return `
      <pattern id="bgPattern" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
        <rect width="24" height="24" fill="${backgroundColor}" />
        <rect x="0" y="0" width="6" height="24" fill="rgba(15,23,42,0.05)" />
      </pattern>
    `;
  }

  if (pattern === 'waves') {
    return `
      <pattern id="bgPattern" width="36" height="18" patternUnits="userSpaceOnUse">
        <rect width="36" height="18" fill="${backgroundColor}" />
        <path d="M0 9 Q9 0, 18 9 T36 9" fill="none" stroke="rgba(15,23,42,0.08)" stroke-width="1.2" />
      </pattern>
    `;
  }

  return `
    <pattern id="bgPattern" width="18" height="18" patternUnits="userSpaceOnUse">
      <rect width="18" height="18" fill="${backgroundColor}" />
      <circle cx="4" cy="4" r="1.4" fill="rgba(15,23,42,0.08)" />
      <circle cx="13" cy="13" r="1.4" fill="rgba(15,23,42,0.08)" />
    </pattern>
  `;
}

function moduleMarkup(x, y, unit, style, fill) {
  const px = x * unit;
  const py = y * unit;

  if (style === 'circle') return `<circle cx="${px + unit / 2}" cy="${py + unit / 2}" r="${unit * 0.38}" fill="${fill}" />`;
  if (style === 'rounded') return `<rect x="${px + unit * 0.08}" y="${py + unit * 0.08}" width="${unit * 0.84}" height="${unit * 0.84}" rx="${unit * 0.28}" fill="${fill}" />`;
  if (style === 'diamond') return `<path d="M${px + unit / 2} ${py + unit * 0.08} L${px + unit * 0.92} ${py + unit / 2} L${px + unit / 2} ${py + unit * 0.92} L${px + unit * 0.08} ${py + unit / 2} Z" fill="${fill}" />`;
  if (style === 'star') return `<path d="M${px + unit * 0.5} ${py + unit * 0.08} L${px + unit * 0.62} ${py + unit * 0.36} L${px + unit * 0.92} ${py + unit * 0.36} L${px + unit * 0.68} ${py + unit * 0.56} L${px + unit * 0.78} ${py + unit * 0.9} L${px + unit * 0.5} ${py + unit * 0.7} L${px + unit * 0.22} ${py + unit * 0.9} L${px + unit * 0.32} ${py + unit * 0.56} L${px + unit * 0.08} ${py + unit * 0.36} L${px + unit * 0.38} ${py + unit * 0.36} Z" fill="${fill}" />`;
  if (style === 'tile') return `<path d="M${px + unit * 0.1} ${py + unit * 0.18} Q${px + unit * 0.22} ${py + unit * 0.08}, ${px + unit * 0.38} ${py + unit * 0.08} H${px + unit * 0.9} V${py + unit * 0.82} Q${px + unit * 0.78} ${py + unit * 0.92}, ${px + unit * 0.62} ${py + unit * 0.92} H${px + unit * 0.1} Z" fill="${fill}" />`;
  if (style === 'bubble') return `<path d="M${px + unit * 0.2} ${py + unit * 0.28} Q${px + unit * 0.2} ${py + unit * 0.08}, ${px + unit * 0.4} ${py + unit * 0.08} H${px + unit * 0.62} Q${px + unit * 0.84} ${py + unit * 0.08}, ${px + unit * 0.84} ${py + unit * 0.3} V${py + unit * 0.58} Q${px + unit * 0.84} ${py + unit * 0.84}, ${px + unit * 0.56} ${py + unit * 0.84} H${px + unit * 0.32} Q${px + unit * 0.08} ${py + unit * 0.84}, ${px + unit * 0.08} ${py + unit * 0.56} Z" fill="${fill}" />`;
  if (style === 'leaf') return `<path d="M${px + unit * 0.14} ${py + unit * 0.5} C${px + unit * 0.2} ${py + unit * 0.18}, ${px + unit * 0.82} ${py + unit * 0.16}, ${px + unit * 0.88} ${py + unit * 0.5} C${px + unit * 0.82} ${py + unit * 0.84}, ${px + unit * 0.2} ${py + unit * 0.82}, ${px + unit * 0.14} ${py + unit * 0.5} Z" fill="${fill}" />`;
  if (style === 'artistic') return `<path d="M${px + unit * 0.18} ${py + unit * 0.52} C${px + unit * 0.16} ${py + unit * 0.16}, ${px + unit * 0.74} ${py + unit * 0.1}, ${px + unit * 0.84} ${py + unit * 0.44} C${px + unit * 0.9} ${py + unit * 0.72}, ${px + unit * 0.38} ${py + unit * 0.92}, ${px + unit * 0.18} ${py + unit * 0.52} Z" fill="${fill}" />`;

  return `<rect x="${px + unit * 0.12}" y="${py + unit * 0.12}" width="${unit * 0.76}" height="${unit * 0.76}" fill="${fill}" />`;
}

function eyeFrameMarkup(px, py, unit, style, strokeFill) {
  const size = unit * 7;
  const strokeWidth = unit * 0.9;
  if (style === 'rounded') return `<rect x="${px}" y="${py}" width="${size}" height="${size}" rx="${unit * 1.55}" fill="none" stroke="${strokeFill}" stroke-width="${strokeWidth}" />`;
  if (style === 'modern') return `<path d="M${px} ${py + size * 0.42} Q${px} ${py}, ${px + size * 0.42} ${py} H${px + size} V${py + size * 0.58} Q${px + size} ${py + size}, ${px + size * 0.58} ${py + size} H${px} Z" fill="none" stroke="${strokeFill}" stroke-width="${strokeWidth}" stroke-linejoin="round" />`;
  if (style === 'diamond') return `<path d="M${px + size / 2} ${py} L${px + size} ${py + size / 2} L${px + size / 2} ${py + size} L${px} ${py + size / 2} Z" fill="none" stroke="${strokeFill}" stroke-width="${strokeWidth}" />`;
  if (style === 'leaf') return `<path d="M${px + size * 0.1} ${py + size * 0.5} C${px + size * 0.14} ${py + size * 0.1}, ${px + size * 0.86} ${py + size * 0.1}, ${px + size * 0.9} ${py + size * 0.5} C${px + size * 0.86} ${py + size * 0.9}, ${px + size * 0.14} ${py + size * 0.9}, ${px + size * 0.1} ${py + size * 0.5} Z" fill="none" stroke="${strokeFill}" stroke-width="${strokeWidth}" />`;
  if (style === 'hex') return `<path d="M${px + size * 0.24} ${py} H${px + size * 0.76} L${px + size} ${py + size * 0.5} L${px + size * 0.76} ${py + size} H${px + size * 0.24} L${px} ${py + size * 0.5} Z" fill="none" stroke="${strokeFill}" stroke-width="${strokeWidth}" />`;
  return `<rect x="${px}" y="${py}" width="${size}" height="${size}" fill="none" stroke="${strokeFill}" stroke-width="${strokeWidth}" />`;
}

function eyeBallMarkup(px, py, unit, style, fill) {
  const size = unit * 3;
  const offset = unit * 2;
  const innerX = px + offset;
  const innerY = py + offset;
  if (style === 'rounded') return `<rect x="${innerX}" y="${innerY}" width="${size}" height="${size}" rx="${unit * 0.88}" fill="${fill}" />`;
  if (style === 'circle') return `<circle cx="${innerX + size / 2}" cy="${innerY + size / 2}" r="${size * 0.46}" fill="${fill}" />`;
  if (style === 'diamond') return `<path d="M${innerX + size / 2} ${innerY} L${innerX + size} ${innerY + size / 2} L${innerX + size / 2} ${innerY + size} L${innerX} ${innerY + size / 2} Z" fill="${fill}" />`;
  if (style === 'leaf') return `<path d="M${innerX + size * 0.08} ${innerY + size * 0.5} C${innerX + size * 0.12} ${innerY + size * 0.16}, ${innerX + size * 0.88} ${innerY + size * 0.16}, ${innerX + size * 0.92} ${innerY + size * 0.5} C${innerX + size * 0.88} ${innerY + size * 0.84}, ${innerX + size * 0.12} ${innerY + size * 0.84}, ${innerX + size * 0.08} ${innerY + size * 0.5} Z" fill="${fill}" />`;
  if (style === 'spark') return `<path d="M${innerX + size * 0.5} ${innerY} L${innerX + size * 0.64} ${innerY + size * 0.32} L${innerX + size} ${innerY + size * 0.36} L${innerX + size * 0.72} ${innerY + size * 0.58} L${innerX + size * 0.82} ${innerY + size} L${innerX + size * 0.5} ${innerY + size * 0.78} L${innerX + size * 0.18} ${innerY + size} L${innerX + size * 0.28} ${innerY + size * 0.58} L${innerX} ${innerY + size * 0.36} L${innerX + size * 0.36} ${innerY + size * 0.32} Z" fill="${fill}" />`;
  return `<rect x="${innerX}" y="${innerY}" width="${size}" height="${size}" fill="${fill}" />`;
}

function buildOverlay(design, x, y, width, height) {
  if (design.previewOverlay === 'none') return '';
  if (design.previewOverlay === 'mesh') {
    return `
      <g opacity="0.08">
        <path d="M${x} ${y + height * 0.2} H${x + width}" stroke="#ffffff" stroke-width="1.5" />
        <path d="M${x} ${y + height * 0.52} H${x + width}" stroke="#ffffff" stroke-width="1.5" />
        <path d="M${x + width * 0.2} ${y} V${y + height}" stroke="#ffffff" stroke-width="1.5" />
        <path d="M${x + width * 0.7} ${y} V${y + height}" stroke="#ffffff" stroke-width="1.5" />
      </g>
    `;
  }
  return `
    <g opacity="0.12">
      <path d="M${x + 24} ${y + height - 154} L${x + width - 24} ${y + height - 10}" stroke="#ffffff" stroke-width="2" />
      <path d="M${x + 10} ${y + height - 116} L${x + width - 58} ${y + height}" stroke="#ffffff" stroke-width="2" />
    </g>
  `;
}

function buildCanvasElementsSvg(canvasElements, width, height) {
  return [...(canvasElements ?? [])]
    .sort((a, b) => a.layer - b.layer)
    .map((asset) => {
      const x = asset.x * width;
      const y = asset.y * height;
      const elementWidth = asset.width * width;
      const elementHeight = asset.height * height;
      const centerX = x + elementWidth / 2;
      const centerY = y + elementHeight / 2;
      if (asset.type === 'text') {
        const text = escapeXml(asset.text || 'Text');
        const lines = text.split('\n');
        const anchor = asset.textAlign === 'left' ? 'start' : asset.textAlign === 'right' ? 'end' : 'middle';
        const textX = asset.textAlign === 'left' ? x : asset.textAlign === 'right' ? x + elementWidth : x + elementWidth / 2;
        const fontSize = asset.fontSize ?? 28;
        const lineHeight = (asset.lineHeight ?? 1.2) * fontSize;
        const startY = y + (elementHeight - lineHeight * Math.max(lines.length - 1, 0)) / 2;

        return `
          <g transform="rotate(${asset.rotation} ${centerX} ${centerY})">
            <text
              x="${textX}"
              y="${startY}"
              fill="${asset.color ?? '#ffffff'}"
              font-family="${asset.fontFamily ?? 'Manrope, sans-serif'}"
              font-size="${fontSize}"
              font-weight="${asset.fontWeight ?? 700}"
              font-style="${asset.fontStyle ?? 'normal'}"
              letter-spacing="${asset.letterSpacing ?? 0}"
              text-anchor="${anchor}"
            >
              ${lines
                .map(
                  (line, index) =>
                    `<tspan x="${textX}" dy="${index === 0 ? 0 : lineHeight}">${line || ' '}</tspan>`,
                )
                .join('')}
            </text>
          </g>
        `;
      }

      if (!asset.url) {
        return `
          <g transform="rotate(${asset.rotation} ${centerX} ${centerY})">
            <rect
              x="${x}"
              y="${y}"
              width="${elementWidth}"
              height="${elementHeight}"
              rx="18"
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(255,255,255,0.5)"
              stroke-dasharray="12 8"
              stroke-width="2"
            />
            <text
              x="${x + elementWidth / 2}"
              y="${y + elementHeight / 2}"
              fill="#ffffff"
              font-family="Arial, sans-serif"
              font-size="18"
              font-weight="700"
              text-anchor="middle"
              dominant-baseline="middle"
              letter-spacing="2"
            >
              ${escapeXml(asset.placeholderLabel || 'IMAGE')}
            </text>
          </g>
        `;
      }

      return `
        <image
          href="${asset.url}"
          x="${x}"
          y="${y}"
          width="${elementWidth}"
          height="${elementHeight}"
          preserveAspectRatio="xMidYMid meet"
          transform="rotate(${asset.rotation} ${centerX} ${centerY})"
        />
      `;
    })
    .join('');
}

function buildQrCore(design, x, y, dimension) {
  const matrix = buildDummyMatrix(`${design.seed}-${design.moduleDensity}`);
  const padding = design.quietZone ?? 84;
  const qrSize = dimension - padding * 2;
  const unit = qrSize / DUMMY_QR_SIZE;
  const offset = padding / unit;
  const moduleFill = design.foregroundType === 'gradient' ? 'url(#fgGradient)' : design.foreground;
  const eyeFrameFill = design.useCustomEyeColor ? design.eyeFrameColor : moduleFill;
  const eyeBallFill = design.useCustomEyeColor ? design.eyeBallColor : moduleFill;
  const hasTransparentBg = design.backgroundType === 'transparent';
  const backgroundFill = hasTransparentBg ? 'transparent' : design.backgroundPattern === 'none' ? design.backgroundColor : 'url(#bgPattern)';

  const modules = [];
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (!matrix[row][col] || isInCorner(col, row)) continue;
      modules.push(moduleMarkup(offset + col, offset + row, unit, design.bodyStyle, moduleFill));
    }
  }

  const cornerPositions = [
    [offset, offset],
    [offset + (DUMMY_QR_SIZE - 7), offset],
    [offset, offset + (DUMMY_QR_SIZE - 7)],
  ];

  const corners = cornerPositions.map(([cx, cy]) => {
    const px = cx * unit;
    const py = cy * unit;
    return `${eyeFrameMarkup(px, py, unit, design.eyeFrameStyle, eyeFrameFill)}${eyeBallMarkup(px, py, unit, design.eyeBallStyle, eyeBallFill)}`;
  });

  const baseSurfaceFill = hasTransparentBg ? 'rgba(255,255,255,0.92)' : design.backgroundColor;
  const logoMarkup = design.logoSrc
    ? `
      <g>
        <rect
          x="${dimension / 2 - design.logoSize / 2 - design.logoPadding}"
          y="${dimension / 2 - design.logoSize / 2 - design.logoPadding}"
          width="${design.logoSize + design.logoPadding * 2}"
          height="${design.logoSize + design.logoPadding * 2}"
          rx="${design.logoRadius + design.logoPadding}"
          fill="${baseSurfaceFill}"
          opacity="0.96"
        />
        <image
          href="${design.logoSrc}"
          x="${dimension / 2 - design.logoSize / 2}"
          y="${dimension / 2 - design.logoSize / 2}"
          width="${design.logoSize}"
          height="${design.logoSize}"
          preserveAspectRatio="xMidYMid slice"
          clip-path="url(#logoClip)"
        />
      </g>
    `
    : '';

  return `
    <g transform="translate(${x} ${y})">
      <rect width="${dimension}" height="${dimension}" rx="42" fill="${backgroundFill}" />
      <g opacity="${design.backgroundType === 'transparent' ? 0.62 : 1}">
        ${modules.join('')}
        ${corners.join('')}
      </g>
      ${logoMarkup}
      <g opacity="${design.watermarkOpacity}">
        <rect x="0" y="${dimension - 124}" width="${dimension}" height="84" fill="rgba(2,6,23,0.22)" />
        <text x="${dimension / 2}" y="${dimension - 72}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="8" fill="${design.backgroundType === 'solid' && design.backgroundColor === '#020617' ? '#e2e8f0' : '#0f172a'}">
          PREVIEW ONLY
        </text>
      </g>
      ${buildOverlay(design, 0, 0, dimension, dimension)}
    </g>
  `;
}

function buildPosterLayout(design, canvasWidth, canvasHeight, includeCanvasElements) {
  const frameInset = 24;
  const outerRadius = design.posterRadius;
  const innerRadius = Math.max(16, outerRadius - 14);
  const cardX = frameInset;
  const cardY = frameInset;
  const cardWidth = canvasWidth - frameInset * 2;
  const cardHeight = canvasHeight - frameInset * 2;
  const title = escapeXml(design.posterTitle || '');
  const subtitle = escapeXml(design.posterSubtitle || '');
  const bottomText = escapeXml(design.posterBottomText || '');
  const qrBoxSize = 420;
  const qrX = canvasWidth / 2 - qrBoxSize / 2;
  const qrY = 196;

  return `
    <rect width="${canvasWidth}" height="${canvasHeight}" rx="${outerRadius}" fill="${design.posterFrameColor}" />
    <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="${innerRadius}" fill="${design.posterCardColor}" />
    <path d="M${canvasWidth * 0.35} ${cardY} L${canvasWidth * 0.65} ${cardY} L${canvasWidth * 0.62} ${cardY + 34} L${canvasWidth * 0.38} ${cardY + 34} Z" fill="${design.posterAccentColor}" opacity="0.9" />
    <path d="M${canvasWidth * 0.35} ${cardY + cardHeight} L${canvasWidth * 0.65} ${cardY + cardHeight} L${canvasWidth * 0.62} ${cardY + cardHeight - 34} L${canvasWidth * 0.38} ${cardY + cardHeight - 34} Z" fill="${design.posterAccentColor}" opacity="0.9" />
    <text x="${canvasWidth / 2}" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="800" fill="${design.posterTitleColor}" letter-spacing="1">${title}</text>
    ${subtitle ? `<text x="${canvasWidth / 2}" y="156" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="${design.posterTitleColor}" opacity="0.72">${subtitle}</text>` : ''}
    <rect x="${qrX - 12}" y="${qrY - 12}" width="${qrBoxSize + 24}" height="${qrBoxSize + 24}" rx="28" fill="none" stroke="${design.posterFrameColor}" stroke-width="12" />
    ${buildQrCore(design, qrX, qrY, qrBoxSize)}
    ${includeCanvasElements ? buildCanvasElementsSvg(design.canvasElements, canvasWidth, canvasHeight) : ''}
    <text x="${canvasWidth / 2}" y="${canvasHeight - 70}" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="${design.posterBottomColor}" letter-spacing="1">${bottomText}</text>
  `;
}

function buildImageDerivedTemplateLayout(design, includeCanvasElements) {
  const template = design.templateDefinition;
  const width = template.width;
  const height = template.height;
  const overlays = (template.overlayRegions ?? [])
    .map(
      (region) => `<rect x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}" rx="${region.radius ?? 0}" fill="${region.fill}" fill-opacity="${region.opacity ?? 1}" />`,
    )
    .join('');
  const texts = (template.editableFields ?? [])
    .map((field) => {
      const value = escapeXml(design.templateTextValues?.[field.id] ?? field.default ?? '');
      return `<text id="${field.id}" x="${field.x}" y="${field.y}" fill="${field.fill ?? '#ffffff'}" font-size="${field.fontSize ?? 28}" font-weight="${field.fontWeight ?? 700}" text-anchor="${field.textAnchor ?? 'start'}" font-family="Arial, sans-serif">${value}</text>`;
    })
    .join('');
  const qr = template.qr;
  const qrSize = Math.min(qr.width, qr.height);
  const qrX = qr.x + (qr.width - qrSize) / 2;
  const qrY = qr.y + (qr.height - qrSize) / 2;

  return {
    width,
    height,
    markup: `
      ${template.background?.fill ? `<rect width="${width}" height="${height}" fill="${template.background.fill}" />` : ''}
      <image href="${template.backgroundImage}" width="${width}" height="${height}" preserveAspectRatio="none" />
      ${template.background?.frame ? `<rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="28" fill="none" stroke="${template.background.frame}" stroke-width="8" />` : ''}
      ${overlays}
      ${buildQrCore(design, qrX, qrY, qrSize)}
      ${texts}
      ${includeCanvasElements ? buildCanvasElementsSvg(design.canvasElements, width, height) : ''}
    `,
  };
}

function buildManualTemplateLayout(design, includeCanvasElements) {
  const template = design.templateDefinition;
  const width = template.width;
  const height = template.height;
  const qr = template.qr;
  const qrSize = Math.min(qr.width, qr.height);
  const qrX = qr.x + (qr.width - qrSize) / 2;
  const qrY = qr.y + (qr.height - qrSize) / 2;

  return {
    width,
    height,
    markup: `
      <image href="${template.backgroundImage}" width="${width}" height="${height}" preserveAspectRatio="none" />
      ${buildQrCore(design, qrX, qrY, qrSize)}
      ${includeCanvasElements ? buildCanvasElementsSvg(design.canvasElements, width, height) : ''}
    `,
  };
}

export function buildQrSvg(design, options = {}) {
  const includeCanvasElements = options.includeCanvasElements ?? true;
  const isImageTemplate = design.templateMode === 'image-derived' && design.templateDefinition;
  const isManualTemplate = design.templateMode === 'manual-builder' && design.templateDefinition;

  if (isImageTemplate) {
    const derived = buildImageDerivedTemplateLayout(design, includeCanvasElements);
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${derived.width}" height="${derived.height}" viewBox="0 0 ${derived.width} ${derived.height}" fill="none">
        <defs>
          ${createGradient(design)}
          ${getBackgroundPattern(design.backgroundPattern, design.backgroundColor)}
          <clipPath id="logoClip">
            <rect
              x="${Math.min(design.templateDefinition.qr.width, design.templateDefinition.qr.height) / 2 - design.logoSize / 2}"
              y="${Math.min(design.templateDefinition.qr.width, design.templateDefinition.qr.height) / 2 - design.logoSize / 2}"
              width="${design.logoSize}"
              height="${design.logoSize}"
              rx="${design.logoRadius}"
            />
          </clipPath>
        </defs>
        ${derived.markup}
        <metadata>${escapeXml('Dummy QR preview only. No real encoded data is present.')}</metadata>
      </svg>
    `.trim();
  }

  if (isManualTemplate) {
    const derived = buildManualTemplateLayout(design, includeCanvasElements);
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${derived.width}" height="${derived.height}" viewBox="0 0 ${derived.width} ${derived.height}" fill="none">
        <defs>
          ${createGradient(design)}
          ${getBackgroundPattern(design.backgroundPattern, design.backgroundColor)}
          <clipPath id="logoClip">
            <rect
              x="${Math.min(design.templateDefinition.qr.width, design.templateDefinition.qr.height) / 2 - design.logoSize / 2}"
              y="${Math.min(design.templateDefinition.qr.width, design.templateDefinition.qr.height) / 2 - design.logoSize / 2}"
              width="${design.logoSize}"
              height="${design.logoSize}"
              rx="${design.logoRadius}"
            />
          </clipPath>
        </defs>
        ${derived.markup}
        <metadata>${escapeXml('Dummy QR preview only. No real encoded data is present.')}</metadata>
      </svg>
    `.trim();
  }

  const posterEnabled = design.posterEnabled ?? true;
  const dimension = options.dimension ?? (posterEnabled ? 960 : 640);
  const width = posterEnabled ? 960 : dimension;
  const height = posterEnabled ? 760 : dimension;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
      <defs>
        ${createGradient(design)}
        ${getBackgroundPattern(design.backgroundPattern, design.backgroundColor)}
        <clipPath id="logoClip">
          <rect
            x="${(posterEnabled ? 420 : dimension) / 2 - design.logoSize / 2}"
            y="${(posterEnabled ? 420 : dimension) / 2 - design.logoSize / 2}"
            width="${design.logoSize}"
            height="${design.logoSize}"
            rx="${design.logoRadius}"
          />
        </clipPath>
      </defs>
      ${posterEnabled ? buildPosterLayout(design, width, height, includeCanvasElements) : `${buildQrCore(design, 0, 0, dimension)}${includeCanvasElements ? buildCanvasElementsSvg(design.canvasElements, width, height) : ''}`}
      <metadata>${escapeXml('Dummy QR preview only. No real encoded data is present.')}</metadata>
    </svg>
  `.trim();
}
