import React, { useState, useRef, useEffect } from 'react';
import { Play, Save, Download, Upload, RefreshCw, Sparkles, Loader2, Image, FileText, FileUp, BarChart, Square, Users, UserPlus } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';
import { exportWorkflowAsPNG, exportWorkflowAsPDF, exportWorkflowData } from '../../utils/exportWorkflow';
import CampaignReport from './CampaignReport';
import InviteNotifications from './InviteNotifications';

function WorkflowNavbar({ onRunWorkflow, onStopWorkflow, isRunning, isStopping, reactFlowWrapper, reactFlowInstance, activeUsers = [], isCollaborating = false, workflowId = null, currentUser = null, onOpenInviteModal = null }) {
  const { workflowName, setWorkflowName, saveWorkflow, loadWorkflow, clearWorkflow, nodes, edges, setNodes, setEdges } = useWorkflowStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showExportMenu]);

  const handleSave = () => {
    setIsSaving(true);
    saveWorkflow();
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const handleLoad = () => {
    const loaded = loadWorkflow();
    if (loaded) {
      alert('Workflow loaded successfully!');
    } else {
      alert('No saved workflow found.');
    }
  };

  const handleExportJSON = () => {
    exportWorkflowData(nodes, edges, workflowName);
    setShowExportMenu(false);
  };

  const handleExportPNG = async () => {
    if (reactFlowWrapper?.current) {
      await exportWorkflowAsPNG(reactFlowWrapper.current, workflowName);
      setShowExportMenu(false);
    } else {
      alert('Canvas not ready. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    if (reactFlowWrapper?.current) {
      await exportWorkflowAsPDF(reactFlowWrapper.current, workflowName);
      setShowExportMenu(false);
    } else {
      alert('Canvas not ready. Please try again.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('❌ Please select a valid JSON workflow file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflowData = JSON.parse(e.target.result);
        
        if (workflowData.nodes && workflowData.edges) {
          if (nodes.length > 0) {
            if (confirm('This will replace your current workflow. Continue?')) {
              setNodes(workflowData.nodes);
              setEdges(workflowData.edges);
              if (workflowData.name) {
                setWorkflowName(workflowData.name);
              }
              alert('✅ Workflow imported successfully!');
            }
          } else {
            setNodes(workflowData.nodes);
            setEdges(workflowData.edges);
            if (workflowData.name) {
              setWorkflowName(workflowData.name);
            }
            alert('✅ Workflow imported successfully!');
          }
        } else {
          alert('❌ Invalid workflow file. Missing nodes or edges.');
        }
      } catch (error) {
        alert('❌ Failed to import workflow: ' + error.message);
      }
    };
    
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  return (
    <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center justify-between relative z-50 mt-21">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6" style={{ color: 'rgb(173, 248, 45)' }} />
        <div>
          {showNameEdit ? (
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              onBlur={() => setShowNameEdit(false)}
              onKeyDown={(e) => e.key === 'Enter' && setShowNameEdit(false)}
              className="bg-white/10 text-white px-2 py-1 rounded border border-white/20 focus:outline-none backdrop-blur-md"
              style={{ focusBorderColor: 'rgb(173, 248, 45)' }}
              autoFocus
            />
          ) : (
            <h1 
              className="text-xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors"
              onClick={() => setShowNameEdit(true)}
            >
              {workflowName}
            </h1>
          )}
          <p className="text-xs text-white/60">BrandMind AI Workflow Builder</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Invite Notifications */}
        {currentUser?.email && (
          <div className="relative">
            <InviteNotifications userEmail={currentUser.email} />
          </div>
        )}

        {/* Invite Collaborators Button */}
        {workflowId && currentUser && onOpenInviteModal ? (
          <button
            onClick={() => {
              console.log('Invite button clicked', { workflowId, currentUser });
              onOpenInviteModal(workflowId, currentUser);
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105"
            title="Invite collaborators to this workflow"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite</span>
          </button>
        ) : (
          <div className="text-xs text-gray-500">
            {!workflowId && 'No workflow ID'}
            {!currentUser && 'No current user'}
            {!onOpenInviteModal && 'No modal handler'}
          </div>
        )}

        {/* Campaign Report */}
        <button
          onClick={() => setShowReport(true)}
          disabled={nodes.length === 0}
          className="px-4 py-2 bg-gradient-to-r from-[rgb(173,248,45)] to-[rgb(150,220,40)] hover:from-[rgb(150,220,40)] hover:to-[rgb(173,248,45)] text-black rounded-lg transition-all flex items-center gap-2 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="Generate Campaign Impact Report"
        >
          <BarChart className="w-4 h-4" />
          Impact Report
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/20"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saved!' : 'Save'}
        </button>

        {/* Load */}
        <button
          onClick={handleLoad}
          className="px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/20"
        >
          <Upload className="w-4 h-4" />
          Load
        </button>

        {/* Import JSON */}
        <button
          onClick={handleImportClick}
          className="px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/20"
          title="Import workflow from JSON file"
        >
          <FileUp className="w-4 h-4" />
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileImport}
          className="hidden"
        />

        {/* Export */}
        <div className="relative z-[100]" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/20"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {/* Export dropdown menu */}
          {showExportMenu && (
            <div className="absolute top-full mt-2 right-0 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl z-[100] min-w-[200px]">
              <button
                onClick={handleExportPNG}
                className="w-full px-4 py-3 text-left hover:bg-white/20 text-white flex items-center gap-3 text-sm transition-all rounded-t-lg border-b border-white/10"
              >
                <Image className="w-4 h-4" />
                Export as PNG
              </button>
              <button
                onClick={handleExportPDF}
                className="w-full px-4 py-3 text-left hover:bg-white/20 text-white flex items-center gap-3 text-sm transition-all border-b border-white/10"
              >
                <FileText className="w-4 h-4" />
                Export as PDF
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full px-4 py-3 text-left hover:bg-white/20 text-white flex items-center gap-3 text-sm transition-all rounded-b-lg"
              >
                <Download className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          )}
        </div>

        {/* Clear */}
        <button
          onClick={() => {
            if (confirm('Clear all nodes? This cannot be undone.')) {
              clearWorkflow();
            }
          }}
          className="px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-red-500/20 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/20 hover:border-red-500/50"
        >
          <RefreshCw className="w-4 h-4" />
          Clear
        </button>

        {/* Active Collaborators */}
        {isCollaborating && activeUsers.length > 0 && (() => {
          // Deduplicate active users by user_id
          const uniqueActiveUsers = activeUsers.reduce((acc, user) => {
            if (!acc.find(u => u.user_id === user.user_id)) {
              acc.push(user);
            }
            return acc;
          }, []);

          return (
            <>
              <div className="w-px h-8 bg-white/20 mx-2" />
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 backdrop-blur-md rounded-lg border border-green-500/30">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-green-100 text-sm font-medium">{uniqueActiveUsers.length}</span>
                <div className="flex -space-x-2">
                  {uniqueActiveUsers.slice(0, 3).map(user => (
                    <div
                      key={user.user_id}
                      className="w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: user.color }}
                      title={user.username}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {uniqueActiveUsers.length > 3 && (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                      +{uniqueActiveUsers.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* Divider */}
        <div className="w-px h-8 bg-white/20 mx-2" />

        {/* Run Workflow - Prominent Start Button */}
        <button
          onClick={onRunWorkflow}
          disabled={isRunning}
          className={`
            px-8 py-2.5 rounded-full font-bold text-base flex items-center gap-2 
            transition-all shadow-lg transform hover:scale-105
            ${isRunning
              ? 'bg-gray-600 cursor-not-allowed animate-pulse text-white'
              : 'text-black'
            }
          `}
          style={{
            backgroundColor: isRunning ? undefined : 'rgb(173, 248, 45)',
          }}
          title="Execute all connected agents in sequence"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-black" />
              Start Workflow
            </>
          )}
        </button>

        {/* Stop Workflow Button - Only show when running */}
        {isRunning && (
          <button
            onClick={onStopWorkflow}
            disabled={isStopping}
            className={`
              px-6 py-2.5 rounded-full font-bold text-base flex items-center gap-2 
              transition-all shadow-lg transform hover:scale-105
              ${isStopping
                ? 'bg-gray-600 cursor-not-allowed text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
              }
            `}
            title="Stop workflow execution"
          >
            {isStopping ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <Square className="w-5 h-5 fill-white" />
                Stop
              </>
            )}
          </button>
        )}
      </div>

      {/* Campaign Report Modal */}
      <CampaignReport
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        nodes={nodes}
        workflowName={workflowName}
      />
    </nav>
  );
}

export default WorkflowNavbar;

