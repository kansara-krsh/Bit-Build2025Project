import { Bot, BarChart3, FlaskConical, Target, TrendingUp, Link2 } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      title: "AI-Powered Optimization",
      description: "Advanced machine learning algorithms continuously optimize your campaigns for maximum performance.",
      icon: Bot,
      color: "rgb(173, 248, 45)"
    },
    {
      title: "Real-Time Analytics",
      description: "Get instant insights into campaign performance with comprehensive real-time dashboards.",
      icon: BarChart3,
      color: "rgb(99, 102, 241)"
    },
    {
      title: "Automated A/B Testing",
      description: "Intelligent testing that automatically finds the best performing variations of your campaigns.",
      icon: FlaskConical,
      color: "rgb(236, 72, 153)"
    },
    {
      title: "Smart Targeting",
      description: "AI-driven audience segmentation that identifies and targets your most valuable customers.",
      icon: Target,
      color: "rgb(251, 146, 60)"
    },
    {
      title: "Predictive Scaling",
      description: "Forecast campaign performance and scale budgets automatically based on AI predictions.",
      icon: TrendingUp,
      color: "rgb(34, 197, 94)"
    },
    {
      title: "Cross-Platform Integration",
      description: "Seamlessly manage campaigns across all major advertising platforms from one dashboard.",
      icon: Link2,
      color: "rgb(59, 130, 246)"
    }
  ];

  return (
    <section id="features" className="py-20 bg-[#070A13]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Intelligent Features for 
            <span style={{ color: 'rgb(173, 248, 45)' }}> Smart Campaigns</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Our AI-powered platform provides everything you need to create, manage, 
            and optimize high-performing marketing campaigns.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="group p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden"
              >
                {/* Hover Glow Effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                  style={{
                    background: `radial-gradient(circle at center, ${feature.color}20, transparent)`
                  }}
                />
                
                {/* Icon Container */}
                <div 
                  className="relative mb-6 p-4 rounded-xl inline-flex transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: `${feature.color}20`
                  }}
                >
                  <Icon size={32} style={{ color: feature.color }} />
                </div>
                
                <h3 className="relative text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="relative text-white/70 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}