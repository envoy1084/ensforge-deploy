import { Ensforge } from "@ensforge/sdk";

import { sdk as client } from "./client";
import { createSqliteStorage } from "./sqlite-storage";

export const database = createSqliteStorage(".ensforge-workflows");
export const sdk = new Ensforge({ ...client.config, storage: database.storage });
