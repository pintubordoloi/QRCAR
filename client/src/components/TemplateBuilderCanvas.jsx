import { useEffect, useMemo, useRef, useState } from 'react';
import { CanvasElement } from './CanvasElement';

function sortByLayer(elements) {
  return [...elements].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizePointer(event, rect) {
  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
  };
}

export function TemplateBuilderCanvas({
  backgroundImage,
  elements,
  selectedElementId,
  onSelectElement,
  onChangeElements,
  onCreateElement,
  onDeleteElement,
}) {
  const stageRef = useRef(null);
  const draftRef = useRef(elements);
  const [draftElements, setDraftElements] = useState(elements);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const [drawingState, setDrawingState] = useState(null);

  useEffect(() => {
    setDraftElements(elements);
    draftRef.current = elements;
  }, [elements]);

  useEffect(() => {
    const updateSize = () => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      setStageSize({
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (stageRef.current) {
      observer.observe(stageRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const orderedElements = useMemo(() => sortByLayer(draftElements), [draftElements]);

  const commitElements = (nextElements) => {
    draftRef.current = nextElements;
    onChangeElements(nextElements);
  };

  return (
    <div
      ref={stageRef}
      className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/70"
      onClick={() => onSelectElement(null)}
      onPointerDown={(event) => {
        if (!backgroundImage || event.target.closest('.canvas-element')) return;
        const rect = stageRef.current.getBoundingClientRect();
        const start = normalizePointer(event, rect);
        setDrawingState({ start, current: start });
      }}
      onPointerMove={(event) => {
        if (!drawingState || !stageRef.current) return;
        const rect = stageRef.current.getBoundingClientRect();
        const current = normalizePointer(event, rect);
        setDrawingState((state) => ({ ...state, current }));
      }}
      onPointerUp={() => {
        if (!drawingState || !stageRef.current) return;
        const minSize = 0.03;
        const left = Math.min(drawingState.start.x, drawingState.current.x);
        const top = Math.min(drawingState.start.y, drawingState.current.y);
        const width = Math.abs(drawingState.current.x - drawingState.start.x);
        const height = Math.abs(drawingState.current.y - drawingState.start.y);
        setDrawingState(null);

        if (width < minSize || height < minSize) return;

        const selectedType = window.prompt('Region type: text, qr, or image', 'text');
        if (!selectedType) return;
        const type = selectedType.trim().toLowerCase();
        if (!['text', 'qr', 'image'].includes(type)) {
          window.alert('Please enter text, qr, or image.');
          return;
        }

        onCreateElement({
          type,
          x: left,
          y: top,
          width,
          height,
        });
      }}
    >
      {backgroundImage ? (
        <img src={backgroundImage} alt="Template background" className="block h-auto w-full select-none" draggable={false} />
      ) : (
        <div className="flex min-h-[520px] items-center justify-center text-sm text-slate-500">
          Upload a background image to start building a template.
        </div>
      )}

      {backgroundImage ? <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px]" /> : null}

      <div className="absolute inset-0">
        {orderedElements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={selectedElementId === element.id}
            stageSize={stageSize}
            forbiddenRect={null}
            onSelect={onSelectElement}
            onDraftChange={(updatedElement) => {
              setDraftElements((current) => {
                const next = current.map((item) => (item.id === updatedElement.id ? updatedElement : item));
                draftRef.current = next;
                return next;
              });
            }}
            onCommit={() => commitElements(draftRef.current)}
            onDelete={onDeleteElement}
          />
        ))}
      </div>

      {drawingState ? (
        <div
          className="pointer-events-none absolute border-2 border-dashed border-cyan-300 bg-cyan-400/10"
          style={{
            left: `${Math.min(drawingState.start.x, drawingState.current.x) * 100}%`,
            top: `${Math.min(drawingState.start.y, drawingState.current.y) * 100}%`,
            width: `${Math.abs(drawingState.current.x - drawingState.start.x) * 100}%`,
            height: `${Math.abs(drawingState.current.y - drawingState.start.y) * 100}%`,
          }}
        />
      ) : null}
    </div>
  );
}
