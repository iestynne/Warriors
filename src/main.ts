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

  // Create a simple button graphics. Use a white base fill so applying tint
  // results in the expected color rather than a shade of red.
  const button = new PIXI.Graphics();
  button.beginFill(0xffffff);
  button.drawRoundedRect(-50, -25, 100, 50, 10);
  button.endFill();
  // Start with a red tint to match the original look.
  button.tint = 0xff0000;
  button.x = app.renderer.width / 2;
  button.y = app.renderer.height / 2;
  button.pivot.set(0, 0);
  button.interactive = true;
  button.buttonMode = true;

  button.on('pointerdown', () => {
    // Randomize tint to a full RGB color each click
    button.tint = Math.floor(Math.random() * 0xffffff);
  });

  app.stage.addChild(button);

  window.addEventListener('resize', () => {
    button.x = app.renderer.width / 2;
    button.y = app.renderer.height / 2;
  });
}

start();
