import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { WorkflowStorage, WorkflowStoredRecord } from "@ensforge/core/storage";

/** Server example: one SQLite transaction per atomic statement, with opaque SDK payloads. */
export const createSqliteStorage = (directory: string) => {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(join(directory, "workflows.sqlite"));
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS workflows (
      namespace TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL, value TEXT NOT NULL,
      PRIMARY KEY(namespace, id)
    );
  `);

  const storage: WorkflowStorage = {
    kind: "workflow-storage",
    async create({ namespace, record }) {
      if (record.revision !== 0) throw new Error("New records require revision zero");
      return (
        database
          .prepare("INSERT OR IGNORE INTO workflows VALUES (?, ?, ?, ?)")
          .run(namespace, record.id, record.revision, record.value).changes === 1
      );
    },
    async get({ namespace, id }) {
      return (
        (database
          .prepare("SELECT id, revision, value FROM workflows WHERE namespace = ? AND id = ?")
          .get(namespace, id) as WorkflowStoredRecord | undefined) ?? null
      );
    },
    async compareAndSwap({ namespace, id, expectedRevision, record }) {
      if (id !== record.id || record.revision !== expectedRevision + 1)
        throw new Error("Invalid revision transition");
      return (
        database
          .prepare(
            "UPDATE workflows SET revision = ?, value = ? WHERE namespace = ? AND id = ? AND revision = ?",
          )
          .run(record.revision, record.value, namespace, id, expectedRevision).changes === 1
      );
    },
    async list({ namespace, after = "", limit }) {
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
        throw new Error("Invalid page size");
      return database
        .prepare(
          "SELECT id, revision, value FROM workflows WHERE namespace = ? AND id > ? ORDER BY id LIMIT ?",
        )
        .all(namespace, after, limit) as unknown as WorkflowStoredRecord[];
    },
  };

  return { storage, close: () => database.close() };
};
