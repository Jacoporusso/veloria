import Phaser from 'phaser';

/** A short, scene-owned cast. Cancellation never starts an encounter after shutdown. */
export function playFishingCast(
  scene: Phaser.Scene,
  origin: {x:number;y:number},
  target: {x:number;y:number},
  reducedMotion: boolean,
  caught: boolean,
  complete: () => void,
): void {
  const drawing=scene.add.graphics().setDepth(10000);
  let finished=false;
  const cancel=()=>{
    if(finished)return;
    finished=true;
    scene.tweens.killTweensOf(progress);
    drawing.destroy();
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN,cancel);
  };
  const progress={value:0};
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,cancel);
  scene.tweens.add({targets:progress,value:1,duration:reducedMotion?180:1100,
    onUpdate:()=>{
      const t=reducedMotion?1:Math.min(1,progress.value*3);
      const x=Phaser.Math.Linear(origin.x,target.x,t);
      const y=Phaser.Math.Linear(origin.y,target.y,t)-(reducedMotion?0:Math.sin(t*Math.PI)*22);
      drawing.clear();
      drawing.lineStyle(1.5,0xf9f5de,.9).lineBetween(origin.x,origin.y,x,y);
      drawing.lineStyle(2,0xadf8ed,.7).strokeEllipse(target.x,target.y+4,20,7);
      drawing.fillStyle(0xf9fbff).fillCircle(x,y,4);
      drawing.fillStyle(0xff7970).fillCircle(x,y-2,3);
      if(caught&&progress.value>.72){
        drawing.lineStyle(2,0xffe49b,1);
        drawing.lineBetween(x,y-12,x,y-21);
        drawing.fillStyle(0xffe49b).fillCircle(x,y-8,1.5);
      }
    },
    onComplete:()=>{cancel();complete();},
  });
}
