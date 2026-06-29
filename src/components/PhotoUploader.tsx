import { useRef, useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';

interface Props {
  onUpload: (images: string[]) => void;
}

export function PhotoUploader({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    const promises = imageFiles.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(promises).then((images) => {
      if (images.length > 0) {
        onUpload(images);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-lg p-6 cursor-pointer text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        {isDragging ? (
          <ImagePlus size={32} className="text-blue-500" />
        ) : (
          <Upload size={32} className="text-gray-400" />
        )}
        <span className="font-medium text-gray-700">
          {isDragging ? 'Drop photos here' : 'Drag & drop photos or click to upload'}
        </span>
        <span className="text-sm text-gray-500">
          Upload multiple photos at once
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
