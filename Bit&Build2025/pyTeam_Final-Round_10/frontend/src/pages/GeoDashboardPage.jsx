import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, TrendingUp, Users, Search, Loader2, Globe, BarChart3, Target } from 'lucide-react';
import Layout from '../components/Layout';
import GoogleMapComponent from '../components/GoogleMapComponent';
import BackgroundSpline from '../components/BackgroundSpline';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function GeoDashboardPage() {
  const [selectedLocation, setSelectedLocation] = useState({ lat: 19.0760, lng: 72.8777 }); // Mumbai coordinates
  const [locationName, setLocationName] = useState('Mumbai');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendData, setTrendData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('Mumbai');
  const [mapUrl, setMapUrl] = useState('https://maps.google.com/maps?q=Mumbai&t=&z=13&ie=UTF8&iwloc=&output=embed');
  const [useGoogleMapsAPI, setUseGoogleMapsAPI] = useState(!!GOOGLE_MAPS_API_KEY);
  const [isAPILoaded, setIsAPILoaded] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !useGoogleMapsAPI) {
      return;
    }

    const loadGoogleMapsAPI = () => {
      if (window.google) {
        setIsAPILoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => setIsAPILoaded(true);
      script.onerror = () => {
        console.warn('Failed to load Google Maps API, falling back to embedded map');
        setUseGoogleMapsAPI(false);
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, [useGoogleMapsAPI]);

  // Handle map click for Google Maps API
  const onMapClick = useCallback(async (e) => {
    const location = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    
    setSelectedLocation(location);
    setTrendData(null);

    // Reverse geocode to get location name
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          setLocationName(address);
          setSearchQuery(address);
        }
      });
    }
  }, []);

  const handleSearchLocation = () => {
    if (!searchQuery.trim()) return;
    
    if (useGoogleMapsAPI && window.google && window.google.maps) {
      // Use Google Maps API for geocoding
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          setSelectedLocation({
            lat: location.lat(),
            lng: location.lng()
          });
          setLocationName(results[0].formatted_address);
          setTrendData(null);
        } else {
          // Fallback to embedded map
          updateEmbeddedMap(searchQuery);
        }
      });
    } else {
      // Use embedded map
      updateEmbeddedMap(searchQuery);
    }
  };

  const updateEmbeddedMap = (location) => {
    const encodedLocation = encodeURIComponent(location);
    setMapUrl(`https://maps.google.com/maps?q=${encodedLocation}&t=&z=13&ie=UTF8&iwloc=&output=embed`);
    setLocationName(location);
    setTrendData(null);
  };

  // Handle Enter key in search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchLocation();
    }
  };

  // Quick location selection
  const selectQuickLocation = (location) => {
    setSearchQuery(location);
    
    if (useGoogleMapsAPI && window.google && window.google.maps) {
      // Use Google Maps API for geocoding
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: location }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const coords = results[0].geometry.location;
          setSelectedLocation({
            lat: coords.lat(),
            lng: coords.lng()
          });
          setLocationName(results[0].formatted_address);
          setTrendData(null);
        } else {
          updateEmbeddedMap(location);
        }
      });
    } else {
      updateEmbeddedMap(location);
    }
  };

  const analyzeTrends = async () => {
    if (!locationName && !searchQuery) {
      alert('Please enter a location first.');
      return;
    }

    const location = locationName || searchQuery;
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/analyze-location-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: location,
          coordinates: useGoogleMapsAPI ? selectedLocation : null,
          search_context: 'marketing trends, consumer behavior, demographics'
        })
      });

      const data = await response.json();
      if (data.success) {
        setTrendData(data.trends);
        if (!locationName) setLocationName(location);
      } else {
        console.error('Analysis failed:', data);
        alert('Analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing trends:', error);
      alert('Error analyzing trends. Please check if the backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Layout>
      {/* Spline Background */}
      <BackgroundSpline />
      
      <div style={{ marginTop: '50px' }} className="min-h-screen flex items-center justify-center px-4 py-20 relative z-10">
        <div className="w-full max-w-7xl">
          {/* Header */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 hover:bg-white/15 transition-all duration-300 ease-out mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-[rgb(173,248,45)]/20 rounded-2xl">
                  <Globe className="w-8 h-8 text-[rgb(173,248,45)]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">🌍 Geo Marketing Dashboard</h1>
                  <p className="text-white/70 mt-1">
                    Discover location-based trends and insights for your campaigns
                  </p>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="flex gap-3 min-w-[300px]">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Search location..."
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/60 focus:outline-none focus:border-[rgb(173,248,45)] transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearchLocation}
                  className="px-4 py-2 bg-[rgb(173,248,45)] text-black font-semibold rounded-xl hover:bg-[rgb(173,248,45)]/90 transition-all hover:scale-105 text-sm"
                >
                  Search
                </button>
              </div>
            </div>
            
            {/* Quick Location Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-white/60 text-xs mr-2 flex items-center">Quick select:</span>
              {['Mumbai', 'Delhi', 'Bangalore', 'New York', 'London', 'Tokyo', 'Dubai'].map((city) => (
                <button
                  key={city}
                  onClick={() => selectQuickLocation(city)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    locationName === city || searchQuery === city
                      ? 'bg-[rgb(173,248,45)] text-black'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/20'
                  }`}
                >
                  {city}
                </button>
              ))}
              
              {/* Map Type Indicator */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-white/40 text-xs">
                  {useGoogleMapsAPI && isAPILoaded ? '🗺️ Interactive Map' : '📍 Embedded Map'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map Section */}
            <div className="h-[50vh] lg:h-[75vh] bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative">
              {useGoogleMapsAPI && isAPILoaded ? (
                <GoogleMapComponent
                  selectedPoint={selectedLocation}
                  onMapClick={onMapClick}
                  apiKey={GOOGLE_MAPS_API_KEY}
                />
              ) : (
                <iframe
                  key={mapUrl}
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                ></iframe>
              )}
              
              {/* Location Info Overlay */}
              {(selectedLocation || locationName) && (
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-white/60 mb-1">
                        📍 {useGoogleMapsAPI && isAPILoaded ? 'Selected Location' : 'Current Location'}
                      </div>
                      <div className="text-white font-semibold text-sm">{locationName || 'Loading...'}</div>
                      {useGoogleMapsAPI && selectedLocation && (
                        <div className="text-xs text-white/40 mt-1">
                          {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={analyzeTrends}
                      disabled={isAnalyzing}
                      className="px-4 py-2 bg-[rgb(173,248,45)] text-black font-semibold rounded-xl hover:bg-[rgb(173,248,45)]/90 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          Analyze
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Results Panel */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all duration-300 ease-out overflow-y-auto max-h-[75vh]">
              <h2 className="text-2xl font-bold text-white mb-4">📊 Location Insights</h2>
              
              {/* Instructions Card */}
              {!trendData && !isAnalyzing && !locationName && (
                <div className="flex justify-center items-center h-full min-h-[300px] text-center">
                  <div>
                    <div className="text-6xl mb-4">🌎</div>
                    <p className="text-white/90 text-lg font-semibold mb-2">Search for a Location</p>
                    <p className="text-white/70">Enter a city, country, or address above</p>
                    <p className="text-white/60 text-sm mt-2">Then press "Analyze" to see detailed marketing insights</p>
                  </div>
                </div>
              )}

              {/* Selected but not analyzed */}
              {locationName && !trendData && !isAnalyzing && (
                <div className="bg-gradient-to-br from-[rgb(173,248,45)]/20 to-[rgb(173,248,45)]/5 backdrop-blur-md rounded-2xl p-6 border border-[rgb(173,248,45)]/30">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[rgb(173,248,45)]/20 rounded-xl">
                      <Target className="w-6 h-6 text-[rgb(173,248,45)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">Ready to Analyze</h3>
                      <p className="text-white/80 mb-3">
                        Location selected: <span className="font-semibold">{locationName}</span>
                      </p>
                      <p className="text-white/70 text-sm">
                        Click the "Analyze" button to discover marketing trends, demographics, and opportunities for this location.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isAnalyzing && (
                <div className="flex justify-center items-center h-full min-h-[300px]">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[rgb(173,248,45)] animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Analyzing Location</h3>
                    <p className="text-white/60 text-sm">
                      Gathering trends and insights for {locationName}...
                    </p>
                  </div>
                </div>
              )}

              {/* Trends Data */}
              {trendData && !isAnalyzing && (
                <div className="space-y-6">
                  {/* Demographics */}
                  {trendData.demographics && (
                    <div className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="w-5 h-5 text-[rgb(173,248,45)]" />
                        <h3 className="text-lg font-semibold text-white">Demographics</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        {Object.entries(trendData.demographics).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <span className="text-white/70 capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="font-semibold text-white">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Topics */}
                  {trendData.trending_topics && trendData.trending_topics.length > 0 && (
                    <div className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="w-5 h-5 text-[rgb(173,248,45)]" />
                        <h3 className="text-lg font-semibold text-white">Trending Topics</h3>
                      </div>
                      <div className="space-y-2">
                        {trendData.trending_topics.map((topic, idx) => (
                          <div key={idx} className="px-3 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="text-white font-medium text-sm">{topic.name}</div>
                            {topic.volume && (
                              <div className="text-xs text-white/60 mt-1">
                                Volume: <span className="text-[rgb(173,248,45)]">{topic.volume}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Consumer Behavior */}
                  {trendData.consumer_behavior && (
                    <div className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <BarChart3 className="w-5 h-5 text-[rgb(173,248,45)]" />
                        <h3 className="text-lg font-semibold text-white">Consumer Behavior</h3>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {trendData.consumer_behavior}
                      </p>
                    </div>
                  )}

                  {/* Marketing Opportunities */}
                  {trendData.opportunities && trendData.opportunities.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-[rgb(173,248,45)]/20 to-[rgb(173,248,45)]/5 backdrop-blur-md rounded-2xl border border-[rgb(173,248,45)]/30 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Target className="w-5 h-5 text-[rgb(173,248,45)]" />
                        <h3 className="text-lg font-semibold text-white">Marketing Opportunities</h3>
                      </div>
                      <ul className="space-y-2">
                        {trendData.opportunities.map((opp, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-white/90">
                            <span className="text-[rgb(173,248,45)] mt-1">✓</span>
                            <span>{opp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default GeoDashboardPage;
