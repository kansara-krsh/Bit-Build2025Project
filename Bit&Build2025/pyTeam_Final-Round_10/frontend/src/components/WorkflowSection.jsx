import WorkflowDiagram3D from './WorkflowDiagram3D';
import { ArrowRight } from 'lucide-react';

export default function WorkflowSection() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-[#070A13] via-[#0A0E1A] to-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgb(173, 248, 45), transparent)' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgb(99, 102, 241), transparent)' }}
        />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <span 
              className="px-4 py-2 rounded-full text-sm font-semibold bg-white/5 border border-white/10 backdrop-blur-sm"
              style={{ color: 'rgb(173, 248, 45)' }}
            >
              How It Works
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            From Idea to
            <span style={{ color: 'rgb(173, 248, 45)' }}> Impact</span>
          </h2>
          
          <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Experience the seamless journey of AI-powered campaign creation. 
            Watch your ideas transform into high-performing campaigns in minutes.
          </p>
        </div>

        {/* 3D Workflow Diagram */}
        <div className="mb-16 min-h-[500px] flex items-center justify-center">
          <WorkflowDiagram3D />
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div 
              className="text-4xl font-bold mb-2"
              style={{ color: 'rgb(173, 248, 45)' }}
            >
              10x
            </div>
            <div className="text-white font-semibold mb-2">Faster Setup</div>
            <div className="text-white/60 text-sm">
              Launch campaigns in minutes instead of weeks
            </div>
          </div>

          <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div 
              className="text-4xl font-bold mb-2"
              style={{ color: 'rgb(173, 248, 45)' }}
            >
              85%
            </div>
            <div className="text-white font-semibold mb-2">Cost Reduction</div>
            <div className="text-white/60 text-sm">
              Reduce campaign management costs significantly
            </div>
          </div>

          <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div 
              className="text-4xl font-bold mb-2"
              style={{ color: 'rgb(173, 248, 45)' }}
            >
              3x
            </div>
            <div className="text-white font-semibold mb-2">Better ROI</div>
            <div className="text-white/60 text-sm">
              AI optimization delivers superior returns
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a 
            href="/campaign"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full font-semibold text-black text-lg transition-all duration-200 hover:scale-105 hover:shadow-xl group"
            style={{
              backgroundColor: 'rgb(173, 248, 45)',
            }}
          >
            Start Building Your Campaign
            <ArrowRight 
              size={20} 
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </a>
        </div>
      </div>

      {/* Bottom Fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, black)'
        }}
      />
    </section>
  );
}
