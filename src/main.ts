import Phaser from 'phaser';
import './style.css';
import './mobile-controls.css';
import './dialogue.css';
import { loadSave, newGameSave, saveGame, type GameSave } from './persistence/save-store';

type Direction = 'up' | 'down' | 'left' | 'right';
const TILE = 32;
const WORLD_W = 44;
const WORLD_H = 32;
const COLORS = { grass: 0x839c67, lightGrass: 0x93a873, darkGrass: 0x708c5b, path: 0xc8b78a, pathLight: 0xd5c49a, pathDark: 0xb5a377, roof: 0x865b46, roofLight: 0xa46d51, wall: 0xe1d0aa, wallShade: 0xc6b68f, wood: 0x795b3d, water: 0x537d7a, waterLight: 0x81aaa0, leaf: 0x607e56, leafLight: 0x81965c, flower: 0xe2ce9c };

class Borgofonte extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerTile = { x: 20, y: 20 };
  private save: GameSave;
  private saveQueue = Promise.resolve();
  private afterDialogue: (() => void) | null = null;
  private starterChoices!: HTMLElement;
  private moving = false;
  private heldDirection: Direction | null = null;
  private facing: Direction = 'down';
  private dialogueLines: string[] = [];
  private dialogueIndex = 0;
  private dialogueBox!: HTMLElement;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private occupied = new Set<string>();
  private face!: Phaser.GameObjects.Graphics;
  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor(save: GameSave) { super('borgofonte'); this.save = save; }

  create() {
    this.playerTile = { x: this.save.player.x, y: this.save.player.y };
    this.drawWorld();
    this.cameras.main.setBounds(0, 0, WORLD_W * TILE, WORLD_H * TILE);
    this.cameras.main.setZoom(Math.min(1.25, Math.max(1, this.scale.width / 800)));
    this.player = this.makePlayer();
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

  private block(x: number, y: number) { this.occupied.add(`${x},${y}`); }
  private rect(x: number, y: number, w: number, h: number, color: number, depth: number, radius = 0) {
    const g = this.add.graphics().setDepth(depth);
    if (radius) g.fillStyle(color).fillRoundedRect(x, y, w, h, radius);
    else g.fillStyle(color).fillRect(x, y, w, h);
    return g;
  }

  private drawWorld() {
    const bg = this.add.graphics().setDepth(-10);
    bg.fillStyle(COLORS.grass).fillRect(0, 0, WORLD_W * TILE, WORLD_H * TILE);
    // Gentle grass variation gives the prototype a natural pixel-art texture.
    for (let y = 0; y < WORLD_H; y++) for (let x = 0; x < WORLD_W; x++) {
      const seed = (x * 73856093 ^ y * 19349663) >>> 0;
      if (seed % 17 === 0) this.rect(x*TILE+((seed>>>5)%24), y*TILE+((seed>>>9)%24), 2, 3, seed%3 ? COLORS.lightGrass : COLORS.darkGrass, -8);
      if (seed % 61 === 0) { this.rect(x*TILE+13, y*TILE+10, 3, 3, COLORS.flower, -7); this.rect(x*TILE+16,y*TILE+13,2,2,COLORS.wall, -7); }
    }
    // Village lane winding from the southern entrance to the square and the northern route.
    const road = (x:number,y:number,w:number,h:number) => {
      for(let ty=y;ty<y+h;ty++)for(let tx=x;tx<x+w;tx++){
        const seed=(tx*91+ty*173)%13;
        this.rect(tx*TILE,ty*TILE,TILE,TILE,seed===0?COLORS.pathDark:seed===1?COLORS.pathLight:COLORS.path,-5);
        if(seed===3)this.rect(tx*TILE+8,ty*TILE+6,2,2,COLORS.wallShade,-4);
      }
    };
    road(20, 15, 4, 17); road(12, 15, 20, 4); road(12, 7, 4, 9); road(28, 7, 3, 9);
    // Clear water pond and stepping stones.
    this.rect(3*TILE, 19*TILE, 7*TILE, 5*TILE, COLORS.water, -2, 18);
    this.rect(4*TILE,19*TILE,5*TILE,TILE,COLORS.waterLight,-1,12);
    for(let ty=19;ty<24;ty++)for(let tx=3;tx<10;tx++)this.block(tx,ty);
    for(const [x,y] of [[5,20],[7,21],[6,22],[8,20]]) this.rect(x*TILE+8,y*TILE+8,14,9,COLORS.pathLight,0,4);
    for(let i=0;i<9;i++)this.rect((4+i%5)*TILE+6,(19+Math.floor(i/5)*3)*TILE+5,7,2,0xa4c3ad,0);
    // Houses and workshop sit around the lane; all solid edges are kept in the collision grid.
    this.drawHouse(12, 9, 'Casa di Elia', COLORS.roof);
    this.drawHouse(26, 9, 'Emporio', 0x9a7350);
    this.drawHouse(16, 26, 'Laboratorio di Elia', 0x7c6257, true);
    this.drawHouse(28, 22, 'Officina', 0x647767);
    this.drawTree(9, 9);this.drawTree(9,12);this.drawTree(34,9);this.drawTree(35,12);this.drawTree(34,23);this.drawTree(12,25);this.drawTree(32,25);
    this.drawMillWheel(23, 16);
    this.drawNpc(20, 23, 'Elia', 0x728a79);
    this.drawNpc(16, 19, 'Nilo', 0x667f9a);
    // Signposts and garden planters are landmarks and block walking.
    this.drawSign(22, 13, 'Sentiero dell’Alba');
    this.drawSign(29, 16, 'Piazza del Mulino');
    this.add.text(22*TILE,13*TILE-25,'SENTIERO DELL’ALBA',{fontFamily:'monospace',fontSize:'8px',color:'#f1e5c4',stroke:'#26372c',strokeThickness:3}).setOrigin(.5).setDepth(1);
    this.add.text(21*TILE,20*TILE,'PIAZZA DEL MULINO',{fontFamily:'monospace',fontSize:'8px',color:'#665b44'}).setOrigin(.5).setDepth(1);
    // A visual edge and the town gate mark the limits of the walkable space.
    for(let x=0;x<WORLD_W;x++){this.drawTree(x,0);this.drawTree(x,WORLD_H-1);}
    for(let y=1;y<WORLD_H-1;y++){this.drawTree(0,y);this.drawTree(WORLD_W-1,y);}
    for(let x=18;x<=25;x++)this.block(x,31);
  }

  private drawHouse(tx:number,ty:number,label:string,roof:number,large=false) {
    const width=large?7:6, height=5, x=tx*TILE,y=ty*TILE;
    // Roof silhouette and its alternating shingles.
    this.rect(x-5,y+TILE-4,width*TILE+10,2*TILE+10,0x26352d, -3,3);
    this.rect(x-5,y-9,width*TILE+10,TILE+18,roof,-2,5);
    this.rect(x,y+10,width*TILE,TILE-3,roof===COLORS.roof?COLORS.roofLight:roof+0x111111,-1,2);
    for(let row=0;row<2;row++)for(let col=0;col<width;col+=2)this.rect(x+col*TILE,y+row*17+4,TILE+4,2,0x362f29,-0.5);
    this.rect(x,y+TILE,width*TILE,height*TILE-TILE,COLORS.wall,0);
    this.rect(x,y+TILE,width*TILE,4,COLORS.wallShade,0);
    for(const wx of [1,width-2]){this.rect(x+wx*TILE+7,y+TILE+13,17,20,0x526e68,2,2);this.rect(x+wx*TILE+14,y+TILE+13,2,20,COLORS.wall,3);this.rect(x+wx*TILE+7,y+TILE+22,17,2,COLORS.wall,3);}
    const doorX=x+Math.floor(width/2)*TILE+3;
    this.rect(doorX,y+TILE*3,26,TILE*2,0x684c37,2,5);
    this.rect(doorX+12,y+TILE*3+25,3,3,0xd6be83,3);
    this.rect(x+5,y+TILE*3+TILE*2-3,width*TILE-10,5,COLORS.wallShade,1);
    this.add.text(x+width*TILE/2,y-13,label.toUpperCase(),{fontFamily:'monospace',fontSize:'8px',color:'#fff0d3',stroke:'#26372c',strokeThickness:3}).setOrigin(.5).setDepth(3);
    for(let row=1;row<height;row++)for(let col=0;col<width;col++) this.block(tx+col,ty+row);
    for(let col=-1;col<=width;col++){this.block(tx+col,ty);this.block(tx+col,ty+height);}
  }

  private drawTree(tx:number,ty:number) {
    const x=tx*TILE,y=ty*TILE,depth=y+TILE+8;this.block(tx,ty);
    this.rect(x+12,y+19,9,18,COLORS.wood,depth-2);
    this.rect(x+2,y+2,29,25,COLORS.leaf,depth,10);
    this.rect(x+6,y,20,10,COLORS.leafLight,depth+1,7);
    this.rect(x+5,y+14,8,6,0x758c58,depth+2,4);
    this.rect(x+21,y+8,6,6,0x92a76a,depth+2,3);
  }

  private drawSign(tx:number,ty:number,_label:string) {
    const x=tx*TILE,y=ty*TILE;this.block(tx,ty);
    this.rect(x+14,y+14,4,19,COLORS.wood,1);
    this.rect(x+4,y+5,23,15,COLORS.wood,2,2);
    this.rect(x+7,y+8,17,2,0xd2bd8a,3);
  }

  private drawMillWheel(tx:number,ty:number) {
    const x=tx*TILE,y=ty*TILE,cx=x+TILE,cy=y+TILE,depth=y+TILE+10;
    this.block(tx,ty);this.block(tx+1,ty);this.block(tx,ty+1);this.block(tx+1,ty+1);
    this.add.ellipse(cx,cy+4,62,42,0x3d5546).setDepth(depth);
    this.add.ellipse(cx,cy,54,38,COLORS.wood).setDepth(depth+1);
    this.add.ellipse(cx,cy,44,29,COLORS.wallShade).setDepth(depth+2);
    this.add.ellipse(cx,cy,34,21,COLORS.water).setDepth(depth+3);
    const spokes=this.add.graphics().setDepth(depth+4);
    spokes.lineStyle(3,0x886646,1);
    spokes.lineBetween(cx-21,cy,cx+21,cy);
    spokes.lineBetween(cx,cy-14,cx,cy+14);
    spokes.lineBetween(cx-15,cy-10,cx+15,cy+10);
    spokes.lineBetween(cx-15,cy+10,cx+15,cy-10);
    this.add.ellipse(cx,cy,8,8,0xd3bd8c).setDepth(depth+5);
  }

  private drawNpc(tx:number,ty:number,name:string,coat:number) {
    const x=tx*TILE,y=ty*TILE;this.block(tx,ty);
    this.add.ellipse(x+TILE/2,y+25,21,7,0x24382e,.38).setDepth(y+26);
    const npc=this.add.container(x+TILE/2,y+TILE/2).setDepth(y+38);
    const art=this.add.graphics();
    art.fillStyle(0x403c38).fillRoundedRect(-6,-15,12,7,3);
    art.fillStyle(0xefd1a9).fillRoundedRect(-6,-12,12,11,4);
    art.fillStyle(0x40352c).fillRect(-3,-8,2,2).fillRect(2,-8,2,2);
    art.fillStyle(coat).fillRoundedRect(-9,-2,18,15,4);
    art.fillStyle(0xe3d5b5).fillRect(-2,-1,4,10);
    art.fillStyle(0x3f4c48).fillRoundedRect(-7,10,6,7,2).fillRoundedRect(1,10,6,7,2);
    npc.add(art);
    this.add.text(x+TILE/2,y-10,name.toUpperCase(),{fontFamily:'monospace',fontSize:'8px',color:'#fff0d3',stroke:'#26372c',strokeThickness:3}).setOrigin(.5).setDepth(y+39);
  }

  private makePlayer() {
    const p=this.add.container(0,0).setSize(25,31);
    const shadow=this.add.ellipse(0,12,24,9,0x24382e,.38);
    const legs=this.add.graphics();legs.fillStyle(0x344d50).fillRoundedRect(-7,3,6,10,2).fillRoundedRect(2,3,6,10,2);legs.fillStyle(0x564b3b).fillRect(-8,10,7,3).fillRect(1,10,7,3);
    const body=this.add.graphics();body.fillStyle(0xb96d4e).fillRoundedRect(-9,-9,18,16,4);body.fillStyle(0xd7c290).fillRect(-8,2,16,3);body.fillStyle(0xe0bf83).fillRoundedRect(-11,-11,22,6,3);body.fillStyle(0x806043).fillRect(-10,-8,20,2);
    const head=this.add.graphics();
    this.face=head;
    this.drawFace();
    p.add([shadow,legs,body,head]);
    this.tweens.add({targets:p, yoyo:true, repeat:-1, duration:680, scaleY:.97, ease:'Sine.easeInOut'});
    return p;
  }

  private drawFace() {
    const face=this.face;
    face.clear();
    face.fillStyle(0xefd1a9).fillRoundedRect(-6,-18,12,12,4);
    face.fillStyle(0x513e35).fillRoundedRect(-7,-21,14,6,3);
    face.fillStyle(0xefd1a9).fillRect(-5,-20,10,2);
    if(this.facing==='up'){
      face.fillStyle(0x584536).fillRoundedRect(-8,-20,16,7,3);
      face.fillStyle(0xd1b878).fillRect(-8,-15,16,2);
      return;
    }
    face.fillStyle(0x40352c);
    if(this.facing==='left') face.fillRect(-4,-15,2,2);
    else if(this.facing==='right') face.fillRect(3,-15,2,2);
    else face.fillRect(-3,-15,2,2).fillRect(2,-15,2,2);
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
    if(this.occupied.has(`${x},${y}`))return;
    this.moving=true;this.playerTile={x,y};
    this.tweens.add({targets:this.player,x:x*TILE+TILE/2,y:y*TILE+TILE/2,duration:132,ease:'Sine.easeInOut',onUpdate:()=>this.player.setDepth(this.player.y+20),onComplete:()=>{this.moving=false;this.save.player.x=x;this.save.player.y=y;this.persistProgress();this.checkLandmark(x,y);}});
  }

  private checkLandmark(x:number,y:number) {
    if(x>=23&&x<=24&&y>=16&&y<=17)this.showToast('La ruota del vecchio mulino gira lenta tra le acque.');
    else if(x===22&&y===13)this.showToast('Il sentiero a nord porta fuori da Borgofonte.');
    else if(x>=19&&x<=25&&y>=18&&y<=21)this.showToast('La piazza del mulino · Il cuore di Borgofonte.');
    else if(x>=10&&x<=17&&y>=10&&y<=14)this.showToast('Un luogo accogliente, profumato di pane appena sfornato.');
    else if(x>=26&&x<=32&&y>=10&&y<=14)this.showToast('Emporio di Borgofonte · Torna presto per nuove avventure.');
  }

  private interact() {
    const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[this.facing];
    const x=this.playerTile.x+d[0],y=this.playerTile.y+d[1];
    if(x===20&&y===23){
      if(!this.save.flags.includes('q_starter_selected')){
        this.afterDialogue=()=>this.showStarterChoices();
        this.showDialogue('Professoressa Elia',['Benvenuta a Borgofonte. Sono Elia, la professoressa che si prende cura di questo laboratorio.','È il momento di scegliere il tuo primo compagno: quale vuoi portare con te?']);
      } else this.showDialogue('Professoressa Elia',[`Il tuo ${this.starterName()} è in ottima forma. Ti aspetta un viaggio pieno di scoperte.`,'Ricorda: il Sentiero dell’Alba si trova a nord della piazza.']);
      return;
    }
    if(x===16&&y===19){this.showDialogue('Nilo',['Ehi, anche tu senti il profumo del pane?','Dicono che dal Sentiero dell’Alba si arrivi al Bosco dei Veli. Non vedo l’ora di partire.']);return;}
    if(x===22&&y===13){this.showToast('Sentiero dell’Alba · L’avventura ti aspetta.');return;}
    if(x>=23&&x<=24&&y>=16&&y<=17){this.showToast('La ruota del vecchio mulino gira lenta tra le acque.');return;}
    if(x>=12&&x<=17&&y>=10&&y<=14){this.showToast('Elia: «Benvenuta a Borgofonte. Il professore ti aspetta a nord.»');return;}
    if(x>=26&&x<=31&&y>=10&&y<=14){this.showToast('Emporio: «Presto troverai qui tutto ciò che serve per il viaggio.»');return;}
    if(x>=16&&x<=22&&y>=27&&y<=31){this.showToast('Il laboratorio di Elia custodisce appunti e strumenti di ricerca.');return;}
    if(x>=28&&x<=33&&y>=23&&y<=26){this.showToast('Officina: una luce calda brilla dietro le finestre.');return;}
    this.showToast('Una brezza leggera attraversa la piazza.');
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
        const instanceId=crypto.randomUUID();
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

const save = await loadSave() ?? newGameSave();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#839c67',
  pixelArt: true,
  antialias: false,
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: [new Borgofonte(save)],
  render: { roundPixels: true, antialias: false },
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => undefined));
}

void game;
