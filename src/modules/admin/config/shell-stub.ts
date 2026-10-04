import { mockFeatureLabels } from "./data-source";

// TEMPORARY. The signed-in user and the Dashboard / System data are real. These are the shell sources that are
// still stand-ins (M5 removes both); the MockDataChip lists them, plus any feature the data-source flags
// (config/data-source.ts) switch to mock data, so nothing here can be mistaken for real data.
const SHELL_STUBS = ["Notifications", "Search"];

export function getActiveMockSources(): string[] {
  return [...SHELL_STUBS, ...mockFeatureLabels()];
}
