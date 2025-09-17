import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type LazyImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  skeletonClassName?: string;
  containerClassName?: string;
};

export default function LazyImage({
  src,
  alt,
  className,
  skeletonClassName,
  containerClassName,
  ...imgProps
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setIsInView(true);
            observer?.disconnect();
          }
        },
        { rootMargin: "200px" }
      );
      observer.observe(element);
    } else {
      // Fallback: load immediately
      setIsInView(true);
    }

    return () => observer?.disconnect();
  }, []);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  return (
    <div ref={containerRef} className={containerClassName}>
      {!isLoaded && !hasError && <Skeleton className={skeletonClassName ?? "w-full h-full"} />}
      {hasError && (
        <div className={`${skeletonClassName ?? "w-full h-full"} flex items-center justify-center bg-muted text-muted-foreground text-sm`}>
          <span>فشل في تحميل الصورة</span>
        </div>
      )}
      {isInView && !hasError ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
          src={src}
          alt={alt}
          className={className}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(false);
            console.warn('Failed to load image:', src);
          }}
          style={{ display: isLoaded ? undefined : "none" }}
          {...imgProps}
        />
      ) : null}
    </div>
  );
}


