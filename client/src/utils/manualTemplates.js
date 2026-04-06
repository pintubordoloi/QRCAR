function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeName(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function createTemplateElement(type, bounds, index = 0) {
  const baseId = `${type}_${index + 1}_${Math.random().toString(36).slice(2, 6)}`;
  const element = {
    id: baseId,
    type,
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width: Math.round(bounds.width),
    height: Math.round(bounds.height),
    layer: index,
    draggable: true,
    resizable: true,
    deletable: true,
    locked: false,
  };

  if (type === 'text') {
    return {
      ...element,
      text: 'Edit me',
      fontSize: Math.max(20, Math.round(bounds.height * 0.42)),
      fontWeight: 700,
      color: '#ffffff',
      textAlign: 'center',
      fontFamily: 'Manrope, sans-serif',
      fontStyle: 'normal',
      letterSpacing: 0,
      lineHeight: 1.2,
    };
  }

  if (type === 'qr') {
    return {
      ...element,
      cornerRadius: 18,
    };
  }

  return {
    ...element,
    placeholderLabel: 'Upload logo',
    imageUrl: '',
    lockAspectRatio: true,
  };
}

export function buildManualTemplatePayload({
  id = '',
  templateName,
  category = '',
  backgroundImage,
  width,
  height,
  elements,
}) {
  return {
    id,
    templateName: templateName?.trim() || 'Untitled Template',
    category: category?.trim() || '',
    width,
    height,
    backgroundImage,
    previewImage: backgroundImage,
    elements: [...elements].sort((left, right) => (left.layer ?? 0) - (right.layer ?? 0)),
  };
}

export function manualTemplateToPreset(template) {
  return {
    id: template.id,
    name: template.templateName,
    description: template.category ? `Builder template • ${template.category}` : 'Builder template',
    previewImage: template.previewImage || template.backgroundImage,
    source: 'Builder',
    appDesign: manualTemplateToAppDesign(template),
  };
}

export function manualTemplateToAppDesign(template) {
  const qrElement = template.elements.find((element) => element.type === 'qr') ?? {
    id: 'qr-area',
    x: Math.round(template.width * 0.35),
    y: Math.round(template.height * 0.26),
    width: Math.round(Math.min(template.width, template.height) * 0.3),
    height: Math.round(Math.min(template.width, template.height) * 0.3),
  };

  const canvasElements = template.elements
    .filter((element) => element.type !== 'qr')
    .map((element, index) => {
      const base = {
        id: element.id,
        x: clamp(element.x / template.width, 0, 1),
        y: clamp(element.y / template.height, 0, 1),
        width: clamp(element.width / template.width, 0.04, 1),
        height: clamp(element.height / template.height, 0.04, 1),
        rotation: element.rotation ?? 0,
        layer: element.layer ?? index,
        deletable: element.deletable ?? true,
        resizable: element.resizable ?? true,
        draggable: element.draggable ?? true,
        locked: element.locked ?? false,
      };

      if (element.type === 'text') {
        return {
          ...base,
          type: 'text',
          text: element.text || 'Edit me',
          fontSize: element.fontSize ?? 32,
          fontWeight: element.fontWeight ?? 700,
          color: element.color ?? '#ffffff',
          textAlign: element.textAlign ?? 'center',
          fontFamily: element.fontFamily ?? 'Manrope, sans-serif',
          fontStyle: element.fontStyle ?? 'normal',
          letterSpacing: element.letterSpacing ?? 0,
          lineHeight: element.lineHeight ?? 1.2,
          lockAspectRatio: false,
          sourceTemplateElementId: element.id,
        };
      }

      return {
        ...base,
        type: 'image',
        url: element.imageUrl || '',
        placeholderLabel: element.placeholderLabel || 'Upload image',
        lockAspectRatio: element.lockAspectRatio ?? true,
        sourceTemplateElementId: element.id,
      };
    });

  return {
    templateMode: 'manual-builder',
    templateDefinition: {
      templateName: template.templateName,
      width: template.width,
      height: template.height,
      backgroundImage: template.backgroundImage,
      qr: {
        id: qrElement.id || 'qr-area',
        x: qrElement.x,
        y: qrElement.y,
        width: qrElement.width,
        height: qrElement.height,
      },
      editableFields: [],
      overlayRegions: [],
      background: null,
      elements: template.elements,
    },
    templateTextValues: {},
    canvasElements,
    posterEnabled: false,
    presetImageSrc: template.previewImage || template.backgroundImage,
  };
}

export function templateElementsFromCanvas(elements, dimensions) {
  return elements.map((element, index) => {
    const base = {
      id: element.id || `${element.type}_${index + 1}`,
      type: element.type,
      x: Math.round(element.x * dimensions.width),
      y: Math.round(element.y * dimensions.height),
      width: Math.round(element.width * dimensions.width),
      height: Math.round(element.height * dimensions.height),
      layer: element.layer ?? index,
      draggable: element.draggable ?? true,
      resizable: element.resizable ?? true,
      deletable: element.deletable ?? true,
      locked: element.locked ?? false,
    };

    if (element.type === 'text') {
      return {
        ...base,
        text: element.text,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        color: element.color,
        textAlign: element.textAlign,
        fontFamily: element.fontFamily,
        fontStyle: element.fontStyle,
        letterSpacing: element.letterSpacing,
        lineHeight: element.lineHeight,
      };
    }

    return {
      ...base,
      imageUrl: element.url || '',
      placeholderLabel: element.placeholderLabel || 'Upload image',
      lockAspectRatio: element.lockAspectRatio ?? true,
    };
  });
}

export function defaultTemplateNameFromFile(fileName = '') {
  const clean = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim();
  return clean ? clean.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Untitled Template';
}

export function createTemplateSlug(templateName = '') {
  return sanitizeName(templateName) || 'template';
}
