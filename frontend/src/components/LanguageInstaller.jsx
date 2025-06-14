import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { languageAPI } from '../services/api';

const LanguageInstaller = ({ isOpen, onToggle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [languages, setLanguages] = useState([]);
  const [filteredLanguages, setFilteredLanguages] = useState([]);
  const [installing, setInstalling] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load languages on mount
  useEffect(() => {
    if (isOpen) {
      loadLanguages();
    }
  }, [isOpen]);

  // Filter languages when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      searchLanguages();
    } else {
      setFilteredLanguages(languages);
    }
  }, [searchTerm, languages]);

  const loadLanguages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const langs = await languageAPI.getLanguages();
      setLanguages(langs);
      setFilteredLanguages(langs);
    } catch (error) {
      console.error('Error loading languages:', error);
      setError('Failed to load languages');
    } finally {
      setIsLoading(false);
    }
  };

  const searchLanguages = async () => {
    if (!searchTerm.trim()) {
      setFilteredLanguages(languages);
      return;
    }

    try {
      const results = await languageAPI.searchLanguages(searchTerm);
      setFilteredLanguages(results);
    } catch (error) {
      console.error('Error searching languages:', error);
      // Fallback to local filtering
      const filtered = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLanguages(filtered);
    }
  };

  const installLanguage = async (languageId) => {
    setInstalling(prev => new Set([...prev, languageId]));

    try {
      const result = await languageAPI.installLanguage(languageId);
      
      if (result.success) {
        // Update the language in our local state
        setLanguages(prev => prev.map(lang => 
          lang.id === languageId 
            ? { ...lang, installed: true, version: result.version }
            : lang
        ));
        
        // Show success message
        alert(`${languages.find(l => l.id === languageId)?.name} installed successfully!`);
      } else {
        alert(`Installation failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error installing language:', error);
      alert('Installation failed: ' + error.message);
    } finally {
      setInstalling(prev => {
        const newSet = new Set(prev);
        newSet.delete(languageId);
        return newSet;
      });
    }
  };

  const uninstallLanguage = async (languageId) => {
    if (!confirm('Are you sure you want to uninstall this language?')) return;

    try {
      const result = await languageAPI.uninstallLanguage(languageId);
      
      if (result.success) {
        // Update the language in our local state
        setLanguages(prev => prev.map(lang => 
          lang.id === languageId 
            ? { ...lang, installed: false, version: null }
            : lang
        ));
        
        alert(`${languages.find(l => l.id === languageId)?.name} uninstalled successfully!`);
      } else {
        alert(`Uninstallation failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error uninstalling language:', error);
      alert('Uninstallation failed: ' + error.message);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gray-800 border-gray-700 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-200">Language Installer</h3>
          <Badge variant="secondary" className="text-xs">
            {languages.filter(l => l.installed).length} installed
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => loadLanguages()}
            className="text-xs px-2 h-6 hover:bg-gray-700"
            disabled={isLoading}
          >
            {isLoading ? '...' : 'Refresh'}
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

      {/* Search */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search programming languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-gray-200"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-900/30 border-b border-red-700">
          <div className="text-red-300 text-sm flex items-center justify-between">
            {error}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => loadLanguages()}
              className="text-xs px-2 h-6"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Language List */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="text-center text-gray-400 mt-8">
            <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-4"></div>
            <p>Loading languages...</p>
          </div>
        ) : filteredLanguages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p>No languages found</p>
            {searchTerm && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchTerm('')}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLanguages.map((language) => (
              <div
                key={language.id}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {language.installed ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      ) : installing.has(language.id) ? (
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-200">{language.name}</h4>
                        {language.version && (
                          <Badge variant="outline" className="text-xs">
                            v{language.version}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        {language.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {language.installed ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => uninstallLanguage(language.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      disabled={installing.has(language.id)}
                    >
                      Uninstall
                    </Button>
                  ) : installing.has(language.id) ? (
                    <Button size="sm" disabled className="bg-blue-600">
                      Installing...
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => installLanguage(language.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Install
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 bg-gray-750">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            {filteredLanguages.length} languages found
          </span>
          <span>
            Installations are simulated for demo
          </span>
        </div>
      </div>
    </Card>
  );
};

export default LanguageInstaller;