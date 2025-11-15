import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    credentials: 'include',
  },
});

// ISO date regex pattern
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

// Recursively convert ISO date strings to Date objects
const parseDates = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string' && ISO_DATE_REGEX.test(data)) {
    return new Date(data);
  }

  if (Array.isArray(data)) {
    return data.map(parseDates);
  }

  if (typeof data === 'object') {
    return Object.keys(data).reduce((acc, key) => {
      acc[key] = parseDates(data[key]);
      return acc;
    }, {} as any);
  }

  return data;
};

// Add request interceptor to handle FormData
apiClient.interceptors.request.use(
  (config) => {
    // If the data is FormData, remove Content-Type header so axios can set it with boundary
    if (config.data instanceof FormData) {
      if (config.headers) {
        // Handle both common headers and regular headers
        if ('common' in config.headers && config.headers.common) {
          delete (config.headers.common as any)['Content-Type'];
        }
        if ('Content-Type' in config.headers) {
          delete (config.headers as any)['Content-Type'];
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to automatically parse dates
apiClient.interceptors.response.use(
  (response) => {
    // Skip date parsing for blob responses (binary files)
    if (response.data instanceof Blob) {
      return response;
    }
    response.data = parseDates(response.data);
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient; 