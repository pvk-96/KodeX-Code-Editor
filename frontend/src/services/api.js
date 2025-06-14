import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// AI Chat API
export const aiAPI = {
  sendMessage: async (message, sessionId = null) => {
    const response = await apiClient.post('/ai/chat', {
      message,
      session_id: sessionId
    });
    return response.data;
  },

  getSessions: async () => {
    const response = await apiClient.get('/ai/sessions');
    return response.data;
  },

  getSessionMessages: async (sessionId) => {
    const response = await apiClient.get(`/ai/sessions/${sessionId}/messages`);
    return response.data;
  },

  getCodeSuggestions: async (code, language, cursorPosition) => {
    const response = await apiClient.post('/ai/suggestions', {
      code,
      language,
      cursor_position: cursorPosition
    });
    return response.data;
  }
};

// File System API
export const fileAPI = {
  getFileTree: async (path = '/') => {
    const response = await apiClient.get('/files', { params: { path } });
    return response.data;
  },

  getFile: async (path) => {
    const response = await apiClient.get(`/files/${encodeURIComponent(path)}`);
    return response.data;
  },

  createFile: async (name, parentPath = '/', type = 'file', content = '') => {
    const response = await apiClient.post('/files', {
      name,
      parent_path: parentPath,
      type,
      content
    });
    return response.data;
  },

  updateFile: async (path, content) => {
    const response = await apiClient.put(`/files/${encodeURIComponent(path)}`, {
      content
    });
    return response.data;
  },

  renameFile: async (path, newName) => {
    const response = await apiClient.patch(`/files/${encodeURIComponent(path)}`, {
      new_name: newName
    });
    return response.data;
  },

  deleteFile: async (path) => {
    const response = await apiClient.delete(`/files/${encodeURIComponent(path)}`);
    return response.data;
  },

  searchFiles: async (query, path = '/') => {
    const response = await apiClient.get(`/files/search/${encodeURIComponent(query)}`, {
      params: { path }
    });
    return response.data;
  }
};

// Terminal API
export const terminalAPI = {
  executeCommand: async (command, workingDirectory = '/tmp/codeeditor') => {
    const response = await apiClient.post('/terminal/execute', {
      command,
      working_directory: workingDirectory
    });
    return response.data;
  },

  getHistory: async (limit = 50) => {
    const response = await apiClient.get('/terminal/history', { params: { limit } });
    return response.data;
  },

  clearHistory: async () => {
    const response = await apiClient.delete('/terminal/history');
    return response.data;
  }
};

// Language Management API
export const languageAPI = {
  getLanguages: async () => {
    const response = await apiClient.get('/languages');
    return response.data;
  },

  searchLanguages: async (query) => {
    const response = await apiClient.get(`/languages/search/${encodeURIComponent(query)}`);
    return response.data;
  },

  installLanguage: async (languageId) => {
    const response = await apiClient.post(`/languages/${languageId}/install`);
    return response.data;
  },

  uninstallLanguage: async (languageId) => {
    const response = await apiClient.delete(`/languages/${languageId}`);
    return response.data;
  }
};

// Theme and Preferences API
export const preferencesAPI = {
  getThemes: async () => {
    const response = await apiClient.get('/themes');
    return response.data;
  },

  getPreferences: async () => {
    const response = await apiClient.get('/preferences');
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await apiClient.put('/preferences', preferences);
    return response.data;
  }
};

// Health Check API
export const healthAPI = {
  check: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  }
};

export default apiClient;