import { SupportedLanguage, SecurityConfig, ExecutionResult } from './types';

/**
 * Security configuration for code execution
 */
export const SECURITY_CONFIG: SecurityConfig = {
  allowedFunctions: [
    // JavaScript/TypeScript safe functions
    'console.log',
    'console.warn',
    'console.error',
    'console.info',
    'Math.abs',
    'Math.ceil',
    'Math.floor',
    'Math.max',
    'Math.min',
    'Math.random',
    'Math.round',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'JSON.parse',
    'JSON.stringify',
    'Array.from',
    'Array.isArray',
    'Object.keys',
    'Object.values',
    'Object.entries',
    'String.prototype.slice',
    'String.prototype.substring',
    'String.prototype.toLowerCase',
    'String.prototype.toUpperCase',
    'String.prototype.trim',
    'Array.prototype.map',
    'Array.prototype.filter',
    'Array.prototype.reduce',
    'Array.prototype.forEach',
    'Array.prototype.find',
    'Array.prototype.includes',
  ],
  blockedKeywords: [
    // Dangerous JavaScript functions
    'eval',
    'Function',
    'setTimeout',
    'setInterval',
    'XMLHttpRequest',
    'fetch',
    'WebSocket',
    'Worker',
    'SharedWorker',
    'ServiceWorker',
    'navigator',
    'location',
    'history',
    'localStorage',
    'sessionStorage',
    'indexedDB',
    'webkitStorageInfo',
    'chrome',
    'process',
    'global',
    'window',
    'document',
    'alert',
    'confirm',
    'prompt',
    'open',
    'close',
    'print',
    // File system access
    'require',
    'import',
    'importScripts',
    'fs',
    'path',
    'os',
    'child_process',
    'cluster',
    'crypto',
    'buffer',
    'stream',
    'util',
    'events',
    'readline',
    'vm',
    // Network access
    'http',
    'https',
    'url',
    'querystring',
    'dns',
    'net',
    'tls',
    'dgram',
    // Dangerous Python modules
    '__import__',
    'exec',
    'compile',
    'open',
    'file',
    'input',
    'raw_input',
    'reload',
    'vars',
    'dir',
    'globals',
    'locals',
    'hasattr',
    'getattr',
    'setattr',
    'delattr',
    'callable',
    'subprocess',
    'os.system',
    'os.popen',
    'os.spawn',
    'shutil',
    'tempfile',
    'pickle',
    'marshal',
    'imp',
    'importlib',
    'socket',
    'urllib',
    'requests',
    'ftplib',
    'smtplib',
    'poplib',
    'imaplib',
    'telnetlib',
    'ssl',
    'hashlib',
    'hmac',
    'secrets',
    'ctypes',
    'threading',
    'multiprocessing',
    'asyncio',
    'concurrent',
  ],
  maxExecutionTime: 5000, // 5 seconds
  maxMemoryMB: 50,
  allowNetworkAccess: false,
  allowFileSystem: false,
  allowImports: false,
};

/**
 * Sanitize code to remove dangerous functions and patterns
 */
export function sanitizeCode(code: string, language: SupportedLanguage): string {
  if (!code || typeof code !== 'string') {
    return '';
  }

  let sanitized = code;

  // Remove dangerous keywords
  SECURITY_CONFIG.blockedKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    sanitized = sanitized.replace(regex, `/* BLOCKED: ${keyword} */`);
  });

  // Language-specific sanitization
  switch (language) {
    case 'javascript':
    case 'typescript':
      sanitized = sanitizeJavaScript(sanitized);
      break;
    case 'python':
      sanitized = sanitizePython(sanitized);
      break;
    case 'html':
      sanitized = sanitizeHTML(sanitized);
      break;
    case 'css':
      sanitized = sanitizeCSS(sanitized);
      break;
  }

  return sanitized;
}

/**
 * Sanitize JavaScript/TypeScript code
 */
function sanitizeJavaScript(code: string): string {
  let sanitized = code;

  // Remove script tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, '/* BLOCKED: script tag */');

  // Remove dangerous protocols
  sanitized = sanitized.replace(/javascript:/gi, 'blocked:');
  sanitized = sanitized.replace(/data:/gi, 'blocked:');
  sanitized = sanitized.replace(/vbscript:/gi, 'blocked:');

  // Remove eval-like patterns
  sanitized = sanitized.replace(/eval\s*\(/gi, '/* BLOCKED: eval */ (');
  sanitized = sanitized.replace(/new\s+Function/gi, '/* BLOCKED: Function constructor */');

  // Remove dynamic imports
  sanitized = sanitized.replace(/import\s*\(/gi, '/* BLOCKED: dynamic import */ (');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, 'blocked=');

  return sanitized;
}

/**
 * Sanitize Python code
 */
function sanitizePython(code: string): string {
  let sanitized = code;

  // Remove dangerous built-ins
  const dangerousPython = [
    '__import__',
    'exec',
    'eval',
    'compile',
    'open',
    'file',
    'input',
    'raw_input',
  ];

  dangerousPython.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    sanitized = sanitized.replace(regex, `# BLOCKED: ${keyword}`);
  });

  // Remove dangerous imports
  sanitized = sanitized.replace(/^import\s+(os|sys|subprocess|socket|urllib|requests|shutil|tempfile|pickle|marshal|imp|importlib|threading|multiprocessing|asyncio|concurrent)/gim, '# BLOCKED: dangerous import');
  sanitized = sanitized.replace(/^from\s+(os|sys|subprocess|socket|urllib|requests|shutil|tempfile|pickle|marshal|imp|importlib|threading|multiprocessing|asyncio|concurrent)/gim, '# BLOCKED: dangerous import');

  return sanitized;
}

/**
 * Sanitize HTML code
 */
function sanitizeHTML(code: string): string {
  let sanitized = code;

  // Remove script tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, '<!-- BLOCKED: script tag -->');

  // Remove dangerous tags
  const dangerousTags = ['iframe', 'embed', 'object', 'applet', 'form'];
  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis');
    sanitized = sanitized.replace(regex, `<!-- BLOCKED: ${tag} tag -->`);
  });

  // Remove event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, ' blocked="event handler removed"');

  // Remove dangerous protocols
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="blocked:javascript"');
  sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src="blocked:javascript"');

  return sanitized;
}

/**
 * Sanitize CSS code
 */
function sanitizeCSS(code: string): string {
  let sanitized = code;

  // Remove dangerous CSS functions
  sanitized = sanitized.replace(/expression\s*\(/gi, '/* BLOCKED: expression */ (');
  sanitized = sanitized.replace(/behavior\s*:/gi, '/* BLOCKED: behavior */');
  sanitized = sanitized.replace(/-moz-binding\s*:/gi, '/* BLOCKED: -moz-binding */');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, 'blocked:');

  return sanitized;
}

/**
 * Validate code execution request
 */
export function validateExecutionRequest(
  code: string,
  language: SupportedLanguage
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!code || typeof code !== 'string') {
    errors.push('Code cannot be empty');
    return { valid: false, errors };
  }

  if (code.length > 10000) {
    errors.push('Code exceeds maximum length (10,000 characters)');
  }

  // Check for blocked keywords
  const blockedFound = SECURITY_CONFIG.blockedKeywords.filter((keyword) =>
    new RegExp(`\\b${keyword}\\b`, 'i').test(code)
  );

  if (blockedFound.length > 0) {
    errors.push(`Blocked keywords found: ${blockedFound.join(', ')}`);
  }

  // Language-specific validation
  switch (language) {
    case 'javascript':
    case 'typescript':
      if (/eval\s*\(|new\s+Function|import\s*\(/i.test(code)) {
        errors.push('Dynamic code execution is not allowed');
      }
      break;
    case 'python':
      if (/__import__|exec|eval|compile/i.test(code)) {
        errors.push('Dynamic code execution is not allowed');
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create a safe execution environment for JavaScript
 */
export function createSafeExecutionEnvironment(): {
  execute: (code: string) => Promise<ExecutionResult>;
  cleanup: () => void;
} {
  // Create a restricted global environment
  const safeGlobals = {
    console: {
      log: (...args: any[]) => console.log('[SANDBOX]', ...args),
      warn: (...args: any[]) => console.warn('[SANDBOX]', ...args),
      error: (...args: any[]) => console.error('[SANDBOX]', ...args),
      info: (...args: any[]) => console.info('[SANDBOX]', ...args),
    },
    Math: { ...Math },
    JSON: { ...JSON },
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    undefined,
    null: null,
  };

  let outputBuffer: string[] = [];
  let errorBuffer: string[] = [];

  // Override console to capture output
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  const captureOutput = () => {
    console.log = (...args: any[]) => {
      outputBuffer.push(args.map(arg => String(arg)).join(' '));
    };
    console.warn = (...args: any[]) => {
      outputBuffer.push(`Warning: ${args.map(arg => String(arg)).join(' ')}`);
    };
    console.error = (...args: any[]) => {
      errorBuffer.push(args.map(arg => String(arg)).join(' '));
    };
  };

  const restoreOutput = () => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  };

  const execute = async (code: string): Promise<ExecutionResult> => {
    const startTime = Date.now();
    outputBuffer = [];
    errorBuffer = [];

    try {
      captureOutput();

      // Create a timeout for execution
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Execution timeout exceeded'));
        }, SECURITY_CONFIG.maxExecutionTime);
      });

      // Execute code in restricted environment
      const executionPromise = new Promise<ExecutionResult>((resolve) => {
        try {
          // Use Function constructor with restricted globals
          const restrictedFunction = new Function(
            ...Object.keys(safeGlobals),
            `
            "use strict";
            try {
              ${code}
            } catch (error) {
              console.error(error.message);
              throw error;
            }
            `
          );

          restrictedFunction(...Object.values(safeGlobals));

          const executionTime = Date.now() - startTime;
          resolve({
            success: true,
            output: outputBuffer.join('\n'),
            executionTime,
            warnings: errorBuffer.length > 0 ? errorBuffer : [],
          });
        } catch (error) {
          const executionTime = Date.now() - startTime;
          resolve({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            output: outputBuffer.join('\n'),
            executionTime,
          });
        }
      });

      return await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        output: outputBuffer.join('\n'),
        executionTime,
      };
    } finally {
      restoreOutput();
    }
  };

  const cleanup = () => {
    restoreOutput();
  };

  return { execute, cleanup };
}