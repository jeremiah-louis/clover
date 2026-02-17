import { contextBridge } from "electron";
import { ipcRenderer } from "electron/renderer";
import { GetVersionsFn } from "@shared/types";

// The preload process plays a middleware role in bridging
// the call from the front end, and the function in the main process

if (!process.contextIsolated) {
  throw new Error("Context isolation must be enabled in the Browser window");
}

try {
  // Front end can call the function by using window.context.<Function name>
  contextBridge.exposeInMainWorld("context", {
    getVersions: (...args: Parameters<GetVersionsFn>) =>
      ipcRenderer.invoke("getVersions", ...args),
    triggerIPC: () => ipcRenderer.invoke("triggerIPC"),
  });

  // Claude API - accessible via window.claude
  contextBridge.exposeInMainWorld("claude", {
    sendMessage: (messages: unknown[], options?: unknown) =>
      ipcRenderer.invoke("claude:send-message", messages, options),

    setApiKey: (apiKey: string) =>
      ipcRenderer.invoke("claude:set-api-key", apiKey),

    hasStoredApiKey: () => ipcRenderer.invoke("claude:has-stored-api-key"),

    validateApiKey: (apiKey: string) =>
      ipcRenderer.invoke("claude:validate-api-key", apiKey),

    streamMessage: (messages: unknown[], options?: unknown) =>
      ipcRenderer.send("claude:stream-message", messages, options),

    onStreamChunk: (callback: (chunk: unknown) => void) =>
      ipcRenderer.on("claude:stream-chunk", (_event, chunk) => callback(chunk)),

    onStreamEnd: (callback: () => void) =>
      ipcRenderer.on("claude:stream-end", () => callback()),

    onStreamError: (callback: (error: unknown) => void) =>
      ipcRenderer.on("claude:stream-error", (_event, error) => callback(error)),

    removeStreamListeners: () => {
      ipcRenderer.removeAllListeners("claude:stream-chunk");
      ipcRenderer.removeAllListeners("claude:stream-end");
      ipcRenderer.removeAllListeners("claude:stream-error");
    },
  });

  // Database API - accessible via window.db
  contextBridge.exposeInMainWorld("db", {
    createConversation: (title?: string) =>
      ipcRenderer.invoke("db:create-conversation", title),
    listConversations: () => ipcRenderer.invoke("db:list-conversations"),
    getMessages: (conversationId: number) =>
      ipcRenderer.invoke("db:get-messages", conversationId),
    addMessage: (conversationId: number, role: string, content: string) =>
      ipcRenderer.invoke("db:add-message", conversationId, role, content),
    updateConversationTitle: (conversationId: number, title: string) =>
      ipcRenderer.invoke("db:update-conversation-title", conversationId, title),
    deleteConversation: (conversationId: number) =>
      ipcRenderer.invoke("db:delete-conversation", conversationId),
  });

  // PCB API - accessible via window.pcb
  contextBridge.exposeInMainWorld("pcb", {
    getQuote: (specs: unknown) => ipcRenderer.invoke("pcb:get-quote", specs),
    generateGerber: (design: unknown) =>
      ipcRenderer.invoke("pcb:generate-gerber", design),
    exportGerber: (design: unknown) =>
      ipcRenderer.invoke("pcb:export-gerber", design),
    createOrder: (design: unknown) =>
      ipcRenderer.invoke("pcb:create-order", design),
    openJlcpcb: (specs: unknown) =>
      ipcRenderer.invoke("pcb:open-jlcpcb", specs),
    getOrderUrl: (specs: unknown) =>
      ipcRenderer.invoke("pcb:get-order-url", specs),
    listOrders: () => ipcRenderer.invoke("pcb:list-orders"),
  });

  // Native API - accessible via window.api
  contextBridge.exposeInMainWorld("api", {
    fs: {
      readFile: (filePath: string) =>
        ipcRenderer.invoke("fs:readFile", filePath),
      writeFile: (filePath: string, content: string) =>
        ipcRenderer.invoke("fs:writeFile", filePath, content),
      readDir: (dirPath: string) => ipcRenderer.invoke("fs:readDir", dirPath),
    },
    dialog: {
      openFile: (options?: Electron.OpenDialogOptions) =>
        ipcRenderer.invoke("dialog:openFile", options),
      openDirectory: (options?: Electron.OpenDialogOptions) =>
        ipcRenderer.invoke("dialog:openDirectory", options),
      saveFile: (options?: Electron.SaveDialogOptions) =>
        ipcRenderer.invoke("dialog:saveFile", options),
    },
    system: {
      getInfo: () => ipcRenderer.invoke("system:getInfo"),
      getPaths: () => ipcRenderer.invoke("system:getPaths"),
    },
    app: {
      minimize: () => ipcRenderer.invoke("app:minimize"),
      maximize: () => ipcRenderer.invoke("app:maximize"),
      close: () => ipcRenderer.invoke("app:close"),
      quit: () => ipcRenderer.invoke("app:quit"),
      getVersion: () => ipcRenderer.invoke("app:getVersion"),
    },
  });
} catch (error) {
  console.error("Error occured when establishing context bridge: ", error);
}
