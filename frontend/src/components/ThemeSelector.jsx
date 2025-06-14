import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { mockThemes } from '../mock/mockData';

const ThemeSelector = ({ isOpen, onToggle, currentTheme, onThemeChange }) => {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  const applyTheme = (theme) => {
    setSelectedTheme(theme);
    onThemeChange(theme);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gray-800 border-gray-700 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-200">Theme Selector</h3>
          <Badge variant="secondary" className="text-xs">
            {selectedTheme.name}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggle}
          className="text-xs px-2 h-6 hover:bg-gray-700"
        >
          ✕
        </Button>
      </div>

      {/* Theme Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {mockThemes.map((theme) => (
            <div
              key={theme.id}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                selectedTheme.id === theme.id
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => applyTheme(theme)}
            >
              {/* Theme Preview */}
              <div className="h-24 p-3" style={{ backgroundColor: theme.primary }}>
                <div 
                  className="h-full rounded-md p-2 flex flex-col justify-between"
                  style={{ backgroundColor: theme.secondary }}
                >
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="space-y-1">
                    <div 
                      className="h-1 w-full rounded"
                      style={{ backgroundColor: theme.accent }}
                    ></div>
                    <div 
                      className="h-1 w-3/4 rounded opacity-60"
                      style={{ backgroundColor: theme.accent }}
                    ></div>
                    <div 
                      className="h-1 w-1/2 rounded opacity-40"
                      style={{ backgroundColor: theme.accent }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Theme Info */}
              <div className="p-3 bg-gray-700">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-200 text-sm">
                    {theme.name}
                  </h4>
                  {selectedTheme.id === theme.id && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex space-x-1 mt-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-500"
                    style={{ backgroundColor: theme.primary }}
                    title={`Primary: ${theme.primary}`}
                  ></div>
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-500"
                    style={{ backgroundColor: theme.secondary }}
                    title={`Secondary: ${theme.secondary}`}
                  ></div>
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-500"
                    style={{ backgroundColor: theme.accent }}
                    title={`Accent: ${theme.accent}`}
                  ></div>
                </div>
              </div>

              {/* Selected indicator */}
              {selectedTheme.id === theme.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Choose a theme that suits your coding style
        </div>
        <Button
          onClick={onToggle}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Apply & Close
        </Button>
      </div>
    </Card>
  );
};

export default ThemeSelector;