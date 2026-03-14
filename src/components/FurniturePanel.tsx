import { useState } from 'react';
import { FURNITURE_CATALOG, ROOM_PRESETS, AREA_PRESETS, DOOR_PRESETS, WINDOW_PRESETS, PLOT_PRESETS } from '@/types/editor';
import { Button } from '@/components/ui/button';
import {
  Sofa, BedDouble, UtensilsCrossed, Bath, Briefcase, LayoutGrid,
  ChevronDown, ChevronRight, RotateCw, Trash2, DoorOpen, Plus, Sparkles, Car,
  Layers, Workflow,
} from 'lucide-react';

interface Props {
  onAddFurniture: (type: string, label: string, width: number, height: number) => void;
  onAddRoom: (name: string, width: number, height: number, color: string, roomType?: string) => void;
  onAddDoor: (label: string, width: number, height: number) => void;
  onAddWindow: (label: string, width: number, height: number) => void;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  onGeneratePlotLayout?: (plotIndex: number) => void;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Living: Sofa, Bedroom: BedDouble, Dining: UtensilsCrossed, Kitchen: UtensilsCrossed,
  Bathroom: Bath, Office: Briefcase, Exterior: Car,
};

// Group furniture catalog: find items with parentType (variants) vs standalone
const getCategories = () => {
  const cats = [...new Set(FURNITURE_CATALOG.map(f => f.category))];
  return cats;
};

const getCategoryItems = (cat: string) => {
  const items = FURNITURE_CATALOG.filter(f => f.category === cat);
  // Group by parentType; standalone items have no parentType
  const grouped: { label: string; type: string; width: number; height: number; variants?: typeof items }[] = [];
  const seen = new Set<string>();

  items.forEach(item => {
    if (item.parentType) {
      if (!seen.has(item.parentType)) {
        seen.add(item.parentType);
        const variants = items.filter(i => i.parentType === item.parentType);
        grouped.push({ label: capitalize(item.parentType.replace('-', ' ')), type: item.parentType, width: variants[0].width, height: variants[0].height, variants });
      }
    } else {
      if (!seen.has(item.type)) {
        seen.add(item.type);
        grouped.push({ label: item.label, type: item.type, width: item.width, height: item.height });
      }
    }
  });
  return grouped;
};

function capitalize(str: string) { return str.charAt(0).toUpperCase() + str.slice(1); }

export default function FurniturePanel({ onAddFurniture, onAddRoom, onAddDoor, onAddWindow, onRotateSelected, onDeleteSelected, hasSelection, onGeneratePlotLayout }: Props) {
  const [expandedCat, setExpandedCat] = useState<string>('Living');
  const [expandedParent, setExpandedParent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'rooms' | 'areas' | 'doors' | 'windows' | 'furniture'>('rooms');
  const [customRoomName, setCustomRoomName] = useState('Custom Room');
  const [customRoomW, setCustomRoomW] = useState('4.0');
  const [customRoomH, setCustomRoomH] = useState('3.5');
  const [showCustomRoom, setShowCustomRoom] = useState(false);
  const [showPlots, setShowPlots] = useState(false);

  const categories = getCategories();

  const addCustomRoom = () => {
    const w = Math.round((parseFloat(customRoomW) / 1.5) * 50);
    const h = Math.round((parseFloat(customRoomH) / 1.5) * 50);
    if (isNaN(w) || isNaN(h) || w < 30 || h < 30) return;
    onAddRoom(customRoomName || 'Custom Room', w, h, 'hsl(30 15% 88%)', 'room');
    setShowCustomRoom(false);
  };

  const TABS = [
    { key: 'rooms', icon: LayoutGrid, label: 'Rooms' },
    { key: 'areas', icon: Layers, label: 'Areas' },
    { key: 'doors', icon: DoorOpen, label: 'Doors' },
    { key: 'windows', icon: Workflow, label: 'Windows' },
    { key: 'furniture', icon: Sofa, label: 'Furniture' },
  ] as const;

  return (
    <div className="w-72 bg-card border-r border-border/50 flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="grid grid-cols-5 border-b border-border/50">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
            className={`py-2.5 text-xs font-sans font-medium flex flex-col items-center gap-1 transition-colors ${activeTab === key ? 'text-secondary border-b-2 border-secondary bg-secondary/5' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-3.5 h-3.5" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </div>

      {/* Selection controls */}
      {hasSelection && (
        <div className="p-3 border-b border-border/50 bg-secondary/5">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onRotateSelected} className="flex-1 gap-1 font-sans text-xs">
              <RotateCw className="w-3 h-3" /> Rotate
            </Button>
            <Button size="sm" variant="outline" onClick={onDeleteSelected} className="flex-1 gap-1 font-sans text-xs text-destructive hover:text-destructive">
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">

        {/* ── ROOMS ── */}
        {activeTab === 'rooms' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-sans px-1">Click to add a room to the canvas</p>

            {/* Plot Presets */}
            <button onClick={() => setShowPlots(!showPlots)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary/10 text-sm font-sans font-medium text-secondary hover:bg-secondary/15 transition-colors">
              <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" />Plot Presets (AI Layout)</span>
              {showPlots ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {showPlots && (
              <div className="space-y-1 pl-2">
                {PLOT_PRESETS.map((plot, i) => (
                  <button key={i} onClick={() => onGeneratePlotLayout?.(i)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-sans font-medium text-foreground block">{plot.label}</span>
                    <span className="text-xs text-muted-foreground font-sans">{plot.widthFt}ft × {plot.depthFt}ft</span>
                  </button>
                ))}
              </div>
            )}

            {/* Room Presets */}
            {ROOM_PRESETS.map(preset => (
              <button key={preset.name} onClick={() => onAddRoom(preset.name, preset.width, preset.height, preset.color, preset.roomType)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: preset.color }}>
                  <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-sans font-medium text-foreground block">{preset.name}</span>
                  <span className="text-xs text-muted-foreground font-sans">{(preset.width / 50 * 1.5).toFixed(1)}m × {(preset.height / 50 * 1.5).toFixed(1)}m</span>
                </div>
              </button>
            ))}

            {/* Custom Room */}
            <button onClick={() => setShowCustomRoom(!showCustomRoom)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <Plus className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-sans font-medium">Custom Room</span>
            </button>
            {showCustomRoom && (
              <div className="pl-2 space-y-2 pb-2">
                <div>
                  <label className="text-xs font-sans text-muted-foreground">Room Name</label>
                  <input value={customRoomName} onChange={e => setCustomRoomName(e.target.value)} placeholder="e.g. Store Room"
                    className="w-full mt-1 px-2.5 py-1.5 bg-background rounded-lg text-sm font-sans outline-none focus:ring-2 focus:ring-ring border border-border" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-sans text-muted-foreground">Width (m)</label>
                    <input value={customRoomW} onChange={e => setCustomRoomW(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-background rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-ring border border-border" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-sans text-muted-foreground">Height (m)</label>
                    <input value={customRoomH} onChange={e => setCustomRoomH(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-background rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-ring border border-border" />
                  </div>
                </div>
                <Button size="sm" onClick={addCustomRoom} className="w-full gradient-accent text-accent-foreground border-0 font-sans text-xs">Add Custom Room</Button>
              </div>
            )}
          </div>
        )}

        {/* ── AREAS ── */}
        {activeTab === 'areas' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-sans px-1">Add hallways, open areas, staircases and more</p>
            {AREA_PRESETS.map(preset => (
              <button key={preset.name} onClick={() => onAddRoom(preset.name, preset.width, preset.height, preset.color, preset.roomType)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-md flex items-center justify-center border border-border/50" style={{ backgroundColor: preset.color }}>
                  <Layers className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-sans font-medium text-foreground block">{preset.name}</span>
                  <span className="text-xs text-muted-foreground font-sans capitalize">{preset.roomType.replace('-', ' ')} · {(preset.width / 50 * 1.5).toFixed(1)}m × {(preset.height / 50 * 1.5).toFixed(1)}m</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── DOORS ── */}
        {activeTab === 'doors' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-sans px-1">Click to add a door to the canvas</p>
            {DOOR_PRESETS.map(preset => (
              <button key={preset.label} onClick={() => onAddDoor(preset.label, preset.width, preset.height)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-md bg-secondary/10 flex items-center justify-center">
                  <DoorOpen className="w-4 h-4 text-secondary" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-sans font-medium text-foreground block">{preset.label}</span>
                  <span className="text-xs text-muted-foreground font-sans">{(preset.width / 50 * 1.5).toFixed(1)}m × {(preset.height / 50 * 1.5).toFixed(1)}m</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── WINDOWS ── */}
        {activeTab === 'windows' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-sans px-1">Click to add a window to the canvas</p>
            {WINDOW_PRESETS.map(preset => (
              <button key={preset.label} onClick={() => onAddWindow(preset.label, preset.width, preset.height)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-sans font-medium text-foreground block">{preset.label}</span>
                  <span className="text-xs text-muted-foreground font-sans">{(preset.width / 50 * 1.5).toFixed(1)}m × {(preset.height / 50 * 1.5).toFixed(1)}m</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── FURNITURE ── */}
        {activeTab === 'furniture' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-sans px-1">Click to add furniture to the canvas</p>
            {categories.map(cat => {
              const Icon = categoryIcons[cat] || Sofa;
              const groupedItems = getCategoryItems(cat);
              const isExpanded = expandedCat === cat;
              return (
                <div key={cat}>
                  <button onClick={() => setExpandedCat(isExpanded ? '' : cat)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm font-sans font-medium">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <Icon className="w-4 h-4 text-secondary" />
                    {cat}
                    <span className="ml-auto text-xs text-muted-foreground">{groupedItems.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="pl-6 space-y-1">
                      {groupedItems.map(item => (
                        <div key={item.type}>
                          {item.variants ? (
                            // Grouped item with variants
                            <div>
                              <button onClick={() => setExpandedParent(expandedParent === item.type ? '' : item.type)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm font-sans flex items-center justify-between">
                                <span className="text-foreground font-medium">{item.label}</span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  {item.variants.length} variants
                                  {expandedParent === item.type ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </span>
                              </button>
                              {expandedParent === item.type && (
                                <div className="pl-4 space-y-0.5 pb-1">
                                  {item.variants.map(v => (
                                    <button key={v.type} onClick={() => onAddFurniture(v.type, v.label, v.width, v.height)}
                                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-secondary/10 transition-colors text-sm font-sans flex items-center justify-between group">
                                      <span className="text-secondary/80 group-hover:text-secondary">↳ {v.variant}</span>
                                      <span className="text-xs text-muted-foreground">{(v.width / 50 * 1.5).toFixed(1)}×{(v.height / 50 * 1.5).toFixed(1)}m</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            // Standalone item
                            <button onClick={() => onAddFurniture(item.type, item.label, item.width, item.height)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm font-sans">
                              <span className="text-foreground">{item.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">{(item.width / 50 * 1.5).toFixed(1)}×{(item.height / 50 * 1.5).toFixed(1)}m</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
