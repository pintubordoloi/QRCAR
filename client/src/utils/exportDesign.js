import { buildQrSvg } from './svgBuilder';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportSvg(design, download = true) {
  const svg = buildQrSvg(design);
  if (download) {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `qr-design-preview-${Date.now()}.svg`);
  }
  return svg;
}

export async function exportPng(design, scale = 0.45, download = true) {
  const svg = buildQrSvg(design);
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  const dataUrl = await new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = true;
      context.filter = 'blur(0.4px)';
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png', 0.72));
      URL.revokeObjectURL(url);
    };
    image.onerror = reject;
    image.src = url;
  });

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  if (download) {
    downloadBlob(blob, `qr-design-preview-${Date.now()}.png`);
  }
  return { svg, pngDataUrl: dataUrl };
}
