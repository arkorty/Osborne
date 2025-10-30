import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';
import type { ThemeConfig } from '@/lib/themes';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (lineStart: number, lineEnd: number) => void;
  language?: string;
  className?: string;
  themeConfig?: ThemeConfig;
}

export interface CodeEditorRef {
  selectLines: (startLine: number, endLine?: number) => void;
  focus: () => void;
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(({
  value,
  onChange,
  onSelectionChange,
  language = 'plaintext',
  className = '',
  themeConfig
}, ref) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [editorReady, setEditorReady] = React.useState(false);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    selectLines: (startLine: number, endLine?: number) => {
      if (editorRef.current) {
        const actualEndLine = endLine || startLine;
        const selection = {
          startLineNumber: startLine,
          startColumn: 1,
          endLineNumber: actualEndLine,
          endColumn: editorRef.current.getModel()?.getLineMaxColumn(actualEndLine) || 1,
        };
        editorRef.current.setSelection(selection);
        editorRef.current.revealLineInCenter(startLine);
        editorRef.current.focus();
      }
    },
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    },
  }), []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);
    // Add selection change listener
    if (onSelectionChange) {
      editor.onDidChangeCursorSelection((e: any) => {
        const selection = e.selection;
        const startLine = selection.startLineNumber;
        const endLine = selection.endLineNumber;
        onSelectionChange(startLine, endLine);
      });
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  // Ensure Monaco theme is always set after both editor and themeConfig are ready
  useEffect(() => {
    if (!editorReady || !themeConfig || !monacoRef.current) return;
    // Convert HSL to hex for Monaco editor
    const hslToHex = (hsl: string): string => {
      const match = hsl.match(/hsl\((\d+),\s*(\d+)%\,\s*(\d+)%\)/);
      if (!match) return '#000000';
      const h = parseInt(match[1]) / 360;
      const s = parseInt(match[2]) / 100;
      const l = parseInt(match[3]) / 100;
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      const toHex = (c: number) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };
    const defineThemeFromConfig = (config: ThemeConfig) => {
      const themeName = `osborne-${config.id}`;
      const backgroundColor = hslToHex(config.colors.background);
      const foregroundColor = hslToHex(config.colors.foreground);
      const cardColor = hslToHex(config.colors.card);
      const borderColor = hslToHex(config.colors.border);
      const mutedColor = hslToHex(config.colors.muted);
      const primaryColor = hslToHex(config.colors.primary);
      monacoRef.current.editor.defineTheme(themeName, {
        base: config.type === 'dark' ? 'vs-dark' : 'vs',
        inherit: true,
        rules: [
          { token: '', foreground: foregroundColor.substring(1) },
          { token: 'comment', foreground: config.type === 'dark' ? '6A9955' : '008000', fontStyle: 'italic' },
          { token: 'string', foreground: config.type === 'dark' ? 'CE9178' : 'A31515' },
          { token: 'number', foreground: config.type === 'dark' ? 'B5CEA8' : '098658' },
          { token: 'keyword', foreground: primaryColor.substring(1), fontStyle: 'bold' },
          { token: 'type', foreground: config.type === 'dark' ? '4EC9B0' : '267F99' },
          { token: 'function', foreground: config.type === 'dark' ? 'DCDCAA' : '795E26' },
          { token: 'variable', foreground: config.type === 'dark' ? '9CDCFE' : '001080' },
        ],
        colors: {
          'editor.background': backgroundColor,
          'editor.foreground': foregroundColor,
          'editor.lineHighlightBackground': cardColor,
          'editor.selectionBackground': primaryColor + '40',
          'editorLineNumber.foreground': hslToHex(config.colors.mutedForeground),
          'editorLineNumber.activeForeground': foregroundColor,
          'editorGutter.background': backgroundColor,
          'editor.inactiveSelectionBackground': mutedColor,
          'editorWhitespace.foreground': borderColor,
          'editorCursor.foreground': foregroundColor,
          'editorIndentGuide.background': borderColor,
          'editorIndentGuide.activeBackground': primaryColor,
          'editor.findMatchBackground': primaryColor + '60',
          'editor.findMatchHighlightBackground': primaryColor + '30',
        }
      });
      return themeName;
    };
    const themeName = defineThemeFromConfig(themeConfig);
    monacoRef.current.editor.setTheme(themeName);
  }, [themeConfig, editorReady]);

  return (
    <div className={`border border-border  overflow-hidden ${className}`}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          // Line numbers
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          
          // Font settings
          fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
          fontSize: 12,
          fontWeight: '400',
          
          // Editor behavior
          wordWrap: 'on',
          wrappingIndent: 'indent',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          
          // Visual settings
          renderWhitespace: 'selection',
          renderLineHighlight: 'line',
          cursorBlinking: 'phase',
          cursorStyle: 'line',
          cursorSmoothCaretAnimation: "on",
          
          // Remove unnecessary features for a pastebin
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: 'off',
          tabCompletion: 'off',
          wordBasedSuggestions: 'off',
          parameterHints: { enabled: false },
          hover: { enabled: false },
          
          // Disable some advanced features
          folding: false,
          glyphMargin: false,
          contextmenu: true,
          
          // Scrolling
          smoothScrolling: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          
          // Selection
          selectOnLineNumbers: true,
          selectionHighlight: false,
          occurrencesHighlight: 'off',
          
          // Placeholder-like behavior
          domReadOnly: false,
          readOnly: false,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-background text-muted-foreground">
            <div className="animate-pulse">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';