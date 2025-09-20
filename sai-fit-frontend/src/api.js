// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Update with your backend URL
});

export const loginUser = async (email, password) => {
  const { data } = await api.post('/users/login', { email, password });
  return data;
};

export const registerUser = async (name, email, password) => {
  const { data } = await api.post('/users', { name, email, password });
  return data;
};

export const getUserProfile = async (token) => {
  const { data } = await api.get('/users/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const getSports = async () => {
  const { data } = await api.get('/sports');
  return data;
};

export const requestAnalysis = async (videoUrl, sportId, testType, isQualificationAttempt, token) => {
  const { data } = await api.post('/videos/request-analysis', {
    videoUrl,
    sportId,
    testType,
    isQualificationAttempt,
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const getVideoHistory = async (token) => {
  const { data } = await api.get('/videos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

// Add other API calls as needed
export default api;