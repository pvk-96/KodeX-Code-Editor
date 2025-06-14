import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CodeEditor from "./components/CodeEditor";
import FileExplorer from "./components/FileExplorer";
import AIAssistant from "./components/AIAssistant";
import Terminal from "./components/Terminal";
import LanguageInstaller from "./components/LanguageInstaller";
import ThemeSelector from "./components/ThemeSelector";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { preferencesAPI, healthAPI } from "./services/api";

const KodeXApp = () => {
  const [activeFile, setActiveFile] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [theme, setTheme] = useState({ id: 'dark', name: 'Dark', primary: '#1e1e1e', secondary: '#252526', accent: '#007acc' });
  const [preferences, setPreferences] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showLanguageInstaller, setShowLanguageInstaller] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [appError, setAppError] = useState(null);

  // Load user preferences and check health on mount
  useEffect(() => {
    loadPreferences();
    checkHealth();
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
    document.documentElement.style.setProperty('--theme-accent', theme.accent);
  }, [theme]);

  const loadPreferences = async () => {
    try {
      const prefs = await preferencesAPI.getPreferences();
      setPreferences(prefs);
      
      // Load themes and set current theme
      const themes = await preferencesAPI.getThemes();
      const currentTheme = themes.find(t => t.id === prefs.theme_id) || themes[0];
      setTheme(currentTheme);
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Use default preferences
    }
  };

  const checkHealth = async () => {
    try {
      const health = await healthAPI.check();
      setIsOnline(health.status === 'healthy');
      setAppError(null);
    } catch (error) {
      console.error('Health check failed:', error);
      setIsOnline(false);
      setAppError('Backend connection failed');
    }
  };

  const handleFileSelect = (file) => {
    setActiveFile(file);
    setSelectedFileId(file.id);
  };

  const handleFileChange = (fileId, newContent) => {
    // Update active file content locally (will be saved by auto-save)
    if (activeFile && activeFile.id === fileId) {
      setActiveFile({ ...activeFile, content: newContent });
    }
  };

  const handleFileUpdate = (fileId, newContent) => {
    // Handle file update confirmation from CodeEditor
    if (activeFile && activeFile.id === fileId) {
      setActiveFile({ ...activeFile, content: newContent });
    }
  };

  const insertCodeIntoEditor = (code) => {
    if (activeFile) {
      const newContent = activeFile.content + '\n' + code;
      handleFileChange(activeFile.id, newContent);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    
    try {
      await preferencesAPI.updatePreferences({ theme_id: newTheme.id });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Retry connection
  const retryConnection = () => {
    checkHealth();
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Top Menu Bar */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">KX</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-200">KodeX</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {activeFile && (
              <Badge variant="outline" className="text-xs">
                {activeFile.name}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowLanguageInstaller(true)}
            className="text-xs px-3 hover:bg-gray-700"
          >
            🔧 Languages
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowThemeSelector(true)}
            className="text-xs px-3 hover:bg-gray-700"
          >
            🎨 Themes
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowTerminal(!showTerminal)}
            className="text-xs px-3 hover:bg-gray-700"
          >
            💻 Terminal
          </Button>
          <div className="w-px h-4 bg-gray-600"></div>
          <div className="flex items-center space-x-1">
            <div 
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`}
            ></div>
            <span className="text-xs text-gray-400">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {!isOnline && (
              <Button
                size="sm"
                variant="ghost"
                onClick={retryConnection}
                className="text-xs px-2 h-5"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {appError && (
        <div className="px-4 py-2 bg-red-900/30 border-b border-red-700">
          <div className="text-red-300 text-sm flex items-center justify-between">
            <span>⚠️ {appError}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={retryConnection}
              className="text-xs px-2 h-6"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <FileExplorer
          onFileSelect={handleFileSelect}
          selectedFileId={selectedFileId}
          onFileChange={handleFileChange}
        />

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          <CodeEditor
            activeFile={activeFile}
            onFileChange={handleFileChange}
            onFileUpdate={handleFileUpdate}
            theme={theme}
          />

          {/* Terminal Panel */}
          {showTerminal && (
            <Terminal
              isOpen={showTerminal}
              onToggle={() => setShowTerminal(!showTerminal)}
              activeFile={activeFile}
            />
          )}
        </div>
      </div>

      {/* Floating Components */}
      <AIAssistant
        isOpen={showAI}
        onToggle={() => setShowAI(!showAI)}
        onInsertCode={insertCodeIntoEditor}
      />

      <LanguageInstaller
        isOpen={showLanguageInstaller}
        onToggle={() => setShowLanguageInstaller(false)}
      />

      <ThemeSelector
        isOpen={showThemeSelector}
        onToggle={() => setShowThemeSelector(false)}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
      />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<KodeXApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
