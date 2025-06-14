import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { terminalAPI } from '../services/api';

const Terminal = ({ isOpen, onToggle, activeFile }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [workingDirectory, setWorkingDirectory] = useState('/tmp/codeeditor');
  const [error, setError] = useState(null);
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

  // Load command history on mount
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      const terminalHistory = await terminalAPI.getHistory(20);
      setHistory(terminalHistory.map(cmd => ({
        command: cmd.command,
        output: cmd.output,
        type: cmd.exit_code === 0 ? 'success' : 'error',
        working_directory: cmd.working_directory,
        execution_time: cmd.execution_time
      })));
    } catch (error) {
      console.error('Error loading terminal history:', error);
    }
  };

  const executeCommand = async (cmd) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    // Add to command history
    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);

    // Add command to terminal display
    const commandEntry = {
      command: trimmedCmd,
      output: '',
      type: 'running',
      working_directory: workingDirectory
    };

    setHistory(prev => [...prev, commandEntry]);
    setIsRunning(true);
    setError(null);

    try {
      const response = await terminalAPI.executeCommand(trimmedCmd, workingDirectory);
      const result = response.command;

      // Update the last command with results
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = {
          command: result.command,
          output: result.output,
          type: result.exit_code === 0 ? 'success' : 'error',
          working_directory: result.working_directory,
          execution_time: result.execution_time
        };
        return newHistory;
      });

      // Update working directory if command was successful
      if (result.exit_code === 0) {
        setWorkingDirectory(result.working_directory);
      }

    } catch (error) {
      console.error('Error executing command:', error);
      setError('Failed to execute command');
      
      // Update the last command with error
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = {
          command: trimmedCmd,
          output: `Error: ${error.message}`,
          type: 'error',
          working_directory: workingDirectory
        };
        return newHistory;
      });
    } finally {
      setIsRunning(false);
    }
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

  const clearTerminal = async () => {
    setHistory([]);
    try {
      await terminalAPI.clearHistory();
    } catch (error) {
      console.error('Error clearing terminal history:', error);
    }
  };

  const getPrompt = () => {
    const dir = workingDirectory.replace('/tmp/codeeditor', '~');
    return `user@kodex:${dir}$`;
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
            onClick={clearTerminal}
            className="text-xs px-2 h-6 hover:bg-gray-700"
            disabled={isRunning}
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

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-900/30 border-b border-red-700">
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-gray-900 text-gray-100"
      >
        {/* Welcome message */}
        {history.length === 0 && (
          <>
            <div className="text-green-400 mb-2">
              Welcome to KodeX Terminal v1.0.0
            </div>
            <div className="text-gray-400 mb-4">
              Type 'help' for available commands.
            </div>
          </>
        )}

        {/* Command history */}
        {history.map((entry, index) => (
          <div key={index} className="mb-2">
            <div className="flex items-center">
              <span className="text-green-400">user@kodex</span>
              <span className="text-white">:</span>
              <span className="text-blue-400">{entry.working_directory?.replace('/tmp/codeeditor', '~') || '~'}</span>
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
            {entry.execution_time && (
              <div className="text-xs text-gray-500 mt-1">
                Executed in {(entry.execution_time * 1000).toFixed(0)}ms
              </div>
            )}
          </div>
        ))}

        {/* Current input line */}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-400">user@kodex</span>
          <span className="text-white">:</span>
          <span className="text-blue-400">{workingDirectory.replace('/tmp/codeeditor', '~')}</span>
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