import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Play, Loader2, CheckCircle, XCircle, Trash2, RotateCw, Maximize2 } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import { formatAgentOutput, markdownToHtml } from '../../utils/formatOutput';
import { agentAPI } from '../../api/agentAPI';
import AgentDetailsModal from './AgentDetailsModal';

const agentStyles = {
  strategy: {
    border: 'border-[rgb(173,248,45)]',
    bg: 'bg-gradient-to-br from-[rgba(173,248,45,0.15)] to-[rgba(173,248,45,0.05)]',
    icon: '🎯',
    glow: 'shadow-[0_0_20px_rgba(173,248,45,0.5)]',
  },
  copywriting: {
    border: 'border-blue-400',
    bg: 'bg-gradient-to-br from-blue-400/15 to-blue-400/5',
    icon: '✍️',
    glow: 'shadow-[0_0_20px_rgba(96,165,250,0.5)]',
  },
  visual: {
    border: 'border-orange-400',
    bg: 'bg-gradient-to-br from-orange-400/15 to-orange-400/5',
    icon: '🎨',
    glow: 'shadow-[0_0_20px_rgba(251,146,60,0.5)]',
  },
  research: {
    border: 'border-purple-400',
    bg: 'bg-gradient-to-br from-purple-400/15 to-purple-400/5',
    icon: '🔍',
    glow: 'shadow-[0_0_20px_rgba(167,139,250,0.5)]',
  },
  media: {
    border: 'border-pink-400',
    bg: 'bg-gradient-to-br from-pink-400/15 to-pink-400/5',
    icon: '📊',
    glow: 'shadow-[0_0_20px_rgba(244,114,182,0.5)]',
  },
  influencer: {
    border: 'border-teal-400',
    bg: 'bg-gradient-to-br from-teal-400/15 to-teal-400/5',
    icon: '👥',
    glow: 'shadow-[0_0_20px_rgba(45,212,191,0.5)]',
  },
  twitter: {
    border: 'border-[#1DA1F2]',
    bg: 'bg-gradient-to-br from-[rgba(29,161,242,0.15)] to-[rgba(29,161,242,0.05)]',
    icon: '🐦',
    glow: 'shadow-[0_0_20px_rgba(29,161,242,0.5)]',
  },
};

function AgentNode({ data, id }) {
  const { updateNode, removeNode } = useWorkflowStore();
  const style = agentStyles[data.agentType] || agentStyles.strategy;
  const [showModal, setShowModal] = useState(false);

  const handleRun = async () => {
    updateNode(id, { status: 'running', output: '⏳ Processing...' });
    
    try {
      // Call the agent API directly using agentType
      if (data.agentType) {
        const result = await agentAPI.runAgent(data.agentType, data.input || '');
        updateNode(id, { 
          status: 'success', 
          output: result,
          lastRun: new Date().toISOString()
        });
      } else {
        throw new Error('Agent type not found');
      }
    } catch (error) {
      updateNode(id, { 
        status: 'error', 
        output: `Error: ${error.message}` 
      });
    }
  };

  const handleRegenerate = async () => {
    // Clear previous output and run again
    updateNode(id, { output: null, status: 'idle' });
    await new Promise(resolve => setTimeout(resolve, 100));
    handleRun();
  };

  const handleDelete = () => {
    removeNode(id);
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`
        relative rounded-xl border-2 ${style.border} ${style.bg} backdrop-blur-md
        shadow-lg ${data.status === 'running' ? 'shadow-xl ' + style.glow : ''}
        transition-all duration-300 hover:scale-105
        min-w-[280px] max-w-[350px]
      `}
      onDoubleClick={() => setShowModal(true)}
      title="Double-click to view details"
    >
      {/* Input Handle */}
      {data.agentType !== 'strategy' && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 border-2 border-white"
          style={{ backgroundColor: 'rgb(173, 248, 45)' }}
        />
      )}

      {/* Node Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{style.icon}</span>
            <h3 className="font-bold text-white text-sm">
              {data.label}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <button
              onClick={handleDelete}
              className="text-white/60 hover:text-red-400 transition-colors p-1 rounded hover:bg-white/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Input Area */}
        {data.showInput && (
          <div className="mb-3">
            <textarea
              className="w-full px-3 py-2 text-xs border border-white/20 rounded-lg focus:ring-2 focus:ring-[rgb(173,248,45)] focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-white/50 resize-none custom-scrollbar"
              placeholder={`Enter ${data.label.toLowerCase()} instructions...`}
              rows={2}
              value={data.input || ''}
              onChange={(e) => updateNode(id, { input: e.target.value })}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={data.status === 'running'}
            className={`
              flex-1 py-2 px-4 rounded-lg font-semibold text-sm
              flex items-center justify-center gap-2 transition-all hover:scale-105
              ${data.status === 'running' 
                ? 'bg-gray-600 text-white cursor-not-allowed' 
                : 'text-black shadow-md hover:shadow-lg'
              }
            `}
            style={{
              backgroundColor: data.status === 'running' ? undefined : 'rgb(173, 248, 45)',
            }}
          >
            {data.status === 'running' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run
              </>
            )}
          </button>

          {/* Regenerate Button - only show if there's output */}
          {data.output && data.status !== 'running' && (
            <button
              onClick={handleRegenerate}
              className="px-3 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-105"
              title="Regenerate output"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Output Area */}
        {data.output && (
          <div className="mt-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-white mb-1">Output:</div>
              <button
                onClick={() => setShowModal(true)}
                className="text-white/60 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                title="View full details"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Special rendering for visual agent with images */}
            {data.agentType === 'visual' && data.output.type === 'visual_with_images' ? (
              <div>
                {/* Image Gallery */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {data.output.images?.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        img.selected
                          ? 'border-[rgb(173,248,45)] shadow-lg'
                          : 'border-white/30 hover:border-[rgb(173,248,45)]'
                      }`}
                      onClick={() => {
                        // Update selected image
                        const updatedOutput = {
                          ...data.output,
                          images: data.output.images.map((image, i) => ({
                            ...image,
                            selected: i === idx,
                          })),
                          selected_image: data.output.images[idx],
                        };
                        updateNode(id, { output: updatedOutput });
                      }}
                    >
                      <img
                        src={img.url}
                        alt={`Generated ${idx + 1}`}
                        className="w-full h-20 object-cover"
                      />
                      {img.selected && (
                        <div className="absolute top-1 right-1 rounded-full p-1" style={{ backgroundColor: 'rgb(173, 248, 45)' }}>
                          <CheckCircle className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Style and Color Details - Always show if available */}
                {(data.output.style || data.output.color_palette) && (
                  <div className="text-xs text-white space-y-1">
                    {data.output.style && (
                      <div><strong className="text-white">Style:</strong> <span className="text-white/90">{data.output.style}</span></div>
                    )}
                    {data.output.color_palette && data.output.color_palette.length > 0 && (
                      <div><strong className="text-white">Colors:</strong> <span className="text-white/90">{data.output.color_palette.join(', ')}</span></div>
                    )}
                  </div>
                )}
              </div>
            ) : data.agentType === 'influencer' && data.output?.influencers && Array.isArray(data.output.influencers) ? (
              /* Special compact preview for influencer results */
              <div className="space-y-2">
                <div className="text-xs text-white font-semibold mb-2">
                  Found {data.output.influencers.length} influencers
                </div>
                {data.output.influencers.slice(0, 2).map((inf, idx) => (
                  <div key={idx} className="p-2 bg-white/5 rounded-lg border border-white/20">
                    <div className="text-xs text-white font-semibold">{inf.name || inf.handle}</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded text-white">
                        {inf.platform}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded text-white">
                        {inf.followers}
                      </span>
                    </div>
                  </div>
                ))}
                {data.output.influencers.length > 2 && (
                  <div className="text-[10px] text-white/60 text-center">
                    +{data.output.influencers.length - 2} more
                  </div>
                )}
              </div>
            ) : data.agentType === 'twitter' && data.output.type === 'twitter_post' ? (
              /* Special rendering for Twitter posts */
              <div className="space-y-2">
                <div className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {data.output.message || 'Posted to Twitter!'}
                </div>
                {data.output.tweet_text && (
                  <div className="p-2 bg-gray-800/50 rounded border border-blue-500/20">
                    <p className="text-xs text-gray-300 italic">"{data.output.tweet_text}"</p>
                  </div>
                )}
                {data.output.tweet_url && (
                  <a 
                    href={data.output.tweet_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline block"
                  >
                    View Tweet →
                  </a>
                )}
                <div className="text-xs text-white/60">
                  Tweet ID: {data.output.tweet_id}
                </div>
              </div>
            ) : data.agentType === 'media' && data.output?.plan_id ? (
              /* Special compact preview for media planner results */
              <div className="space-y-2">
                <div className="text-xs text-white font-semibold mb-2 flex items-center gap-2">
                  <span>📊 Media Plan</span>
                  {data.output.success && <CheckCircle className="w-3 h-3 text-green-400" />}
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {data.output.summary?.total_platforms && (
                    <div className="p-2 bg-white/5 rounded-lg border border-white/20">
                      <div className="text-[10px] text-white/60 mb-1">Platforms</div>
                      <div className="text-sm font-bold text-white">{data.output.summary.total_platforms}</div>
                    </div>
                  )}
                  {data.output.summary?.total_scheduled_posts && (
                    <div className="p-2 bg-white/5 rounded-lg border border-white/20">
                      <div className="text-[10px] text-white/60 mb-1">Posts</div>
                      <div className="text-sm font-bold text-white">{data.output.summary.total_scheduled_posts}</div>
                    </div>
                  )}
                </div>

                {/* Top Platforms Preview */}
                {data.output.platform_analysis?.recommended_platforms && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-white/60 font-semibold">Top Platforms:</div>
                    {data.output.platform_analysis.recommended_platforms.slice(0, 3).map((platform, idx) => (
                      <div key={idx} className="flex items-center justify-between p-1.5 bg-white/5 rounded border border-white/20">
                        <span className="text-xs text-white capitalize">{platform.platform}</span>
                        <span className="text-xs font-bold text-pink-400">{platform.audience_match_score}%</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-white/50 text-center pt-1 border-t border-white/10">
                  Plan ID: {data.output.plan_id}
                </div>
              </div>
            ) : (
              /* Regular markdown output for other agents */
              <div 
                className="text-xs max-h-32 overflow-y-auto custom-scrollbar
                  prose prose-invert prose-xs max-w-none
                  prose-headings:text-white prose-headings:font-bold prose-headings:text-sm
                  prose-p:text-white prose-p:leading-relaxed prose-p:my-1
                  prose-strong:text-white prose-strong:font-semibold
                  prose-ul:text-white prose-ol:text-white prose-ul:my-1 prose-ol:my-1
                  prose-li:text-white prose-li:my-0.5
                  prose-em:text-white
                  [&>*]:text-white [&_*]:text-white"
                style={{ color: 'white' }}
                dangerouslySetInnerHTML={{ 
                  __html: markdownToHtml(formatAgentOutput(data.output, data.agentType))
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-white"
        style={{ backgroundColor: 'rgb(173, 248, 45)' }}
      />

      {/* Modal */}
      {showModal && (
        <AgentDetailsModal 
          data={data} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}

export default memo(AgentNode);

