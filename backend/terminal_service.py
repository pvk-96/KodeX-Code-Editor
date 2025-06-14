import os
import subprocess
import asyncio
import shlex
import time
from pathlib import Path
from typing import List, Dict, Any
from models import TerminalCommand
import uuid
import logging

logger = logging.getLogger(__name__)

class TerminalService:
    def __init__(self, base_working_dir: str = "/tmp/codeeditor"):
        self.base_working_dir = Path(base_working_dir)
        self.base_working_dir.mkdir(parents=True, exist_ok=True)
        
        # Allowed commands for security
        self.allowed_commands = {
            'ls', 'cat', 'echo', 'pwd', 'whoami', 'date', 'clear', 'help',
            'python', 'python3', 'node', 'npm', 'npx', 'pip', 'pip3',
            'git', 'mkdir', 'touch', 'cp', 'mv', 'rm', 'grep', 'find',
            'head', 'tail', 'wc', 'sort', 'uniq', 'curl', 'wget'
        }
        
        # Commands that need special handling
        self.builtin_commands = {
            'clear': self._clear_command,
            'help': self._help_command,
            'pwd': self._pwd_command
        }
        
        # Command history
        self.command_history: List[TerminalCommand] = []
    
    def _safe_working_dir(self, path: str) -> Path:
        """Ensure working directory is safe"""
        if path.startswith('/'):
            path = path[1:]
        safe_path = (self.base_working_dir / path).resolve()
        if not str(safe_path).startswith(str(self.base_working_dir.resolve())):
            return self.base_working_dir
        return safe_path
    
    def _is_command_allowed(self, command: str) -> bool:
        """Check if command is allowed for security"""
        cmd_parts = shlex.split(command)
        if not cmd_parts:
            return False
        
        base_cmd = cmd_parts[0]
        
        # Remove path if present
        if '/' in base_cmd:
            base_cmd = os.path.basename(base_cmd)
        
        return base_cmd in self.allowed_commands or base_cmd in self.builtin_commands
    
    async def _clear_command(self, working_dir: Path) -> TerminalCommand:
        """Handle clear command"""
        return TerminalCommand(
            command="clear",
            output="Terminal cleared",
            exit_code=0,
            working_directory=str(working_dir),
            execution_time=0.001
        )
    
    async def _help_command(self, working_dir: Path) -> TerminalCommand:
        """Handle help command"""
        help_text = """Available commands:
File Operations:
  ls [path]       - List directory contents
  cat [file]      - Display file contents
  mkdir [dir]     - Create directory
  touch [file]    - Create empty file
  cp [src] [dst]  - Copy file/directory
  mv [src] [dst]  - Move/rename file/directory
  rm [file]       - Remove file/directory
  find [path]     - Find files

Text Processing:
  echo [text]     - Display text
  grep [pattern]  - Search in files
  head [file]     - Show first lines
  tail [file]     - Show last lines
  wc [file]       - Word/line/byte count
  sort [file]     - Sort lines
  uniq [file]     - Remove duplicates

Development:
  python [file]   - Run Python script
  node [file]     - Run Node.js script
  npm [command]   - Node package manager
  pip [command]   - Python package manager
  git [command]   - Git version control

System:
  pwd             - Show current directory
  whoami          - Show current user
  date            - Show current date/time
  clear           - Clear terminal
  help            - Show this help

Network:
  curl [url]      - Fetch URL content
  wget [url]      - Download file

Note: This is a sandboxed terminal with limited commands for security."""
        
        return TerminalCommand(
            command="help",
            output=help_text,
            exit_code=0,
            working_directory=str(working_dir),
            execution_time=0.001
        )
    
    async def _pwd_command(self, working_dir: Path) -> TerminalCommand:
        """Handle pwd command"""
        return TerminalCommand(
            command="pwd",
            output=str(working_dir),
            exit_code=0,
            working_directory=str(working_dir),
            execution_time=0.001
        )
    
    async def execute_command(self, command: str, working_directory: str = "/tmp/codeeditor") -> TerminalCommand:
        """Execute terminal command safely"""
        start_time = time.time()
        working_dir = self._safe_working_dir(working_directory)
        
        # Handle empty command
        if not command.strip():
            return TerminalCommand(
                command=command,
                output="",
                exit_code=0,
                working_directory=str(working_dir),
                execution_time=0.001
            )
        
        # Check if command is allowed
        if not self._is_command_allowed(command):
            error_msg = f"bash: {command.split()[0]}: command not found or not allowed"
            return TerminalCommand(
                command=command,
                output=error_msg,
                exit_code=127,
                working_directory=str(working_dir),
                execution_time=time.time() - start_time
            )
        
        # Handle builtin commands
        cmd_parts = shlex.split(command)
        base_cmd = cmd_parts[0]
        
        if base_cmd in self.builtin_commands:
            result = await self.builtin_commands[base_cmd](working_dir)
            result.command = command
            return result
        
        # Execute external command
        try:
            # Create working directory if it doesn't exist
            working_dir.mkdir(parents=True, exist_ok=True)
            
            # Special handling for python/node scripts
            if base_cmd in ['python', 'python3', 'node'] and len(cmd_parts) > 1:
                script_path = working_dir / cmd_parts[1]
                if not script_path.exists():
                    return TerminalCommand(
                        command=command,
                        output=f"File not found: {cmd_parts[1]}",
                        exit_code=1,
                        working_directory=str(working_dir),
                        execution_time=time.time() - start_time
                    )
            
            # Execute command
            process = await asyncio.create_subprocess_shell(
                command,
                cwd=working_dir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                limit=1024*1024  # 1MB limit
            )
            
            try:
                stdout, _ = await asyncio.wait_for(process.communicate(), timeout=10.0)
                output = stdout.decode('utf-8', errors='replace')
                exit_code = process.returncode
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                output = "Command timed out (10 seconds limit)"
                exit_code = 124
            
            execution_time = time.time() - start_time
            
            terminal_cmd = TerminalCommand(
                command=command,
                output=output.strip(),
                exit_code=exit_code,
                working_directory=str(working_dir),
                execution_time=execution_time
            )
            
            # Add to history
            self.command_history.append(terminal_cmd)
            
            return terminal_cmd
            
        except Exception as e:
            logger.error(f"Error executing command '{command}': {str(e)}")
            return TerminalCommand(
                command=command,
                output=f"Error executing command: {str(e)}",
                exit_code=1,
                working_directory=str(working_dir),
                execution_time=time.time() - start_time
            )
    
    async def get_command_history(self, limit: int = 50) -> List[TerminalCommand]:
        """Get recent command history"""
        return self.command_history[-limit:]
    
    async def clear_history(self) -> bool:
        """Clear command history"""
        self.command_history.clear()
        return True

# Global terminal service instance
terminal_service = TerminalService()