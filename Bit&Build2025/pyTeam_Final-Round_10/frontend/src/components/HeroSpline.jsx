import Spline from '@splinetool/react-spline';
import { useState, useRef, useEffect } from 'react';

export default function HeroSpline() {
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
        // allow page scrolling when user scrolls the page normally (we only stop when over the canvas)
        e.stopPropagation();
        // do not preventDefault so page still scrolls; many runtimes use wheel delta for zoom
      };
      // Prevent drag start (pointerdown/mousedown/touchstart) from reaching the Spline runtime
      const stopDragStart = (e) => {
        e.stopPropagation();
        // keep default so links/buttons still work
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
      className="absolute inset-0 w-full h-full overflow-hidden"
    >
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center">
          <div className="text-white text-lg animate-pulse">Loading 3D Scene...</div>
        </div>
      )}
      
      {/* Spline component for hero section only */}
      <div className="relative w-full h-full">
        <Spline 
          scene="https://prod.spline.design/F7kv6GAGx1idFA6z/scene.splinecode"
          onLoad={() => setIsLoaded(true)}
          style={{
            width: '100%',
            height: '160%', // extend further so bottom watermark is off-screen
            position: 'absolute',
            top: '-30%', // push the spline up so watermark sits outside hero
            left: '0',
            // avoid CSS transforms so pointer coordinates stay correct
            transform: 'none',
            pointerEvents: 'auto'
          }}
        />

        {/* Soft gradient at the bottom so there is no hard seam between sections */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-20"
             style={{
               background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(7,10,19,0.96) 85%)'
             }}
        />
      </div>
    </div>
  );
}