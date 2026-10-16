import Phaser from 'phaser';
import { createUniqueId, saveGame, type GameSave } from '../../persistence/save-store';
import { getMap, getMapKey, getSpawn, listMaps } from '../maps/map-registry';
import type { MapTrigger, MapInteractable, RegisteredMap } from '../maps/map-types';
import { renderMap } from '../rendering/MapRenderer';

type Direction = 'up' | 'down' | 'left' | 'right';
const TILE = 32;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerTile = { x: 20, y: 20 };
  private map!: RegisteredMap;
  private mapLayer!: Phaser.GameObjects.Container;
  private renderedMap!: ReturnType<typeof renderMap>;
  private save: GameSave;
  private saveQueue = Promise.resolve();
  private afterDialogue: (() => void) | null = null;
  private starterChoices!: HTMLElement;
  private moving = false;
  private heldDirection: Direction | null = null;
  private activeTriggerId: string | null = null;
  private facing: Direction = 'down';
  private dialogueLines: string[] = [];
  private dialogueIndex = 0;
  private dialogueBox!: HTMLElement;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private occupied = new Set<string>();
  private playerSprite!: Phaser.GameObjects.Image;
  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor(save: GameSave) { super('world'); this.save = save; }

  preload() {
    this.load.image('borgofonte-tree', '/assets/sprites/borgofonte-tree-01.png');
    this.load.image('borgofonte-house', '/assets/sprites/borgofonte-house-01.png');
    for (const direction of ['down', 'up', 'left', 'right']) {
      this.load.image(`veloria-traveler-${direction}`, `/assets/sprites/veloria-traveler-${direction}.png`);
    }
    this.load.image('veloria-ground', '/assets/tilesets/veloria-ground-v1.png');
    for (const map of listMaps()) this.load.tilemapTiledJSON(getMapKey(map), `/${map.metadata.tiledAsset}`);
  }

  create() {
    try { this.map = getMap(this.save.player.mapId); }
    catch { this.map = getMap('veloria/borgofonte'); this.save.player.mapId = this.map.metadata.id; this.save.player.spawnPointId = 'start'; }
    this.playerTile = { x: this.save.player.x, y: this.save.player.y };
    this.drawWorld();
    if (this.isBlocked(this.playerTile.x, this.playerTile.y) || !this.isInsideMap(this.playerTile.x, this.playerTile.y)) {
      const spawn = getSpawn(this.map, this.save.player.spawnPointId);
      this.playerTile = { x: spawn.x, y: spawn.y };
      this.save.player.x = spawn.x; this.save.player.y = spawn.y;
    }
    this.cameras.main.setBounds(0, 0, this.renderedMap.width * TILE, this.renderedMap.height * TILE);
    this.cameras.main.setZoom(Math.min(1.25, Math.max(1, this.scale.width / 800)));
    this.player = this.makePlayer();
    this.mapLayer.add(this.player);
    this.player.setPosition(this.playerTile.x * TILE + TILE / 2, this.playerTile.y * TILE + TILE / 2).setDepth(this.player.y + 20);
    this.cameras.main.startFollow(this.player, true, .12, .12);
    this.cameras.main.setDeadzone(100, 60);
    this.dialogueBox=document.querySelector<HTMLElement>('#dialogue-box')!;
    this.starterChoices=document.querySelector<HTMLElement>('#starter-choices')!;
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,M') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown-E', () => this.advanceOrInteract());
    this.input.keyboard!.on('keydown-SPACE', () => this.advanceOrInteract());
    this.input.keyboard!.on('keydown-M', () => this.persistProgress(true));
    this.bindTouchControls();
    this.scale.on('resize', () => this.cameras.main.setZoom(Math.min(1.25, Math.max(1, this.scale.width / 800))));
    this.showToast('Ti diamo il benvenuto a Borgofonte.');
  }

  private drawWorld() {
    this.renderedMap = renderMap(this, this.map);
    this.mapLayer = this.renderedMap.container;
    this.occupied = this.renderedMap.occupied;
  }
  private makePlayer() {
    const player = this.add.container(0, 0).setSize(25, 40);
    const shadow = this.add.ellipse(0, 20, 24, 8, 0x24382e, .38);
    this.playerSprite = this.add.image(0, 0, 'veloria-traveler-down');
    player.add([shadow, this.playerSprite]);
    return player;
  }

  private drawFace() {
    this.playerSprite?.setTexture(`veloria-traveler-${this.facing}`);
  }

  private bindTouchControls() {
    const buttons=document.querySelectorAll<HTMLButtonElement>('.dpad-key');
    buttons.forEach(button=>{
      const dir=button.dataset.direction as Direction;
      const start=(event:Event)=>{event.preventDefault();button.classList.add('pressed');this.heldDirection=dir;this.tryMove(dir);};
      const stop=()=>{button.classList.remove('pressed');if(this.heldDirection===dir)this.heldDirection=null;};
      button.addEventListener('pointerdown',start);button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('pointerleave',stop);
    });
    document.querySelector('#action-a')?.addEventListener('click',()=>this.advanceOrInteract());
    document.querySelector('#action-b')?.addEventListener('click',()=>{
      if(this.dialogueLines.length)this.closeDialogue();
      else {const toast=document.querySelector<HTMLElement>('#toast');toast?.classList.remove('visible');clearTimeout(this.toastTimer);}
    });
    document.querySelector('#action-save')?.addEventListener('click',()=>this.persistProgress(true));
    document.querySelector('#help-button')?.addEventListener('click',()=>this.showToast('WASD o frecce per muoverti · E o Spazio per parlare. Su telefono usa i comandi in basso.'));
  }

  update() {
    if(this.dialogueLines.length||!this.starterChoices.hidden)return;
    if(this.moving)return;
    if(this.heldDirection){this.tryMove(this.heldDirection);return;}
    if(this.keys.W.isDown||this.keys.UP.isDown)this.tryMove('up');
    else if(this.keys.S.isDown||this.keys.DOWN.isDown)this.tryMove('down');
    else if(this.keys.A.isDown||this.keys.LEFT.isDown)this.tryMove('left');
    else if(this.keys.D.isDown||this.keys.RIGHT.isDown)this.tryMove('right');
  }

  private tryMove(direction:Direction) {
    if(this.moving)return;
    const delta={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[direction];
    const x=this.playerTile.x+delta[0],y=this.playerTile.y+delta[1];this.facing=direction;this.drawFace();
    if(!this.isInsideMap(x,y)||this.isBlocked(x,y))return;
    this.moving=true;this.playerTile={x,y};
    this.tweens.add({targets:this.player,x:x*TILE+TILE/2,y:y*TILE+TILE/2,duration:132,ease:'Sine.easeInOut',onUpdate:()=>this.player.setDepth(this.player.y+20),onComplete:()=>{
      this.moving=false;this.save.player.x=x;this.save.player.y=y;
      this.persistProgress();
      const centerX=x*TILE+TILE/2,centerY=y*TILE+TILE/2;
      const trigger = this.renderedMap.triggers.find(item =>
        centerX >= item.x && centerX < item.x + item.width && centerY >= item.y && centerY < item.y + item.height,
      );
      if (trigger?.id !== this.activeTriggerId) {
        this.activeTriggerId = trigger?.id ?? null;
        if (trigger) { this.handleExit(trigger); return; }
      }
    }});
  }

  private interact() {
    const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[this.facing];
    const x=this.playerTile.x+d[0],y=this.playerTile.y+d[1];
    const prop=this.interactableAtTile(x,y);
    const npcId=String(prop?.properties.npcId??prop?.id);
    if(prop?.kind==='npc'&&npcId==='prof_elia'){
      if(!this.save.flags.includes('q_starter_selected')){
        this.afterDialogue=()=>this.showStarterChoices();
        this.showDialogue('Professoressa Elia',['Benvenuta a Borgofonte. Sono Elia, la professoressa che si prende cura di questo laboratorio.','È il momento di scegliere il tuo primo compagno: quale vuoi portare con te?']);
      } else this.showDialogue('Professoressa Elia',[`Il tuo ${this.starterName()} è in ottima forma. Ti aspetta un viaggio pieno di scoperte.`,'Ricorda: il Sentiero dell’Alba si trova a nord della piazza.']);
      return;
    }
    if(prop?.kind==='npc'&&npcId==='nilo'){this.showDialogue('Nilo',['Ehi, anche tu senti il profumo del pane?','Dicono che dal Sentiero dell’Alba si arrivi al Bosco dei Veli. Non vedo l’ora di partire.']);return;}
    if(prop?.kind==='npc'&&npcId.startsWith('trainer_route01')){this.showDialogue(prop.name,['Il sentiero prosegue verso il Bosco dei Veli.','Fai attenzione all’erba alta: qualcosa si muove tra gli steli.']);return;}
    if(prop?.kind==='sign'){this.showToast(`${prop.name} · L’avventura ti aspetta.`);return;}
    if(prop?.kind==='mill-wheel'){this.showToast('La ruota del vecchio mulino gira lenta tra le acque.');return;}
    if(prop?.kind==='house'){
      const message=prop.id==='emporio'?'Presto troverai qui tutto ciò che serve per il viaggio.':prop.id==='laboratorio'?'Il laboratorio di Elia custodisce appunti e strumenti di ricerca.':`Una luce calda brilla dietro le finestre di ${prop.name}.`;
      this.showToast(message);return;
    }
    if(prop?.kind==='rock'){this.showToast('Una roccia coperta di muschio, levigata dalla pioggia.');return;}
    this.showToast('Una brezza leggera attraversa la piazza.');
  }

  private interactableAtTile(x:number,y:number):MapInteractable|undefined {
    const centerX=x*TILE+TILE/2,centerY=y*TILE+TILE/2;
    return this.renderedMap.interactables.find(item=>centerX>=item.x&&centerX<item.x+item.width&&centerY>=item.y&&centerY<item.y+item.height);
  }

  private isInsideMap(x:number,y:number) { return x>=0&&y>=0&&x<this.renderedMap.width&&y<this.renderedMap.height; }
  private isBlocked(x:number,y:number) { return this.occupied.has(`${x},${y}`); }

  private handleExit(exit:MapTrigger) {
    if(exit.requiredFlag&&!this.save.flags.includes(exit.requiredFlag)){this.showToast('Elia ti aspetta al laboratorio prima di partire.');return;}
    if(!exit.destinationMapId||!exit.destinationSpawnId){this.showToast(exit.message??'La strada prosegue oltre la mappa.');return;}
    const destination=getMap(exit.destinationMapId);
    const spawn=getSpawn(destination,exit.destinationSpawnId);
    this.mapLayer.remove(this.player,false);
    this.mapLayer.destroy(true);
    this.map=destination;
    this.activeTriggerId = null;
    this.playerTile={x:spawn.x,y:spawn.y};
    this.save.player.mapId=destination.metadata.id;
    this.save.player.spawnPointId=spawn.id;
    this.save.player.x=spawn.x;this.save.player.y=spawn.y;
    this.facing=spawn.facing;this.drawFace();
    this.drawWorld();
    this.mapLayer.add(this.player);
    this.player.setPosition(spawn.x*TILE+TILE/2,spawn.y*TILE+TILE/2).setDepth(this.player.y+20);
    this.cameras.main.setBounds(0,0,this.renderedMap.width*TILE,this.renderedMap.height*TILE);
    this.persistProgress();
    this.showToast(destination.metadata.displayName);
  }

  private advanceOrInteract() {
    if(this.dialogueLines.length){
      if(this.dialogueIndex<this.dialogueLines.length-1){this.dialogueIndex++;this.updateDialoguePage();}
      else this.closeDialogue();
      return;
    }
    this.interact();
  }

  private showDialogue(speaker:string,lines:string[]) {
    this.starterChoices.hidden=true;
    document.querySelector<HTMLElement>('.dialogue-footer')!.hidden=false;
    this.dialogueLines=lines;this.dialogueIndex=0;
    document.querySelector<HTMLElement>('#dialogue-speaker')!.textContent=speaker;
    this.dialogueBox.hidden=false;
    document.querySelector('.game-stage')?.classList.add('has-dialogue');
    this.updateDialoguePage();
  }

  private updateDialoguePage() {
    document.querySelector<HTMLElement>('#dialogue-text')!.textContent=this.dialogueLines[this.dialogueIndex];
    document.querySelector<HTMLElement>('#dialogue-prompt')!.textContent=this.dialogueIndex<this.dialogueLines.length-1?'A · Continua  ▸':'A · Chiudi  ▸';
  }

  private closeDialogue() {
    this.dialogueLines=[];this.dialogueIndex=0;this.dialogueBox.hidden=true;
    document.querySelector('.game-stage')?.classList.remove('has-dialogue');
    const next=this.afterDialogue;this.afterDialogue=null;next?.();
  }

  private showStarterChoices() {
    const box=this.dialogueBox;
    box.hidden=false;
    document.querySelector('.game-stage')?.classList.add('has-dialogue');
    document.querySelector<HTMLElement>('#dialogue-speaker')!.textContent='SCEGLI IL TUO COMPAGNO';
    document.querySelector<HTMLElement>('#dialogue-text')!.textContent='Quattro avventure diverse. Scegli con chi iniziare.';
    document.querySelector<HTMLElement>('.dialogue-footer')!.hidden=true;
    const starters=[
      {name:'Pikachu',speciesId:25,hp:19,moves:[['thunder-shock',30],['growl',40]]},
      {name:'Charmander',speciesId:4,hp:19,moves:[['scratch',35],['growl',40]]},
      {name:'Squirtle',speciesId:7,hp:20,moves:[['tackle',35],['tail-whip',30]]},
      {name:'Bulbasaur',speciesId:1,hp:20,moves:[['tackle',35],['growl',40]]},
    ];
    this.starterChoices.replaceChildren(...starters.map(starter=>{
      const button=document.createElement('button');
      button.className='starter-choice';button.type='button';button.textContent=starter.name;
      button.addEventListener('click',()=>{
        if(this.save.flags.includes('q_starter_selected'))return;
        const instanceId=createUniqueId();
        this.save.party=[{instanceId,speciesId:starter.speciesId,level:5,experience:0,hp:starter.hp,maxHp:starter.hp,moves:starter.moves.map(([id,pp])=>({id:id as string,pp:pp as number}))}];
        this.save.flags.push('q_starter_selected','q_research_sample_received');
        this.starterChoices.hidden=true;
        document.querySelector<HTMLElement>('.dialogue-footer')!.hidden=false;
        this.showDialogue('Professoressa Elia',[`Ottima scelta. ${starter.name} sarà il tuo compagno di viaggio.`,'Ho registrato il tuo nuovo compagno. Nessun viaggio si affronta da soli.']);
        this.persistProgress(true);
      });
      return button;
    }));
    this.starterChoices.hidden=false;
  }

  private starterName() {
    return ({25:'Pikachu',4:'Charmander',7:'Squirtle',1:'Bulbasaur'} as Record<number,string>)[this.save.party[0]?.speciesId] ?? 'compagno';
  }

  private persistProgress(showToast=false) {
    this.save.player.x=this.playerTile.x;this.save.player.y=this.playerTile.y;
    this.saveQueue=this.saveQueue.then(()=>saveGame(this.save)).then(()=>{if(showToast)this.showToast('Partita salvata.');}).catch(()=>{this.showToast('Salvataggio non riuscito.');});
  }

  private showToast(message:string) {
    const toast=document.querySelector<HTMLElement>('#toast');if(!toast)return;
    toast.textContent=message;toast.classList.add('visible');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>toast.classList.remove('visible'),2600);
  }
}

