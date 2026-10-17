import dialogueData from '../../../content/dialogue/world.v1.json';

type DialogueEntry = {
  speaker: string;
  lines?: string[];
  stages?: Array<{
    whenFlagMissing?: string;
    whenFlagPresent?: string;
    lines: string[];
    questEvent?: string;
    requiresStarterChoice?: boolean;
  }>;
  requiresStarterChoice?: boolean;
  requiresFlag?: string;
  beforeLines?: string[];
  afterLines?: string[];
};

export type Dialogue = { speaker: string; lines: string[]; requiresStarterChoice: boolean; questEvent?: string };

const dialogueCatalog = dialogueData as Record<string, DialogueEntry>;

export function getNpcDialogue(dialogueId: string, state: { starterSelected: boolean; flags: string[] }): Dialogue | undefined {
  const entry = dialogueCatalog[dialogueId];
  if (!entry) return undefined;
  if (entry.stages) {
    const stage = entry.stages.find(candidate =>
      (!candidate.whenFlagMissing || !state.flags.includes(candidate.whenFlagMissing)) &&
      (!candidate.whenFlagPresent || state.flags.includes(candidate.whenFlagPresent)),
    );
    return stage ? {
      speaker: entry.speaker,
      lines: stage.lines,
      requiresStarterChoice: Boolean(stage.requiresStarterChoice),
      questEvent: stage.questEvent,
    } : undefined;
  }
  const flagMet = entry.requiresFlag ? state.flags.includes(entry.requiresFlag) : false;
  const lines = entry.lines ?? (entry.requiresFlag
    ? (flagMet ? entry.afterLines : entry.beforeLines)
    : []) ?? [];
  return {
    speaker: entry.speaker,
    lines,
    requiresStarterChoice: Boolean(entry.requiresStarterChoice && !state.starterSelected),
  };
}
