'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Copy,
  Download,
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
} from 'lucide-react';
import { CodeSandboxProps, CodeSandboxState, ExecutionResult } from './types';
import { sanitizeCode, validateExecutionRequest, createSafeExecutionEnvironment } from './security';
import SyntaxHighlighter from './SyntaxHighlighter';

/**
 * Secure code execution sandbox with comprehensive safety features
 */
export default function CodeSandbox({
  snippet,
  className = '',
  showLineNumbers = true,
  showCopyButton = true,
  showDownloadButton = true,
  showExecuteButton = false,
  allowEditing = false,
  maxHeight = '400px',
  theme = 'light' as 'light' | 'dark',
  onCodeChange,
  onExecute,
}: CodeSandboxProps) {
  const [state, setState] = useState<CodeSandboxState>({
    code: snippet.code,
    isExecuting: false,
    executionResult: null,
    hasChanges: false,
    error: null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const executionEnvironment = useRef<ReturnType<typeof createSafeExecutionEnvironment> | null>(null);

  // Initialize execution environment
  useEffect(() => {
    if (showExecuteButton && snippet.language === 'javascript') {
      executionEnvironment.current = createSafeExecutionEnvironment();
    }

    return () => {
      if (executionEnvironment.current) {
        executionEnvironment.current.cleanup();
      }
    };
  }, [showExecuteButton, snippet.language]);

  // Update state when snippet changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      code: snippet.code,
      hasChanges: false,
      error: null,
    }));
  }, [snippet.code]);

  const handleCodeChange = (newCode: string) => {
    setState((prev) => ({
      ...prev,
      code: newCode,
      hasChanges: newCode !== snippet.code,
      error: null,
    }));

    if (onCodeChange) {
      onCodeChange(newCode);
    }
  };

  const handleExecute = async () => {
    if (!showExecuteButton || state.isExecuting) {
      return;
    }

    setState((prev) => ({ ...prev, isExecuting: true, error: null, executionResult: null }));

    try {
      // Validate code before execution
      const validation = validateExecutionRequest(state.code, snippet.language);
      if (!validation.valid) {
        setState((prev) => ({
          ...prev,
          isExecuting: false,
          error: `Security validation failed: ${validation.errors.join(', ')}`,
        }));
        return;
      }

      // Sanitize code
      const sanitizedCode = sanitizeCode(state.code, snippet.language);

      let result: ExecutionResult;

      if (onExecute) {
        // Use custom execution handler
        result = await onExecute(sanitizedCode, snippet.language);
      } else if (snippet.language === 'javascript' && executionEnvironment.current) {
        // Use built-in safe execution environment
        result = await executionEnvironment.current.execute(sanitizedCode);
      } else {
        result = {
          success: false,
          error: `Execution not supported for ${snippet.language}`,
        };
      }

      setState((prev) => ({
        ...prev,
        isExecuting: false,
        executionResult: result,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isExecuting: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(state.code);
      // Show temporary success feedback
      setState((prev) => ({ ...prev, error: null }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to copy to clipboard',
      }));
    }
  };

  const handleDownload = () => {
    try {
      const fileExtensions: Record<string, string> = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        html: 'html',
        css: 'css',
        json: 'json',
        markdown: 'md',
        bash: 'sh',
        sql: 'sql',
      };

      const extension = fileExtensions[snippet.language] || 'txt';
      const filename = `${snippet.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;

      const blob = new Blob([state.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to download file',
      }));
    }
  };

  const handleSave = () => {
    if (onCodeChange) {
      onCodeChange(state.code);
    }
    setState((prev) => ({ ...prev, hasChanges: false }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setState((prev) => ({
      ...prev,
      code: snippet.code,
      hasChanges: false,
      error: null,
    }));
    setIsEditing(false);
  };

  const getLanguageDisplayName = (lang: string): string => {
    const names: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      markdown: 'Markdown',
      bash: 'Bash',
      sql: 'SQL',
    };
    return names[lang] || lang.toUpperCase();
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-sm text-gray-900">{snippet.title}</span>
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
            {getLanguageDisplayName(snippet.language)}
          </span>
          {snippet.tags && snippet.tags.length > 0 && (
            <div className="flex space-x-1">
              {snippet.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
              {snippet.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{snippet.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {allowEditing && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title={isEditing ? 'Cancel editing' : 'Edit code'}
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </button>
          )}
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Copy code"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
          {showDownloadButton && (
            <button
              onClick={handleDownload}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Download file"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          {showExecuteButton && (
            <button
              onClick={handleExecute}
              disabled={state.isExecuting}
              className="flex items-center px-2 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded transition-colors"
              title="Execute code"
            >
              {state.isExecuting ? (
                <Clock className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              {state.isExecuting ? 'Running...' : 'Run'}
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      {snippet.description && (
        <div className="p-3 text-sm text-gray-600 bg-blue-50 border-b border-gray-200">
          {snippet.description}
        </div>
      )}

      {/* Error display */}
      {state.error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
            {state.error}
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {new Date(snippet.createdAt).toLocaleDateString()}
              </div>
              {snippet.author && (
                <div>
                  <span className="font-medium">Author:</span> {snippet.author}
                </div>
              )}
              {snippet.updatedAt && (
                <div>
                  <span className="font-medium">Updated:</span>{' '}
                  {new Date(snippet.updatedAt).toLocaleDateString()}
                </div>
              )}
              <div>
                <span className="font-medium">Lines:</span> {state.code.split('\n').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code editor/viewer */}
      <div style={{ maxHeight }} className="overflow-auto">
        {isEditing ? (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={state.code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full min-h-[200px] p-4 font-mono text-sm border-0 focus:outline-none resize-none"
              placeholder="Enter your code here..."
              style={{
                backgroundColor: theme === 'dark' ? '#0d1117' : '#ffffff',
                color: theme === 'dark' ? '#c9d1d9' : '#24292e',
              }}
            />
            {state.hasChanges && (
              <div className="absolute top-2 right-2 flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : (
          <SyntaxHighlighter
            code={state.code}
            language={snippet.language}
            theme={theme}
            showLineNumbers={showLineNumbers}
          />
        )}
      </div>

      {/* Execution result */}
      {state.executionResult && (
        <div className="border-t border-gray-200">
          <div className="flex items-center justify-between p-3 bg-gray-50">
            <div className="flex items-center space-x-2">
              {state.executionResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {state.executionResult.success ? 'Execution Successful' : 'Execution Failed'}
              </span>
              {state.executionResult.executionTime && (
                <span className="text-xs text-gray-500">
                  ({state.executionResult.executionTime}ms)
                </span>
              )}
            </div>
          </div>

          {/* Output */}
          {state.executionResult.output && (
            <div className="p-3 bg-gray-900 text-green-400 font-mono text-sm overflow-auto max-h-32">
              <pre>{state.executionResult.output}</pre>
            </div>
          )}

          {/* Error */}
          {state.executionResult.error && (
            <div className="p-3 bg-red-900 text-red-100 font-mono text-sm overflow-auto max-h-32">
              <pre>{state.executionResult.error}</pre>
            </div>
          )}

          {/* Warnings */}
          {state.executionResult.warnings && state.executionResult.warnings.length > 0 && (
            <div className="p-3 bg-yellow-50 border-t border-yellow-200">
              <div className="text-sm font-medium text-yellow-800 mb-1">Warnings:</div>
              {state.executionResult.warnings.map((warning, index) => (
                <div key={index} className="text-sm text-yellow-700">
                  {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}