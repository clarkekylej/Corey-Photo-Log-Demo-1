import { ImageSettings, PhotoEntry, ProjectData, ProjectInfo } from '../types';
import { getDefaultImageSettings, getDefaultProjectData, generateId } from './defaults';

const STORAGE_KEY = 'field_photo_log_draft_v2';
const LEGACY_STORAGE_KEY = 'field_photo_log_data';
const DB_NAME = 'field_photo_log_assets';
const DB_VERSION = 1;
const IMAGE_STORE = 'images';

type StoredProjectInfo = Omit<ProjectInfo, 'companyLogo'> & {
  companyLogo: string | null;
  companyLogoId?: string | null;
};

type StoredPhotoEntry = Omit<PhotoEntry, 'image' | 'originalImage'> & {
  image: string;
  imageId?: string;
  originalImage?: string;
  originalImageId?: string;
};

interface StoredDraft {
  version: 2;
  savedAt: string;
  projectInfo: StoredProjectInfo;
  photoEntries: StoredPhotoEntry[];
  selectedPhotoIds: string[];
}

interface SaveDraftResult {
  ok: boolean;
  error?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const stringOr = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const numberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const isDataUrl = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.startsWith('data:');

function openImageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open image storage.'));
  });
}

async function putImage(id: string, dataUrl: string): Promise<void> {
  const db = await openImageDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE, 'readwrite');
    transaction.objectStore(IMAGE_STORE).put(dataUrl, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save image.'));
  });
  db.close();
}

async function getImage(id: string | null | undefined): Promise<string | null> {
  if (!id) return null;

  const db = await openImageDb();
  const image = await new Promise<string | null>((resolve, reject) => {
    const request = db.transaction(IMAGE_STORE, 'readonly').objectStore(IMAGE_STORE).get(id);
    request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
    request.onerror = () => reject(request.error ?? new Error('Could not load image.'));
  });
  db.close();
  return image;
}

async function clearImageDb(): Promise<void> {
  const db = await openImageDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE, 'readwrite');
    transaction.objectStore(IMAGE_STORE).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not clear image storage.'));
  });
  db.close();
}

function normalizeImageSettings(value: unknown): ImageSettings {
  const defaults = getDefaultImageSettings();
  if (!isRecord(value)) return defaults;

  return {
    zoom: numberOr(value.zoom, defaults.zoom),
    posX: numberOr(value.posX, defaults.posX),
    posY: numberOr(value.posY, defaults.posY),
    rotation: numberOr(value.rotation, defaults.rotation),
    cropX: numberOr(value.cropX, defaults.cropX),
    cropY: numberOr(value.cropY, defaults.cropY),
    cropWidth: numberOr(value.cropWidth, defaults.cropWidth),
    cropHeight: numberOr(value.cropHeight, defaults.cropHeight),
  };
}

function normalizeProjectInfo(value: unknown): ProjectInfo {
  const defaults = getDefaultProjectData().projectInfo;
  if (!isRecord(value)) return defaults;

  return {
    reportTitle: stringOr(value.reportTitle, defaults.reportTitle),
    projectName: stringOr(value.projectName, defaults.projectName),
    clientName: stringOr(value.clientName, defaults.clientName),
    jobNumber: stringOr(value.jobNumber, defaults.jobNumber),
    location: stringOr(value.location, defaults.location),
    preparedBy: stringOr(value.preparedBy, defaults.preparedBy),
    reportDate: stringOr(value.reportDate, defaults.reportDate),
    companyLogo:
      typeof value.companyLogo === 'string' || value.companyLogo === null
        ? value.companyLogo
        : defaults.companyLogo,
  };
}

function normalizePhotoEntry(value: unknown, index: number): PhotoEntry | null {
  if (!isRecord(value)) return null;

  const image = stringOr(value.image);
  const imageId = stringOr(value.imageId);
  if (!image && !imageId) return null;

  return {
    id: stringOr(value.id, generateId()),
    photographNo: numberOr(value.photographNo, index + 1),
    date: stringOr(value.date),
    directionTaken: stringOr(value.directionTaken),
    description: stringOr(value.description),
    image,
    imageId: imageId || undefined,
    originalImage:
      typeof value.originalImage === 'string'
        ? value.originalImage
        : image,
    originalImageId: stringOr(value.originalImageId) || imageId || undefined,
    imageSettings: normalizeImageSettings(value.imageSettings),
  };
}

export function normalizeProjectData(value: unknown): ProjectData | null {
  if (!isRecord(value)) return null;

  const photoEntries = Array.isArray(value.photoEntries)
    ? value.photoEntries
        .map((entry, index) => normalizePhotoEntry(entry, index))
        .filter((entry): entry is PhotoEntry => entry !== null)
    : [];

  const selectedPhotoIds = Array.isArray(value.selectedPhotoIds)
    ? value.selectedPhotoIds.filter((id): id is string => typeof id === 'string')
    : [];

  return {
    projectInfo: normalizeProjectInfo(value.projectInfo),
    photoEntries,
    selectedPhotoIds,
  };
}

export function hasMeaningfulProjectData(data: ProjectData): boolean {
  const { projectInfo, photoEntries } = data;

  return (
    photoEntries.length > 0 ||
    Boolean(projectInfo.companyLogo) ||
    Boolean(projectInfo.projectName.trim()) ||
    Boolean(projectInfo.clientName.trim()) ||
    Boolean(projectInfo.jobNumber.trim()) ||
    Boolean(projectInfo.location.trim()) ||
    Boolean(projectInfo.preparedBy.trim()) ||
    projectInfo.reportTitle.trim() !== 'Photographic Log'
  );
}

async function serializeForStorage(data: ProjectData): Promise<StoredDraft> {
  const projectInfo = { ...data.projectInfo } as StoredProjectInfo;

  if (isDataUrl(data.projectInfo.companyLogo)) {
    projectInfo.companyLogoId = data.projectInfo.companyLogoId || `logo-${generateId()}`;
    await putImage(projectInfo.companyLogoId, data.projectInfo.companyLogo);
    projectInfo.companyLogo = null;
  }

  const photoEntries = await Promise.all(
    data.photoEntries.map(async (entry) => {
      const imageId = entry.imageId || `photo-${entry.id}-${generateId()}`;
      const originalImageId = entry.originalImageId || imageId;

      if (isDataUrl(entry.image)) {
        await putImage(imageId, entry.image);
      }
      if (isDataUrl(entry.originalImage)) {
        await putImage(originalImageId, entry.originalImage);
      }

      return {
        ...entry,
        image: '',
        imageId,
        originalImage: '',
        originalImageId,
      };
    })
  );

  return {
    version: 2,
    savedAt: new Date().toISOString(),
    projectInfo,
    photoEntries,
    selectedPhotoIds: data.selectedPhotoIds ?? [],
  };
}

async function hydrateStoredDraft(stored: StoredDraft | ProjectData): Promise<ProjectData | null> {
  const normalized = normalizeProjectData(stored);
  if (!normalized) return null;

  const companyLogoId = isRecord(stored.projectInfo)
    ? stringOr(stored.projectInfo.companyLogoId)
    : '';
  const companyLogo = normalized.projectInfo.companyLogo || (await getImage(companyLogoId));

  const photoEntries = await Promise.all(
    normalized.photoEntries.map(async (entry) => {
      const image = entry.image || (await getImage(entry.imageId)) || '';
      const originalImage =
        entry.originalImage || (await getImage(entry.originalImageId)) || image;

      return {
        ...entry,
        image,
        originalImage,
      };
    })
  );

  return {
    ...normalized,
    projectInfo: {
      ...normalized.projectInfo,
      companyLogo,
      companyLogoId: companyLogoId || normalized.projectInfo.companyLogoId,
    },
    photoEntries: photoEntries.filter((entry) => entry.image),
  };
}

export async function saveDraft(data: ProjectData): Promise<SaveDraftResult> {
  if (!hasMeaningfulProjectData(data)) return { ok: true };

  try {
    const stored = await serializeForStorage(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return { ok: true };
  } catch (error) {
    console.error('Failed to save draft:', error);
    return {
      ok: false,
      error:
        error instanceof DOMException && error.name === 'QuotaExceededError'
          ? 'Draft metadata exceeded browser storage. Try deleting a few photos or exporting a JSON backup.'
          : 'Draft could not be saved. Please export a JSON backup before refreshing.',
    };
  }
}

export async function loadDraft(): Promise<ProjectData | null> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const hydrated = await hydrateStoredDraft(parsed);

    // Legacy drafts stored photos directly in localStorage. Save once into the
    // safer IndexedDB-backed format after a successful migration.
    if (hydrated && localStorage.getItem(LEGACY_STORAGE_KEY)) {
      await saveDraft(hydrated);
    }

    return hydrated;
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  await clearImageDb();
}

export function exportProjectJSON(data: ProjectData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.projectInfo.projectName || 'project'}_${data.projectInfo.jobNumber || 'export'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function importProjectJSON(file: File): Promise<ProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = normalizeProjectData(JSON.parse(e.target?.result as string));
        if (!data) {
          reject(new Error('Invalid project file'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
