'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, Download, Code, Eye, ExternalLink, Maximize, Minimize, RefreshCcw, 
  Upload, FolderPlus, FilePlus, Save, Trash2, ChevronRight, ChevronDown, 
  Menu, X, PanelLeft, LayoutTemplate, EyeOff, Smartphone, Tablet, Monitor,
  Edit, MoreHorizontal, Folder, Play, MoveHorizontal, MoreVertical, Terminal,
  Bug, Info, Layers, Cpu, Activity, Grid
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My HTML Page</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #0070f3;
      margin-bottom: 0.5rem;
    }
    p {
      margin-bottom: 1rem;
    }
    .container {
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      background-color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to the HTML Editor</h1>
    <p>This is a live preview of your HTML code. Start editing to see changes in real-time!</p>
    <p>You can create:</p>
    <ul>
      <li>Websites</li>
      <li>Prototypes</li>
      <li>Documentation</li>
    </ul>
    <p>Try adding some HTML elements and see the changes instantly!</p>
  </div>
</body>
</html>`;

const DEFAULT_CSS = `body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #0070f3;
  margin-bottom: 0.5rem;
}

p {
  margin-bottom: 1rem;
}

.container {
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}`;

const DEFAULT_JS = `// Your JavaScript code here
document.addEventListener('DOMContentLoaded', function() {
  console.log('Document is ready!');
  
  // Example: Add a click event to the heading
  const heading = document.querySelector('h1');
  if (heading) {
    heading.addEventListener('click', function() {
      alert('You clicked the heading!');
    });
  }
});`;

type FileType = 'html' | 'css' | 'js' | 'json' | 'txt' | 'md';

interface FileItem {
  id: string;
  name: string;
  type: FileType;
  content: string;
  parentId: string | null;
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  isOpen: boolean;
}

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-card flex items-center justify-center text-muted-foreground">
      Loading editor...
    </div>
  ),
});

const getLanguageFromFileType = (type: FileType): string => {
  switch (type) {
    case 'html': return 'html';
    case 'css': return 'css';
    case 'js': return 'javascript';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
};

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export default function Home() {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [preview, setPreview] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [mobileFileExplorerOpen, setMobileFileExplorerOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file');
  const [newFileType, setNewFileType] = useState<FileType>('html');
  const [newItemParentId, setNewItemParentId] = useState<string | null>(null);
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewLayout, setPreviewLayout] = useState<'side' | 'bottom' | 'mobile'>('side');
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<{id: string, name: string, isFolder: boolean} | null>(null);
  const [draggedItem, setDraggedItem] = useState<{id: string, isFolder: boolean} | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { theme } = useTheme();
  const editorRef = useRef(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDevTools, setShowDevTools] = useState(false);
  const [activeDevTool, setActiveDevTool] = useState<'console' | 'elements' | 'network' | 'info'>('console');
  const [consoleMessages, setConsoleMessages] = useState<Array<{type: string, content: string}>>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const savedFiles = localStorage.getItem('editor_files');
        const savedFolders = localStorage.getItem('editor_folders');
        const savedActiveFileId = localStorage.getItem('editor_activeFileId');
        
        let hasData = false;
        
        if (savedFiles) {
          const parsedFiles = JSON.parse(savedFiles);
          if (parsedFiles && Array.isArray(parsedFiles) && parsedFiles.length > 0) {
            setFiles(parsedFiles);
            hasData = true;
          }
        }
        
        if (savedFolders) {
          const parsedFolders = JSON.parse(savedFolders);
          if (parsedFolders && Array.isArray(parsedFolders)) {
            setFolders(parsedFolders);
          }
        }
        
        if (savedActiveFileId && savedActiveFileId !== "null" && savedActiveFileId !== "undefined") {
          setActiveFileId(savedActiveFileId);
        }
        
        setDataLoaded(true);
        return hasData;
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        setDataLoaded(true);
        return false;
      }
    };
    
    // Load from localStorage
    const hasData = loadFromLocalStorage();
    
    // If no data was loaded, we'll create default files in the next useEffect
    // This effect will run only once
  }, []);

  // Create default files if none exist after localStorage attempt
  useEffect(() => {
    // Only create default files if we've tried loading from localStorage
    // and there are no files
    if (dataLoaded && files.length === 0) {
      const htmlFileId = generateId();
      const cssFileId = generateId();
      const jsFileId = generateId();
      
      const defaultFiles = [
        {
          id: htmlFileId,
          name: 'index.html',
          type: 'html' as FileType,
          content: DEFAULT_HTML,
          parentId: null
        },
        {
          id: cssFileId,
          name: 'styles.css',
          type: 'css' as FileType,
          content: DEFAULT_CSS,
          parentId: null
        },
        {
          id: jsFileId,
          name: 'script.js',
          type: 'js' as FileType,
          content: DEFAULT_JS,
          parentId: null
        }
      ];
      
      setFiles(defaultFiles);
      setActiveFileId(htmlFileId);
      
      // Also save these default files to localStorage
      localStorage.setItem('editor_files', JSON.stringify(defaultFiles));
      localStorage.setItem('editor_activeFileId', htmlFileId);
    }
  }, [dataLoaded, files.length]);

  // Save files to localStorage whenever they change
  useEffect(() => {
    // Only save if we've finished loading initial data
    // This prevents overwriting data with empty arrays during initialization
    if (dataLoaded && files.length > 0) {
      try {
        localStorage.setItem('editor_files', JSON.stringify(files));
      } catch (error) {
        console.error('Error saving files to localStorage:', error);
      }
    }
  }, [files, dataLoaded]);

  // Save folders to localStorage whenever they change
  useEffect(() => {
    if (dataLoaded) {
      try {
        localStorage.setItem('editor_folders', JSON.stringify(folders));
      } catch (error) {
        console.error('Error saving folders to localStorage:', error);
      }
    }
  }, [folders, dataLoaded]);

  // Save active file ID whenever it changes
  useEffect(() => {
    if (dataLoaded && activeFileId) {
      try {
        localStorage.setItem('editor_activeFileId', activeFileId);
      } catch (error) {
        console.error('Error saving active file ID to localStorage:', error);
      }
    }
  }, [activeFileId, dataLoaded]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const activeFile = files.find(file => file.id === activeFileId);

  const updateFileContent = (content: string) => {
    if (activeFileId) {
      setFiles(prev => prev.map(file => 
        file.id === activeFileId ? { ...file, content } : file
      ));
      
      // If auto-update is enabled, update the preview immediately
      if (autoUpdate) {
        updatePreview();
      }
    }
  };

  const updatePreview = useCallback(() => {
    const previewContent = generatePreviewForActiveFile();
    setPreview(previewContent);
  }, [activeFileId, files]);

  const generatePreviewForActiveFile = useCallback(() => {
    if (!activeFile) return '';
    
    switch (activeFile.type) {
      case 'html':
        return generateHTMLPreviewForFile(activeFile.id);
      case 'js':
        return generateJavaScriptPreview();
      case 'css':
        return generateCSSPreview();
      default:
        return generateGenericPreview();
    }
  }, [activeFile, files]);

  // Create a function to add console messages (will be used by the preview iframe)
  const addConsoleMessage = useCallback((type: string, content: string) => {
    setConsoleMessages(prev => [...prev, {type, content}]);
  }, []);

  // Clear console messages
  const clearConsole = () => {
    setConsoleMessages([]);
  };

  // Generate HTML with console capture
  const generateHTMLPreviewForFile = useCallback((fileId: string) => {
    // Find the specific HTML file by ID
    const htmlFile = files.find(file => file.id === fileId);
    if (!htmlFile || htmlFile.type !== 'html') return '';
    
    const cssFiles = files.filter(file => file.type === 'css');
    const cssContent = cssFiles.map(file => `<style>${file.content}</style>`).join('\n');
    
    const jsFiles = files.filter(file => file.type === 'js');
    const jsContent = jsFiles.map(file => `<script>${file.content}</script>`).join('\n');
    
    // Add console capture script
    const consoleCapture = `
    <script>
      // Capture console methods
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };
      
      // Function to send messages to parent
      function sendToParent(type, content) {
        try {
          window.parent.postMessage({
            type: 'console',
            logType: type,
            content: typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content)
          }, '*');
        } catch (e) {
          // Fallback if stringify fails
          window.parent.postMessage({
            type: 'console',
            logType: type,
            content: String(content)
          }, '*');
        }
      }
      
      // Override console methods
      console.log = function(...args) {
        originalConsole.log.apply(console, args);
        args.forEach(arg => sendToParent('log', arg));
      };
      
      console.error = function(...args) {
        originalConsole.error.apply(console, args);
        args.forEach(arg => sendToParent('error', arg));
      };
      
      console.warn = function(...args) {
        originalConsole.warn.apply(console, args);
        args.forEach(arg => sendToParent('warn', arg));
      };
      
      console.info = function(...args) {
        originalConsole.info.apply(console, args);
        args.forEach(arg => sendToParent('info', arg));
      };
      
      // Capture errors
      window.addEventListener('error', function(event) {
        sendToParent('error', event.message + ' at line ' + event.lineno + ':' + event.colno);
        return false;
      });
    </script>
    `;
    
    let fullHTML = htmlFile.content;
    
    // Only inject CSS and JS if the HTML file has head and body tags
    if (fullHTML.includes('</head>')) {
      fullHTML = fullHTML.replace('</head>', `${cssContent}\n${consoleCapture}\n</head>`);
    } else {
      // If no head tag, try to add near the beginning
      const htmlTagIndex = fullHTML.indexOf('<html');
      if (htmlTagIndex !== -1) {
        const closingHtmlTagIndex = fullHTML.indexOf('>', htmlTagIndex);
        if (closingHtmlTagIndex !== -1) {
          fullHTML = fullHTML.slice(0, closingHtmlTagIndex + 1) + 
                    `\n<head>${cssContent}\n${consoleCapture}\n</head>\n` + 
                    fullHTML.slice(closingHtmlTagIndex + 1);
        }
      } else {
        // If no HTML tag, just add at the beginning
        fullHTML = `<html>\n<head>${cssContent}\n${consoleCapture}\n</head>\n${fullHTML}</html>`;
      }
    }
    
    if (fullHTML.includes('</body>')) {
      fullHTML = fullHTML.replace('</body>', `${jsContent}\n</body>`);
    } else {
      // If no body closing tag but has body tag
      const bodyIndex = fullHTML.indexOf('<body');
      if (bodyIndex !== -1) {
        fullHTML = fullHTML + `\n${jsContent}\n</body>`;
      } else {
        // No body tag, add before closing html if exists
        const htmlCloseIndex = fullHTML.indexOf('</html>');
        if (htmlCloseIndex !== -1) {
          fullHTML = fullHTML.slice(0, htmlCloseIndex) + 
                    `\n${jsContent}\n` + 
                    fullHTML.slice(htmlCloseIndex);
        } else {
          // No HTML closing tag, add at the end
          fullHTML = fullHTML + `\n${jsContent}`;
        }
      }
    }
    
    return fullHTML;
  }, [files]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'console') {
        addConsoleMessage(event.data.logType, event.data.content);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addConsoleMessage]);

  // Generate JavaScript preview with console redirection
  const generateJavaScriptPreview = () => {
    if (!activeFile || activeFile.type !== 'js') return '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JavaScript Runner</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .output {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            min-height: 100px;
            background-color: #f9f9f9;
            white-space: pre-wrap;
          }
          h1 {
            color: #0070f3;
            margin-bottom: 0.5rem;
          }
          .error {
            color: red;
            font-family: monospace;
            white-space: pre-wrap;
          }
        </style>
        <script>
          // Capture console methods
          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
          };
          
          // Function to send messages to parent
          function sendToParent(type, content) {
            try {
              window.parent.postMessage({
                type: 'console',
                logType: type,
                content: typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content)
              }, '*');
            } catch (e) {
              // Fallback if stringify fails
              window.parent.postMessage({
                type: 'console',
                logType: type,
                content: String(content)
              }, '*');
            }
          }
          
          // Override console methods
          console.log = function(...args) {
            originalConsole.log.apply(console, args);
            args.forEach(arg => sendToParent('log', arg));
          };
          
          console.error = function(...args) {
            originalConsole.error.apply(console, args);
            args.forEach(arg => sendToParent('error', arg));
          };
          
          console.warn = function(...args) {
            originalConsole.warn.apply(console, args);
            args.forEach(arg => sendToParent('warn', arg));
          };
          
          console.info = function(...args) {
            originalConsole.info.apply(console, args);
            args.forEach(arg => sendToParent('info', arg));
          };
          
          // Capture errors
          window.addEventListener('error', function(event) {
            sendToParent('error', event.message + ' at line ' + event.lineno + ':' + event.colno);
            return false;
          });
        </script>
      </head>
      <body>
        <h1>JavaScript Runner: ${activeFile.name}</h1>
        <div class="output" id="output"></div>
        
        <script>
          // Run the user code
          try {
            ${activeFile.content}
          } catch (error) {
            console.error(error.message);
          }
        </script>
      </body>
      </html>
    `;
  };

  const generateCSSPreview = () => {
    if (!activeFile || activeFile.type !== 'css') return '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CSS Preview</title>
        <style>
          ${activeFile.content}
        </style>
      </head>
      <body>
        <h1>CSS Preview: ${activeFile.name}</h1>
        <div class="preview-content">
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <p>This is a paragraph with <a href="#">a link</a> inside it.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
            <li>List item 3</li>
          </ul>
          <div class="container">
            <p>This is a container with some text.</p>
            <button>Button</button>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generateGenericPreview = () => {
    if (!activeFile) return '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File Preview</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          pre {
            background-color: #f7f7f7;
            padding: 15px;
            border-radius: 8px;
            overflow: auto;
            white-space: pre-wrap;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <h1>File Content: ${activeFile.name}</h1>
        <pre>${activeFile.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    if (autoUpdate) {
      updatePreview();
    }
  }, [activeFileId, files, autoUpdate, updatePreview]);

  const copyToClipboard = async () => {
    if (!activeFile) return;
    
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const downloadActiveFile = () => {
    if (!activeFile) return;
    
    const element = document.createElement('a');
    const file = new Blob([activeFile.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = activeFile.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadFullProject = () => {
    import('jszip').then(({ default: JSZip }) => {
      const zip = new JSZip();
      
      files.forEach(file => {
        let path = file.name;
        let parentId = file.parentId;
        
        while (parentId) {
          const folder = folders.find(f => f.id === parentId);
          if (folder) {
            path = `${folder.name}/${path}`;
            parentId = folder.parentId;
          } else {
            break;
          }
        }
        
        zip.file(path, file.content);
      });
      
      zip.generateAsync({ type: 'blob' }).then(content => {
        const element = document.createElement('a');
        element.href = URL.createObjectURL(content);
        element.download = 'project.zip';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      });
    });
  };

  const openInNewTab = () => {
    const newWindow = window.open('', '_blank');
    newWindow.document.write(preview);
    newWindow.document.close();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const resetToDefault = () => {
    if (confirm("Reset to default template? This will replace your current files.")) {
      const htmlFileId = generateId();
      const cssFileId = generateId();
      const jsFileId = generateId();
      
      setFiles([
        {
          id: htmlFileId,
          name: 'index.html',
          type: 'html',
          content: DEFAULT_HTML,
          parentId: null
        },
        {
          id: cssFileId,
          name: 'styles.css',
          type: 'css',
          content: DEFAULT_CSS,
          parentId: null
        },
        {
          id: jsFileId,
          name: 'script.js',
          type: 'js',
          content: DEFAULT_JS,
          parentId: null
        }
      ]);
      
      setFolders([]);
      setActiveFileId(htmlFileId);
    }
  };

  const toggleFileExplorer = () => {
    setShowFileExplorer(!showFileExplorer);
  };

  const handleFileClick = (fileId: string) => {
    setActiveFileId(fileId);
    if (window.innerWidth < 768) {
      setMobileFileExplorerOpen(false);
    }
  };

  const handleFolderClick = (folderId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, isOpen: !folder.isOpen } : folder
    ));
  };

  const createNewItem = () => {
    if (!newItemName) return;
    
    if (newItemType === 'file') {
      const newFileId = generateId();
      
      // Ensure file has the right extension
      let fileName = newItemName;
      if (!fileName.includes(`.${newFileType}`)) {
        fileName = `${fileName}.${newFileType}`;
      }
      
      // Get appropriate default content
      const defaultContent = getDefaultContentForNewFile(newFileType, fileName);
      
      const newFile = {
        id: newFileId,
        name: fileName,
        type: newFileType,
        content: defaultContent,
        parentId: newItemParentId
      };
      
      // Update files and immediately save to localStorage
      setFiles(prev => {
        const updatedFiles = [...prev, newFile];
        try {
          localStorage.setItem('editor_files', JSON.stringify(updatedFiles));
        } catch (error) {
          console.error('Error saving new file to localStorage:', error);
        }
        return updatedFiles;
      });
      
      setActiveFileId(newFileId);
      try {
        localStorage.setItem('editor_activeFileId', newFileId);
      } catch (error) {
        console.error('Error saving active file ID to localStorage:', error);
      }
    } else {
      const newFolderId = generateId();
      const newFolder = {
        id: newFolderId,
        name: newItemName,
        parentId: newItemParentId,
        isOpen: true
      };
      
      // Update folders and immediately save to localStorage
      setFolders(prev => {
        const updatedFolders = [...prev, newFolder];
        try {
          localStorage.setItem('editor_folders', JSON.stringify(updatedFolders));
        } catch (error) {
          console.error('Error saving new folder to localStorage:', error);
        }
        return updatedFolders;
      });
    }
    
    setNewItemName('');
    setIsNewItemDialogOpen(false);
  };

  const deleteItem = (id: string, isFolder: boolean) => {
    if (isFolder) {
      if (confirm("Delete this folder and all its contents?")) {
        const foldersToDelete = [id];
        const filesToDelete = [];
        
        const findSubFolders = (parentId: string) => {
          folders.forEach(folder => {
            if (folder.parentId === parentId) {
              foldersToDelete.push(folder.id);
              findSubFolders(folder.id);
            }
          });
        };
        
        findSubFolders(id);
        
        files.forEach(file => {
          if (foldersToDelete.includes(file.parentId)) {
            filesToDelete.push(file.id);
          }
        });
        
        // Update files
        setFiles(prev => {
          const updatedFiles = prev.filter(file => !filesToDelete.includes(file.id) && file.parentId !== id);
          // Immediately save to localStorage
          try {
            localStorage.setItem('editor_files', JSON.stringify(updatedFiles));
          } catch (error) {
            console.error('Error saving files after deletion to localStorage:', error);
          }
          return updatedFiles;
        });
        
        // Update folders
        setFolders(prev => {
          const updatedFolders = prev.filter(folder => !foldersToDelete.includes(folder.id));
          // Immediately save to localStorage
          try {
            localStorage.setItem('editor_folders', JSON.stringify(updatedFolders));
          } catch (error) {
            console.error('Error saving folders after deletion to localStorage:', error);
          }
          return updatedFolders;
        });
      }
    } else {
      if (confirm("Delete this file?")) {
        // Update files
        setFiles(prev => {
          const updatedFiles = prev.filter(file => file.id !== id);
          // Immediately save to localStorage
          try {
            localStorage.setItem('editor_files', JSON.stringify(updatedFiles));
          } catch (error) {
            console.error('Error saving files after deletion to localStorage:', error);
          }
          return updatedFiles;
        });
        
        if (activeFileId === id) {
          const remainingFiles = files.filter(file => file.id !== id);
          if (remainingFiles.length > 0) {
            const newActiveId = remainingFiles[0].id;
            setActiveFileId(newActiveId);
            // Immediately save to localStorage
            try {
              localStorage.setItem('editor_activeFileId', newActiveId);
            } catch (error) {
              console.error('Error saving active file ID after deletion to localStorage:', error);
            }
          } else {
            setActiveFileId(null);
            // Immediately save to localStorage
            try {
              localStorage.removeItem('editor_activeFileId');
            } catch (error) {
              console.error('Error removing active file ID from localStorage:', error);
            }
          }
        }
      }
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const fileName = uploadedFile.name;
      const fileExtension = fileName.split('.').pop().toLowerCase();
      
      let fileType: FileType = 'txt';
      
      switch (fileExtension) {
        case 'html':
        case 'htm':
          fileType = 'html';
          break;
        case 'css':
          fileType = 'css';
          break;
        case 'js':
          fileType = 'js';
          break;
        case 'json':
          fileType = 'json';
          break;
        case 'md':
          fileType = 'md';
          break;
        default:
          fileType = 'txt';
      }
      
      const newFileId = generateId();
      setFiles(prev => [...prev, {
        id: newFileId,
        name: fileName,
        type: fileType,
        content,
        parentId: null
      }]);
      
      setActiveFileId(newFileId);
    };
    
    reader.readAsText(uploadedFile);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getChildrenOfFolder = (folderId: string | null) => {
    const folderChildren = folders.filter(folder => folder.parentId === folderId);
    const fileChildren = files.filter(file => file.parentId === folderId);
    
    return { folders: folderChildren, files: fileChildren };
  };

  const handleRenameItem = () => {
    if (!itemToRename) return;
    
    const { id, isFolder, name } = itemToRename;
    
    if (!newItemName || newItemName === name) {
      setIsRenameDialogOpen(false);
      return;
    }
    
    if (isFolder) {
      setFolders(prev => prev.map(folder => 
        folder.id === id ? { ...folder, name: newItemName } : folder
      ));
    } else {
      setFiles(prev => prev.map(file => 
        file.id === id ? { 
          ...file, 
          name: newItemName.includes(`.${file.type}`) ? newItemName : `${newItemName}.${file.type}`
        } : file
      ));
    }
    
    setIsRenameDialogOpen(false);
    setItemToRename(null);
    setNewItemName('');
  };

  const startRenamingItem = (id: string, name: string, isFolder: boolean) => {
    setItemToRename({ id, name, isFolder });
    setNewItemName(name);
    setIsRenameDialogOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, id: string, isFolder: boolean) => {
    e.stopPropagation();
    setDraggedItem({ id, isFolder });
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItem) {
      // Don't allow dragging a folder into itself or its children
      if (draggedItem.isFolder && folderId !== null) {
        // Check if target folder is a child of dragged folder
        let currentFolder = folders.find(f => f.id === folderId);
        while (currentFolder) {
          if (currentFolder.parentId === draggedItem.id) {
            return; // Target is a child of dragged folder
          }
          currentFolder = folders.find(f => f.id === currentFolder!.parentId);
        }
      }
      
      // Don't allow dragging into itself
      if (draggedItem.isFolder && draggedItem.id === folderId) {
        return;
      }
      
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) return;
    
    // Prevent dropping a folder into itself or its children
    if (draggedItem.isFolder && targetFolderId !== null) {
      // Check if target folder is a child of dragged folder
      let currentFolder = folders.find(f => f.id === targetFolderId);
      while (currentFolder) {
        if (currentFolder.parentId === draggedItem.id) {
          setDragOverFolderId(null);
          setDraggedItem(null);
          return; // Target is a child of dragged folder
        }
        currentFolder = folders.find(f => f.id === currentFolder!.parentId);
      }
      
      // Don't allow dropping into itself
      if (draggedItem.id === targetFolderId) {
        setDragOverFolderId(null);
        setDraggedItem(null);
        return;
      }
    }
    
    if (draggedItem.isFolder) {
      setFolders(prev => prev.map(folder => 
        folder.id === draggedItem.id ? { ...folder, parentId: targetFolderId } : folder
      ));
    } else {
      setFiles(prev => prev.map(file => 
        file.id === draggedItem.id ? { ...file, parentId: targetFolderId } : file
      ));
    }
    
    setDragOverFolderId(null);
    setDraggedItem(null);
  };

  const FileTreeItem = ({ item, isFolder = false }) => {
    if (isFolder) {
      const { folders: subFolders, files: subFiles } = getChildrenOfFolder(item.id);
      const isDropTarget = dragOverFolderId === item.id;
      
      return (
        <ContextMenu>
          <ContextMenuTrigger>
            <div className="select-none">
              <div 
                className={cn(
                  "flex items-center gap-1 px-2 py-1 hover:bg-secondary/50 rounded cursor-pointer group",
                  isDropTarget && "bg-secondary/70 border border-dashed border-primary"
                )}
                onClick={() => handleFolderClick(item.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id, true)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, item.id)}
              >
                {item.isOpen ? 
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : 
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                }
                <Folder className="h-4 w-4 shrink-0 text-yellow-500" />
                <span className="text-sm truncate">{item.name}</span>
                <div className="ml-auto hidden group-hover:flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewItemParentId(item.id);
                      setIsNewItemDialogOpen(true);
                    }}
                  >
                    <FilePlus className="h-3 w-3" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          startRenamingItem(item.id, item.name, true);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id, true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {item.isOpen && (
                <div className="pl-4">
                  {subFolders.map(folder => (
                    <FileTreeItem key={folder.id} item={folder} isFolder={true} />
                  ))}
                  {subFiles.map(file => (
                    <FileTreeItem key={file.id} item={file} isFolder={false} />
                  ))}
                </div>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                setNewItemParentId(item.id);
                setNewItemType('file');
                setIsNewItemDialogOpen(true);
              }}
            >
              <FilePlus className="h-3.5 w-3.5 mr-2" />
              New File
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setNewItemParentId(item.id);
                setNewItemType('folder');
                setIsNewItemDialogOpen(true);
              }}
            >
              <FolderPlus className="h-3.5 w-3.5 mr-2" />
              New Folder
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => startRenamingItem(item.id, item.name, true)}
            >
              <Edit className="h-3.5 w-3.5 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => deleteItem(item.id, true)}
              className="text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    } else {
      const isActive = activeFileId === item.id;
      
      return (
        <ContextMenu>
          <ContextMenuTrigger>
            <div 
              className={cn(
                "flex items-center gap-1 px-2 py-1 hover:bg-secondary/50 rounded cursor-pointer ml-4 group",
                isActive && "bg-secondary"
              )}
              onClick={() => handleFileClick(item.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id, false)}
            >
              <Code className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="text-sm truncate">{item.name}</span>
              <div className="ml-auto hidden group-hover:flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.id === activeFileId) {
                      runActiveFile();
                    } else {
                      setActiveFileId(item.id);
                      setTimeout(runActiveFile, 100);
                    }
                  }}
                >
                  <Play className="h-3 w-3 text-green-500" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        startRenamingItem(item.id, item.name, false);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id, false);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                if (item.id === activeFileId) {
                  runActiveFile();
                } else {
                  setActiveFileId(item.id);
                  setTimeout(runActiveFile, 100);
                }
              }}
            >
              <Play className="h-3.5 w-3.5 mr-2 text-green-500" />
              Run File
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => startRenamingItem(item.id, item.name, false)}
            >
              <Edit className="h-3.5 w-3.5 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => downloadFileById(item.id)}
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Download
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => deleteItem(item.id, false)}
              className="text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }
  };

  const renderFileExplorer = () => {
    const { folders: rootFolders, files: rootFiles } = getChildrenOfFolder(null);
    
    return (
      <div 
        className="h-full overflow-y-auto p-2"
        onDragOver={(e) => handleDragOver(e, null)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Files</h3>
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => {
                    setNewItemParentId(null);
                    setNewItemType('file');
                    setIsNewItemDialogOpen(true);
                  }}
                >
                  <FilePlus className="h-3.5 w-3.5 mr-2" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setNewItemParentId(null);
                    setNewItemType('folder');
                    setIsNewItemDialogOpen(true);
                  }}
                >
                  <FolderPlus className="h-3.5 w-3.5 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  Import File
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={downloadFullProject}
                >
                  <Save className="h-3.5 w-3.5 mr-2" />
                  Export Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 md:hidden"
              onClick={() => setMobileFileExplorerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="pb-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            className="hidden"
            accept=".html,.htm,.css,.js,.json,.txt,.md"
          />
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-1/2 text-xs"
              onClick={() => {
                setNewItemParentId(null);
                setNewItemType('file');
                setIsNewItemDialogOpen(true);
              }}
            >
              <FilePlus className="h-3 w-3 mr-1" />
              New File
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-1/2 text-xs"
              onClick={() => {
                setNewItemParentId(null);
                setNewItemType('folder');
                setIsNewItemDialogOpen(true);
              }}
            >
              <FolderPlus className="h-3 w-3 mr-1" />
              New Folder
            </Button>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        <div className="space-y-1">
          {rootFolders.map(folder => (
            <FileTreeItem key={folder.id} item={folder} isFolder={true} />
          ))}
          {rootFiles.map(file => (
            <FileTreeItem key={file.id} item={file} isFolder={false} />
          ))}
        </div>
      </div>
    );
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const changePreviewLayout = (layout: 'side' | 'bottom' | 'mobile') => {
    setPreviewLayout(layout);
  };

  const changePreviewDeviceMode = (mode: 'desktop' | 'tablet' | 'mobile') => {
    setPreviewDeviceMode(mode);
  };

  const runActiveFile = () => {
    if (!activeFile) return;
    
    updatePreview();
    
    if (!showPreview) {
      setShowPreview(true);
    }
    
    // Optional: Add a visual indication that the file is running
    const iframe = previewRef.current;
    if (iframe) {
      // Flash effect to indicate refresh
      iframe.style.opacity = '0.5';
      setTimeout(() => {
        iframe.style.opacity = '1';
      }, 100);
    }
  };

  const downloadFileById = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    const element = document.createElement('a');
    const fileBlob = new Blob([file.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = file.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const clearLocalStorage = () => {
    if (confirm("Clear all saved data? This will reset the editor to default state.")) {
      try {
        localStorage.removeItem('editor_files');
        localStorage.removeItem('editor_folders');
        localStorage.removeItem('editor_activeFileId');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      
      // Reset to default
      resetToDefault();
    }
  };

  // Add a function to create a simple HTML template for new HTML files
  const getDefaultContentForNewFile = (fileType: FileType, fileName: string): string => {
    switch (fileType) {
      case 'html':
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName}</title>
</head>
<body>
  <h1>Welcome to ${fileName}</h1>
  <p>This is a new HTML file. Start editing to see changes!</p>
</body>
</html>`;
      case 'css':
        return DEFAULT_CSS;
      case 'js':
        return DEFAULT_JS;
      default:
        return '';
    }
  };

  // Render dev tools panel
  const renderDevTools = () => {
    if (!showDevTools) return null;
    
    return (
      <div className="border-t">
        <div className="bg-card border-b">
          <div className="flex">
            <Button 
              variant={activeDevTool === 'console' ? 'default' : 'ghost'}
              onClick={() => setActiveDevTool('console')}
              className="rounded-none h-9 px-3"
            >
              <Terminal className="h-4 w-4 mr-2" />
              Console
            </Button>
            <Button 
              variant={activeDevTool === 'elements' ? 'default' : 'ghost'}
              onClick={() => setActiveDevTool('elements')}
              className="rounded-none h-9 px-3"
            >
              <Layers className="h-4 w-4 mr-2" />
              Elements
            </Button>
            <Button 
              variant={activeDevTool === 'network' ? 'default' : 'ghost'}
              onClick={() => setActiveDevTool('network')}
              className="rounded-none h-9 px-3"
            >
              <Activity className="h-4 w-4 mr-2" />
              Network
            </Button>
            <Button 
              variant={activeDevTool === 'info' ? 'default' : 'ghost'}
              onClick={() => setActiveDevTool('info')}
              className="rounded-none h-9 px-3"
            >
              <Info className="h-4 w-4 mr-2" />
              Info
            </Button>
            <div className="ml-auto flex items-center">
              {activeDevTool === 'console' && (
                <Button 
                  variant="ghost" 
                  onClick={clearConsole}
                  className="rounded-none h-9 px-3"
                >
                  Clear
                </Button>
              )}
              <Button 
                variant="ghost" 
                onClick={() => setShowDevTools(false)}
                className="rounded-none h-9 px-3"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="h-[200px] overflow-auto bg-black/90 text-white p-2">
          {activeDevTool === 'console' && (
            <div className="font-mono text-sm">
              {consoleMessages.length === 0 ? (
                <div className="text-gray-400 p-2">Console output will appear here</div>
              ) : (
                consoleMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`py-1 border-b border-gray-800 ${
                      msg.type === 'error' ? 'text-red-400' : 
                      msg.type === 'warn' ? 'text-yellow-400' : 
                      msg.type === 'info' ? 'text-blue-400' : 'text-gray-200'
                    }`}
                  >
                    &gt; {msg.content}
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeDevTool === 'elements' && (
            <div className="p-2">
              <div className="text-gray-400">Elements inspector will show DOM structure here</div>
              <div className="mt-2 text-yellow-400">
                This feature is under development - coming soon!
              </div>
            </div>
          )}
          
          {activeDevTool === 'network' && (
            <div className="p-2">
              <div className="text-gray-400">Network requests will be shown here</div>
              <div className="mt-2 text-yellow-400">
                This feature is under development - coming soon!
              </div>
            </div>
          )}
          
          {activeDevTool === 'info' && (
            <div className="p-2">
              <div className="text-gray-200 grid grid-cols-2 gap-2">
                <div>
                  <h3 className="text-blue-400 font-bold">Project Info</h3>
                  <p>Files: {files.length}</p>
                  <p>Folders: {folders.length}</p>
                  <p>Active File: {activeFile?.name || 'None'}</p>
                </div>
                <div>
                  <h3 className="text-blue-400 font-bold">Browser Info</h3>
                  <p>User Agent: {navigator.userAgent}</p>
                  <p>Platform: {navigator.platform}</p>
                  <p>Screen: {window.screen.width} x {window.screen.height}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="h-screen w-full flex flex-col overflow-hidden">
      <header className="border-b p-2 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileFileExplorerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex"
            onClick={toggleFileExplorer}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold truncate max-w-[150px] sm:max-w-[250px] md:max-w-full">
            {activeFile ? activeFile.name : 'HTML Editor'}
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-1 items-center justify-end">
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {activeFile && (
                  <DropdownMenuItem onClick={runActiveFile}>
                    <Play className="h-4 w-4 mr-2 text-green-500" />
                    Run
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={resetToDefault}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reset
                </DropdownMenuItem>
                {activeFile && (
                  <>
                    <DropdownMenuItem onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadActiveFile}>
                      <Download className="h-4 w-4 mr-2" />
                      Save File
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={downloadFullProject}>
                  <Save className="h-4 w-4 mr-2" />
                  Export All
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAutoUpdate(!autoUpdate)}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {autoUpdate ? "Live Mode" : "Manual Mode"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={togglePreview}>
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDevTools(!showDevTools)}>
                  <Bug className="h-4 w-4 mr-2" />
                  Dev Tools
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="hidden md:flex flex-wrap gap-1">
            {activeFile && (
              <Button 
                variant="outline" 
                onClick={runActiveFile}
                size="sm"
                className="gap-1"
              >
                <Play className="h-3 w-3 text-green-500" />
                Run
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={resetToDefault}
              size="sm"
              className="gap-1"
            >
              <RefreshCcw className="h-3 w-3" />
              Reset
            </Button>
            <Button 
              variant="outline" 
              onClick={copyToClipboard}
              size="sm"
              className="gap-1"
              disabled={!activeFile}
            >
              <Copy className="h-3 w-3" />
              {copySuccess ? 'Copied!' : 'Copy'}
            </Button>
            <Button 
              variant="outline"
              onClick={downloadActiveFile}
              size="sm"
              className="gap-1"
              disabled={!activeFile}
            >
              <Download className="h-3 w-3" />
              Save File
            </Button>
            <Button 
              variant="outline"
              onClick={downloadFullProject}
              size="sm"
              className="gap-1"
            >
              <Save className="h-3 w-3" />
              Export All
            </Button>
            
            <Separator orientation="vertical" className="mx-1 h-6" />
            
            <Button
              variant={autoUpdate ? "default" : "outline"}
              onClick={() => setAutoUpdate(!autoUpdate)}
              size="sm"
              className="gap-1"
              title={autoUpdate ? "Auto update preview is ON" : "Auto update preview is OFF"}
            >
              <RefreshCcw className="h-3 w-3" />
              {autoUpdate ? "Live" : "Manual"}
            </Button>
            
            <Button
              variant="outline"
              onClick={togglePreview}
              size="sm"
              className="gap-1"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-3 w-3" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  Show Preview
                </>
              )}
            </Button>
            
            <Button
              variant={showDevTools ? "default" : "outline"}
              onClick={() => setShowDevTools(!showDevTools)}
              size="sm"
              className="gap-1"
            >
              <Bug className="h-3 w-3" />
              Dev Tools
            </Button>
          </div>
          
          {showPreview && (
            <div className="hidden md:flex items-center gap-1">
              <div className="hidden md:flex items-center gap-1">
                <Button
                  variant={previewLayout === 'side' ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => changePreviewLayout('side')}
                  title="Side-by-side layout"
                >
                  <LayoutTemplate className="h-3 w-3" />
                </Button>
                <Button
                  variant={previewLayout === 'bottom' ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => changePreviewLayout('bottom')}
                  title="Editor over preview"
                >
                  <div className="h-3 w-3 flex flex-col items-center justify-center">
                    <div className="w-full h-1/2 border-b border-current" />
                  </div>
                </Button>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant={previewDeviceMode === 'desktop' ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => changePreviewDeviceMode('desktop')}
                  title="Desktop preview"
                >
                  <Monitor className="h-3 w-3" />
                </Button>
                <Button
                  variant={previewDeviceMode === 'tablet' ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => changePreviewDeviceMode('tablet')}
                  title="Tablet preview"
                >
                  <Tablet className="h-3 w-3" />
                </Button>
                <Button
                  variant={previewDeviceMode === 'mobile' ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => changePreviewDeviceMode('mobile')}
                  title="Mobile preview"
                >
                  <Smartphone className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          
          <ThemeToggle />
        </div>
      </header>
      
      <div className={cn(
        "fixed inset-0 z-50 bg-background border-r transition-transform md:hidden",
        mobileFileExplorerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {renderFileExplorer()}
      </div>
      
      <div className={`flex-1 overflow-hidden ${showDevTools ? 'h-[calc(100%-200px)]' : 'h-full'}`}>
        {previewLayout === 'side' || !showPreview ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {showFileExplorer && (
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden md:block">
                {renderFileExplorer()}
              </ResizablePanel>
            )}
            
            <ResizablePanel 
              defaultSize={showFileExplorer ? (showPreview ? 40 : 80) : (showPreview ? 50 : 100)} 
              minSize={20}
            >
              <Card className="h-full border-0 rounded-none">
                <CardContent className="p-0 h-full overflow-hidden">
                  {activeFile ? (
                    <MonacoEditor
                      height="100%"
                      language={getLanguageFromFileType(activeFile.type)}
                      value={activeFile.content}
                      theme={theme === 'dark' ? 'vs-dark' : 'light'}
                      onChange={updateFileContent}
                      onMount={handleEditorDidMount}
                      options={{
                        minimap: { enabled: window.innerWidth > 768 },
                        fontSize: window.innerWidth > 768 ? 14 : 12,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <p>No file selected. Open or create a file to start editing.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ResizablePanel>
            
            {showPreview && (
              <ResizablePanel defaultSize={showFileExplorer ? 40 : 50} minSize={20}>
                <Card className={`h-full border-0 rounded-none ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
                  <CardHeader className="py-2 px-2 md:px-4 flex flex-row justify-between items-center">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </CardTitle>
                    <div className="flex gap-1">
                      <div className="flex md:hidden items-center gap-1">
                        <Button
                          variant={previewDeviceMode === 'desktop' ? "default" : "outline"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => changePreviewDeviceMode('desktop')}
                          title="Desktop preview"
                        >
                          <Monitor className="h-3 w-3" />
                        </Button>
                        <Button
                          variant={previewDeviceMode === 'tablet' ? "default" : "outline"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => changePreviewDeviceMode('tablet')}
                          title="Tablet preview"
                        >
                          <Tablet className="h-3 w-3" />
                        </Button>
                        <Button
                          variant={previewDeviceMode === 'mobile' ? "default" : "outline"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => changePreviewDeviceMode('mobile')}
                          title="Mobile preview"
                        >
                          <Smartphone className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8">
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={openInNewTab} className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={togglePreview} className="h-8 w-8">
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 h-[calc(100%-3rem)] bg-white">
                    <div className={cn(
                      "w-full h-full overflow-auto",
                      previewDeviceMode === 'tablet' && "flex justify-center p-4",
                      previewDeviceMode === 'mobile' && "flex justify-center p-4"
                    )}>
                      <iframe
                        srcDoc={preview}
                        title="preview"
                        className={cn(
                          "w-full h-full border-0",
                          previewDeviceMode === 'tablet' && "max-w-[768px] shadow-lg border",
                          previewDeviceMode === 'mobile' && "max-w-[375px] shadow-lg border"
                        )}
                        sandbox="allow-scripts"
                        ref={previewRef}
                      />
                    </div>
                  </CardContent>
                </Card>
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        ) : (
          // Layout with editor on top and preview on bottom
          <ResizablePanelGroup direction="vertical" className="h-full">
            {showFileExplorer && (
              <div className="flex h-1/2">
                <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                  <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden md:block">
                    {renderFileExplorer()}
                  </ResizablePanel>
                  
                  <ResizablePanel defaultSize={80}>
                    <Card className="h-full border-0 rounded-none">
                      <CardContent className="p-0 h-full overflow-hidden">
                        {activeFile ? (
                          <MonacoEditor
                            height="100%"
                            language={getLanguageFromFileType(activeFile.type)}
                            value={activeFile.content}
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            onChange={updateFileContent}
                            onMount={handleEditorDidMount}
                            options={{
                              minimap: { enabled: window.innerWidth > 768 },
                              fontSize: window.innerWidth > 768 ? 14 : 12,
                              wordWrap: 'on',
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                            }}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            <p>No file selected. Open or create a file to start editing.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            )}
            
            {!showFileExplorer && (
              <ResizablePanel defaultSize={50} minSize={20}>
                <Card className="h-full border-0 rounded-none">
                  <CardContent className="p-0 h-full overflow-hidden">
                    {activeFile ? (
                      <MonacoEditor
                        height="100%"
                        language={getLanguageFromFileType(activeFile.type)}
                        value={activeFile.content}
                        theme={theme === 'dark' ? 'vs-dark' : 'light'}
                        onChange={updateFileContent}
                        onMount={handleEditorDidMount}
                        options={{
                          minimap: { enabled: window.innerWidth > 768 },
                          fontSize: window.innerWidth > 768 ? 14 : 12,
                          wordWrap: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <p>No file selected. Open or create a file to start editing.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ResizablePanel>
            )}
            
            <ResizablePanel defaultSize={50} minSize={20}>
              <Card className={`h-full border-0 rounded-none ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
                <CardHeader className="py-2 px-2 md:px-4 flex flex-row justify-between items-center">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </CardTitle>
                  <div className="flex gap-1">
                    <div className="flex md:hidden items-center gap-1">
                      <Button
                        variant={previewDeviceMode === 'desktop' ? "default" : "outline"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => changePreviewDeviceMode('desktop')}
                        title="Desktop preview"
                      >
                        <Monitor className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={previewDeviceMode === 'tablet' ? "default" : "outline"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => changePreviewDeviceMode('tablet')}
                        title="Tablet preview"
                      >
                        <Tablet className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={previewDeviceMode === 'mobile' ? "default" : "outline"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => changePreviewDeviceMode('mobile')}
                        title="Mobile preview"
                      >
                        <Smartphone className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8">
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={openInNewTab} className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={togglePreview} className="h-8 w-8">
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-3rem)] bg-white">
                  <div className={cn(
                    "w-full h-full overflow-auto",
                    previewDeviceMode === 'tablet' && "flex justify-center p-4",
                    previewDeviceMode === 'mobile' && "flex justify-center p-4"
                  )}>
                    <iframe
                      srcDoc={preview}
                      title="preview"
                      className={cn(
                        "w-full h-full border-0",
                        previewDeviceMode === 'tablet' && "max-w-[768px] shadow-lg border",
                        previewDeviceMode === 'mobile' && "max-w-[375px] shadow-lg border"
                      )}
                      sandbox="allow-scripts"
                      ref={previewRef}
                    />
                  </div>
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
      
      {renderDevTools()}
      
      {!dataLoaded && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading editor...</h2>
            <p className="text-muted-foreground">Please wait while we load your files</p>
          </div>
        </div>
      )}
      
      <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[90vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create New {newItemType === 'file' ? 'File' : 'Folder'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-type" className="text-right">
                Type
              </Label>
              <div className="col-span-3">
                <Tabs defaultValue="file" className="w-full" onValueChange={(v) => setNewItemType(v as 'file' | 'folder')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">File</TabsTrigger>
                    <TabsTrigger value="folder">Folder</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            {newItemType === 'file' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file-type" className="text-right">
                  File Type
                </Label>
                <div className="col-span-3">
                  <Tabs defaultValue="html" className="w-full" onValueChange={(v) => setNewFileType(v as FileType)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="html">HTML</TabsTrigger>
                      <TabsTrigger value="css">CSS</TabsTrigger>
                      <TabsTrigger value="js">JS</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="col-span-3"
                placeholder={newItemType === 'file' ? `filename.${newFileType}` : 'folder name'}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsNewItemDialogOpen(false)} className="sm:w-auto w-full">
              Cancel
            </Button>
            <Button onClick={createNewItem} disabled={!newItemName} className="sm:w-auto w-full">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Rename {itemToRename?.isFolder ? 'Folder' : 'File'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-name" className="text-right">
                Name
              </Label>
              <Input
                id="new-name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="col-span-3"
                placeholder={itemToRename?.isFolder ? 'folder name' : 'filename'}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)} className="sm:w-auto w-full">
              Cancel
            </Button>
            <Button onClick={handleRenameItem} disabled={!newItemName} className="sm:w-auto w-full">
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="md:hidden h-[calc(100%-6rem)] w-full">
        <Tabs defaultValue="editor" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Editor
            </TabsTrigger>
            {showPreview && (
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            )}
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              Files
            </TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="h-[calc(100%-2.5rem)] mt-2">
            <Card className="h-full">
              <CardHeader className="py-2">
                <CardTitle className="text-sm">HTML Editor</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-3rem)]">
                {activeFile ? (
                  <MonacoEditor
                    height="100%"
                    language={getLanguageFromFileType(activeFile.type)}
                    value={activeFile.content}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    onChange={updateFileContent}
                    onMount={handleEditorDidMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>No file selected. Open or create a file to start editing.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="preview" className="h-[calc(100%-2.5rem)] mt-2">
            <Card className="h-full">
              <CardHeader className="py-2 flex flex-row justify-between items-center">
                <CardTitle className="text-sm">Preview</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant={previewDeviceMode === 'desktop' ? 'default' : 'outline'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => changePreviewDeviceMode('desktop')}
                    title="Desktop preview"
                  >
                    <Monitor className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={previewDeviceMode === 'tablet' ? 'default' : 'outline'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => changePreviewDeviceMode('tablet')}
                    title="Tablet preview"
                  >
                    <Tablet className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={previewDeviceMode === 'mobile' ? 'default' : 'outline'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => changePreviewDeviceMode('mobile')}
                    title="Mobile preview"
                  >
                    <Smartphone className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={openInNewTab} className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={togglePreview} className="h-8 w-8">
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-3rem)] bg-white">
                <div className={cn(
                  "w-full h-full overflow-auto",
                  previewDeviceMode === 'tablet' && "flex justify-center p-4",
                  previewDeviceMode === 'mobile' && "flex justify-center p-4"
                )}>
                  <iframe
                    srcDoc={preview}
                    title="preview"
                    className={cn(
                      "w-full h-full border-0",
                      previewDeviceMode === 'tablet' && "max-w-[768px] shadow-lg border",
                      previewDeviceMode === 'mobile' && "max-w-[375px] shadow-lg border"
                    )}
                    sandbox="allow-scripts"
                    ref={previewRef}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="files" className="h-[calc(100%-2.5rem)] mt-2">
            <Card className="h-full">
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Files</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-3rem)]">
                {renderFileExplorer()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
} 