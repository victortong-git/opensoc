import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Default 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request with new token
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Don't log 404 errors for expected endpoints and handle them gracefully
    if (error.response?.status === 404 && 
        (error.config?.url?.includes('/nat-results') || 
         error.config?.url?.includes('/orchestration-results'))) {
      // These are expected when no results exist yet - suppress logging
      error.config.suppressLog = true;
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// API response wrapper
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

// Generic API methods
export const apiRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.get(url, config).then(response => response.data),
    
  // Special method for optional endpoints that may not exist (like nat-results)
  // Uses native fetch to completely suppress 404 console errors
  getOptional: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T> | null> => {
    try {
      const token = localStorage.getItem('accessToken');
      const fullUrl = `${API_BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...config?.headers,
        },
        signal: config?.signal,
      });

      // Handle 404s silently (no console error)
      if (response.status === 404) {
        return null;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // Only throw for real network errors, not 404s
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  },
    
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    // Special timeout handling for AI operations
    if (url.includes('/test-data/generate')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for AI generation
    } else if (url.includes('/ai-analysis')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for AI analysis
    } else if (url.includes('/ai-classification')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for AI classification
    } else if (url.includes('/ai-generate-incident-form')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for AI incident form generation
    } else if (url.includes('/proof-read')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for AI proofreading
    } else if (url.includes('/enhance-content')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for AI content enhancement
    } else if (url.includes('/enhance-all-content')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for AI bulk content enhancement
    } else if (url.includes('/mitre/ai/analyze')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for MITRE AI analysis
    } else if (url.includes('/mitre/ai/')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for all MITRE AI operations
    } else if (url.includes('/mitre-enhance')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for MITRE threat hunt enhancement
    } else if (url.includes('/generate-threat-hunt')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for AI threat hunt generation
    } else if (url.includes('/chat/message')) {
      config = { ...config, timeout: 300000 }; // 5 minutes for AI chat operations
    } else if (url.includes('/orchestration')) {
      config = { ...config, timeout: 900000 }; // 15 minutes for orchestration analysis
    }
    return api.post(url, data, config).then(response => response.data);
  },
    
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.put(url, data, config).then(response => response.data),
    
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.delete(url, config).then(response => response.data),
};

export default api;