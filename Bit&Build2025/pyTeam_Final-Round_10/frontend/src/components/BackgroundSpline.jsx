import Spline from '@splinetool/react-spline';
import { useState, useRef, useEffect } from 'react';

export default function BackgroundSpline() {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isLoaded && containerRef.current) {
      // Additional watermark removal after component loads
      const hideWatermark = () => {
        const container = containerRef.current;
        if (container) {
          // Hide any elements that might be the watermark
          const possibleWatermarks = container.querySelectorAll(
            '[style*="position: absolute"][style*="bottom"], ' +
            '[style*="position: fixed"][style*="bottom"], ' +
            'div[style*="z-index"][style*="bottom"]'
          );
          
          possibleWatermarks.forEach(el => {
            if (el.textContent.toLowerCase().includes('spline') || 
                el.textContent.toLowerCase().includes('watermark')) {
              el.style.display = 'none';
            }
          });
        }
      };

      // Run immediately and then periodically
      hideWatermark();
      const interval = setInterval(hideWatermark, 1000);
      
      // Prevent scroll / pinch events from propagating into the Spline instance (stops zoom)
      const container = containerRef.current;
      const stopEvent = (e) => {
        e.stopPropagation();
      };
      const stopDragStart = (e) => {
        e.stopPropagation();
      };
      container.addEventListener('wheel', stopEvent, { capture: true });
      container.addEventListener('touchmove', stopEvent, { capture: true });
      container.addEventListener('gesturechange', stopEvent, { capture: true });
      container.addEventListener('pointerdown', stopDragStart, { capture: true });
      container.addEventListener('mousedown', stopDragStart, { capture: true });
      container.addEventListener('touchstart', stopDragStart, { capture: true });

      return () => {
        clearInterval(interval);
        container.removeEventListener('wheel', stopEvent, { capture: true });
        container.removeEventListener('touchmove', stopEvent, { capture: true });
        container.removeEventListener('gesturechange', stopEvent, { capture: true });
        container.removeEventListener('pointerdown', stopDragStart, { capture: true });
        container.removeEventListener('mousedown', stopDragStart, { capture: true });
        container.removeEventListener('touchstart', stopDragStart, { capture: true });
      };
    }
  }, [isLoaded]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{ zIndex: -1 }}
    >
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-green-900/20 flex items-center justify-center">
          <div className="text-white text-lg animate-pulse">Loading...</div>
        </div>
      )}
      
      {/* Spline component with enhanced styling (no CSS transforms so pointer mapping works) */}
      <div className="relative w-full h-full">
        <Spline 
          scene="https://prod.spline.design/F7kv6GAGx1idFA6z/scene.splinecode"
          onLoad={() => setIsLoaded(true)}
          style={{
            width: '100%',
            height: '140%', // extend further so bottom watermark is off-screen
            position: 'absolute',
            top: '-25%', // push the spline up so watermark sits outside
            left: '0'
          }}
        />

        {/* Soft overlays to hide watermark area */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#070A13] to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
}