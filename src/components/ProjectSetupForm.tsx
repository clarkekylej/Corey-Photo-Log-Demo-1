import { useRef } from 'react';
import { ProjectInfo } from '../types';
import { Upload, X } from 'lucide-react';

interface Props {
  projectInfo: ProjectInfo;
  onChange: (info: ProjectInfo) => void;
}

export function ProjectSetupForm({ projectInfo, onChange }: Props) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const inputClass =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({
          ...projectInfo,
          companyLogo: event.target?.result as string,
          companyLogoId: `logo-${Date.now().toString(36)}`,
        });
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
    onChange({ ...projectInfo, companyLogo: null, companyLogoId: null });
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-base font-semibold text-slate-950">Project Setup</h2>
        <p className="mt-1 text-xs text-slate-500">These fields appear in the report header.</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className={labelClass}>
            Report Title
          </label>
          <input
            type="text"
            value={projectInfo.reportTitle}
            onChange={handleChange('reportTitle')}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectInfo.projectName}
            onChange={handleChange('projectName')}
            placeholder="Enter project name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectInfo.clientName}
            onChange={handleChange('clientName')}
            placeholder="Enter client name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Job Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectInfo.jobNumber}
            onChange={handleChange('jobNumber')}
            placeholder="Enter job number"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projectInfo.location}
            onChange={handleChange('location')}
            placeholder="Enter location"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Prepared By
          </label>
          <input
            type="text"
            value={projectInfo.preparedBy}
            onChange={handleChange('preparedBy')}
            placeholder="Optional"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Report Date
          </label>
          <input
            type="date"
            value={projectInfo.reportDate}
            onChange={handleChange('reportDate')}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Company Logo
          </label>
          {projectInfo.companyLogo ? (
            <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2">
              <img
                src={projectInfo.companyLogo}
                alt="Company Logo"
                className="h-16 w-auto rounded border border-slate-200 bg-white"
              />
              <button
                onClick={removeLogo}
                className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                title="Remove logo"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Upload size={18} className="text-slate-400" />
              <span>Upload logo</span>
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
