import { useState, useEffect } from 'react';
import { Ruler, RotateCw, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Room, FurnitureItem, DoorItem, WindowItem } from '@/types/editor';

interface Props {
  selectedId: string | null;
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
  onResizeRoom: (id: string, width: number, height: number) => void;
  onResizeFurniture: (id: string, width: number, height: number) => void;
  onResizeDoor: (id: string, width: number, height: number) => void;
  onResizeWindow: (id: string, width: number, height: number) => void;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
  onRenameRoom?: (id: string, name: string) => void;
}

function toMeters(px: number) { return (px / 50 * 1.5).toFixed(2); }
function fromMeters(m: string) { return Math.round((parseFloat(m) / 1.5) * 50); }

export default function PropertiesPanel({
  selectedId, rooms, furniture, doors, windows,
  onResizeRoom, onResizeFurniture, onResizeDoor, onResizeWindow,
  onRotateSelected, onDeleteSelected, onRenameRoom,
}: Props) {
  const room = rooms.find(r => r.id === selectedId);
  const furn = furniture.find(f => f.id === selectedId);
  const door = doors.find(d => d.id === selectedId);
  const win = windows.find(w => w.id === selectedId);
  const item = room || furn || door || win;

  const [widthM, setWidthM] = useState('');
  const [heightM, setHeightM] = useState('');
  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  useEffect(() => {
    if (item) {
      setWidthM(toMeters(item.width));
      setHeightM(toMeters(item.height));
    }
    if (room) {
      setNameValue(room.name);
      setEditName(false);
    }
  }, [item?.id, item?.width, item?.height]);

  if (!item || !selectedId) {
    return (
      <div className="w-60 bg-card border-l border-border/50 p-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground font-sans text-center">Select an item to view properties</p>
      </div>
    );
  }

  const itemType = room ? 'Room' : furn ? 'Furniture' : door ? 'Door' : 'Window';
  const itemName = room ? room.name : furn ? furn.label : door ? 'Door' : 'Window';
  const rotation = furn ? furn.rotation : door ? door.rotation : win ? win.rotation : 0;
  const canRotate = !!furn || !!door || !!win;

  const applySize = () => {
    const w = fromMeters(widthM);
    const h = fromMeters(heightM);
    if (isNaN(w) || isNaN(h) || w < 10 || h < 10) return;
    if (room) onResizeRoom(selectedId, w, h);
    else if (furn) onResizeFurniture(selectedId, w, h);
    else if (door) onResizeDoor(selectedId, w, h);
    else if (win) onResizeWindow(selectedId, w, h);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applySize();
  };

  const applyRename = () => {
    if (room && onRenameRoom && nameValue.trim()) {
      onRenameRoom(selectedId, nameValue.trim());
    }
    setEditName(false);
  };

  const area = (parseFloat(widthM) * parseFloat(heightM)).toFixed(2);

  return (
    <div className="w-60 bg-card border-l border-border/50 p-4 space-y-5 overflow-y-auto">
      {/* Header */}
      <div>
        {room && editName ? (
          <input value={nameValue} onChange={e => setNameValue(e.target.value)}
            onBlur={applyRename} onKeyDown={e => e.key === 'Enter' && applyRename()} autoFocus
            className="text-sm font-display font-bold bg-background px-2 py-1 rounded border border-border outline-none focus:ring-2 focus:ring-ring w-full" />
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-display font-bold truncate">{itemName}</h3>
            {room && onRenameRoom && (
              <button onClick={() => setEditName(true)} className="text-muted-foreground hover:text-foreground p-0.5">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        <span className="text-xs text-muted-foreground font-sans">{itemType}</span>
        {room && <div className="w-full h-2 rounded-full mt-2" style={{ backgroundColor: room.color }} />}
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
          <Ruler className="w-3.5 h-3.5" /> Dimensions (meters)
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-sans text-muted-foreground">Width</label>
            <input value={widthM} onChange={e => setWidthM(e.target.value)} onBlur={applySize} onKeyDown={handleKeyDown}
              className="w-full mt-1 px-2.5 py-1.5 bg-muted rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-sans text-muted-foreground">Height</label>
            <input value={heightM} onChange={e => setHeightM(e.target.value)} onBlur={applySize} onKeyDown={handleKeyDown}
              className="w-full mt-1 px-2.5 py-1.5 bg-muted rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div className="flex justify-between text-xs font-sans">
          <span className="text-muted-foreground">Area</span>
          <span className="font-medium">{area} m²</span>
        </div>
        {canRotate && (
          <div className="flex justify-between text-xs font-sans">
            <span className="text-muted-foreground">Rotation</span>
            <span className="font-medium">{rotation}°</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {canRotate && (
          <Button size="sm" variant="outline" onClick={onRotateSelected} className="w-full gap-2 font-sans text-xs">
            <RotateCw className="w-3.5 h-3.5" /> Rotate
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onDeleteSelected} className="w-full gap-2 font-sans text-xs text-destructive hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}
