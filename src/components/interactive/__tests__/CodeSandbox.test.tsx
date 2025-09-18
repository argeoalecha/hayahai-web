import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CodeSandbox } from '../CodeSandbox';
import type { CodeSnippet } from '../CodeSandbox/types';
import { sanitizeCode, validateExecutionRequest, SECURITY_CONFIG } from '../CodeSandbox/security';

const mockSnippet: CodeSnippet = {
  id: 'test-snippet',
  title: 'Test Code Snippet',
  description: 'A test code snippet for unit testing',
  language: 'javascript',
  code: `console.log('Hello, World!');
const sum = (a, b) => a + b;
console.log('2 + 3 =', sum(2, 3));`,
  tags: ['test', 'javascript'],
  author: 'Test Author',
  createdAt: '2024-03-15T10:00:00Z',
  isPublic: true,
};

describe('CodeSandbox Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with valid snippet', () => {
    render(<CodeSandbox snippet={mockSnippet} />);

    expect(screen.getByText('Test Code Snippet')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText("console.log('Hello, World!');")).toBeInTheDocument();
  });

  it('displays snippet description when provided', () => {
    render(<CodeSandbox snippet={mockSnippet} />);

    expect(screen.getByText('A test code snippet for unit testing')).toBeInTheDocument();
  });

  it('shows copy button when enabled', () => {
    render(<CodeSandbox snippet={mockSnippet} showCopyButton={true} />);

    expect(screen.getByTitle('Copy code')).toBeInTheDocument();
  });

  it('shows download button when enabled', () => {
    render(<CodeSandbox snippet={mockSnippet} showDownloadButton={true} />);

    expect(screen.getByTitle('Download file')).toBeInTheDocument();
  });

  it('shows execute button when enabled for JavaScript', () => {
    render(<CodeSandbox snippet={mockSnippet} showExecuteButton={true} />);

    expect(screen.getByTitle('Execute code')).toBeInTheDocument();
    expect(screen.getByText('Run')).toBeInTheDocument();
  });

  it('enables editing mode when allowed', () => {
    render(<CodeSandbox snippet={mockSnippet} allowEditing={true} />);

    const editButton = screen.getByTitle('Edit code');
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue(mockSnippet.code)).toBeInTheDocument();
  });

  it('handles code changes in edit mode', async () => {
    const mockOnCodeChange = jest.fn();
    render(
      <CodeSandbox
        snippet={mockSnippet}
        allowEditing={true}
        onCodeChange={mockOnCodeChange}
      />
    );

    const editButton = screen.getByTitle('Edit code');
    fireEvent.click(editButton);

    const textarea = screen.getByDisplayValue(mockSnippet.code);
    const newCode = 'console.log("Modified code");';

    fireEvent.change(textarea, { target: { value: newCode } });

    expect(mockOnCodeChange).toHaveBeenCalledWith(newCode);
  });

  it('saves changes when save button is clicked', async () => {
    const mockOnCodeChange = jest.fn();
    render(
      <CodeSandbox
        snippet={mockSnippet}
        allowEditing={true}
        onCodeChange={mockOnCodeChange}
      />
    );

    const editButton = screen.getByTitle('Edit code');
    fireEvent.click(editButton);

    const textarea = screen.getByDisplayValue(mockSnippet.code);
    const newCode = 'console.log("Modified code");';

    fireEvent.change(textarea, { target: { value: newCode } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnCodeChange).toHaveBeenCalledWith(newCode);
  });

  it('cancels changes when cancel button is clicked', async () => {
    render(<CodeSandbox snippet={mockSnippet} allowEditing={true} />);

    const editButton = screen.getByTitle('Edit code');
    fireEvent.click(editButton);

    const textarea = screen.getByDisplayValue(mockSnippet.code);
    fireEvent.change(textarea, { target: { value: 'Modified code' } });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Should revert to original code
    expect(screen.getByText("console.log('Hello, World!');")).toBeInTheDocument();
  });

  it('displays settings panel when settings button is clicked', () => {
    render(<CodeSandbox snippet={mockSnippet} />);

    const settingsButton = screen.getByTitle('Settings');
    fireEvent.click(settingsButton);

    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Author:/)).toBeInTheDocument();
  });

  it('displays tags when present', () => {
    render(<CodeSandbox snippet={mockSnippet} />);

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('handles custom execution handler', async () => {
    const mockOnExecute = jest.fn().mockResolvedValue({
      success: true,
      output: 'Custom execution result',
      executionTime: 100,
    });

    render(
      <CodeSandbox
        snippet={mockSnippet}
        showExecuteButton={true}
        onExecute={mockOnExecute}
      />
    );

    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(mockOnExecute).toHaveBeenCalledWith(
        expect.stringContaining("console.log('Hello, World!');"),
        'javascript'
      );
    });
  });

  it('shows execution results', async () => {
    const mockOnExecute = jest.fn().mockResolvedValue({
      success: true,
      output: 'Hello, World!\n2 + 3 = 5',
      executionTime: 50,
    });

    render(
      <CodeSandbox
        snippet={mockSnippet}
        showExecuteButton={true}
        onExecute={mockOnExecute}
      />
    );

    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Execution Successful')).toBeInTheDocument();
      expect(screen.getByText('Hello, World!')).toBeInTheDocument();
      expect(screen.getByText('(50ms)')).toBeInTheDocument();
    });
  });

  it('shows execution errors', async () => {
    const mockOnExecute = jest.fn().mockResolvedValue({
      success: false,
      error: 'SyntaxError: Unexpected token',
      executionTime: 25,
    });

    render(
      <CodeSandbox
        snippet={mockSnippet}
        showExecuteButton={true}
        onExecute={mockOnExecute}
      />
    );

    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Execution Failed')).toBeInTheDocument();
      expect(screen.getByText('SyntaxError: Unexpected token')).toBeInTheDocument();
    });
  });

  it('disables execution button during execution', async () => {
    const mockOnExecute = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, output: 'Done' }), 100))
    );

    render(
      <CodeSandbox
        snippet={mockSnippet}
        showExecuteButton={true}
        onExecute={mockOnExecute}
      />
    );

    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);

    expect(screen.getByText('Running...')).toBeInTheDocument();
    expect(runButton).toBeDisabled();
  });

  it('handles different languages correctly', () => {
    const pythonSnippet: CodeSnippet = {
      ...mockSnippet,
      language: 'python',
      code: 'print("Hello, Python!")',
    };

    render(<CodeSandbox snippet={pythonSnippet} />);

    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('print("Hello, Python!")')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-sandbox-class';
    const { container } = render(
      <CodeSandbox snippet={mockSnippet} className={customClass} />
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it('handles copy to clipboard', async () => {
    // Mock clipboard API
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(<CodeSandbox snippet={mockSnippet} showCopyButton={true} />);

    const copyButton = screen.getByTitle('Copy code');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(mockSnippet.code);
    });
  });

  it('handles download file', () => {
    // Mock URL.createObjectURL and revokeObjectURL
    const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock DOM methods
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
    };

    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;

    render(<CodeSandbox snippet={mockSnippet} showDownloadButton={true} />);

    const downloadButton = screen.getByTitle('Download file');
    fireEvent.click(downloadButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });
});

describe('CodeSandbox Security', () => {
  describe('sanitizeCode', () => {
    it('removes dangerous JavaScript functions', () => {
      const dangerousCode = `
        eval('alert("xss")');
        setTimeout(() => alert("xss"), 1000);
        fetch('/api/steal-data');
      `;

      const sanitized = sanitizeCode(dangerousCode, 'javascript');

      expect(sanitized).toContain('/* BLOCKED: eval */');
      expect(sanitized).toContain('/* BLOCKED: setTimeout */');
      expect(sanitized).toContain('/* BLOCKED: fetch */');
    });

    it('removes dangerous Python functions', () => {
      const dangerousCode = `
        import os
        eval('print("xss")')
        exec('os.system("rm -rf /")')
      `;

      const sanitized = sanitizeCode(dangerousCode, 'python');

      expect(sanitized).toContain('# BLOCKED: dangerous import');
      expect(sanitized).toContain('# BLOCKED: eval');
      expect(sanitized).toContain('# BLOCKED: exec');
    });

    it('sanitizes HTML content', () => {
      const dangerousHTML = `
        <script>alert('xss')</script>
        <iframe src="javascript:alert('xss')"></iframe>
        <div onclick="alert('xss')">Click me</div>
      `;

      const sanitized = sanitizeCode(dangerousHTML, 'html');

      expect(sanitized).toContain('<!-- BLOCKED: script tag -->');
      expect(sanitized).toContain('<!-- BLOCKED: iframe tag -->');
      expect(sanitized).toContain('blocked="event handler removed"');
    });

    it('sanitizes CSS content', () => {
      const dangerousCSS = `
        .malicious {
          expression(alert('xss'));
          behavior: url(javascript:alert('xss'));
          background: url(javascript:alert('xss'));
        }
      `;

      const sanitized = sanitizeCode(dangerousCSS, 'css');

      expect(sanitized).toContain('/* BLOCKED: expression */');
      expect(sanitized).toContain('/* BLOCKED: behavior */');
      expect(sanitized).toContain('blocked:');
    });
  });

  describe('validateExecutionRequest', () => {
    it('validates code length', () => {
      const longCode = 'a'.repeat(10001);
      const result = validateExecutionRequest(longCode, 'javascript');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Code exceeds maximum length (10,000 characters)');
    });

    it('detects blocked keywords', () => {
      const result = validateExecutionRequest('eval("alert(1)")', 'javascript');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Blocked keywords found');
    });

    it('allows safe code', () => {
      const safeCode = `
        const numbers = [1, 2, 3, 4, 5];
        const doubled = numbers.map(n => n * 2);
        console.log(doubled);
      `;

      const result = validateExecutionRequest(safeCode, 'javascript');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects empty code', () => {
      const result = validateExecutionRequest('', 'javascript');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Code cannot be empty');
    });
  });

  describe('SECURITY_CONFIG', () => {
    it('contains expected allowed functions', () => {
      expect(SECURITY_CONFIG.allowedFunctions).toContain('console.log');
      expect(SECURITY_CONFIG.allowedFunctions).toContain('Math.abs');
      expect(SECURITY_CONFIG.allowedFunctions).toContain('JSON.parse');
    });

    it('contains expected blocked keywords', () => {
      expect(SECURITY_CONFIG.blockedKeywords).toContain('eval');
      expect(SECURITY_CONFIG.blockedKeywords).toContain('Function');
      expect(SECURITY_CONFIG.blockedKeywords).toContain('fetch');
      expect(SECURITY_CONFIG.blockedKeywords).toContain('XMLHttpRequest');
    });

    it('has reasonable execution limits', () => {
      expect(SECURITY_CONFIG.maxExecutionTime).toBe(5000);
      expect(SECURITY_CONFIG.maxMemoryMB).toBe(50);
      expect(SECURITY_CONFIG.allowNetworkAccess).toBe(false);
      expect(SECURITY_CONFIG.allowFileSystem).toBe(false);
    });
  });
});