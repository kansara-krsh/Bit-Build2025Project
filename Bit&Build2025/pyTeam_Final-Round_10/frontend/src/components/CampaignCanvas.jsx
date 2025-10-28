import React, { useState } from 'react';
import AssetCard from './AssetCard';
import ExportButton from './ExportButton';
import MediaPlanViewer from './MediaPlanViewer';
import { ArrowLeft, Target, Users, MessageSquare, Calendar } from 'lucide-react';

function CampaignCanvas({ campaign, onCampaignUpdate, onReset }) {
  const [editingAsset, setEditingAsset] = useState(null);

  const strategy = campaign.strategy || {};
  const assets = campaign.asset_plan || [];
  const calendar = campaign.posting_calendar || [];
  const influencers = campaign.influencers || [];
  const mediaPlan = campaign.media_plan || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-white/80 hover:text-white backdrop-blur-md bg-white/10 px-4 py-2 rounded-lg border border-white/20 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          New Campaign
        </button>
        <ExportButton campaignId={campaign.campaign_id} />
      </div>

      {/* Strategy Section - Glass morphism */}
      <div 
        className="rounded-3xl backdrop-blur-md border shadow-2xl p-6"
        style={{
          backgroundColor: 'rgba(173, 248, 45, 0.1)',
          borderColor: 'rgba(173, 248, 45, 0.3)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-6 h-6" style={{ color: 'rgb(173, 248, 45)' }} />
          <h2 className="text-2xl font-bold text-white">Campaign Strategy</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-white mb-2">Core Concept</h3>
            <p className="text-white/90 text-lg">{strategy.core_concept}</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Tagline</h3>
            <p className="text-lg font-semibold" style={{ color: 'rgb(173, 248, 45)' }}>{strategy.tagline}</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Target Audience</h3>
            <p className="text-white/80">{strategy.target_audience}</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Tone</h3>
            <p className="text-white/80 capitalize">{strategy.tone}</p>
          </div>
        </div>

        {strategy.key_messages && strategy.key_messages.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-white mb-2">Key Messages</h3>
            <ul className="list-disc list-inside space-y-1">
              {strategy.key_messages.map((msg, idx) => (
                <li key={idx} className="text-white">{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Media Plan Section */}
      {mediaPlan && <MediaPlanViewer mediaPlan={mediaPlan} />}

      {/* Assets Section */}
      <div 
        className="rounded-3xl backdrop-blur-md border shadow-2xl p-6"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-6 h-6" style={{ color: 'rgb(173, 248, 45)' }} />
          <h2 className="text-2xl font-bold text-white">Campaign Assets</h2>
        </div>
        
        {assets.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No assets generated yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onRegenerate={(assetId, instructions) => {
                  // Handle regeneration
                  console.log('Regenerate:', assetId, instructions);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Posting Calendar */}
      {calendar.length > 0 && (
        <div 
          className="rounded-3xl backdrop-blur-md border shadow-2xl p-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-6 h-6" style={{ color: 'rgb(173, 248, 45)' }} />
            <h2 className="text-2xl font-bold text-white">Posting Calendar</h2>
          </div>
          
          <div className="space-y-4">
            {calendar.map((item, idx) => (
              <div 
                key={idx} 
                className="border border-white/20 rounded-xl p-5 backdrop-blur-sm hover:border-white/30 transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-bold text-white text-lg mb-1">{item.date}</p>
                    <p className="text-sm text-white/70 capitalize">{item.channel}</p>
                  </div>
                  <span 
                    className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                    style={{
                      backgroundColor: 'rgba(251, 191, 36, 0.2)',
                      color: 'rgb(251, 191, 36)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                    }}
                  >
                    Needs Approval
                  </span>
                </div>
                {item.caption && (
                  <p className="text-white/90 text-sm leading-relaxed mt-3 pt-3 border-t border-white/10">
                    {item.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Influencers */}
      {influencers.length > 0 && (
        <div 
          className="rounded-3xl backdrop-blur-md border shadow-2xl p-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-6 h-6" style={{ color: 'rgb(173, 248, 45)' }} />
            <h2 className="text-2xl font-bold text-white">Recommended Influencers</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {influencers.map((influencer, idx) => (
              <div 
                key={idx} 
                className="border border-white/20 rounded-xl p-5 backdrop-blur-sm hover:border-white/30 transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                }}
              >
                <h3 className="font-bold text-white text-lg mb-1">{influencer.name}</h3>
                <p className="text-sm text-white/70 mb-2">@{influencer.handle}</p>
                <p className="text-sm text-white/60 mb-3">
                  {influencer.platform} • {influencer.followers} followers
                </p>
                {influencer.outreach_draft && (
                  <div 
                    className="mt-3 pt-3 border-t border-white/10"
                  >
                    <p className="text-sm text-white/90 italic leading-relaxed">
                      "{influencer.outreach_draft}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignCanvas;
