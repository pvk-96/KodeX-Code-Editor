import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { fileAPI, aiAPI } from '../services/api';

const CodeEditor = ({ activeFile, onFileChange, theme, onFileUpdate }) => {
  const [content, setContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content || '');
      setHasChanges(false);
      setLastSaved(activeFile.modified_at);
    }
  }, [activeFile]);

  // Auto-save functionality
  useEffect(() => {
    if (hasChanges && activeFile) {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        saveFile();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, hasChanges, activeFile]);

  const saveFile = async () => {
    if (!activeFile || !hasChanges) return;

    try {
      setIsSaving(true);
      await fileAPI.updateFile(activeFile.path, content);
      setHasChanges(false);
      setLastSaved(new Date().toISOString());
      
      // Notify parent component
      if (onFileUpdate) {
        onFileUpdate(activeFile.id, content);
      }
    } catch (error) {
      console.error('Error saving file:', error);
      // Could show a toast notification here
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasChanges(true);
    
    if (onFileChange && activeFile) {
      onFileChange(activeFile.id, newContent);
    }
    
    updateCursorPosition();
    
    // Get AI suggestions for code completion
    if (activeFile && activeFile.language !== 'plaintext') {
      debounceGetSuggestions(newContent, activeFile.language);
    }
  };

  // Debounced function for getting AI suggestions
  const debounceGetSuggestions = useRef(
    debounce(async (code, language) => {
      if (!code.trim()) {
        setAiSuggestions([]);
        return;
      }

      try {
        const response = await aiAPI.getCodeSuggestions(
          code, 
          language, 
          textareaRef.current?.selectionStart || 0
        );
        setAiSuggestions(response.suggestions || []);
      } catch (error) {
        console.error('Error getting AI suggestions:', error);
        setAiSuggestions([]);
      }
    }, 1000)
  ).current;

  const updateCursorPosition = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const lines = textarea.value.substring(0, textarea.selectionStart).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      setCursorPosition({ line, column });
    }
  };

  const insertText = (text) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + text + content.substring(end);
      setContent(newContent);
      setHasChanges(true);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
        updateCursorPosition();
      }, 0);
    }
  };

  const getLanguageColor = (language) => {
    const colors = {
      javascript: '#f7df1e',
      python: '#3776ab',
      html: '#e34f26',
      css: '#1572b6',
      java: '#ed8b00',
      cpp: '#00599c',
      go: '#00add8',
      rust: '#000000',
      php: '#777bb4',
      ruby: '#cc342d'
    };
    return colors[language] || '#6b7280';
  };

  const handleKeyDown = (e) => {
    // Save on Ctrl+S
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveFile();
    }
  };

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">No file selected</h2>
          <p>Select a file from the explorer to start coding</p>
          <p className="text-sm mt-2 opacity-75">
            Your AI-powered coding assistant is ready to help!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="text-white font-medium flex items-center space-x-2">
            <span>{activeFile.name}</span>
            {hasChanges && <span className="text-yellow-400 text-xs">●</span>}
          </div>
          <Badge 
            style={{ backgroundColor: getLanguageColor(activeFile.language) }}
            className="text-xs text-white"
          >
            {activeFile.language}
          </Badge>
          {isSaving && (
            <Badge variant="secondary" className="text-xs">
              Saving...
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          {lastSaved && (
            <span>
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
          <span>UTF-8</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={saveFile}
            disabled={!hasChanges || isSaving}
            className="text-xs px-2 h-6"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* AI Suggestions Bar */}
      {aiSuggestions && aiSuggestions.length > 0 && (
        <div className="px-4 py-2 bg-blue-900/30 border-b border-blue-700">
          <div className="flex items-center space-x-2">
            <span className="text-blue-300 text-xs">🤖 AI Suggestions:</span>
            {aiSuggestions.slice(0, 3).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-6 px-2 bg-blue-800/50 border-blue-600 text-blue-200 hover:bg-blue-700/50"
                onClick={() => insertText(suggestion)}
              >
                {suggestion.length > 20 ? suggestion.substring(0, 20) + '...' : suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onClick={updateCursorPosition}
          onKeyUp={updateCursorPosition}
          className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none outline-none border-none"
          style={{
            lineHeight: '1.5',
            tabSize: 2,
          }}
          placeholder="Start typing your code..."
          spellCheck={false}
        />
        
        {/* Line numbers overlay */}
        <div className="absolute left-0 top-0 p-4 pointer-events-none">
          <div className="text-gray-500 font-mono text-sm select-none" style={{ lineHeight: '1.5' }}>
            {content.split('\n').map((_, index) => (
              <div key={index} className="text-right w-8">
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Footer */}
      <div className="px-4 py-1 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Spaces: 2</span>
          <span>Auto Save: On</span>
          <span>AI Assist: On</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Words: {content.split(/\s+/).filter(word => word.length > 0).length}</span>
          <span>Characters: {content.length}</span>
          <span>Lines: {content.split('\n').length}</span>
        </div>
      </div>
    </div>
  );
};

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default CodeEditor;