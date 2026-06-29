import { useRef } from 'react';
import { ProjectInfo } from '../types';
import { Upload, X } from 'lucide-react';

interface Props {
  projectInfo: ProjectInfo;
  onChange: (info: ProjectInfo) => void;
}

export function ProjectSetupForm({ projectInfo, onChange }: Props) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ ...projectInfo, companyLogo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field: keyof ProjectInfo) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ ...projectInfo, [field]: e.target.value });
  };

  const removeLogo = () => {
    onChange({ ...projectInfo, companyLogo: null });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Project Setup</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Title
          </label>
          <input
            type="text"
            value={projectInfo.reportTitle}
            onChange={handleChange('reportTitle')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectInfo.projectName}
            onChange={handleChange('projectName')}
            placeholder="Enter project name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectInfo.clientName}
            onChange={handleChange('clientName')}
            placeholder="Enter client name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectInfo.jobNumber}
            onChange={handleChange('jobNumber')}
            placeholder="Enter job number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectInfo.location}
            onChange={handleChange('location')}
            placeholder="Enter location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prepared By
          </label>
          <input
            type="text"
            value={projectInfo.preparedBy}
            onChange={handleChange('preparedBy')}
            placeholder="Optional"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Date
          </label>
          <input
            type="date"
            value={projectInfo.reportDate}
            onChange={handleChange('reportDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Logo
          </label>
          {projectInfo.companyLogo ? (
            <div className="flex items-center gap-2">
              <img
                src={projectInfo.companyLogo}
                alt="Company Logo"
                className="h-16 w-auto border border-gray-200 rounded"
              />
              <button
                onClick={removeLogo}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
                title="Remove logo"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 border-dashed rounded-md hover:bg-gray-50 w-full"
            >
              <Upload size={18} className="text-gray-400" />
              <span className="text-sm text-gray-500">Upload logo</span>
            </button>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
