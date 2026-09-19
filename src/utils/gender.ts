/** Gender values and labels: a person's gender (male/female) and a team's (male/female/mixed). */

export type Gender = "male" | "female";
export type TeamGender = Gender | "mixed";

export interface GenderOption<Value extends string> {
  value: Value;
  label: string;
}

export const GENDER_OPTIONS: ReadonlyArray<GenderOption<Gender>> = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const TEAM_GENDER_OPTIONS: ReadonlyArray<GenderOption<TeamGender>> = [
  ...GENDER_OPTIONS,
  { value: "mixed", label: "Mixed" },
];

const GENDER_LABELS: Record<string, string> = Object.fromEntries(
  TEAM_GENDER_OPTIONS.map((option) => [option.value, option.label]),
);

/** Shown where an older account or team has no gender recorded yet. */
const NOT_SET_LABEL = "—";

/**
 * A gender value as text for tables and profiles.
 *
 * @param value - "male", "female", "mixed", or "" when none was ever recorded.
 * @returns "Male", "Female", "Mixed", or a dash when unset.
 */
export function formatGender(value: string): string {
  return GENDER_LABELS[value] ?? NOT_SET_LABEL;
}
