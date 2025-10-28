import React from 'react';
import { Target, FileText, Palette, Search, BarChart3, Users, Twitter } from 'lucide-react';

const agentTypes = [
  {
    type: 'strategy',
    label: 'Strategy Agent',
    icon: Target,
    color: 'green',
    description: 'Defines campaign strategy and goals',
  },
  {
    type: 'copywriting',
    label: 'Copywriting Agent',
    icon: FileText,
    color: 'blue',
    description: 'Generates marketing copy and captions',
  },
  {
    type: 'visual',
    label: 'Visual Design Agent',
    icon: Palette,
    color: 'orange',
    description: 'Creates images and visual assets',
  },
  {
    type: 'research',
    label: 'Market Research Agent',
    icon: Search,
    color: 'purple',
    description: 'Researches trends and competitors',
  },
  {
    type: 'media',
    label: 'Media Planner Agent',
    icon: BarChart3,
    color: 'pink',
    description: 'Plans posting schedule and channels',
  },
  {
    type: 'influencer',
    label: 'Influencer Search Agent',
    icon: Users,
    color: 'teal',
    description: 'Finds influencers for collaboration',
  },
  {
    type: 'twitter',
    label: 'Twitter Agent',
    icon: Twitter,
    color: 'twitter',
    description: 'Posts tweets with images to Twitter',
  },
];

const colorClasses = {
  green: 'border-[rgb(173,248,45)] bg-[rgba(173,248,45,0.1)] hover:bg-[rgba(173,248,45,0.2)] text-white',
  blue: 'border-blue-400 bg-blue-400/10 hover:bg-blue-400/20 text-white',
  orange: 'border-orange-400 bg-orange-400/10 hover:bg-orange-400/20 text-white',
  purple: 'border-purple-400 bg-purple-400/10 hover:bg-purple-400/20 text-white',
  pink: 'border-pink-400 bg-pink-400/10 hover:bg-pink-400/20 text-white',
  teal: 'border-teal-400 bg-teal-400/10 hover:bg-teal-400/20 text-white',
  twitter: 'border-[#1DA1F2] bg-[rgba(29,161,242,0.1)] hover:bg-[rgba(29,161,242,0.2)] text-white',
};

function Sidebar() {
  const onDragStart = (event, agentType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(agentType));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 bg-white/5 backdrop-blur-md text-white p-4 border-r border-white/10 overflow-y-auto custom-scrollbar">
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2 text-white">Agent Blocks</h2>
        <p className="text-xs text-white/60">
          Drag and drop agents onto the canvas to build your workflow
        </p>
      </div>

      <div className="space-y-3">
        {agentTypes.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.type}
              draggable
              onDragStart={(e) => onDragStart(e, agent)}
              className={`
                border-2 rounded-xl p-3 cursor-move transition-all backdrop-blur-sm
                ${colorClasses[agent.color]}
                hover:shadow-xl transform hover:scale-105
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">
                    {agent.label}
                  </h3>
                  <p className="text-xs opacity-80">
                    {agent.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
        <h3 className="text-sm font-semibold mb-2 text-white">💡 Tips</h3>
        <ul className="text-xs text-white/70 space-y-2">
          <li>• Connect nodes by dragging from one handle to another</li>
          <li>• Click "Run Agent" to execute individual nodes</li>
          <li>• Use "Run Workflow" to execute all connected nodes</li>
          <li>• Save your workflow to localStorage</li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;

