import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  generateCampaign: async (brief) => {
    const response = await axios.post(`${API_BASE_URL}/api/generate-campaign`, { brief });
    return response.data;
  },

  getCampaign: async (campaignId) => {
    const response = await axios.get(`${API_BASE_URL}/api/campaign/${campaignId}`);
    return response.data;
  },

  regenerateAsset: async (assetId, modifyInstructions = null) => {
    const response = await axios.post(`${API_BASE_URL}/api/regenerate-asset`, {
      asset_id: assetId,
      modify_instructions: modifyInstructions
    });
    return response.data;
  },

  listCampaigns: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/campaigns`);
    return response.data;
  },

  exportCampaign: async (campaignId) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/export-campaign/${campaignId}`,
      {},
      { responseType: 'blob' }
    );
    return response.data;
  }
};
