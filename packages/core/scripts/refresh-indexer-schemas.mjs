import { createHash } from "node:crypto";
import { resolve } from "node:path";

import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { Data, DateTime, Effect, FileSystem, Layer, Predicate, Schedule } from "effect";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientRequest from "effect/http/HttpClientRequest";

import {
  buildClientSchema,
  getIntrospectionQuery,
  lexicographicSortSchema,
  printSchema,
} from "graphql";
import { format } from "oxfmt";

const root = resolve(import.meta.dirname, "..");

const sources = {
  v1: [
    {
      network: "mainnet",
      url: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
    },
    {
      network: "sepolia",
      url: "https://api.studio.thegraph.com/query/49574/enssepolia/version/latest",
    },
  ],
  v2: [{ network: "sepolia", url: "https://staging-graphql.ens.dev/graphql" }],
};

class SchemaRefreshError extends Data.TaggedError("SchemaRefreshError") {}

const formatSchema = Effect.fn("formatSchema")(function* (schema) {
  const result = yield* Effect.tryPromise({
    try: () => format(resolve(root, "graphql/indexer/schema.graphql"), schema),
    catch: (cause) =>
      new SchemaRefreshError({
        message: "Schema formatting failed",
        retryable: false,
        cause,
      }),
  });

  if (result.errors.length > 0) {
    return yield* new SchemaRefreshError({
      message: "Schema formatting returned errors",
      retryable: false,
      cause: result.errors,
    });
  }

  return result.code;
});

const requestSchema = Effect.fn("requestSchema")(function* ({ url }) {
  const client = yield* HttpClient.HttpClient;

  const request = yield* HttpClientRequest.post(url).pipe(
    HttpClientRequest.bodyJson({
      operationName: "IntrospectionQuery",
      query: getIntrospectionQuery({ descriptions: true }),
    }),
  );

  const response = yield* client.execute(request).pipe(
    Effect.mapError(
      (cause) =>
        new SchemaRefreshError({
          message: "Schema introspection request failed",
          retryable: true,
          cause,
        }),
    ),
  );

  const body = yield* response.json.pipe(
    Effect.mapError(
      (cause) =>
        new SchemaRefreshError({
          message: "Schema introspection returned invalid JSON",
          retryable: response.status === 429 || response.status >= 500,
          status: response.status,
          cause,
        }),
    ),
  );

  if (
    response.status >= 200 &&
    response.status < 300 &&
    Predicate.isObject(body) &&
    "data" in body
  ) {
    const schema = yield* Effect.try({
      try: () => `${printSchema(lexicographicSortSchema(buildClientSchema(body.data)))}\n`,
      catch: (cause) =>
        new SchemaRefreshError({
          message: "Schema introspection returned invalid data",
          retryable: false,
          cause,
        }),
    });

    return yield* formatSchema(schema);
  }

  return yield* new SchemaRefreshError({
    message: `Schema introspection failed with HTTP ${response.status}`,
    retryable: response.status === 429 || response.status >= 500,
    status: response.status,
  });
});

const introspect = Effect.fn("introspect")(function* (source) {
  return yield* requestSchema(source).pipe(
    Effect.retry({
      times: 3,
      schedule: Schedule.exponential("500 millis"),
      while: (error) => error.retryable,
    }),
  );
});

const fingerprint = (schema) => createHash("sha256").update(schema).digest("hex");

const writeSchema = Effect.fn("writeSchema")(function* (protocol, schema, protocolSources) {
  const fileSystem = yield* FileSystem.FileSystem;
  const directory = resolve(root, "graphql/indexer", protocol);
  const retrievedAt = DateTime.formatIso(yield* DateTime.now);

  yield* fileSystem.makeDirectory(directory, { recursive: true });
  yield* Effect.all(
    [
      fileSystem.writeFileString(resolve(directory, "schema.graphql"), schema),
      fileSystem.writeFileString(
        resolve(directory, "schema.metadata.json"),
        `${JSON.stringify(
          {
            protocol,
            retrievedAt,
            sha256: fingerprint(schema),
            sources: protocolSources,
          },
          null,
          2,
        )}\n`,
      ),
    ],
    { concurrency: "unbounded" },
  );
});

const program = Effect.gen(function* () {
  const protocols = process.argv.slice(2);

  if (protocols.some((protocol) => protocol !== "v1" && protocol !== "v2")) {
    return yield* new SchemaRefreshError({
      message: "Expected optional protocol arguments: v1 v2",
      retryable: false,
    });
  }

  for (const protocol of new Set(protocols.length === 0 ? ["v1", "v2"] : protocols)) {
    const protocolSources = sources[protocol];
    const schemas = yield* Effect.all(protocolSources.map(introspect), {
      concurrency: "unbounded",
    });
    const fingerprints = schemas.map(fingerprint);

    if (new Set(fingerprints).size !== 1) {
      return yield* new SchemaRefreshError({
        message: `ENS${protocol} schemas differ between networks: ${fingerprints.join(", ")}`,
        retryable: false,
      });
    }

    yield* writeSchema(protocol, schemas[0], protocolSources);
  }
});

const nodeLayer = Layer.merge(NodeServices.layer, NodeHttpClient.layerUndici);

NodeRuntime.runMain(program.pipe(Effect.provide(nodeLayer)));
