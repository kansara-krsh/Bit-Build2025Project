import HeroSpline from '../components/HeroSpline';

export default function HeroSection() {
  return (
  <section className="relative min-h-screen w-full overflow-hidden hero-container" style={{ height: '120vh' }}>
      {/* Spline Background */}
      <HeroSpline />
      
      {/* Hero Content */}
      <div className="relative z-30 h-full flex items-center justify-center pt-40 pb-16 pointer-events-none">
        <div className="text-center max-w-5xl mx-auto px-6">
          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-6xl xl:text-10xl font-bold text-white mb-10 leading-tight">
            <span className="block">Launch Campaigns</span>
            <span className="block">That Think for</span>
            <span 
              className="block"
              style={{ color: 'rgb(173, 248, 45)' }}
            >
              Themselves
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl lg:text-3xl text-white/80 mb-11 max-w-3xl mx-auto leading-relaxed">
            Harness the power of AI to create, optimize, and scale marketing campaigns 
            that adapt and improve in real-time.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-5">
            <a 
              href="http://localhost:3000/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 rounded-full font-semibold text-black text-lg transition-all duration-200 hover:scale-105 hover:shadow-xl cursor-pointer pointer-events-auto text-center"
              style={{
                backgroundColor: 'rgb(173, 248, 45)',
              }}
            >
              AURA AI
            </a>
            
            <a 
              href="#features"
              className="px-10 py-5 rounded-full font-semibold text-white border border-white/30 backdrop-blur-md bg-white/10 text-lg transition-all duration-200 hover:bg-white/20 hover:scale-105 cursor-pointer pointer-events-auto text-center"
            >
              Watch Demo
            </a>
          </div>
          
          {/* Stats or Trust Indicators */}
          <div className="flex justify-center space-x-12 md:space-x-16 mb-10">
            <div className="text-center">
              <div 
                className="text-3xl md:text-4xl lg:text-5xl font-bold"
                style={{ color: 'rgb(173, 248, 45)' }}
              >
                10K+
              </div>
              <div className="text-white/70 text-base md:text-lg mt-2">Active Campaigns</div>
            </div>
            <div className="text-center">
              <div 
                className="text-3xl md:text-4xl lg:text-5xl font-bold"
                style={{ color: 'rgb(173, 248, 45)' }}
              >
                95%
              </div>
              <div className="text-white/70 text-base md:text-lg mt-2">Performance Boost</div>
            </div>
            <div className="text-center">
              <div 
                className="text-3xl md:text-4xl lg:text-5xl font-bold"
                style={{ color: 'rgb(173, 248, 45)' }}
              >
                24/7
              </div>
              <div className="text-white/70 text-base md:text-lg mt-2">AI Optimization</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <div className="animate-bounce">
          <svg 
            className="w-6 h-6 text-white/70" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </div>
      </div>
    </section>
  );
}