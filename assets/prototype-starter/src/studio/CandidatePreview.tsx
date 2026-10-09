import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Compare the same desktop viewport at each available card width. */
export function CandidatePreview({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = frame.current!;
    const measure = () => setScale(element.clientWidth / 1100);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="candidate-preview" ref={frame} aria-hidden="true" inert>
      <div className="candidate-scale" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
