"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Segment } from "@thenamespace/uikit/segment";

import { ClientOnly } from "../client-only.client";
import { ResultCodeBlock } from "../code/result-code-block";
import { FormRenderer } from "../form/form-renderer";
import type { Network } from "../runtime/network";
import { errorCategory, safeUrl } from "../runtime/page-context";
import { getSdk } from "../runtime/sdk";
import { track } from "../runtime/site-observers";
import { WalletProviders } from "../wallet-connect/providers.client";
import { WalletConnectButton } from "../wallet-connect/wallet-connect-button.client";
import { loadReadAction } from "./registry/manifest";
import type { AnyReadActionDefinition } from "./registry/types";

export interface ReadActionDemoProps {
  readonly action: string;
}

const stringifyResult = (result: unknown): string => {
  if (result === undefined) return "undefined";
  return JSON.stringify(
    result,
    (_, value: unknown) => (typeof value === "bigint" ? `${value}n` : value),
    2,
  );
};

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return String(error);
};

const initialNetwork = (): Network => {
  const stored = globalThis.localStorage?.getItem("ensforge-demo-network");
  return stored === "sepolia" ? "sepolia" : "mainnet";
};

function ReadActionDemoContent({ action }: ReadActionDemoProps) {
  const [definition, setDefinition] = useState<AnyReadActionDefinition>();
  const [loadError, setLoadError] = useState<string>();
  const [network, setNetwork] = useState<Network>(() =>
    action.startsWith("hca.") ? "sepolia" : initialNetwork(),
  );
  const [result, setResult] = useState<{ readonly json: string; readonly value: unknown }>();
  const [error, setError] = useState<string>();
  const [isRunning, setIsRunning] = useState(false);
  const execution = useRef(0);

  useEffect(() => {
    let current = true;
    execution.current += 1;
    setDefinition(undefined);
    setLoadError(undefined);
    setResult(undefined);
    setError(undefined);
    setIsRunning(false);
    void loadReadAction(action).then(
      (loaded) => {
        if (current) setDefinition(loaded);
        return undefined;
      },
      (cause) => {
        if (current) setLoadError(errorMessage(cause));
        return undefined;
      },
    );
    return () => {
      current = false;
    };
  }, [action]);

  const form = useMemo(() => definition?.createForm(network), [definition, network]);
  const imageSource =
    result && definition?.presentation?.kind === "image"
      ? definition.presentation.source(result.value)
      : undefined;

  const selectNetwork = (nextNetwork: Network) => {
    if (nextNetwork !== network)
      track("docs_playground_network_changed", {
        action,
        network: nextNetwork,
        previous_network: network,
      });
    execution.current += 1;
    setNetwork(nextNetwork);
    globalThis.localStorage?.setItem("ensforge-demo-network", nextNetwork);
    setResult(undefined);
    setError(undefined);
    setIsRunning(false);
  };

  const run = async (values: Readonly<Record<string, unknown>>) => {
    if (!definition) return;
    const currentExecution = execution.current + 1;
    execution.current = currentExecution;
    setError(undefined);
    setIsRunning(true);
    const startedAt = performance.now();
    const runId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const analytics = {
      action,
      network,
      run_id: runId,
      $current_url: safeUrl(window.location.href),
    };
    track("docs_playground_started", analytics);

    try {
      const sdk = await getSdk(network);
      const nextResult = await definition.execute({ sdk, values });
      if (execution.current === currentExecution) {
        setResult({ json: stringifyResult(nextResult), value: nextResult });
      }
      track("docs_playground_completed", {
        ...analytics,
        duration_ms: Math.round(performance.now() - startedAt),
      });
    } catch (cause) {
      track("docs_playground_failed", {
        ...analytics,
        duration_ms: Math.round(performance.now() - startedAt),
        error_category: errorCategory(cause),
      });
      if (execution.current === currentExecution) {
        setResult(undefined);
        setError(errorMessage(cause));
      }
    } finally {
      if (execution.current === currentExecution) setIsRunning(false);
    }
  };

  return (
    <section className="ensforge-demo my-8 rounded-[10px] border border-[var(--vocs-border-color-primary)] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-[var(--vocs-text-color-secondary)]">Network</span>
        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
          {action.startsWith("hca.") ? (
            <span className="text-sm">Sepolia</span>
          ) : (
            <Segment
              aria-label="Network"
              className="ensforge-network-segment shrink-0"
              selectedKey={network}
              size="sm"
              onSelectionChange={(key) => selectNetwork(String(key) as Network)}
            >
              <Segment.Item id="mainnet">Mainnet</Segment.Item>
              <Segment.Item id="sepolia">Sepolia</Segment.Item>
            </Segment>
          )}
          <WalletProviders>
            <WalletConnectButton />
          </WalletProviders>
        </div>
      </div>

      {form ? (
        <FormRenderer
          definition={form}
          isSubmitting={isRunning}
          key={`${action}:${network}`}
          onSubmit={run}
        />
      ) : loadError ? (
        <p className="m-0 text-sm text-[var(--vocs-color-red)]">{loadError}</p>
      ) : (
        <p className="m-0 text-sm text-[var(--vocs-text-color-secondary)]">Loading example…</p>
      )}

      {error || result ? (
        <div aria-live="polite" className="mt-4">
          {error ? (
            <p className="m-0 break-words font-mono text-xs leading-6 text-[var(--vocs-color-red)]">
              {error}
            </p>
          ) : null}
          {imageSource ? (
            <img
              alt="Resolved ENS avatar"
              className="mb-4 aspect-square w-full max-w-64 rounded-lg border border-[var(--vocs-border-color-primary)] object-cover"
              src={imageSource}
            />
          ) : null}
          {result ? <ResultCodeBlock code={result.json} /> : null}
        </div>
      ) : null}
    </section>
  );
}

export function ReadActionDemo(props: ReadActionDemoProps) {
  return (
    <ClientOnly>
      <ReadActionDemoContent key={props.action} {...props} />
    </ClientOnly>
  );
}
