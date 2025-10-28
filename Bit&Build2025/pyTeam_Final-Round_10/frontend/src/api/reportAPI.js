// API utility for campaign report generation
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const generateCampaignReport = async (nodes, workflowName) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/generate-campaign-report`, {
      nodes,
      workflowName,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating campaign report:', error);
    throw error;
  }
};

export const downloadReport = (pdfUrl) => {
  window.open(pdfUrl, '_blank');
};
