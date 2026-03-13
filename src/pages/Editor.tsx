import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MousePointer, Square, Trash2, BarChart3, Undo2, Upload, ScanLine, DoorOpen, Menu, X, Save, SquareStack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FloorPlanCanvas from '@/components/FloorPlanCanvas';
import FurniturePanel from '@/components/FurniturePanel';
import PropertiesPanel from '@/components/PropertiesPanel';
import AnalysisPanel from '@/components/AnalysisPanel';
import ImageUploadModal from '@/components/ImageUploadModal';
import SpaceScanModal from '@/components/SpaceScanModal';
import ExportTools from '@/components/ExportTools';
import AIChatWidget from '@/components/AIChatWidget';
import type { Room, FurnitureItem, DoorItem, WindowItem, EditorTool, ProjectData } from '@/types/editor';
import { PLOT_PRESETS } from '@/types/editor';
import { toast } from 'sonner';

const toolItems: { tool: EditorTool; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { tool: 'select', icon: MousePointer, label: 'Select' },
  { tool: 'room', icon: Square, label: 'Room' },
  { tool: 'door', icon: DoorOpen, label: 'Door' },
  { tool: 'window', icon: SquareStack, label: 'Window' },
  { tool: 'delete', icon: Trash2, label: 'Delete' },
];

export default function EditorPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [doors, setDoors] = useState<DoorItem[]>([]);
  const [windows, setWindows] = useState<WindowItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [history, setHistory] = useState<{ rooms: Room[]; furniture: FurnitureItem[]; doors: DoorItem[]; windows: WindowItem[] }[]>([]);

  const saveHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-19), { rooms: [...rooms], furniture: [...furniture], doors: [...doors], windows: [...windows] }]);
  }, [rooms, furniture, doors, windows]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRooms(prev.rooms); setFurniture(prev.furniture); setDoors(prev.doors); setWindows(prev.windows);
    setHistory(h => h.slice(0, -1));
    setSelectedId(null);
  }, [history]);

  const addRoom = useCallback((name: string, width: number, height: number, color: string) => {
    saveHistory();
    const offsetX = (rooms.length % 3) * 30;
    const offsetY = Math.floor(rooms.length / 3) * 30;
    const newRoom: Room = { id: `room-${Date.now()}`, x: 50 + offsetX, y: 50 + offsetY, width, height, name, color };
    setRooms(prev => [...prev, newRoom]);
    setSelectedId(newRoom.id);
    setActiveTool('select');
  }, [rooms.length, saveHistory]);

  const addFurniture = useCallback((type: string, label: string, width: number, height: number) => {
    saveHistory();
    const item: FurnitureItem = { id: `furn-${Date.now()}`, type, label, x: 400 + Math.random() * 100, y: 250 + Math.random() * 100, width, height, rotation: 0 };
    setFurniture(prev => [...prev, item]);
    setSelectedId(item.id);
    setActiveTool('select');
  }, [saveHistory]);

  const addDoor = useCallback((label: string, width: number, height: number) => {
    saveHistory();
    const door: DoorItem = { id: `door-${Date.now()}`, x: 300 + Math.random() * 100, y: 200 + Math.random() * 100, width, height, rotation: 0, wallSide: 'bottom' };
    setDoors(prev => [...prev, door]);
    setSelectedId(door.id);
    setActiveTool('select');
  }, [saveHistory]);

  const addWindow = useCallback((label: string, width: number, height: number) => {
    saveHistory();
    const win: WindowItem = { id: `win-${Date.now()}`, x: 350 + Math.random() * 100, y: 150 + Math.random() * 100, width, height, rotation: 0 };
    setWindows(prev => [...prev, win]);
    setSelectedId(win.id);
    setActiveTool('select');
  }, [saveHistory]);

  const moveFurniture = useCallback((id: string, x: number, y: number) => { setFurniture(prev => prev.map(f => f.id === id ? { ...f, x, y } : f)); }, []);
  const moveRoom = useCallback((id: string, x: number, y: number) => { setRooms(prev => prev.map(r => r.id === id ? { ...r, x, y } : r)); }, []);
  const resizeRoom = useCallback((id: string, width: number, height: number) => { saveHistory(); setRooms(prev => prev.map(r => r.id === id ? { ...r, width, height } : r)); }, [saveHistory]);
  const resizeFurniture = useCallback((id: string, width: number, height: number) => { saveHistory(); setFurniture(prev => prev.map(f => f.id === id ? { ...f, width, height } : f)); }, [saveHistory]);
  const resizeDoor = useCallback((id: string, width: number, height: number) => { saveHistory(); setDoors(prev => prev.map(d => d.id === id ? { ...d, width, height } : d)); }, [saveHistory]);
  const resizeWindow = useCallback((id: string, width: number, height: number) => { saveHistory(); setWindows(prev => prev.map(w => w.id === id ? { ...w, width, height } : w)); }, [saveHistory]);
  const moveDoor = useCallback((id: string, x: number, y: number) => { setDoors(prev => prev.map(d => d.id === id ? { ...d, x, y } : d)); }, []);
  const moveWindow = useCallback((id: string, x: number, y: number) => { setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w)); }, []);

  const deleteItem = useCallback((id: string) => {
    saveHistory();
    setRooms(prev => prev.filter(r => r.id !== id));
    setFurniture(prev => prev.filter(f => f.id !== id));
    setDoors(prev => prev.filter(d => d.id !== id));
    setWindows(prev => prev.filter(w => w.id !== id));
    setSelectedId(null);
  }, [saveHistory]);

  const rotateSelected = useCallback(() => {
    if (!selectedId) return;
    saveHistory();
    setFurniture(prev => prev.map(f => f.id === selectedId ? { ...f, rotation: (f.rotation + 90) % 360 } : f));
    setDoors(prev => prev.map(d => d.id === selectedId ? { ...d, rotation: (d.rotation + 90) % 360 } : d));
    setWindows(prev => prev.map(w => w.id === selectedId ? { ...w, rotation: (w.rotation + 90) % 360 } : w));
  }, [selectedId, saveHistory]);

  const deleteSelected = useCallback(() => { if (selectedId) deleteItem(selectedId); }, [selectedId, deleteItem]);

  const renameRoom = useCallback((id: string, name: string) => { setRooms(prev => prev.map(r => r.id === id ? { ...r, name } : r)); }, []);

  const loadProject = useCallback((data: ProjectData) => {
    saveHistory();
    setRooms(data.rooms); setFurniture(data.furniture); setDoors(data.doors); setWindows(data.windows || []);
    setSelectedId(null);
  }, [saveHistory]);

  const generatePlotLayout = useCallback((plotIndex: number) => {
    const plot = PLOT_PRESETS[plotIndex];
    if (!plot) return;
    saveHistory();
    const ftToPx = (ft: number) => Math.round((ft * 0.3048 / 1.5) * 50);
    const plotWPx = ftToPx(plot.widthFt);
    const plotHPx = ftToPx(plot.depthFt);
    const newRooms: Room[] = [];
    const ts = Date.now();

    if (plot.sqft <= 675) {
      const m = 10;
      newRooms.push(
        { id: `room-${ts}-1`, x: m, y: m, width: Math.round(plotWPx * 0.55), height: Math.round(plotHPx * 0.45), name: 'Living Room', color: 'hsl(30 20% 92%)' },
        { id: `room-${ts}-2`, x: m, y: m + Math.round(plotHPx * 0.47), width: Math.round(plotWPx * 0.55), height: Math.round(plotHPx * 0.25), name: 'Kitchen + Dining', color: 'hsl(30 12% 86%)' },
        { id: `room-${ts}-3`, x: m + Math.round(plotWPx * 0.57), y: m, width: Math.round(plotWPx * 0.42), height: Math.round(plotHPx * 0.48), name: 'Bedroom 1', color: 'hsl(30 15% 89%)' },
        { id: `room-${ts}-4`, x: m + Math.round(plotWPx * 0.57), y: m + Math.round(plotHPx * 0.50), width: Math.round(plotWPx * 0.42), height: Math.round(plotHPx * 0.35), name: 'Bedroom 2', color: 'hsl(30 15% 89%)' },
        { id: `room-${ts}-5`, x: m, y: m + Math.round(plotHPx * 0.74), width: Math.round(plotWPx * 0.35), height: Math.round(plotHPx * 0.24), name: 'Bathroom', color: 'hsl(30 10% 83%)' },
      );
    } else if (plot.sqft <= 1125) {
      newRooms.push(
        { id: `room-${ts}-1`, x: 10, y: 10, width: Math.round(plotWPx * 0.6), height: Math.round(plotHPx * 0.35), name: 'Living Room', color: 'hsl(30 20% 92%)' },
        { id: `room-${ts}-2`, x: 10, y: 10 + Math.round(plotHPx * 0.37), width: Math.round(plotWPx * 0.4), height: Math.round(plotHPx * 0.28), name: 'Kitchen', color: 'hsl(30 12% 86%)' },
        { id: `room-${ts}-3`, x: 10 + Math.round(plotWPx * 0.42), y: 10 + Math.round(plotHPx * 0.37), width: Math.round(plotWPx * 0.56), height: Math.round(plotHPx * 0.28), name: 'Dining Room', color: 'hsl(30 18% 90%)' },
        { id: `room-${ts}-4`, x: 10 + Math.round(plotWPx * 0.62), y: 10, width: Math.round(plotWPx * 0.36), height: Math.round(plotHPx * 0.35), name: 'Bedroom 1', color: 'hsl(30 15% 89%)' },
        { id: `room-${ts}-5`, x: 10, y: 10 + Math.round(plotHPx * 0.67), width: Math.round(plotWPx * 0.48), height: Math.round(plotHPx * 0.31), name: 'Bedroom 2', color: 'hsl(30 15% 89%)' },
        { id: `room-${ts}-6`, x: 10 + Math.round(plotWPx * 0.50), y: 10 + Math.round(plotHPx * 0.67), width: Math.round(plotWPx * 0.48), height: Math.round(plotHPx * 0.31), name: 'Bedroom 3', color: 'hsl(30 15% 89%)' },
      );
    } else {
      newRooms.push(
        { id: `room-${ts}-1`, x: 10, y: 10, width: Math.round(plotWPx * 0.5), height: Math.round(plotHPx * 0.3), name: 'Drawing Room', color: 'hsl(30 20% 92%)' },
        { id: `room-${ts}-2`, x: 10 + Math.round(plotWPx * 0.52), y: 10, width: Math.round(plotWPx * 0.46), height: Math.round(plotHPx * 0.3), name: 'Living Room', color: 'hsl(30 18% 90%)' },
        { id: `room-${ts}-3`, x: 10, y: 10 + Math.round(plotHPx * 0.32), width: Math.round(plotWPx * 0.35), height: Math.round(plotHPx * 0.25), name: 'Kitchen', color: 'hsl(30 12% 86%)' },
        { id: `room-${ts}-4`, x: 10 + Math.round(plotWPx * 0.37), y: 10 + Math.round(plotHPx * 0.32), width: Math.round(plotWPx * 0.35), height: Math.round(plotHPx * 0.25), name: 'Dining Room', color: 'hsl(30 18% 90%)' },
        { id: `room-${ts}-5`, x: 10, y: 10 + Math.round(plotHPx * 0.59), width: Math.round(plotWPx * 0.48), height: Math.round(plotHPx * 0.38), name: 'Master Bedroom', color: 'hsl(30 15% 89%)' },
        { id: `room-${ts}-6`, x: 10 + Math.round(plotWPx * 0.50), y: 10 + Math.round(plotHPx * 0.59), width: Math.round(plotWPx * 0.48), height: Math.round(plotHPx * 0.38), name: 'Bedroom 2', color: 'hsl(30 15% 89%)' },
      );
    }

    setRooms(newRooms);
    setFurniture([]);
    setDoors([]);
    setWindows([]);
    setSelectedId(null);
    setActiveTool('select');
    toast.success(`Generated ${plot.label} layout with ${newRooms.length} rooms.`);
  }, [saveHistory]);

  return (
    <div className="h-screen pt-16 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="bg-card border-b border-border/50 px-4 py-2 flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => setShowPanel(!showPanel)} className="lg:hidden">
          {showPanel ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        <div className="flex items-center gap-1 border-r border-border/50 pr-3">
          {toolItems.map(({ tool, icon: Icon, label }) => (
            <Button key={tool} variant={activeTool === tool ? 'default' : 'ghost'} size="sm"
              onClick={() => setActiveTool(tool)} title={label} className="gap-1.5 font-sans text-xs">
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowUpload(true)} className="gap-1.5 font-sans text-xs">
            <Upload className="w-4 h-4" /><span className="hidden sm:inline">Upload</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowScan(true)} className="gap-1.5 font-sans text-xs">
            <ScanLine className="w-4 h-4" /><span className="hidden sm:inline">Scan</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={undo} className="gap-1.5 font-sans text-xs">
            <Undo2 className="w-4 h-4" /><span className="hidden sm:inline">Undo</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowExport(true)} className="gap-1.5 font-sans text-xs">
            <Save className="w-4 h-4" /><span className="hidden sm:inline">Save</span>
          </Button>
        </div>

        {backgroundImage && (
          <Button variant="ghost" size="sm" onClick={() => setBackgroundImage(null)} className="font-sans text-xs text-destructive">
            Clear BG
          </Button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-sans text-muted-foreground">
            {rooms.length}R · {doors.length}D · {windows.length}W · {furniture.length}F
          </span>
          <Button size="sm" onClick={() => setShowAnalysis(!showAnalysis)}
            className="gap-1.5 gradient-accent text-accent-foreground border-0 font-sans text-xs">
            <BarChart3 className="w-4 h-4" /> Analyze
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        <div className={`${showPanel ? 'block' : 'hidden'} lg:block absolute lg:relative z-10 h-full`}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPanel(false); }}>
          <FurniturePanel
            onAddFurniture={(type, label, w, h) => { addFurniture(type, label, w, h); setShowPanel(false); }}
            onAddRoom={(name, w, h, c) => { addRoom(name, w, h, c); setShowPanel(false); }}
            onAddDoor={(label, w, h) => { addDoor(label, w, h); setShowPanel(false); }}
            onAddWindow={(label, w, h) => { addWindow(label, w, h); setShowPanel(false); }}
            onRotateSelected={rotateSelected}
            onDeleteSelected={deleteSelected}
            hasSelection={!!selectedId}
            onGeneratePlotLayout={generatePlotLayout}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <FloorPlanCanvas
            rooms={rooms} furniture={furniture} doors={doors} windows={windows}
            selectedId={selectedId} activeTool={activeTool}
            onSelectItem={setSelectedId}
            onMoveFurniture={moveFurniture} onMoveRoom={moveRoom}
            onResizeRoom={resizeRoom} onResizeFurniture={resizeFurniture}
            onResizeDoor={resizeDoor} onResizeWindow={resizeWindow}
            onMoveDoor={moveDoor} onMoveWindow={moveWindow}
            onDeleteItem={deleteItem}
            backgroundImage={backgroundImage}
          />
        </div>

        {/* Right Panel */}
        <PropertiesPanel
          selectedId={selectedId} rooms={rooms} furniture={furniture} doors={doors} windows={windows}
          onResizeRoom={resizeRoom} onResizeFurniture={resizeFurniture}
          onResizeDoor={resizeDoor} onResizeWindow={resizeWindow}
          onRotateSelected={rotateSelected} onDeleteSelected={deleteSelected}
          onRenameRoom={renameRoom}
        />

        {/* Analysis Panel */}
        <AnimatePresence>
          {showAnalysis && (
            <AnalysisPanel rooms={rooms} furniture={furniture} doors={doors} onClose={() => setShowAnalysis(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <ImageUploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onImageLoaded={setBackgroundImage} />
      <SpaceScanModal isOpen={showScan} onClose={() => setShowScan(false)} onScanComplete={setBackgroundImage} />
      <ExportTools isOpen={showExport} onClose={() => setShowExport(false)} rooms={rooms} furniture={furniture} doors={doors} windows={windows} onLoadProject={loadProject} />

      {/* AI Chat */}
      <AIChatWidget rooms={rooms} furniture={furniture} doors={doors} />
    </div>
  );
}
