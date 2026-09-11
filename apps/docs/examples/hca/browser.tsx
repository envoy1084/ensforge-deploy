"use client";

import { useState } from "react";

import { Exit } from "effect";

import type { StartHcaRegistrationParameters } from "@ensforge/core/hca";
import {
  EnsforgeProvider,
  useStartHcaRegistration,
  useResumeHcaRegistration,
  useCancelHcaRegistration,
} from "@ensforge/react";
import type { CreateConfigParameters } from "@ensforge/sdk";

function Registration({ input }: { readonly input: StartHcaRegistrationParameters }) {
  const start = useStartHcaRegistration();
  const resume = useResumeHcaRegistration();
  const cancel = useCancelHcaRegistration();
  const [id, setId] = useState<string>();
  const [status, setStatus] = useState("ready");
  const busy = start.isWaiting || resume.isWaiting || cancel.isWaiting;
  const error = start.error ?? resume.error ?? cancel.error;

  return (
    <section aria-label="HCA registration">
      <p aria-live="polite">{status}</p>
      {error && <p role="alert">{error.message}</p>}
      <button
        disabled={busy || status === "registered"}
        onClick={() =>
          start.mutate(input, {
            onExit: (exit) => {
              if (Exit.isSuccess(exit)) {
                setId(exit.value.id);
                setStatus(exit.value.progress.status);
              }
            },
          })
        }
      >
        Start or recover registration
      </button>
      <button
        disabled={busy || !id || status === "registered"}
        onClick={() => {
          if (id)
            resume.mutate(
              { id, ...(input.execution ? { execution: input.execution } : {}) },
              {
                onExit: (exit) => {
                  if (Exit.isSuccess(exit)) setStatus(exit.value.progress.status);
                },
              },
            );
        }}
      >
        Continue saved registration
      </button>
      <button
        disabled={busy || !id || status === "registered"}
        onClick={() => {
          if (id)
            cancel.mutate(
              { id, ...(input.execution ? { execution: input.execution } : {}) },
              {
                onExit: (exit) => {
                  if (Exit.isSuccess(exit)) setStatus(exit.value.progress.status);
                },
              },
            );
        }}
      >
        Cancel local registration
      </button>
      {busy && (
        <button
          onClick={() => {
            start.interrupt();
            resume.interrupt();
            cancel.interrupt();
          }}
        >
          Stop waiting
        </button>
      )}
    </section>
  );
}

export function HcaRegistrationExample({
  config,
  input,
}: {
  readonly config: CreateConfigParameters;
  readonly input: StartHcaRegistrationParameters;
}) {
  return (
    <EnsforgeProvider config={config}>
      <Registration input={input} />
    </EnsforgeProvider>
  );
}
