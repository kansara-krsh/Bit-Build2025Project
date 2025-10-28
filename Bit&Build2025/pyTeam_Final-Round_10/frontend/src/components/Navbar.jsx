import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  // Hide navbar on /campaign and any subroutes (e.g., /campaign/*)
  if (location.pathname && location.pathname.startsWith('/campaign')) {
    return null;
  }

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-fit">
      <div 
        className="px-8 py-3 rounded-full backdrop-blur-md border border-white/20 shadow-2xl"
        style={{
          backgroundColor: `rgba(173, 248, 45, 0.1)`,
          borderColor: `rgba(173, 248, 45, 0.3)`,
        }}
      >
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <Link to="/" className="text-white font-bold text-xl hover:opacity-80 transition-opacity">
            <span style={{ color: 'rgb(173, 248, 45)' }}>AI</span>Campaigns
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-white/90 hover:text-white transition-colors duration-200 font-medium"
            >
              Home
            </Link>
            <Link 
              to="/geo-dashboard" 
              className="text-white/90 hover:text-white transition-colors duration-200 font-medium"
            >
              Geo Insights
            </Link>
            <Link 
              to="/marketplace" 
              className="text-white/90 hover:text-white transition-colors duration-200 font-medium"
            >
              Marketplace
            </Link>
            <a 
              href="http://localhost:3000/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 hover:text-white transition-colors duration-200 font-medium"
            >
              AURA AI
            </a>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link 
              to="/campaign"
              className="px-6 py-2 rounded-full font-semibold text-white border border-white/30 backdrop-blur-md bg-white/10 transition-all duration-200 hover:bg-white/20 hover:scale-105"
            >
              Launch Campaign
            </Link>
            <Link 
              to="/login"
              className="px-6 py-2 rounded-full font-semibold text-black transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: 'rgb(173, 248, 45)',
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}