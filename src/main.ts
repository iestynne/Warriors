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

  // Helper to create a simple pine tree using PIXI.Graphics
  function createPineTree(x: number, y: number): PIXI.Graphics {
    const g = new PIXI.Graphics();
    // Draw the green pine canopy as a triangle
    g.beginFill(0x228b22);
    g.drawPolygon([0, 0, 25, -40, 50, 0]);
    g.endFill();
    // Draw the brown trunk
    g.beginFill(0x8b4513);
    g.drawRect(20, 0, 10, 20);
    g.endFill();
    g.x = x;
    g.y = y;
    return g;
  }

  // Position a few trees near the top of the screen, below the buttons
  const treePositions = [60, 160, 260, 360];
  treePositions.forEach((x) => {
    const tree = createPineTree(x, 70);
    app.stage.addChild(tree);
  });

}

start();
