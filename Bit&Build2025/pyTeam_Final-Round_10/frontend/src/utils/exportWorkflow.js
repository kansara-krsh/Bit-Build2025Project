import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Hide controls and minimap before export
 */
function hideControlsForExport() {
  const controls = document.querySelector('.react-flow__controls');
  const minimap = document.querySelector('.react-flow__minimap');
  const attribution = document.querySelector('.react-flow__attribution');
  
  const hiddenElements = [];
  
  if (controls) {
    controls.style.display = 'none';
    hiddenElements.push({ element: controls, originalDisplay: controls.style.display });
  }
  if (minimap) {
    minimap.style.display = 'none';
    hiddenElements.push({ element: minimap, originalDisplay: minimap.style.display });
  }
  if (attribution) {
    attribution.style.display = 'none';
    hiddenElements.push({ element: attribution, originalDisplay: attribution.style.display });
  }
  
  return hiddenElements;
}

/**
 * Restore controls and minimap after export
 */
function restoreControlsAfterExport(hiddenElements) {
  hiddenElements.forEach(({ element }) => {
    element.style.display = '';
  });
}

/**
 * Export workflow as PNG image
 */
export async function exportWorkflowAsPNG(reactFlowWrapper, workflowName = 'workflow') {
  let hiddenElements = [];
  
  try {
    if (!reactFlowWrapper) {
      throw new Error('Canvas element not found');
    }

    // Hide controls before capture
    hiddenElements = hideControlsForExport();
    
    // Wait a bit for DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(reactFlowWrapper, {
      backgroundColor: '#1e293b',
      scale: 2,
      logging: false,
      useCORS: true,
      ignoreElements: (element) => {
        // Additional filter to ignore controls
        return element.classList.contains('react-flow__controls') ||
               element.classList.contains('react-flow__minimap') ||
               element.classList.contains('react-flow__attribution');
      }
    });

    // Restore controls
    restoreControlsAfterExport(hiddenElements);

    // Convert to PNG and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${workflowName.replace(/\s+/g, '-')}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');

    return { success: true };
  } catch (error) {
    // Make sure to restore controls even if export fails
    restoreControlsAfterExport(hiddenElements);
    console.error('Export PNG failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export workflow as PDF
 */
export async function exportWorkflowAsPDF(reactFlowWrapper, workflowName = 'workflow') {
  let hiddenElements = [];
  
  try {
    if (!reactFlowWrapper) {
      throw new Error('Canvas element not found');
    }

    // Hide controls before capture
    hiddenElements = hideControlsForExport();
    
    // Wait a bit for DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(reactFlowWrapper, {
      backgroundColor: '#1e293b',
      scale: 2,
      logging: false,
      useCORS: true,
      ignoreElements: (element) => {
        return element.classList.contains('react-flow__controls') ||
               element.classList.contains('react-flow__minimap') ||
               element.classList.contains('react-flow__attribution');
      }
    });

    // Restore controls
    restoreControlsAfterExport(hiddenElements);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${workflowName.replace(/\s+/g, '-')}.pdf`);

    return { success: true };
  } catch (error) {
    // Make sure to restore controls even if export fails
    restoreControlsAfterExport(hiddenElements);
    console.error('Export PDF failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export workflow with all node data as JSON
 */
export function exportWorkflowData(nodes, edges, workflowName = 'workflow') {
  try {
    const workflowData = {
      name: workflowName,
      exportedAt: new Date().toISOString(),
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node.data,
          // Include outputs for documentation
          output: node.data.output,
        },
      })),
      edges: edges,
    };

    const blob = new Blob([JSON.stringify(workflowData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${workflowName.replace(/\s+/g, '-')}-data.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Export data failed:', error);
    return { success: false, error: error.message };
  }
}

