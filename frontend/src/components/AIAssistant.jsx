import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { aiAPI } from '../services/api';

const AIAssistant = ({ isOpen, onToggle, onInsertCode }) => {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: query,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    const currentQuery = query;
    setQuery('');

    try {
      const response = await aiAPI.sendMessage(currentQuery, sessionId);
      
      // Set session ID if this is the first message
      if (!sessionId) {
        setSessionId(response.session_id);
      }

      const aiMessage = {
        type: 'ai',
        content: response.message.content,
        code_blocks: response.message.code_blocks || [],
        timestamp: new Date(response.message.timestamp)
      };

      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    setSessionId(null);
    setError(null);
  };

  const extractCodeBlocks = (text) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim()
      });
    }
    
    return blocks;
  };

  const formatMessage = (message) => {
    if (message.type === 'user') {
      return <div className="whitespace-pre-wrap">{message.content}</div>;
    }

    // Use code_blocks from AI response if available, otherwise extract from content
    const codeBlocks = message.code_blocks || extractCodeBlocks(message.content);
    
    if (codeBlocks.length === 0) {
      return <div className="whitespace-pre-wrap">{message.content}</div>;
    }

    const parts = message.content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.split('\n');
        const language = lines[0].replace('```', '') || 'plaintext';
        const code = lines.slice(1, -1).join('\n');
        
        return (
          <div key={index} className="my-3 bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-700">
              <Badge variant="secondary" className="text-xs">
                {language}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-2 hover:bg-gray-600"
                onClick={() => onInsertCode && onInsertCode(code)}
              >
                Insert
              </Button>
            </div>
            <pre className="p-3 text-sm text-gray-100 overflow-x-auto">
              <code>{code}</code>
            </pre>
          </div>
        );
      } else {
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part}
          </div>
        );
      }
    });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
      >
        🤖
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] bg-gray-800 border-gray-700 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-gray-200">AI Assistant</h3>
          <Badge variant="secondary" className="text-xs">
            Gemini
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={clearChat}
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

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-900/30 border-b border-red-700">
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <div className="text-4xl mb-4">🤖</div>
            <h4 className="font-medium mb-2">AI Assistant Ready</h4>
            <p className="text-sm">Ask me anything about coding, debugging, or best practices!</p>
            <p className="text-xs mt-2 opacity-75">Powered by Google Gemini AI</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <div className="text-sm">
                    {formatMessage(message)}
                  </div>
                  <div className="text-xs opacity-70 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm">Gemini is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me anything about coding..."
            className="flex-1 bg-gray-700 border-gray-600 text-gray-200"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={isLoading || !query.trim()}
            className="px-4"
          >
            {isLoading ? '...' : 'Send'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AIAssistant;