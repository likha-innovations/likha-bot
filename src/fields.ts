import {
  LabelBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ModalSubmitInteraction,
} from "discord.js";
import { FieldSpec, HOUR_PERIOD_OPTIONS, MINUTE_OPTIONS, MONTHS, yearOptions } from "./templates.js";

// Sub-ids used for the two/three components that make up a date/time field.
const sub = (id: string, part: string) => `${id}__${part}`;

/** One FieldSpec -> one or more LabelBuilder components (a "date" field is 3, "time" is 2, everything else is 1). */
export function renderField(field: FieldSpec): LabelBuilder[] {
  switch (field.kind) {
    case "short":
    case "paragraph": {
      const label = new LabelBuilder()
        .setLabel(field.label)
        .setTextInputComponent((input) => {
          input
            .setCustomId(field.id)
            .setStyle(field.kind === "short" ? TextInputStyle.Short : TextInputStyle.Paragraph)
            .setRequired(field.required ?? false);
          if (field.placeholder) input.setPlaceholder(field.placeholder);
          return input;
        });
      return [label];
    }

    case "date": {
      const monthLabel = new LabelBuilder()
        .setLabel(`${field.label} — Month`)
        .setStringSelectMenuComponent((select: StringSelectMenuBuilder) =>
          select
            .setCustomId(sub(field.id, "month"))
            .setRequired(field.required ?? true)
            .addOptions(MONTHS.map((m, i) => ({ label: m, value: String(i + 1).padStart(2, "0") })))
        );

      const yearLabel = new LabelBuilder()
        .setLabel(`${field.label} — Year`)
        .setStringSelectMenuComponent((select: StringSelectMenuBuilder) =>
          select
            .setCustomId(sub(field.id, "year"))
            .setRequired(field.required ?? true)
            .addOptions(yearOptions().map((y) => ({ label: y, value: y })))
        );

      const dayLabel = new LabelBuilder()
        .setLabel(`${field.label} — Day (1-31)`)
        .setTextInputComponent((input) =>
          input
            .setCustomId(sub(field.id, "day"))
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. 13")
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(field.required ?? true)
        );

      return [monthLabel, yearLabel, dayLabel];
    }

    case "time": {
      const hourLabel = new LabelBuilder()
        .setLabel(`${field.label} — Hour`)
        .setStringSelectMenuComponent((select: StringSelectMenuBuilder) =>
          select
            .setCustomId(sub(field.id, "hour"))
            .setRequired(field.required ?? true)
            .addOptions(HOUR_PERIOD_OPTIONS.map((h) => ({ label: h, value: h })))
        );

      const minuteLabel = new LabelBuilder()
        .setLabel(`${field.label} — Minute`)
        .setStringSelectMenuComponent((select: StringSelectMenuBuilder) =>
          select
            .setCustomId(sub(field.id, "minute"))
            .setRequired(field.required ?? true)
            .addOptions(MINUTE_OPTIONS.map((m) => ({ label: m, value: m })))
        );

      return [hourLabel, minuteLabel];
    }
  }
}

/** Reads a submitted step's values back out and combines date/time sub-parts into single display strings. */
export function readField(interaction: ModalSubmitInteraction, field: FieldSpec): string {
  switch (field.kind) {
    case "short":
    case "paragraph":
      return interaction.fields.getTextInputValue(field.id) || "";

    case "date": {
      const [month] = interaction.fields.getStringSelectValues(sub(field.id, "month"));
      const [year] = interaction.fields.getStringSelectValues(sub(field.id, "year"));
      const day = interaction.fields.getTextInputValue(sub(field.id, "day")).padStart(2, "0");
      return `${month}/${day}/${year}`;
    }

    case "time": {
      const [hourPeriod] = interaction.fields.getStringSelectValues(sub(field.id, "hour"));
      const [minute] = interaction.fields.getStringSelectValues(sub(field.id, "minute"));
      const [hour, period] = hourPeriod.split(" ");
      return `${hour}:${minute} ${period}`;
    }
  }
}
