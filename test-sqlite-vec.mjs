import { DatabaseSync } from "node:sqlite";
import * as sqliteVec from "sqlite-vec";
import { statSync } from "node:fs";

console.log("Node version:", process.version);
console.log("Arch:", process.arch);
console.log("Platform:", process.platform);

try {
    console.log("Checking sqlite-vec path...");
    const path = sqliteVec.getLoadablePath();
    console.log("Loadable path:", path);

    try {
        statSync(path);
        console.log("File exists at path.");
    } catch (e) {
        console.error("File DOES NOT exist at path:", e.message);
    }

    const db = new DatabaseSync(":memory:");
    console.log("DB created");

    if (typeof db.enableLoadExtension === 'function') {
        console.log("Calling enableLoadExtension(true)...");
        db.enableLoadExtension(true);
    } else {
        console.log("enableLoadExtension is NOT a function on DatabaseSync");
    }

    console.log("Attempting to load extension...");
    db.loadExtension(path);
    console.log("Extension loaded successfully!");

    const stmt = db.prepare("select vec_version() as v");
    const result = stmt.get();
    console.log("vec_version result:", result);

} catch (err) {
    console.error("Caught error:", err);
}
