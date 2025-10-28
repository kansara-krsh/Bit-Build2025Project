export default function AboutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 pt-24 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 shadow-2xl max-w-4xl mx-auto border border-white/20">
        <h1 className="text-5xl font-bold text-white mb-8">About Us</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Our Mission</h2>
            <p className="text-white/80 leading-relaxed mb-6">
              We create immersive digital experiences that blend cutting-edge technology 
              with stunning visual design. This page demonstrates how the Spline background 
              works across different routes in your application.
            </p>
            <h2 className="text-2xl font-semibold text-white mb-4">Features</h2>
            <ul className="text-white/80 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Full-page 3D background
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Hidden watermark
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Responsive design
              </li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-white/70">Performance</span>
                <span className="text-white font-bold">Optimized</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Loading</span>
                <span className="text-white font-bold">Lazy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Compatibility</span>
                <span className="text-white font-bold">Modern Browsers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}