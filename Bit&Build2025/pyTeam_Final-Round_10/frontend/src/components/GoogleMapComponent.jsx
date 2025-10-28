import React, { useEffect, useRef } from 'react';

function GoogleMapComponent({ selectedPoint, onMapClick, apiKey }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const initMap = () => {
      if (mapRef.current && !mapInstanceRef.current && window.google) {
        // Initialize map centered on world view
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#1a1a2e' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#ffffff' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#1a1a2e' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#0f3460' }]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#2a2a3e' }]
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#1a1a2e' }]
            }
          ],
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // Add click listener to map
        map.addListener('click', (e) => {
          if (onMapClick) {
            onMapClick(e);
          }
        });
      }
    };

    // Load Google Maps script if not already loaded
    if (!window.google && apiKey) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else if (window.google) {
      initMap();
    }
  }, [apiKey, onMapClick]);

  // Update marker when selectedPoint changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedPoint && window.google) {
      // Remove old marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // Create new marker
      const marker = new window.google.maps.Marker({
        position: { lat: selectedPoint.lat, lng: selectedPoint.lng },
        map: mapInstanceRef.current,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#ADF82D',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      markerRef.current = marker;

      // Center map on marker
      mapInstanceRef.current.panTo({ lat: selectedPoint.lat, lng: selectedPoint.lng });
      mapInstanceRef.current.setZoom(10);
    }
  }, [selectedPoint]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ minHeight: '400px', background: '#1a1a2e' }}
    />
  );
}

export default GoogleMapComponent;
