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
  thumbnail: 'aspect-[7/4.25] rounded-md border border-slate-200 bg-white',
  editor: 'h-full w-full rounded bg-white shadow-lg',
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
  const fit = settings.fit ?? 'contain';
  const isFitEntirePhoto = fit === 'contain';
  const zoom = isFitEntirePhoto ? 100 : Math.max(100, Math.min(300, settings.zoom || 100));
  const posX = isFitEntirePhoto ? 50 : Math.max(0, Math.min(100, settings.posX));
  const posY = isFitEntirePhoto ? 50 : Math.max(0, Math.min(100, settings.posY));
  const rotation = settings.rotation || 0;

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
