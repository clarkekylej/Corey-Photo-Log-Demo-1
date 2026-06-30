export interface ProjectInfo {
  reportTitle: string;
  projectName: string;
  clientName: string;
  jobNumber: string;
  location: string;
  preparedBy: string;
  reportDate: string;
  companyLogo: string | null;
  companyLogoId?: string | null;
}

export interface ImageSettings {
  zoom: number;
  posX: number;
  posY: number;
  rotation: number;
  fit: 'cover' | 'contain';
  fitModeExplicit?: boolean;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

export interface PhotoEntry {
  id: string;
  photographNo: number;
  date: string;
  directionTaken: string;
  description: string;
  image: string;
  imageId?: string;
  originalImage?: string;
  originalImageId?: string;
  imageSettings: ImageSettings;
}

export interface ProjectData {
  projectInfo: ProjectInfo;
  photoEntries: PhotoEntry[];
  selectedPhotoIds: string[];
}
