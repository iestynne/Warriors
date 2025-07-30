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

  const trees: PIXI.Graphics[] = [];

  function drawTrees(): void {
    for (const t of trees) {
      t.destroy();
    }
    trees.length = 0;

    const numTrees = 5;
    const spacing = app.screen.width / numTrees;
    const treeWidth = spacing;
    const treeHeight = treeWidth * 1.8;
    for (let i = 0; i < numTrees; i++) {
      const x = spacing * (i + 0.5);
      const tree = createPineTree(x, app.screen.height, treeWidth, treeHeight);
      trees.push(tree);
      app.stage.addChild(tree);
    }
  }

  // Draw the initial trees and update them whenever the renderer size changes.
  drawTrees();
  app.renderer.on('resize', drawTrees);

  // --- Character creator elements ---
  const buttonBar = document.getElementById('button-bar') as HTMLDivElement;
  const createAvatarBtn = document.getElementById(
    'create-avatar-btn'
  ) as HTMLButtonElement;
  const doneBtn = document.getElementById('done-btn') as HTMLButtonElement;

  // Container for the avatar model
  const avatarContainer = new PIXI.Container();

  function createCat(): PIXI.Container {
    const c = new PIXI.Container();

    // Body (ellipse to fake a 3D look)
    const body = new PIXI.Graphics();
    body.beginFill(0xffffff);
    body.drawEllipse(0, 40, 45, 65);
    body.endFill();
    c.addChild(body);

    // Paws
    const pawLeft = new PIXI.Graphics();
    pawLeft.beginFill(0xffffff);
    pawLeft.drawEllipse(-20, 105, 15, 8);
    pawLeft.endFill();
    c.addChild(pawLeft);

    const pawRight = new PIXI.Graphics();
    pawRight.beginFill(0xffffff);
    pawRight.drawEllipse(20, 105, 15, 8);
    pawRight.endFill();
    c.addChild(pawRight);

    // Tail
    const tail = new PIXI.Graphics();
    tail.beginFill(0xffffff);
    tail.drawEllipse(60, 90, 25, 10);
    tail.endFill();
    c.addChild(tail);

    // Head
    const head = new PIXI.Graphics();
    head.beginFill(0xffffff);
    head.drawCircle(0, 0, 35);
    head.endFill();
    head.y = -20;
    c.addChild(head);

    // Ears
    const earLeft = new PIXI.Graphics();
    earLeft.beginFill(0xffffff);
    earLeft.drawPolygon([-20, -35, -10, -65, 0, -35]);
    earLeft.endFill();
    head.addChild(earLeft);

    const earLeftInner = new PIXI.Graphics();
    earLeftInner.beginFill(0xcccccc);
    earLeftInner.drawPolygon([-18, -38, -10, -60, -2, -38]);
    earLeftInner.endFill();
    earLeft.addChild(earLeftInner);

    const earRight = new PIXI.Graphics();
    earRight.beginFill(0xffffff);
    earRight.drawPolygon([20, -35, 10, -65, 0, -35]);
    earRight.endFill();
    head.addChild(earRight);

    const earRightInner = new PIXI.Graphics();
    earRightInner.beginFill(0xcccccc);
    earRightInner.drawPolygon([18, -38, 10, -60, 2, -38]);
    earRightInner.endFill();
    earRight.addChild(earRightInner);

    // Eyes with shading
    const leftEyeShade = new PIXI.Graphics();
    leftEyeShade.beginFill(0xcccccc);
    leftEyeShade.drawCircle(-12, -5, 8);
    leftEyeShade.endFill();
    head.addChild(leftEyeShade);

    const rightEyeShade = new PIXI.Graphics();
    rightEyeShade.beginFill(0xcccccc);
    rightEyeShade.drawCircle(12, -5, 8);
    rightEyeShade.endFill();
    head.addChild(rightEyeShade);

    const leftEye = new PIXI.Graphics();
    leftEye.beginFill(0x00ff00);
    leftEye.drawCircle(-12, -5, 6);
    leftEye.endFill();
    head.addChild(leftEye);

    const rightEye = new PIXI.Graphics();
    rightEye.beginFill(0x00ff00);
    rightEye.drawCircle(12, -5, 6);
    rightEye.endFill();
    head.addChild(rightEye);

    // Muzzle area
    const muzzle = new PIXI.Graphics();
    muzzle.beginFill(0xcccccc);
    muzzle.drawEllipse(0, 10, 20, 15);
    muzzle.endFill();
    head.addChild(muzzle);

    // Nose
    const nose = new PIXI.Graphics();
    nose.beginFill(0x000000);
    nose.drawCircle(0, 5, 3);
    nose.endFill();
    head.addChild(nose);

    // Mouth
    const mouth = new PIXI.Graphics();
    mouth.lineStyle({ width: 2, color: 0x000000 });
    mouth.moveTo(0, 8);
    mouth.lineTo(0, 14);
    mouth.moveTo(0, 14);
    mouth.lineTo(-5, 18);
    mouth.moveTo(0, 14);
    mouth.lineTo(5, 18);
    head.addChild(mouth);

    // Whiskers
    const whiskers = new PIXI.Graphics();
    whiskers.lineStyle({ width: 2, color: 0x999999 });
    whiskers.moveTo(-20, 8);
    whiskers.lineTo(-40, 6);
    whiskers.moveTo(-20, 12);
    whiskers.lineTo(-40, 12);
    whiskers.moveTo(-20, 16);
    whiskers.lineTo(-40, 18);
    whiskers.moveTo(20, 8);
    whiskers.lineTo(40, 6);
    whiskers.moveTo(20, 12);
    whiskers.lineTo(40, 12);
    whiskers.moveTo(20, 16);
    whiskers.lineTo(40, 18);
    head.addChild(whiskers);

    return c;
  }

  let currentCat: PIXI.Container | null = null;

  function showCharacterCreator(): void {
    buttonBar.style.display = 'none';
    doneBtn.style.display = 'block';

    if (!currentCat) {
      currentCat = createCat();
      avatarContainer.addChild(currentCat);
      app.stage.addChild(avatarContainer);
    }

    positionAvatar();
  }

  function hideCharacterCreator(): void {
    buttonBar.style.display = 'flex';
    doneBtn.style.display = 'none';

    if (currentCat) {
      avatarContainer.removeChild(currentCat);
      app.stage.removeChild(avatarContainer);
      currentCat.destroy();
      currentCat = null;
    }
  }

  function positionAvatar(): void {
    if (!currentCat) return;
    currentCat.position.set(app.screen.width / 2, app.screen.height / 2);
  }

  createAvatarBtn.addEventListener('click', showCharacterCreator);
  doneBtn.addEventListener('click', hideCharacterCreator);

  app.renderer.on('resize', positionAvatar);

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

  // Initial draw and resize handling is above. Everything else can respond
  // automatically as the renderer resizes.

}

start();
