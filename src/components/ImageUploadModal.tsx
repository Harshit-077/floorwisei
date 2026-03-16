import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, CheckCircle, ZoomIn, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Room } from '@/types/editor';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRoomsDetected: (rooms: Room[]) => void;
}

export default function ImageUploadModal({ isOpen, onClose, onRoomsDetected }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [detectedRooms, setDetectedRooms] = useState<{ name: string; width: number; height: number }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => { setPreview(e.target?.result as string); setAnalyzed(false); setDetectedRooms([]); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const analyzeImage = () => {
    if (!preview) return;
    setAnalyzing(true);
    // Simulated room detection from floor plan image
    setTimeout(() => {
      // Detect 1 room by default — user can add more manually
      const w = 150 + Math.floor(Math.random() * 150);
      const h = 120 + Math.floor(Math.random() * 120);
      const detected = [
        { name: 'Room 1', width: w, height: h },
      ];
      setDetectedRooms(detected);
      setAnalyzing(false);
      setAnalyzed(true);
    }, 2500);
  };

  const addRoomsToCanvas = () => {
    const ts = Date.now();
    const rooms: Room[] = detectedRooms.map((r, i) => ({
      id: `room-${ts}-${i}`,
      x: 20 + (i % 2) * (r.width + 20),
      y: 20 + Math.floor(i / 2) * (r.height + 20),
      width: r.width,
      height: r.height,
      name: r.name,
      color: ['hsl(30 20% 92%)', 'hsl(30 15% 89%)', 'hsl(30 12% 86%)', 'hsl(30 10% 83%)', 'hsl(30 18% 90%)'][i % 5],
    }));
    onRoomsDetected(rooms);
    handleClose();
  };

  const handleClose = () => {
    setPreview(null); setAnalyzed(false); setDetectedRooms([]); onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={handleClose}>
        <motion.div className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-lg overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl">Upload Floor Plan</h2>
              <p className="text-sm text-muted-foreground font-sans">Upload an image — rooms will be detected and added to the canvas</p>
            </div>
            <Button size="icon" variant="ghost" onClick={handleClose}><X className="w-4 h-4" /></Button>
          </div>

          <div className="p-6">
            {!preview ? (
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <div className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-secondary bg-secondary/5' : 'border-border hover:border-secondary/50'}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop} onClick={() => fileRef.current?.click()}>
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-sans font-medium text-foreground">Drop your floor plan image here</p>
                  <p className="text-xs text-muted-foreground font-sans mt-1">or click to browse — PNG, JPG, WEBP supported</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden">
                  <img src={preview} alt="Floor plan" className="w-full h-auto max-h-64 object-contain bg-muted" />
                  {analyzing && (
                    <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto mb-2" />
                        <p className="text-sm font-sans text-card-foreground font-medium">Detecting rooms...</p>
                      </div>
                    </div>
                  )}
                  {analyzed && (
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-xs font-sans font-medium">Rooms Detected</span>
                    </div>
                  )}
                </div>

                {analyzed && detectedRooms.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-display">Detected Rooms ({detectedRooms.length})</h4>
                      <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => setDetectedRooms(prev => [...prev, { name: `Room ${prev.length + 1}`, width: 150 + Math.floor(Math.random() * 100), height: 120 + Math.floor(Math.random() * 80) }])}>
                        <Plus className="w-3 h-3" /> Add Room
                      </Button>
                    </div>
                    {detectedRooms.map((room, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                        <input className="text-sm font-sans font-medium bg-transparent border-none outline-none w-32" value={room.name} onChange={e => setDetectedRooms(prev => prev.map((r, idx) => idx === i ? { ...r, name: e.target.value } : r))} />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{(room.width / 50 * 1.5).toFixed(1)}m × {(room.height / 50 * 1.5).toFixed(1)}m</span>
                          {detectedRooms.length > 1 && (
                            <button className="text-muted-foreground hover:text-destructive" onClick={() => setDetectedRooms(prev => prev.filter((_, idx) => idx !== i))}>
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setPreview(null); setAnalyzed(false); setDetectedRooms([]); }} className="font-sans text-sm">
                    Upload Different Image
                  </Button>
                  {!analyzed ? (
                    <Button onClick={analyzeImage} disabled={analyzing} className="flex-1 gradient-accent text-accent-foreground border-0 font-sans text-sm gap-2">
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ZoomIn className="w-4 h-4" />}
                      {analyzing ? 'Detecting...' : 'Detect Rooms'}
                    </Button>
                  ) : (
                    <Button onClick={addRoomsToCanvas} className="flex-1 gradient-accent text-accent-foreground border-0 font-sans text-sm gap-2">
                      <Plus className="w-4 h-4" /> Add Rooms to Canvas
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
