import { useRef, useState, useEffect, useCallback } from "react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const BeforeAfterSlider = ({
  beforeImage,
  afterImage,
  beforeLabel = "Avant",
  afterLabel = "Après",
  className = "",
}: BeforeAfterSliderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updatePosition(e.touches[0].clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => updatePosition(e.clientX);
    const onMouseUp = () => setIsDragging(false);
    const onTouchMove = (e: TouchEvent) => updatePosition(e.touches[0].clientX);
    const onTouchEnd = () => setIsDragging(false);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, updatePosition]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-lg ${className}`}
      style={{ cursor: isDragging ? "grabbing" : "ew-resize" }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
      )}

      <img
        src={afterImage}
        alt={afterLabel}
        className="w-full h-full object-cover block"
        draggable={false}
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-cover block"
          draggable={false}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-lg pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-gray-200">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-600"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      <div
        className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-semibold bg-black/60 text-white backdrop-blur-sm pointer-events-none"
        style={{ opacity: sliderPos > 15 ? 1 : 0, transition: "opacity 0.2s" }}
      >
        {beforeLabel}
      </div>

      <div
        className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-semibold bg-black/60 text-white backdrop-blur-sm pointer-events-none"
        style={{ opacity: sliderPos < 85 ? 1 : 0, transition: "opacity 0.2s" }}
      >
        {afterLabel}
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
