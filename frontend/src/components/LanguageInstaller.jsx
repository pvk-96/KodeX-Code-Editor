import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { mockLanguages } from '../mock/mockData';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const LanguageInstaller = ({ isOpen, onToggle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [languages, setLanguages] = useState(mockLanguages);
  const [installing, setInstalling] = useState(new Set());

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const installLanguage = async (languageId) => {
    setInstalling(prev => new Set([...prev, languageId]));

    // Simulate installation process
    setTimeout(() => {
      setLanguages(prev => prev.map(lang => 
        lang.id === languageId 
          ? { ...lang, installed: true, version: '1.0.0' }
          : lang
      ));
      setInstalling(prev => {
        const newSet = new Set(prev);
        newSet.delete(languageId);
        return newSet;
      });
    }, 2000 + Math.random() * 3000);
  };

  const uninstallLanguage = (languageId) => {
    setLanguages(prev => prev.map(lang => 
      lang.id === languageId 
        ? { ...lang, installed: false, version: null }
        : lang
    ));
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
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggle}
          className="text-xs px-2 h-6 hover:bg-gray-700"
        >
          ✕
        </Button>
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

      {/* Language List */}
      <ScrollArea className="flex-1 p-4">
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
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 bg-gray-750">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            {filteredLanguages.length} languages found
          </span>
          <span>
            Installation commands are simulated for demo
          </span>
        </div>
      </div>
    </Card>
  );
};

export default LanguageInstaller;