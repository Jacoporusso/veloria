export interface LegendaryResearchClue {
  readonly id: string;
  readonly mapId: string;
  readonly title: string;
  readonly text: string;
  readonly event: string;
  readonly flag: string;
}

export interface LegendaryResearchOption {
  readonly id: string;
  readonly label: string;
}

export interface LegendaryResearchDefinition {
  readonly id: string;
  readonly encounterId: string;
  readonly questId: string;
  readonly requiredFlag: string;
  readonly revealedFlag: string;
  readonly capturedFlag: string;
  readonly regionHint: string;
  readonly clues: readonly LegendaryResearchClue[];
  readonly puzzle: {
    readonly mapId: string;
    readonly title: string;
    readonly hint: string;
    readonly options: readonly LegendaryResearchOption[];
    readonly solution: readonly string[];
    readonly event: string;
    readonly progressFlagPrefix: string;
  };
}

export type LegendaryResearchStatus = 'locked' | 'searching' | 'ready' | 'revealed';

export interface LegendaryResearchState {
  readonly status: LegendaryResearchStatus;
  readonly foundClueIds: string[];
  readonly progress: number;
  readonly captured: boolean;
}

export type ResearchSymbolOutcome = 'locked' | 'cluesMissing' | 'wrong' | 'progress' | 'solved' | 'alreadySolved';

export function validateLegendaryResearchDefinition(definition: LegendaryResearchDefinition): void {
  const requiredStrings = [
    definition.id, definition.encounterId, definition.questId, definition.requiredFlag,
    definition.revealedFlag, definition.capturedFlag, definition.regionHint,
    definition.puzzle?.mapId, definition.puzzle?.title, definition.puzzle?.hint,
    definition.puzzle?.event, definition.puzzle?.progressFlagPrefix,
  ];
  if (requiredStrings.some(value => typeof value !== 'string' || !value.trim())) {
    throw new Error('Legendary research requires non-empty IDs, flags, and descriptions.');
  }
  if (!Array.isArray(definition.clues) || definition.clues.length < 2) throw new Error('Legendary research requires at least two clues.');
  unique(definition.clues.map(clue => clue.id), 'clue IDs');
  unique(definition.clues.map(clue => clue.flag), 'clue flags');
  unique([definition.requiredFlag, definition.revealedFlag, definition.capturedFlag, ...definition.clues.map(clue => clue.flag)], 'persistent flags');
  for (const clue of definition.clues) {
    if ([clue.id, clue.mapId, clue.title, clue.text, clue.event, clue.flag].some(value => typeof value !== 'string' || !value.trim())) {
      throw new Error('Every clue requires an ID, map, title, text, event, and flag.');
    }
  }
  if (!Array.isArray(definition.puzzle.options) || definition.puzzle.options.length < 2) throw new Error('Research puzzle requires at least two options.');
  unique(definition.puzzle.options.map(option => option.id), 'puzzle option IDs');
  unique(definition.puzzle.options.map(option => option.label), 'puzzle option labels');
  for (const option of definition.puzzle.options) {
    if ([option.id, option.label].some(value => typeof value !== 'string' || !value.trim())) throw new Error('Puzzle options require non-empty IDs and labels.');
  }
  if (!Array.isArray(definition.puzzle.solution) || definition.puzzle.solution.length < 1) throw new Error('Research puzzle solution must not be empty.');
  const optionIds = new Set(definition.puzzle.options.map(option => option.id));
  if (definition.puzzle.solution.some(optionId => !optionIds.has(optionId))) throw new Error('Research solution must use declared option IDs.');
}

export function legendaryResearchState(definition: LegendaryResearchDefinition, flags: readonly string[]): LegendaryResearchState {
  validateLegendaryResearchDefinition(definition);
  const foundClueIds = definition.clues.filter(clue => flags.includes(clue.flag)).map(clue => clue.id);
  const captured = flags.includes(definition.capturedFlag);
  const status: LegendaryResearchStatus = flags.includes(definition.revealedFlag) ? 'revealed'
    : !flags.includes(definition.requiredFlag) ? 'locked'
      : foundClueIds.length === definition.clues.length ? 'ready' : 'searching';
  return { status, foundClueIds, progress: currentProgress(definition, flags), captured };
}

export function chooseResearchSymbol(
  definition: LegendaryResearchDefinition,
  flags: readonly string[],
  optionId: string,
): { flags: string[]; outcome: ResearchSymbolOutcome; progress: number; event?: string } {
  validateLegendaryResearchDefinition(definition);
  if (flags.includes(definition.revealedFlag)) return { flags: clearProgress(definition, flags), outcome: 'alreadySolved', progress: 0 };
  const progress = currentProgress(definition, flags);
  const normalizedFlags = canonicalProgressFlags(definition, flags, progress);
  if (!flags.includes(definition.requiredFlag)) return { flags: normalizedFlags, outcome: 'locked', progress };
  if (!definition.clues.every(clue => flags.includes(clue.flag))) {
    return { flags: normalizedFlags, outcome: 'cluesMissing', progress };
  }

  const nextIndex = progress;
  if (optionId !== definition.puzzle.solution[nextIndex]) {
    return { flags: clearProgress(definition, flags), outcome: 'wrong', progress: 0 };
  }
  const nextProgress = nextIndex + 1;
  if (nextProgress === definition.puzzle.solution.length) {
    return { flags: clearProgress(definition, flags), outcome: 'solved', progress: nextProgress, event: definition.puzzle.event };
  }
  return { flags: canonicalProgressFlags(definition, flags, nextProgress), outcome: 'progress', progress: nextProgress };
}

function currentProgress(definition: LegendaryResearchDefinition, flags: readonly string[]): number {
  let progress = 0;
  while (progress < definition.puzzle.solution.length &&
    flags.includes(progressFlag(definition, progress, definition.puzzle.solution[progress]!))) progress++;
  return progress;
}

function clearProgress(definition: LegendaryResearchDefinition, flags: readonly string[]): string[] {
  return flags.filter(flag => !flag.startsWith(definition.puzzle.progressFlagPrefix));
}

function canonicalProgressFlags(definition: LegendaryResearchDefinition, flags: readonly string[], progress: number): string[] {
  const nextFlags = clearProgress(definition, flags);
  for (let index = 0; index < progress; index++) {
    nextFlags.push(progressFlag(definition, index, definition.puzzle.solution[index]!));
  }
  return nextFlags;
}

function progressFlag(definition: LegendaryResearchDefinition, index: number, optionId: string): string {
  return `${definition.puzzle.progressFlagPrefix}${index}_${optionId}`;
}

function unique(values: readonly string[], label: string): void {
  if (values.some(value => typeof value !== 'string' || !value.trim()) || new Set(values).size !== values.length) {
    throw new Error(`Legendary research ${label} must be non-empty and unique.`);
  }
}
