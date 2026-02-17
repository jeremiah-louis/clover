/**
 * Stream Router
 *
 * Pure function that parses accumulated streaming content and routes tokens
 * to three destinations: chat text, code editor, and circuit diagram.
 *
 * Handles:
 * - Text outside fences -> chat panel
 * - ```arduino / ```cpp / ```c fences -> Monaco editor
 * - ```json fences -> circuit canvas (all json fences are treated as potential diagrams
 *   during streaming; confirmed by "version" key when the fence closes)
 * - Partial fences at string tail
 */

export interface StreamRouterResult {
  chatText: string;
  code: string;
  codeLanguage: string;
  diagramJson: string;
  pcbDesign: string;
  activeSegment: "text" | "code" | "diagram" | "pcb";
  codeComplete: boolean;
  diagramComplete: boolean;
  pcbComplete: boolean;
}

const CODE_LANGUAGES = new Set(["arduino", "cpp", "c", "ino"]);

export function routeStream(accumulated: string): StreamRouterResult {
  const result: StreamRouterResult = {
    chatText: "",
    code: "",
    codeLanguage: "",
    diagramJson: "",
    pcbDesign: "",
    activeSegment: "text",
    codeComplete: false,
    diagramComplete: false,
    pcbComplete: false,
  };

  // Create fresh regex instances each call to avoid global lastIndex leaking
  const fenceOpen = /```(\w*)\s*\n?/g;
  const fenceClose = /\n?```/g;

  let pos = 0;
  const len = accumulated.length;

  while (pos < len) {
    // Look for next fence opening
    fenceOpen.lastIndex = pos;
    const openMatch = fenceOpen.exec(accumulated);

    if (!openMatch) {
      // No more fences — check for partial fence at tail
      const remaining = accumulated.slice(pos);
      const partialLen = getPartialFenceLength(remaining);
      result.chatText += remaining.slice(0, remaining.length - partialLen);
      result.activeSegment = "text";
      break;
    }

    // Add text before the fence to chat
    result.chatText += accumulated.slice(pos, openMatch.index);

    const lang = openMatch[1].toLowerCase();
    const contentStart = openMatch.index + openMatch[0].length;

    // Look for the closing fence
    fenceClose.lastIndex = contentStart;
    const closeMatch = fenceClose.exec(accumulated);

    if (!closeMatch) {
      // Fence not closed yet — content is still streaming
      const content = accumulated.slice(contentStart);

      if (isCodeLanguage(lang)) {
        result.code = content;
        result.codeLanguage = lang;
        result.codeComplete = false;
        result.activeSegment = "code";
      } else if (lang === "pcb") {
        result.pcbDesign = content;
        result.pcbComplete = false;
        result.activeSegment = "pcb";
      } else if (lang === "json") {
        // During streaming, treat ALL json fences as potential diagrams.
        // This avoids oscillation when "version" hasn't appeared yet.
        result.diagramJson = content;
        result.diagramComplete = false;
        result.activeSegment = "diagram";
      } else {
        // Other language — keep in chat text as-is
        result.chatText += openMatch[0] + content;
        result.activeSegment = "text";
      }
      break;
    }

    // Fence is closed — full content available
    const content = accumulated.slice(contentStart, closeMatch.index);
    const afterFence = closeMatch.index + closeMatch[0].length;

    if (isCodeLanguage(lang)) {
      result.code = content;
      result.codeLanguage = lang;
      result.codeComplete = true;
    } else if (lang === "pcb" && isPcbContent(content)) {
      result.pcbDesign = content;
      result.pcbComplete = true;
    } else if (lang === "json" && isDiagramContent(content)) {
      // Confirmed diagram — has "version" key
      result.diagramJson = content;
      result.diagramComplete = true;
    } else {
      // Other language or non-diagram JSON — keep in chat
      result.chatText += accumulated.slice(openMatch.index, afterFence);
    }

    pos = afterFence;
  }

  return result;
}

function isCodeLanguage(lang: string): boolean {
  return CODE_LANGUAGES.has(lang);
}

function isDiagramContent(content: string): boolean {
  return content.includes('"version"');
}

function isPcbContent(content: string): boolean {
  return content.includes('"specs"') && content.includes('"components"');
}

/**
 * Check if the tail of the string looks like a partial fence opening
 */
function getPartialFenceLength(text: string): number {
  if (text.endsWith("``") && !text.endsWith("```")) return 2;
  if (text.endsWith("`") && !text.endsWith("``")) return 1;
  return 0;
}
