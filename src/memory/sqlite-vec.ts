import type { DatabaseSync } from "node:sqlite";

export async function loadSqliteVecExtension(params: {
  db: DatabaseSync;
  extensionPath?: string;
}): Promise<{ ok: boolean; extensionPath?: string; error?: string }> {
  try {
    console.log("[SQLITE-VEC] Importing sqlite-vec...");
    const sqliteVec = await import("sqlite-vec");
    console.log("[SQLITE-VEC] Imported. resolving path...");
    const resolvedPath = params.extensionPath?.trim() ? params.extensionPath.trim() : undefined;
    const extensionPath = resolvedPath ?? sqliteVec.getLoadablePath();
    console.log(`[SQLITE-VEC] Path: ${extensionPath}`);

    // Check availability of methods
    if (typeof (params.db as any).enableLoadExtension === "function") {
      console.log("[SQLITE-VEC] Enabling load extension...");
      (params.db as any).enableLoadExtension(true);
    } else {
      console.log("[SQLITE-VEC] db.enableLoadExtension not present");
    }

    if (resolvedPath) {
      console.log(`[SQLITE-VEC] Loading extension from resolved path: ${resolvedPath}`);
      (params.db as any).loadExtension(extensionPath);
    } else {
      console.log("[SQLITE-VEC] ensure params.db.loadExtension exists...");
      if (typeof (params.db as any).loadExtension === "function") {
        console.log("[SQLITE-VEC] Loading via db.loadExtension...");
        (params.db as any).loadExtension(extensionPath);
      } else {
        console.log("[SQLITE-VEC] db.loadExtension not present. Trying sqliteVec.load...");
        sqliteVec.load(params.db);
      }
    }
    console.log("[SQLITE-VEC] Success.");

    return { ok: true, extensionPath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[SQLITE-VEC] Error:", message);
    return { ok: false, error: message };
  }
}
