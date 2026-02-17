import { useMemo } from "react";
import { routeStream, type StreamRouterResult } from "../utils/stream-router";

const EMPTY_RESULT: StreamRouterResult = {
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

export function useStreamRouter(streamingContent: string): StreamRouterResult {
  return useMemo(() => {
    if (!streamingContent) return EMPTY_RESULT;
    return routeStream(streamingContent);
  }, [streamingContent]);
}
