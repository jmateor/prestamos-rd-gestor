import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

interface Props {
  onSave: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export function SignaturePad({ onSave, width = 400, height = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const stopDraw = useCallback(() => setIsDrawing(false), []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    setHasSignature(false);
  };

  const save = () => {
    if (!canvasRef.current || !hasSignature) return;
    onSave(canvasRef.current.toDataURL('image/png'));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Firma del Cliente</p>
      <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white touch-none">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full cursor-crosshair"
          style={{ aspectRatio: `${width}/${height}` }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={clear}>
          <Eraser className="h-3.5 w-3.5" /> Limpiar
        </Button>
        <Button type="button" size="sm" className="gap-1.5" disabled={!hasSignature} onClick={save}>
          <Check className="h-3.5 w-3.5" /> Guardar Firma
        </Button>
      </div>
    </div>
  );
}
