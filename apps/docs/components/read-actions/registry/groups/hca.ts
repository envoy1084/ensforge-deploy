import { defineForm } from "../../../form/define-form";
import { addressField, bigintField } from "../../../form/fields/factories";
import { defineReadAction } from "../types";

// Set this after deploying a fixture with the current Sepolia factory.
const exampleHca = import.meta.env.VITE_SEPOLIA_HCA_ADDRESS ?? "";
const exampleOwner = "0x5b7d523F27C5b2232536fB900EBffB590d03fF5d";

const hcaForm = () =>
  defineForm({
    fields: {
      hca: addressField({
        label: "HCA address",
        initialValue: exampleHca,
        placeholder: "0x…",
        description: "Use an HCA deployed with the current Sepolia factory.",
      }),
    },
  });

export const definitions = {
  "hca.getHca": defineReadAction({
    createForm: hcaForm,
    execute: ({ sdk, values }) => sdk.hca.getHca({ hca: values.hca }),
    id: "hca.getHca",
    label: "getHca",
  }),
  "hca.getHcaOwner": defineReadAction({
    createForm: hcaForm,
    execute: ({ sdk, values }) => sdk.hca.getHcaOwner({ hca: values.hca }),
    id: "hca.getHcaOwner",
    label: "getHcaOwner",
  }),
  "hca.getHcaImplementation": defineReadAction({
    createForm: hcaForm,
    execute: ({ sdk, values }) => sdk.hca.getHcaImplementation({ hca: values.hca }),
    id: "hca.getHcaImplementation",
    label: "getHcaImplementation",
  }),
  "hca.getHcaAccountId": defineReadAction({
    createForm: hcaForm,
    execute: ({ sdk, values }) => sdk.hca.getHcaAccountId({ hca: values.hca }),
    id: "hca.getHcaAccountId",
    label: "getHcaAccountId",
  }),
  "hca.getHcaSessionNonce": defineReadAction({
    createForm: hcaForm,
    execute: ({ sdk, values }) => sdk.hca.getHcaSessionNonce({ hca: values.hca }),
    id: "hca.getHcaSessionNonce",
    label: "getHcaSessionNonce",
  }),
  "hca.getHcaEntryPoint": defineReadAction({
    createForm: hcaForm,
    execute: ({ sdk, values }) => sdk.hca.getHcaEntryPoint({ hca: values.hca }),
    id: "hca.getHcaEntryPoint",
    label: "getHcaEntryPoint",
  }),
  "hca.getHcaDeposit": defineReadAction({
    createForm: hcaForm,
    execute: ({ sdk, values }) => sdk.hca.getHcaDeposit({ hca: values.hca }),
    id: "hca.getHcaDeposit",
    label: "getHcaDeposit",
  }),
  "hca.getHcaSigningDomain": defineReadAction({
    createForm: hcaForm,
    execute: ({ sdk, values }) => sdk.hca.getHcaSigningDomain({ hca: values.hca }),
    id: "hca.getHcaSigningDomain",
    label: "getHcaSigningDomain",
  }),
  "hca.getHcaHook": defineReadAction({
    createForm: hcaForm,
    execute: ({ sdk, values }) => sdk.hca.getHcaHook({ hca: values.hca }),
    id: "hca.getHcaHook",
    label: "getHcaHook",
  }),
  "hca.getHcaRegistry": defineReadAction({
    createForm: hcaForm,
    execute: ({ sdk, values }) => sdk.hca.getHcaRegistry({ hca: values.hca }),
    id: "hca.getHcaRegistry",
    label: "getHcaRegistry",
  }),
  "hca.predictHcaAddress": defineReadAction({
    createForm: () =>
      defineForm({
        fields: {
          owner: addressField({
            label: "Owner address",
            initialValue: exampleOwner,
            placeholder: exampleOwner,
          }),
          salt: bigintField({
            label: "Salt",
            initialValue: 9112026n,
            minimum: 0n,
            placeholder: "9112026",
          }),
        },
      }),
    execute: ({ sdk, values }) =>
      sdk.hca.predictHcaAddress({ owner: values.owner, salt: values.salt }),
    id: "hca.predictHcaAddress",
    label: "predictHcaAddress",
  }),
} as const;
