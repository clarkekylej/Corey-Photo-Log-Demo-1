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
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { PhotoFrame } from './PhotoFrame';

interface Props {
  entry: PhotoEntry;
  onSave: (entry: PhotoEntry) => void;
  onReplaceImage: (image: string) => void;
  onClose: () => void;
}

export function PhotoEditor({ entry, onSave, onReplaceImage, onClose }: Props) {
  const [settings, setSettings] = useState<ImageSettings>(entry.imageSettings);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const aspectRatio = 7 / 4.25;
  const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
  const clampZoom = (value: number) => Math.max(100, Math.min(300, value));
  const isFitEntirePhoto = settings.fit === 'contain';
  const displayedZoom = isFitEntirePhoto ? 100 : settings.zoom;
  const displayedPosX = isFitEntirePhoto ? 50 : settings.posX;
  const displayedPosY = isFitEntirePhoto ? 50 : settings.posY;
  const displayedRotation = isFitEntirePhoto ? 0 : settings.rotation;

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
    if (isFitEntirePhoto) return;
    setSettings((prev) => ({
      ...prev,
      zoom: clampZoom(prev.zoom + delta),
    }));
  };

  const handleRotate = (direction: 'cw' | 'ccw') => {
    if (isFitEntirePhoto) return;
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
        posX: clampPercent(prev.posX - dx * sensitivity),
        posY: clampPercent(prev.posY - dy * sensitivity),
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
      fit: settings.fit === 'cover' ? 'cover' : 'contain',
      fitModeExplicit: settings.fitModeExplicit === true,
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

  const nudge = (axis: 'x' | 'y', amount: number) => {
    if (isFitEntirePhoto) return;
    setSettings((prev) => ({
      ...prev,
      posX: axis === 'x' ? clampPercent(prev.posX + amount) : prev.posX,
      posY: axis === 'y' ? clampPercent(prev.posY + amount) : prev.posY,
    }));
  };

  const setFitMode = (fit: ImageSettings['fit']) => {
    setSettings((prev) => ({
      ...prev,
      fit,
      fitModeExplicit: true,
      zoom: 100,
      posX: 50,
      posY: 50,
      rotation: fit === 'contain' ? 0 : prev.rotation,
    }));
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
              onMouseDown={isFitEntirePhoto ? undefined : handleMouseDown}
            >
              <PhotoFrame
                src={entry.image}
                settings={settings}
                alt="Edit preview"
                mode="editor"
                className={isFitEntirePhoto ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                imageClassName="pointer-events-none"
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
                  disabled={isFitEntirePhoto}
                  className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min="100"
                  max="300"
                  step="1"
                  value={displayedZoom}
                  onChange={(e) => setSettings((s) => ({ ...s, zoom: clampZoom(parseInt(e.target.value)) }))}
                  disabled={isFitEntirePhoto}
                  className="flex-1"
                />
                <button
                  onClick={() => handleZoom(10)}
                  disabled={isFitEntirePhoto}
                  className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center">{(displayedZoom / 100).toFixed(2)}x</div>
            </div>

            {/* Fit Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Photo Fit Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFitMode('contain')}
                  className={`p-2 border rounded hover:bg-gray-50 ${settings.fit === 'contain' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}`}
                >
                  Fit Entire Photo
                </button>
                <button
                  onClick={() => setFitMode('cover')}
                  className={`p-2 border rounded hover:bg-gray-50 ${settings.fit !== 'contain' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}`}
                >
                  Fill Frame / Crop
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Fit shows the full uploaded photo. Fill crops the image to remove blank space.
              </p>
            </div>

            {/* Rotation Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <RotateCw size={16} /> Rotation
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRotate('ccw')}
                  disabled={isFitEntirePhoto}
                  className="flex-1 p-2 border rounded hover:bg-gray-50 flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw size={16} /> Left
                </button>
                <button
                  onClick={() => handleRotate('cw')}
                  disabled={isFitEntirePhoto}
                  className="flex-1 p-2 border rounded hover:bg-gray-50 flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCw size={16} /> Right
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center">{displayedRotation}°</div>
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
                    step="1"
                    value={displayedPosX}
                    onChange={(e) => setSettings((s) => ({ ...s, posX: clampPercent(parseInt(e.target.value)) }))}
                    disabled={isFitEntirePhoto}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-8 text-right">{displayedPosX}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-6">Y:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={displayedPosY}
                    onChange={(e) => setSettings((s) => ({ ...s, posY: clampPercent(parseInt(e.target.value)) }))}
                    disabled={isFitEntirePhoto}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-8 text-right">{displayedPosY}%</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                <span />
                <button onClick={() => nudge('y', -1)} disabled={isFitEntirePhoto} className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" title="Nudge up">
                  <ArrowUp size={14} className="mx-auto" />
                </button>
                <span />
                <button onClick={() => nudge('x', -1)} disabled={isFitEntirePhoto} className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" title="Nudge left">
                  <ArrowLeft size={14} className="mx-auto" />
                </button>
                <button onClick={() => setSettings((s) => ({ ...s, posX: 50, posY: 50 }))} disabled={isFitEntirePhoto} className="p-1.5 border rounded text-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  Center
                </button>
                <button onClick={() => nudge('x', 1)} disabled={isFitEntirePhoto} className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" title="Nudge right">
                  <ArrowRight size={14} className="mx-auto" />
                </button>
                <span />
                <button onClick={() => nudge('y', 1)} disabled={isFitEntirePhoto} className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" title="Nudge down">
                  <ArrowDown size={14} className="mx-auto" />
                </button>
                <span />
              </div>
              <p className="text-xs text-gray-400">
                {isFitEntirePhoto
                  ? 'Switch to Fill Frame / Crop to zoom or reposition intentionally.'
                  : 'Drag image to pan, or use sliders and nudge buttons for fine placement.'}
              </p>
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
                <RefreshCw size={16} /> Reset
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
