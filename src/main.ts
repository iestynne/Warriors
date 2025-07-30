import * as PIXI from 'pixi.js';

type CatColors = {
  ears: number;
  body: number;
  belly: number;
  muzzle: number;
  paws: number;
  tail: number;
  tailTip: number;
  eyes: number;
  nose: number | 'halfBlackGrey';
};

function shadeColor(color: number, percent: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent);
  const nr = Math.round((t - r) * p) + r;
  const ng = Math.round((t - g) * p) + g;
  const nb = Math.round((t - b) * p) + b;
  return (nr << 16) + (ng << 8) + nb;
}

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
  const colorButtonsDiv = document.getElementById('color-buttons') as HTMLDivElement;
  const colorButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.color-btn')
  );

  const defaultColors: CatColors = {
    ears: 0xffffff,
    body: 0xffffff,
    belly: 0xffe4c4,
    muzzle: 0xcccccc,
    paws: 0xaaaaaa,
    tail: 0xffffff,
    tailTip: 0xffffff,
    eyes: 0x00ff00,
    nose: 0x000000,
  };

  let currentColors: CatColors = { ...defaultColors };
  const savedColors = localStorage.getItem('catColors');
  if (savedColors) {
    try {
      const parsed = JSON.parse(savedColors) as Partial<CatColors>;
      currentColors = { ...currentColors, ...parsed };
    } catch {
      /* ignore malformed saved data */
    }
  }

  // Container for the avatar model
  const avatarContainer = new PIXI.Container();

  function createCat(colors: CatColors): PIXI.Container {
    const c = new PIXI.Container();
    c.sortableChildren = true;

    // Body (ellipse to fake a 3D look)
    const body = new PIXI.Graphics();
    body.beginFill(colors.body);
    body.drawEllipse(0, 40, 45, 65);
    body.endFill();
    c.addChild(body);

    const belly = new PIXI.Graphics();
    belly.beginFill(colors.belly);
    belly.drawEllipse(0, 55, 35, 40);
    belly.endFill();
    c.addChild(belly);

    // Rear paws (drawn first so they appear behind the body)
    const rearPawLeft = new PIXI.Graphics();
    rearPawLeft.beginFill(colors.paws);
    rearPawLeft.drawEllipse(-25, 105, 15, 8);
    rearPawLeft.endFill();
    c.addChild(rearPawLeft);

    const rearPawRight = new PIXI.Graphics();
    rearPawRight.beginFill(colors.paws);
    rearPawRight.drawEllipse(25, 105, 15, 8);
    rearPawRight.endFill();
    c.addChild(rearPawRight);

    const rearPadColor = 0xcccccc;
    const rearLeftPads = new PIXI.Graphics();
    rearLeftPads.beginFill(rearPadColor);
    rearLeftPads.drawCircle(-30, 105, 3);
    rearLeftPads.drawCircle(-25, 103, 3);
    rearLeftPads.drawCircle(-20, 105, 3);
    rearLeftPads.endFill();
    c.addChild(rearLeftPads);

    const rearRightPads = new PIXI.Graphics();
    rearRightPads.beginFill(rearPadColor);
    rearRightPads.drawCircle(20, 105, 3);
    rearRightPads.drawCircle(25, 103, 3);
    rearRightPads.drawCircle(30, 105, 3);
    rearRightPads.endFill();
    c.addChild(rearRightPads);

    // Front legs
    const legLeft = new PIXI.Graphics();
    legLeft.beginFill(colors.body);
    legLeft.drawRect(-27, 55, 14, 60);
    legLeft.endFill();
    c.addChild(legLeft);

    const legRight = new PIXI.Graphics();
    legRight.beginFill(colors.body);
    legRight.drawRect(13, 55, 14, 60);
    legRight.endFill();
    c.addChild(legRight);

    // Front paws
    const pawLeft = new PIXI.Graphics();
    pawLeft.beginFill(colors.paws);
    pawLeft.drawEllipse(-20, 120, 15, 8);
    pawLeft.endFill();
    c.addChild(pawLeft);

    const pawRight = new PIXI.Graphics();
    pawRight.beginFill(colors.paws);
    pawRight.drawEllipse(20, 120, 15, 8);
    pawRight.endFill();
    c.addChild(pawRight);

    // Toe pads for front paws
    const pawPadColor = 0xeeeeee;
    const pawLeftPads = new PIXI.Graphics();
    pawLeftPads.beginFill(pawPadColor);
    pawLeftPads.drawCircle(-25, 120, 3);
    pawLeftPads.drawCircle(-20, 118, 3);
    pawLeftPads.drawCircle(-15, 120, 3);
    pawLeftPads.endFill();
    c.addChild(pawLeftPads);

    const pawRightPads = new PIXI.Graphics();
    pawRightPads.beginFill(pawPadColor);
    pawRightPads.drawCircle(15, 120, 3);
    pawRightPads.drawCircle(20, 118, 3);
    pawRightPads.drawCircle(25, 120, 3);
    pawRightPads.endFill();
    c.addChild(pawRightPads);

    // Tail drawn behind the body, lying on the ground with a curl
    const tailBase = new PIXI.Graphics();
    tailBase.beginFill(colors.tail);
    tailBase.drawRoundedRect(40, 96, 50, 8, 4);
    tailBase.endFill();
    tailBase.zIndex = -1;
    c.addChild(tailBase);

    const tailTip = new PIXI.Graphics();
    tailTip.beginFill(colors.tailTip);
    tailTip.drawRoundedRect(90, 96, 18, 8, 4);
    tailTip.endFill();
    tailTip.zIndex = -1;
    c.addChild(tailTip);

    // Head
    const head = new PIXI.Container();
    head.y = -20;
    head.sortableChildren = true;
    c.addChild(head);

    const headShape = new PIXI.Graphics();
    headShape.beginFill(colors.body);
    headShape.drawCircle(0, 0, 35);
    headShape.endFill();
    head.addChild(headShape);

    // Ears
    const earLeft = new PIXI.Graphics();
    earLeft.beginFill(colors.ears);
    earLeft.drawPolygon([-25, -25, -40, -55, -10, -30]);
    earLeft.endFill();
    head.addChild(earLeft);

    const earLeftInner = new PIXI.Graphics();
    earLeftInner.beginFill(0xcccccc);
    earLeftInner.drawPolygon([-23, -28, -35, -52, -12, -33]);
    earLeftInner.endFill();
    earLeft.addChild(earLeftInner);

    const earRight = new PIXI.Graphics();
    earRight.beginFill(colors.ears);
    earRight.drawPolygon([25, -25, 40, -55, 10, -30]);
    earRight.endFill();
    head.addChild(earRight);

    const earRightInner = new PIXI.Graphics();
    earRightInner.beginFill(0xcccccc);
    earRightInner.drawPolygon([23, -28, 35, -52, 12, -33]);
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
    leftEye.beginFill(colors.eyes);
    leftEye.drawCircle(-12, -5, 6);
    leftEye.endFill();
    head.addChild(leftEye);

    const rightEye = new PIXI.Graphics();
    rightEye.beginFill(colors.eyes);
    rightEye.drawCircle(12, -5, 6);
    rightEye.endFill();
    head.addChild(rightEye);

    // Vertical pupils
    const pupilLeft = new PIXI.Graphics();
    pupilLeft.beginFill(0x000000);
    pupilLeft.drawRect(-13, -10, 2, 10);
    pupilLeft.endFill();
    head.addChild(pupilLeft);

    const pupilRight = new PIXI.Graphics();
    pupilRight.beginFill(0x000000);
    pupilRight.drawRect(11, -10, 2, 10);
    pupilRight.endFill();
    head.addChild(pupilRight);

    // Muzzle area
    const muzzle = new PIXI.Graphics();
    muzzle.beginFill(colors.muzzle);
    muzzle.drawEllipse(0, 10, 20, 15);
    muzzle.endFill();
    head.addChild(muzzle);

    // Nose
    const nose = new PIXI.Graphics();
    if (colors.nose === 'halfBlackGrey') {
      nose.beginFill(0x000000);
      nose.moveTo(0, 5);
      nose.arc(0, 5, 3, Math.PI / 2, (3 * Math.PI) / 2);
      nose.closePath();
      nose.endFill();
      nose.beginFill(0x808080);
      nose.moveTo(0, 5);
      nose.arc(0, 5, 3, (3 * Math.PI) / 2, Math.PI / 2);
      nose.closePath();
      nose.endFill();
    } else {
      nose.beginFill(colors.nose as number);
      nose.drawCircle(0, 5, 3);
      nose.endFill();
    }
    head.addChild(nose);

    // Mouth
    const mouth = new PIXI.Graphics();
    mouth.setStrokeStyle({ width: 2, color: 0x000000 });
    mouth.moveTo(0, 8);
    mouth.lineTo(0, 14);
    mouth.moveTo(0, 14);
    mouth.lineTo(-5, 18);
    mouth.moveTo(0, 14);
    mouth.lineTo(5, 18);
    mouth.stroke();
    mouth.zIndex = 10;
    head.addChild(mouth);

    // Whiskers
    const whiskers = new PIXI.Graphics();
    whiskers.setStrokeStyle({ width: 2, color: 0x999999 });
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
    whiskers.stroke();
    whiskers.zIndex = 11;
    head.addChild(whiskers);

    return c;
  }

  function applyPartColor(part: keyof CatColors, color: number | 'halfBlackGrey'): void {
    (currentColors as any)[part] = color;

    localStorage.setItem('catColors', JSON.stringify(currentColors));

    if (currentColors.belly === currentColors.body) {
      currentColors.belly = shadeColor(currentColors.body, 0.2);
    }

    if (currentCat) {
      avatarContainer.removeChild(currentCat);
      currentCat.destroy();
      currentCat = createCat(currentColors);
      avatarContainer.addChild(currentCat);
      positionAvatar();
    }
  }

  let currentCat: PIXI.Container | null = null;

  function showCharacterCreator(): void {
    buttonBar.style.display = 'none';
    doneBtn.style.display = 'block';
    colorButtonsDiv.style.display = 'flex';

    if (!currentCat) {
      currentCat = createCat(currentColors);
      avatarContainer.addChild(currentCat);
      app.stage.addChild(avatarContainer);
    }

    positionAvatar();
  }

  function hideCharacterCreator(): void {
    buttonBar.style.display = 'flex';
    doneBtn.style.display = 'none';
    colorButtonsDiv.style.display = 'none';

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

  colorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const part = btn.dataset.part as keyof CatColors | undefined;
      const special = btn.dataset.special;
      const colorStr = btn.dataset.color;
      let color: number | 'halfBlackGrey' | null = null;
      if (special === 'halfBlackGrey') {
        color = 'halfBlackGrey';
      } else if (colorStr) {
        color = parseInt(colorStr.replace('#', ''), 16);
      }
      if (part && color !== null) {
        applyPartColor(part, color);
      }
    });
  });

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
