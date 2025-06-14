import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const CodeEditor = ({ activeFile, onFileChange, theme, aiSuggestions }) => {
  const [content, setContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const textareaRef = useRef(null);

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content || '');
    }
  }, [activeFile]);

  const handleTextChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (onFileChange && activeFile) {
      onFileChange(activeFile.id, newContent);
    }
    updateCursorPosition();
  };

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
      
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
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
      rust: '#000000'
    };
    return colors[language] || '#6b7280';
  };

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">No file selected</h2>
          <p>Select a file from the explorer to start coding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="text-white font-medium">{activeFile.name}</div>
          <Badge 
            style={{ backgroundColor: getLanguageColor(activeFile.language) }}
            className="text-xs"
          >
            {activeFile.language}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          <span>UTF-8</span>
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
        </div>
        <div className="flex items-center space-x-4">
          <span>Words: {content.split(/\s+/).filter(word => word.length > 0).length}</span>
          <span>Characters: {content.length}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;