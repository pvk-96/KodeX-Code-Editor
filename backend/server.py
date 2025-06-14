from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional

# Import our models and services
from .models import *
from .ai_service import ai_service
from .file_service import file_service
from .terminal_service import terminal_service
from .language_service import language_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="CodeEditor AI API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Default themes
DEFAULT_THEMES = [
    Theme(id='dark', name='Dark', primary='#1e1e1e', secondary='#252526', accent='#007acc'),
    Theme(id='light', name='Light', primary='#ffffff', secondary='#f3f3f3', accent='#0078d4'),
    Theme(id='monokai', name='Monokai', primary='#272822', secondary='#3e3d32', accent='#f92672'),
    Theme(id='dracula', name='Dracula', primary='#282a36', secondary='#44475a', accent='#bd93f9'),
    Theme(id='nord', name='Nord', primary='#2e3440', secondary='#3b4252', accent='#5e81ac'),
    Theme(id='github', name='GitHub', primary='#0d1117', secondary='#161b22', accent='#58a6ff')
]

# AI Chat Endpoints
@api_router.post("/ai/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Send message to AI assistant"""
    try:
        # Create new session if not provided
        session_id = request.session_id
        if not session_id:
            session = await ai_service.create_chat_session()
            session_id = session.id
            # Store session in database
            await db.chat_sessions.insert_one(session.dict())
        
        # Create user message
        user_message = ChatMessage(
            session_id=session_id,
            type="user",
            content=request.message
        )
        
        # Store user message
        await db.chat_messages.insert_one(user_message.dict())
        
        # Get AI response
        ai_message = await ai_service.send_message(session_id, request.message)
        
        # Store AI message
        await db.chat_messages.insert_one(ai_message.dict())
        
        return ChatResponse(message=ai_message, session_id=session_id)
        
    except Exception as e:
        logger.error(f"Error in AI chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.get("/ai/sessions", response_model=List[ChatSession])
async def get_chat_sessions():
    """Get all chat sessions"""
    try:
        sessions = await db.chat_sessions.find().sort("updated_at", -1).to_list(100)
        return [ChatSession(**session) for session in sessions]
    except Exception as e:
        logger.error(f"Error getting chat sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get chat sessions")

@api_router.get("/ai/sessions/{session_id}/messages", response_model=List[ChatMessage])
async def get_chat_messages(session_id: str):
    """Get messages for a chat session"""
    try:
        messages = await db.chat_messages.find({"session_id": session_id}).sort("timestamp", 1).to_list(1000)
        return [ChatMessage(**message) for message in messages]
    except Exception as e:
        logger.error(f"Error getting chat messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get chat messages")

@api_router.post("/ai/suggestions")
async def get_code_suggestions(code: str, language: str, cursor_position: int):
    """Get AI code suggestions"""
    try:
        suggestions = await ai_service.get_code_suggestions(code, language, cursor_position)
        return {"suggestions": suggestions}
    except Exception as e:
        logger.error(f"Error getting code suggestions: {str(e)}")
        return {"suggestions": []}

# File System Endpoints
@api_router.get("/files", response_model=List[FileItem])
async def get_file_tree(path: str = "/"):
    """Get file tree"""
    try:
        return await file_service.get_file_tree(path)
    except Exception as e:
        logger.error(f"Error getting file tree: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get file tree")

@api_router.get("/files/{path:path}", response_model=FileItem)
async def get_file(path: str):
    """Get file details"""
    try:
        file_item = await file_service.get_file(path)
        if not file_item:
            raise HTTPException(status_code=404, detail="File not found")
        return file_item
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get file")

@api_router.post("/files", response_model=FileItem)
async def create_file(request: CreateFileRequest):
    """Create new file or folder"""
    try:
        return await file_service.create_file(
            name=request.name,
            parent_path=request.parent_path,
            file_type=request.type,
            content=request.content
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create file")

@api_router.put("/files/{path:path}", response_model=FileItem)
async def update_file(path: str, request: UpdateFileRequest):
    """Update file content"""
    try:
        return await file_service.update_file(path, request.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update file")

@api_router.patch("/files/{path:path}", response_model=FileItem)
async def rename_file(path: str, request: RenameFileRequest):
    """Rename file or folder"""
    try:
        return await file_service.rename_file(path, request.new_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error renaming file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to rename file")

@api_router.delete("/files/{path:path}")
async def delete_file(path: str):
    """Delete file or folder"""
    try:
        success = await file_service.delete_file(path)
        return {"success": success, "message": "File deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete file")

@api_router.get("/files/search/{query}", response_model=List[FileItem])
async def search_files(query: str, path: str = "/"):
    """Search files"""
    try:
        return await file_service.search_files(query, path)
    except Exception as e:
        logger.error(f"Error searching files: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search files")

# Terminal Endpoints
@api_router.post("/terminal/execute", response_model=ExecuteCommandResponse)
async def execute_command(request: ExecuteCommandRequest):
    """Execute terminal command"""
    try:
        command_result = await terminal_service.execute_command(
            request.command,
            request.working_directory or "/tmp/codeeditor"
        )
        
        # Store command in database
        await db.terminal_commands.insert_one(command_result.dict())
        
        return ExecuteCommandResponse(
            command=command_result,
            success=command_result.exit_code == 0
        )
    except Exception as e:
        logger.error(f"Error executing command: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to execute command")

@api_router.get("/terminal/history", response_model=List[TerminalCommand])
async def get_terminal_history(limit: int = 50):
    """Get terminal command history"""
    try:
        return await terminal_service.get_command_history(limit)
    except Exception as e:
        logger.error(f"Error getting terminal history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get terminal history")

@api_router.delete("/terminal/history")
async def clear_terminal_history():
    """Clear terminal history"""
    try:
        success = await terminal_service.clear_history()
        return {"success": success, "message": "Terminal history cleared"}
    except Exception as e:
        logger.error(f"Error clearing terminal history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear terminal history")

# Language Management Endpoints
@api_router.get("/languages", response_model=List[Language])
async def get_languages():
    """Get available programming languages"""
    try:
        return await language_service.get_available_languages()
    except Exception as e:
        logger.error(f"Error getting languages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get languages")

@api_router.get("/languages/search/{query}", response_model=List[Language])
async def search_languages(query: str):
    """Search programming languages"""
    try:
        return await language_service.search_languages(query)
    except Exception as e:
        logger.error(f"Error searching languages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search languages")

@api_router.post("/languages/{language_id}/install", response_model=LanguageInstallResponse)
async def install_language(language_id: str, background_tasks: BackgroundTasks):
    """Install programming language"""
    try:
        result = await language_service.install_language(language_id)
        return LanguageInstallResponse(**result)
    except Exception as e:
        logger.error(f"Error installing language: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to install language")

@api_router.delete("/languages/{language_id}")
async def uninstall_language(language_id: str):
    """Uninstall programming language"""
    try:
        result = await language_service.uninstall_language(language_id)
        return result
    except Exception as e:
        logger.error(f"Error uninstalling language: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to uninstall language")

# Theme and Preferences Endpoints
@api_router.get("/themes", response_model=List[Theme])
async def get_themes():
    """Get available themes"""
    return DEFAULT_THEMES

@api_router.get("/preferences", response_model=UserPreferences)
async def get_user_preferences():
    """Get user preferences"""
    try:
        prefs = await db.user_preferences.find_one({"id": "default"})
        if prefs:
            return UserPreferences(**prefs)
        else:
            # Return default preferences
            default_prefs = UserPreferences(id="default")
            await db.user_preferences.insert_one(default_prefs.dict())
            return default_prefs
    except Exception as e:
        logger.error(f"Error getting preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get preferences")

@api_router.put("/preferences", response_model=UserPreferences)
async def update_user_preferences(request: UpdatePreferencesRequest):
    """Update user preferences"""
    try:
        # Get current preferences
        current_prefs = await db.user_preferences.find_one({"id": "default"})
        if not current_prefs:
            current_prefs = UserPreferences(id="default").dict()
        
        # Update with provided values
        update_data = request.dict(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                current_prefs[key] = value
        
        # Save updated preferences
        await db.user_preferences.replace_one(
            {"id": "default"}, 
            current_prefs, 
            upsert=True
        )
        
        return UserPreferences(**current_prefs)
    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update preferences")

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "CodeEditor AI API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "ai": "online",
            "files": "online", 
            "terminal": "online",
            "languages": "online"
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)