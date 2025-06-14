import os
import asyncio
import re
from typing import List, Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage
from models import ChatMessage, ChatSession
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
    
    async def create_chat_session(self) -> ChatSession:
        """Create a new chat session"""
        session = ChatSession()
        return session
    
    def extract_code_blocks(self, text: str) -> List[Dict[str, str]]:
        """Extract code blocks from AI response"""
        code_block_pattern = r'```(\w+)?\n(.*?)```'
        matches = re.findall(code_block_pattern, text, re.DOTALL)
        
        code_blocks = []
        for match in matches:
            language = match[0] if match[0] else 'plaintext'
            code = match[1].strip()
            code_blocks.append({
                'language': language,
                'code': code
            })
        
        return code_blocks
    
    async def send_message(self, session_id: str, message: str) -> ChatMessage:
        """Send message to AI and get response"""
        try:
            # Create LLM chat instance for this session
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message="""You are an AI coding assistant integrated into a powerful code editor. You help developers with:

1. Code completion and suggestions
2. Debugging and error analysis
3. Code optimization and refactoring
4. Explaining programming concepts
5. Generating code snippets
6. Best practices and architecture advice

When providing code examples:
- Use proper syntax highlighting with ```language blocks
- Provide clear, commented code
- Suggest improvements when relevant
- Consider multiple programming languages

Be concise but helpful. Focus on practical, actionable advice."""
            ).with_model("gemini", "gemini-2.0-flash")
            
            # Create user message
            user_message = UserMessage(text=message)
            
            # Send message and get response
            ai_response = await chat.send_message(user_message)
            
            # Extract code blocks from response
            code_blocks = self.extract_code_blocks(ai_response)
            
            # Create ChatMessage object
            response_message = ChatMessage(
                session_id=session_id,
                type="ai",
                content=ai_response,
                code_blocks=code_blocks
            )
            
            return response_message
            
        except Exception as e:
            logger.error(f"Error in AI service: {str(e)}")
            # Return error message
            error_message = ChatMessage(
                session_id=session_id,
                type="ai",
                content=f"I apologize, but I encountered an error processing your request: {str(e)}. Please try again or rephrase your question.",
                code_blocks=[]
            )
            return error_message
    
    async def get_code_suggestions(self, code: str, language: str, cursor_position: int) -> List[str]:
        """Get AI-powered code suggestions based on current context"""
        try:
            # Create a temporary session for suggestions
            temp_session = str(uuid.uuid4())
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=temp_session,
                system_message=f"""You are a code completion assistant. Given code context in {language}, provide 3 brief, practical code completions.

Rules:
1. Return only the completion text, no explanations
2. Each suggestion should be on a new line
3. Keep suggestions short (1-2 lines max)
4. Make suggestions contextually relevant
5. Don't repeat the existing code"""
            ).with_model("gemini", "gemini-2.0-flash").with_max_tokens(150)
            
            # Extract context around cursor
            lines = code.split('\n')
            current_line_idx = code[:cursor_position].count('\n')
            
            # Get context (current line + few previous lines)
            start_line = max(0, current_line_idx - 3)
            end_line = min(len(lines), current_line_idx + 2)
            context = '\n'.join(lines[start_line:end_line])
            
            if current_line_idx < len(lines):
                current_line = lines[current_line_idx]
                cursor_in_line = cursor_position - sum(len(line) + 1 for line in lines[:current_line_idx])
                current_text = current_line[:cursor_in_line]
            else:
                current_text = ""
            
            prompt = f"""Code context ({language}):
{context}

Current incomplete line: {current_text}

Provide 3 short code completions:"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Parse suggestions
            suggestions = [s.strip() for s in response.split('\n') if s.strip()]
            return suggestions[:3]
            
        except Exception as e:
            logger.error(f"Error getting code suggestions: {str(e)}")
            return []

# Global AI service instance
ai_service = AIService()