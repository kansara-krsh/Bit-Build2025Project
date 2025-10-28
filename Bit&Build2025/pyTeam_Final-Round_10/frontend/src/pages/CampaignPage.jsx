import React, { useState } from 'react';
import BriefInput from '../components/BriefInput';
import CampaignCanvas from '../components/CampaignCanvas';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder';
import InviteModal from '../components/workflow/InviteModal';
import BackgroundSpline from '../components/BackgroundSpline';
import { Sparkles, Workflow, Zap } from 'lucide-react';

function CampaignPage() {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('simple'); // 'simple' or 'workflow'

  // State for invite modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [workflowId, setWorkflowId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const handleOpenInviteModal = (wfId, user) => {
    console.log('🎯 CampaignPage: handleOpenInviteModal called', { wfId, user });
    setWorkflowId(wfId);
    setCurrentUser(user);
    setIsInviteModalOpen(true);
  };

  // Workflow mode - full screen
  if (mode === 'workflow') {
    return (
      <>
        <WorkflowBuilder onOpenInviteModal={handleOpenInviteModal} />
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          workflowId={workflowId}
          currentUser={currentUser}
        />
      </>
    );
  }

  // Simple mode - with landing page theme
  return (
    <div className="min-h-screen relative">
      {/* 3D Spline Background */}
      <BackgroundSpline />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header - Glass morphism */}
        <header className="backdrop-blur-md bg-white/10 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8" style={{ color: 'rgb(173, 248, 45)' }} />
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    BrandMind AI
                  </h1>
                  <p className="text-xs text-white/70">Campaign Generator</p>
                </div>
              </div>

              {/* Mode Toggle - Glass effect */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1 rounded-lg border border-white/20">
                <button
                  onClick={() => setMode('simple')}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2
                    ${mode === 'simple'
                      ? 'bg-white/20 text-white shadow-lg border border-white/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Zap className="w-4 h-4" />
                  Quick Mode
                </button>
                <button
                  onClick={() => setMode('workflow')}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2
                    ${mode === 'workflow'
                      ? 'bg-white/20 text-white shadow-lg border border-white/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Workflow className="w-4 h-4" />
                  Workflow Builder
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {!campaign ? (
            <BriefInput 
              onCampaignGenerated={setCampaign} 
              loading={loading}
              setLoading={setLoading}
            />
          ) : (
            <CampaignCanvas 
              campaign={campaign} 
              onCampaignUpdate={setCampaign}
              onReset={() => setCampaign(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default CampaignPage;

