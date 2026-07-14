import {
  LabelBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { FieldSpec } from "./templates.js";

/** One FieldSpec -> one LabelBuilder text-input or select-menu component. */
export function renderField(field: FieldSpec): LabelBuilder {
  const label = new LabelBuilder().setLabel(field.label);

  if (field.kind === "select") {
    return label.setStringSelectMenuComponent((select) =>
      select
        .setCustomId(field.id)
        .setRequired(field.required ?? false)
        .addOptions(
          field.options.map((o) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(o.label)
              .setValue(o.value),
          ),
        ),
    );
  }

  return label.setTextInputComponent((input) => {
    input
      .setCustomId(field.id)
      .setStyle(
        field.kind === "short"
          ? TextInputStyle.Short
          : TextInputStyle.Paragraph,
      )
      .setRequired(field.required ?? false);
    if (field.placeholder) input.setPlaceholder(field.placeholder);
    return input;
  });
}

/** Reads a submitted field's value back out. */
export function readField(
  interaction: ModalSubmitInteraction,
  field: FieldSpec,
): string {
  if (field.kind === "select") {
    return interaction.fields.getStringSelectValues(field.id)[0] ?? "";
  }
  return interaction.fields.getTextInputValue(field.id) || "";
}
