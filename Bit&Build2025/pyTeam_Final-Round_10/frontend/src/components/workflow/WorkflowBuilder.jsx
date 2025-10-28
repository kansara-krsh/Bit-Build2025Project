import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Upload } from 'lucide-react';

import useWorkflowStore from '../../store/workflowStore';
import AgentNode from './AgentNode';
import Sidebar from './Sidebar';
import WorkflowNavbar from './WorkflowNavbar';
import CollaborationChat from './CollaborationChat';
import RemoteCursors from './RemoteCursors';
import { agentAPI } from '../../api/agentAPI';
import { useCollaboration } from '../../hooks/useCollaboration';

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

// Input validation function - ONLY CHECK FIRST AGENT IN EXECUTION FLOW
const validateWorkflowInput = (nodes) => {
  // Get execution order to find the first agent
  const executionOrder = useWorkflowStore.getState().getExecutionOrder();
  
  if (executionOrder.length === 0) {
    return { isValid: true }; // No nodes to validate
  }
  
  // Only validate the first agent in the execution flow
  const firstAgent = executionOrder[0];
  const input = firstAgent.data.input?.trim() || '';
  
  // Only block completely empty inputs for the first agent
  if (input.length === 0) {
    return {
      isValid: false,
      error: `Please add some text to describe your campaign in the "${firstAgent.data.label}" agent (the starting point of your workflow).`
    };
  }

  return { isValid: true };
};

function WorkflowBuilderInner({ onOpenInviteModal }) {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('WorkflowBuilder onOpenInviteModal:', onOpenInviteModal);
  }, [onOpenInviteModal]);

  // Collaboration setup
  const [workflowId] = useState(() => {
    // Get or create workflow ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlWorkflowId = urlParams.get('workflow');
    if (urlWorkflowId) return urlWorkflowId;
    
    const stored = localStorage.getItem('current_workflow_id');
    if (stored) return stored;
    
    const newId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('current_workflow_id', newId);
    return newId;
  });

  const [currentUser] = useState(() => {
    const storedUser = localStorage.getItem('collaboration_user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    
    // Try to get email from logged in user
    const loggedInEmail = localStorage.getItem('userEmail');
    
    const user = {
      user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
      username: `User${Math.floor(Math.random() * 1000)}`,
      email: loggedInEmail || undefined,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    };
    
    localStorage.setItem('collaboration_user', JSON.stringify(user));
    return user;
  });

  // Initialize collaboration
  const {
    isConnected,
    activeUsers,
    cursors,
    chatMessages,
    sendCursorPosition,
    sendWorkflowUpdate,
    sendChatMessage
  } = useCollaboration(workflowId, currentUser);

  // Track if update is from remote user to prevent loops
  const isRemoteUpdateRef = useRef(false);
  const syncTimeoutRef = useRef(null);
  const hasMountedRef = useRef(false);

  // Debug collaboration state
  useEffect(() => {
    console.log('Collaboration State:', {
      workflowId,
      currentUser,
      onOpenInviteModal: !!onOpenInviteModal,
      isConnected
    });
    
    // Mark as mounted after first render
    setTimeout(() => {
      hasMountedRef.current = true;
    }, 1000);
  }, [workflowId, currentUser, onOpenInviteModal, isConnected]);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNode,
    getExecutionOrder,
    stopExecution,
    resetExecutionState,
    isExecutionStopped,
  } = useWorkflowStore();

  // Memoize nodeTypes to avoid React Flow warning
  const nodeTypes = useMemo(() => ({
    agentNode: AgentNode,
  }), []);

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Track mouse position and send to collaborators (throttled)
  useEffect(() => {
    if (!isConnected) return;

    let lastSent = 0;
    const throttleDelay = 100; // Increased to 100ms for better performance

    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastSent > throttleDelay) {
        sendCursorPosition(e.clientX, e.clientY);
        lastSent = now;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isConnected, sendCursorPosition]);

  // Listen for workflow updates from other users
  useEffect(() => {
    const handleWorkflowUpdate = (event) => {
      console.log('🎯 handleWorkflowUpdate called with:', event.detail);
      
      const { nodes: remoteNodes, edges: remoteEdges, action, user_id } = event.detail;
      
      console.log(`   Remote user_id: ${user_id}, Current user_id: ${currentUser?.user_id}`);
      
      // Ignore updates from ourselves
      if (user_id === currentUser?.user_id) {
        console.log('   ⏭️ Ignoring own update');
        return;
      }
      
      console.log(`🔄 Applying workflow update: ${action}, nodes: ${remoteNodes?.length}, edges: ${remoteEdges?.length}`);
      
      // Mark that this is a remote update
      isRemoteUpdateRef.current = true;
      
      // Update store with remote changes
      if (remoteNodes) {
        console.log('   Setting nodes:', remoteNodes.length);
        useWorkflowStore.getState().setNodes(remoteNodes);
      }
      if (remoteEdges) {
        console.log('   Setting edges:', remoteEdges.length);
        useWorkflowStore.getState().setEdges(remoteEdges);
      }
      
      // Reset flag after a short delay
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
        console.log('   ✅ Remote update flag reset');
      }, 100);
    };

    window.addEventListener('collaboration_workflow_update', handleWorkflowUpdate);
    return () => window.removeEventListener('collaboration_workflow_update', handleWorkflowUpdate);
  }, [currentUser]);

  // Sync workflow changes to other users with debouncing
  useEffect(() => {
    // Don't sync on initial mount
    if (!hasMountedRef.current) {
      console.log('⏭️ Skipping sync - initial mount');
      return;
    }

    // Don't sync if this update came from a remote user
    if (isRemoteUpdateRef.current) {
      console.log('⏭️ Skipping sync - remote update in progress');
      return;
    }

    // Don't sync if not connected
    if (!isConnected) {
      console.log('⏭️ Skipping sync - not connected');
      return;
    }

    // Don't sync empty workflow
    if (!nodes || nodes.length === 0) {
      console.log('⏭️ Skipping sync - no nodes');
      return;
    }

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce sync - only send after 300ms of no changes
    syncTimeoutRef.current = setTimeout(() => {
      if (nodes && edges && !isRemoteUpdateRef.current) {
        console.log('📤 Sending workflow update to collaborators');
        sendWorkflowUpdate(nodes, edges, 'update');
      } else {
        console.log('⏭️ Skipping send - conditions not met', { 
          hasNodes: !!nodes, 
          hasEdges: !!edges, 
          isRemote: isRemoteUpdateRef.current 
        });
      }
    }, 300);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [nodes, edges, isConnected, sendWorkflowUpdate]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle file drag over for JSON import
  const onFileDragOver = useCallback((event) => {
    // Only handle if it's a file being dragged (not a workflow card)
    if (event.dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
      setIsDraggingFile(true);
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const onFileDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Only clear if leaving the drop zone entirely
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDraggingFile(false);
    }
  }, []);

  // Handle file drop for JSON import
  const onFileDrop = useCallback((event) => {
    // Check if it's a file drop (not a workflow card)
    const files = event.dataTransfer.files;
    
    if (files && files.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      setIsDraggingFile(false);
      
      const file = files[0];
      
      // Check if it's a JSON file
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const workflowData = JSON.parse(e.target.result);
            
            // Validate workflow structure
            if (workflowData.nodes && workflowData.edges) {
              // Clear current workflow
              if (nodes.length > 0) {
                if (confirm('This will replace your current workflow. Continue?')) {
                  useWorkflowStore.getState().setNodes(workflowData.nodes);
                  useWorkflowStore.getState().setEdges(workflowData.edges);
                  if (workflowData.name) {
                    useWorkflowStore.getState().setWorkflowName(workflowData.name);
                  }
                  alert('✅ Workflow imported successfully!');
                }
              } else {
                useWorkflowStore.getState().setNodes(workflowData.nodes);
                useWorkflowStore.getState().setEdges(workflowData.edges);
                if (workflowData.name) {
                  useWorkflowStore.getState().setWorkflowName(workflowData.name);
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
      } else {
        alert('❌ Please drop a valid JSON workflow file.');
      }
    } else {
      // Not a file drop, just clear the file dragging state
      setIsDraggingFile(false);
    }
  }, [nodes]);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const agentData = JSON.parse(
        event.dataTransfer.getData('application/reactflow')
      );

      if (!agentData || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: getNodeId(),
        type: 'agentNode',
        position,
        data: {
          label: agentData.label,
          agentType: agentData.type,
          status: 'idle',
          input: '',
          output: null,
          showInput: true,
        },
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  const stopWorkflow = async () => {
    console.log('🛑 STOPPING WORKFLOW EXECUTION...');
    setIsStopping(true);
    stopExecution();
    
    // Wait a moment for the current operation to finish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsRunning(false);
    setIsStopping(false);
    
    console.log('✋ Workflow execution stopped by user');
  };

  const runWorkflow = async () => {
    // Reset execution state
    resetExecutionState();
    
    // Get fresh state from store
    const currentNodes = useWorkflowStore.getState().nodes;
    const currentEdges = useWorkflowStore.getState().edges;

    if (currentNodes.length === 0) {
      alert('❌ Add some agents to the workflow first!');
      return;
    }

    // Validate workflow inputs before execution
    console.log('🔍 Validating workflow inputs...');
    const validation = validateWorkflowInput(currentNodes);
    
    if (!validation.isValid) {
      // Show validation error in a nice modal/alert
      const errorModal = document.createElement('div');
      errorModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      
      errorModal.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          border: 2px solid rgba(239, 68, 68, 0.3);
          border-radius: 24px;
          padding: 32px;
          max-width: 500px;
          margin: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        ">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h3 style="color: #ef4444; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">
              Input Required
            </h3>
            <p style="color: #9ca3af; margin: 0;">
              Please add text to your agent inputs
            </p>
          </div>
          
          <div style="
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
          ">
            <pre style="
              color: #fca5a5;
              font-size: 14px;
              line-height: 1.5;
              margin: 0;
              white-space: pre-wrap;
              font-family: inherit;
            ">${validation.error}</pre>
          </div>
          
          <button id="closeErrorModal" style="
            width: 100%;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            Got it, I'll add some text
          </button>
        </div>
      `;
      
      document.body.appendChild(errorModal);
      
      // Add click event to close button
      const closeButton = errorModal.querySelector('#closeErrorModal');
      closeButton.addEventListener('click', () => {
        errorModal.remove();
      });
      
      // Remove modal when clicking outside
      errorModal.addEventListener('click', (e) => {
        if (e.target === errorModal) {
          errorModal.remove();
        }
      });
      
      console.log('❌ Workflow execution stopped due to empty input');
      return;
    }

    console.log('✅ Input validation passed');
    
    // Check for cycles/backward edges and inform user
    const executionOrder = getExecutionOrder();
    const hasCycles = executionOrder.length > nodes.length;
    
    if (hasCycles) {
      console.log('🔄 CYCLIC WORKFLOW DETECTED');
      console.log('   → Some agents will be executed multiple times');
      console.log('   → Backward edges (feedback loops) found in red dashed lines');
      console.log('   → This enables iterative refinement and backpropagation-like behavior');
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 WORKFLOW EXECUTION STARTED');
    console.log('═══════════════════════════════════════════════════');

    setIsRunning(true);

    try {
      const executionOrder = getExecutionOrder();
      
      if (executionOrder.length === 0) {
        throw new Error('No nodes to execute. Make sure nodes are properly connected.');
      }

      console.log(`\n📋 Execution Plan:`);
      executionOrder.forEach((node, i) => {
        console.log(`   ${i + 1}. ${node.data.label} (${node.id})`);
      });
      
      if (executionOrder.length > nodes.length) {
        console.log(`\n🔄 Note: ${executionOrder.length - nodes.length} additional iterations due to cycles`);
      }
      console.log('\n');

      // Reset all nodes to idle state
      console.log('🔄 Resetting all nodes...');
      for (const node of executionOrder) {
        updateNode(node.id, { status: 'idle', output: null });
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Execute each node in order
      for (let i = 0; i < executionOrder.length; i++) {
        // Check if execution was stopped
        if (useWorkflowStore.getState().isExecutionStopped) {
          console.log('🛑 Execution stopped by user');
          return;
        }
        
        const node = executionOrder[i];
        
        console.log(`\n${'='.repeat(50)}`);
        console.log(`▶️  STEP ${i + 1}/${executionOrder.length}: ${node.data.label}`);
        console.log(`${'='.repeat(50)}`);

        // Get fresh node data from store
        const freshNodes = useWorkflowStore.getState().nodes;
        const freshNode = freshNodes.find(n => n.id === node.id);

        // Get agent type early so we can use it
        const agentType = freshNode?.data?.agentType;

        // Get input from connected nodes
        const incomingEdges = currentEdges.filter(e => e.target === node.id);
        let combinedInput = freshNode?.data?.input || '';

        if (incomingEdges.length > 0) {
          console.log(`📥 Collecting input from ${incomingEdges.length} upstream node(s)...`);
          
          // For Twitter, collect ALL upstream outputs recursively
          if (agentType === 'twitter') {
            const allUpstreamOutputs = [];
            const visited = new Set();
            
            // Recursive function to get all upstream nodes
            const collectAllUpstream = (nodeId) => {
              if (visited.has(nodeId)) return;
              visited.add(nodeId);
              
              const currentNode = freshNodes.find(n => n.id === nodeId);
              if (currentNode?.data?.output) {
                console.log(`   ✓ Collected from ${currentNode.data.label}`);
                allUpstreamOutputs.push(currentNode.data.output);
              }
              
              // Get all nodes that connect to this node
              const upstreamEdges = currentEdges.filter(e => e.target === nodeId);
              upstreamEdges.forEach(edge => {
                collectAllUpstream(edge.source);
              });
            };
            
            // Start collecting from direct upstream nodes
            incomingEdges.forEach(edge => {
              collectAllUpstream(edge.source);
            });
            
            combinedInput = allUpstreamOutputs;
            console.log(`   📦 Collected ${allUpstreamOutputs.length} outputs from ALL upstream agents`);
          } else {
            // For other agents, just get direct upstream
            const sourceOutputs = incomingEdges
              .map(edge => {
                const sourceNode = freshNodes.find(n => n.id === edge.source);
                const output = sourceNode?.data?.output;
                
                if (!output) {
                  console.log(`   ⚠️  No output from ${sourceNode?.data?.label || 'unknown node'}`);
                  return '';
                }

                console.log(`   ✓ Received from ${sourceNode.data.label}`);
                
                // If output is an object, convert to readable string
                if (typeof output === 'object') {
                  return JSON.stringify(output, null, 2);
                }
                return String(output);
              })
              .filter(Boolean);

            if (sourceOutputs.length > 0) {
              combinedInput = sourceOutputs.join('\n\n---\n\n') + (combinedInput ? '\n\n' + combinedInput : '');
              console.log(`   📝 Combined input length: ${combinedInput.length} characters`);
            }
          }
        } else {
          console.log(`📝 Using node's own input: "${combinedInput.substring(0, 50)}${combinedInput.length > 50 ? '...' : ''}"`);
        }

        // Update node status to running
        updateNode(node.id, { 
          status: 'running', 
          output: '⏳ Processing...' 
        });

        console.log(`⚙️  Executing ${node.data.label}...`);

        try {
          // agentType already declared above
          if (!agentType) {
            throw new Error(`Node ${node.data.label} is missing agentType`);
          }

          console.log(`   Agent Type: ${agentType}`);
          
          // Special handling for Twitter agent
          if (agentType === 'twitter') {
            console.log(`   🐦 Twitter Agent - Processing input...`);
            
            // Extract Twitter data from combined input
            let twitterData = {};
            
            try {
              // combinedInput is already an array of objects from upstream agents
              const parsed = Array.isArray(combinedInput) ? combinedInput : 
                             (typeof combinedInput === 'string' ? JSON.parse(combinedInput) : combinedInput);
              
              if (Array.isArray(parsed)) {
                // Multiple upstream outputs
                let images = [];
                let text = '';
                let strategyData = null;
                
                parsed.forEach(output => {
                  console.log('   🔍 Examining output:', typeof output, output);
                  
                  // Extract images (max 4 for Twitter)
                  if (output.type === 'visual_with_images') {
                    console.log('   🎨 Visual output found');
                    if (output.selected_image?.url) {
                      images.push(output.selected_image.url);
                    } else if (output.images?.[0]?.url) {
                      images.push(output.images[0].url);
                    }
                  }
                  
                  // Extract FULL CAMPAIGN STRATEGY
                  if (output.core_concept || output.tagline || output.target_audience) {
                    console.log('   🎯 STRATEGY DATA FOUND!');
                    console.log('   📊 Strategy:', output);
                    strategyData = output;
                  }
                  
                  // Extract text/caption as fallback
                  if (output.captions?.[0] && !text) {
                    text = output.captions[0];
                    console.log('   ✍️ Caption found:', text);
                  } else if (output.cta && !text) {
                    text = output.cta;
                  }
                });
                
                console.log('   📦 FINAL DATA TO SEND:');
                console.log('   - Images:', images.length);
                console.log('   - Text:', text ? text.substring(0, 50) : 'NONE');
                console.log('   - Strategy:', strategyData ? 'YES' : 'NO');
                
                // Send strategy data to backend - Gemini will create the tweet!
                console.log('   📦 Sending strategy data to backend for Gemini AI tweet generation!');
                
                twitterData = {
                  images: images.slice(0, 4),  // Twitter max 4 images
                  text: text || '',  // Fallback text
                  strategy_data: strategyData  // Send full strategy - Gemini will use this!
                };
              } else if (parsed.images) {
                // Already formatted
                twitterData = parsed;
              } else if (parsed.type === 'visual_with_images') {
                // Single visual output
                const imageUrl = parsed.selected_image?.url || parsed.images?.[0]?.url;
                twitterData = {
                  images: imageUrl ? [imageUrl] : [],
                  text: freshNode?.data?.input || ''
                };
              }
            } catch (e) {
              // Not JSON, treat as plain text
              twitterData = {
                images: [],
                text: combinedInput || ''
              };
            }
            
            // Truncate to 280 characters for Twitter
            if (twitterData.text && twitterData.text.length > 280) {
              twitterData.text = twitterData.text.substring(0, 277) + '...';
              console.log(`   ✂️ Text truncated to 280 characters`);
            }
            
            console.log(`   📦 Twitter data prepared:`, twitterData);
            
            // Check if execution was stopped before API call
            if (useWorkflowStore.getState().isExecutionStopped) {
              console.log('🛑 Execution stopped before Twitter API call');
              return;
            }
            
            const result = await agentAPI.runAgent(agentType, twitterData);
            console.log(`✅ ${node.data.label} completed successfully!`);
            console.log(`   Output:`, result);
            
            updateNode(node.id, {
              status: 'success',
              output: result,
              lastRun: new Date().toISOString(),
            });
          } else {
            // Check if execution was stopped before API call
            if (useWorkflowStore.getState().isExecutionStopped) {
              console.log('🛑 Execution stopped before regular agent API call');
              return;
            }
            
            // Regular agent execution
            const result = await agentAPI.runAgent(agentType, combinedInput);
            
            console.log(`✅ ${node.data.label} completed successfully!`);
            console.log(`   Output type: ${typeof result}`);
            
            // Update node with result
            updateNode(node.id, {
              status: 'success',
              output: result,
              lastRun: new Date().toISOString(),
            });
          }

          // Wait a bit for visual feedback and state update
          await new Promise(resolve => setTimeout(resolve, 800));
          
        } catch (error) {
          console.error(`❌ ${node.data.label} FAILED!`);
          console.error(`   Error: ${error.message}`);
          console.error(`   Stack:`, error.stack);
          
          updateNode(node.id, {
            status: 'error',
            output: `Error: ${error.message}`,
          });
          
          throw error;
        }
      }

      console.log(`\n${'='.repeat(50)}`);
      console.log('✨ WORKFLOW COMPLETED SUCCESSFULLY!');
      console.log(`${'='.repeat(50)}`);
      console.log(`✓ Executed ${executionOrder.length} agent(s)`);
      if (executionOrder.length > nodes.length) {
        console.log(`✓ Cycles processed: ${executionOrder.length - nodes.length} additional iterations`);
      }
      console.log(`✓ Time: ${new Date().toLocaleTimeString()}`);
      
      const cycleInfo = executionOrder.length > nodes.length 
        ? `\n• Processed ${executionOrder.length - nodes.length} backward edges (cycles)`
        : '';
      
      alert(`✨ Workflow completed successfully!\n\n• Executed ${executionOrder.length} agent(s)${cycleInfo}\n• All nodes processed\n• Check console for details`);
      
    } catch (error) {
      console.error('\n❌ WORKFLOW FAILED!');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      alert(`❌ Workflow execution failed:\n\n${error.message}\n\nCheck the browser console (F12) for detailed logs.`);
    } finally {
      setIsRunning(false);
      console.log('\n' + '═'.repeat(50) + '\n');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <WorkflowNavbar 
        onRunWorkflow={runWorkflow}
        onStopWorkflow={stopWorkflow}
        isRunning={isRunning}
        isStopping={isStopping}
        reactFlowWrapper={reactFlowWrapper}
        reactFlowInstance={reactFlowInstance}
        activeUsers={activeUsers}
        isCollaborating={isConnected}
        workflowId={workflowId}
        currentUser={currentUser}
        onOpenInviteModal={onOpenInviteModal}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div 
          className="flex-1 bg-gradient-to-br from-gray-800/50 to-gray-900/50 relative" 
          ref={reactFlowWrapper}
          onDragOver={onFileDragOver}
          onDragLeave={onFileDragLeave}
          onDrop={onFileDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background color="rgba(173, 248, 45, 0.1)" gap={16} />
            <Controls className="bg-white/10 backdrop-blur-md border-white/20" />
            <MiniMap
              nodeColor={(node) => {
                const colors = {
                  strategy: 'rgb(173, 248, 45)',
                  copywriting: '#60a5fa',
                  visual: '#fb923c',
                  research: '#a78bfa',
                  media: '#f472b6',
                };
                return colors[node.data.agentType] || 'rgb(173, 248, 45)';
              }}
              className="bg-white/10 backdrop-blur-md border-white/20"
              maskColor="rgba(0, 0, 0, 0.6)"
            />
          </ReactFlow>

          {/* File drop overlay */}
          {isDraggingFile && (
            <div 
              className="absolute inset-0 backdrop-blur-sm border-4 border-dashed flex items-center justify-center z-50 pointer-events-none"
              style={{
                backgroundColor: 'rgba(173, 248, 45, 0.1)',
                borderColor: 'rgb(173, 248, 45)',
              }}
            >
              <div 
                className="p-8 rounded-3xl backdrop-blur-md border shadow-2xl"
                style={{
                  backgroundColor: 'rgba(173, 248, 45, 0.1)',
                  borderColor: 'rgb(173, 248, 45)',
                }}
              >
                <div className="text-center">
                  <Upload className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgb(173, 248, 45)' }} />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Drop Workflow JSON Here
                  </h3>
                  <p className="text-white/80">
                    Import and load your saved workflow
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty state message */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="text-center backdrop-blur-md p-8 rounded-3xl border shadow-2xl"
            style={{
              backgroundColor: 'rgba(173, 248, 45, 0.1)',
              borderColor: 'rgba(173, 248, 45, 0.3)',
            }}
          >
            <h3 className="text-xl font-bold mb-2 text-white">
              Start Building Your Workflow
            </h3>
            <p className="text-sm mb-4 text-white/80">
              Drag agents from the sidebar and drop them here
            </p>
            <div className="text-xs text-white/60 pt-4 border-t border-white/20">
              <Upload className="w-4 h-4 inline mr-1" style={{ color: 'rgb(173, 248, 45)' }} />
              Or drag & drop a workflow JSON file to import
            </div>
          </div>
        </div>
      )}

      {/* Remote Cursors */}
      <RemoteCursors cursors={cursors} />

      {/* Collaboration Chat */}
      <CollaborationChat
        chatMessages={chatMessages}
        activeUsers={activeUsers}
        sendChatMessage={sendChatMessage}
        currentUser={currentUser}
        isConnected={isConnected}
        onOpenInviteModal={onOpenInviteModal}
        workflowId={workflowId}
      />
    </div>
  );
}

function WorkflowBuilder({ onOpenInviteModal }) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner onOpenInviteModal={onOpenInviteModal} />
    </ReactFlowProvider>
  );
}

export default WorkflowBuilder;
