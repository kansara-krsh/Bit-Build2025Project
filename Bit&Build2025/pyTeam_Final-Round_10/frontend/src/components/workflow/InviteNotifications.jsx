import React, { useState, useEffect } from 'react';
import { Bell, X, Check, XCircle, User, Calendar, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function InviteNotifications({ userEmail }) {
  const [invites, setInvites] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userEmail) {
      fetchPendingInvites();
      // Poll for new invites every 30 seconds
      const interval = setInterval(fetchPendingInvites, 30000);
      return () => clearInterval(interval);
    }
  }, [userEmail]);

  const fetchPendingInvites = async () => {
    if (!userEmail) return;

    try {
      const response = await fetch(`http://localhost:8000/api/invites/pending/${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };

  const handleAccept = async (invite) => {
    setProcessing(invite.invite_id);

    try {
      const storedUser = localStorage.getItem('collaboration_user');
      const currentUser = storedUser ? JSON.parse(storedUser) : {
        user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
        username: `User${Math.floor(Math.random() * 1000)}`,
        email: userEmail
      };

      const response = await fetch(`http://localhost:8000/api/invites/${invite.invite_id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentUser)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Remove from pending invites
        setInvites(prev => prev.filter(inv => inv.invite_id !== invite.invite_id));
        
        // Navigate to the workflow
        navigate(`/workflow-builder?workflow=${data.workflow_id}`);
        setIsOpen(false);
        
        // Show success message
        alert(`✅ You've joined the workflow!`);
      } else {
        alert('❌ Failed to accept invite');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      alert('❌ Error accepting invite');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (inviteId) => {
    setProcessing(inviteId);

    try {
      const response = await fetch(`http://localhost:8000/api/invites/${inviteId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        setInvites(prev => prev.filter(inv => inv.invite_id !== inviteId));
        alert('Invitation declined');
      } else {
        alert('❌ Failed to reject invite');
      }
    } catch (error) {
      console.error('Error rejecting invite:', error);
      alert('❌ Error rejecting invite');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!userEmail) return null;

  return (
    <>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/20"
        title="Workflow Invitations"
      >
        <Bell className="w-5 h-5" />
        {invites.length > 0 && (
          <>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {invites.length}
            </span>
            <span className="hidden md:inline">Invites</span>
          </>
        )}
      </button>

      {/* Invitations Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 max-h-[600px] bg-gray-900/98 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl z-[1000] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-white" />
              <h3 className="text-white font-bold">Workflow Invitations</h3>
              {invites.length > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                  {invites.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Invites List */}
          <div className="max-h-[500px] overflow-y-auto">
            {invites.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending invitations</p>
                <p className="text-sm mt-1">You'll see workflow collaboration invites here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {invites.map((invite) => (
                  <div key={invite.invite_id} className="p-4 hover:bg-gray-800/50 transition-colors">
                    {/* Invite Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">
                          <span className="text-blue-400">{invite.from_user.username}</span> invited you to collaborate
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(invite.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    {invite.message && (
                      <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-300 italic">"{invite.message}"</p>
                        </div>
                      </div>
                    )}

                    {/* Workflow Info */}
                    <div className="mb-3 text-xs text-gray-400 font-mono bg-gray-800/30 px-2 py-1 rounded">
                      Workflow ID: {invite.workflow_id.substring(0, 20)}...
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(invite)}
                        disabled={processing === invite.invite_id}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing === invite.invite_id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(invite.invite_id)}
                        disabled={processing === invite.invite_id}
                        className="flex-1 bg-gray-700 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default InviteNotifications;
