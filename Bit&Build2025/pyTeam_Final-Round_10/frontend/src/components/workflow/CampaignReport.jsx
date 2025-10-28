import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, TrendingUp, Target, Sparkles, BarChart3, CheckCircle, Clock, Loader2 } from 'lucide-react';

function CampaignReport({ isOpen, onClose, nodes, workflowName }) {
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Sanitize nodes: remove functions and circular references, only send necessary fields
      const sanitizedNodes = (nodes || []).map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data ? {
          label: n.data.label,
          agentType: n.data.agentType,
          output: n.data.output,
        } : undefined,
      }));

      const response = await fetch('http://localhost:8000/api/generate-campaign-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: sanitizedNodes,
          workflowName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (report?.pdfUrl) {
      window.open(report.pdfUrl, '_blank');
    }
  };

  // Auto-generate report when modal opens
  React.useEffect(() => {
    if (isOpen && !report && !isGenerating) {
      generateReport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const renderSection = (sectionData, icon) => {
    if (!sectionData) return null;

    const content = sectionData.content || [];
    
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h3 className="text-2xl font-bold text-white">
            {sectionData.title || 'Section'}
          </h3>
        </div>
        <div className="space-y-3">
          {content.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="mt-2 w-2 h-2 rounded-full bg-[rgb(173,248,45)] shrink-0" />
              <p className="text-white/90 text-base leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border-2 border-[rgb(173,248,45)] w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="px-10 py-7 border-b border-white/20 flex items-center justify-between shrink-0"
          style={{ 
            background: 'linear-gradient(135deg, rgba(173,248,45,0.2) 0%, transparent 100%)' 
          }}
        >
          <div className="flex items-center gap-5">
            <div className="p-3 bg-[rgb(173,248,45)] rounded-2xl">
              <FileText className="w-8 h-8 text-black" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Campaign Impact Report</h2>
              <p className="text-base text-white/70 mt-1">{workflowName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {report && (
              <button
                onClick={downloadPDF}
                className="px-6 py-3 bg-[rgb(173,248,45)] hover:bg-[rgb(173,248,45)]/90 text-black rounded-xl transition-all flex items-center gap-2 text-base font-bold shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-16 h-16 text-[rgb(173,248,45)] animate-spin mb-6" />
              <p className="text-xl text-white/80 mb-2">Analyzing Campaign Data...</p>
              <p className="text-base text-white/60">Generating comprehensive impact report</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border-2 border-red-500 rounded-2xl p-8 text-center">
              <p className="text-red-200 text-lg">
                Failed to generate report: {error}
              </p>
              <button
                onClick={generateReport}
                className="mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {/* If there's no report and we're not generating, show a friendly CTA */}
          {!report && !isGenerating && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="w-12 h-12 text-[rgb(173,248,45)] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No report yet</h3>
              <p className="text-white/70 mb-6">Click the button below to generate a Campaign Impact Report for this workflow.</p>
              <div className="flex gap-3">
                <button
                  onClick={generateReport}
                  className="px-6 py-3 bg-[rgb(173,248,45)] hover:bg-[rgb(173,248,45)]/90 text-black rounded-xl transition-all flex items-center gap-2 text-base font-bold shadow-lg hover:shadow-xl"
                >
                  <FileText className="w-5 h-5" />
                  Generate Report
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {report && !isGenerating && (
            <div className="space-y-6">
              {/* Metadata Summary */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-6 h-6 text-[rgb(173,248,45)]" />
                    <span className="text-white/70 text-base">Generated</span>
                  </div>
                  <p className="text-white font-bold text-lg">
                    {new Date(report.summary?.metadata?.generated_at).toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-6 h-6 text-[rgb(173,248,45)]" />
                    <span className="text-white/70 text-base">Total Agents</span>
                  </div>
                  <p className="text-white font-bold text-lg">
                    {report.summary?.metadata?.total_agents || nodes.length}
                  </p>
                </div>

                <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-[rgb(173,248,45)]" />
                    <span className="text-white/70 text-base">Status</span>
                  </div>
                  <p className="text-white font-bold text-lg">Complete</p>
                </div>
              </div>

              {/* Report Sections */}
              <div className="bg-white/5 rounded-2xl p-8 space-y-8">
                {renderSection(
                  report.summary?.executive_summary,
                  <FileText className="w-7 h-7 text-[rgb(173,248,45)]" />
                )}

                {renderSection(
                  report.summary?.strategic_insights,
                  <Target className="w-7 h-7 text-[rgb(173,248,45)]" />
                )}

                {renderSection(
                  report.summary?.creative_execution,
                  <Sparkles className="w-7 h-7 text-[rgb(173,248,45)]" />
                )}

                {renderSection(
                  report.summary?.media_distribution || report.summary?.['media_&_distribution'],
                  <BarChart3 className="w-7 h-7 text-[rgb(173,248,45)]" />
                )}

                {renderSection(
                  report.summary?.expected_impact || report.summary?.['expected_impact_&_metrics'],
                  <TrendingUp className="w-7 h-7 text-[rgb(173,248,45)]" />
                )}

                {renderSection(
                  report.summary?.recommendations || report.summary?.key_recommendations,
                  <CheckCircle className="w-7 h-7 text-[rgb(173,248,45)]" />
                )}

                {/* Fallback for unstructured text */}
                {report.summary?.full_text && !report.summary?.executive_summary && (
                  <div className="prose prose-invert prose-lg max-w-none">
                    <div className="text-white/90 leading-relaxed whitespace-pre-wrap">
                      {report.summary.full_text}
                    </div>
                  </div>
                )}
              </div>

              {/* Agent Summary */}
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Sparkles className="w-7 h-7 text-[rgb(173,248,45)]" />
                  Workflow Agents
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {nodes.map((node, idx) => {
                    const data = node.data || {};
                    const agentStyles = {
                      strategy: { color: 'rgb(173,248,45)', icon: '🎯' },
                      copywriting: { color: 'rgb(96,165,250)', icon: '✍️' },
                      visual: { color: 'rgb(251,146,60)', icon: '🎨' },
                      research: { color: 'rgb(167,139,250)', icon: '🔍' },
                      media: { color: 'rgb(244,114,182)', icon: '📊' },
                    };
                    const style = agentStyles[data.agentType] || agentStyles.strategy;

                    return (
                      <div
                        key={node.id}
                        className="bg-white/10 rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{style.icon}</span>
                          <div className="flex-1">
                            <h4 className="text-white font-bold text-base">{data.label}</h4>
                            <p className="text-white/60 text-sm capitalize">{data.agentType}</p>
                          </div>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: data.output ? style.color : '#666' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-white/20 bg-white/5 shrink-0 flex justify-between items-center">
          <p className="text-white/60 text-sm">
            Generated by BrandMind AI • Powered by Multi-Agent Workflow
          </p>
          {report && (
            <button
              onClick={downloadPDF}
              className="px-6 py-3 bg-[rgb(173,248,45)] hover:bg-[rgb(173,248,45)]/90 text-black rounded-xl transition-all flex items-center gap-2 text-base font-bold shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download PDF Report
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default CampaignReport;
