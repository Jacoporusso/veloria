import {test,expect} from '@playwright/test';
for(const key of ['Enter','Space']) {
  test('opening the completion with '+key+' requires a fresh dismissal',async({page})=>{
    await page.route('**/src/main.ts*',route=>route.fulfill({contentType:'text/javascript',body:'export {};'}));
    await page.goto('/');
    await page.evaluate(async()=>{
      const {showPrologueCompletion}=await import('/src/game/ui/PrologueCompletion.ts' as string);
      const {newGameSave}=await import('/src/persistence/save-store.ts' as string);
      document.body.innerHTML='<button id="finish">Termina prova</button>';
      const button=document.querySelector<HTMLButtonElement>('#finish')!;
      button.addEventListener('keydown',event=>{
        if(event.key!=='Enter'&&event.key!==' ')return;
        void showPrologueCompletion(newGameSave(),event.key).then(()=>{(window as any).completionClosed=true;});
      },{once:true});
      button.focus();
    });
    await page.keyboard.down(key);
    await expect(page.getByRole('dialog',{name:'Primo capitolo completato'})).toBeVisible();
    expect(await page.evaluate(()=>(window as any).completionClosed??false)).toBe(false);
    await page.keyboard.up(key);
    const close=page.getByRole('button',{name:'Continua a esplorare'});
    await expect(close).toBeFocused();
    await page.keyboard.press('Enter',{delay:40});
    await expect(close).toHaveCount(0);
    await expect.poll(()=>page.evaluate(()=>(window as any).completionClosed)).toBe(true);
  });
}
