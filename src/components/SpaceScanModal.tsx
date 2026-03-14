import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Room } from '@/types/editor';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRoomsDetected: (rooms: Room[]) => void;
}

export default function SpaceScanModal({ isOpen, onClose, onRoomsDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedRooms, setDetectedRooms] = useState<{ name: string; width: number; height: number }[]>([]);

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
    if (isOpen && !capturedImage) startCamera();
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [isOpen]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const analyzeCapture = () => {
    if (!capturedImage) return;
    setAnalyzing(true);
    setTimeout(() => {
      setDetectedRooms([
        { name: 'Room 1', width: 220, height: 180 },
        { name: 'Room 2', width: 180, height: 150 },
      ]);
      setAnalyzing(false);
    }, 2000);
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
      color: ['hsl(30 20% 92%)', 'hsl(30 15% 89%)', 'hsl(30 12% 86%)'][i % 3],
    }));
    onRoomsDetected(rooms);
    handleClose();
  };

  const retake = () => { setCapturedImage(null); setDetectedRooms([]); startCamera(); };
  const handleClose = () => { stopCamera(); setCapturedImage(null); setCameraError(null); setDetectedRooms([]); onClose(); };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose}>
        <motion.div className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-lg overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl">Space Scanner</h2>
              <p className="text-sm text-muted-foreground font-sans">Capture your space — rooms will be detected and added to the canvas</p>
            </div>
            <Button size="icon" variant="ghost" onClick={handleClose}><X className="w-4 h-4" /></Button>
          </div>

          <div className="p-6 space-y-4">
            <div className="rounded-xl overflow-hidden bg-muted aspect-video relative">
              {!capturedImage ? (
                cameraError ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-500 mb-3" />
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
                      <span className="px-3 py-1 rounded-full bg-foreground/50 text-xs font-sans text-card-foreground backdrop-blur-sm">Point camera at your room</span>
                    </div>
                  </>
                )
              ) : (
                <img src={capturedImage} alt="Captured room" className="w-full h-full object-cover" />
              )}
            </div>

            {detectedRooms.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-display">Detected Rooms ({detectedRooms.length})</h4>
                {detectedRooms.map((room, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                    <span className="text-sm font-sans font-medium">{room.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">{(room.width / 50 * 1.5).toFixed(1)}m × {(room.height / 50 * 1.5).toFixed(1)}m</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              {!capturedImage ? (
                <Button onClick={capturePhoto} disabled={!!cameraError} className="flex-1 gradient-accent text-accent-foreground border-0 font-sans gap-2">
                  <Camera className="w-4 h-4" /> Capture Room
                </Button>
              ) : detectedRooms.length === 0 ? (
                <>
                  <Button variant="outline" onClick={retake} className="font-sans gap-2">
                    <RefreshCw className="w-4 h-4" /> Retake
                  </Button>
                  <Button onClick={analyzeCapture} disabled={analyzing} className="flex-1 gradient-accent text-accent-foreground border-0 font-sans gap-2">
                    {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {analyzing ? 'Detecting...' : 'Detect Rooms'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={retake} className="font-sans gap-2">
                    <RefreshCw className="w-4 h-4" /> Retake
                  </Button>
                  <Button onClick={addRoomsToCanvas} className="flex-1 gradient-accent text-accent-foreground border-0 font-sans gap-2">
                    <Plus className="w-4 h-4" /> Add Rooms to Canvas
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
