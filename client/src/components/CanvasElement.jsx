import { Trash2 } from 'lucide-react';

const HANDLE_SIZE = 12;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function snapValue(value, target, threshold = 0.015) {
  return Math.abs(value - target) <= threshold ? target : value;
}

function rectanglesOverlap(left, right) {
  if (!left || !right) return false;

  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

export function CanvasElement({
  element,
  isSelected,
  stageSize,
  forbiddenRect,
  onSelect,
  onDraftChange,
  onCommit,
  onDelete,
}) {
  const isTextElement = element.type === 'text';
  const isQrElement = element.type === 'qr';
  const isImagePlaceholder = !isTextElement && !isQrElement && !element.url;
  const boxStyle = {
    left: `${element.x * 100}%`,
    top: `${element.y * 100}%`,
    width: `${element.width * 100}%`,
    height: `${element.height * 100}%`,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: 'center center',
    zIndex: element.layer,
  };

  const startInteraction = (event, mode, handle = '') => {
    if (element.locked) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(element.id);

    const startX = event.clientX;
    const startY = event.clientY;
    const initial = { ...element };
    const centerX = (initial.x + initial.width / 2) * stageSize.width;
    const centerY = (initial.y + initial.height / 2) * stageSize.height;
    const startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
    const aspect = initial.width / initial.height;
    let lastValid = { ...initial };

    const handleMove = (moveEvent) => {
      const deltaX = (moveEvent.clientX - startX) / stageSize.width;
      const deltaY = (moveEvent.clientY - startY) / stageSize.height;
      let next = { ...initial };

      if (mode === 'drag' && element.draggable !== false) {
        next.x = clamp(initial.x + deltaX, 0, 1 - initial.width);
        next.y = clamp(initial.y + deltaY, 0, 1 - initial.height);
        next.x = snapValue(next.x, 0);
        next.y = snapValue(next.y, 0);
        next.x = snapValue(next.x, 1 - initial.width);
        next.y = snapValue(next.y, 1 - initial.height);
        next.x = snapValue(next.x, 0.5 - initial.width / 2);
        next.y = snapValue(next.y, 0.5 - initial.height / 2);
      }

      if (mode === 'resize' && element.resizable !== false) {
        const minSize = 0.06;
        let width = initial.width;
        let height = initial.height;
        let x = initial.x;
        let y = initial.y;

        const horizontal = handle.includes('e') ? deltaX : handle.includes('w') ? -deltaX : 0;
        const vertical = handle.includes('s') ? deltaY : handle.includes('n') ? -deltaY : 0;

        if (element.lockAspectRatio) {
          const dominant = Math.abs(horizontal) > Math.abs(vertical) ? horizontal : vertical;
          width = clamp(initial.width + dominant, minSize, 1);
          height = clamp(width / aspect, minSize, 1);
          if (handle.includes('w')) x = initial.x + (initial.width - width);
          if (handle.includes('n')) y = initial.y + (initial.height - height);
        } else {
          width = clamp(initial.width + horizontal, minSize, 1);
          height = clamp(initial.height + vertical, minSize, 1);
          if (handle.includes('w')) x = initial.x + (initial.width - width);
          if (handle.includes('n')) y = initial.y + (initial.height - height);
        }

        next.x = clamp(x, 0, 1 - width);
        next.y = clamp(y, 0, 1 - height);
        next.width = clamp(width, minSize, 1 - next.x);
        next.height = clamp(height, minSize, 1 - next.y);
      }

      if (mode === 'rotate' && element.rotatable !== false) {
        const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
        next.rotation = initial.rotation + (currentAngle - startAngle);
      }

      if (rectanglesOverlap(next, forbiddenRect)) {
        onDraftChange(lastValid);
        return;
      }

      lastValid = { ...next };
      onDraftChange(next);
    };

    const handleUp = () => {
      onCommit();
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      className={`canvas-element absolute ${isSelected ? 'selected' : ''}`}
      style={boxStyle}
      onPointerDown={(event) => startInteraction(event, 'drag')}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(element.id);
      }}
    >
      {isTextElement ? (
        <div
          className="pointer-events-none flex h-full w-full select-none overflow-hidden px-2 py-1"
          style={{
            color: element.color ?? '#ffffff',
            fontFamily: element.fontFamily ?? 'Manrope, sans-serif',
            fontSize: `${element.fontSize ?? 28}px`,
            fontWeight: element.fontWeight ?? 700,
            fontStyle: element.fontStyle ?? 'normal',
            letterSpacing: `${element.letterSpacing ?? 0}px`,
            lineHeight: element.lineHeight ?? 1.2,
            textAlign: element.textAlign ?? 'center',
            justifyContent:
              element.textAlign === 'left'
                ? 'flex-start'
                : element.textAlign === 'right'
                  ? 'flex-end'
                  : 'center',
            alignItems: 'center',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <span className="w-full">{element.text || 'Text'}</span>
        </div>
      ) : isQrElement ? (
        <div className="pointer-events-none flex h-full w-full items-center justify-center rounded-[1.25rem] border-2 border-dashed border-emerald-300/70 bg-emerald-400/10 text-center text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
          QR Region
        </div>
      ) : isImagePlaceholder ? (
        <div className="pointer-events-none flex h-full w-full items-center justify-center rounded-[1.25rem] border-2 border-dashed border-white/30 bg-white/10 px-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
          {element.placeholderLabel || 'Image Slot'}
        </div>
      ) : (
        <img
          src={element.url}
          alt="Canvas element"
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-contain"
        />
      )}

      {isSelected ? (
        <>
          {element.deletable !== false ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(element.id);
              }}
              className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-slate-950 text-white shadow-lg"
            >
              <Trash2 size={14} />
            </button>
          ) : null}

          {element.rotatable !== false ? (
            <button
              type="button"
              onPointerDown={(event) => startInteraction(event, 'rotate')}
              className="absolute left-1/2 top-[-28px] h-4 w-4 -translate-x-1/2 rounded-full border border-cyan-200 bg-cyan-400 shadow"
            />
          ) : null}

          {element.resizable !== false ? ['nw', 'ne', 'sw', 'se'].map((handle) => {
            const positions = {
              nw: { left: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2, cursor: 'nwse-resize' },
              ne: { right: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2, cursor: 'nesw-resize' },
              sw: { left: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2, cursor: 'nesw-resize' },
              se: { right: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2, cursor: 'nwse-resize' },
            };
            return (
              <button
                key={handle}
                type="button"
                onPointerDown={(event) => startInteraction(event, 'resize', handle)}
                className="absolute h-3 w-3 rounded-full border border-cyan-200 bg-cyan-400 shadow"
                style={positions[handle]}
              />
            );
          }) : null}
        </>
      ) : null}
    </div>
  );
}
