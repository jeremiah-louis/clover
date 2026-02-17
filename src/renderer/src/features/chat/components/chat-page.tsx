import React, { useRef, useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ResizableSidebar } from "@/components/ui/resizable-sidebar";
import { cn } from "@/utils";
import { Eye, Code, RotateCw, Cpu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useChat } from "../use-chat";
import { useStreamRouter } from "../hooks/use-stream-router";
import { routeStream } from "../utils/stream-router";
import { generateTitle } from "../services/claude";
import { ChatHistorySidebar } from "./chat-history-sidebar";
import { ChatLanding } from "./chat-landing";
import { CodeEditor } from "../../simulation/components/code-editor";
import { CircuitCanvas } from "../../simulation/components/circuit-canvas";
import { SerialMonitor } from "../../simulation/components/serial-monitor";
import { useSimulation } from "../../simulation/hooks/use-simulation";
import { useOrchestrator } from "../../orchestrator/use-orchestrator";
import {
  ARDUINO_SYSTEM_PROMPT,
  DEFAULT_LED_DIAGRAM,
} from "../../simulation/constants";
import { PCBConfigurator } from "../../pcb/components/pcb-configurator";
import type { ChatPhase } from "../types";

type RightTab = "code" | "preview" | "pcb";

interface ChatPageProps {
  onNavigateToSettings?: () => void;
}

export function ChatPage({ onNavigateToSettings }: ChatPageProps) {
  const {
    state,
    sendMessage,
    setInput,
    cancelStreaming,
    dismissError,
    isLoading,
    canSend,
    canSendProgrammatic,
    canCancel,
    startNewChat,
    loadConversation,
    updateTitle,
    currentConversationId,
    isLoadingConversation,
  } = useChat({ systemPrompt: ARDUINO_SYSTEM_PROMPT });

  const onSendScrollRef = useRef<(() => void) | null>(null);

  const handleSubmit = () => {
    if (!canSend) return;
    sendMessage(state.inputValue);
    onSendScrollRef.current?.();
  };

  // Stream router: parse streaming content into chat/code/diagram
  const routedResult = useStreamRouter(state.streamingContent);

  // ── Persisted code & diagram ──
  // The stream router only has data while streamingContent is non-empty.
  // On STREAM_COMPLETE the reducer clears streamingContent, so the router
  // returns empty. We persist the last routed code/diagram in state so the
  // editor, canvas, and orchestrator still have them after the stream ends.
  const [persistedCode, setPersistedCode] = useState("");
  const [persistedCodeLang, setPersistedCodeLang] = useState("");
  const [persistedDiagram, setPersistedDiagram] = useState("");
  const [persistedCodeComplete, setPersistedCodeComplete] = useState(false);
  const [persistedPcbDesign, setPersistedPcbDesign] = useState("");

  // Update persisted values whenever the router produces content
  useEffect(() => {
    if (routedResult.code) {
      setPersistedCode(routedResult.code);
      setPersistedCodeLang(routedResult.codeLanguage);
      setPersistedCodeComplete(routedResult.codeComplete);
    }
    if (routedResult.diagramJson) {
      setPersistedDiagram(routedResult.diagramJson);
    }
    if (routedResult.pcbDesign) {
      setPersistedPcbDesign(routedResult.pcbDesign);
    }
  }, [
    routedResult.code,
    routedResult.codeLanguage,
    routedResult.codeComplete,
    routedResult.diagramJson,
    routedResult.pcbDesign,
  ]);

  // Clear persisted values when user sends a NEW message (fresh conversation turn)
  useEffect(() => {
    if (state.phase === "WAITING") {
      setPersistedCode("");
      setPersistedCodeLang("");
      setPersistedDiagram("");
      setPersistedCodeComplete(false);
      setPersistedPcbDesign("");
      setUserCode("");
      setCodeDirty(false);
    }
  }, [state.phase]);

  // Simulation
  const simulation = useSimulation();

  // Track previous chat phase for orchestrator
  const [prevPhase, setPrevPhase] = useState<ChatPhase | null>(null);
  const phaseRef = useRef(state.phase);
  useEffect(() => {
    if (phaseRef.current !== state.phase) {
      setPrevPhase(phaseRef.current);
      phaseRef.current = state.phase;
    }
  }, [state.phase]);

  // Orchestrator: zero-click compile-and-run pipeline
  const { pipelinePhase, debugAttempt } = useOrchestrator({
    chatPhase: state.phase,
    previousChatPhase: prevPhase,
    code: persistedCode,
    diagramJson: persistedDiagram,
    codeComplete: persistedCodeComplete,
    simulationPhase: simulation.state.phase,
    compileAndRun: async (code, diagram) => {
      const diagramToUse = diagram || DEFAULT_LED_DIAGRAM;
      return simulation.compileAndRun(code, diagramToUse);
    },
    sendMessage,
    canSend: canSendProgrammatic,
  });

  // Track user code edits (user typed into the editor after streaming)
  const [userCode, setUserCode] = useState("");
  const [codeDirty, setCodeDirty] = useState(false);

  const handleCodeChange = (code: string) => {
    setUserCode(code);
    setCodeDirty(true);
  };

  // Determine what code to show (priority: live stream > persisted > user edit > simulation)
  const displayCode =
    routedResult.code || persistedCode || userCode || simulation.state.code;

  // Determine what diagram to show
  const displayDiagram =
    routedResult.diagramJson ||
    persistedDiagram ||
    simulation.state.diagramJson ||
    "";

  const displayPcbDesign = routedResult.pcbDesign || persistedPcbDesign || "";

  // Tabbed panel
  const [activeTab, setActiveTab] = useState<RightTab>("code");
  const [panelWidth, setPanelWidth] = useState(500);
  const isMobile = useIsMobile();

  // Auto-switch tabs based on what's streaming
  useEffect(() => {
    if (routedResult.activeSegment === "code") {
      setActiveTab("code");
    }
    if (routedResult.activeSegment === "diagram") {
      setActiveTab("preview");
    }
    if (routedResult.activeSegment === "pcb") {
      setActiveTab("pcb");
    }
  }, [routedResult.activeSegment]);

  // Auto-switch to preview when simulation starts running
  useEffect(() => {
    if (simulation.state.phase === "RUNNING") {
      setActiveTab("preview");
    }
  }, [simulation.state.phase]);

  // Session title (AI-generated from first user message, one-time)
  const [sessionTitle, setSessionTitle] = useState("");
  const [isTitleStreaming, setIsTitleStreaming] = useState(false);
  const titleGeneratedRef = useRef(false);

  // Sidebar refresh key — incremented when a title update completes
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  useEffect(() => {
    if (titleGeneratedRef.current) return;
    const firstUserMsg = state.messages.find((m) => m.role === "user");
    if (!firstUserMsg) return;
    titleGeneratedRef.current = true;
    let cancelled = false;
    generateTitle(firstUserMsg.content)
      .then((title) => {
        if (cancelled || !title) return;
        setIsTitleStreaming(true);
        let i = 0;
        const id = setInterval(() => {
          i++;
          setSessionTitle(title.slice(0, i));
          if (i >= title.length) {
            clearInterval(id);
            setIsTitleStreaming(false);
            // Persist the title and refresh sidebar
            updateTitle(title)
              .then(() => setSidebarRefreshKey((k) => k + 1))
              .catch(console.error);
          }
        }, 30);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [state.messages, updateTitle]);

  // Reset title state when starting a new chat or loading a conversation
  useEffect(() => {
    if (state.phase === "IDLE" && state.messages.length === 0) {
      setSessionTitle("");
      titleGeneratedRef.current = false;
    }
  }, [state.phase, state.messages.length]);

  // Panel is open when there's code or diagram content
  const panelOpen = !!(displayCode || displayDiagram || displayPcbDesign);

  // Empty state: no messages yet
  const isEmpty = state.messages.length === 0 && state.phase === "IDLE";

  // Manual simulation controls
  const handleStop = () => simulation.stop();
  const handleRun = () => {
    const codeToRun = userCode || persistedCode || simulation.state.code;
    const diagramToUse =
      persistedDiagram || simulation.state.diagramJson || DEFAULT_LED_DIAGRAM;
    if (codeToRun) {
      setCodeDirty(false);
      simulation.compileAndRun(codeToRun, diagramToUse);
    }
  };
  const handleRerun = () => {
    simulation.stop();
    // Small delay so the stop completes before re-running
    setTimeout(handleRun, 50);
  };

  // Streaming state for code editor
  const isCodeStreaming =
    state.phase === "STREAMING" && routedResult.activeSegment === "code";

  const isPcbStreaming =
    state.phase === "STREAMING" && routedResult.activeSegment === "pcb";

  // Handle loading a previous conversation
  const handleSelectConversation = async (id: number) => {
    if (id === currentConversationId) return;
    simulation.reset();
    setUserCode("");
    setCodeDirty(false);

    await loadConversation(id);

    // Restore code/diagram from the last assistant message
    const loadedMessages = await window.db.getMessages(id);
    const lastAssistant = [...loadedMessages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (lastAssistant) {
      const routed = routeStream(lastAssistant.content);
      setPersistedCode(routed.code);
      setPersistedCodeLang(routed.codeLanguage);
      setPersistedDiagram(routed.diagramJson);
      setPersistedCodeComplete(routed.codeComplete);
      setPersistedPcbDesign(routed.pcbDesign);
    } else {
      setPersistedCode("");
      setPersistedCodeLang("");
      setPersistedDiagram("");
      setPersistedCodeComplete(false);
      setPersistedPcbDesign("");
    }

    // Restore title from DB instead of re-generating
    const conversations = await window.db.listConversations();
    const conv = conversations.find((c) => c.id === id);
    if (conv?.title) {
      setSessionTitle(conv.title);
      titleGeneratedRef.current = true;
    } else {
      setSessionTitle("");
      titleGeneratedRef.current = false;
    }
  };

  const handleNewChat = () => {
    startNewChat();
    simulation.reset();
    setPersistedCode("");
    setPersistedCodeLang("");
    setPersistedDiagram("");
    setPersistedCodeComplete(false);
    setPersistedPcbDesign("");
    setUserCode("");
    setCodeDirty(false);
    setSessionTitle("");
    titleGeneratedRef.current = false;
    setSidebarRefreshKey((k) => k + 1);
  };

  return (
    <TooltipProvider>
      <div className="h-dvh flex flex-col bg-background text-foreground">
        {/* Title bar drag region */}
        <div
          className="shrink-0 h-10 border-b border-border"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        />

        {/* Horizontal split: sidebar + chat + tabbed panel */}
        <div className="flex-1 flex flex-row min-h-0">
          {/* Left sidebar: icon rail + chat history */}
          <ChatHistorySidebar
            onNavigateToSettings={onNavigateToSettings}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            currentConversationId={currentConversationId}
            refreshKey={sidebarRefreshKey}
          />

          {/* Chat column */}
          <div className="flex-1 min-w-0 flex flex-col">
            {isLoadingConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground/30" />
              </div>
            ) : isEmpty ? (
              <ChatLanding
                value={state.inputValue}
                onValueChange={setInput}
                onSubmit={handleSubmit}
                onCancel={cancelStreaming}
                onSendPrompt={(prompt) => {
                  sendMessage(prompt);
                  onSendScrollRef.current?.();
                }}
                isLoading={isLoading}
                canSend={canSend}
                canCancel={canCancel}
                pipelinePhase={pipelinePhase}
                debugAttempt={debugAttempt}
              />
            ) : (
              <div
                className={cn(
                  "flex-1 flex flex-col w-full px-6 pb-4 min-h-0",
                  !(panelOpen && !isMobile) && "max-w-2xl mx-auto",
                )}
              >
                <MessageList
                  messages={state.messages.map((msg) =>
                    msg.role === "assistant" && msg.status === "complete"
                      ? { ...msg, content: routeStream(msg.content).chatText }
                      : msg,
                  )}
                  phase={state.phase}
                  streamingMessageId={state.streamingMessageId}
                  streamingContent={
                    state.phase === "STREAMING"
                      ? routedResult.chatText
                      : state.streamingContent
                  }
                  onSendScrollRef={onSendScrollRef}
                />

                {/* Error banner */}
                {state.phase === "ERROR" && state.error && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-2 text-sm text-destructive bg-destructive/10 rounded-lg">
                    <span className="flex-1">{state.error}</span>
                    <button
                      onClick={dismissError}
                      className="shrink-0 text-xs font-medium underline underline-offset-2 hover:no-underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <ChatInput
                  value={state.inputValue}
                  onValueChange={setInput}
                  onSubmit={handleSubmit}
                  onCancel={cancelStreaming}
                  isLoading={isLoading}
                  canSend={canSend}
                  canCancel={canCancel}
                  pipelinePhase={pipelinePhase}
                  debugAttempt={debugAttempt}
                />
              </div>
            )}
          </div>

          {/* Desktop: resizable sidebar with tabs */}
          {!isMobile && (
            <ResizableSidebar
              isOpen={panelOpen}
              onClose={() => {}}
              width={panelWidth}
              onWidthChange={setPanelWidth}
              side="right"
              minWidth={300}
              maxWidth={
                typeof window !== "undefined" ? window.innerWidth * 0.7 : 900
              }
              showResizeTooltip
              className="border-l border-border"
            >
              <TabbedPanel
                activeTab={activeTab}
                onTabChange={setActiveTab}
                code={displayCode}
                isCodeStreaming={isCodeStreaming}
                onCodeChange={handleCodeChange}
                diagramJson={displayDiagram}
                pcbDesignJson={displayPcbDesign}
                isPcbStreaming={isPcbStreaming}
                simulationPhase={simulation.state.phase}
                serialOutput={simulation.state.serialOutput}
                serialWrite={simulation.serialWrite}
                registerElementRef={simulation.registerElementRef}
                elementRefs={simulation.elementRefs}
                onStop={handleStop}
                onRun={handleRun}
                onRerun={handleRerun}
                codeDirty={codeDirty}
                sessionTitle={sessionTitle}
                isTitleStreaming={isTitleStreaming}
              />
            </ResizableSidebar>
          )}
        </div>

        {/* Mobile: show tab buttons at bottom when panel content exists */}
        {isMobile && panelOpen && (
          <div className="border-t border-border">
            <TabbedPanel
              activeTab={activeTab}
              onTabChange={setActiveTab}
              code={displayCode}
              isCodeStreaming={isCodeStreaming}
              onCodeChange={handleCodeChange}
              diagramJson={displayDiagram}
              pcbDesignJson={displayPcbDesign}
              isPcbStreaming={isPcbStreaming}
              simulationPhase={simulation.state.phase}
              serialOutput={simulation.state.serialOutput}
              serialWrite={simulation.serialWrite}
              registerElementRef={simulation.registerElementRef}
              elementRefs={simulation.elementRefs}
              onStop={handleStop}
              onRun={handleRun}
              onRerun={handleRerun}
              codeDirty={codeDirty}
              sessionTitle={sessionTitle}
              isTitleStreaming={isTitleStreaming}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// -- Tabbed Panel Component --

interface TabbedPanelProps {
  activeTab: RightTab;
  onTabChange: (tab: RightTab) => void;
  code: string;
  isCodeStreaming: boolean;
  onCodeChange: (code: string) => void;
  diagramJson: string;
  pcbDesignJson: string;
  isPcbStreaming: boolean;
  simulationPhase: import("../../simulation/types").SimulationPhase;
  serialOutput: string;
  serialWrite: (data: string) => void;
  registerElementRef: (id: string, el: HTMLElement | null) => void;
  elementRefs: Map<string, HTMLElement>;
  onStop: () => void;
  onRun: () => void;
  onRerun: () => void;
  codeDirty: boolean;
  sessionTitle: string;
  isTitleStreaming: boolean;
}

function TabbedPanel({
  activeTab,
  onTabChange,
  code,
  isCodeStreaming,
  onCodeChange,
  diagramJson,
  pcbDesignJson,
  isPcbStreaming,
  simulationPhase,
  serialOutput,
  serialWrite,
  registerElementRef,
  elementRefs,
  onStop,
  onRun,
  onRerun,
  codeDirty,
  sessionTitle,
  isTitleStreaming,
}: TabbedPanelProps) {
  const isRunning =
    simulationPhase === "RUNNING" ||
    simulationPhase === "COMPILING" ||
    simulationPhase === "LOADING";
  const canRun =
    simulationPhase === "STOPPED" ||
    simulationPhase === "IDLE" ||
    simulationPhase === "COMPILE_ERROR";

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="shrink-0 flex items-center border-b border-border bg-muted/30">
        <div className="flex items-center ml-2 my-1.5 rounded-lg bg-muted p-0.5">
          <button
            onClick={() => onTabChange("preview")}
            className={cn(
              "flex items-center justify-center w-8 h-7 rounded-md transition-colors",
              activeTab === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTabChange("code")}
            className={cn(
              "flex items-center justify-center w-8 h-7 rounded-md transition-colors",
              activeTab === "code"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Code className="w-4 h-4" />
          </button>
          {pcbDesignJson && (
            <button
              onClick={() => onTabChange("pcb")}
              className={cn(
                "flex items-center justify-center w-8 h-7 rounded-md transition-colors",
                activeTab === "pcb"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Cpu className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Session title */}
        {sessionTitle && (
          <div className="flex-1 min-w-0 px-2 overflow-hidden">
            <p className="text-sm font-medium text-foreground text-center truncate">
              {sessionTitle}
              {isTitleStreaming && (
                <span className="inline-block w-[2px] h-[1em] bg-foreground align-text-bottom ml-0.5 animate-pulse" />
              )}
            </p>
          </div>
        )}

        {/* Simulation controls */}
        <div className="ml-auto flex items-center gap-1 pr-2">
          {codeDirty ? (
            <button
              onClick={onRerun}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-amber-50 bg-amber-500/90 hover:bg-amber-500 transition-colors active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Re-run
            </button>
          ) : (
            <>
              {isRunning && (
                <button
                  onClick={onStop}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-destructive-foreground bg-destructive/90 hover:bg-destructive transition-colors active:scale-95"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="currentColor"
                  >
                    <rect width="10" height="10" rx="1" />
                  </svg>
                  Stop
                </button>
              )}
              {canRun && (
                <button
                  onClick={onRun}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-primary-foreground bg-primary/90 hover:bg-primary transition-colors active:scale-95"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="currentColor"
                  >
                    <polygon points="0,0 10,5 0,10" />
                  </svg>
                  Run
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab content — both panels stay mounted to avoid destroy/recreate cycles */}
      <div className="flex-1 min-h-0 relative">
        <div
          className={cn(
            "absolute inset-0",
            activeTab !== "code" && "invisible pointer-events-none",
          )}
        >
          <CodeEditor
            code={code}
            isStreaming={isCodeStreaming}
            onCodeChange={onCodeChange}
          />
        </div>
        <div
          className={cn(
            "absolute inset-0 flex flex-col",
            activeTab !== "preview" && "invisible pointer-events-none",
          )}
        >
          <div className="flex-1 min-h-0 overflow-hidden">
            <CircuitCanvas
              diagramJson={diagramJson}
              simulationPhase={simulationPhase}
              registerElementRef={registerElementRef}
              elementRefs={elementRefs}
            />
          </div>
          <SerialMonitor
            output={serialOutput}
            onSend={serialWrite}
            isRunning={simulationPhase === "RUNNING"}
          />
        </div>
        {pcbDesignJson && (
          <div
            className={cn(
              "absolute inset-0",
              activeTab !== "pcb" && "invisible pointer-events-none",
            )}
          >
            <PCBConfigurator
              pcbDesignJson={pcbDesignJson}
              isStreaming={isPcbStreaming}
            />
          </div>
        )}
      </div>
    </div>
  );
}
