import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const createTrip = async (formData) => {
  try {
    return await axios.post(`${API_BASE_URL}/trips/create/`, formData);
  } catch (error) {
    throw error.response && error.response.data ? new Error(JSON.stringify(error.response.data)) : error;
  }
};