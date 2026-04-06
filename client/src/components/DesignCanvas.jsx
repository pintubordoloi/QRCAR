import { useEffect, useMemo, useRef, useState } from 'react';
import { CanvasElement } from './CanvasElement';

function sortByLayer(elements) {
  return [...elements].sort((a, b) => a.layer - b.layer);
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

export function DesignCanvas({
  svgMarkup,
  elements,
  selectedElementId,
  forbiddenRect,
  newElementSize,
  onSelectElement,
  onDropAsset,
  onCommitElements,
  onDeleteElement,
}) {
  const stageRef = useRef(null);
  const draftRef = useRef(elements);
  const [draftElements, setDraftElements] = useState(elements);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });

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

  return (
    <div
      ref={stageRef}
      className="preview-svg relative"
      onClick={() => onSelectElement(null)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (!stageRef.current) return;
        const rect = stageRef.current.getBoundingClientRect();
        const payload = event.dataTransfer.getData('application/x-canvas-element');
        const presetUrl = event.dataTransfer.getData('text/preset-asset-url') || event.dataTransfer.getData('text/plain');

        let width = newElementSize?.width ?? 0.12;
        let height = newElementSize?.height ?? 0.12;
        let nextPayload = null;

        if (payload) {
          try {
            nextPayload = JSON.parse(payload);
            width = nextPayload.width ?? width;
            height = nextPayload.height ?? height;
          } catch (_error) {
            nextPayload = null;
          }
        }

        if (!nextPayload && !presetUrl) return;

        const x = Math.max(0, Math.min(1 - width, (event.clientX - rect.left) / rect.width - width / 2));
        const y = Math.max(0, Math.min(1 - height, (event.clientY - rect.top) / rect.height - height / 2));

        if (rectanglesOverlap({ x, y, width, height }, forbiddenRect)) {
          return;
        }

        onDropAsset(
          nextPayload?.type === 'text'
            ? { ...nextPayload, x, y }
            : { type: 'image', url: presetUrl, x, y },
        );
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: svgMarkup }} />

      <div className="absolute inset-0">
        {orderedElements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={selectedElementId === element.id}
            stageSize={stageSize}
            forbiddenRect={forbiddenRect}
            onSelect={onSelectElement}
            onDraftChange={(updatedElement) => {
              setDraftElements((current) => {
                const next = current.map((item) => (item.id === updatedElement.id ? updatedElement : item));
                draftRef.current = next;
                return next;
              });
            }}
            onCommit={() => onCommitElements(draftRef.current)}
            onDelete={onDeleteElement}
          />
        ))}
      </div>
    </div>
  );
}
