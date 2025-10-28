import { useState, useEffect } from 'react';
import { Sparkles, Brain, Target, TrendingUp, Zap, CheckCircle } from 'lucide-react';

export default function WorkflowDiagram3D() {
  const [activeStep, setActiveStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const workflowSteps = [
    {
      id: 1,
      title: "Input Brief",
      description: "Describe your campaign goals and target audience",
      icon: Sparkles,
      color: "rgb(173, 248, 45)",
      position: { x: 0, y: 0, z: 0 }
    },
    {
      id: 2,
      title: "AI Analysis",
      description: "Our AI analyzes market trends and competition",
      icon: Brain,
      color: "rgb(99, 102, 241)",
      position: { x: 1, y: 0, z: -1 }
    },
    {
      id: 3,
      title: "Strategy Generation",
      description: "Generate optimized campaign strategies",
      icon: Target,
      color: "rgb(236, 72, 153)",
      position: { x: 2, y: 0, z: 0 }
    },
    {
      id: 4,
      title: "Content Creation",
      description: "AI creates compelling ad copy and visuals",
      icon: Zap,
      color: "rgb(251, 146, 60)",
      position: { x: 3, y: 0, z: -1 }
    },
    {
      id: 5,
      title: "Optimization",
      description: "Real-time performance optimization",
      icon: TrendingUp,
      color: "rgb(34, 197, 94)",
      position: { x: 4, y: 0, z: 0 }
    },
    {
      id: 6,
      title: "Launch & Scale",
      description: "Deploy and automatically scale your campaign",
      icon: CheckCircle,
      color: "rgb(173, 248, 45)",
      position: { x: 5, y: 0, z: -1 }
    }
  ];

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % workflowSteps.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isHovered, workflowSteps.length]);

  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-container">
      <div 
        className="workflow-3d-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transform: isHovered ? 'rotateX(15deg) rotateY(5deg)' : 'rotateX(10deg) rotateY(-5deg)',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s ease-out'
        }}
      >
        {/* Connection Lines */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ 
            transform: 'translateZ(-50px)',
            opacity: 0.3
          }}
        >
          {workflowSteps.slice(0, -1).map((step, index) => (
            <line
              key={`line-${index}`}
              x1={`${(index / (workflowSteps.length - 1)) * 100}%`}
              y1="50%"
              x2={`${((index + 1) / (workflowSteps.length - 1)) * 100}%`}
              y2="50%"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeDasharray={activeStep > index ? "0" : "10,5"}
              className="transition-all duration-500"
            />
          ))}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(173, 248, 45)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Workflow Steps */}
        <div className="relative flex items-center justify-between gap-8 px-8 py-16">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;
            const isPast = activeStep > index;
            
            return (
              <div
                key={step.id}
                className="workflow-step-3d"
                style={{
                  transform: `
                    translateZ(${isActive ? '80px' : step.position.z * 30 + 'px'})
                    scale(${isActive ? 1.15 : 1})
                    rotateY(${step.position.z * 5}deg)
                  `,
                  transformStyle: 'preserve-3d',
                  transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: isActive ? 1 : 0.7
                }}
                onMouseEnter={() => setActiveStep(index)}
              >
                {/* Step Card */}
                <div 
                  className={`
                    relative bg-gradient-to-br from-white/10 to-white/5 
                    backdrop-blur-xl rounded-2xl p-6 border-2 
                    transition-all duration-500 cursor-pointer
                    hover:shadow-2xl group
                    ${isActive ? 'border-opacity-100 shadow-2xl' : 'border-opacity-30'}
                  `}
                  style={{
                    borderColor: isActive ? step.color : 'rgba(255,255,255,0.2)',
                    boxShadow: isActive 
                      ? `0 20px 60px ${step.color}40, 0 0 40px ${step.color}30`
                      : '0 10px 30px rgba(0,0,0,0.3)',
                    minWidth: '200px',
                    minHeight: '220px'
                  }}
                >
                  {/* Glow Effect */}
                  {isActive && (
                    <div 
                      className="absolute inset-0 rounded-2xl animate-pulse"
                      style={{
                        background: `radial-gradient(circle at center, ${step.color}20, transparent)`,
                        filter: 'blur(20px)',
                        transform: 'translateZ(-10px)'
                      }}
                    />
                  )}

                  {/* Step Number */}
                  <div 
                    className="absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg"
                    style={{
                      backgroundColor: step.color,
                      color: '#000',
                      transform: 'translateZ(20px)'
                    }}
                  >
                    {step.id}
                  </div>

                  {/* Icon */}
                  <div 
                    className="mb-4 p-4 rounded-xl inline-flex transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `${step.color}20`,
                      transform: 'translateZ(30px)'
                    }}
                  >
                    <Icon 
                      size={32} 
                      style={{ color: step.color }}
                      className={isActive ? 'animate-pulse' : ''}
                    />
                  </div>

                  {/* Title */}
                  <h3 
                    className="text-lg font-bold text-white mb-2"
                    style={{ transform: 'translateZ(20px)' }}
                  >
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p 
                    className="text-sm text-white/70 leading-relaxed"
                    style={{ transform: 'translateZ(10px)' }}
                  >
                    {step.description}
                  </p>

                  {/* Status Indicator */}
                  {isPast && (
                    <div 
                      className="absolute top-4 right-4"
                      style={{ transform: 'translateZ(25px)' }}
                    >
                      <CheckCircle size={20} style={{ color: step.color }} />
                    </div>
                  )}
                </div>

                {/* Connection Arrow */}
                {index < workflowSteps.length - 1 && (
                  <div 
                    className="absolute top-1/2 -right-8 transform -translate-y-1/2"
                    style={{
                      transform: 'translateZ(40px) translateY(-50%)',
                      transition: 'all 0.5s ease'
                    }}
                  >
                    <div 
                      className="w-8 h-0.5 relative"
                      style={{
                        backgroundColor: isPast ? step.color : 'rgba(255,255,255,0.2)'
                      }}
                    >
                      <div 
                        className="absolute right-0 top-1/2 transform -translate-y-1/2"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: `8px solid ${isPast ? step.color : 'rgba(255,255,255,0.2)'}`,
                          borderTop: '4px solid transparent',
                          borderBottom: '4px solid transparent'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
                opacity: Math.random() * 0.5 + 0.2,
                transform: `translateZ(${Math.random() * 100}px)`
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .perspective-container {
          perspective: 2000px;
          perspective-origin: center center;
        }

        .workflow-3d-container {
          position: relative;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateZ(var(--z, 0));
          }
          50% {
            transform: translateY(-20px) translateZ(var(--z, 0));
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @media (max-width: 1024px) {
          .workflow-3d-container {
            transform: scale(0.8) !important;
          }
        }

        @media (max-width: 768px) {
          .workflow-3d-container {
            transform: scale(0.6) !important;
          }
          
          .workflow-step-3d {
            min-width: 150px !important;
          }
        }
      `}</style>
    </div>
  );
}
