import musicContent from '../../../content/audio/themes.v1.json';

const MUTED_KEY = 'veloria-audio-muted';
const VOLUME_KEY = 'veloria-audio-volume';
type MusicTheme = { wave: OscillatorType; beatMs: number; notes: number[] };
const themes = musicContent.themes as Record<string, MusicTheme>;

/** Original, low-volume procedural ambience. AudioContext is created only after a user gesture. */
export class AudioManager {
  private context?: AudioContext;
  private masterGain?: GainNode;
  private muted = readMutedPreference();
  private volume = readVolumePreference();
  private themeId = 'ambient_borgofonte';
  private step = 0;
  private timer?: number;

  get isMuted(): boolean { return this.muted; }
  get volumeLevel(): number { return this.volume; }

  async unlock(): Promise<void> {
    if (this.muted) return;
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    this.context ??= new AudioContextConstructor();
    this.masterGain ??= this.context.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.context.destination);
    if (this.context.state === 'suspended') await this.context.resume();
    if (this.context.state === 'running' && this.timer === undefined) this.playNextNote();
  }

  setTheme(themeId: string): void {
    if (themeId === this.themeId) return;
    this.themeId = Object.hasOwn(themes, themeId) ? themeId : 'ambient_borgofonte';
    this.step = 0;
    this.clearTimer();
    if (!this.muted && this.context?.state === 'running') this.playNextNote();
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.min(1, Math.max(0, volume));
    try { localStorage.setItem(VOLUME_KEY, String(this.volume)); } catch { /* Preference remains session-local when storage is unavailable. */ }
    if (this.masterGain && this.context) this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.context.currentTime, 0.04);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try { localStorage.setItem(MUTED_KEY, String(muted)); } catch { /* Preferences remain session-local when storage is unavailable. */ }
    if (this.masterGain && this.context) this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.context.currentTime, 0.04);
    if (muted) this.clearTimer();
    else if (this.context?.state === 'running' && this.timer === undefined) this.playNextNote();
  }

  private clearTimer(): void {
    if (this.timer === undefined) return;
    window.clearTimeout(this.timer);
    this.timer = undefined;
  }

  private playNextNote(): void {
    if (!this.context || !this.masterGain || this.muted || this.context.state !== 'running') return;
    const theme = themes[this.themeId] ?? themes.ambient_borgofonte;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const noteGain = this.context.createGain();
    oscillator.type = theme.wave;
    oscillator.frequency.setValueAtTime(theme.notes[this.step % theme.notes.length]!, now);
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.045, now + 0.055);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + theme.beatMs / 1000 * 0.82);
    oscillator.connect(noteGain).connect(this.masterGain);
    oscillator.start(now);
    oscillator.stop(now + theme.beatMs / 1000 * 0.86);
    this.step++;
    this.timer = window.setTimeout(() => {
      this.timer = undefined;
      this.playNextNote();
    }, theme.beatMs);
  }
}

function readMutedPreference(): boolean {
  try { return localStorage.getItem(MUTED_KEY) === 'true'; } catch { return false; }
}

function readVolumePreference(): number {
  try {
    const saved = localStorage.getItem(VOLUME_KEY);
    if (saved === null) return 0.32;
    const value = Number(saved);
    return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.32;
  } catch { return 0.32; }
}
