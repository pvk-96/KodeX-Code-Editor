from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

# Chat and AI Models
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    type: str  # 'user' or 'ai'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    code_blocks: Optional[List[Dict[str, str]]] = None

class ChatSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    title: Optional[str] = "New Chat"

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    message: ChatMessage
    session_id: str

# File System Models
class FileItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    path: str
    type: str  # 'file' or 'folder'
    content: Optional[str] = None
    language: Optional[str] = None
    size: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: datetime = Field(default_factory=datetime.utcnow)
    parent_id: Optional[str] = None

class CreateFileRequest(BaseModel):
    name: str
    parent_path: str = "/"
    type: str = "file"  # 'file' or 'folder'
    content: Optional[str] = ""

class UpdateFileRequest(BaseModel):
    content: str

class RenameFileRequest(BaseModel):
    new_name: str

# Terminal Models
class TerminalCommand(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    command: str
    output: str
    exit_code: int
    working_directory: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    execution_time: float

class ExecuteCommandRequest(BaseModel):
    command: str
    working_directory: Optional[str] = "/tmp/codeeditor"

class ExecuteCommandResponse(BaseModel):
    command: TerminalCommand
    success: bool

# Language Management Models
class Language(BaseModel):
    id: str
    name: str
    description: str
    install_command: str
    check_command: str
    installed: bool = False
    version: Optional[str] = None

class LanguageInstallRequest(BaseModel):
    language_id: str

class LanguageInstallResponse(BaseModel):
    success: bool
    message: str
    version: Optional[str] = None

# Theme and Preferences Models
class Theme(BaseModel):
    id: str
    name: str
    primary: str
    secondary: str
    accent: str

class UserPreferences(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    theme_id: str = "dark"
    font_size: int = 14
    auto_save: bool = True
    show_line_numbers: bool = True
    word_wrap: bool = False
    tab_size: int = 2

class UpdatePreferencesRequest(BaseModel):
    theme_id: Optional[str] = None
    font_size: Optional[int] = None
    auto_save: Optional[bool] = None
    show_line_numbers: Optional[bool] = None
    word_wrap: Optional[bool] = None
    tab_size: Optional[int] = None

# General Response Models
class SuccessResponse(BaseModel):
    success: bool = True
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[str] = None