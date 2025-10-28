import React, { useState } from 'react';
import { X, Mail, Send, Users, Link as LinkIcon, Check } from 'lucide-react';

function InviteModal({ isOpen, onClose, workflowId, currentUser }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const inviteLink = `${window.location.origin}/workflow-builder?workflow=${workflowId}`;

  const handleSendInvite = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    setIsSending(true);

    try {
      const response = await fetch('http://localhost:8000/api/invites/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          from_user: {
            user_id: currentUser.user_id,
            username: currentUser.username,
            email: currentUser.email || `${currentUser.username}@example.com`
          },
          to_email: email.trim(),
          message: message.trim()
        })
      });

      if (response.ok) {
        alert(`✅ Invitation sent to ${email}!`);
        setEmail('');
        setMessage('');
        onClose();
      } else {
        const error = await response.json();
        alert(`❌ Failed to send invite: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('❌ Failed to send invite. Check console for details.');
    } finally {
      setIsSending(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-full max-w-2xl">
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Invite Collaborators</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              
              {/* Email Invite Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Send Email Invitation</h3>
                </div>
                
                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Let's collaborate on this workflow!"
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending || !email.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-sm text-gray-500">OR</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>

              {/* Share Link Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <LinkIcon className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Share Link</h3>
                </div>
                
                <p className="text-sm text-gray-400 mb-3">
                  Copy this link to share with collaborators:
                </p>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 font-mono text-sm"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={copyInviteLink}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      copySuccess
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {copySuccess ? (
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        Copied!
                      </div>
                    ) : (
                      'Copy'
                    )}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  💡 <strong>Tip:</strong> Collaborators will see real-time changes, can edit the workflow, and chat with the team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default InviteModal;

