import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "instance.sqlite");

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    try {
      migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    } catch (err) {
      sqlite.close();
      if (fs.existsSync(DB_PATH)) {
        for (const suffix of ["", "-wal", "-shm"]) {
          try {
            fs.unlinkSync(DB_PATH + suffix);
          } catch {
            /* ignore */
          }
        }
      }
      throw err;
    }
    dbInstance = db;
  }
  return dbInstance;
}

export function checkDb(): boolean {
  try {
    getDb().$client.prepare("SELECT 1").get();
    return true;
  } catch {
    return false;
  }
}

export { schema };
