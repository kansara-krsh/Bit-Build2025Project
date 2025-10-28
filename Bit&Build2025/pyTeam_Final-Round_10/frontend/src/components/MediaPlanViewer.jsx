import React, { useState } from 'react';
import {
  Calendar, TrendingUp, Users, DollarSign, Target, BarChart3,
  Clock, Instagram, Youtube, Facebook, Linkedin, Twitter, CheckCircle,
  ArrowRight, Award, Eye, MessageSquare, Share2, Heart, Download
} from 'lucide-react';

function MediaPlanViewer({ mediaPlan }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!mediaPlan) {
    return (
      <div className="text-center py-12 text-white/60">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg">No media plan available</p>
      </div>
    );
  }

  const getPlatformIcon = (platform) => {
    const icons = {
      instagram: <Instagram className="w-5 h-5" />,
      youtube: <Youtube className="w-5 h-5" />,
      facebook: <Facebook className="w-5 h-5" />,
      linkedin: <Linkedin className="w-5 h-5" />,
      twitter: <Twitter className="w-5 h-5" />,
      tiktok: <span className="text-sm font-bold">TT</span>
    };
    return icons[platform?.toLowerCase()] || <Target className="w-5 h-5" />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'rgb(173, 248, 45)',
      medium: 'rgb(251, 191, 36)',
      low: 'rgb(156, 163, 175)'
    };
    return colors[priority] || colors.medium;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Target className="w-4 h-4" /> },
    { id: 'platforms', label: 'Platforms', icon: <Share2 className="w-4 h-4" /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
    { id: 'influencers', label: 'Influencers', icon: <Users className="w-4 h-4" /> },
    { id: 'budget', label: 'Budget', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'kpis', label: 'KPIs', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  return (
    <div
      className="rounded-3xl backdrop-blur-md border shadow-2xl p-6 mb-6"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="p-3 rounded-2xl"
          style={{ backgroundColor: 'rgba(173, 248, 45, 0.2)' }}
        >
          <TrendingUp className="w-7 h-7" style={{ color: 'rgb(173, 248, 45)' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Media Plan</h2>
          <p className="text-white/60 text-sm">
            Comprehensive multi-platform strategy
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              activeTab === tab.id
                ? 'text-black font-semibold'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            style={activeTab === tab.id ? { backgroundColor: 'rgb(173, 248, 45)' } : {}}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div
                className="p-5 rounded-xl border border-white/20"
                style={{ backgroundColor: 'rgba(173, 248, 45, 0.1)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">Total Platforms</span>
                  <Share2 className="w-5 h-5 text-white/50" />
                </div>
                <p className="text-3xl font-bold text-white">
                  {mediaPlan.summary?.total_platforms || 0}
                </p>
              </div>

              <div
                className="p-5 rounded-xl border border-white/20"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">Scheduled Posts</span>
                  <Calendar className="w-5 h-5 text-white/50" />
                </div>
                <p className="text-3xl font-bold text-white">
                  {mediaPlan.summary?.total_scheduled_posts || 0}
                </p>
              </div>

              <div
                className="p-5 rounded-xl border border-white/20"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">Influencers</span>
                  <Users className="w-5 h-5 text-white/50" />
                </div>
                <p className="text-3xl font-bold text-white">
                  {mediaPlan.summary?.influencer_collaborations || 0}
                </p>
              </div>
            </div>

            {/* Primary Platforms */}
            {mediaPlan.summary?.primary_platforms && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Primary Platforms</h3>
                <div className="flex flex-wrap gap-3">
                  {mediaPlan.summary.primary_platforms.map((platform, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                      {getPlatformIcon(platform)}
                      <span className="text-white capitalize">{platform}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Focus Areas */}
            {mediaPlan.summary?.key_focus_areas && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Key Focus Areas</h3>
                <div className="space-y-2">
                  {mediaPlan.summary.key_focus_areas.map((area, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border border-white/10"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                    >
                      <CheckCircle
                        className="w-5 h-5 mt-0.5 flex-shrink-0"
                        style={{ color: 'rgb(173, 248, 45)' }}
                      />
                      <span className="text-white/90">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Platforms Tab */}
        {activeTab === 'platforms' && mediaPlan.platform_analysis && (
          <div className="space-y-4">
            {mediaPlan.platform_analysis.recommended_platforms?.map((platform, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-white/20"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        backgroundColor: `rgba(${
                          platform.priority === 'high' ? '173, 248, 45' :
                          platform.priority === 'medium' ? '251, 191, 36' :
                          '156, 163, 175'
                        }, 0.2)`
                      }}
                    >
                      {getPlatformIcon(platform.platform)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white capitalize">
                        {platform.platform}
                      </h3>
                      <p className="text-sm text-white/60">
                        Priority: <span className="capitalize font-medium">{platform.priority}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {platform.audience_match_score}%
                    </p>
                    <p className="text-xs text-white/60">Match Score</p>
                  </div>
                </div>

                <p className="text-white/80 mb-3">{platform.reasoning}</p>

                {platform.penetration_rate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-white/50" />
                    <span className="text-white/70">
                      Penetration: {platform.penetration_rate}
                    </span>
                  </div>
                )}

                {/* Channel Role */}
                {mediaPlan.channel_roles?.channel_roles?.[platform.platform] && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm font-semibold text-white/90 mb-2">
                      Role: {mediaPlan.channel_roles.channel_roles[platform.platform].primary_role}
                    </p>
                    <p className="text-xs text-white/70">
                      {mediaPlan.channel_roles.channel_roles[platform.platform].content_focus}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && mediaPlan.posting_schedule && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Posting Schedule</h3>
              <span className="text-sm text-white/60">
                {mediaPlan.posting_schedule.length} posts scheduled
              </span>
            </div>

            {mediaPlan.posting_schedule.map((post, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-white/20 hover:border-white/30 transition-all"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: 'rgba(173, 248, 45, 0.2)' }}
                    >
                      {getPlatformIcon(post.platform)}
                    </div>
                    <div>
                      <p className="font-bold text-white">
                        {post.date} • {post.day}
                      </p>
                      <p className="text-sm text-white/70 capitalize">
                        {post.platform} - {post.content_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-white/70 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{post.time}</span>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: 'rgba(251, 191, 36, 0.2)',
                        color: 'rgb(251, 191, 36)'
                      }}
                    >
                      {post.status}
                    </span>
                  </div>
                </div>

                {post.suggested_theme && (
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-white/50" />
                    <span className="text-white/80">Theme: {post.suggested_theme}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Influencers Tab */}
        {activeTab === 'influencers' && mediaPlan.influencer_recommendations && (
          <div className="grid md:grid-cols-2 gap-4">
            {mediaPlan.influencer_recommendations.map((influencer, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-white/20"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{influencer.name}</h3>
                    <p className="text-sm text-white/70">{influencer.handle}</p>
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: influencer.outreach_priority === 'high'
                        ? 'rgba(173, 248, 45, 0.2)'
                        : 'rgba(251, 191, 36, 0.2)',
                      color: influencer.outreach_priority === 'high'
                        ? 'rgb(173, 248, 45)'
                        : 'rgb(251, 191, 36)'
                    }}
                  >
                    {influencer.outreach_priority}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-white/60">Followers</p>
                    <p className="text-sm font-semibold text-white">{influencer.followers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Engagement</p>
                    <p className="text-sm font-semibold text-white">{influencer.engagement_rate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Platform</p>
                    <p className="text-sm font-semibold text-white capitalize">{influencer.platform}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Match</p>
                    <p className="text-sm font-semibold text-white">{influencer.audience_match}</p>
                  </div>
                </div>

                <p className="text-sm text-white/80 mb-3">{influencer.why_recommended}</p>

                {influencer.estimated_cost && (
                  <div
                    className="p-3 rounded-lg text-sm"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <p className="text-white/70 mb-1">Estimated Cost</p>
                    <p className="font-semibold text-white">{influencer.estimated_cost}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && mediaPlan.budget_allocation && (
          <div className="space-y-4">
            {Object.entries(mediaPlan.budget_allocation.platform_allocation || {}).map(([platform, allocation]) => (
              <div
                key={platform}
                className="p-5 rounded-xl border border-white/20"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  {getPlatformIcon(platform)}
                  <h3 className="text-lg font-bold text-white capitalize">{platform}</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-white/60 mb-2">Paid vs Organic</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${allocation.paid_percentage}%`,
                              backgroundColor: 'rgb(173, 248, 45)'
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {allocation.paid_percentage}%
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      {allocation.organic_percentage}% Organic
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60 mb-2">Daily Budget</p>
                    <p className="text-lg font-bold text-white">{allocation.suggested_daily_budget}</p>
                    <p className="text-xs text-white/60 mt-1">Estimated Reach: {allocation.estimated_reach}</p>
                  </div>
                </div>

                {allocation.recommended_ad_types && (
                  <div>
                    <p className="text-sm text-white/70 mb-2">Recommended Ad Types:</p>
                    <div className="flex flex-wrap gap-2">
                      {allocation.recommended_ad_types.map((adType, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-xs border border-white/20 text-white/80"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                        >
                          {adType}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* KPIs Tab */}
        {activeTab === 'kpis' && mediaPlan.kpis && (
          <div className="space-y-6">
            {/* Awareness Metrics */}
            {mediaPlan.kpis.awareness_metrics && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" style={{ color: 'rgb(173, 248, 45)' }} />
                  Awareness Metrics
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(mediaPlan.kpis.awareness_metrics).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-4 rounded-lg border border-white/20"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                    >
                      <p className="text-sm text-white/70 mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-2xl font-bold text-white mb-2">{value.target}</p>
                      <p className="text-xs text-white/60">
                        Platforms: {value.platforms.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Metrics */}
            {mediaPlan.kpis.engagement_metrics && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5" style={{ color: 'rgb(173, 248, 45)' }} />
                  Engagement Metrics
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(mediaPlan.kpis.engagement_metrics).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-4 rounded-lg border border-white/20"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                    >
                      <p className="text-sm text-white/70 mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-2xl font-bold text-white mb-2">{value.target}</p>
                      <p className="text-xs text-white/60">
                        Platforms: {value.platforms.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversion Metrics */}
            {mediaPlan.kpis.conversion_metrics && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" style={{ color: 'rgb(173, 248, 45)' }} />
                  Conversion Metrics
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(mediaPlan.kpis.conversion_metrics).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-4 rounded-lg border border-white/20"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                    >
                      <p className="text-sm text-white/70 mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-2xl font-bold text-white mb-2">{value.target}</p>
                      <p className="text-xs text-white/60">
                        Platforms: {value.platforms.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MediaPlanViewer;
