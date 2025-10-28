import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import WorkflowSection from '../components/WorkflowSection';
import BackgroundSpline from '../components/BackgroundSpline';

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      {/* 3D Background - Only on Home Page */}
      <BackgroundSpline />
      
      {/* Hero Section with Spline Background */}
      <HeroSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* 3D Workflow Section */}
      <WorkflowSection />
      
      {/* Additional Content Section */}
      <section className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-3xl mx-auto">
            Join thousands of businesses already using AI to supercharge their marketing campaigns 
            and achieve unprecedented growth.
          </p>
          <a 
            href="/campaign"
            className="inline-block px-12 py-4 rounded-full font-semibold text-black text-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
            style={{
              backgroundColor: 'rgb(173, 248, 45)',
            }}
          >
            Start Your Free Trial Today
          </a>
        </div>
      </section>
    </div>
  );
}