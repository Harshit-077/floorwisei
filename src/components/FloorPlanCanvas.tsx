import { useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Room, FurnitureItem, DoorItem, WindowItem, EditorTool } from '@/types/editor';

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
  | { mode: 'pan'; startX: number; startY: number; origPanX: number; origPanY: number };

const BASE_W = 1000;
const BASE_H = 700;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

export default function FloorPlanCanvas({
  rooms, furniture, doors, windows, selectedId, activeTool,
  onSelectItem, onMoveFurniture, onMoveRoom, onResizeRoom, onResizeFurniture, onResizeDoor, onResizeWindow, onMoveDoor, onMoveWindow, onDeleteItem,
  backgroundImage,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<DragMode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const viewBoxW = BASE_W / zoom;
  const viewBoxH = BASE_H / zoom;
  const viewBox = `${panX} ${panY} ${viewBoxW} ${viewBoxH}`;

  const getSVGPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: panX + ((clientX - rect.left) / rect.width) * viewBoxW,
      y: panY + ((clientY - rect.top) / rect.height) * viewBoxH,
    };
  }, [panX, panY, viewBoxW, viewBoxH]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseXFrac = (e.clientX - rect.left) / rect.width;
    const mouseYFrac = (e.clientY - rect.top) / rect.height;
    const mouseXSvg = panX + mouseXFrac * viewBoxW;
    const mouseYSvg = panY + mouseYFrac * viewBoxH;

    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
    const newVBW = BASE_W / newZoom;
    const newVBH = BASE_H / newZoom;

    setPanX(mouseXSvg - mouseXFrac * newVBW);
    setPanY(mouseYSvg - mouseYFrac * newVBH);
    setZoom(newZoom);
  }, [zoom, panX, panY, viewBoxW, viewBoxH]);

  const zoomIn = () => {
    const newZoom = Math.min(MAX_ZOOM, zoom * 1.3);
    const centerX = panX + viewBoxW / 2;
    const centerY = panY + viewBoxH / 2;
    const newVBW = BASE_W / newZoom;
    const newVBH = BASE_H / newZoom;
    setPanX(centerX - newVBW / 2);
    setPanY(centerY - newVBH / 2);
    setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(MIN_ZOOM, zoom / 1.3);
    const centerX = panX + viewBoxW / 2;
    const centerY = panY + viewBoxH / 2;
    const newVBW = BASE_W / newZoom;
    const newVBH = BASE_H / newZoom;
    setPanX(centerX - newVBW / 2);
    setPanY(centerY - newVBH / 2);
    setZoom(newZoom);
  };

  const resetView = () => { setZoom(1); setPanX(0); setPanY(0); };

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string, type: 'room' | 'furniture' | 'door' | 'window', itemX: number, itemY: number) => {
    e.stopPropagation();
    if (activeTool === 'delete') { onDeleteItem(id); return; }
    if (activeTool !== 'select') return;
    const pt = getSVGPoint(e);
    setDrag({ mode: 'move', id, type, offsetX: pt.x - itemX, offsetY: pt.y - itemY });
    onSelectItem(id);
  }, [activeTool, getSVGPoint, onSelectItem, onDeleteItem]);

  const handleTouchStart = useCallback((e: React.TouchEvent, id: string, type: 'room' | 'furniture' | 'door' | 'window', itemX: number, itemY: number) => {
    e.stopPropagation();
    if (activeTool === 'delete') { onDeleteItem(id); return; }
    if (activeTool !== 'select') return;
    const pt = getSVGPoint(e);
    setDrag({ mode: 'move', id, type, offsetX: pt.x - itemX, offsetY: pt.y - itemY });
    onSelectItem(id);
  }, [activeTool, getSVGPoint, onSelectItem, onDeleteItem]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string, itemType: 'room' | 'furniture' | 'door' | 'window', handle: string, x: number, y: number, w: number, h: number) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);
    setDrag({ mode: 'resize', id, itemType, handle, startX: pt.x, startY: pt.y, origX: x, origY: y, origW: w, origH: h });
  }, [getSVGPoint]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).id === 'grid-bg') {
      onSelectItem(null);
      // Start panning with middle click or when no tool interaction
      if (e.button === 1 || (activeTool === 'select' && e.target === svgRef.current)) {
        const pt = getSVGPoint(e);
        setDrag({ mode: 'pan', startX: pt.x, startY: pt.y, origPanX: panX, origPanY: panY });
      }
    }
  }, [onSelectItem, activeTool, getSVGPoint, panX, panY]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drag) return;
    e.preventDefault();
    const pt = getSVGPoint(e);

    if (drag.mode === 'pan') {
      const dx = pt.x - drag.startX;
      const dy = pt.y - drag.startY;
      setPanX(drag.origPanX - dx / 2);
      setPanY(drag.origPanY - dy / 2);
      return;
    }

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
    const up = () => setDrag(null);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('touchend', up); };
  }, []);

  const getFurnitureColor = (type: string) => {
    const colors: Record<string, string> = {
      'sofa-2-seater': 'hsl(210 29% 35%)', 'sofa-3-seater': 'hsl(210 29% 35%)', 'sofa-l-shape': 'hsl(210 32% 32%)',
      'sofa-sectional': 'hsl(210 32% 30%)', armchair: 'hsl(210 25% 40%)', recliner: 'hsl(210 28% 38%)',
      'coffee-table': 'hsl(30 40% 45%)', 'side-table': 'hsl(30 35% 48%)',
      'tv-unit': 'hsl(210 25% 30%)', bookshelf: 'hsl(30 35% 40%)',
      'bed-double': 'hsl(26 40% 50%)', 'bed-single': 'hsl(26 35% 55%)', 'bed-king': 'hsl(26 42% 48%)',
      wardrobe: 'hsl(210 30% 38%)', 'wardrobe-walk-in': 'hsl(210 28% 35%)',
      nightstand: 'hsl(30 35% 42%)', dresser: 'hsl(210 25% 42%)', vanity: 'hsl(30 30% 50%)',
      'dining-table-4': 'hsl(30 45% 42%)', 'dining-table-6': 'hsl(30 45% 42%)', 'dining-table-8': 'hsl(30 45% 40%)',
      chair: 'hsl(30 40% 48%)',
      'kitchen-counter': 'hsl(26 40% 45%)', 'kitchen-island': 'hsl(26 38% 42%)',
      stove: 'hsl(0 40% 40%)', fridge: 'hsl(210 30% 65%)',
      sink: 'hsl(210 35% 55%)', dishwasher: 'hsl(210 28% 50%)',
      bathtub: 'hsl(210 40% 60%)', shower: 'hsl(210 38% 58%)',
      toilet: 'hsl(0 0% 75%)', basin: 'hsl(210 30% 55%)', 'double-basin': 'hsl(210 30% 55%)',
      desk: 'hsl(30 35% 40%)', 'l-desk': 'hsl(30 35% 38%)', 'office-chair': 'hsl(210 30% 45%)',
      'filing-cabinet': 'hsl(210 25% 50%)',
      'car-porch': 'hsl(0 0% 60%)', staircase: 'hsl(30 25% 50%)', 'spiral-staircase': 'hsl(30 28% 48%)',
      hallway: 'hsl(30 15% 70%)', 'open-area': 'hsl(30 10% 75%)', garage: 'hsl(0 0% 55%)',
    };
    return colors[type] || 'hsl(210 30% 45%)';
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

  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg ref={svgRef} viewBox={viewBox} className="w-full h-full canvas-grid bg-card"
        onMouseMove={handleMove} onTouchMove={handleMove}
        onMouseUp={handleEnd} onTouchEnd={handleEnd}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
      >
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
            <rect x={room.x} y={room.y} width={room.width} height={room.height} fill={room.color} stroke={selectedId === room.id ? 'hsl(26 52% 64%)' : 'hsl(210 29% 24%)'} strokeWidth={selectedId === room.id ? 3 : 1.5} rx="4" />
            <text x={room.x + room.width / 2} y={room.y + room.height / 2 - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill="hsl(24 10% 10%)" style={{ fontFamily: 'Plus Jakarta Sans' }}>{room.name}</text>
            <text x={room.x + room.width / 2} y={room.y + room.height / 2 + 10} textAnchor="middle" fontSize="10" fill="hsl(24 5% 45%)" style={{ fontFamily: 'Plus Jakarta Sans' }}>{(room.width / 50 * 1.5).toFixed(1)}m × {(room.height / 50 * 1.5).toFixed(1)}m</text>
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
            <rect x={door.x} y={door.y} width={door.width} height={door.height} fill="hsl(26 52% 64%)" stroke={selectedId === door.id ? 'hsl(210 29% 24%)' : 'hsl(26 40% 50%)'} strokeWidth={selectedId === door.id ? 2 : 1} rx="2" />
            <text x={door.x + door.width / 2} y={door.y + door.height / 2 + 3} textAnchor="middle" fontSize="7" fill="hsl(0 0% 100%)" style={{ fontFamily: 'Plus Jakarta Sans' }}>Door</text>
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
            <rect x={win.x} y={win.y} width={win.width} height={win.height} fill="hsl(200 80% 85%)" stroke={selectedId === win.id ? 'hsl(26 52% 64%)' : 'hsl(200 50% 60%)'} strokeWidth={selectedId === win.id ? 2 : 1} rx="1" />
            <line x1={win.x + win.width / 2} y1={win.y} x2={win.x + win.width / 2} y2={win.y + win.height} stroke="hsl(200 50% 60%)" strokeWidth="0.5" />
            <text x={win.x + win.width / 2} y={win.y + win.height / 2 + 3} textAnchor="middle" fontSize="7" fill="hsl(200 40% 30%)" style={{ fontFamily: 'Plus Jakarta Sans' }}>Win</text>
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
            <rect x={item.x} y={item.y} width={item.width} height={item.height} fill={getFurnitureColor(item.type)} stroke={selectedId === item.id ? 'hsl(26 52% 64%)' : 'transparent'} strokeWidth={selectedId === item.id ? 2 : 0} rx="3" opacity="0.9" />
            <text x={item.x + item.width / 2} y={item.y + item.height / 2 - 2} textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(0 0% 100%)" style={{ fontFamily: 'Plus Jakarta Sans' }}>{item.label}</text>
            <text x={item.x + item.width / 2} y={item.y + item.height / 2 + 9} textAnchor="middle" fontSize="7" fill="hsl(0 0% 90%)" style={{ fontFamily: 'Plus Jakarta Sans' }}>{(item.width / 50 * 1.5).toFixed(1)}×{(item.height / 50 * 1.5).toFixed(1)}m</text>
            {renderHandles(item.id, item.x, item.y, item.width, item.height, 'furniture')}
          </g>
        ))}

        {rooms.length === 0 && furniture.length === 0 && doors.length === 0 && windows.length === 0 && (
          <text x="500" y="350" textAnchor="middle" fontSize="16" fill="hsl(24 5% 45%)" style={{ fontFamily: 'Plus Jakarta Sans' }}>Add rooms from the panel to get started</text>
        )}
      </svg>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-card/90 backdrop-blur-sm border border-border/50 rounded-xl p-1.5 shadow-lg">
        <Button variant="ghost" size="icon" onClick={zoomIn} className="h-8 w-8" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="text-center text-xs font-mono text-muted-foreground py-0.5">
          {Math.round(zoom * 100)}%
        </div>
        <Button variant="ghost" size="icon" onClick={zoomOut} className="h-8 w-8" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={resetView} className="h-8 w-8" title="Reset View">
          <Maximize className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
