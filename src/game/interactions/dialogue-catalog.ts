import dialogueData from '../../../content/dialogue/world.v1.json';

type DialogueEntry = {
  speaker: string;
  lines?: string[];
  beforeStarter?: string[];
  afterStarter?: string[];
  requiresStarterChoice?: boolean;
};

export type Dialogue = { speaker: string; lines: string[]; requiresStarterChoice: boolean };

const dialogueCatalog = dialogueData as Record<string, DialogueEntry>;

export function getNpcDialogue(dialogueId: string, starterSelected: boolean): Dialogue | undefined {
  const entry = dialogueCatalog[dialogueId];
  if (!entry) return undefined;
  const lines = entry.lines ?? (starterSelected ? entry.afterStarter : entry.beforeStarter) ?? [];
  return {
    speaker: entry.speaker,
    lines,
    requiresStarterChoice: Boolean(entry.requiresStarterChoice && !starterSelected),
  };
}
