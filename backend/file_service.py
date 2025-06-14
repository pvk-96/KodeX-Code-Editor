import os
import shutil
import mimetypes
from pathlib import Path
from typing import List, Optional, Dict, Any
from models import FileItem
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class FileService:
    def __init__(self, base_path: str = "/tmp/codeeditor"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        # Language extensions mapping
        self.language_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.html': 'html',
            '.htm': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.hpp': 'cpp',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.sh': 'bash',
            '.bash': 'bash',
            '.zsh': 'bash',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.txt': 'plaintext',
            '.sql': 'sql'
        }
    
    def _safe_path(self, path: str) -> Path:
        """Ensure path is within base directory to prevent directory traversal"""
        if path.startswith('/'):
            path = path[1:]
        safe_path = (self.base_path / path).resolve()
        if not str(safe_path).startswith(str(self.base_path.resolve())):
            raise ValueError("Invalid path: directory traversal not allowed")
        return safe_path
    
    def _get_language(self, file_path: Path) -> str:
        """Determine programming language from file extension"""
        return self.language_map.get(file_path.suffix.lower(), 'plaintext')
    
    def _path_to_file_item(self, path: Path, parent_id: Optional[str] = None) -> FileItem:
        """Convert filesystem path to FileItem model"""
        relative_path = path.relative_to(self.base_path)
        stat = path.stat()
        
        file_item = FileItem(
            id=str(uuid.uuid4()),
            name=path.name,
            path=str(relative_path),
            type='folder' if path.is_dir() else 'file',
            size=stat.st_size if path.is_file() else None,
            created_at=datetime.fromtimestamp(stat.st_ctime),
            modified_at=datetime.fromtimestamp(stat.st_mtime),
            parent_id=parent_id
        )
        
        if path.is_file():
            file_item.language = self._get_language(path)
            # For text files, include content
            try:
                if stat.st_size < 1024 * 1024:  # Only read files smaller than 1MB
                    with open(path, 'r', encoding='utf-8') as f:
                        file_item.content = f.read()
            except (UnicodeDecodeError, IOError):
                file_item.content = "[Binary file or encoding error]"
        
        return file_item
    
    async def get_file_tree(self, path: str = "/") -> List[FileItem]:
        """Get file tree structure"""
        try:
            safe_path = self._safe_path(path)
            if not safe_path.exists():
                return []
            
            items = []
            if safe_path.is_dir():
                for item_path in sorted(safe_path.iterdir()):
                    if not item_path.name.startswith('.'):  # Skip hidden files
                        file_item = self._path_to_file_item(item_path)
                        items.append(file_item)
            
            return items
        except Exception as e:
            logger.error(f"Error getting file tree: {str(e)}")
            return []
    
    async def get_file(self, path: str) -> Optional[FileItem]:
        """Get single file details"""
        try:
            safe_path = self._safe_path(path)
            if not safe_path.exists():
                return None
            
            return self._path_to_file_item(safe_path)
        except Exception as e:
            logger.error(f"Error getting file: {str(e)}")
            return None
    
    async def create_file(self, name: str, parent_path: str = "/", file_type: str = "file", content: str = "") -> FileItem:
        """Create new file or folder"""
        try:
            parent_safe_path = self._safe_path(parent_path)
            new_path = parent_safe_path / name
            
            if new_path.exists():
                raise ValueError(f"File or folder '{name}' already exists")
            
            if file_type == "folder":
                new_path.mkdir(parents=True)
            else:
                new_path.parent.mkdir(parents=True, exist_ok=True)
                with open(new_path, 'w', encoding='utf-8') as f:
                    f.write(content)
            
            return self._path_to_file_item(new_path)
        except Exception as e:
            logger.error(f"Error creating file: {str(e)}")
            raise ValueError(f"Failed to create {file_type}: {str(e)}")
    
    async def update_file(self, path: str, content: str) -> FileItem:
        """Update file content"""
        try:
            safe_path = self._safe_path(path)
            if not safe_path.exists():
                raise ValueError("File not found")
            
            if safe_path.is_dir():
                raise ValueError("Cannot update folder content")
            
            with open(safe_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return self._path_to_file_item(safe_path)
        except Exception as e:
            logger.error(f"Error updating file: {str(e)}")
            raise ValueError(f"Failed to update file: {str(e)}")
    
    async def rename_file(self, path: str, new_name: str) -> FileItem:
        """Rename file or folder"""
        try:
            safe_path = self._safe_path(path)
            if not safe_path.exists():
                raise ValueError("File not found")
            
            new_path = safe_path.parent / new_name
            if new_path.exists():
                raise ValueError(f"File or folder '{new_name}' already exists")
            
            safe_path.rename(new_path)
            return self._path_to_file_item(new_path)
        except Exception as e:
            logger.error(f"Error renaming file: {str(e)}")
            raise ValueError(f"Failed to rename: {str(e)}")
    
    async def delete_file(self, path: str) -> bool:
        """Delete file or folder"""
        try:
            safe_path = self._safe_path(path)
            if not safe_path.exists():
                raise ValueError("File not found")
            
            if safe_path.is_dir():
                shutil.rmtree(safe_path)
            else:
                safe_path.unlink()
            
            return True
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            raise ValueError(f"Failed to delete: {str(e)}")
    
    async def search_files(self, query: str, path: str = "/") -> List[FileItem]:
        """Search files by name"""
        try:
            safe_path = self._safe_path(path)
            if not safe_path.exists():
                return []
            
            results = []
            query_lower = query.lower()
            
            for root, dirs, files in os.walk(safe_path):
                # Filter hidden directories
                dirs[:] = [d for d in dirs if not d.startswith('.')]
                
                for file_name in files:
                    if not file_name.startswith('.') and query_lower in file_name.lower():
                        file_path = Path(root) / file_name
                        file_item = self._path_to_file_item(file_path)
                        results.append(file_item)
            
            return results
        except Exception as e:
            logger.error(f"Error searching files: {str(e)}")
            return []

# Global file service instance
file_service = FileService()