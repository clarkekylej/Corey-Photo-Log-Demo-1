import { ImageSettings, PhotoEntry, ProjectData, ProjectInfo } from '../types';
import { getDefaultImageSettings, getDefaultProjectData } from './defaults';

const STORAGE_KEY = 'field_photo_log_data';
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const stringOr = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const numberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

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
  if (!isRecord(value) || typeof value.image !== 'string' || !value.image) {
    return null;
  }

  return {
    id: stringOr(value.id, `${Date.now().toString(36)}-${index}`),
    photographNo: numberOr(value.photographNo, index + 1),
    date: stringOr(value.date),
    directionTaken: stringOr(value.directionTaken),
    description: stringOr(value.description),
    image: value.image,
    originalImage:
      typeof value.originalImage === 'string' ? value.originalImage : value.image,
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

  return {
    projectInfo: normalizeProjectInfo(value.projectInfo),
    photoEntries,
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

export function saveToStorage(data: ProjectData): void {
  if (!hasMeaningfulProjectData(data)) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function loadFromStorage(): ProjectData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return normalizeProjectData(JSON.parse(stored));
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return null;
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
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
