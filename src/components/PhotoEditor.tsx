import { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoEntry, ImageSettings } from '../types';
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  entry: PhotoEntry;
  onSave: (entry: PhotoEntry) => void;
  onReplaceImage: (image: string) => void;
  onClose: () => void;
}

export function PhotoEditor({ entry, onSave, onReplaceImage, onClose }: Props) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [settings, setSettings] = useState<ImageSettings>(entry.imageSettings);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const aspectRatio = 7 / 4.25;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleZoom = (delta: number) => {
    setSettings((prev) => ({
      ...prev,
      zoom: Math.max(50, Math.min(300, prev.zoom + delta)),
    }));
  };

  const handleRotate = (direction: 'cw' | 'ccw') => {
    setSettings((prev) => ({
      ...prev,
      rotation: direction === 'cw' ? (prev.rotation + 90) % 360 : (prev.rotation - 90 + 360) % 360,
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const sensitivity = 0.3;

      setSettings((prev) => ({
        ...prev,
        posX: Math.max(0, Math.min(100, prev.posX - dx * sensitivity)),
        posY: Math.max(0, Math.min(100, prev.posY - dy * sensitivity)),
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleReset = () => {
    setSettings({
      zoom: 100,
      posX: 50,
      posY: 50,
      rotation: 0,
      cropX: 0,
      cropY: 0,
      cropWidth: 100,
      cropHeight: 100,
    });
  };

  const handleSave = () => {
    onSave({ ...entry, imageSettings: settings });
    onClose();
  };

  const handleReplaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onReplaceImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getTransformedImageStyle = (): React.CSSProperties => {
    return {
      transform: `scale(${settings.zoom / 100}) rotate(${settings.rotation}deg)`,
      transformOrigin: `${settings.posX}% ${settings.posY}%`,
      objectFit: 'cover',
      objectPosition: `${settings.posX}% ${settings.posY}%`,
      maxWidth: 'none',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ImageIcon size={20} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">
              Edit Photo #{entry.photographNo}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Image Preview */}
          <div className="flex-1 p-4 bg-gray-100 flex items-center justify-center">
            <div
              className="relative overflow-hidden bg-gray-900 rounded shadow-lg"
              style={{
                width: '500px',
                height: `${500 / aspectRatio}px`,
                maxWidth: '100%',
              }}
              onMouseDown={handleMouseDown}
            >
              <img
                ref={imageRef}
                src={entry.image}
                alt="Edit preview"
                className="w-full h-full"
                style={getTransformedImageStyle()}
                draggable={false}
              />
              {/* Aspect ratio overlay guide */}
              <div className="absolute inset-0 pointer-events-none border-2 border-white/30 rounded" />
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-64 border-l p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Zoom Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ZoomIn size={16} /> Zoom
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoom(-10)}
                  className="p-1.5 border rounded hover:bg-gray-50"
                >
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min="50"
                  max="300"
                  value={settings.zoom}
                  onChange={(e) => setSettings((s) => ({ ...s, zoom: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <button
                  onClick={() => handleZoom(10)}
                  className="p-1.5 border rounded hover:bg-gray-50"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center">{settings.zoom}%</div>
            </div>

            {/* Rotation Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <RotateCw size={16} /> Rotation
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRotate('ccw')}
                  className="flex-1 p-2 border rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <RotateCcw size={16} /> Left
                </button>
                <button
                  onClick={() => handleRotate('cw')}
                  className="flex-1 p-2 border rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <RotateCw size={16} /> Right
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center">{settings.rotation}°</div>
            </div>

            {/* Pan Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Move size={16} /> Pan Position
              </label>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-6">X:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.posX}
                    onChange={(e) => setSettings((s) => ({ ...s, posX: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-8 text-right">{settings.posX}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-6">Y:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.posY}
                    onChange={(e) => setSettings((s) => ({ ...s, posY: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-8 text-right">{settings.posY}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">Drag image to pan</p>
            </div>

            {/* Preview Info */}
            <div className="text-xs text-gray-400 border-t pt-4">
              <p>Preview shows exactly how the photo will appear in the report.</p>
              <p className="mt-2">Fixed aspect ratio: 7&quot; x 4.25&quot; (landscape)</p>
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-2 border-t pt-4">
              <button
                onClick={handleReset}
                className="w-full px-3 py-2 border rounded hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Reset All
              </button>
              <button
                onClick={() => replaceInputRef.current?.click()}
                className="w-full px-3 py-2 border rounded hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ImageIcon size={16} /> Replace Photo
              </button>
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                onChange={handleReplaceImage}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
