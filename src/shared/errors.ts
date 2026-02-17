// ---------------------------------------------------------------------------
// Error categories – add new domains here as the app grows
// ---------------------------------------------------------------------------
export enum ErrorCategory {
  CLIENT = "CLIENT",
  FILE_SYSTEM = "FILE_SYSTEM",
  CLAUDE_API = "CLAUDE_API",
  PCB_API = "PCB_API",
}

// ---------------------------------------------------------------------------
// Numeric error codes grouped by category
//   CLIENT      1xxx
//   FILE_SYSTEM 2xxx
//   CLAUDE_API  3xxx
//   PCB_API     4xxx
// ---------------------------------------------------------------------------
export enum ErrorCode {
  // Client
  CLIENT_UNKNOWN = 1000,
  CLIENT_VALIDATION = 1001,
  CLIENT_NOT_FOUND = 1002,

  // File system
  FS_UNKNOWN = 2000,
  FS_READ = 2001,
  FS_WRITE = 2002,
  FS_NOT_FOUND = 2003,
  FS_PERMISSION_DENIED = 2004,

  // Claude API
  API_UNKNOWN = 3000,
  API_KEY_INVALID = 3001,
  API_KEY_NOT_SET = 3002,
  API_RATE_LIMITED = 3003,
  API_OVERLOADED = 3004,
  API_NETWORK = 3005,
  API_MAX_TOKENS = 3006,

  // PCB API
  PCB_UNKNOWN = 4000,
  PCB_INVALID_SPECS = 4001,
  PCB_QUOTE_FAILED = 4002,
  PCB_GERBER_GENERATION_FAILED = 4003,
  PCB_ORDER_FAILED = 4004,
}

// ---------------------------------------------------------------------------
// Serialisable error model – this is what crosses the IPC boundary
// ---------------------------------------------------------------------------
export interface AppErrorModel {
  message: string;
  code: ErrorCode;
  category: ErrorCategory;
  path: string; // origin of the error (file path, component, url, etc.)
  timestamp: string;
  cause?: string;
}

// ---------------------------------------------------------------------------
// Base error class
// ---------------------------------------------------------------------------
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly category: ErrorCategory;
  readonly path: string;
  readonly timestamp: string;

  constructor(
    message: string,
    code: ErrorCode,
    category: ErrorCategory,
    path: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
    this.category = category;
    this.path = path;
    this.timestamp = new Date().toISOString();
  }

  toModel(): AppErrorModel {
    return {
      message: this.message,
      code: this.code,
      category: this.category,
      path: this.path,
      timestamp: this.timestamp,
      cause: this.cause instanceof Error ? this.cause.message : undefined,
    };
  }
}

// ---------------------------------------------------------------------------
// Domain-specific subclasses
// ---------------------------------------------------------------------------

export class FileSystemError extends AppError {
  constructor(
    message: string,
    code: ErrorCode,
    path: string,
    options?: { cause?: unknown },
  ) {
    super(message, code, ErrorCategory.FILE_SYSTEM, path, options);
    this.name = "FileSystemError";
  }

  /**
   * Build a FileSystemError from a raw caught error, mapping common Node
   * error codes to the appropriate ErrorCode automatically.
   */
  static from(error: unknown, path: string): FileSystemError {
    const raw = error as NodeJS.ErrnoException;
    const message = raw?.message ?? "Unknown file system error";

    let code: ErrorCode;
    switch (raw?.code) {
      case "ENOENT":
        code = ErrorCode.FS_NOT_FOUND;
        break;
      case "EACCES":
      case "EPERM":
        code = ErrorCode.FS_PERMISSION_DENIED;
        break;
      default:
        code = ErrorCode.FS_UNKNOWN;
    }

    return new FileSystemError(message, code, path, { cause: error });
  }
}

export class ClientError extends AppError {
  constructor(
    message: string,
    code: ErrorCode,
    path: string,
    options?: { cause?: unknown },
  ) {
    super(message, code, ErrorCategory.CLIENT, path, options);
    this.name = "ClientError";
  }
}

export class ClaudeApiError extends AppError {
  constructor(
    message: string,
    code: ErrorCode,
    path: string,
    options?: { cause?: unknown },
  ) {
    super(message, code, ErrorCategory.CLAUDE_API, path, options);
    this.name = "ClaudeApiError";
  }

  /**
   * Build a ClaudeApiError from a raw caught error, mapping Anthropic SDK
   * HTTP status codes to the appropriate ErrorCode automatically.
   */
  static from(error: unknown, path: string): ClaudeApiError {
    // Anthropic SDK errors expose a `status` property and nested error body
    const raw = error as {
      status?: number;
      message?: string;
      error?: { error?: { message?: string } };
    };
    // Prefer the nested human-readable message from the API response body
    const message =
      raw?.error?.error?.message ?? raw?.message ?? "Unknown Claude API error";

    let code: ErrorCode;
    switch (raw?.status) {
      case 401:
        code = ErrorCode.API_KEY_INVALID;
        break;
      case 429:
        code = ErrorCode.API_RATE_LIMITED;
        break;
      case 529:
        code = ErrorCode.API_OVERLOADED;
        break;
      default:
        code = ErrorCode.API_UNKNOWN;
    }

    return new ClaudeApiError(message, code, path, { cause: error });
  }
}

export class PcbApiError extends AppError {
  constructor(
    message: string,
    code: ErrorCode,
    path: string,
    options?: { cause?: unknown },
  ) {
    super(message, code, ErrorCategory.PCB_API, path, options);
    this.name = "PcbApiError";
  }

  static from(error: unknown, path: string): PcbApiError {
    const raw = error as { message?: string };
    const message = raw?.message ?? "Unknown PCB API error";
    return new PcbApiError(message, ErrorCode.PCB_UNKNOWN, path, {
      cause: error,
    });
  }
}
