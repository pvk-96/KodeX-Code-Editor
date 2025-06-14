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
import { mockFileSystem, mockThemes, mockCompletions } from "./mock/mockData";

const CodeEditorApp = () => {
  const [fileSystem, setFileSystem] = useState(mockFileSystem);
  const [activeFile, setActiveFile] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [theme, setTheme] = useState(mockThemes[0]); // Dark theme by default
  const [showAI, setShowAI] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showLanguageInstaller, setShowLanguageInstaller] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
    document.documentElement.style.setProperty('--theme-accent', theme.accent);
  }, [theme]);

  // Generate AI suggestions based on active file content
  useEffect(() => {
    if (activeFile && activeFile.content) {
      const lastLine = activeFile.content.split('\n').pop();
      const suggestions = Object.keys(mockCompletions)
        .filter(key => lastLine.includes(key.trim()))
        .map(key => mockCompletions[key]);
      setAiSuggestions(suggestions.slice(0, 3));
    } else {
      setAiSuggestions([]);
    }
  }, [activeFile]);

  const handleFileSelect = (file) => {
    setActiveFile(file);
    setSelectedFileId(file.id);
  };

  const handleFileChange = (fileId, newContent) => {
    const updateFileContent = (items) => {
      return items.map(item => {
        if (item.id === fileId) {
          return { ...item, content: newContent };
        }
        if (item.children) {
          return { ...item, children: updateFileContent(item.children) };
        }
        return item;
      });
    };

    const updatedFileSystem = {
      ...fileSystem,
      children: updateFileContent(fileSystem.children)
    };

    setFileSystem(updatedFileSystem);
    
    // Update active file
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

  const findFileById = (items, fileId) => {
    for (const item of items) {
      if (item.id === fileId) {
        return item;
      }
      if (item.children) {
        const found = findFileById(item.children, fileId);
        if (found) return found;
      }
    }
    return null;
  };

  // Update active file when file system changes
  useEffect(() => {
    if (selectedFileId) {
      const updatedFile = findFileById(fileSystem.children, selectedFileId);
      if (updatedFile) {
        setActiveFile(updatedFile);
      }
    }
  }, [fileSystem, selectedFileId]);

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Top Menu Bar */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">CE</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-200">CodeEditor AI</h1>
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
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Online</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <FileExplorer
          fileSystem={fileSystem}
          onFileSelect={handleFileSelect}
          selectedFileId={selectedFileId}
          onUpdateFileSystem={setFileSystem}
        />

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          <CodeEditor
            activeFile={activeFile}
            onFileChange={handleFileChange}
            theme={theme}
            aiSuggestions={aiSuggestions}
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
        onThemeChange={setTheme}
      />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CodeEditorApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;