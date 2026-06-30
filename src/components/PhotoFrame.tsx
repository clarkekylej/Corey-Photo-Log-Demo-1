import { ImageSettings } from '../types';
import type { CSSProperties, MouseEvent } from 'react';

type PhotoFrameMode = 'thumbnail' | 'editor' | 'report';

interface PhotoFrameProps {
  src: string;
  settings: ImageSettings;
  alt: string;
  mode?: PhotoFrameMode;
  className?: string;
  imageClassName?: string;
  style?: CSSProperties;
  onMouseDown?: (event: MouseEvent<HTMLDivElement>) => void;
}

const modeClasses: Record<PhotoFrameMode, string> = {
  thumbnail: 'aspect-[7/4.25] rounded-md border border-slate-200 bg-slate-100',
  editor: 'h-full w-full rounded bg-slate-950 shadow-lg',
  report: 'report-photo-box',
};

export function PhotoFrame({
  src,
  settings,
  alt,
  mode = 'thumbnail',
  className = '',
  imageClassName = '',
  style,
  onMouseDown,
}: PhotoFrameProps) {
  const zoom = Math.max(100, Math.min(300, settings.zoom || 100));
  const posX = Math.max(0, Math.min(100, settings.posX));
  const posY = Math.max(0, Math.min(100, settings.posY));
  const rotation = settings.rotation || 0;
  const fit = settings.fit ?? 'cover';

  return (
    <div
      className={`photo-frame relative overflow-hidden ${modeClasses[mode]} ${className}`}
      style={style}
      onMouseDown={onMouseDown}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`photo-frame-image h-full w-full select-none ${imageClassName}`}
        style={{
          display: 'block',
          objectFit: fit,
          objectPosition: `${posX}% ${posY}%`,
          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
          transformOrigin: `${posX}% ${posY}%`,
          maxWidth: 'none',
        }}
      />
    </div>
  );
}
