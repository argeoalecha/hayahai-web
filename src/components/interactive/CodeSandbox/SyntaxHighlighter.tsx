'use client';

import React, { useMemo } from 'react';
import { SupportedLanguage, SyntaxHighlightTheme } from './types';

interface SyntaxHighlighterProps {
  code: string;
  language: SupportedLanguage;
  theme?: 'light' | 'dark';
  showLineNumbers?: boolean;
  className?: string;
  onLineClick?: (lineNumber: number) => void;
}

/**
 * Basic syntax highlighter with security-focused implementation
 * Uses simple regex patterns to avoid external dependencies
 */
export default function SyntaxHighlighter({
  code,
  language,
  theme = 'light',
  showLineNumbers = true,
  className = '',
  onLineClick,
}: SyntaxHighlighterProps) {
  const themes: Record<'light' | 'dark', SyntaxHighlightTheme> = {
    light: {
      name: 'light',
      background: '#ffffff',
      foreground: '#24292e',
      comment: '#6a737d',
      keyword: '#d73a49',
      string: '#032f62',
      number: '#005cc5',
      function: '#6f42c1',
      variable: '#e36209',
      operator: '#d73a49',
    },
    dark: {
      name: 'dark',
      background: '#0d1117',
      foreground: '#c9d1d9',
      comment: '#8b949e',
      keyword: '#ff7b72',
      string: '#a5d6ff',
      number: '#79c0ff',
      function: '#d2a8ff',
      variable: '#ffa657',
      operator: '#ff7b72',
    },
  };

  const currentTheme = themes[theme];

  // Tokenize code based on language
  const tokenizeCode = useMemo(() => {
    const lines = code.split('\n');
    return lines.map((line, lineIndex) => {
      const tokens = tokenizeLine(line, language);
      return {
        lineNumber: lineIndex + 1,
        content: line,
        tokens,
      };
    });
  }, [code, language]);

  const tokenizeLine = (line: string, lang: SupportedLanguage) => {
    const tokens: Array<{ type: string; value: string; start: number; end: number }> = [];
    let position = 0;

    // Get language-specific patterns
    const patterns = getLanguagePatterns(lang);

    // Apply patterns in order of priority
    const patternOrder = ['comment', 'string', 'keyword', 'function', 'number', 'operator'];

    for (const patternType of patternOrder) {
      const pattern = patterns[patternType];
      if (!pattern) continue;

      let match;
      const regex = new RegExp(pattern.source, pattern.flags + 'g');

      while ((match = regex.exec(line)) !== null) {
        // Check if this position is already tokenized
        const isOverlapping = tokens.some(
          token => match!.index < token.end && match!.index + match![0].length > token.start
        );

        if (!isOverlapping) {
          tokens.push({
            type: patternType,
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
          });
        }
      }
    }

    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start);

    // Fill gaps with 'text' tokens
    const allTokens: Array<{ type: string; value: string }> = [];
    let currentPos = 0;

    for (const token of tokens) {
      // Add text before this token
      if (currentPos < token.start) {
        allTokens.push({
          type: 'text',
          value: line.slice(currentPos, token.start),
        });
      }

      allTokens.push(token);
      currentPos = token.end;
    }

    // Add remaining text
    if (currentPos < line.length) {
      allTokens.push({
        type: 'text',
        value: line.slice(currentPos),
      });
    }

    return allTokens;
  };

  const getLanguagePatterns = (lang: SupportedLanguage): Record<string, RegExp> => {
    const patterns: Record<string, Record<string, RegExp>> = {
      javascript: {
        comment: /\/\/.*$|\/\*[\s\S]*?\*\//,
        string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/,
        keyword: /\b(?:const|let|var|function|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|new|this|super|class|extends|import|export|from|async|await|yield|typeof|instanceof|in|of|delete|void|null|undefined|true|false)\b/,
        function: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/,
        number: /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+\.?\d*(?:[eE][+-]?\d+)?)\b/,
        operator: /[+\-*/%=<>!&|^~?:;,.(){}[\]]/,
      },
      typescript: {
        comment: /\/\/.*$|\/\*[\s\S]*?\*\//,
        string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/,
        keyword: /\b(?:const|let|var|function|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|new|this|super|class|extends|import|export|from|async|await|yield|typeof|instanceof|in|of|delete|void|null|undefined|true|false|interface|type|enum|namespace|module|declare|abstract|readonly|private|protected|public|static|implements|keyof|infer|is|as)\b/,
        function: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*[<(])/,
        number: /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+\.?\d*(?:[eE][+-]?\d+)?)\b/,
        operator: /[+\-*/%=<>!&|^~?:;,.(){}[\]]/,
      },
      python: {
        comment: /#.*$/,
        string: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
        keyword: /\b(?:and|as|assert|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|not|or|pass|print|raise|return|try|while|with|yield|True|False|None)\b/,
        function: /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/,
        number: /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+\.?\d*(?:[eE][+-]?\d+)?[jJ]?)\b/,
        operator: /[+\-*/%=<>!&|^~@]/,
      },
      html: {
        comment: /<!--[\s\S]*?-->/,
        string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
        keyword: /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s+[^>]*)?>/,
        function: /\b[a-zA-Z-]+(?==)/,
        number: /\b\d+\.?\d*\b/,
        operator: /[=]/,
      },
      css: {
        comment: /\/\*[\s\S]*?\*\//,
        string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
        keyword: /\b(?:@media|@import|@keyframes|@font-face|@supports|@page|@namespace|@charset|@document)\b/,
        function: /[a-zA-Z-]+(?=\s*:)/,
        number: /\b\d+\.?\d*(?:px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|lh|vmin|vmax|deg|rad|turn|s|ms|Hz|kHz)?\b/,
        operator: /[{}();:,]/,
      },
      json: {
        string: /"(?:[^"\\]|\\.)*"/,
        number: /\b-?\d+\.?\d*(?:[eE][+-]?\d+)?\b/,
        keyword: /\b(?:true|false|null)\b/,
        operator: /[{}[\]:,]/,
      },
      markdown: {
        keyword: /^#{1,6}\s.*$|^\*{1,3}.*\*{1,3}$|^_{1,3}.*_{1,3}$/m,
        string: /`[^`]*`|```[\s\S]*?```/,
        function: /\[.*?\]\(.*?\)/,
        operator: /[*_`#\-+>]/,
      },
      bash: {
        comment: /#.*$/,
        string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
        keyword: /\b(?:if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|break|continue|echo|printf|read|cd|ls|pwd|mkdir|rmdir|rm|cp|mv|chmod|chown|grep|sed|awk|sort|uniq|head|tail|cat|less|more)\b/,
        function: /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/,
        number: /\b\d+\.?\d*\b/,
        operator: /[|&;()<>$]/,
      },
      sql: {
        comment: /--.*$|\/\*[\s\S]*?\*\//,
        string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
        keyword: /\b(?:SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|AS|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|DEFAULT|AUTO_INCREMENT|UNIQUE|CHECK|CONSTRAINT|DATABASE|SCHEMA|VIEW|PROCEDURE|FUNCTION|TRIGGER|IF|EXISTS|DISTINCT|ALL|ANY|SOME|IN|BETWEEN|LIKE|IS|AND|OR|NOT|UNION|INTERSECT|EXCEPT|CASE|WHEN|THEN|ELSE|END)\b/i,
        function: /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/,
        number: /\b\d+\.?\d*\b/,
        operator: /[=<>!+\-*/%(),.;]/,
      },
    };

    return patterns[lang] || {};
  };

  const getTokenColor = (tokenType: string): string => {
    switch (tokenType) {
      case 'comment':
        return currentTheme.comment;
      case 'keyword':
        return currentTheme.keyword;
      case 'string':
        return currentTheme.string;
      case 'number':
        return currentTheme.number;
      case 'function':
        return currentTheme.function;
      case 'variable':
        return currentTheme.variable;
      case 'operator':
        return currentTheme.operator;
      default:
        return currentTheme.foreground;
    }
  };

  const handleLineClick = (lineNumber: number) => {
    if (onLineClick) {
      onLineClick(lineNumber);
    }
  };

  return (
    <div
      className={`font-mono text-sm overflow-auto ${className}`}
      style={{
        backgroundColor: currentTheme.background,
        color: currentTheme.foreground,
      }}
    >
      <pre className="p-4">
        {tokenizeCode.map((line, index) => (
          <div
            key={index}
            className={`flex ${onLineClick ? 'cursor-pointer hover:bg-opacity-10 hover:bg-gray-500' : ''}`}
            onClick={() => handleLineClick(line.lineNumber)}
          >
            {showLineNumbers && (
              <span
                className="inline-block w-8 text-right mr-4 select-none opacity-60"
                style={{ color: currentTheme.comment }}
              >
                {line.lineNumber}
              </span>
            )}
            <span className="flex-1">
              {line.tokens.length > 0 ? (
                line.tokens.map((token, tokenIndex) => (
                  <span
                    key={tokenIndex}
                    style={{ color: getTokenColor(token.type) }}
                  >
                    {token.value}
                  </span>
                ))
              ) : (
                <span>{line.content || ' '}</span>
              )}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}