'use client';

import { useEffect, useMemo, useState } from 'react';
import { SOCIAL_CARD_PATH } from '@/config/site';

type FeatureGifImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
};

function resolveFeatureThumbnail(src: string): string {
  const match = src.match(/^\/features\/(Feature\d+)\.gif$/i);
  if (!match) return SOCIAL_CARD_PATH;
  return `/features/thumbnails/${match[1]}.png`;
}

function joinClassNames(...classNames: Array<string | undefined | false>): string {
  return classNames.filter(Boolean).join(' ');
}

export function FeatureGifImage({ src, alt, className, imageClassName }: FeatureGifImageProps) {
  const initialThumbnail = useMemo(() => resolveFeatureThumbnail(src), [src]);
  const [thumbnailSrc, setThumbnailSrc] = useState(initialThumbnail);
  const [isGifLoaded, setIsGifLoaded] = useState(false);
  const [hasGifError, setHasGifError] = useState(false);

  useEffect(() => {
    setThumbnailSrc(initialThumbnail);
    setIsGifLoaded(false);
    setHasGifError(false);
  }, [initialThumbnail, src]);

  const showThumbnail = !isGifLoaded || hasGifError;

  return (
    <div className={joinClassNames('feature-gif-image', className, showThumbnail ? 'is-loading' : 'is-loaded')}>
      <img
        src={thumbnailSrc}
        alt={alt}
        className={joinClassNames('feature-gif-image-thumb', imageClassName)}
        loading="eager"
        decoding="async"
        onError={() => {
          if (thumbnailSrc !== SOCIAL_CARD_PATH) {
            setThumbnailSrc(SOCIAL_CARD_PATH);
          }
        }}
      />
      {!hasGifError ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className={joinClassNames('feature-gif-image-main', imageClassName)}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsGifLoaded(true)}
          onError={() => setHasGifError(true)}
        />
      ) : null}
    </div>
  );
}
