import type { Page } from '@playwright/test';
import type { GameSave } from '../../../src/persistence/save-types.ts';

/** Read-only observations; all mutations must pass through normal player controls. */
export interface NaturalJourneyContext {
  page: Page;
  walk(x: number, y: number): Promise<void>;
  interact(x: number, y: number): Promise<void>;
  settle(): Promise<void>;
  observe(): Promise<{ mapId: string; x: number; y: number; save: GameSave }>;
  record(label: string): Promise<void>;
  challenge(x: number, y: number, label: string): Promise<void>;
  exportCheckpoint(filename: string): Promise<void>;
}
