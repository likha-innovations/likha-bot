import { LabelBuilder, TextInputStyle, ModalSubmitInteraction } from "discord.js";
import { FieldSpec } from "./templates.js";

/** One FieldSpec -> one LabelBuilder text-input component. */
export function renderField(field: FieldSpec): LabelBuilder {
  return new LabelBuilder()
    .setLabel(field.label)
    .setTextInputComponent((input) => {
      input
        .setCustomId(field.id)
        .setStyle(field.kind === "short" ? TextInputStyle.Short : TextInputStyle.Paragraph)
        .setRequired(field.required ?? false);
      if (field.placeholder) input.setPlaceholder(field.placeholder);
      return input;
    });
}

/** Reads a submitted field's value back out. */
export function readField(interaction: ModalSubmitInteraction, field: FieldSpec): string {
  return interaction.fields.getTextInputValue(field.id) || "";
}