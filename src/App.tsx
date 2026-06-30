import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ProjectData, PhotoEntry } from './types';
import {
  saveDraft,
  loadDraft,
  clearDraft,
  exportProjectJSON,
  importProjectJSON,
  hasMeaningfulProjectData,
} from './utils/storage';
import { getDefaultProjectData, createPhotoEntry, getDefaultImageSettings } from './utils/defaults';
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

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'failed' | 'idle';

const PrintPortal = memo(function PrintPortal({ data }: { data: ProjectData }) {
  const printContainer = document.getElementById('print-content');
  if (!printContainer) return null;
  return createPortal(<ReportPreview data={data} />, printContainer);
});

function App() {
  const [data, setData] = useState<ProjectData>(getDefaultProjectData());
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(() => {
    const saved = Number(localStorage.getItem('field_photo_log_preview_scale'));
    return Number.isFinite(saved) && saved >= 25 && saved <= 120 ? saved : 40;
  });
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkDate, setBulkDate] = useState('');
  const [bulkDirection, setBulkDirection] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const selectedIds = useMemo(() => new Set(data.selectedPhotoIds), [data.selectedPhotoIds]);

  useEffect(() => {
    let isMounted = true;

    loadDraft()
      .then((draft) => {
        if (!isMounted) return;
        if (draft) {
          setData(draft);
          setSaveStatus('saved');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setSaveStatus('failed');
        setSaveError('Saved draft could not be loaded. You can continue from a new draft.');
      })
      .finally(() => {
        if (isMounted) setIsHydrated(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!hasMeaningfulProjectData(data)) {
      setSaveStatus('idle');
      return;
    }

    // Autosave only after a meaningful edit so an empty startup state cannot
    // overwrite a complete draft while the IndexedDB image payloads hydrate.
    setSaveStatus('unsaved');
    setSaveError(null);
    let isCurrent = true;
    const timeout = setTimeout(() => {
      setSaveStatus('saving');
      saveDraft(data).then((result) => {
        if (!isCurrent) return;
        if (result.ok) {
          setSaveStatus('saved');
          setSaveError(null);
        } else {
          setSaveStatus('failed');
          setSaveError(result.error ?? 'Draft could not be saved.');
        }
      });
    }, 500);
    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [data, isHydrated]);

  useEffect(() => {
    localStorage.setItem('field_photo_log_preview_scale', String(previewScale));
  }, [previewScale]);

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
      selectedPhotoIds: prev.selectedPhotoIds.filter((selectedId) => selectedId !== id),
    }));
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
    setData((prev) => {
      const next = new Set(prev.selectedPhotoIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { ...prev, selectedPhotoIds: Array.from(next) };
    });
  };

  const handleSelectAll = () => {
    setData((prev) => ({
      ...prev,
      selectedPhotoIds: prev.photoEntries.map((e) => e.id),
    }));
  };

  const handleDeselectAll = () => {
    setData((prev) => ({ ...prev, selectedPhotoIds: [] }));
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

  const handleResetAllPhotosToFit = () => {
    setData((prev) => ({
      ...prev,
      photoEntries: prev.photoEntries.map((entry) => ({
        ...entry,
        imageSettings: getDefaultImageSettings(),
      })),
    }));
  };

  const handleSaveDraft = async () => {
    setSaveStatus('saving');
    const result = await saveDraft(data);
    if (result.ok) {
      setSaveStatus('saved');
      setSaveError(null);
      setSavedMessage('Draft saved!');
    } else {
      setSaveStatus('failed');
      setSaveError(result.error ?? 'Draft could not be saved.');
    }
  };

  const handleClearDraft = async () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      await clearDraft();
      setData(getDefaultProjectData());
      setSaveStatus('idle');
      setSaveError(null);
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
      setSaveStatus('unsaved');
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

  const handlePrint = async () => {
    await handleSaveDraft();
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

  const saveStatusLabel: Record<SaveStatus, string> = {
    idle: 'No draft yet',
    unsaved: 'Unsaved changes',
    saving: 'Saving...',
    saved: 'Saved',
    failed: 'Save failed',
  };
  const saveStatusClass: Record<SaveStatus, string> = {
    idle: 'bg-slate-100 text-slate-500 border-slate-200',
    unsaved: 'bg-amber-50 text-amber-700 border-amber-200',
    saving: 'bg-blue-50 text-blue-700 border-blue-200',
    saved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
  };
  const buttonBase =
    'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  const buttonSecondary =
    `${buttonBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;

  return (
    <>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        {/* Top Header Bar */}
        <div className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto max-w-screen-2xl px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-950">
                  Field Photo Log Generator
                </h1>
                <p className="text-xs text-slate-500">Draft, preview, and print professional field photo logs.</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${saveStatusClass[saveStatus]}`}>
                  {saveStatusLabel[saveStatus]}
                </span>
                {savedMessage && (
                  <span className="text-sm text-emerald-700 px-2">{savedMessage}</span>
                )}
                <button
                  onClick={handleSaveDraft}
                  className={`${buttonBase} bg-blue-600 text-white shadow-sm hover:bg-blue-700`}
                >
                  <Save size={16} />
                  Save Draft
                </button>
                <button
                  onClick={handleExport}
                  className={buttonSecondary}
                >
                  <FileDown size={16} />
                  JSON
                </button>
                <button
                  onClick={handleImportClick}
                  disabled={importing}
                  className={buttonSecondary}
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
                <button
                  onClick={handleClearDraft}
                  className={`${buttonSecondary} text-red-700 hover:bg-red-50`}
                >
                  <Trash2 size={16} />
                  Clear
                </button>
                <button
                  onClick={handlePrint}
                  className={`${buttonBase} bg-slate-950 text-white shadow-sm hover:bg-slate-800`}
                >
                  <Printer size={16} />
                  Print / Save as PDF
                </button>
              </div>
            </div>
            {saveError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {saveError}
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Editor + Preview */}
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-5 py-6 lg:flex-row">
          {/* Left: Editor Panel */}
          <div className="no-print w-full lg:w-[520px] flex-shrink-0 space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <ProjectSetupForm
                projectInfo={data.projectInfo}
                onChange={handleProjectInfoChange}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 border-b border-slate-200 pb-3 text-base font-semibold text-slate-950">
                Photo Upload
              </h2>
              <PhotoUploader onUpload={handlePhotoUpload} />
            </div>

            {data.photoEntries.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-950">
                      Photos ({data.photoEntries.length})
                    </h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {pageCount} page{pageCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedIds.size > 0 && (
                      <button
                        onClick={() => setShowBulkEdit(true)}
                        className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Edit {selectedIds.size} selected
                      </button>
                    )}
                    <button
                      onClick={selectedIds.size === data.photoEntries.length ? handleDeselectAll : handleSelectAll}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <RotateCcw size={14} />
                      Renumber
                    </button>
                    <button
                      onClick={handleResetAllPhotosToFit}
                      className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      <RotateCcw size={14} />
                      Reset All Photos to Fit Entire Photo
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
            <div className="sticky top-20 rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-xl">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Report Preview</h3>
                  <p className="text-xs text-slate-300">Print ignores preview zoom and renders at true size.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-slate-300">Zoom</label>
                    <input
                      type="range"
                      min="25"
                      max="120"
                      value={previewScale}
                      onChange={(e) => setPreviewScale(parseInt(e.target.value))}
                      className="w-28 accent-blue-500"
                    />
                    <span className="w-10 text-right text-xs text-slate-300">{previewScale}%</span>
                    <div className="flex items-center gap-1">
                      {[
                        ['Fit', 40],
                        ['75%', 75],
                        ['100%', 100],
                        ['120%', 120],
                      ].map(([label, value]) => (
                        <button
                          key={label}
                          onClick={() => setPreviewScale(value as number)}
                          className="rounded border border-slate-600 px-2 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
                  >
                    <Printer size={14} />
                    Print
                  </button>
                </div>
              </div>
              <div className="max-h-[calc(100vh-190px)] overflow-auto rounded-md bg-slate-700 p-4 no-print">
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
