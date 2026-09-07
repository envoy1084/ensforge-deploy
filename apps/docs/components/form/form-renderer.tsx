import { type FormEvent } from "react";

import { Button } from "@thenamespace/uikit/button";
import { Form } from "@thenamespace/uikit/form";

import { RenderField } from "./fields/render-field";
import { decodeForm } from "./state/decode-form";
import { useForm } from "./state/use-form";
import type { DecodedFields, FieldDefinition, FieldMap, FormDefinition } from "./types";

export interface FormRendererProps<Fields extends FieldMap> {
  readonly definition: FormDefinition<Fields>;
  readonly isSubmitting: boolean;
  readonly onSubmit: (value: DecodedFields<Fields>) => void | Promise<void>;
}

export const FormRenderer = <Fields extends FieldMap>({
  definition,
  isSubmitting,
  onSubmit,
}: FormRendererProps<Fields>) => {
  const form = useForm(definition.fields);
  const groups: Array<Array<[string, FieldDefinition]>> = [];
  for (const entry of Object.entries(definition.fields)) {
    const previous = groups.at(-1);
    if (entry[1].control === "toggle" && previous?.[0]?.[1].control === "toggle") {
      previous.push(entry);
    } else {
      groups.push([entry]);
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const decoded = decodeForm(definition.fields, form.drafts);
    if (!decoded.success) {
      form.setErrors(decoded.errors);
      return;
    }
    void onSubmit(decoded.value);
  };

  return (
    <Form className="grid gap-4" onSubmit={submit}>
      {groups.map((group) => {
        const fields = group.map(([key, field]) => (
          <RenderField
            draft={form.drafts[key] ?? field.codec.initialValue}
            field={field}
            fieldKey={key}
            key={key}
            onChange={(value) => form.setDraft(key, value)}
            {...(form.errors[key] ? { error: form.errors[key] } : {})}
          />
        ));
        return group[0]?.[1].control === "toggle" ? (
          <div className="ensforge-toggle-group" key={group[0][0]}>
            {fields}
          </div>
        ) : (
          fields
        );
      })}

      <Button fullWidth isDisabled={isSubmitting} type="submit" variant="primary">
        {isSubmitting ? "Reading…" : "Run"}
      </Button>
    </Form>
  );
};
