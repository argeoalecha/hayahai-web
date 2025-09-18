export { default as CodeSandbox } from './CodeSandbox';
export { default as SyntaxHighlighter } from './SyntaxHighlighter';

export type {
  CodeSnippet,
  SupportedLanguage,
  CodeSandboxProps,
  ExecutionResult,
  CodeSandboxState,
  SecurityConfig,
  SyntaxHighlightTheme,
} from './types';

export {
  sanitizeCode,
  validateExecutionRequest,
  createSafeExecutionEnvironment,
  SECURITY_CONFIG,
} from './security';