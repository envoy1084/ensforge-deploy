"use client";

import { useMemo } from "react";

import type { EnsAction } from "@ensforge/sdk";

import { makeMutationAtom } from "../atoms/mutation.js";
import { makeQueryAtom } from "../atoms/query.js";
import {
  getWorkflowAtom,
  listWorkflowsAtom,
  createReconcileWorkflowSubmissionMutationAtom,
} from "../atoms/workflows.js";
import type { EnsMutationOptions } from "../mutation/options.js";
import type { UseEnsAtomParameters } from "../query/options.js";
import { makeMutationHook, useMutationAtom } from "./use-mutation.js";
import { makeQueryHook, useQueryAtom } from "./use-query.js";

export const useWorkflows = makeQueryHook(listWorkflowsAtom);
export const useWorkflow = makeQueryHook(getWorkflowAtom);
export const useReconcileWorkflowSubmission = makeMutationHook(
  createReconcileWorkflowSubmissionMutationAtom,
);

/** Bind provider extensions, such as Rhinestone funding, to the existing Ensforge config. */
export const useEnsMutation = <Parameters, Success, Failure>(
  action: EnsAction<Parameters, Success, Failure>,
  options?: EnsMutationOptions<Parameters, Success, Failure>,
) => {
  const factory = useMemo(
    () =>
      makeMutationAtom("extensions", (sdk) => ({
        effect: (parameters: Parameters) => action.effect(sdk.config, parameters),
      })),
    [action],
  );
  return useMutationAtom(factory, options);
};

export const useEnsQuery = <Parameters extends object, Success, Failure, Selected = Success>(
  action: EnsAction<Parameters, Success, Failure>,
  input: UseEnsAtomParameters<Parameters, Success, Failure, Selected>,
) => {
  const factory = useMemo(
    () =>
      makeQueryAtom("extensions", (sdk) => ({
        effect: (parameters: Parameters) => action.effect(sdk.config, parameters),
      })),
    [action],
  );
  return useQueryAtom(factory, input);
};
