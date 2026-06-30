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
import { PhotoFrame } from './PhotoFrame';

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
    const imageId = `photo-${entry.id}-${Date.now().toString(36)}`;
    onChange({
      ...entry,
      image,
      imageId,
      originalImage: image,
      originalImageId: imageId,
      imageSettings: {
        zoom: 100,
        posX: 50,
        posY: 50,
        rotation: 0,
        fit: 'contain',
        fitModeExplicit: false,
        cropX: 0,
        cropY: 0,
        cropWidth: 100,
        cropHeight: 100,
      },
    });
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
      <div className={`overflow-hidden rounded-lg border bg-white transition-shadow ${isSelected ? 'border-blue-500 shadow-md ring-2 ring-blue-100' : 'border-slate-200 shadow-sm'}`}>
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <button
            onClick={onToggleSelect}
            className={`rounded p-1 ${isSelected ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            title={isSelected ? 'Deselect' : 'Select for bulk edit'}
          >
            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
          </button>
          <span className="font-semibold text-slate-800">
            Photo #{entry.photographNo}
          </span>
          <span className="ml-1 text-xs text-slate-400">({index + 1} of total)</span>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="rounded p-1.5 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
              title="Move up"
            >
              <ArrowUp size={16} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="rounded p-1.5 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
              title="Move down"
            >
              <ArrowDown size={16} />
            </button>
            {hasPrevious && (
              <button
                onClick={onDuplicatePrevious}
                className="rounded p-1.5 text-slate-600 hover:bg-slate-200"
                title="Copy metadata from previous"
              >
                <CopyPlus size={16} />
              </button>
            )}
            <button
              onClick={onDuplicate}
              className="rounded p-1.5 hover:bg-slate-200"
              title="Duplicate entry"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={onDelete}
              className="rounded p-1.5 text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 p-3">
          {/* Image + Metadata Row */}
          <div className="flex gap-3">
            {/* Image Preview */}
            <div className="w-36 flex-shrink-0">
              <div
                className="group relative cursor-pointer"
                onClick={() => setShowEditor(true)}
              >
                <PhotoFrame
                  src={entry.image}
                  settings={entry.imageSettings}
                  alt={`Photo ${entry.photographNo}`}
                  mode="thumbnail"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
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
                  <label className="mb-0.5 block text-xs font-medium text-slate-600">
                    Photo No.
                  </label>
                  <input
                    type="number"
                    value={entry.photographNo}
                    onChange={(e) =>
                      onChange({ ...entry, photographNo: parseInt(e.target.value) || 1 })
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-xs font-medium text-slate-600">
                    Date
                  </label>
                  <input
                    ref={dateRef}
                    type="date"
                    value={entry.date}
                    onChange={handleChange('date')}
                    onKeyDown={(e) => handleKeyDown(e, 'date')}
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-slate-600">
                  Direction
                </label>
                <input
                  ref={directionRef}
                  type="text"
                  value={entry.directionTaken}
                  onChange={handleChange('directionTaken')}
                  onKeyDown={(e) => handleKeyDown(e, 'direction')}
                  placeholder="e.g., North, East facing southwest"
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-xs font-medium text-slate-600">
                Description
              </label>
              <button
                onClick={onCopyToAll}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
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
              className="w-full resize-none rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 hover:bg-slate-50"
            >
              <Settings size={12} />
              Edit Crop
            </button>
            {previousEntry?.description && (
              <button
                onClick={() => onChange({ ...entry, description: previousEntry.description })}
                className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 hover:bg-slate-50"
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
