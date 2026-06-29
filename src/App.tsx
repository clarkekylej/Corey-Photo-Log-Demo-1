import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ProjectData, PhotoEntry } from './types';
import {
  saveToStorage,
  loadFromStorage,
  clearStorage,
  exportProjectJSON,
  importProjectJSON,
  hasMeaningfulProjectData,
} from './utils/storage';
import { getDefaultProjectData, createPhotoEntry } from './utils/defaults';
import { ProjectSetupForm } from './components/ProjectSetupForm';
import { PhotoUploader } from './components/PhotoUploader';
import { PhotoEntryCard } from './components/PhotoEntryCard';
import { ReportPreview } from './components/ReportPreview';
import {
  Save,
  Trash2,
  FileDown,
  FileUp,
  Printer,
  RotateCcw,
  CheckSquare,
  Calendar,
  Compass,
  FileText,
  X,
} from 'lucide-react';

const PrintPortal = memo(function PrintPortal({ data }: { data: ProjectData }) {
  const printContainer = document.getElementById('print-content');
  if (!printContainer) return null;
  return createPortal(<ReportPreview data={data} />, printContainer);
});

function App() {
  const [data, setData] = useState<ProjectData>(() => loadFromStorage() ?? getDefaultProjectData());
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(40);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkDate, setBulkDate] = useState('');
  const [bulkDirection, setBulkDirection] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasMeaningfulProjectData(data)) return;

    // Autosave only after a meaningful edit so an empty startup state cannot
    // overwrite a complete draft with photos stored as data URLs.
    const timeout = setTimeout(() => {
      saveToStorage(data);
    }, 500);
    return () => clearTimeout(timeout);
  }, [data]);

  useEffect(() => {
    if (savedMessage) {
      const timer = setTimeout(() => setSavedMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [savedMessage]);

  const handleProjectInfoChange = (
    projectInfo: Parameters<typeof ProjectSetupForm>[0]['projectInfo']
  ) => {
    setData((prev) => ({ ...prev, projectInfo }));
  };

  const handlePhotoUpload = (images: string[]) => {
    setData((prev) => ({
      ...prev,
      photoEntries: [
        ...prev.photoEntries,
        ...images.map((image, index) =>
          createPhotoEntry(image, prev.photoEntries.length + index + 1)
        ),
      ],
    }));
  };

  const handlePhotoEntryChange = (entry: PhotoEntry) => {
    setData((prev) => ({
      ...prev,
      photoEntries: prev.photoEntries.map((e) =>
        e.id === entry.id ? entry : e
      ),
    }));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setData((prev) => {
      const newEntries = [...prev.photoEntries];
      [newEntries[index - 1], newEntries[index]] = [
        newEntries[index],
        newEntries[index - 1],
      ];
      return { ...prev, photoEntries: newEntries };
    });
  };

  const handleMoveDown = (index: number) => {
    setData((prev) => {
      if (index >= prev.photoEntries.length - 1) return prev;
      const newEntries = [...prev.photoEntries];
      [newEntries[index], newEntries[index + 1]] = [
        newEntries[index + 1],
        newEntries[index],
      ];
      return { ...prev, photoEntries: newEntries };
    });
  };

  const handleDelete = (id: string) => {
    setData((prev) => ({
      ...prev,
      photoEntries: prev.photoEntries.filter((e) => e.id !== id),
    }));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDuplicate = (id: string) => {
    setData((prev) => {
      const index = prev.photoEntries.findIndex((e) => e.id === id);
      if (index === -1) return prev;
      const entry = {
        ...prev.photoEntries[index],
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        photographNo: prev.photoEntries.length + 1,
      };
      const newEntries = [...prev.photoEntries];
      newEntries.splice(index + 1, 0, entry);
      return { ...prev, photoEntries: newEntries };
    });
  };

  const handleDuplicatePrevious = (index: number) => {
    if (index === 0) return;
    setData((prev) => {
      const prevEntry = prev.photoEntries[index - 1];
      const currentEntry = prev.photoEntries[index];
      const updated = {
        ...currentEntry,
        date: prevEntry.date,
        directionTaken: prevEntry.directionTaken,
        description: prevEntry.description,
      };
      const newEntries = [...prev.photoEntries];
      newEntries[index] = updated;
      return { ...prev, photoEntries: newEntries };
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(data.photoEntries.map((e) => e.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkApply = () => {
    setData((prev) => ({
      ...prev,
      photoEntries: prev.photoEntries.map((e) => {
        if (!selectedIds.has(e.id)) return e;
        return {
          ...e,
          date: bulkDate || e.date,
          directionTaken: bulkDirection || e.directionTaken,
          description: bulkDescription || e.description,
        };
      }),
    }));
    setShowBulkEdit(false);
    setBulkDate('');
    setBulkDirection('');
    setBulkDescription('');
  };

  const handleCopyToAll = (description: string) => {
    setData((prev) => ({
      ...prev,
      photoEntries: prev.photoEntries.map((e) => ({
        ...e,
        description,
      })),
    }));
  };

  const handleRenumber = () => {
    setData((prev) => ({
      ...prev,
      photoEntries: prev.photoEntries.map((e, i) => ({
        ...e,
        photographNo: i + 1,
      })),
    }));
  };

  const handleSaveDraft = () => {
    saveToStorage(data);
    setSavedMessage('Draft saved!');
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearStorage();
      setData(getDefaultProjectData());
      setSelectedIds(new Set());
      setSavedMessage('Draft cleared');
    }
  };

  const handleExport = () => {
    exportProjectJSON(data);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const imported = await importProjectJSON(file);
      setData(imported);
      setSavedMessage('Project imported!');
    } catch {
      alert('Failed to import project. Please check the file format.');
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  const handlePrint = () => {
    saveToStorage(data);
    window.print();
  };

  const focusNextEntry = (currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < data.photoEntries.length) {
      // Focus the date field of the next entry after a short delay
      setTimeout(() => {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        if (dateInputs[nextIndex]) {
          (dateInputs[nextIndex] as HTMLInputElement).focus();
        }
      }, 0);
    }
  };

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(data.photoEntries.length / 2));
  }, [data.photoEntries.length]);

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        {/* Top Header Bar */}
        <div className="no-print bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-screen-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">
                Field Photo Log Generator
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {savedMessage && (
                  <span className="text-sm text-green-600 px-2">{savedMessage}</span>
                )}
                <button
                  onClick={handleSaveDraft}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={handleClearDraft}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                >
                  <Trash2 size={16} />
                  Clear
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                >
                  <FileDown size={16} />
                  JSON
                </button>
                <button
                  onClick={handleImportClick}
                  disabled={importing}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-50"
                >
                  <FileUp size={16} />
                  Import
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <div className="flex flex-col items-end">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm"
                  >
                    <Printer size={16} />
                    Print / Save as PDF
                  </button>
                  <span className="text-xs text-gray-500 mt-1">
                    Turn off headers/footers for cleanest output
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Editor + Preview */}
        <div className="max-w-screen-2xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
          {/* Left: Editor Panel */}
          <div className="no-print w-full lg:w-[520px] flex-shrink-0 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <ProjectSetupForm
                projectInfo={data.projectInfo}
                onChange={handleProjectInfoChange}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                Photo Upload
              </h2>
              <PhotoUploader onUpload={handlePhotoUpload} />
            </div>

            {data.photoEntries.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Photos ({data.photoEntries.length})
                    </h2>
                    <span className="text-xs text-gray-400">
                      {pageCount} page{pageCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                      <button
                        onClick={() => setShowBulkEdit(true)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit {selectedIds.size} selected
                      </button>
                    )}
                    <button
                      onClick={selectedIds.size === data.photoEntries.length ? handleDeselectAll : handleSelectAll}
                      className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {selectedIds.size === data.photoEntries.length ? (
                        <>
                          <X size={14} /> Deselect
                        </>
                      ) : (
                        <>
                          <CheckSquare size={14} /> Select All
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleRenumber}
                      className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <RotateCcw size={14} />
                      Renumber
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {data.photoEntries.map((entry, index) => (
                    <PhotoEntryCard
                      key={entry.id}
                      entry={entry}
                      index={index}
                      hasPrevious={index > 0}
                      previousEntry={index > 0 ? data.photoEntries[index - 1] : null}
                      canMoveUp={index > 0}
                      canMoveDown={index < data.photoEntries.length - 1}
                      isSelected={selectedIds.has(entry.id)}
                      onChange={handlePhotoEntryChange}
                      onMoveUp={() => handleMoveUp(index)}
                      onMoveDown={() => handleMoveDown(index)}
                      onDelete={() => handleDelete(entry.id)}
                      onDuplicate={() => handleDuplicate(entry.id)}
                      onDuplicatePrevious={() => handleDuplicatePrevious(index)}
                      onCopyToAll={() => handleCopyToAll(entry.description)}
                      onToggleSelect={() => handleToggleSelect(entry.id)}
                      onFocusNext={() => focusNextEntry(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Report Preview Panel */}
          <div className="flex-1 no-print">
            <div className="bg-gray-700 rounded-lg shadow-lg p-4 sticky top-16">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium text-sm">Report Preview</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-300">Zoom:</label>
                    <input
                      type="range"
                      min="25"
                      max="60"
                      value={previewScale}
                      onChange={(e) => setPreviewScale(parseInt(e.target.value))}
                      className="w-16"
                    />
                    <span className="text-xs text-gray-300">{previewScale}%</span>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="text-xs text-white bg-gray-600 px-2 py-1 rounded hover:bg-gray-500 flex items-center gap-1"
                  >
                    <Printer size={14} />
                    Print
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-[calc(100vh-160px)] rounded bg-gray-600 no-print">
                <div
                  className="preview-zoom-container no-print"
                  style={{
                    transform: `scale(${previewScale / 100})`,
                    transformOrigin: 'top left',
                    width: `${100 / (previewScale / 100)}%`,
                  }}
                >
                  <ReportPreview data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 no-print">
          <div className="bg-white rounded-lg shadow-xl w-96 mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Bulk Edit ({selectedIds.size} photos)</h3>
              <button onClick={() => setShowBulkEdit(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} /> Date (leave empty to keep existing)
                </label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Compass size={16} /> Direction (leave empty to keep existing)
                </label>
                <input
                  type="text"
                  value={bulkDirection}
                  onChange={(e) => setBulkDirection(e.target.value)}
                  placeholder="e.g., North"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <FileText size={16} /> Description (leave empty to keep existing)
                </label>
                <textarea
                  value={bulkDescription}
                  onChange={(e) => setBulkDescription(e.target.value)}
                  placeholder="Same description for all selected..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowBulkEdit(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkApply}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-only portal */}
      <PrintPortal data={data} />
    </>
  );
}

export default App;
