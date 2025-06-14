// Mock data for the code editor

export const mockFileSystem = {
  id: 'root',
  name: 'Projects',
  type: 'folder',
  children: [
    {
      id: 'project1',
      name: 'my-web-app',
      type: 'folder',
      children: [
        {
          id: 'file1',
          name: 'index.html',
          type: 'file',
          language: 'html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web App</title>
</head>
<body>
    <h1>Hello World!</h1>
    <script src="script.js"></script>
</body>
</html>`
        },
        {
          id: 'file2',
          name: 'script.js',
          type: 'file',
          language: 'javascript',
          content: `console.log('Hello from JavaScript!');

function greetUser(name) {
    return \`Hello, \${name}! Welcome to my app.\`;
}

document.addEventListener('DOMContentLoaded', () => {
    const greeting = greetUser('Developer');
    console.log(greeting);
});`
        },
        {
          id: 'file3',
          name: 'styles.css',
          type: 'file',
          language: 'css',
          content: `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f0f0f0;
}

h1 {
    color: #333;
    text-align: center;
    margin-bottom: 30px;
}`
        }
      ]
    },
    {
      id: 'project2',
      name: 'python-scripts',
      type: 'folder',
      children: [
        {
          id: 'file4',
          name: 'hello.py',
          type: 'file',
          language: 'python',
          content: `#!/usr/bin/env python3

def main():
    print("Hello from Python!")
    name = input("What's your name? ")
    print(f"Nice to meet you, {name}!")

if __name__ == "__main__":
    main()`
        }
      ]
    }
  ]
};

export const mockAIResponses = [
  {
    query: "How to create a function in JavaScript?",
    response: `Here's how you can create a function in JavaScript:

**Function Declaration:**
\`\`\`javascript
function functionName(parameters) {
    // code to execute
    return value; // optional
}
\`\`\`

**Function Expression:**
\`\`\`javascript
const functionName = function(parameters) {
    // code to execute
    return value; // optional
};
\`\`\`

**Arrow Function:**
\`\`\`javascript
const functionName = (parameters) => {
    // code to execute
    return value; // optional
};
\`\`\`

**Examples:**
\`\`\`javascript
// Simple function
function greet(name) {
    return "Hello, " + name + "!";
}

// Arrow function
const add = (a, b) => a + b;

// Function with default parameters
function multiply(a, b = 1) {
    return a * b;
}
\`\`\``,
    timestamp: new Date()
  },
  {
    query: "Explain Python list comprehensions",
    response: `List comprehensions in Python provide a concise way to create lists:

**Basic Syntax:**
\`\`\`python
[expression for item in iterable]
\`\`\`

**With Condition:**
\`\`\`python
[expression for item in iterable if condition]
\`\`\`

**Examples:**
\`\`\`python
# Create a list of squares
squares = [x**2 for x in range(10)]
# Result: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# Filter even numbers and square them
even_squares = [x**2 for x in range(20) if x % 2 == 0]
# Result: [0, 4, 16, 36, 64, 100, 144, 196, 256, 324]

# Process strings
words = ['hello', 'world', 'python']
upper_words = [word.upper() for word in words]
# Result: ['HELLO', 'WORLD', 'PYTHON']
\`\`\``,
    timestamp: new Date()
  }
];

export const mockTerminalHistory = [
  { command: 'ls -la', output: 'total 12\ndrwxr-xr-x 3 user user 4096 Jun 15 10:30 .\ndrwxr-xr-x 5 user user 4096 Jun 15 10:25 ..\n-rw-r--r-- 1 user user  243 Jun 15 10:30 index.html\n-rw-r--r-- 1 user user  156 Jun 15 10:30 script.js', type: 'success' },
  { command: 'python hello.py', output: 'Hello from Python!\nWhat\'s your name? Developer\nNice to meet you, Developer!', type: 'success' },
  { command: 'node script.js', output: 'Hello from JavaScript!\nHello, Developer! Welcome to my app.', type: 'success' },
  { command: 'invalid-command', output: 'bash: invalid-command: command not found', type: 'error' }
];

export const mockLanguages = [
  { id: 'python', name: 'Python', version: '3.9.7', installed: true, description: 'High-level programming language' },
  { id: 'node', name: 'Node.js', version: '16.14.0', installed: true, description: 'JavaScript runtime' },
  { id: 'java', name: 'Java', version: null, installed: false, description: 'Object-oriented programming language' },
  { id: 'go', name: 'Go', version: null, installed: false, description: 'Fast, statically typed language' },
  { id: 'rust', name: 'Rust', version: null, installed: false, description: 'Systems programming language' },
  { id: 'php', name: 'PHP', version: null, installed: false, description: 'Web development language' },
  { id: 'ruby', name: 'Ruby', version: null, installed: false, description: 'Dynamic programming language' },
  { id: 'csharp', name: 'C#', version: null, installed: false, description: 'Microsoft\'s programming language' }
];

export const mockThemes = [
  { id: 'dark', name: 'Dark', primary: '#1e1e1e', secondary: '#252526', accent: '#007acc' },
  { id: 'light', name: 'Light', primary: '#ffffff', secondary: '#f3f3f3', accent: '#0078d4' },
  { id: 'monokai', name: 'Monokai', primary: '#272822', secondary: '#3e3d32', accent: '#f92672' },
  { id: 'dracula', name: 'Dracula', primary: '#282a36', secondary: '#44475a', accent: '#bd93f9' },
  { id: 'nord', name: 'Nord', primary: '#2e3440', secondary: '#3b4252', accent: '#5e81ac' },
  { id: 'github', name: 'GitHub', primary: '#0d1117', secondary: '#161b22', accent: '#58a6ff' }
];

// Mock AI completion suggestions
export const mockCompletions = {
  'function ': 'function myFunction() {\n    // Your code here\n}',
  'const ': 'const variableName = value;',
  'let ': 'let variableName = value;',
  'if (': 'if (condition) {\n    // Your code here\n}',
  'for (': 'for (let i = 0; i < length; i++) {\n    // Your code here\n}',
  'class ': 'class MyClass {\n    constructor() {\n        // Constructor code\n    }\n}',
  'import ': 'import { module } from \'package\';',
  'def ': 'def function_name():\n    # Your code here\n    pass',
  'class ': 'class MyClass:\n    def __init__(self):\n        # Constructor code\n        pass'
};
