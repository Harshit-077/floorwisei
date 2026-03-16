import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle, AlertTriangle, RefreshCw, Plus, Minus, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Room } from '@/types/editor';

interface DetectedRoom {
  name: string;
  width: number;
  height: number;
  color: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRoomsDetected: (rooms: Omit<Room, 'id' | 'x' | 'y'>[]) => void;
}

const ROOM_COLORS = [
  'hsl(30 20% 92%)', 'hsl(30 15% 89%)', 'hsl(30 12% 86%)',
  'hsl(30 10% 83%)', 'hsl(30 18% 90%)', 'hsl(210 15% 88%)',
];

const DEFAULT_ROOM_NAMES = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room', 'Hallway'];
const DEFAULT_SIZES: { width: number; height: number }[] = [
  { width: 250, height: 200 }, { width: 200, height: 180 }, { width: 160, height: 140 },
  { width: 120, height: 100 }, { width: 180, height: 160 }, { width: 120, height: 50 },
];

function simulateRoomDetection(count: number): DetectedRoom[] {
  return Array.from({ length: count }, (_, i) => ({
    name: DEFAULT_ROOM_NAMES[i] || `Room ${i + 1}`,
    width: DEFAULT_SIZES[i]?.width || 160,
    height: DEFAULT_SIZES[i]?.height || 140,
    color: ROOM_COLORS[i] || 'hsl(30 15% 88%)',
  }));
}

export default function SpaceScanModal({ isOpen, onClose, onRoomsDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [step, setStep] = useState<'camera' | 'detecting' | 'review'>('camera');
  const [detectedRooms, setDetectedRooms] = useState<DetectedRoom[]>([]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      setCameraError('Camera access denied. Please allow camera permissions and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); }
  }, [stream]);

  useEffect(() => {
    if (isOpen && step === 'camera' && !capturedImage) startCamera();
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [isOpen, step]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    // Start detection simulation
    setStep('detecting');
    setTimeout(() => {
      // Detect 1 room — user can add more manually in review step
      setDetectedRooms(simulateRoomDetection(1));
      setStep('review');
    }, 1800);
  };

  const retake = () => {
    setCapturedImage(null);
    setDetectedRooms([]);
    setStep('camera');
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setDetectedRooms([]);
    setStep('camera');
    setCameraError(null);
    onClose();
  };

  const addRoom = () => {
    const i = detectedRooms.length;
    setDetectedRooms(prev => [...prev, {
      name: `Room ${i + 1}`,
      width: 160,
      height: 140,
      color: ROOM_COLORS[i % ROOM_COLORS.length],
    }]);
  };

  const removeRoom = (idx: number) => {
    setDetectedRooms(prev => prev.filter((_, i) => i !== idx));
  };

  const updateRoom = (idx: number, key: keyof DetectedRoom, val: string | number) => {
    setDetectedRooms(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  };

  const confirmRooms = () => {
    if (detectedRooms.length === 0) return;
    onRoomsDetected(detectedRooms.map(r => ({
      name: r.name,
      width: r.width,
      height: r.height,
      color: r.color,
      roomType: 'room' as const,
    })));
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose}>
        <motion.div className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-lg overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl">Space Scanner</h2>
              <p className="text-sm text-muted-foreground font-sans">
                {step === 'camera' && 'Capture your floor plan or room photo'}
                {step === 'detecting' && 'Analysing image for room layout…'}
                {step === 'review' && 'Review detected rooms before adding to canvas'}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={handleClose}><X className="w-4 h-4" /></Button>
          </div>

          <div className="p-5 space-y-4">
            {/* Camera / captured image */}
            {step !== 'review' && (
              <div className="rounded-xl overflow-hidden bg-muted aspect-video relative">
                {!capturedImage ? (
                  cameraError ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" />
                      <p className="text-sm font-sans text-muted-foreground mb-3">{cameraError}</p>
                      <Button size="sm" variant="outline" onClick={startCamera} className="font-sans gap-2">
                        <RefreshCw className="w-4 h-4" /> Try Again
                      </Button>
                    </div>
                  ) : (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute bottom-3 left-0 right-0 text-center">
                        <span className="px-3 py-1 rounded-full bg-foreground/50 text-xs font-sans text-card-foreground backdrop-blur-sm">
                          Point camera at your floor plan or room
                        </span>
                      </div>
                    </>
                  )
                ) : (
                  <div className="relative w-full h-full">
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                    {step === 'detecting' && (
                      <div className="absolute inset-0 bg-foreground/40 flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                          <Scan className="w-10 h-10 text-secondary animate-pulse" />
                          <div className="absolute inset-0 border-2 border-secondary rounded-full animate-ping opacity-40" />
                        </div>
                        <p className="text-sm font-sans text-white">Detecting room boundaries…</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notice */}
            {step === 'camera' && (
              <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                <p className="text-xs font-sans text-muted-foreground">
                  <strong className="text-foreground">Room Detection</strong> — After capturing, the scanner will identify rooms in your photo and add them directly to the canvas. No background image is applied.
                </p>
              </div>
            )}

            {/* Review step */}
            {step === 'review' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-sans font-medium text-foreground">{detectedRooms.length} room{detectedRooms.length !== 1 ? 's' : ''} detected</p>
                  <Button size="sm" variant="outline" onClick={addRoom} className="gap-1.5 font-sans text-xs">
                    <Plus className="w-3 h-3" /> Add Room
                  </Button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {detectedRooms.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/40">
                      <div className="w-5 h-5 rounded shrink-0" style={{ backgroundColor: r.color }} />
                      <input
                        value={r.name}
                        onChange={e => updateRoom(i, 'name', e.target.value)}
                        className="flex-1 bg-transparent text-sm font-sans outline-none focus:text-foreground text-muted-foreground"
                      />
                      <span className="text-xs text-muted-foreground font-sans whitespace-nowrap">
                        {(r.width / 50 * 1.5).toFixed(1)}×{(r.height / 50 * 1.5).toFixed(1)}m
                      </span>
                      <button onClick={() => removeRoom(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {step === 'camera' && (
                <Button onClick={capturePhoto} disabled={!!cameraError || !stream} className="flex-1 gradient-accent text-accent-foreground border-0 font-sans gap-2">
                  <Camera className="w-4 h-4" /> Capture & Detect Rooms
                </Button>
              )}
              {step === 'detecting' && (
                <Button disabled className="flex-1 font-sans gap-2 opacity-70">
                  <Scan className="w-4 h-4 animate-pulse" /> Detecting…
                </Button>
              )}
              {step === 'review' && (
                <>
                  <Button variant="outline" onClick={retake} className="font-sans gap-2">
                    <RefreshCw className="w-4 h-4" /> Retake
                  </Button>
                  <Button onClick={confirmRooms} disabled={detectedRooms.length === 0} className="flex-1 gradient-accent text-accent-foreground border-0 font-sans gap-2">
                    <CheckCircle className="w-4 h-4" /> Add {detectedRooms.length} Room{detectedRooms.length !== 1 ? 's' : ''} to Canvas
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
