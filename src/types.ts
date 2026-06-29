export interface ProjectInfo {
  reportTitle: string;
  projectName: string;
  clientName: string;
  jobNumber: string;
  location: string;
  preparedBy: string;
  reportDate: string;
  companyLogo: string | null;
}

export interface ImageSettings {
  zoom: number;
  posX: number;
  posY: number;
  rotation: number;
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
  originalImage?: string;
  imageSettings: ImageSettings;
}

export interface ProjectData {
  projectInfo: ProjectInfo;
  photoEntries: PhotoEntry[];
}
