import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';

const useWorkflowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  workflowName: 'Untitled Workflow',
  isExecutionStopped: false,
  
  // Node management
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  onConnect: (connection) => {
    const { nodes, edges } = get();
    
    // Detect if this is a backward edge (creates a cycle)
    const wouldCreateCycle = (newConnection) => {
      const tempEdges = [...edges, newConnection];
      const visited = new Set();
      const recStack = new Set();
      
      const dfs = (nodeId) => {
        if (recStack.has(nodeId)) return true; // Cycle detected
        if (visited.has(nodeId)) return false;
        
        visited.add(nodeId);
        recStack.add(nodeId);
        
        const outgoing = tempEdges.filter(e => e.source === nodeId);
        for (const edge of outgoing) {
          if (dfs(edge.target)) return true;
        }
        
        recStack.delete(nodeId);
        return false;
      };
      
      return dfs(newConnection.source);
    };
    
    const isBackwardEdge = wouldCreateCycle(connection);
    
    // Style the edge based on whether it's backward
    const edgeStyle = isBackwardEdge 
      ? { 
          stroke: '#FF6B6B', 
          strokeWidth: 3, 
          strokeDasharray: '5,5',
        }
      : { 
          stroke: '#5B9DFE' 
        };
    
    const newEdge = { 
      ...connection, 
      animated: true, 
      style: edgeStyle,
      data: { isBackward: isBackwardEdge }
    };
    
    set({
      edges: addEdge(newEdge, edges),
    });
  },
  
  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },
  
  updateNode: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },
  
  removeNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    });
  },
  
  // Workflow management
  setWorkflowName: (name) => set({ workflowName: name }),
  
  // Execution control
  stopExecution: () => set({ isExecutionStopped: true }),
  resetExecutionState: () => set({ isExecutionStopped: false }),
  
  saveWorkflow: () => {
    const workflow = {
      name: get().workflowName,
      nodes: get().nodes,
      edges: get().edges,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('brandmind_workflow', JSON.stringify(workflow));
    return workflow;
  },
  
  loadWorkflow: () => {
    const saved = localStorage.getItem('brandmind_workflow');
    if (saved) {
      const workflow = JSON.parse(saved);
      set({
        nodes: workflow.nodes || [],
        edges: workflow.edges || [],
        workflowName: workflow.name || 'Untitled Workflow',
      });
      return true;
    }
    return false;
  },
  
  clearWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      workflowName: 'Untitled Workflow',
    });
  },
  
  // Get execution order based on connections (supports cycles/backward edges)
  getExecutionOrder: () => {
    const nodes = get().nodes;
    const edges = get().edges;
    
    if (nodes.length === 0) return [];
    
    // Detect cycles and handle backward edges
    const hasCycles = () => {
      const visited = new Set();
      const recStack = new Set();
      
      const dfs = (nodeId) => {
        if (recStack.has(nodeId)) return true; // Cycle detected
        if (visited.has(nodeId)) return false;
        
        visited.add(nodeId);
        recStack.add(nodeId);
        
        const outgoingEdges = edges.filter(e => e.source === nodeId);
        for (const edge of outgoingEdges) {
          if (dfs(edge.target)) return true;
        }
        
        recStack.delete(nodeId);
        return false;
      };
      
      for (const node of nodes) {
        if (!visited.has(node.id) && dfs(node.id)) {
          return true;
        }
      }
      return false;
    };
    
    // If there are cycles, use a different execution strategy
    if (hasCycles()) {
      console.log('🔄 Cycles detected - using iterative execution strategy');
      
      // For cyclic workflows, we'll execute in multiple iterations
      // Each iteration processes nodes whose dependencies are satisfied
      const executionPlan = [];
      const processedNodes = new Set();
      const maxIterations = nodes.length * 3; // Allow for multiple passes
      
      // Track node execution count to prevent infinite loops
      const nodeExecutionCount = new Map();
      nodes.forEach(node => nodeExecutionCount.set(node.id, 0));
      
      for (let iteration = 0; iteration < maxIterations; iteration++) {
        const iterationNodes = [];
        
        for (const node of nodes) {
          // Skip if already processed enough times
          if (nodeExecutionCount.get(node.id) >= 2) continue;
          
          // Check if dependencies are satisfied
          const incomingEdges = edges.filter(e => e.target === node.id);
          
          if (incomingEdges.length === 0) {
            // Root node - can always execute
            iterationNodes.push(node);
          } else {
            // Check if at least one dependency is satisfied
            const hasSatisfiedDependency = incomingEdges.some(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              return processedNodes.has(edge.source) || 
                     (sourceNode && sourceNode.data && sourceNode.data.output !== null);
            });
            
            if (hasSatisfiedDependency) {
              iterationNodes.push(node);
            }
          }
        }
        
        if (iterationNodes.length === 0) break; // No more nodes to execute
        
        // Add to execution plan and track
        for (const node of iterationNodes) {
          executionPlan.push(node);
          processedNodes.add(node.id);
          nodeExecutionCount.set(node.id, nodeExecutionCount.get(node.id) + 1);
        }
        
        console.log(`🔄 Iteration ${iteration + 1}: Scheduled ${iterationNodes.length} nodes`);
      }
      
      console.log(`📋 Cyclic execution plan: ${executionPlan.length} total executions for ${nodes.length} nodes`);
      return executionPlan;
    }
    
    // Original topological sort for acyclic workflows
    const order = [];
    const visited = new Set();
    const inDegree = new Map();
    
    // Calculate in-degrees
    nodes.forEach(node => inDegree.set(node.id, 0));
    edges.forEach(edge => {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });
    
    // Find nodes with no dependencies
    const queue = nodes.filter(node => inDegree.get(node.id) === 0);
    
    while (queue.length > 0) {
      const node = queue.shift();
      order.push(node);
      visited.add(node.id);
      
      // Find dependent nodes
      edges
        .filter(edge => edge.source === node.id)
        .forEach(edge => {
          inDegree.set(edge.target, inDegree.get(edge.target) - 1);
          if (inDegree.get(edge.target) === 0) {
            const nextNode = nodes.find(n => n.id === edge.target);
            if (nextNode) queue.push(nextNode);
          }
        });
    }
    
    return order;
  },
}));

export default useWorkflowStore;

