import os
import subprocess
import asyncio
import re
from typing import List, Dict, Any, Optional
from models import Language
import logging

logger = logging.getLogger(__name__)

class LanguageService:
    def __init__(self):
        self.languages = {
            'python': Language(
                id='python',
                name='Python',
                description='High-level programming language for general-purpose programming',
                install_command='apt-get update && apt-get install -y python3 python3-pip',
                check_command='python3 --version'
            ),
            'node': Language(
                id='node',
                name='Node.js',
                description='JavaScript runtime built on Chrome\'s V8 JavaScript engine',
                install_command='curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && apt-get install -y nodejs',
                check_command='node --version'
            ),
            'java': Language(
                id='java',
                name='Java',
                description='Object-oriented programming language',
                install_command='apt-get update && apt-get install -y default-jdk',
                check_command='java -version'
            ),
            'go': Language(
                id='go',
                name='Go',
                description='Fast, statically typed, compiled language',
                install_command='wget -c https://golang.org/dl/go1.21.0.linux-amd64.tar.gz -O - | tar -xz -C /usr/local',
                check_command='go version'
            ),
            'rust': Language(
                id='rust',
                name='Rust',
                description='Systems programming language focused on safety and performance',
                install_command='curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y',
                check_command='rustc --version'
            ),
            'php': Language(
                id='php',
                name='PHP',
                description='Server-side scripting language for web development',
                install_command='apt-get update && apt-get install -y php php-cli',
                check_command='php --version'
            ),
            'ruby': Language(
                id='ruby',
                name='Ruby',
                description='Dynamic, object-oriented programming language',
                install_command='apt-get update && apt-get install -y ruby-full',
                check_command='ruby --version'
            ),
            'gcc': Language(
                id='gcc',
                name='GCC (C/C++)',
                description='GNU Compiler Collection for C and C++',
                install_command='apt-get update && apt-get install -y build-essential',
                check_command='gcc --version'
            ),
            'dart': Language(
                id='dart',
                name='Dart',
                description='Programming language optimized for building mobile, desktop, server, and web applications',
                install_command='apt-get update && apt-get install -y apt-transport-https && sh -c \'wget -qO- https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -\' && sh -c \'wget -qO- https://storage.googleapis.com/download.dartlang.org/linux/debian/dart_stable.list > /etc/apt/sources.list.d/dart_stable.list\' && apt-get update && apt-get install -y dart',
                check_command='dart --version'
            ),
            'kotlin': Language(
                id='kotlin',
                name='Kotlin',
                description='Modern programming language that makes developers happier',
                install_command='curl -s https://get.sdkman.io | bash && source ~/.sdkman/bin/sdkman-init.sh && sdk install kotlin',
                check_command='kotlin -version'
            )
        }
        
        # Cache for installed status
        self._installation_cache = {}
    
    async def get_available_languages(self) -> List[Language]:
        """Get list of all available languages"""
        languages_list = list(self.languages.values())
        
        # Check installation status for each language
        for language in languages_list:
            language.installed = await self._check_installation(language)
            if language.installed:
                language.version = await self._get_version(language)
        
        return languages_list
    
    async def get_language(self, language_id: str) -> Optional[Language]:
        """Get specific language by ID"""
        if language_id not in self.languages:
            return None
        
        language = self.languages[language_id]
        language.installed = await self._check_installation(language)
        if language.installed:
            language.version = await self._get_version(language)
        
        return language
    
    async def search_languages(self, query: str) -> List[Language]:
        """Search languages by name or description"""
        query_lower = query.lower()
        results = []
        
        for language in self.languages.values():
            if (query_lower in language.name.lower() or 
                query_lower in language.description.lower() or
                query_lower in language.id.lower()):
                
                language.installed = await self._check_installation(language)
                if language.installed:
                    language.version = await self._get_version(language)
                results.append(language)
        
        return results
    
    async def install_language(self, language_id: str) -> Dict[str, Any]:
        """Install a programming language"""
        if language_id not in self.languages:
            return {
                'success': False,
                'message': f'Language {language_id} not found',
                'version': None
            }
        
        language = self.languages[language_id]
        
        # Check if already installed
        if await self._check_installation(language):
            version = await self._get_version(language)
            return {
                'success': True,
                'message': f'{language.name} is already installed',
                'version': version
            }
        
        try:
            # Simulate installation process (in a real app, this would actually install)
            logger.info(f"Installing {language.name}...")
            
            # Mock installation time
            await asyncio.sleep(2)
            
            # In a real implementation, you would run:
            # process = await asyncio.create_subprocess_shell(
            #     language.install_command,
            #     stdout=asyncio.subprocess.PIPE,
            #     stderr=asyncio.subprocess.PIPE
            # )
            # stdout, stderr = await process.communicate()
            
            # For demo purposes, we'll simulate successful installation
            self._installation_cache[language_id] = True
            
            return {
                'success': True,
                'message': f'{language.name} installed successfully',
                'version': '1.0.0'  # Mock version
            }
            
        except Exception as e:
            logger.error(f"Error installing {language.name}: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to install {language.name}: {str(e)}',
                'version': None
            }
    
    async def uninstall_language(self, language_id: str) -> Dict[str, Any]:
        """Uninstall a programming language"""
        if language_id not in self.languages:
            return {
                'success': False,
                'message': f'Language {language_id} not found'
            }
        
        language = self.languages[language_id]
        
        try:
            # For demo purposes, we'll just remove from cache
            self._installation_cache[language_id] = False
            
            return {
                'success': True,
                'message': f'{language.name} uninstalled successfully'
            }
            
        except Exception as e:
            logger.error(f"Error uninstalling {language.name}: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to uninstall {language.name}: {str(e)}'
            }
    
    async def _check_installation(self, language: Language) -> bool:
        """Check if a language is installed"""
        # Check cache first
        if language.id in self._installation_cache:
            return self._installation_cache[language.id]
        
        try:
            # Try to run the check command
            process = await asyncio.create_subprocess_shell(
                language.check_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=5.0)
            is_installed = process.returncode == 0
            
            # Cache the result
            self._installation_cache[language.id] = is_installed
            return is_installed
            
        except (asyncio.TimeoutError, Exception):
            # Assume not installed if we can't check
            self._installation_cache[language.id] = False
            return False
    
    async def _get_version(self, language: Language) -> Optional[str]:
        """Get installed version of a language"""
        try:
            process = await asyncio.create_subprocess_shell(
                language.check_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=5.0)
            
            if process.returncode == 0:
                output = stdout.decode('utf-8', errors='replace')
                # Extract version number using regex
                version_match = re.search(r'(\d+(?:\.\d+)*)', output)
                if version_match:
                    return version_match.group(1)
            
            return None
            
        except (asyncio.TimeoutError, Exception):
            return None

# Global language service instance
language_service = LanguageService()