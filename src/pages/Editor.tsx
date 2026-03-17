import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MousePointer, Square, Trash2, BarChart3, Undo2, Upload, ScanLine, DoorOpen,
  Menu, X, Save, SquareStack, ZoomIn, ZoomOut, Maximize, Box,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import FloorPlanCanvas, { type CanvasHandle } from '@/components/FloorPlanCanvas';
import FurniturePanel from '@/components/FurniturePanel';
import PropertiesPanel from '@/components/PropertiesPanel';
import AnalysisPanel from '@/components/AnalysisPanel';
import ImageUploadModal from '@/components/ImageUploadModal';
import SpaceScanModal from '@/components/SpaceScanModal';
import ExportTools from '@/components/ExportTools';
import AIChatWidget from '@/components/AIChatWidget';
import { lazy, Suspense } from 'react';
const FloorPlan3DViewer = lazy(() => import('@/components/FloorPlan3DViewer'));
import type { Room, FurnitureItem, DoorItem, WindowItem, EditorTool, ProjectData, PlotLayout } from '@/types/editor';
import { PLOT_PRESETS } from '@/types/editor';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const toolItems: { tool: EditorTool; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { tool: 'select', icon: MousePointer, label: 'Select' },
  { tool: 'room', icon: Square, label: 'Room' },
  { tool: 'door', icon: DoorOpen, label: 'Door' },
  { tool: 'window', icon: SquareStack, label: 'Window' },
  { tool: 'delete', icon: Trash2, label: 'Delete' },
];

export default function EditorPage() {
  const { user, saveProject } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<CanvasHandle>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [show3D, setShow3D] = useState(false);
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
  const [projectId] = useState(() => `proj-${Date.now()}`);
  const [projectName, setProjectName] = useState('Untitled Project');

  // Load project from Dashboard "Open" action
  useEffect(() => {
    const stored = sessionStorage.getItem('floorwise_open_project');
    if (stored) {
      try {
        const data = JSON.parse(stored) as ProjectData;
        setRooms(data.rooms || []);
        setFurniture(data.furniture || []);
        setDoors(data.doors || []);
        setWindows(data.windows || []);
        setProjectName(data.name || 'Untitled Project');
      } catch { /* ignore malformed data */ }
      sessionStorage.removeItem('floorwise_open_project');
    }
  }, []);

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

  const addRoom = useCallback((name: string, width: number, height: number, color: string, roomType?: string) => {
    saveHistory();
    const offsetX = (rooms.length % 3) * 30;
    const offsetY = Math.floor(rooms.length / 3) * 30;
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      x: 50 + offsetX, y: 50 + offsetY,
      width, height, name, color,
      roomType: (roomType as Room['roomType']) || 'room',
    };
    setRooms(prev => [...prev, newRoom]);
    setSelectedId(newRoom.id);
    setActiveTool('select');
  }, [rooms.length, saveHistory]);

  const addFurniture = useCallback((type: string, label: string, width: number, height: number) => {
    saveHistory();
    const item: FurnitureItem = {
      id: `furn-${Date.now()}`, type, label,
      x: 400 + Math.random() * 100, y: 250 + Math.random() * 100,
      width, height, rotation: 0,
    };
    setFurniture(prev => [...prev, item]);
    setSelectedId(item.id);
    setActiveTool('select');
  }, [saveHistory]);

  const addDoor = useCallback((label: string, width: number, height: number) => {
    saveHistory();
    const door: DoorItem = {
      id: `door-${Date.now()}`,
      x: 300 + Math.random() * 100, y: 200 + Math.random() * 100,
      width, height, rotation: 0, wallSide: 'bottom',
    };
    setDoors(prev => [...prev, door]);
    setSelectedId(door.id);
    setActiveTool('select');
  }, [saveHistory]);

  const addWindow = useCallback((label: string, width: number, height: number) => {
    saveHistory();
    const win: WindowItem = {
      id: `win-${Date.now()}`,
      x: 350 + Math.random() * 100, y: 150 + Math.random() * 100,
      width, height, rotation: 0,
    };
    setWindows(prev => [...prev, win]);
    setSelectedId(win.id);
    setActiveTool('select');
  }, [saveHistory]);

  // Bulk-add rooms from scan detection
  const handleRoomsDetected = useCallback((detectedRooms: Omit<Room, 'id' | 'x' | 'y'>[]) => {
    saveHistory();
    const newRooms: Room[] = detectedRooms.map((r, i) => ({
      ...r,
      id: `room-${Date.now()}-${i}`,
      x: 50 + (i % 3) * (r.width + 20),
      y: 50 + Math.floor(i / 3) * (r.height + 20),
    }));
    setRooms(prev => [...prev, ...newRooms]);
    setActiveTool('select');
    toast.success(`Added ${newRooms.length} rooms from scan.`);
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

  const handleSaveToAccount = useCallback(() => {
    if (!user) {
      toast.error('Please log in to save your project.');
      navigate('/login');
      return;
    }
    const project: ProjectData = {
      id: projectId,
      name: projectName,
      rooms, furniture, doors, windows,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProject(project);
    toast.success('Project saved to your account!');
  }, [user, projectId, projectName, rooms, furniture, doors, windows, saveProject, navigate]);

  // ── Plot Presets (1–3 rooms + hallway + doors/windows + garage/gate for 10M+) ──
  const generatePlotLayout = useCallback((plotIndex: number) => {
    const plot = PLOT_PRESETS[plotIndex];
    if (!plot) return;
    saveHistory();
    const px = (ft: number) => Math.round((ft * 0.3048 / 1.5) * 50);
    const W = px(plot.widthFt);
    const H = px(plot.depthFt);
    const ts = Date.now();
    const newRooms: Room[] = [];
    const newDoors: DoorItem[] = [];
    const newWindows: WindowItem[] = [];
    const m = 10;
    const isLarge = plot.sqft >= 2250; // 10 Marla+

    if (plot.sqft <= 675) {
      // 3 Marla — 1 main room + kitchen + bathroom
      newRooms.push(
        { id: `r-${ts}-1`, x: m, y: m, width: Math.round(W * 0.6), height: Math.round(H * 0.55), name: 'Living Room', color: 'hsl(30 20% 92%)', roomType: 'room' },
        { id: `r-${ts}-2`, x: m, y: m + Math.round(H * 0.57), width: Math.round(W * 0.55), height: Math.round(H * 0.3), name: 'Kitchen', color: 'hsl(30 12% 86%)', roomType: 'room' },
        { id: `r-${ts}-3`, x: m + Math.round(W * 0.62), y: m, width: Math.round(W * 0.36), height: Math.round(H * 0.4), name: 'Bedroom', color: 'hsl(30 15% 89%)', roomType: 'room' },
        { id: `r-${ts}-h`, x: m + Math.round(W * 0.62), y: m + Math.round(H * 0.42), width: Math.round(W * 0.36), height: Math.round(H * 0.14), name: 'Hallway', color: 'hsl(210 15% 88%)', roomType: 'hallway' },
        { id: `r-${ts}-4`, x: m + Math.round(W * 0.62), y: m + Math.round(H * 0.58), width: Math.round(W * 0.36), height: Math.round(H * 0.28), name: 'Bathroom', color: 'hsl(30 10% 83%)', roomType: 'room' },
      );
      // Main door
      newDoors.push(
        { id: `door-${ts}-1`, x: m + Math.round(W * 0.25), y: m + H - 12, width: 40, height: 8, rotation: 0, wallSide: 'bottom' },
      );
      // Windows
      newWindows.push(
        { id: `win-${ts}-1`, x: m, y: m + Math.round(H * 0.2), width: 6, height: 40, rotation: 0 },
        { id: `win-${ts}-2`, x: m + W - 8, y: m + Math.round(H * 0.15), width: 6, height: 35, rotation: 0 },
      );

    } else if (plot.sqft <= 1125) {
      // 5 Marla — 2 rooms + kitchen + hallway
      newRooms.push(
        { id: `r-${ts}-1`, x: m, y: m, width: Math.round(W * 0.58), height: Math.round(H * 0.38), name: 'Living Room', color: 'hsl(30 20% 92%)', roomType: 'room' },
        { id: `r-${ts}-2`, x: m, y: m + Math.round(H * 0.4), width: Math.round(W * 0.38), height: Math.round(H * 0.26), name: 'Kitchen', color: 'hsl(30 12% 86%)', roomType: 'room' },
        { id: `r-${ts}-h`, x: m, y: m + Math.round(H * 0.68), width: Math.round(W * 0.9), height: Math.round(H * 0.1), name: 'Hallway', color: 'hsl(210 15% 88%)', roomType: 'hallway' },
        { id: `r-${ts}-3`, x: m + Math.round(W * 0.6), y: m, width: Math.round(W * 0.38), height: Math.round(H * 0.38), name: 'Master Bedroom', color: 'hsl(30 15% 89%)', roomType: 'room' },
        { id: `r-${ts}-4`, x: m + Math.round(W * 0.42), y: m + Math.round(H * 0.4), width: Math.round(W * 0.56), height: Math.round(H * 0.26), name: 'Bedroom 2', color: 'hsl(30 15% 89%)', roomType: 'room' },
        { id: `r-${ts}-5`, x: m, y: m + Math.round(H * 0.8), width: Math.round(W * 0.45), height: Math.round(H * 0.18), name: 'Bathroom', color: 'hsl(30 10% 83%)', roomType: 'room' },
      );
      // Doors
      newDoors.push(
        { id: `door-${ts}-1`, x: m + Math.round(W * 0.25), y: m + H - 12, width: 50, height: 8, rotation: 0, wallSide: 'bottom' },
        { id: `door-${ts}-2`, x: m + Math.round(W * 0.2), y: m + Math.round(H * 0.4) - 4, width: 40, height: 8, rotation: 0, wallSide: 'bottom' },
        { id: `door-${ts}-3`, x: m + Math.round(W * 0.6), y: m + Math.round(H * 0.45) - 4, width: 40, height: 8, rotation: 0, wallSide: 'bottom' },
      );
      // Windows
      newWindows.push(
        { id: `win-${ts}-1`, x: m, y: m + 30, width: 6, height: 40, rotation: 0 },
        { id: `win-${ts}-2`, x: m + W - 8, y: m + 30, width: 6, height: 40, rotation: 0 },
        { id: `win-${ts}-3`, x: m + Math.round(W * 0.3), y: m + H - 8, width: 40, height: 6, rotation: 0 },
      );

    } else if (plot.sqft <= 1575) {
      // 7 Marla: 3 rooms + hallway
      newRooms.push(
        { id: `room-${ts}-1`, x: m, y: m, width: Math.round(W * 0.5), height: Math.round(H * 0.35), name: 'Living Room', color: 'hsl(30 20% 92%)', roomType: 'room' },
        { id: `room-${ts}-2`, x: m + Math.round(W * 0.52), y: m, width: Math.round(W * 0.46), height: Math.round(H * 0.35), name: 'Bedroom 1', color: 'hsl(30 15% 89%)', roomType: 'room' },
        { id: `room-${ts}-h`, x: m, y: m + Math.round(H * 0.37), width: W - 2 * m, height: Math.round(H * 0.13), name: 'Hallway', color: 'hsl(210 15% 88%)', roomType: 'hallway' },
        { id: `room-${ts}-3`, x: m, y: m + Math.round(H * 0.52), width: W - 2 * m, height: Math.round(H * 0.46), name: 'Bedroom 2', color: 'hsl(30 15% 89%)', roomType: 'room' },
      );
      // Doors
      newDoors.push(
        { id: `door-${ts}-1`, x: m + Math.round(W * 0.3), y: m + H - 12, width: 50, height: 8, rotation: 0, wallSide: 'bottom' },
        { id: `door-${ts}-2`, x: m + Math.round(W * 0.2), y: m + Math.round(H * 0.35) - 4, width: 40, height: 8, rotation: 0, wallSide: 'bottom' },
        { id: `door-${ts}-3`, x: m + Math.round(W * 0.6), y: m + Math.round(H * 0.35) - 4, width: 40, height: 8, rotation: 0, wallSide: 'bottom' },
      );
      // Windows
      newWindows.push(
        { id: `win-${ts}-1`, x: m, y: m + 30, width: 6, height: 50, rotation: 0 },
        { id: `win-${ts}-2`, x: m + W - 8, y: m + 30, width: 6, height: 50, rotation: 0 },
        { id: `win-${ts}-3`, x: m + 30, y: m + H - 8, width: 50, height: 6, rotation: 0 },
      );

    } else {
      // 7 Marla+ — 2–3 rooms, hallway, open area, and for 10M+ add garage + gate
      newRooms.push(
        { id: `r-${ts}-1`, x: m, y: m, width: Math.round(W * 0.5), height: Math.round(H * 0.3), name: 'Drawing Room', color: 'hsl(30 20% 92%)', roomType: 'room' },
        { id: `r-${ts}-2`, x: m + Math.round(W * 0.52), y: m, width: Math.round(W * 0.46), height: Math.round(H * 0.3), name: 'Living Room', color: 'hsl(30 18% 90%)', roomType: 'room' },
        { id: `r-${ts}-h`, x: m, y: m + Math.round(H * 0.32), width: Math.round(W * 0.98), height: Math.round(H * 0.1), name: 'Hallway', color: 'hsl(210 15% 88%)', roomType: 'hallway' },
        { id: `r-${ts}-3`, x: m, y: m + Math.round(H * 0.44), width: Math.round(W * 0.35), height: Math.round(H * 0.25), name: 'Kitchen', color: 'hsl(30 12% 86%)', roomType: 'room' },
        { id: `r-${ts}-4`, x: m + Math.round(W * 0.37), y: m + Math.round(H * 0.44), width: Math.round(W * 0.61), height: Math.round(H * 0.25), name: 'Master Bedroom', color: 'hsl(30 15% 89%)', roomType: 'room' },
        { id: `r-${ts}-o`, x: m, y: m + Math.round(H * 0.71), width: Math.round(W * 0.98), height: Math.round(H * 0.12), name: 'Open Area', color: 'hsl(140 15% 88%)', roomType: 'open-area' },
      );
      if (isLarge) {
        newRooms.push(
          { id: `r-${ts}-g`, x: m, y: m + Math.round(H * 0.85), width: Math.round(W * 0.5), height: Math.round(H * 0.13), name: 'Garage', color: 'hsl(210 10% 80%)', roomType: 'garage' },
          { id: `r-${ts}-gate`, x: m + Math.round(W * 0.52), y: m + Math.round(H * 0.85), width: Math.round(W * 0.46), height: Math.round(H * 0.13), name: 'Main Gate Area', color: 'hsl(30 25% 80%)', roomType: 'gate' },
        );
      }
    }

    // Add sample doors at room entry points
    newDoors.push(
      { id: `d-${ts}-1`, x: m + Math.round(W * 0.2), y: m + 2, width: 40, height: 8, rotation: 0, wallSide: 'top' },
      { id: `d-${ts}-2`, x: m + Math.round(W * 0.5), y: m + 2, width: 40, height: 8, rotation: 0, wallSide: 'top' },
    );
    // Add sample windows
    newWindows.push(
      { id: `w-${ts}-1`, x: m + 10, y: m + 2, width: 40, height: 6, rotation: 0 },
      { id: `w-${ts}-2`, x: m + Math.round(W * 0.65), y: m + 2, width: 40, height: 6, rotation: 0 },
    );

    setRooms(newRooms);
    setFurniture([]);
    setDoors(newDoors);
    setWindows(newWindows);
    setSelectedId(null);
    setActiveTool('select');
    toast.success(`Generated ${plot.label} layout${isLarge ? ' with garage & main gate' : ''}.`);
  }, [saveHistory]);

  return (
    <div className="h-screen pt-16 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="bg-card border-b border-border/50 px-4 py-2 flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => setShowPanel(!showPanel)} className="lg:hidden">
          {showPanel ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        {/* Drawing tools */}
        <div className="flex items-center gap-1 border-r border-border/50 pr-3">
          {toolItems.map(({ tool, icon: Icon, label }) => (
            <Button key={tool} variant={activeTool === tool ? 'default' : 'ghost'} size="sm"
              onClick={() => setActiveTool(tool)} title={label} className="gap-1.5 font-sans text-xs">
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>

        {/* Action tools */}
        <div className="flex items-center gap-1 border-r border-border/50 pr-3">
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
            <Save className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSaveToAccount} className="gap-1.5 font-sans text-xs text-secondary hover:text-secondary">
            <Save className="w-4 h-4" /><span className="hidden sm:inline">Save</span>
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => canvasRef.current?.zoomIn()} title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => canvasRef.current?.zoomOut()} title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => canvasRef.current?.resetZoom()} title="Reset Zoom">
            <Maximize className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* 3D Toggle */}
        <Button variant={show3D ? 'default' : 'ghost'} size="sm" onClick={() => setShow3D(!show3D)}
          className="gap-1.5 font-sans text-xs" title="Toggle 3D View">
          <Box className="w-4 h-4" />
          <span className="hidden sm:inline">{show3D ? '2D' : '3D'}</span>
        </Button>

        {backgroundImage && (
          <Button variant="ghost" size="sm" onClick={() => setBackgroundImage(null)} className="font-sans text-xs text-destructive">
            Clear BG
          </Button>
        )}

        <div className="ml-auto flex items-center gap-3">
          {user && (
            <span className="text-xs font-sans text-muted-foreground hidden md:block">
              {user.name}
            </span>
          )}
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
            onAddRoom={(name, w, h, c, rt) => { addRoom(name, w, h, c, rt); setShowPanel(false); }}
            onAddDoor={(label, w, h) => { addDoor(label, w, h); setShowPanel(false); }}
            onAddWindow={(label, w, h) => { addWindow(label, w, h); setShowPanel(false); }}
            onRotateSelected={rotateSelected}
            onDeleteSelected={deleteSelected}
            hasSelection={!!selectedId}
            onGeneratePlotLayout={generatePlotLayout}
          />
        </div>

        {/* Canvas / 3D Viewer */}
        <div className="flex-1 overflow-hidden">
          {show3D ? (
            <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading 3D…</div>}>
              <FloorPlan3DViewer rooms={rooms} furniture={furniture} doors={doors} windows={windows} />
            </Suspense>
          ) : (
            <FloorPlanCanvas
              ref={canvasRef}
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
          )}
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
      <ImageUploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onRoomsDetected={handleRoomsDetected} />
      <SpaceScanModal isOpen={showScan} onClose={() => setShowScan(false)} onRoomsDetected={handleRoomsDetected} />
      <ExportTools isOpen={showExport} onClose={() => setShowExport(false)} rooms={rooms} furniture={furniture} doors={doors} windows={windows} onLoadProject={loadProject} />

      {/* AI Chat */}
      <AIChatWidget rooms={rooms} furniture={furniture} doors={doors} />
    </div>
  );
}
