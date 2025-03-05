/**
 * Creates a text-based progress steps indicator
 * @param step Current step (1-3)
 * @returns String representing the progress steps with emoji
 */
export function createProgressSteps(step: number, suffix: string = ""): string {
  const steps = ["⚪️", "⚪️", "⚪️"];
  const emoji = "⚙️";

  // Fill in completed steps with coin emoji
  for (let i = 0; i < Math.min(step, 3); i++) {
    steps[i] = "🪙";
  }

  return `${emoji} [${steps.join("")}] ${suffix}`;
}
