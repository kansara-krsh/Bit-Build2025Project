import React from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Zap, FileText, ArrowRight, ExternalLink, Users, TrendingUp, MessageSquare, BarChart3 } from 'lucide-react';
import { formatAgentOutput, markdownToHtml } from '../../utils/formatOutput';

const agentStyles = {
  strategy: {
    color: 'rgb(173,248,45)',
    icon: '🎯',
    name: 'Strategy Agent',
  },
  copywriting: {
    color: 'rgb(96,165,250)',
    icon: '✍️',
    name: 'Copywriting Agent',
  },
  visual: {
    color: 'rgb(251,146,60)',
    icon: '🎨',
    name: 'Visual Agent',
  },
  research: {
    color: 'rgb(167,139,250)',
    icon: '🔍',
    name: 'Research Agent',
  },
  media: {
    color: 'rgb(244,114,182)',
    icon: '📊',
    name: 'Media Planning Agent',
  },
  influencer: {
    color: 'rgb(45,212,191)',
    icon: '👥',
    name: 'Influencer Search Agent',
  },
};

function AgentDetailsModal({ data, onClose }) {
  if (!data) return null;

  const style = agentStyles[data.agentType] || agentStyles.strategy;

  // Debug logging for influencer agent
  if (data.agentType === 'influencer') {
    console.log('Influencer Agent Data:', {
      agentType: data.agentType,
      output: data.output,
      hasInfluencers: data.output?.influencers ? 'YES' : 'NO',
      influencersCount: data.output?.influencers?.length,
      outputKeys: data.output ? Object.keys(data.output) : []
    });
  }

  // Debug logging for media agent
  if (data.agentType === 'media') {
    console.log('Media Agent Data:', {
      agentType: data.agentType,
      output: data.output,
      hasPlanId: data.output?.plan_id ? 'YES' : 'NO',
      outputKeys: data.output ? Object.keys(data.output) : [],
      fullOutput: data.output
    });
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border-2 w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderColor: style.color }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="px-10 py-7 border-b border-white/20 flex items-center justify-between shrink-0"
          style={{ 
            background: `linear-gradient(135deg, ${style.color}20 0%, transparent 100%)` 
          }}
        >
          <div className="flex items-center gap-5">
            <span className="text-5xl">{style.icon}</span>
            <div>
              <h2 className="text-3xl font-bold text-white">{data.label}</h2>
              <p className="text-base text-white/70 mt-1">{style.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(173, 248, 45) rgba(255,255,255,0.1)'
          }}
        >
          {/* Status and Metadata */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-2 text-white/70 text-base mb-3">
                <Zap className="w-5 h-5" />
                Status
              </div>
              <div className="text-white font-bold text-xl capitalize">
                {data.status || 'Idle'}
              </div>
            </div>

            {data.lastRun && (
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-2 text-white/70 text-base mb-3">
                  <Clock className="w-5 h-5" />
                  Last Run
                </div>
                <div className="text-white font-bold text-base">
                  {new Date(data.lastRun).toLocaleString()}
                </div>
              </div>
            )}

            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-2 text-white/70 text-base mb-3">
                <FileText className="w-5 h-5" />
                Agent Type
              </div>
              <div className="text-white font-bold text-xl capitalize">
                {data.agentType}
              </div>
            </div>
          </div>

          {/* Input Section */}
          {data.input && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <ArrowRight className="w-7 h-7" style={{ color: style.color }} />
                <h3 className="text-2xl font-bold text-white">Input Prompt</h3>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <pre className="text-white whitespace-pre-wrap font-mono text-lg leading-relaxed">
                  {data.input}
                </pre>
              </div>
            </div>
          )}

          {/* Output Section */}
          {data.output && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <ArrowRight className="w-7 h-7" style={{ color: style.color }} />
                <h3 className="text-2xl font-bold text-white">Output</h3>
              </div>
              
              {/* Special rendering for visual agent with images */}
              {data.agentType === 'visual' && data.output.type === 'visual_with_images' ? (
                <div className="space-y-6">
                  {/* Image Gallery */}
                  <div className="grid grid-cols-3 gap-6">
                    {data.output.images?.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                          img.selected
                            ? 'shadow-2xl'
                            : 'border-white/30'
                        }`}
                        style={{
                          borderColor: img.selected ? style.color : undefined
                        }}
                      >
                        <img
                          src={img.url}
                          alt={`Generated ${idx + 1}`}
                          className="w-full h-64 object-cover"
                        />
                        {img.selected && (
                          <div 
                            className="absolute top-4 right-4 rounded-full p-2.5 shadow-lg"
                            style={{ backgroundColor: style.color }}
                          >
                            <span className="text-black text-base font-bold">✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Details */}
                  <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                    <div className="grid grid-cols-2 gap-8 text-lg">
                      {data.output.style && (
                        <div>
                          <span className="text-white/70 font-medium">Style:</span>
                          <span className="text-white ml-3 font-semibold">{data.output.style}</span>
                        </div>
                      )}
                      {data.output.color_palette && data.output.color_palette.length > 0 && (
                        <div>
                          <span className="text-white/70 font-medium">Color Palette:</span>
                          <div className="flex gap-3 mt-3 flex-wrap">
                            {data.output.color_palette.map((color, idx) => (
                              <div
                                key={idx}
                                className="px-5 py-2.5 rounded-full text-base font-medium"
                                style={{
                                  backgroundColor: `${style.color}20`,
                                  color: style.color,
                                  border: `1px solid ${style.color}50`
                                }}
                              >
                                {color}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {!data.output.style && !data.output.color_palette && (
                        <div className="col-span-2 text-white/50 text-center py-4">
                          Style and color information not available for this generation
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular markdown output for other agents */
                <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
                  {/* Check if this is influencer data with special rendering */}
                  {data.agentType === 'influencer' && 
                   data.output?.influencers && Array.isArray(data.output.influencers) ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                          <Users className="w-7 h-7" style={{ color: style.color }} />
                          Found {data.output.influencers.length} Influencers
                        </h3>
                        {data.output.search_method && (
                          <span className="px-4 py-2 rounded-full text-sm" style={{ 
                            backgroundColor: `${style.color}20`, 
                            color: style.color 
                          }}>
                            {data.output.search_method}
                          </span>
                        )}
                      </div>

                      {/* Influencer Cards Grid */}
                      <div className="grid grid-cols-1 gap-5">
                        {data.output.influencers.map((influencer, idx) => (
                          <div 
                            key={idx}
                            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:border-white/40 transition-all hover:scale-[1.02] hover:shadow-xl"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-white mb-2">
                                  {influencer.name || influencer.handle}
                                </h4>
                                <div className="flex flex-wrap gap-3 mb-3">
                                  <span className="px-3 py-1 rounded-full text-sm bg-white/10 text-white">
                                    📱 {influencer.platform}
                                  </span>
                                  {influencer.niche && (
                                    <span className="px-3 py-1 rounded-full text-sm bg-white/10 text-white">
                                      🎯 {influencer.niche}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {influencer.collaboration_potential && (
                                <div className="text-right">
                                  <div className="text-xs text-white/60 mb-1">Potential</div>
                                  <div 
                                    className="px-4 py-2 rounded-lg font-bold text-sm"
                                    style={{
                                      backgroundColor: influencer.collaboration_potential === 'High' 
                                        ? 'rgb(34,197,94,0.2)' 
                                        : influencer.collaboration_potential === 'Medium'
                                        ? 'rgb(234,179,8,0.2)'
                                        : 'rgb(239,68,68,0.2)',
                                      color: influencer.collaboration_potential === 'High'
                                        ? 'rgb(34,197,94)'
                                        : influencer.collaboration_potential === 'Medium'
                                        ? 'rgb(234,179,8)'
                                        : 'rgb(239,68,68)'
                                    }}
                                  >
                                    {influencer.collaboration_potential}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              {influencer.followers && (
                                <div className="flex items-center gap-2 text-white">
                                  <Users className="w-4 h-4 text-white/60" />
                                  <span className="text-sm text-white/60">Followers:</span>
                                  <span className="font-semibold">{influencer.followers}</span>
                                </div>
                              )}
                              {influencer.engagement_rate && (
                                <div className="flex items-center gap-2 text-white">
                                  <TrendingUp className="w-4 h-4 text-white/60" />
                                  <span className="text-sm text-white/60">Engagement:</span>
                                  <span className="font-semibold">{influencer.engagement_rate}</span>
                                </div>
                              )}
                            </div>

                            {influencer.fit_reason && (
                              <div className="mb-4 p-4 bg-white/5 rounded-xl">
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="w-4 h-4 mt-1" style={{ color: style.color }} />
                                  <div>
                                    <div className="text-xs text-white/60 mb-1">Why they're a good fit:</div>
                                    <p className="text-sm text-white leading-relaxed">{influencer.fit_reason}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {influencer.content_style && (
                              <div className="mb-4">
                                <span className="text-xs text-white/60">Content Style: </span>
                                <span className="text-sm text-white">{influencer.content_style}</span>
                              </div>
                            )}

                            {influencer.profile_url && (
                              <a
                                href={influencer.profile_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                                style={{
                                  backgroundColor: style.color,
                                  color: 'black'
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Profile
                              </a>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Recommendations Section */}
                      {data.output.recommendations && (
                        <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/20">
                          <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            💼 Collaboration Tips
                          </h4>
                          <p className="text-white/90 leading-relaxed">{data.output.recommendations}</p>
                        </div>
                      )}
                    </div>
                  ) : data.agentType === 'media' ? (
                    /* Special rendering for Media Planner Agent */
                    data.output?.plan_id ? (
                      <div className="space-y-6">
                        {/* Header with Plan ID */}
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-1">
                              <BarChart3 className="w-7 h-7" style={{ color: style.color }} />
                              Media Plan Overview
                            </h3>
                            <p className="text-white/50 text-xs">Plan ID: {data.output.plan_id}</p>
                          </div>
                          {data.output.success && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 text-sm font-semibold">Success</span>
                            </div>
                          )}
                        </div>

                        {/* Summary Cards - Enhanced */}
                        {data.output.summary && (
                          <div className="grid grid-cols-4 gap-3">
                            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-white/20 hover:border-white/30 transition-all">
                              <div className="text-white/60 text-xs mb-2 font-medium">📅 Scheduled Posts</div>
                              <div className="text-2xl font-bold text-white mb-0.5">
                                {data.output.summary.total_scheduled_posts || 0}
                              </div>
                              <div className="text-white/40 text-[10px]">posts planned</div>
                            </div>
                            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-white/20 hover:border-white/30 transition-all">
                              <div className="text-white/60 text-xs mb-2 font-medium">🎯 Platforms</div>
                              <div className="text-2xl font-bold text-white mb-0.5">
                                {data.output.summary.total_platforms || 0}
                              </div>
                              <div className="text-white/40 text-[10px]">channels active</div>
                            </div>
                            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-white/20 hover:border-white/30 transition-all">
                              <div className="text-white/60 text-xs mb-2 font-medium">👥 Influencers</div>
                              <div className="text-2xl font-bold text-white mb-0.5">
                                {data.output.summary.influencer_collaborations || 0}
                              </div>
                              <div className="text-white/40 text-[10px]">collaborations</div>
                            </div>
                            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-white/20 hover:border-white/30 transition-all">
                              <div className="text-white/60 text-xs mb-2 font-medium">🎨 Content Types</div>
                              <div className="text-2xl font-bold text-white mb-0.5">
                                {data.output.summary.content_types || 12}
                              </div>
                              <div className="text-white/40 text-[10px]">format variations</div>
                            </div>
                          </div>
                        )}

                        {/* Platform Analysis - Enhanced with Icons */}
                        {data.output.platform_analysis?.recommended_platforms && (
                          <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-5 border border-white/20">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ 
                                backgroundColor: `${style.color}20`,
                                border: `1px solid ${style.color}40`
                              }}>
                                <span className="text-lg">🎯</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-white">Platform Strategy</h4>
                                <p className="text-white/50 text-xs">Top recommended channels</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              {data.output.platform_analysis.recommended_platforms.map((platform, idx) => {
                                const platformEmojis = {
                                  instagram: '📸',
                                  facebook: '👥',
                                  twitter: '🐦',
                                  linkedin: '💼',
                                  youtube: '🎥',
                                  tiktok: '🎵'
                                };
                                return (
                                  <div 
                                    key={idx}
                                    className="bg-white/5 rounded-lg p-3 border border-white/20 hover:border-white/30 transition-all"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl">{platformEmojis[platform.platform] || '📱'}</span>
                                        <div>
                                          <span className="text-white font-bold capitalize text-sm">
                                            {platform.platform}
                                          </span>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                              platform.priority === 'high' 
                                                ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                                                : platform.priority === 'medium'
                                                ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                                                : 'bg-gray-500/30 text-gray-300 border border-gray-500/50'
                                            }`}>
                                              {platform.priority} Priority
                                            </span>
                                            {platform.penetration_rate && (
                                              <span className="text-white/50 text-[10px]">
                                                {platform.penetration_rate}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-[10px] text-white/50 mb-1">Match</div>
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full rounded-full transition-all duration-500"
                                              style={{
                                                width: `${platform.audience_match_score}%`,
                                                backgroundColor: style.color
                                              }}
                                            />
                                          </div>
                                          <span className="text-sm font-bold" style={{ color: style.color }}>
                                            {platform.audience_match_score}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-white/70 text-xs leading-relaxed">{platform.reasoning}</p>
                                    {platform.audience_demographics && (
                                      <div className="mt-2 pt-2 border-t border-white/10 text-white/50 text-[10px]">
                                        👤 {platform.audience_demographics}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Posting Schedule - Enhanced Calendar View */}
                        {data.output.posting_schedule && data.output.posting_schedule.length > 0 && (
                          <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-5 border border-white/20">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ 
                                backgroundColor: `${style.color}20`,
                                border: `1px solid ${style.color}40`
                              }}>
                                <span className="text-lg">📅</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-white">Content Calendar</h4>
                                <p className="text-white/50 text-xs">Optimized posting schedule (first 7 posts)</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {data.output.posting_schedule.slice(0, 7).map((post, idx) => {
                                const platformColors = {
                                  instagram: 'from-pink-500/20 to-purple-500/20 border-pink-500/30',
                                  facebook: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
                                  twitter: 'from-sky-500/20 to-blue-500/20 border-sky-500/30',
                                  linkedin: 'from-blue-600/20 to-blue-700/20 border-blue-600/30',
                                  youtube: 'from-red-500/20 to-red-600/20 border-red-500/30',
                                  tiktok: 'from-cyan-500/20 to-pink-500/20 border-cyan-500/30'
                                };
                                return (
                                  <div 
                                    key={idx}
                                    className={`bg-gradient-to-r ${platformColors[post.platform] || 'from-white/10 to-white/5 border-white/20'} rounded-xl p-4 border hover:scale-[1.02] transition-all`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-5">
                                        <div className="text-center bg-white/10 rounded-lg p-3 min-w-[80px]">
                                          <div className="text-white font-bold text-lg">{post.date}</div>
                                          <div className="text-white/70 text-xs font-medium mt-1">{post.day}</div>
                                        </div>
                                        <div className="h-12 w-px bg-white/20"></div>
                                        <div>
                                          <div className="text-white font-bold capitalize text-lg flex items-center gap-2">
                                            <span className="text-xl">
                                              {post.platform === 'instagram' ? '📸' : 
                                               post.platform === 'facebook' ? '👥' :
                                               post.platform === 'twitter' ? '🐦' :
                                               post.platform === 'linkedin' ? '💼' :
                                               post.platform === 'youtube' ? '🎥' :
                                               post.platform === 'tiktok' ? '🎵' : '📱'}
                                            </span>
                                            {post.platform}
                                          </div>
                                          <div className="text-white/70 text-sm mt-1 flex items-center gap-2">
                                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                                              {post.content_type}
                                            </span>
                                            {post.post_format && (
                                              <span className="text-white/50 text-xs">• {post.post_format}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-white/60 text-xs mb-1">⏰ Best Time</div>
                                        <div className="text-white font-bold text-lg">{post.time}</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {data.output.posting_schedule.length > 7 && (
                              <div className="mt-4 text-center text-white/60 text-sm">
                                + {data.output.posting_schedule.length - 7} more posts in complete plan
                              </div>
                            )}
                          </div>
                        )}

                        {/* Budget Allocation - Enhanced with Better Visuals */}
                        {data.output.budget_allocation?.platform_allocation && (
                          <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/30">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ 
                                backgroundColor: `${style.color}20`,
                                border: `1px solid ${style.color}40`
                              }}>
                                <span className="text-xl">💰</span>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-white">Budget Distribution</h4>
                                <p className="text-white/60 text-sm">Paid vs Organic mix per platform</p>
                              </div>
                            </div>
                            <div className="space-y-4">
                              {Object.entries(data.output.budget_allocation.platform_allocation).map(([platform, allocation]) => (
                                <div 
                                  key={platform}
                                  className="bg-white/10 rounded-xl p-5 border border-white/20 hover:border-white/40 transition-all"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="text-white font-bold capitalize text-lg flex items-center gap-2">
                                      <span className="text-xl">
                                        {platform === 'instagram' ? '📸' : 
                                         platform === 'facebook' ? '👥' :
                                         platform === 'twitter' ? '🐦' :
                                         platform === 'linkedin' ? '💼' :
                                         platform === 'youtube' ? '🎥' :
                                         platform === 'tiktok' ? '🎵' : '📱'}
                                      </span>
                                      {platform}
                                    </span>
                                    <div className="text-right">
                                      <div className="text-white/60 text-xs mb-1">Daily Budget</div>
                                      <span className="text-white font-bold text-lg" style={{ color: style.color }}>
                                        {allocation.suggested_daily_budget}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-white/70 text-sm font-medium">💳 Paid Advertising</span>
                                        <span className="text-white font-bold">{allocation.paid_percentage}%</span>
                                      </div>
                                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-500"
                                          style={{
                                            width: `${allocation.paid_percentage}%`,
                                            background: `linear-gradient(90deg, ${style.color}, ${style.color}80)`
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-white/70 text-sm font-medium">🌱 Organic Content</span>
                                        <span className="text-white font-bold">{allocation.organic_percentage || (100 - allocation.paid_percentage)}%</span>
                                      </div>
                                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                                          style={{
                                            width: `${allocation.organic_percentage || (100 - allocation.paid_percentage)}%`
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  {allocation.strategy && (
                                    <div className="mt-3 pt-3 border-t border-white/10 text-white/60 text-xs">
                                      💡 {allocation.strategy}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Influencer Recommendations Preview */}
                        {data.output.influencer_recommendations && data.output.influencer_recommendations.length > 0 && (
                          <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/30">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ 
                                backgroundColor: `${style.color}20`,
                                border: `1px solid ${style.color}40`
                              }}>
                                <span className="text-xl">👥</span>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-white">Influencer Collaborations</h4>
                                <p className="text-white/60 text-sm">Recommended partnerships (showing top 3)</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              {data.output.influencer_recommendations.slice(0, 3).map((influencer, idx) => (
                                <div 
                                  key={idx}
                                  className="bg-white/10 rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all text-center"
                                >
                                  <div className="text-3xl mb-2">🌟</div>
                                  <div className="text-white font-bold mb-1">{influencer.tier || 'Micro'} Influencer</div>
                                  <div className="text-white/60 text-sm mb-2">
                                    {influencer.platform ? `${influencer.platform} Creator` : 'Multi-Platform'}
                                  </div>
                                  {influencer.estimated_cost && (
                                    <div className="text-white/80 text-xs bg-white/10 rounded-lg px-3 py-1.5 mt-2">
                                      💰 {influencer.estimated_cost}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* KPIs Preview */}
                        {data.output.kpis && (
                          <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/30">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ 
                                backgroundColor: `${style.color}20`,
                                border: `1px solid ${style.color}40`
                              }}>
                                <span className="text-xl">📊</span>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-white">Success Metrics</h4>
                                <p className="text-white/60 text-sm">Key Performance Indicators</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              {data.output.kpis.awareness_metrics && (
                                <div className="bg-white/5 rounded-xl p-4 border border-white/20">
                                  <div className="text-white/60 text-xs mb-2">🎯 Awareness</div>
                                  <div className="text-white font-bold">{data.output.kpis.awareness_metrics.impressions || 'Track Impressions'}</div>
                                </div>
                              )}
                              {data.output.kpis.engagement_metrics && (
                                <div className="bg-white/5 rounded-xl p-4 border border-white/20">
                                  <div className="text-white/60 text-xs mb-2">💬 Engagement</div>
                                  <div className="text-white font-bold">{data.output.kpis.engagement_metrics.engagement_rate || 'Track Engagement'}</div>
                                </div>
                              )}
                              {data.output.kpis.conversion_metrics && (
                                <div className="bg-white/5 rounded-xl p-4 border border-white/20">
                                  <div className="text-white/60 text-xs mb-2">🎁 Conversion</div>
                                  <div className="text-white font-bold">{data.output.kpis.conversion_metrics.conversions || 'Track Conversions'}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* View Full Plan CTA */}
                        <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-2xl p-6 border-2 border-dashed" style={{ borderColor: `${style.color}40` }}>
                          <div className="text-center">
                            <div className="text-2xl mb-3">📋</div>
                            <p className="text-white font-semibold mb-2">Complete Media Plan Available</p>
                            <p className="text-white/60 text-sm">
                              This is a preview showing key insights. Generate a full campaign to access the complete media plan with detailed recommendations, channel strategies, and execution roadmap.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Fallback for media agent without complete plan */
                      <div>
                        <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                          <p className="text-yellow-200 text-sm">
                            ⚠️ Media plan is being generated. The output structure is not yet complete.
                          </p>
                        </div>
                        <div 
                          className="bg-white/10 rounded-2xl p-6 border border-white/20"
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(formatAgentOutput(data.output)) }}
                        />
                      </div>
                    )
                  ) : data.agentType === 'influencer' ? (
                    /* Fallback for influencer agent if cards don't render */
                    <div>
                      <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                        <p className="text-yellow-200 text-sm">
                          Debug: Influencer data structure doesn't match expected format. 
                          Check console for details.
                        </p>
                      </div>
                      <div 
                        className="prose prose-invert prose-xl max-w-none
                          prose-headings:text-white prose-headings:font-bold prose-headings:mb-4
                          prose-p:text-white prose-p:leading-relaxed prose-p:my-3 prose-p:text-lg
                          prose-strong:text-white prose-strong:font-bold
                          prose-ul:text-white prose-ol:text-white prose-ul:my-3 prose-ol:my-3
                          prose-li:text-white prose-li:my-2 prose-li:text-lg
                          prose-em:text-white
                          [&>*]:text-white [&_*]:text-white"
                        style={{ color: 'white' }}
                      >
                        <pre className="text-xs bg-white/5 p-4 rounded overflow-auto max-h-96">
                          {JSON.stringify(data.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    /* Regular markdown output */
                    <div 
                      className="prose prose-invert prose-xl max-w-none
                        prose-headings:text-white prose-headings:font-bold prose-headings:mb-4
                        prose-p:text-white prose-p:leading-relaxed prose-p:my-3 prose-p:text-lg
                        prose-strong:text-white prose-strong:font-bold
                        prose-ul:text-white prose-ol:text-white prose-ul:my-3 prose-ol:my-3
                        prose-li:text-white prose-li:my-2 prose-li:text-lg
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
          )}

          {/* No output message */}
          {!data.output && (
            <div className="text-center py-16 text-white/60">
              <FileText className="w-20 h-20 mx-auto mb-5 opacity-50" />
              <p className="text-xl">No output yet. Run this agent to see results.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-white/20 bg-white/5 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 px-6 rounded-2xl font-bold text-xl transition-all hover:scale-105 shadow-lg"
            style={{
              backgroundColor: style.color,
              color: 'black'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Render the modal in a portal to escape ReactFlow's container
  return createPortal(modalContent, document.body);
}

export default AgentDetailsModal;
