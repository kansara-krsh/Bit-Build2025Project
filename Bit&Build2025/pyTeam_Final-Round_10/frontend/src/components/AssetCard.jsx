import React, { useState } from 'react';
import { RefreshCw, Edit2, Image, FileText, Video, MessageCircle } from 'lucide-react';

function AssetCard({ asset, onRegenerate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(asset.content || '');
  const [regenerateInstructions, setRegenerateInstructions] = useState('');
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);

  const getIcon = () => {
    switch (asset.type) {
      case 'image':
      case 'flyer':
        return <Image className="w-5 h-5" />;
      case 'video_script':
        return <Video className="w-5 h-5" />;
      case 'caption':
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    return asset.type.replace('_', ' ').toUpperCase();
  };

  const handleRegenerate = () => {
    if (showRegenerateInput && regenerateInstructions.trim()) {
      onRegenerate(asset.id, regenerateInstructions);
      setRegenerateInstructions('');
      setShowRegenerateInput(false);
    } else {
      setShowRegenerateInput(true);
    }
  };

  return (
    <div className="border border-white/20 bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-2xl hover:border-[rgba(173,248,45,0.4)] transition-all duration-300">
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between border-b border-white/10"
        style={{
          backgroundColor: 'rgba(173, 248, 45, 0.1)',
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: 'rgb(173, 248, 45)' }}>{getIcon()}</span>
          <span className="font-semibold text-sm text-white">{getTypeLabel()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">v{asset.version}</span>
          {!asset.safety?.moderation_passed && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30">
              Safety Issue
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {asset.type === 'image' || asset.type === 'flyer' ? (
          <div className="aspect-square bg-white/5 rounded-lg overflow-hidden border border-white/10">
            {asset.url ? (
              (() => {
                // Normalize URL: if backend returned a relative path, prefix with localhost:8000
                const isAbsolute = /^(https?:)?\/\//i.test(asset.url) || /^data:|^blob:/i.test(asset.url);
                const src = isAbsolute ? asset.url : `http://localhost:8000${asset.url.startsWith('/') ? '' : '/'}${asset.url}`;

                return (
                  <img
                    src={src}
                    alt={asset.id}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-16 h-16 text-white/20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M8 7v10M16 7v10M12 3v4" /></svg></div>';
                    }}
                  />
                );
              })()
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="w-16 h-16 text-white/20" />
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-[120px]">
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-40 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[rgb(173,248,45)] focus:ring-2 focus:ring-[rgba(173,248,45,0.3)] resize-none text-sm leading-relaxed"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              />
            ) : (
              <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {asset.content || 'No content generated'}
              </p>
            )}
          </div>
        )}

        {/* Regenerate Input */}
        {showRegenerateInput && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Modification instructions (optional)"
              value={regenerateInstructions}
              onChange={(e) => setRegenerateInstructions(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[rgb(173,248,45)] focus:ring-2 focus:ring-[rgba(173,248,45,0.3)] text-sm"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-white/5 backdrop-blur-md border-t border-white/10 flex items-center gap-2">
        {asset.content && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white/90 hover:bg-white/10 rounded-lg transition-all border border-white/20 font-medium"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
        
        {isEditing && (
          <button
            onClick={() => {
              setIsEditing(false);
              // Here you would call an API to save the edited content
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-black font-semibold rounded-lg transition-all hover:scale-105 shadow-lg"
            style={{ backgroundColor: 'rgb(173, 248, 45)' }}
          >
            Save Changes
          </button>
        )}

        <button
          onClick={handleRegenerate}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white/90 hover:bg-white/10 rounded-lg transition-all border border-white/20 ml-auto font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </button>
      </div>
    </div>
  );
}

export default AssetCard;
