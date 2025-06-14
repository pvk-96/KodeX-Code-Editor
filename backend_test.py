import unittest
import requests
import json
import os
import time
import uuid

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"\'')
            break

# Ensure the URL ends with /api for all API calls
API_URL = f"{BACKEND_URL}/api"

class BackendAPITest(unittest.TestCase):
    """Test suite for CodeEditor AI backend API"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_file_path = f"test_file_{uuid.uuid4().hex[:8]}.txt"
        self.test_folder_path = f"test_folder_{uuid.uuid4().hex[:8]}"
        self.test_content = "This is a test file content."
        self.session_id = None
    
    def tearDown(self):
        """Clean up after tests"""
        # Delete test file if it exists
        try:
            requests.delete(f"{API_URL}/files/{self.test_file_path}")
        except:
            pass
        
        # Delete test folder if it exists
        try:
            requests.delete(f"{API_URL}/files/{self.test_folder_path}")
        except:
            pass
    
    def test_01_health_check(self):
        """Test health check endpoint"""
        response = requests.get(f"{API_URL}/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["services"]["ai"], "online")
        self.assertEqual(data["services"]["files"], "online")
        self.assertEqual(data["services"]["terminal"], "online")
        self.assertEqual(data["services"]["languages"], "online")
    
    def test_02_file_operations(self):
        """Test file operations endpoints"""
        # 1. Create a test file
        create_response = requests.post(
            f"{API_URL}/files",
            json={
                "name": self.test_file_path,
                "parent_path": "/",
                "type": "file",
                "content": self.test_content
            }
        )
        self.assertEqual(create_response.status_code, 200)
        file_data = create_response.json()
        self.assertEqual(file_data["name"], self.test_file_path)
        self.assertEqual(file_data["type"], "file")
        
        # 2. Get file tree
        tree_response = requests.get(f"{API_URL}/files")
        self.assertEqual(tree_response.status_code, 200)
        files = tree_response.json()
        self.assertTrue(any(f["name"] == self.test_file_path for f in files))
        
        # 3. Get specific file
        file_response = requests.get(f"{API_URL}/files/{self.test_file_path}")
        self.assertEqual(file_response.status_code, 200)
        file_data = file_response.json()
        self.assertEqual(file_data["name"], self.test_file_path)
        self.assertEqual(file_data["content"], self.test_content)
        
        # 4. Update file content
        updated_content = "This is updated content."
        update_response = requests.put(
            f"{API_URL}/files/{self.test_file_path}",
            json={"content": updated_content}
        )
        self.assertEqual(update_response.status_code, 200)
        
        # 5. Verify updated content
        file_response = requests.get(f"{API_URL}/files/{self.test_file_path}")
        self.assertEqual(file_response.status_code, 200)
        file_data = file_response.json()
        self.assertEqual(file_data["content"], updated_content)
        
        # 6. Create a folder
        folder_response = requests.post(
            f"{API_URL}/files",
            json={
                "name": self.test_folder_path,
                "parent_path": "/",
                "type": "folder"
            }
        )
        self.assertEqual(folder_response.status_code, 200)
        folder_data = folder_response.json()
        self.assertEqual(folder_data["name"], self.test_folder_path)
        self.assertEqual(folder_data["type"], "folder")
        
        # 7. Delete file
        delete_response = requests.delete(f"{API_URL}/files/{self.test_file_path}")
        self.assertEqual(delete_response.status_code, 200)
        self.assertTrue(delete_response.json()["success"])
        
        # 8. Delete folder
        delete_folder_response = requests.delete(f"{API_URL}/files/{self.test_folder_path}")
        self.assertEqual(delete_folder_response.status_code, 200)
        self.assertTrue(delete_folder_response.json()["success"])
    
    def test_03_terminal_commands(self):
        """Test terminal command execution"""
        # 1. Execute echo command
        echo_response = requests.post(
            f"{API_URL}/terminal/execute",
            json={
                "command": "echo 'Hello World'",
                "working_directory": "/tmp/codeeditor"
            }
        )
        self.assertEqual(echo_response.status_code, 200)
        echo_data = echo_response.json()
        self.assertTrue(echo_data["success"])
        self.assertEqual(echo_data["command"]["exit_code"], 0)
        self.assertIn("Hello World", echo_data["command"]["output"])
        
        # 2. Execute pwd command
        pwd_response = requests.post(
            f"{API_URL}/terminal/execute",
            json={
                "command": "pwd",
                "working_directory": "/tmp/codeeditor"
            }
        )
        self.assertEqual(pwd_response.status_code, 200)
        pwd_data = pwd_response.json()
        self.assertTrue(pwd_data["success"])
        self.assertEqual(pwd_data["command"]["exit_code"], 0)
        self.assertIn("/tmp/codeeditor", pwd_data["command"]["output"])
        
        # 3. Execute ls command
        ls_response = requests.post(
            f"{API_URL}/terminal/execute",
            json={
                "command": "ls -la",
                "working_directory": "/tmp/codeeditor"
            }
        )
        self.assertEqual(ls_response.status_code, 200)
        ls_data = ls_response.json()
        self.assertTrue(ls_data["success"])
        self.assertEqual(ls_data["command"]["exit_code"], 0)
        
        # 4. Get terminal history
        history_response = requests.get(f"{API_URL}/terminal/history")
        self.assertEqual(history_response.status_code, 200)
        history = history_response.json()
        self.assertIsInstance(history, list)
        
        # 5. Clear terminal history
        clear_response = requests.delete(f"{API_URL}/terminal/history")
        self.assertEqual(clear_response.status_code, 200)
        self.assertTrue(clear_response.json()["success"])
    
    def test_04_ai_chat(self):
        """Test AI chat functionality"""
        # 1. Send a message to AI
        chat_response = requests.post(
            f"{API_URL}/ai/chat",
            json={
                "message": "What is Python?",
                "session_id": None
            }
        )
        self.assertEqual(chat_response.status_code, 200)
        chat_data = chat_response.json()
        self.assertIsNotNone(chat_data["session_id"])
        self.assertEqual(chat_data["message"]["type"], "ai")
        self.assertIsNotNone(chat_data["message"]["content"])
        
        # Save session ID for future tests
        self.session_id = chat_data["session_id"]
        
        # 2. Send another message in the same session
        if self.session_id:
            follow_up_response = requests.post(
                f"{API_URL}/ai/chat",
                json={
                    "message": "What are its main features?",
                    "session_id": self.session_id
                }
            )
            self.assertEqual(follow_up_response.status_code, 200)
            follow_up_data = follow_up_response.json()
            self.assertEqual(follow_up_data["session_id"], self.session_id)
            self.assertEqual(follow_up_data["message"]["type"], "ai")
            self.assertIsNotNone(follow_up_data["message"]["content"])
        
        # 3. Get chat sessions
        sessions_response = requests.get(f"{API_URL}/ai/sessions")
        self.assertEqual(sessions_response.status_code, 200)
        sessions = sessions_response.json()
        self.assertIsInstance(sessions, list)
        
        # 4. Get messages for a session
        if self.session_id:
            messages_response = requests.get(f"{API_URL}/ai/sessions/{self.session_id}/messages")
            self.assertEqual(messages_response.status_code, 200)
            messages = messages_response.json()
            self.assertIsInstance(messages, list)
            self.assertGreaterEqual(len(messages), 2)  # At least user message and AI response
    
    def test_05_languages(self):
        """Test language endpoints"""
        # 1. Get available languages
        languages_response = requests.get(f"{API_URL}/languages")
        self.assertEqual(languages_response.status_code, 200)
        languages = languages_response.json()
        self.assertIsInstance(languages, list)
        self.assertGreater(len(languages), 0)
        
        # 2. Search languages
        search_response = requests.get(f"{API_URL}/languages/search/python")
        self.assertEqual(search_response.status_code, 200)
        search_results = search_response.json()
        self.assertIsInstance(search_results, list)
        self.assertTrue(any(lang["id"] == "python" for lang in search_results))
    
    def test_06_themes(self):
        """Test theme endpoints"""
        # Get available themes
        themes_response = requests.get(f"{API_URL}/themes")
        self.assertEqual(themes_response.status_code, 200)
        themes = themes_response.json()
        self.assertIsInstance(themes, list)
        self.assertGreater(len(themes), 0)
        self.assertTrue(any(theme["id"] == "dark" for theme in themes))
    
    def test_07_preferences(self):
        """Test user preferences endpoints"""
        # 1. Get current preferences
        prefs_response = requests.get(f"{API_URL}/preferences")
        self.assertEqual(prefs_response.status_code, 200)
        prefs = prefs_response.json()
        self.assertEqual(prefs["id"], "default")
        
        # 2. Update preferences
        update_data = {
            "theme_id": "monokai",
            "font_size": 16,
            "word_wrap": True
        }
        update_response = requests.put(
            f"{API_URL}/preferences",
            json=update_data
        )
        self.assertEqual(update_response.status_code, 200)
        updated_prefs = update_response.json()
        self.assertEqual(updated_prefs["theme_id"], "monokai")
        self.assertEqual(updated_prefs["font_size"], 16)
        self.assertEqual(updated_prefs["word_wrap"], True)
        
        # 3. Verify preferences were updated
        verify_response = requests.get(f"{API_URL}/preferences")
        self.assertEqual(verify_response.status_code, 200)
        verify_prefs = verify_response.json()
        self.assertEqual(verify_prefs["theme_id"], "monokai")
        self.assertEqual(verify_prefs["font_size"], 16)
        self.assertEqual(verify_prefs["word_wrap"], True)
        
        # 4. Reset preferences to original
        reset_data = {
            "theme_id": "dark",
            "font_size": 14,
            "word_wrap": False
        }
        reset_response = requests.put(
            f"{API_URL}/preferences",
            json=reset_data
        )
        self.assertEqual(reset_response.status_code, 200)

if __name__ == "__main__":
    # Run tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
