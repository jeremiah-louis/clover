import { cn } from "@/utils";
import { memo, useState, useCallback, useEffect, useMemo } from "react";
import { Streamdown, parseMarkdownIntoBlocks } from "streamdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { useCodeTheme } from "../utils/hooks/use-code-theme";
import { highlightCode } from "../utils/shiki-theme-loader";
import { MermaidBlock } from "./mermaid-block";

// Function to strip emojis from text (only common emojis, preserving markdown symbols)
export function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "") // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "") // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "") // Flags
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "") // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FAFF}]/gu, "") // Extended-A
    .replace(/[\u{2700}-\u{27BF}]/gu, ""); // Dingbats
}

// Escape HTML special characters for safe rendering
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Code block text sizes matching paragraph text sizes
const codeBlockTextSize = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-sm",
};

// Code block with copy button using Shiki
function CodeBlock({
  language,
  children,
  themeId,
  size = "md",
}: {
  language?: string;
  children: string;
  themeId: string;
  size?: "sm" | "md" | "lg";
}) {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  // Only use Shiki for known programming languages, not for plaintext/ASCII art
  const shouldHighlight =
    language && language !== "plaintext" && language !== "text";

  useEffect(() => {
    if (!shouldHighlight) return;

    let cancelled = false;

    const highlight = async () => {
      try {
        const html = await highlightCode(children, language, themeId);
        if (!cancelled) {
          setHighlightedHtml(html);
        }
      } catch (error) {
        console.error("Failed to highlight code:", error);
      }
    };

    highlight();

    return () => {
      cancelled = true;
    };
  }, [children, language, themeId, shouldHighlight]);

  // For plaintext/ASCII art, just escape and render directly (no Shiki)
  // For code with syntax highlighting, use Shiki output when available
  const htmlContent = shouldHighlight
    ? (highlightedHtml ?? escapeHtml(children))
    : escapeHtml(children);

  return (
    <div className="relative mt-2 mb-4 rounded-[10px] bg-muted/50 overflow-hidden">
      <button
        onClick={handleCopy}
        tabIndex={-1}
        className="absolute top-[6px] right-[6px] p-1 z-2"
        title={copied ? "Copied!" : "Copy code"}
      >
        <div className="relative w-3.5 h-3.5">
          <Copy
            className={cn(
              "absolute inset-0 w-3 h-3 text-muted-foreground transition-[opacity,transform] duration-200 ease-out hover:text-foreground",
              copied ? "opacity-0 scale-50" : "opacity-100 scale-100",
            )}
          />
          <Check
            className={cn(
              "absolute inset-0 w-3 h-3 text-muted-foreground transition-[opacity,transform] duration-200 ease-out",
              copied ? "opacity-100 scale-100" : "opacity-0 scale-50",
            )}
          />
        </div>
      </button>
      <pre
        className={cn(
          "m-0 bg-transparent",
          "text-foreground",
          codeBlockTextSize[size],
          "px-4 py-3",
          "overflow-x-auto",
          "whitespace-pre",
          // Force all nested elements to preserve whitespace and have no background
          "**:whitespace-pre **:bg-transparent",
          "[&_pre]:m-0 [&_code]:m-0",
          "[&_pre]:p-0 [&_code]:p-0",
        )}
        style={{
          fontFamily:
            "SFMono-Regular, Menlo, Consolas, 'PT Mono', 'Liberation Mono', Courier, monospace",
          lineHeight: 1.5,
          tabSize: 2,
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </pre>
    </div>
  );
}

type MarkdownSize = "sm" | "md" | "lg";

interface ChatMarkdownRendererProps {
  content: string;
  /** Size variant: sm for compact views, md for normal, lg for fullscreen */
  size?: MarkdownSize;
  /** Additional className for the wrapper */
  className?: string;
  /** Whether to enable syntax highlighting (default: true) */
  syntaxHighlight?: boolean;
  /** Whether content is being streamed */
  isStreaming?: boolean;
}

// Size-based styles inspired by Notion's spacing
const sizeStyles: Record<
  MarkdownSize,
  {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
    p: string;
    ul: string;
    ol: string;
    li: string;
    inlineCode: string;
    blockquote: string;
    hr: string;
    table: string;
    thead: string;
    tbody: string;
    tr: string;
    th: string;
    td: string;
  }
> = {
  sm: {
    h1: "text-base font-semibold text-foreground mt-[1.4em] mb-px first:mt-0 leading-[1.3]",
    h2: "text-base font-semibold text-foreground mt-[1.4em] mb-px first:mt-0 leading-[1.3]",
    h3: "text-sm font-semibold text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    h4: "text-sm font-medium text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    h5: "text-sm font-medium text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    h6: "text-sm font-medium text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    p: "text-sm text-foreground/80 my-px leading-normal py-[3px]",
    ul: "list-disc list-inside text-sm text-foreground/80 mb-px marker:text-foreground/60",
    ol: "list-decimal list-inside text-sm text-foreground/80 mb-px marker:text-foreground/60",
    li: "text-sm text-foreground/80 py-[3px]",
    inlineCode:
      "bg-foreground/[0.06] dark:bg-foreground/[0.1] font-mono text-[85%] rounded px-[0.4em] py-[0.2em] break-all",
    blockquote:
      "border-l-2 border-foreground/20 pl-3 text-foreground/70 mb-px text-sm",
    hr: "mt-8 mb-4 border-t border-border",
    table: "w-full text-sm",
    thead: "border-b border-border",
    tbody: "",
    tr: "[&:not(:last-child)]:border-b [&:not(:last-child)]:border-border",
    th: "text-left text-sm font-medium text-foreground px-3 py-2 bg-muted/50 border-r border-border last:border-r-0",
    td: "text-sm text-foreground/80 px-3 py-2 border-r border-border last:border-r-0",
  },
  md: {
    h1: "text-[1.5em] font-semibold text-foreground mt-[1.4em] mb-px first:mt-0 leading-[1.3]",
    h2: "text-[1.5em] font-semibold text-foreground mt-[1.4em] mb-px first:mt-0 leading-[1.3]",
    h3: "text-[1.25em] font-semibold text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    h4: "text-base font-semibold text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    h5: "text-sm font-medium text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    h6: "text-sm font-medium text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    p: "text-sm text-foreground/80 my-px leading-normal py-[3px]",
    ul: "list-disc list-inside text-sm text-foreground/80 mb-px marker:text-foreground/60",
    ol: "list-decimal list-inside text-sm text-foreground/80 mb-px marker:text-foreground/60",
    li: "text-sm text-foreground/80 py-[3px]",
    inlineCode:
      "bg-foreground/[0.06] dark:bg-foreground/[0.1] font-mono text-[85%] rounded px-[0.4em] py-[0.2em] break-all",
    blockquote: "border-l-2 border-foreground/20 pl-4 text-foreground/70 mb-px",
    hr: "mt-8 mb-4 border-t border-border",
    table: "w-full text-sm",
    thead: "border-b border-border",
    tbody: "",
    tr: "[&:not(:last-child)]:border-b [&:not(:last-child)]:border-border",
    th: "text-left text-sm font-medium text-foreground px-3 py-2 bg-muted/50 border-r border-border last:border-r-0",
    td: "text-sm text-foreground/80 px-3 py-2 border-r border-border last:border-r-0",
  },
  lg: {
    h1: "text-[1.875em] font-semibold text-foreground mt-[1.4em] mb-px first:mt-0 leading-[1.3]",
    h2: "text-[1.5em] font-semibold text-foreground mt-[1.4em] mb-px first:mt-0 leading-[1.3]",
    h3: "text-[1.25em] font-semibold text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    h4: "text-base font-semibold text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    h5: "text-sm font-medium text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    h6: "text-sm font-medium text-foreground mt-[1em] mb-px first:mt-0 leading-[1.3]",
    p: "text-sm text-foreground/80 my-px leading-normal py-[3px]",
    ul: "list-disc list-inside text-sm text-foreground/80 mb-px marker:text-foreground/60",
    ol: "list-decimal list-inside text-sm text-foreground/80 mb-px marker:text-foreground/60",
    li: "text-sm text-foreground/80 py-[3px]",
    inlineCode:
      "bg-foreground/[0.06] dark:bg-foreground/[0.1] font-mono text-[85%] rounded px-[0.4em] py-[0.2em] break-all",
    blockquote: "border-l-2 border-foreground/20 pl-4 text-foreground/70 mb-px",
    hr: "mt-8 mb-4 border-t border-border",
    table: "w-full text-sm",
    thead: "border-b border-border",
    tbody: "",
    tr: "[&:not(:last-child)]:border-b [&:not(:last-child)]:border-border",
    th: "text-left text-sm font-medium text-foreground px-3 py-2 bg-muted/50 border-r border-border last:border-r-0",
    td: "text-sm text-foreground/80 px-3 py-2 border-r border-border last:border-r-0",
  },
};

// Custom code component that uses our theme system
function createCodeComponent(
  codeTheme: string,
  size: MarkdownSize,
  styles: typeof sizeStyles.md,
  isStreaming: boolean = false,
) {
  return function CodeComponent({ className, children }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : undefined;
    const codeContent = String(children);

    // Check if this is a code block (has language) or inline code
    const isCodeBlock =
      language || (codeContent.includes("\n") && codeContent.length > 100);

    if (isCodeBlock) {
      // Route mermaid blocks to MermaidBlock component
      if (language === "mermaid") {
        return (
          <MermaidBlock
            code={codeContent.replace(/\n$/, "")}
            size={size}
            isStreaming={isStreaming}
          />
        );
      }

      return (
        <CodeBlock language={language} themeId={codeTheme} size={size}>
          {codeContent.replace(/\n$/, "")}
        </CodeBlock>
      );
    }

    // Inline code
    return <span className={styles.inlineCode}>{children}</span>;
  };
}

export const ChatMarkdownRenderer = memo(function ChatMarkdownRenderer({
  content,
  size = "md",
  className,
  isStreaming = false,
}: ChatMarkdownRendererProps) {
  const codeTheme = useCodeTheme();
  const styles = sizeStyles[size];

  // Process content - strip emojis
  const processedContent = useMemo(() => stripEmojis(content), [content]);

  const components = useMemo(() => {
    const fade = isStreaming ? "stream-block-enter" : undefined;
    return {
      h1: ({ children, ...props }: any) => (
        <h1 className={cn(styles.h1, fade)} {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: any) => (
        <h2 className={cn(styles.h2, fade)} {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: any) => (
        <h3 className={cn(styles.h3, fade)} {...props}>
          {children}
        </h3>
      ),
      h4: ({ children, ...props }: any) => (
        <h4 className={cn(styles.h4, fade)} {...props}>
          {children}
        </h4>
      ),
      h5: ({ children, ...props }: any) => (
        <h5 className={cn(styles.h5, fade)} {...props}>
          {children}
        </h5>
      ),
      h6: ({ children, ...props }: any) => (
        <h6 className={cn(styles.h6, fade)} {...props}>
          {children}
        </h6>
      ),
      p: ({ children, ...props }: any) => (
        <p className={cn(styles.p, fade)} {...props}>
          {children}
        </p>
      ),
      ul: ({ children, ...props }: any) => (
        <ul className={cn(styles.ul, fade)} {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }: any) => (
        <ol className={cn(styles.ol, fade)} {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }: any) => (
        <li className={cn(styles.li, fade)} {...props}>
          {children}
        </li>
      ),
      a: ({ href, children, ...props }: any) => (
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault();
            if (href) {
              window.open(href, "_blank");
            }
          }}
          className="text-blue-600 dark:text-blue-400 no-underline hover:underline hover:decoration-current underline-offset-2 decoration-1 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/30 focus-visible:rounded-sm"
          {...props}
        >
          {children}
        </a>
      ),
      strong: ({ children, ...props }: any) => (
        <strong className="font-medium text-foreground" {...props}>
          {children}
        </strong>
      ),
      em: ({ children, ...props }: any) => (
        <em className="italic" {...props}>
          {children}
        </em>
      ),
      blockquote: ({ children, ...props }: any) => (
        <blockquote className={cn(styles.blockquote, fade)} {...props}>
          {children}
        </blockquote>
      ),
      hr: ({ ...props }: any) => (
        <hr className={cn(styles.hr, fade)} {...props} />
      ),
      table: ({ children, ...props }: any) => (
        <div
          className={cn(
            "overflow-x-auto my-3 rounded-lg border border-border overflow-hidden",
            fade,
          )}
        >
          <table className={cn(styles.table, "border-collapse")} {...props}>
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }: any) => (
        <thead className={styles.thead} {...props}>
          {children}
        </thead>
      ),
      tbody: ({ children, ...props }: any) => (
        <tbody className={styles.tbody} {...props}>
          {children}
        </tbody>
      ),
      tr: ({ children, ...props }: any) => (
        <tr className={styles.tr} {...props}>
          {children}
        </tr>
      ),
      th: ({ children, ...props }: any) => (
        <th className={styles.th} {...props}>
          {children}
        </th>
      ),
      td: ({ children, ...props }: any) => (
        <td className={styles.td} {...props}>
          {children}
        </td>
      ),
      pre: ({ children }: any) => <>{children}</>,
      code: createCodeComponent(codeTheme, size, styles, isStreaming),
    };
  }, [styles, codeTheme, size, isStreaming]);

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert prose-code:before:content-none prose-code:after:content-none",
        "prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0",
        "prose-ul:pl-0 prose-ol:pl-0 prose-li:pl-0",
        "prose-hr:my-0",
        "prose-table:my-0",
        "[&_li>p]:inline [&_li>p]:mb-0",
        "overflow-hidden wrap-break-words",
        "[&_p:has(+hr)]:mb-6 [&_ul:has(+hr)]:mb-6 [&_ol:has(+hr)]:mb-6 [&_div:has(+hr)]:mb-6 [&_table:has(+hr)]:mb-6 [&_h1:has(+hr)]:mb-6 [&_h2:has(+hr)]:mb-6 [&_h3:has(+hr)]:mb-6 [&_blockquote:has(+hr)]:mb-6",
        "[&_hr+p]:mt-4 [&_hr+ul]:mt-4 [&_hr+ol]:mt-4",
        "[&_div+p]:mt-2 [&_div+ul]:mt-2 [&_div+ol]:mt-2",
        "[&_table+p]:mt-4 [&_table+ul]:mt-4 [&_table+ol]:mt-4",
        className,
      )}
    >
      <Streamdown
        mode="streaming"
        components={components}
        remarkPlugins={[remarkGfm, remarkBreaks]}
        isAnimating={isStreaming}
        parseIncompleteMarkdown={isStreaming}
        controls={false}
      >
        {processedContent}
      </Streamdown>
    </div>
  );
});

// Convenience exports for specific use cases
export const CompactMarkdownRenderer = memo(function CompactMarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <ChatMarkdownRenderer content={content} size="sm" className={className} />
  );
});

export const FullscreenMarkdownRenderer = memo(
  function FullscreenMarkdownRenderer({
    content,
    className,
  }: {
    content: string;
    className?: string;
  }) {
    return (
      <ChatMarkdownRenderer content={content} size="lg" className={className} />
    );
  },
);

// ============================================================================
// MEMOIZED MARKDOWN - Block-level memoization for streaming performance
// ============================================================================

function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

interface ParsedBlock {
  content: string;
  key: string;
}

function parseIntoBlocks(markdown: string): ParsedBlock[] {
  try {
    const blocks = parseMarkdownIntoBlocks(markdown);
    const seen = new Map<string, number>();
    return blocks.map((content) => {
      const baseKey = hashString(content);
      const occurrence = seen.get(baseKey) ?? 0;
      seen.set(baseKey, occurrence + 1);
      const key = occurrence > 0 ? `${baseKey}-${occurrence}` : baseKey;
      return { content, key };
    });
  } catch {
    return [{ content: markdown, key: `fallback-${hashString(markdown)}` }];
  }
}

// Strip "first:mt-0" from a class string so headings in non-first blocks keep their top margin
function stripFirstMt0(cls: string): string {
  return cls.replace(/\bfirst:mt-0\b/, "").trim();
}

const MemoizedMarkdownBlock = memo(
  function MemoizedMarkdownBlock({
    content,
    size,
    className: _className,
    codeTheme,
    isFirst,
  }: {
    content: string;
    size: MarkdownSize;
    className?: string;
    codeTheme: string;
    isFirst: boolean;
  }) {
    if (!content.trim()) return null;

    const styles = sizeStyles[size];

    // For non-first blocks, remove first:mt-0 so headings keep their top margin
    const h1Cls = isFirst ? styles.h1 : stripFirstMt0(styles.h1);
    const h2Cls = isFirst ? styles.h2 : stripFirstMt0(styles.h2);
    const h3Cls = isFirst ? styles.h3 : stripFirstMt0(styles.h3);
    const h4Cls = isFirst ? styles.h4 : stripFirstMt0(styles.h4);
    const h5Cls = isFirst ? styles.h5 : stripFirstMt0(styles.h5);
    const h6Cls = isFirst ? styles.h6 : stripFirstMt0(styles.h6);

    const components = useMemo(
      () => ({
        h1: ({ children, ...props }: any) => (
          <h1 className={h1Cls} {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }: any) => (
          <h2 className={h2Cls} {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }: any) => (
          <h3 className={h3Cls} {...props}>
            {children}
          </h3>
        ),
        h4: ({ children, ...props }: any) => (
          <h4 className={h4Cls} {...props}>
            {children}
          </h4>
        ),
        h5: ({ children, ...props }: any) => (
          <h5 className={h5Cls} {...props}>
            {children}
          </h5>
        ),
        h6: ({ children, ...props }: any) => (
          <h6 className={h6Cls} {...props}>
            {children}
          </h6>
        ),
        p: ({ children, ...props }: any) => (
          <p className={styles.p} {...props}>
            {children}
          </p>
        ),
        ul: ({ children, ...props }: any) => (
          <ul className={styles.ul} {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }: any) => (
          <ol className={styles.ol} {...props}>
            {children}
          </ol>
        ),
        li: ({ children, ...props }: any) => (
          <li className={styles.li} {...props}>
            {children}
          </li>
        ),
        a: ({ href, children, ...props }: any) => (
          <a
            href={href}
            onClick={(e) => {
              e.preventDefault();
              if (href) {
                window.open(href, "_blank");
              }
            }}
            className="text-blue-600 dark:text-blue-400 no-underline hover:underline hover:decoration-current underline-offset-2 decoration-1 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/30 focus-visible:rounded-sm"
            {...props}
          >
            {children}
          </a>
        ),
        strong: ({ children, ...props }: any) => (
          <strong className="font-medium text-foreground" {...props}>
            {children}
          </strong>
        ),
        em: ({ children, ...props }: any) => (
          <em className="italic" {...props}>
            {children}
          </em>
        ),
        blockquote: ({ children, ...props }: any) => (
          <blockquote className={styles.blockquote} {...props}>
            {children}
          </blockquote>
        ),
        hr: ({ ...props }: any) => <hr className={styles.hr} {...props} />,
        table: ({ children, ...props }: any) => (
          <div className="overflow-x-auto my-3 rounded-lg border border-border overflow-hidden">
            <table className={cn(styles.table, "border-collapse")} {...props}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children, ...props }: any) => (
          <thead className={styles.thead} {...props}>
            {children}
          </thead>
        ),
        tbody: ({ children, ...props }: any) => (
          <tbody className={styles.tbody} {...props}>
            {children}
          </tbody>
        ),
        tr: ({ children, ...props }: any) => (
          <tr className={styles.tr} {...props}>
            {children}
          </tr>
        ),
        th: ({ children, ...props }: any) => (
          <th className={styles.th} {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }: any) => (
          <td className={styles.td} {...props}>
            {children}
          </td>
        ),
        pre: ({ children }: any) => <>{children}</>,
        code: createCodeComponent(codeTheme, size, styles),
      }),
      [styles, codeTheme, size, h1Cls, h2Cls, h3Cls, h4Cls, h5Cls, h6Cls],
    );

    return (
      <div style={{ display: "contents" }}>
        <Streamdown
          mode="static"
          components={components}
          remarkPlugins={[remarkGfm, remarkBreaks]}
          controls={false}
        >
          {content}
        </Streamdown>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.size === nextProps.size &&
      prevProps.className === nextProps.className &&
      prevProps.codeTheme === nextProps.codeTheme &&
      prevProps.isFirst === nextProps.isFirst
    );
  },
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(function MemoizedMarkdown({
  content,
  id,
  size = "sm",
  className,
}: {
  content: string;
  id: string;
  size?: MarkdownSize;
  className?: string;
}) {
  const codeTheme = useCodeTheme();

  const processedContent = useMemo(() => stripEmojis(content), [content]);

  const blocks = useMemo(
    () => parseIntoBlocks(processedContent),
    [processedContent],
  );

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert prose-code:before:content-none prose-code:after:content-none",
        "prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0",
        "prose-ul:pl-0 prose-ol:pl-0 prose-li:pl-0",
        "prose-hr:my-0",
        "prose-table:my-0",
        "[&_li>p]:inline [&_li>p]:mb-0",
        "overflow-hidden wrap-break-words",
        "[&_p:has(+hr)]:mb-6 [&_ul:has(+hr)]:mb-6 [&_ol:has(+hr)]:mb-6 [&_div:has(+hr)]:mb-6 [&_table:has(+hr)]:mb-6 [&_h1:has(+hr)]:mb-6 [&_h2:has(+hr)]:mb-6 [&_h3:has(+hr)]:mb-6 [&_blockquote:has(+hr)]:mb-6",
        "[&_hr+p]:mt-4 [&_hr+ul]:mt-4 [&_hr+ol]:mt-4",
        "[&_div+p]:mt-2 [&_div+ul]:mt-2 [&_div+ol]:mt-2",
        "[&_table+p]:mt-4 [&_table+ul]:mt-4 [&_table+ol]:mt-4",
        className,
      )}
    >
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          key={`${id}-${block.key}`}
          content={block.content}
          size={size}
          className={className}
          codeTheme={codeTheme}
          isFirst={index === 0}
        />
      ))}
    </div>
  );
});

MemoizedMarkdown.displayName = "MemoizedMarkdown";
