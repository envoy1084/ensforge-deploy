import { makeMutationAtom } from "./mutation.js";
import { makeQueryAtom } from "./query.js";

export const getWorkflowAtom = makeQueryAtom("workflows", (sdk) => sdk.workflows.getWorkflow);
export const createReconcileWorkflowSubmissionMutationAtom = makeMutationAtom(
  "workflows",
  (sdk) => sdk.workflows.reconcileWorkflowSubmission,
);

export const listWorkflowsAtom = makeQueryAtom("workflows", (sdk) => sdk.workflows.listWorkflows);
