import type { GameSave } from '../../persistence/save-types.ts';
import { battleSpecies } from '../battle/catalog.ts';
import '../../prologue-completion.css';

/** Show the prologue milestone without changing or persisting the supplied save. */
export function showPrologueCompletion(save: GameSave): Promise<void> {
  return new Promise(resolve => {
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overlay = document.createElement('div');
    overlay.className = 'prologue-completion';
    overlay.setAttribute('aria-label', 'Capitolo completato');

    const dialog = document.createElement('section');
    dialog.className = 'prologue-completion__panel';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'prologue-completion-title');
    dialog.setAttribute('aria-describedby', 'prologue-completion-story');

    const glow = document.createElement('div');
    glow.className = 'prologue-completion__glow';
    glow.setAttribute('aria-hidden', 'true');

    const header = document.createElement('header');
    header.className = 'prologue-completion__header';
    const kicker = document.createElement('p');
    kicker.className = 'prologue-completion__eyebrow';
    kicker.textContent = 'VELORIA · ATLANTE DELLE MERAVIGLIE';
    const title = document.createElement('h1');
    title.id = 'prologue-completion-title';
    title.className = 'prologue-completion__title';
    title.textContent = 'Primo capitolo completato';
    const greeting = document.createElement('p');
    greeting.className = 'prologue-completion__greeting';
    greeting.append('Un traguardo per ');
    const trainerName = document.createElement('strong');
    trainerName.textContent = save.player.name;
    greeting.append(trainerName, '.');
    header.append(kicker, title, greeting);

    const medal = document.createElement('div');
    medal.className = 'prologue-completion__medal';
    medal.setAttribute('aria-label', 'Medaglia Aurora');
    const medalIcon = document.createElement('span');
    medalIcon.className = 'prologue-completion__medal-icon';
    medalIcon.setAttribute('aria-hidden', 'true');
    medal.append(medalIcon);
    const medalLabel = document.createElement('span');
    medalLabel.className = 'prologue-completion__medal-label';
    medalLabel.textContent = 'Medaglia Aurora';
    medal.append(medalLabel);

    const story = document.createElement('p');
    story.id = 'prologue-completion-story';
    story.className = 'prologue-completion__story';
    story.textContent = 'Hai concluso il prologo, che accompagna il tuo viaggio fino a Mira. L’avventura completa proseguirà con i prossimi capitoli.';

    const uniqueSpecies = new Set<number>();
    for (const creature of [...save.party, ...save.storage]) {
      if (battleSpecies[String(creature.speciesId)]?.speciesId === creature.speciesId) {
        uniqueSpecies.add(creature.speciesId);
      }
    }
    const summary = document.createElement('section');
    summary.className = 'prologue-completion__summary';
    summary.setAttribute('aria-label', 'Il tuo viaggio finora');
    const speciesStat = document.createElement('div');
    speciesStat.className = 'prologue-completion__stat';
    const speciesCount = document.createElement('strong');
    speciesCount.textContent = String(uniqueSpecies.size);
    const speciesLabel = document.createElement('span');
    speciesLabel.textContent = 'specie con te';
    speciesStat.append(speciesCount, speciesLabel);
    const partyStat = document.createElement('div');
    partyStat.className = 'prologue-completion__stat';
    const partyCount = document.createElement('strong');
    partyCount.textContent = `${save.party.length}/6`;
    const partyLabel = document.createElement('span');
    partyLabel.textContent = 'in squadra';
    partyStat.append(partyCount, partyLabel);
    summary.append(speciesStat, partyStat);

    const partySection = document.createElement('section');
    partySection.className = 'prologue-completion__party';
    partySection.setAttribute('aria-label', 'La tua squadra');
    const partyTitle = document.createElement('h2');
    partyTitle.textContent = 'La tua squadra';
    const partyList = document.createElement('ul');
    partyList.className = 'prologue-completion__party-list';
    if (save.party.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'prologue-completion__empty';
      empty.textContent = 'La squadra è ancora vuota';
      partyList.append(empty);
    } else {
      for (const creature of save.party) {
        const item = document.createElement('li');
        const species = battleSpecies[String(creature.speciesId)];
        const name = document.createElement('span');
        name.textContent = species?.speciesId === creature.speciesId ? species.name : `Specie ${creature.speciesId}`;
        const level = document.createElement('span');
        level.className = 'prologue-completion__level';
        level.textContent = `Lv. ${creature.level}`;
        item.append(name, level);
        partyList.append(item);
      }
    }
    partySection.append(partyTitle, partyList);

    const continueButton = document.createElement('button');
    continueButton.className = 'prologue-completion__continue';
    continueButton.type = 'button';
    continueButton.textContent = 'Continua a esplorare';
    dialog.append(glow, header, medal, story, summary, partySection, continueButton);
    overlay.append(dialog);
    document.body.append(overlay);

    let settled = false;
    const close = () => {
      if (settled) return;
      settled = true;
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.remove();
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      resolve();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      event.preventDefault();
      continueButton.focus({ preventScroll: true });
    };
    continueButton.addEventListener('click', close);
    document.addEventListener('keydown', onKeyDown, true);
    continueButton.focus({ preventScroll: true });
  });
}
