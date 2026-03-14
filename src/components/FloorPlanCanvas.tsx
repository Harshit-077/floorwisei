import { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { Room, FurnitureItem, DoorItem, WindowItem, EditorTool } from '@/types/editor';

export interface CanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

interface Props {
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
  selectedId: string | null;
  activeTool: EditorTool;
  onSelectItem: (id: string | null) => void;
  onMoveFurniture: (id: string, x: number, y: number) => void;
  onMoveRoom: (id: string, x: number, y: number) => void;
  onResizeRoom: (id: string, width: number, height: number) => void;
  onResizeFurniture: (id: string, width: number, height: number) => void;
  onResizeDoor: (id: string, width: number, height: number) => void;
  onResizeWindow: (id: string, width: number, height: number) => void;
  onMoveDoor: (id: string, x: number, y: number) => void;
  onMoveWindow: (id: string, x: number, y: number) => void;
  onDeleteItem: (id: string) => void;
  backgroundImage?: string | null;
}

type DragMode =
  | { mode: 'move'; id: string; type: 'room' | 'furniture' | 'door' | 'window'; offsetX: number; offsetY: number }
  | { mode: 'resize'; id: string; itemType: 'room' | 'furniture' | 'door' | 'window'; handle: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number }
  | { mode: 'pan'; startX: number; startY: number; origTx: number; origTy: number };

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;
const CANVAS_W = 1000;
const CANVAS_H = 700;

const FloorPlanCanvas = forwardRef<CanvasHandle, Props>(({
  rooms, furniture, doors, windows, selectedId, activeTool,
  onSelectItem, onMoveFurniture, onMoveRoom, onResizeRoom, onResizeFurniture, onResizeDoor, onResizeWindow, onMoveDoor, onMoveWindow, onDeleteItem,
  backgroundImage,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<DragMode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  useImperativeHandle(ref, () => ({
    zoomIn: () => setZoom(z => Math.min(MAX_ZOOM, parseFloat((z * 1.25).toFixed(2)))),
    zoomOut: () => setZoom(z => Math.max(MIN_ZOOM, parseFloat((z / 1.25).toFixed(2)))),
    resetZoom: () => { setZoom(1); setTx(0); setTy(0); },
  }));

  // Convert screen coordinates to canvas (SVG-space) coordinates
  const getSVGPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const localX = (clientX - rect.left) * scaleX;
    const localY = (clientY - rect.top) * scaleY;
    // Inverse the zoom+pan transform: canvas coords = (screen - translate) / zoom
    return {
      x: (localX - tx) / zoom,
      y: (localY - ty) / zoom,
    };
  }, [zoom, tx, ty]);

  const getEventCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // ── Zoom via mouse wheel ──────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const localX = (e.clientX - rect.left) * scaleX;
    const localY = (e.clientY - rect.top) * scaleY;

    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(z => {
      const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta));
      // Zoom toward cursor: adjust tx/ty so the point under cursor stays fixed
      setTx(prevTx => localX - (localX - prevTx) * (newZ / z));
      setTy(prevTy => localY - (localY - prevTy) * (newZ / z));
      return newZ;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Item interaction ──────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent, id: string, type: 'room' | 'furniture' | 'door' | 'window', itemX: number, itemY: number) => {
    e.stopPropagation();
    if (activeTool === 'delete') { onDeleteItem(id); return; }
    if (activeTool !== 'select') return;
    const { clientX, clientY } = getEventCoords(e);
    const pt = getSVGPoint(clientX, clientY);
    setDrag({ mode: 'move', id, type, offsetX: pt.x - itemX, offsetY: pt.y - itemY });
    onSelectItem(id);
  }, [activeTool, getSVGPoint, onSelectItem, onDeleteItem]);

  const handleTouchStart = useCallback((e: React.TouchEvent, id: string, type: 'room' | 'furniture' | 'door' | 'window', itemX: number, itemY: number) => {
    e.stopPropagation();
    if (activeTool === 'delete') { onDeleteItem(id); return; }
    if (activeTool !== 'select') return;
    const { clientX, clientY } = getEventCoords(e);
    const pt = getSVGPoint(clientX, clientY);
    setDrag({ mode: 'move', id, type, offsetX: pt.x - itemX, offsetY: pt.y - itemY });
    onSelectItem(id);
  }, [activeTool, getSVGPoint, onSelectItem, onDeleteItem]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string, itemType: 'room' | 'furniture' | 'door' | 'window', handle: string, x: number, y: number, w: number, h: number) => {
    e.stopPropagation();
    const { clientX, clientY } = getEventCoords(e);
    const pt = getSVGPoint(clientX, clientY);
    setDrag({ mode: 'resize', id, itemType, handle, startX: pt.x, startY: pt.y, origX: x, origY: y, origW: w, origH: h });
  }, [getSVGPoint]);

  // ── Canvas pan (middle mouse or space+drag) ───────────────────────────
  const spaceDown = useRef(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') spaceDown.current = true; };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') spaceDown.current = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse or space+left = pan
    if (e.button === 1 || (e.button === 0 && spaceDown.current)) {
      e.preventDefault();
      setDrag({ mode: 'pan', startX: e.clientX, startY: e.clientY, origTx: tx, origTy: ty });
      return;
    }
    if (e.target === svgRef.current || (e.target as SVGElement).id === 'grid-bg' || (e.target as SVGElement).id === 'canvas-transform') {
      onSelectItem(null);
    }
  }, [tx, ty, onSelectItem]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drag) return;
    e.preventDefault();
    const { clientX, clientY } = getEventCoords(e);

    if (drag.mode === 'pan') {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      setTx(drag.origTx + (clientX - drag.startX) * scaleX);
      setTy(drag.origTy + (clientY - drag.startY) * scaleY);
      return;
    }

    const pt = getSVGPoint(clientX, clientY);

    if (drag.mode === 'move') {
      const newX = Math.round((pt.x - drag.offsetX) / 10) * 10;
      const newY = Math.round((pt.y - drag.offsetY) / 10) * 10;
      if (drag.type === 'furniture') onMoveFurniture(drag.id, newX, newY);
      else if (drag.type === 'door') onMoveDoor(drag.id, newX, newY);
      else if (drag.type === 'window') onMoveWindow(drag.id, newX, newY);
      else onMoveRoom(drag.id, newX, newY);
    } else if (drag.mode === 'resize') {
      const dx = pt.x - drag.startX;
      const dy = pt.y - drag.startY;
      let newW = drag.origW, newH = drag.origH, newX = drag.origX, newY = drag.origY;
      const MIN = drag.itemType === 'door' || drag.itemType === 'window' ? 20 : drag.itemType === 'furniture' ? 15 : 60;

      if (drag.handle.includes('e')) newW = Math.max(MIN, Math.round((drag.origW + dx) / 10) * 10);
      if (drag.handle.includes('s')) newH = Math.max(MIN, Math.round((drag.origH + dy) / 10) * 10);
      if (drag.handle.includes('w')) {
        const moved = Math.round(dx / 10) * 10;
        newW = Math.max(MIN, drag.origW - moved);
        if (newW !== MIN) newX = drag.origX + moved;
      }
      if (drag.handle.includes('n')) {
        const moved = Math.round(dy / 10) * 10;
        newH = Math.max(MIN, drag.origH - moved);
        if (newH !== MIN) newY = drag.origY + moved;
      }

      if (drag.itemType === 'room') { onMoveRoom(drag.id, newX, newY); onResizeRoom(drag.id, newW, newH); }
      else if (drag.itemType === 'furniture') { onMoveFurniture(drag.id, newX, newY); onResizeFurniture(drag.id, newW, newH); }
      else if (drag.itemType === 'window') { onMoveWindow(drag.id, newX, newY); onResizeWindow(drag.id, newW, newH); }
      else { onMoveDoor(drag.id, newX, newY); onResizeDoor(drag.id, newW, newH); }
    }
  }, [drag, getSVGPoint, onMoveFurniture, onMoveRoom, onMoveDoor, onMoveWindow, onResizeRoom, onResizeFurniture, onResizeDoor, onResizeWindow]);

  const handleEnd = useCallback(() => setDrag(null), []);

  useEffect(() => {
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    return () => { window.removeEventListener('mouseup', handleEnd); window.removeEventListener('touchend', handleEnd); };
  }, [handleEnd]);

  const getFurnitureColor = (type: string) => {
    const colors: Record<string, string> = {
      'sofa-2': 'hsl(210 29% 35%)', 'sofa-3': 'hsl(210 29% 30%)', 'sofa-l': 'hsl(210 29% 28%)',
      sofa: 'hsl(210 29% 35%)', armchair: 'hsl(210 25% 40%)', 'coffee-table': 'hsl(30 40% 45%)',
      'tv-unit': 'hsl(210 25% 30%)', bookshelf: 'hsl(30 35% 40%)',
      'bed-king': 'hsl(26 45% 45%)', 'bed-queen': 'hsl(26 42% 48%)',
      'bed-double': 'hsl(26 40% 50%)', 'bed-single': 'hsl(26 35% 55%)',
      wardrobe: 'hsl(210 30% 38%)', nightstand: 'hsl(30 35% 42%)',
      dresser: 'hsl(210 25% 42%)',
      'dining-4': 'hsl(30 45% 42%)', 'dining-6': 'hsl(30 42% 40%)', 'dining-8': 'hsl(30 40% 38%)',
      'dining-table': 'hsl(30 45% 42%)', chair: 'hsl(30 40% 48%)',
      'kitchen-counter': 'hsl(26 40% 45%)', 'kitchen-island': 'hsl(26 38% 43%)',
      stove: 'hsl(0 40% 40%)', fridge: 'hsl(210 30% 65%)',
      sink: 'hsl(210 35% 55%)', bathtub: 'hsl(210 40% 60%)', toilet: 'hsl(0 0% 75%)',
      basin: 'hsl(210 30% 55%)', shower: 'hsl(200 45% 62%)',
      desk: 'hsl(30 35% 40%)', 'office-chair': 'hsl(210 30% 45%)', 'filing-cabinet': 'hsl(210 20% 50%)',
      car: 'hsl(0 0% 55%)', staircase: 'hsl(30 25% 50%)',
    };
    return colors[type] || 'hsl(210 30% 45%)';
  };

  const getRoomFill = (room: Room) => {
    const typeColors: Record<string, string> = {
      hallway: 'hsl(210 20% 88%)',
      'open-area': 'hsl(140 20% 88%)',
      staircase: 'hsl(45 25% 83%)',
      garage: 'hsl(210 12% 80%)',
      gate: 'hsl(30 25% 80%)',
    };
    return room.roomType && typeColors[room.roomType] ? typeColors[room.roomType] : room.color;
  };

  const getRoomPattern = (room: Room) => {
    if (room.roomType === 'staircase') return 'url(#stairPattern)';
    if (room.roomType === 'hallway') return undefined;
    return undefined;
  };

  const HANDLE_SIZE = 10;
  const renderHandles = (id: string, x: number, y: number, width: number, height: number, itemType: 'room' | 'furniture' | 'door' | 'window') => {
    if (selectedId !== id || activeTool !== 'select') return null;
    const hs = itemType === 'room' ? HANDLE_SIZE : 8;
    const handles = [
      { key: 'n', hx: x + width / 2 - hs / 2, hy: y - hs / 2, cursor: 'ns-resize' },
      { key: 's', hx: x + width / 2 - hs / 2, hy: y + height - hs / 2, cursor: 'ns-resize' },
      { key: 'w', hx: x - hs / 2, hy: y + height / 2 - hs / 2, cursor: 'ew-resize' },
      { key: 'e', hx: x + width - hs / 2, hy: y + height / 2 - hs / 2, cursor: 'ew-resize' },
      { key: 'nw', hx: x - hs / 2, hy: y - hs / 2, cursor: 'nwse-resize' },
      { key: 'ne', hx: x + width - hs / 2, hy: y - hs / 2, cursor: 'nesw-resize' },
      { key: 'sw', hx: x - hs / 2, hy: y + height - hs / 2, cursor: 'nesw-resize' },
      { key: 'se', hx: x + width - hs / 2, hy: y + height - hs / 2, cursor: 'nwse-resize' },
    ];
    return handles.map(handle => (
      <rect key={handle.key} x={handle.hx} y={handle.hy} width={hs} height={hs}
        fill="hsl(26 52% 64%)" stroke="hsl(210 29% 24%)" strokeWidth="1" rx="2"
        style={{ cursor: handle.cursor }}
        onMouseDown={(e) => handleResizeStart(e, id, itemType, handle.key, x, y, width, height)}
        onTouchStart={(e) => handleResizeStart(e, id, itemType, handle.key, x, y, width, height)}
      />
    ));
  };

  const cursorStyle = drag?.mode === 'pan' ? 'grabbing' : spaceDown.current ? 'grab' : 'default';

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden" style={{ cursor: cursorStyle }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="w-full h-full bg-card canvas-grid"
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onMouseUp={handleEnd}
        onTouchEnd={handleEnd}
        onMouseDown={handleCanvasMouseDown}
      >
        <defs>
          <pattern id="stairPattern" patternUnits="userSpaceOnUse" width="12" height="8">
            <rect width="12" height="8" fill="hsl(45 25% 83%)" />
            <line x1="0" y1="8" x2="12" y2="8" stroke="hsl(45 20% 65%)" strokeWidth="1" />
          </pattern>
          <pattern id="gridPat" patternUnits="userSpaceOnUse" width={10 * zoom} height={10 * zoom}
            patternTransform={`translate(${tx % (10 * zoom)} ${ty % (10 * zoom)})`}>
            <path d={`M ${10 * zoom} 0 L 0 0 0 ${10 * zoom}`} fill="none" stroke="hsl(24 5% 80%)" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Grid background (stays fixed) */}
        <rect id="grid-bg" x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="url(#gridPat)" />

        {/* Transform group for zoom/pan */}
        <g id="canvas-transform" transform={`translate(${tx} ${ty}) scale(${zoom})`}>
          {backgroundImage && (
            <image href={backgroundImage} x="0" y="0" width="1000" height="700" opacity="0.3" preserveAspectRatio="xMidYMid slice" />
          )}

          {/* Rooms */}
          {rooms.map(room => (
            <g key={room.id}
              onMouseDown={(e) => handleMouseDown(e, room.id, 'room', room.x, room.y)}
              onTouchStart={(e) => handleTouchStart(e, room.id, 'room', room.x, room.y)}
              style={{ cursor: activeTool === 'select' ? 'move' : activeTool === 'delete' ? 'pointer' : 'default' }}
            >
              <rect x={room.x} y={room.y} width={room.width} height={room.height}
                fill={getRoomPattern(room) || getRoomFill(room)}
                stroke={selectedId === room.id ? 'hsl(26 52% 64%)' : 'hsl(210 29% 24%)'}
                strokeWidth={selectedId === room.id ? 3 : 1.5} rx="4" />
              {room.roomType === 'staircase' && (
                <rect x={room.x} y={room.y} width={room.width} height={room.height}
                  fill="url(#stairPattern)" opacity="0.7" rx="4" />
              )}
              <text x={room.x + room.width / 2} y={room.y + room.height / 2 - 6}
                textAnchor="middle" fontSize="12" fontWeight="600" fill="hsl(24 10% 10%)"
                style={{ fontFamily: 'Plus Jakarta Sans' }}>{room.name}</text>
              <text x={room.x + room.width / 2} y={room.y + room.height / 2 + 10}
                textAnchor="middle" fontSize="10" fill="hsl(24 5% 45%)"
                style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {(room.width / 50 * 1.5).toFixed(1)}m × {(room.height / 50 * 1.5).toFixed(1)}m
              </text>
              {renderHandles(room.id, room.x, room.y, room.width, room.height, 'room')}
            </g>
          ))}

          {/* Doors */}
          {doors.map(door => (
            <g key={door.id}
              onMouseDown={(e) => handleMouseDown(e, door.id, 'door', door.x, door.y)}
              onTouchStart={(e) => handleTouchStart(e, door.id, 'door', door.x, door.y)}
              style={{ cursor: activeTool === 'select' ? 'move' : activeTool === 'delete' ? 'pointer' : 'default' }}
              transform={`rotate(${door.rotation} ${door.x + door.width / 2} ${door.y + door.height / 2})`}
            >
              <rect x={door.x} y={door.y} width={door.width} height={door.height}
                fill="hsl(26 52% 64%)" stroke={selectedId === door.id ? 'hsl(210 29% 24%)' : 'hsl(26 40% 50%)'}
                strokeWidth={selectedId === door.id ? 2 : 1} rx="2" />
              {/* Door swing arc */}
              <path d={`M ${door.x} ${door.y + door.height / 2} A ${door.width / 2} ${door.width / 2} 0 0 1 ${door.x + door.width / 2} ${door.y}`}
                fill="none" stroke="hsl(26 40% 50%)" strokeWidth="0.8" strokeDasharray="3,2" />
              <text x={door.x + door.width / 2} y={door.y + door.height / 2 + 3}
                textAnchor="middle" fontSize="7" fill="hsl(0 0% 100%)"
                style={{ fontFamily: 'Plus Jakarta Sans' }}>Door</text>
              {renderHandles(door.id, door.x, door.y, door.width, door.height, 'door')}
            </g>
          ))}

          {/* Windows */}
          {windows.map(win => (
            <g key={win.id}
              onMouseDown={(e) => handleMouseDown(e, win.id, 'window', win.x, win.y)}
              onTouchStart={(e) => handleTouchStart(e, win.id, 'window', win.x, win.y)}
              style={{ cursor: activeTool === 'select' ? 'move' : activeTool === 'delete' ? 'pointer' : 'default' }}
              transform={`rotate(${win.rotation} ${win.x + win.width / 2} ${win.y + win.height / 2})`}
            >
              <rect x={win.x} y={win.y} width={win.width} height={win.height}
                fill="hsl(200 80% 85%)" stroke={selectedId === win.id ? 'hsl(26 52% 64%)' : 'hsl(200 50% 60%)'}
                strokeWidth={selectedId === win.id ? 2 : 1} rx="1" />
              <line x1={win.x} y1={win.y + win.height / 2} x2={win.x + win.width} y2={win.y + win.height / 2}
                stroke="hsl(200 50% 60%)" strokeWidth="0.8" />
              <line x1={win.x + win.width / 2} y1={win.y} x2={win.x + win.width / 2} y2={win.y + win.height}
                stroke="hsl(200 50% 60%)" strokeWidth="0.5" />
              <text x={win.x + win.width / 2} y={win.y + win.height / 2 + 3}
                textAnchor="middle" fontSize="7" fill="hsl(200 40% 30%)"
                style={{ fontFamily: 'Plus Jakarta Sans' }}>Win</text>
              {renderHandles(win.id, win.x, win.y, win.width, win.height, 'window')}
            </g>
          ))}

          {/* Furniture */}
          {furniture.map(item => (
            <g key={item.id}
              onMouseDown={(e) => handleMouseDown(e, item.id, 'furniture', item.x, item.y)}
              onTouchStart={(e) => handleTouchStart(e, item.id, 'furniture', item.x, item.y)}
              style={{ cursor: activeTool === 'select' ? 'move' : activeTool === 'delete' ? 'pointer' : 'default' }}
              transform={`rotate(${item.rotation} ${item.x + item.width / 2} ${item.y + item.height / 2})`}
            >
              <rect x={item.x} y={item.y} width={item.width} height={item.height}
                fill={getFurnitureColor(item.type)}
                stroke={selectedId === item.id ? 'hsl(26 52% 64%)' : 'transparent'}
                strokeWidth={selectedId === item.id ? 2 : 0} rx="3" opacity="0.9" />
              <text x={item.x + item.width / 2} y={item.y + item.height / 2 - 2}
                textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(0 0% 100%)"
                style={{ fontFamily: 'Plus Jakarta Sans' }}>{item.label}</text>
              <text x={item.x + item.width / 2} y={item.y + item.height / 2 + 9}
                textAnchor="middle" fontSize="7" fill="hsl(0 0% 90%)"
                style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {(item.width / 50 * 1.5).toFixed(1)}×{(item.height / 50 * 1.5).toFixed(1)}m
              </text>
              {renderHandles(item.id, item.x, item.y, item.width, item.height, 'furniture')}
            </g>
          ))}

          {rooms.length === 0 && furniture.length === 0 && doors.length === 0 && windows.length === 0 && (
            <text x="500" y="350" textAnchor="middle" fontSize="16" fill="hsl(24 5% 45%)"
              style={{ fontFamily: 'Plus Jakarta Sans' }}>Add rooms from the panel to get started</text>
          )}
        </g>

        {/* Zoom indicator */}
        <text x="8" y={CANVAS_H - 8} fontSize="10" fill="hsl(24 5% 55%)" style={{ fontFamily: 'monospace' }}>
          {Math.round(zoom * 100)}%
        </text>
      </svg>
    </div>
  );
});

FloorPlanCanvas.displayName = 'FloorPlanCanvas';
export default FloorPlanCanvas;
