export interface CodeSnippet {
  id: string;
  title: string;
  description?: string;
  language: SupportedLanguage;
  code: string;
  tags?: string[];
  author?: string;
  createdAt: string;
  updatedAt?: string;
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown'
  | 'bash'
  | 'sql';

export interface CodeSandboxProps {
  snippet: CodeSnippet;
  className?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  showDownloadButton?: boolean;
  showExecuteButton?: boolean;
  allowEditing?: boolean;
  maxHeight?: string;
  theme?: 'light' | 'dark';
  onCodeChange?: (code: string) => void;
  onExecute?: (code: string, language: SupportedLanguage) => Promise<ExecutionResult>;
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
  warnings?: string[];
}

export interface CodeSandboxState {
  code: string;
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  hasChanges: boolean;
  error: string | null;
}

export interface SecurityConfig {
  allowedFunctions: string[];
  blockedKeywords: string[];
  maxExecutionTime: number;
  maxMemoryMB: number;
  allowNetworkAccess: boolean;
  allowFileSystem: boolean;
  allowImports: boolean;
}

export interface SyntaxHighlightTheme {
  name: string;
  background: string;
  foreground: string;
  comment: string;
  keyword: string;
  string: string;
  number: string;
  function: string;
  variable: string;
  operator: string;
}