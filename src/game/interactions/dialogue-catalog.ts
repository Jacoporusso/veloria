import dialogueData from '../../../content/dialogue/world.v1.json' with { type: 'json' };

export interface DialogueChoice {
  id: string;
  label: string;
  lines: string[];
  questEvent?: string;
  requiresFlags?: readonly string[];
  unlessFlag?: string;
}

interface DialogueStage {
  whenFlagMissing?: string;
  whenFlagPresent?: string;
  lines: string[];
  questEvent?: string;
  requiresStarterChoice?: boolean;
  choices?: DialogueChoice[];
  choicePrompt?: string;
}

export interface DialogueEntry {
  speaker: string;
  lines?: string[];
  stages?: DialogueStage[];
  choices?: DialogueChoice[];
  choicePrompt?: string;
  requiresStarterChoice?: boolean;
  requiresFlag?: string;
  beforeLines?: string[];
  afterLines?: string[];
}

export type Dialogue = {
  speaker: string;
  lines: string[];
  requiresStarterChoice: boolean;
  questEvent?: string;
  choices?: readonly DialogueChoice[];
  choicePrompt?: string;
};
type DialogueState = { starterSelected: boolean; flags: readonly string[] };
const dialogueCatalog = dialogueData as Record<string, DialogueEntry>;

/** Select authored narrative and choices without applying events or changing progress. */
export function selectDialogueEntry(entry: DialogueEntry, state: DialogueState): Dialogue | undefined {
  const stage = entry.stages?.find(candidate =>
    (!candidate.whenFlagMissing || !state.flags.includes(candidate.whenFlagMissing)) &&
    (!candidate.whenFlagPresent || state.flags.includes(candidate.whenFlagPresent)),
  );
  if (entry.stages && !stage) return undefined;
  const selected = stage ?? entry;
  const flagMet = entry.requiresFlag ? state.flags.includes(entry.requiresFlag) : false;
  const lines = selected.lines ?? (entry.requiresFlag ? (flagMet ? entry.afterLines : entry.beforeLines) : []) ?? [];
  return {
    speaker: entry.speaker,
    lines,
    requiresStarterChoice: Boolean(selected.requiresStarterChoice && (!stage ? !state.starterSelected : true)),
    ...(stage ? { questEvent: stage.questEvent } : {}),
    ...(selected.choices ? {
      choices: selected.choices.filter(choice => (choice.requiresFlags ?? []).every(flag => state.flags.includes(flag)) &&
        (!choice.unlessFlag || !state.flags.includes(choice.unlessFlag))),
      choicePrompt: selected.choicePrompt,
    } : {}),
  };
}

export function getNpcDialogue(dialogueId: string, state: DialogueState): Dialogue | undefined {
  const entry = dialogueCatalog[dialogueId];
  return entry ? selectDialogueEntry(entry, state) : undefined;
}
