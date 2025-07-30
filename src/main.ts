import * as PIXI from 'pixi.js';

// PixiJS v8 requires an explicit initialization step. Wrap the setup in an
// async function so we can await `app.init()` without using top-level await.
async function start(): Promise<void> {
  const app = new PIXI.Application();
  await app.init({
    view: document.getElementById('game-canvas') as HTMLCanvasElement,
    resizeTo: window,
    backgroundColor: 0x1099bb,
  });

  // Create a simple button graphics
  const button = new PIXI.Graphics();
  button.beginFill(0xff0000);
  button.drawRoundedRect(-50, -25, 100, 50, 10);
  button.endFill();
  button.x = app.renderer.width / 2;
  button.y = app.renderer.height / 2;
  button.pivot.set(0, 0);
  button.interactive = true;
  button.buttonMode = true;

  button.on('pointerdown', () => {
    button.tint = Math.random() * 0xffffff;
  });

  app.stage.addChild(button);

  window.addEventListener('resize', () => {
    button.x = app.renderer.width / 2;
    button.y = app.renderer.height / 2;
  });
}

start();
