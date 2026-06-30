import { ProjectData, ProjectInfo, PhotoEntry, ImageSettings } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getDefaultImageSettings(): ImageSettings {
  return {
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
  };
}

export function getDefaultProjectInfo(): ProjectInfo {
  const today = new Date().toISOString().split('T')[0];
  return {
    reportTitle: 'Photographic Log',
    projectName: '',
    clientName: '',
    jobNumber: '',
    location: '',
    preparedBy: '',
    reportDate: today,
    companyLogo: null,
  };
}

export function getDefaultProjectData(): ProjectData {
  return {
    projectInfo: getDefaultProjectInfo(),
    photoEntries: [],
    selectedPhotoIds: [],
  };
}

export function createPhotoEntry(image: string, index: number): PhotoEntry {
  const today = new Date().toISOString().split('T')[0];
  const id = generateId();
  const imageId = `photo-${id}`;
  return {
    id,
    photographNo: index,
    date: today,
    directionTaken: '',
    description: '',
    image,
    imageId,
    originalImage: image,
    originalImageId: imageId,
    imageSettings: getDefaultImageSettings(),
  };
}
