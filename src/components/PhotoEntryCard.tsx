import { useState, useRef } from 'react';
import { PhotoEntry } from '../types';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  Settings,
  Edit3,
  CopyPlus,
  CheckSquare,
  Square,
} from 'lucide-react';
import { PhotoEditor } from './PhotoEditor';

interface Props {
  entry: PhotoEntry;
  index: number;
  hasPrevious: boolean;
  previousEntry: PhotoEntry | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isSelected: boolean;
  onChange: (entry: PhotoEntry) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDuplicatePrevious: () => void;
  onCopyToAll: () => void;
  onToggleSelect: () => void;
  onFocusNext: () => void;
}

export function PhotoEntryCard({
  entry,
  index,
  hasPrevious,
  previousEntry,
  canMoveUp,
  canMoveDown,
  isSelected,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate,
  onDuplicatePrevious,
  onCopyToAll,
  onToggleSelect,
  onFocusNext,
}: Props) {
  const [showEditor, setShowEditor] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);
  const directionRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (field: keyof PhotoEntry) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange({ ...entry, [field]: e.target.value });
  };

  const handleImageSave = (updatedEntry: PhotoEntry) => {
    onChange(updatedEntry);
  };

  const handleReplaceImage = (image: string) => {
    onChange({
      ...entry,
      image,
      originalImage: image,
      imageSettings: {
        zoom: 100,
        posX: 50,
        posY: 50,
        rotation: 0,
        cropX: 0,
        cropY: 0,
        cropWidth: 100,
        cropHeight: 100,
      },
    });
  };

  const imageStyle: React.CSSProperties = {
    objectFit: 'cover',
    objectPosition: `${entry.imageSettings.posX}% ${entry.imageSettings.posY}%`,
    transform: `scale(${entry.imageSettings.zoom / 100}) rotate(${entry.imageSettings.rotation}deg)`,
    transformOrigin: `${entry.imageSettings.posX}% ${entry.imageSettings.posY}%`,
    maxWidth: 'none',
    width: '100%',
    height: '100%',
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentField: 'date' | 'direction' | 'description') => {
    if (e.key === 'Tab' && !e.shiftKey) {
      if (currentField === 'date') {
        e.preventDefault();
        directionRef.current?.focus();
      } else if (currentField === 'direction') {
        e.preventDefault();
        descriptionRef.current?.focus();
      } else if (currentField === 'description') {
        e.preventDefault();
        onFocusNext();
      }
    }
  };

  return (
    <>
      <div className={`border rounded-lg overflow-hidden bg-white transition-shadow ${isSelected ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-gray-200'}`}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
          <button
            onClick={onToggleSelect}
            className={`p-1 rounded ${isSelected ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            title={isSelected ? 'Deselect' : 'Select for bulk edit'}
          >
            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
          </button>
          <span className="font-semibold text-gray-700">
            Photo #{entry.photographNo}
          </span>
          <span className="text-xs text-gray-400 ml-1">({index + 1} of total)</span>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              <ArrowUp size={16} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              <ArrowDown size={16} />
            </button>
            {hasPrevious && (
              <button
                onClick={onDuplicatePrevious}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                title="Copy metadata from previous"
              >
                <CopyPlus size={16} />
              </button>
            )}
            <button
              onClick={onDuplicate}
              className="p-1.5 rounded hover:bg-gray-200"
              title="Duplicate entry"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-red-100 text-red-600"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {/* Image + Metadata Row */}
          <div className="flex gap-3">
            {/* Image Preview */}
            <div className="w-36 flex-shrink-0">
              <div
                className="relative aspect-[7/4.25] bg-gray-100 rounded overflow-hidden border border-gray-200 cursor-pointer group"
                onClick={() => setShowEditor(true)}
              >
                <img
                  src={entry.image}
                  alt={`Photo ${entry.photographNo}`}
                  style={imageStyle}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Edit3
                    size={24}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    Photo No.
                  </label>
                  <input
                    type="number"
                    value={entry.photographNo}
                    onChange={(e) =>
                      onChange({ ...entry, photographNo: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    Date
                  </label>
                  <input
                    ref={dateRef}
                    type="date"
                    value={entry.date}
                    onChange={handleChange('date')}
                    onKeyDown={(e) => handleKeyDown(e, 'date')}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  Direction
                </label>
                <input
                  ref={directionRef}
                  type="text"
                  value={entry.directionTaken}
                  onChange={handleChange('directionTaken')}
                  onKeyDown={(e) => handleKeyDown(e, 'direction')}
                  placeholder="e.g., North, East facing southwest"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-xs font-medium text-gray-600">
                Description
              </label>
              <button
                onClick={onCopyToAll}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="Apply to all entries"
              >
                Copy to All
              </button>
            </div>
            <textarea
              ref={descriptionRef}
              value={entry.description}
              onChange={handleChange('description')}
              onKeyDown={(e) => handleKeyDown(e, 'description')}
              placeholder="Describe what this photo shows..."
              rows={2}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
            >
              <Settings size={12} />
              Edit Crop
            </button>
            {previousEntry?.description && (
              <button
                onClick={() => onChange({ ...entry, description: previousEntry.description })}
                className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
              >
                Paste Prev. Desc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Photo Editor Modal */}
      {showEditor && (
        <PhotoEditor
          entry={entry}
          onSave={handleImageSave}
          onReplaceImage={handleReplaceImage}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}
