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

  // Helper to create a pine tree graphic. The "x" argument represents the
  // horizontal center of the tree and "y" is the bottom of the tree. The tree
  // is drawn using only green leaves with a couple of zig-zags for a slightly
  // more detailed look.
  function createPineTree(x: number, y: number, width: number, height: number): PIXI.Graphics {
    const g = new PIXI.Graphics();
    g.beginFill(0x228b22);
    // Draw a canopy with a couple of zig-zags. The polygon is scaled based on
    // the provided width and height so the trees can fill the screen evenly.
    const halfW = width / 2;
    const zig = width / 5; // size of the zig-zag inset
    g.drawPolygon([
      -halfW, 0,
      -halfW + zig, -height * 0.3,
      -halfW + zig * 0.5, -height * 0.3,
      0, -height,
      halfW - zig * 0.5, -height * 0.3,
      halfW - zig, -height * 0.3,
      halfW, 0,
    ]);
    g.endFill();

    // Position the tree so that (x, y) corresponds to the bottom center
    g.position.set(x, y);
    return g;
  }

  // Create five trees that span the width of the canvas and sit along the
  // bottom edge of the screen.
  const numTrees = 5;
  const spacing = app.screen.width / numTrees;
  const treeWidth = spacing; // fill the available width
  const treeHeight = treeWidth * 1.8; // proportionally tall
  for (let i = 0; i < numTrees; i++) {
    const x = spacing * (i + 0.5);
    const tree = createPineTree(x, app.screen.height, treeWidth, treeHeight);
    app.stage.addChild(tree);
  }

}

start();
