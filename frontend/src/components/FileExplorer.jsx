import React, { useState, useRef } from 'react';
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
  const inputRef = useRef(null);

  const handleRename = () => {
    if (newName.trim() && newName !== item.name) {
      onRenameItem(item.id, newName.trim());
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
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (item.type === 'folder') {
            onToggleFolder(item.id);
          } else {
            onFileSelect(item);
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
            />
          ) : (
            <span className="text-sm text-gray-200 truncate">{item.name}</span>
          )}
        </div>

        {/* Action buttons */}
        {showActions && !isRenaming && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.type === 'folder' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 hover:bg-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFile(item.id);
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
                onDeleteItem(item.id);
              }}
            >
              <TrashIcon className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Children */}
      {item.type === 'folder' && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              selectedFileId={selectedFileId}
              onCreateFile={onCreateFile}
              onDeleteItem={onDeleteItem}
              onRenameItem={onRenameItem}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer = ({ 
  fileSystem, 
  onFileSelect, 
  selectedFileId, 
  onUpdateFileSystem 
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root', 'project1', 'project2']));
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const createFile = (parentId) => {
    const newFile = {
      id: `file_${Date.now()}`,
      name: 'untitled.txt',
      type: 'file',
      language: 'plaintext',
      content: ''
    };

    const updateTree = (items) => {
      return items.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...(item.children || []), newFile]
          };
        } else if (item.children) {
          return {
            ...item,
            children: updateTree(item.children)
          };
        }
        return item;
      });
    };

    const updatedFileSystem = {
      ...fileSystem,
      children: parentId === 'root' 
        ? [...fileSystem.children, newFile]
        : updateTree(fileSystem.children)
    };

    onUpdateFileSystem(updatedFileSystem);
  };

  const deleteItem = (itemId) => {
    const removeFromTree = (items) => {
      return items.filter(item => {
        if (item.id === itemId) {
          return false;
        }
        if (item.children) {
          return {
            ...item,
            children: removeFromTree(item.children)
          };
        }
        return true;
      }).map(item => {
        if (item.children) {
          return {
            ...item,
            children: removeFromTree(item.children)
          };
        }
        return item;
      });
    };

    const updatedFileSystem = {
      ...fileSystem,
      children: removeFromTree(fileSystem.children)
    };

    onUpdateFileSystem(updatedFileSystem);
  };

  const renameItem = (itemId, newName) => {
    const updateTree = (items) => {
      return items.map(item => {
        if (item.id === itemId) {
          // Determine language from file extension
          let language = 'plaintext';
          if (item.type === 'file') {
            const ext = newName.split('.').pop().toLowerCase();
            const langMap = {
              'js': 'javascript',
              'jsx': 'javascript',
              'ts': 'typescript',
              'tsx': 'typescript',
              'py': 'python',
              'html': 'html',
              'css': 'css',
              'java': 'java',
              'cpp': 'cpp',
              'c': 'c',
              'go': 'go',
              'rs': 'rust',
              'php': 'php',
              'rb': 'ruby'
            };
            language = langMap[ext] || 'plaintext';
          }
          
          return {
            ...item,
            name: newName,
            language: item.type === 'file' ? language : undefined
          };
        } else if (item.children) {
          return {
            ...item,
            children: updateTree(item.children)
          };
        }
        return item;
      });
    };

    const updatedFileSystem = {
      ...fileSystem,
      children: updateTree(fileSystem.children)
    };

    onUpdateFileSystem(updatedFileSystem);
  };

  const filterTree = (items, searchTerm) => {
    if (!searchTerm) return items;
    
    return items.filter(item => {
      if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }
      if (item.children) {
        const filteredChildren = filterTree(item.children, searchTerm);
        return filteredChildren.length > 0;
      }
      return false;
    }).map(item => ({
      ...item,
      children: item.children ? filterTree(item.children, searchTerm) : undefined
    }));
  };

  const displayedItems = filterTree(fileSystem.children || [], searchTerm);

  return (
    <Card className="w-80 h-full bg-gray-800 border-gray-700">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-200">Explorer</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-gray-700"
            onClick={() => createFile('root')}
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
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
        {displayedItems.map((item) => (
          <FileTreeItem
            key={item.id}
            item={item}
            onFileSelect={onFileSelect}
            selectedFileId={selectedFileId}
            onCreateFile={createFile}
            onDeleteItem={deleteItem}
            onRenameItem={renameItem}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
          />
        ))}
      </div>
    </Card>
  );
};

export default FileExplorer;