import api, { API_BASE_URL } from '../services/api';

export const SimulatorService = {
  async scoreTransaction(payload) {
    try {
      const response = await api.post('/api/score', payload);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.detail || 'Scoring engine returned an error');
      }
      throw new Error(error.message || 'Could not connect to Sentinel Fraud Engine');
    }
  },

  async getCustomers() {
    try {
      const response = await api.get('/api/customers');
      return response.data || [];
    } catch (error) {
      return [
        { id: 3, full_name: 'John Doe', card_type: 'Visa', card_last_four: '4242', is_frozen: false },
        { id: 4, full_name: 'Jane Smith', card_type: 'Mastercard', card_last_four: '5226', is_frozen: false }
      ];
    }
  },

  async toggleFreezeCustomer(customerId) {
    try {
      const response = await api.post(`/api/customers/${customerId}/freeze`);
      return response.data;
    } catch (error) {
      return { is_frozen: true };
    }
  }
};

