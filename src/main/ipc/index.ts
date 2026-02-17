import { registerFileSystemHandlers } from "./handlers";
import { registerClaudeHandlers } from "./claude-handlers";
import { registerDatabaseHandlers } from "./database-handlers";
import { registerPcbHandlers } from "./pcb-handlers";

export function registerIpcHandlers(): void {
  registerFileSystemHandlers();
  registerClaudeHandlers();
  registerDatabaseHandlers();
  registerPcbHandlers();
}
