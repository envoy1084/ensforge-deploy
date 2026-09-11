import { defineForm } from "../../../form/define-form";
import { addressField } from "../../../form/fields/factories";
import { defineReadAction } from "../types";

const hcaForm = () => defineForm({ fields: { hca: addressField({ label: "HCA address" }) } });

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
    createForm: () => defineForm({ fields: { owner: addressField({ label: "Owner address" }) } }),
    execute: ({ sdk, values }) => sdk.hca.predictHcaAddress({ owner: values.owner }),
    id: "hca.predictHcaAddress",
    label: "predictHcaAddress",
  }),
} as const;
