import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { mockTerminalHistory } from '../mock/mockData';

const Terminal = ({ isOpen, onToggle, activeFile }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState(mockTerminalHistory);
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const executeCommand = async (cmd) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    // Add to command history
    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);

    // Add command to terminal history
    const commandEntry = {
      command: trimmedCmd,
      output: '',
      type: 'running'
    };

    setHistory(prev => [...prev, commandEntry]);
    setIsRunning(true);

    // Simulate command execution
    setTimeout(() => {
      let output = '';
      let type = 'success';

      // Mock command responses
      if (trimmedCmd.startsWith('ls')) {
        output = 'index.html\nscript.js\nstyles.css\nhello.py\nREADME.md';
      } else if (trimmedCmd.startsWith('pwd')) {
        output = '/home/user/projects';
      } else if (trimmedCmd.startsWith('whoami')) {
        output = 'developer';
      } else if (trimmedCmd.startsWith('date')) {
        output = new Date().toString();
      } else if (trimmedCmd.startsWith('echo')) {
        output = trimmedCmd.substring(5);
      } else if (trimmedCmd.startsWith('cat') && activeFile) {
        output = activeFile.content || 'File is empty';
      } else if (trimmedCmd.startsWith('python') || trimmedCmd.startsWith('py')) {
        if (activeFile && activeFile.language === 'python') {
          output = 'Hello from Python!\nScript executed successfully.';
        } else {
          output = 'Python 3.9.7 - Ready to execute Python scripts';
        }
      } else if (trimmedCmd.startsWith('node') || trimmedCmd.startsWith('npm')) {
        if (activeFile && activeFile.language === 'javascript') {
          output = 'Hello from JavaScript!\nScript executed successfully.';
        } else {
          output = 'Node.js v16.14.0 - Ready to execute JavaScript';
        }
      } else if (trimmedCmd === 'clear') {
        setHistory([]);
        setIsRunning(false);
        return;
      } else if (trimmedCmd === 'help') {
        output = `Available commands:
ls         - List directory contents
pwd        - Show current directory
whoami     - Show current user
date       - Show current date and time
echo       - Display text
cat        - Display file contents
python/py  - Run Python scripts
node/npm   - Run JavaScript/Node.js
clear      - Clear terminal
help       - Show this help message

Mock terminal - commands are simulated for demo purposes.`;
      } else {
        output = `bash: ${trimmedCmd}: command not found`;
        type = 'error';
      }

      // Update the last command with output
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = {
          ...newHistory[newHistory.length - 1],
          output,
          type
        };
        return newHistory;
      });

      setIsRunning(false);
    }, 500 + Math.random() * 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim() && !isRunning) {
      executeCommand(command);
      setCommand('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="h-80 bg-gray-900 border-gray-700 flex flex-col">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm font-medium text-gray-200">Terminal</span>
          <Badge variant="secondary" className="text-xs">
            bash
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setHistory([])}
            className="text-xs px-2 h-6 hover:bg-gray-700"
          >
            Clear
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            className="text-xs px-2 h-6 hover:bg-gray-700"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-gray-900 text-gray-100"
      >
        {/* Welcome message */}
        <div className="text-green-400 mb-2">
          Welcome to CodeEditor Terminal v1.0.0
        </div>
        <div className="text-gray-400 mb-4">
          Type 'help' for available commands.
        </div>

        {/* Command history */}
        {history.map((entry, index) => (
          <div key={index} className="mb-2">
            <div className="flex items-center">
              <span className="text-green-400">user@codeeditor</span>
              <span className="text-white">:</span>
              <span className="text-blue-400">~/projects</span>
              <span className="text-white">$ </span>
              <span className="text-gray-100">{entry.command}</span>
            </div>
            {entry.output && (
              <div className={`mt-1 whitespace-pre-wrap ${
                entry.type === 'error' ? 'text-red-400' : 'text-gray-300'
              }`}>
                {entry.output}
              </div>
            )}
            {entry.type === 'running' && !entry.output && (
              <div className="flex items-center mt-1 text-yellow-400">
                <div className="animate-spin w-3 h-3 border border-yellow-400 border-t-transparent rounded-full mr-2"></div>
                Running...
              </div>
            )}
          </div>
        ))}

        {/* Current input line */}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-400">user@codeeditor</span>
          <span className="text-white">:</span>
          <span className="text-blue-400">~/projects</span>
          <span className="text-white">$ </span>
          <Input
            ref={inputRef}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 ml-1 bg-transparent border-none text-gray-100 font-mono text-sm p-0 focus:ring-0 focus:outline-none"
            placeholder="Enter command..."
            disabled={isRunning}
          />
        </form>
      </div>
    </Card>
  );
};

export default Terminal;