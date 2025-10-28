import React, { useState, useEffect } from 'react';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder';
import InviteModal from '../components/workflow/InviteModal';

function WorkflowBuilderPage() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [workflowId, setWorkflowId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const handleOpenInviteModal = (wfId, user) => {
    console.log('🎯 WorkflowBuilderPage: handleOpenInviteModal called', { wfId, user });
    setWorkflowId(wfId);
    setCurrentUser(user);
    setIsInviteModalOpen(true);
  };

  useEffect(() => {
    console.log('🎯 WorkflowBuilderPage: Mounted, passing handler:', !!handleOpenInviteModal);
  }, []);

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

export default WorkflowBuilderPage;
