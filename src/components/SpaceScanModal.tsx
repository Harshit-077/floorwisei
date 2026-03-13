import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (imageUrl: string) => void;
}

export default function SpaceScanModal({ isOpen, onClose, onScanComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

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
    if (ctx) { ctx.drawImage(video, 0, 0); const dataUrl = canvas.toDataURL('image/jpeg', 0.9); setCapturedImage(dataUrl); stopCamera(); }
  };

  const applyAsBackground = () => { if (capturedImage) { onScanComplete(capturedImage); handleClose(); } };
  const retake = () => { setCapturedImage(null); startCamera(); };
  const handleClose = () => { stopCamera(); setCapturedImage(null); setCameraError(null); onClose(); };

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
              <p className="text-sm text-muted-foreground font-sans">Capture your room to use as a background reference</p>
            </div>
            <Button size="icon" variant="ghost" onClick={handleClose}><X className="w-4 h-4" /></Button>
          </div>

          <div className="p-6 space-y-4">
            <div className="rounded-xl overflow-hidden bg-muted aspect-video relative">
              {!capturedImage ? (
                cameraError ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <AlertTriangle className="w-8 h-8 text-warning mb-3" />
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

            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs font-sans text-muted-foreground">
                <strong className="text-foreground">Reference Image Only</strong> — This photo will be used as a background overlay on the canvas so you can trace your room layout manually.
              </p>
            </div>

            <div className="flex gap-3">
              {!capturedImage ? (
                <Button onClick={capturePhoto} disabled={!!cameraError} className="flex-1 gradient-accent text-accent-foreground border-0 font-sans gap-2">
                  <Camera className="w-4 h-4" /> Capture Room
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={retake} className="font-sans gap-2">
                    <RefreshCw className="w-4 h-4" /> Retake Photo
                  </Button>
                  <Button onClick={applyAsBackground} className="flex-1 gradient-accent text-accent-foreground border-0 font-sans gap-2">
                    <CheckCircle className="w-4 h-4" /> Use as Background
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
