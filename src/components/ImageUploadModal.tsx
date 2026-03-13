import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image, Loader2, CheckCircle, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImageLoaded: (imageUrl: string) => void;
}

export default function ImageUploadModal({ isOpen, onClose, onImageLoaded }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [detectedRooms, setDetectedRooms] = useState<{ name: string; dims: string }[]>([]);
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
    setTimeout(() => {
      setDetectedRooms([
        { name: 'Living Room', dims: '5.2m × 4.1m' },
        { name: 'Master Bedroom', dims: '4.0m × 3.5m' },
        { name: 'Kitchen', dims: '3.8m × 2.9m' },
        { name: 'Bathroom', dims: '2.4m × 2.0m' },
        { name: 'Hallway', dims: '4.5m × 1.2m' },
      ]);
      setAnalyzing(false);
      setAnalyzed(true);
    }, 2500);
  };

  const applyToCanvas = () => {
    if (preview) { onImageLoaded(preview); onClose(); setPreview(null); setAnalyzed(false); setDetectedRooms([]); }
  };

  const reset = () => { setPreview(null); setAnalyzed(false); setDetectedRooms([]); };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}>
        <motion.div className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-lg overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl">Upload Floor Plan</h2>
              <p className="text-sm text-muted-foreground font-sans">Upload an image and AI will detect rooms & dimensions</p>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
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
                        <p className="text-sm font-sans text-card-foreground font-medium">Analyzing floor plan...</p>
                      </div>
                    </div>
                  )}
                  {analyzed && (
                    <div className="absolute top-3 right-3 bg-success text-success-foreground px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-xs font-sans font-medium">Analysis Complete</span>
                    </div>
                  )}
                </div>

                {analyzed && detectedRooms.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-display">Detected Rooms ({detectedRooms.length})</h4>
                    {detectedRooms.map((room, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                        <span className="text-sm font-sans font-medium">{room.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">{room.dims}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={reset} className="font-sans text-sm">Upload Different Image</Button>
                  {!analyzed ? (
                    <Button onClick={analyzeImage} disabled={analyzing} className="flex-1 gradient-accent text-accent-foreground border-0 font-sans text-sm gap-2">
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ZoomIn className="w-4 h-4" />}
                      {analyzing ? 'Analyzing...' : 'Detect Rooms & Dimensions'}
                    </Button>
                  ) : (
                    <Button onClick={applyToCanvas} className="flex-1 gradient-accent text-accent-foreground border-0 font-sans text-sm">
                      <Image className="w-4 h-4 mr-2" /> Apply to Canvas
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
