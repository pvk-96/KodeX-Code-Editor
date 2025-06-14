import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  FolderIcon, 
  FolderOpenIcon, 
  DocumentIcon, 
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { fileAPI } from '../services/api';

const FileTreeItem = ({ 
  item, 
  level = 0, 
  onFileSelect, 
  selectedFileId, 
  onCreateFile, 
  onDeleteItem, 
  onRenameItem,
  expandedFolders,
  onToggleFolder 
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const [showActions, setShowActions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  const handleRename = async () => {
    if (newName.trim() && newName !== item.name) {
      setIsLoading(true);
      try {
        await onRenameItem(item.path, newName.trim());
      } catch (error) {
        console.error('Error renaming item:', error);
        setNewName(item.name); // Reset on error
      } finally {
        setIsLoading(false);
      }
    }
    setIsRenaming(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(item.name);
      setIsRenaming(false);
    }
  };

  const isExpanded = expandedFolders.has(item.id);
  const isSelected = selectedFileId === item.id;

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer group relative ${
          isSelected ? 'bg-blue-600' : ''
        } ${isLoading ? 'opacity-50' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (!isLoading && !isRenaming) {
            if (item.type === 'folder') {
              onToggleFolder(item.id);
            } else {
              onFileSelect(item);
            }
          }
        }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-center flex-1 min-w-0">
          {item.type === 'folder' ? (
            isExpanded ? (
              <FolderOpenIcon className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" />
            ) : (
              <FolderIcon className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" />
            )
          ) : (
            <DocumentIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          )}
          
          {isRenaming ? (
            <Input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyPress={handleKeyPress}
              className="h-6 px-1 text-sm bg-gray-800 border-gray-600"
              autoFocus
              disabled={isLoading}
            />
          ) : (
            <span className="text-sm text-gray-200 truncate">{item.name}</span>
          )}
        </div>

        {/* Action buttons */}
        {showActions && !isRenaming && !isLoading && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.type === 'folder' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 hover:bg-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFile(item.path);
                }}
              >
                <PlusIcon className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
            >
              <PencilIcon className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem(item.path);
              }}
            >
              <TrashIcon className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const FileExplorer = ({ 
  onFileSelect, 
  selectedFileId, 
  onFileChange
}) => {
  const [fileTree, setFileTree] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load file tree on component mount
  useEffect(() => {
    loadFileTree();
  }, []);

  const loadFileTree = async (path = '/') => {
    try {
      setIsLoading(true);
      setError(null);
      const files = await fileAPI.getFileTree(path);
      setFileTree(files);
    } catch (error) {
      console.error('Error loading file tree:', error);
      setError('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const createFile = async (parentPath) => {
    try {
      const fileName = prompt('Enter file name:');
      if (!fileName) return;

      const isFolder = fileName.endsWith('/');
      const cleanName = isFolder ? fileName.slice(0, -1) : fileName;
      
      await fileAPI.createFile(
        cleanName,
        parentPath,
        isFolder ? 'folder' : 'file',
        ''
      );
      
      // Reload file tree
      await loadFileTree();
    } catch (error) {
      console.error('Error creating file:', error);
      alert('Failed to create file: ' + error.message);
    }
  };

  const deleteItem = async (itemPath) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await fileAPI.deleteFile(itemPath);
      await loadFileTree();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item: ' + error.message);
    }
  };

  const renameItem = async (itemPath, newName) => {
    try {
      await fileAPI.renameFile(itemPath, newName);
      await loadFileTree();
    } catch (error) {
      console.error('Error renaming item:', error);
      alert('Failed to rename item: ' + error.message);
      throw error;
    }
  };

  const handleFileSelect = async (file) => {
    try {
      // Load full file content if needed
      const fullFile = await fileAPI.getFile(file.path);
      onFileSelect(fullFile);
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Failed to load file: ' + error.message);
    }
  };

  const searchFiles = async () => {
    if (!searchTerm.trim()) {
      await loadFileTree();
      return;
    }

    try {
      const results = await fileAPI.searchFiles(searchTerm);
      setFileTree(results);
    } catch (error) {
      console.error('Error searching files:', error);
      setError('Failed to search files');
    }
  };

  // Trigger search when search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchFiles();
      } else {
        loadFileTree();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <Card className="w-80 h-full bg-gray-800 border-gray-700">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-200">Explorer</h2>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-gray-700"
              onClick={() => createFile('/')}
              title="Create file"
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-gray-700"
              onClick={() => loadFileTree()}
              title="Refresh"
              disabled={isLoading}
            >
              {isLoading ? '...' : '↻'}
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm bg-gray-700 border-gray-600 text-gray-200"
          />
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[calc(100vh-140px)]">
        {error ? (
          <div className="p-4 text-center text-red-400">
            <p>{error}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => loadFileTree()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="p-4 text-center text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-2"></div>
            <p>Loading files...</p>
          </div>
        ) : fileTree.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <p>No files found</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => createFile('/')}
              className="mt-2"
            >
              Create your first file
            </Button>
          </div>
        ) : (
          fileTree.map((item) => (
            <FileTreeItem
              key={item.id}
              item={item}
              onFileSelect={handleFileSelect}
              selectedFileId={selectedFileId}
              onCreateFile={createFile}
              onDeleteItem={deleteItem}
              onRenameItem={renameItem}
              expandedFolders={expandedFolders}
              onToggleFolder={toggleFolder}
            />
          ))
        )}
      </div>
    </Card>
  );
};

export default FileExplorer;