import * as PIXI from 'pixi.js';

type TailColor = number | 'orangeStripes' | 'greyStripes';

type EyeColor = number | 'greenBlueSplit';

type CatColors = {
  ears: number;
  body: number;
  belly: number;
  muzzle: number;
  paws: number;
  tail: TailColor;
  tailTip: number;
  eyes: EyeColor;
  nose: number | 'halfBlackGrey';
};

type Accessory = 'none' | 'topHat' | 'necklace';

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

  let currentAccessory: Accessory = 'none';
  const savedAccessory = localStorage.getItem('catAccessory');
  if (savedAccessory === 'topHat' || savedAccessory === 'necklace' || savedAccessory === 'none') {
    currentAccessory = savedAccessory as Accessory;
  }

  // Container for the avatar model
  const avatarContainer = new PIXI.Container();

  function redrawCat(): void {
    if (currentCat) {
      avatarContainer.removeChild(currentCat);
      currentCat.destroy();
    }
    currentCat = createCat(currentColors, currentAccessory);
    avatarContainer.addChild(currentCat);
    positionAvatar();
  }

  function createCat(colors: CatColors, accessory: Accessory): PIXI.Container {
    const c = new PIXI.Container();
    c.sortableChildren = true;

    // Body split in two pieces so the hips appear wider than the chest
    const chest = new PIXI.Graphics();
    chest.beginFill(colors.body);
    chest.drawEllipse(0, 25, 30, 40); // narrower upper torso
    chest.endFill();
    c.addChild(chest);

    const hips = new PIXI.Graphics();
    hips.beginFill(colors.body);
    hips.drawEllipse(0, 65, 45, 50); // wider lower body
    hips.endFill();
    c.addChild(hips);

    // Belly sits over both body segments
    const belly = new PIXI.Graphics();
    belly.beginFill(colors.belly);
    belly.drawEllipse(0, 60, 35, 45);
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

    // Front legs tilt inward with a constant width
    const legLeft = new PIXI.Graphics();
    legLeft.beginFill(colors.body);
    // Shift the bottom of the leg toward the center without tapering
    legLeft.drawPolygon([
      -28, 55, // top outer
      -23, 115, // bottom outer shifted right
      -7, 115, // bottom inner shifted right
      -12, 55, // top inner
    ]);
    legLeft.endFill();
    c.addChild(legLeft);

    const legRight = new PIXI.Graphics();
    legRight.beginFill(colors.body);
    legRight.drawPolygon([
      12, 55, // top inner
      7, 115, // bottom inner shifted left
      23, 115, // bottom outer shifted left
      28, 55, // top outer
    ]);
    legRight.endFill();
    c.addChild(legRight);

    // Front paws face outward so the pads sit slightly outside the legs
    const pawLeft = new PIXI.Graphics();
    pawLeft.beginFill(colors.paws);
    pawLeft.drawEllipse(0, 0, 15, 8);
    pawLeft.endFill();
    pawLeft.position.set(-20, 120);
    c.addChild(pawLeft);

    const pawRight = new PIXI.Graphics();
    pawRight.beginFill(colors.paws);
    pawRight.drawEllipse(0, 0, 15, 8);
    pawRight.endFill();
    pawRight.position.set(20, 120);
    c.addChild(pawRight);

    // Toe pads for front paws
    const pawPadColor = 0xeeeeee;
    const pawLeftPads = new PIXI.Graphics();
    pawLeftPads.beginFill(pawPadColor);
    pawLeftPads.drawCircle(-5, 0, 3);
    pawLeftPads.drawCircle(0, -2, 3);
    pawLeftPads.drawCircle(5, 0, 3);
    pawLeftPads.endFill();
    pawLeftPads.position.x = -4; // shift pads outward for a turned-out paw
    pawLeft.addChild(pawLeftPads);

    const pawRightPads = new PIXI.Graphics();
    pawRightPads.beginFill(pawPadColor);
    pawRightPads.drawCircle(-5, 0, 3);
    pawRightPads.drawCircle(0, -2, 3);
    pawRightPads.drawCircle(5, 0, 3);
    pawRightPads.endFill();
    pawRightPads.position.x = 4; // shift pads outward for a turned-out paw
    pawRight.addChild(pawRightPads);

    // Tail drawn behind the body, lying on the ground with a curl
    const tailBase = new PIXI.Graphics();
    let tailColor: number = 0xffffff;
    if (typeof colors.tail === 'number') {
      tailColor = colors.tail;
    } else if (colors.tail === 'orangeStripes') {
      tailColor = 0xff9900;
    } else if (colors.tail === 'greyStripes') {
      tailColor = 0xcccccc;
    }
    tailBase.beginFill(tailColor);
    tailBase.drawRoundedRect(30, 96, 60, 8, 4);
    tailBase.endFill();
    tailBase.zIndex = -1;
    c.addChild(tailBase);

    if (colors.tail === 'orangeStripes' || colors.tail === 'greyStripes') {
      const stripeColor = colors.tail === 'orangeStripes' ? 0x000000 : 0x555555;
      const stripe = new PIXI.Graphics();
      stripe.beginFill(stripeColor);
      for (let i = 0; i < 60; i += 12) {
        stripe.drawRect(30 + i, 96, 6, 8);
      }
      stripe.endFill();
      stripe.zIndex = -1;
      c.addChild(stripe);
    }

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

    // Eye colors may be a single color or split green/blue
    let leftEyeColor = 0x00ff00;
    let rightEyeColor = 0x00ff00;
    if (typeof colors.eyes === 'number') {
      leftEyeColor = rightEyeColor = colors.eyes;
    } else if (colors.eyes === 'greenBlueSplit') {
      leftEyeColor = 0x00ff00;
      rightEyeColor = 0x66ccff;
    }

    const leftEye = new PIXI.Graphics();
    leftEye.beginFill(leftEyeColor);
    leftEye.drawCircle(-12, -5, 6);
    leftEye.endFill();
    head.addChild(leftEye);

    const rightEye = new PIXI.Graphics();
    rightEye.beginFill(rightEyeColor);
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

    if (accessory === 'topHat') {
      const hat = new PIXI.Graphics();
      hat.beginFill(0x000000);
      // Tapered top hat that is slightly taller
      hat.drawPolygon([
        -18, -35, // bottom left
        -22, -75, // top left (wider at the top)
        22, -75, // top right
        18, -35, // bottom right
      ]);
      // Thinner brim that extends a bit wider
      hat.drawRect(-35, -35, 70, 6);
      hat.endFill();
      hat.zIndex = 12;
      head.addChild(hat);
    } else if (accessory === 'necklace') {
      const necklace = new PIXI.Container();
      const beads = 12;
      const a = 20;
      const baseY = 25;
      for (let i = 0; i <= beads; i++) {
        const t = (i / beads) * 2 - 1;
        const x = t * 28;
        const y = baseY - a * (Math.cosh(x / a) - 1);
        const bead = new PIXI.Graphics();
        bead.beginFill(0xffd700);
        bead.drawCircle(x, y, 3);
        bead.endFill();
        necklace.addChild(bead);
      }
      necklace.zIndex = 12;
      c.addChild(necklace);
    }

    // Word bubble that occasionally displays "meow!"
    // Word bubble and connector that display "meow!" from random spots
    const bubble = new PIXI.Container();
    bubble.visible = false;
    bubble.zIndex = 20;

    // Line from the head to the word bubble so it's clear who's speaking
    const bubbleConnector = new PIXI.Graphics();
    bubbleConnector.visible = false;
    bubbleConnector.zIndex = 19; // slightly behind the bubble
    head.addChild(bubbleConnector);

    const bubbleShape = new PIXI.Graphics();
    bubbleShape.setStrokeStyle({ width: 2, color: 0x000000 });
    bubbleShape.beginFill(0xffffff);
    bubbleShape.drawRoundedRect(-25, 0, 50, 20, 10);
    bubbleShape.endFill();
    bubbleShape.stroke();
    bubble.addChild(bubbleShape);

    const bubbleText = new PIXI.Text('meow!', {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x000000,
    });
    bubbleText.anchor.set(0.5);
    bubbleText.position.set(0, 10);
    bubble.addChild(bubbleText);

    head.addChild(bubble);

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    // Random ear twitches add some life to the cat. Either ear may move
    // slightly for a brief moment.
    function scheduleEarTwitch(): void {
      const delay = 2000 + Math.random() * 6000;
      const t = setTimeout(() => {
        const ear = Math.random() < 0.5 ? earLeft : earRight;
        ear.rotation = (Math.random() - 0.5) * 0.6;
        const r = setTimeout(() => {
          ear.rotation = 0;
          scheduleEarTwitch();
        }, 150);
        timeouts.push(r);
      }, delay);
      timeouts.push(t);
    }

    // Whiskers occasionally twitch by rotating them slightly.
    function scheduleWhiskerTwitch(): void {
      const delay = 1500 + Math.random() * 5000;
      const t = setTimeout(() => {
        whiskers.rotation = (Math.random() - 0.5) * 0.4;
        const r = setTimeout(() => {
          whiskers.rotation = 0;
          scheduleWhiskerTwitch();
        }, 150);
        timeouts.push(r);
      }, delay);
      timeouts.push(t);
    }

    // The tip of the tail flicks upward every so often.
    const tailTipBaseY = tailTip.y;
    function scheduleTailFlick(): void {
      const delay = 4000 + Math.random() * 6000;
      const t = setTimeout(() => {
        tailTip.y = tailTipBaseY - 12;
        const r = setTimeout(() => {
          tailTip.y = tailTipBaseY;
          scheduleTailFlick();
        }, 150);
        timeouts.push(r);
      }, delay);
      timeouts.push(t);
    }

    // Eyes briefly scale to simulate a blink.
    function scheduleBlink(): void {
      const delay = 2500 + Math.random() * 5000;
      const t = setTimeout(() => {
        leftEye.scale.y = rightEye.scale.y = 0.1;
        leftEyeShade.scale.y = rightEyeShade.scale.y = 0.1;
        pupilLeft.scale.y = pupilRight.scale.y = 0.1;
        const r = setTimeout(() => {
          leftEye.scale.y = rightEye.scale.y = 1;
          leftEyeShade.scale.y = rightEyeShade.scale.y = 1;
          pupilLeft.scale.y = pupilRight.scale.y = 1;
          scheduleBlink();
        }, 120);
        timeouts.push(r);
      }, delay);
      timeouts.push(t);
    }

    // Pupils move slightly to look around.
    function scheduleEyeLook(): void {
      const delay = 1800 + Math.random() * 4000;
      const t = setTimeout(() => {
        const ox = (Math.random() - 0.5) * 4;
        const oy = (Math.random() - 0.5) * 2;
        pupilLeft.position.set(ox, oy);
        pupilRight.position.set(ox, oy);
        const r = setTimeout(() => {
          pupilLeft.position.set(0, 0);
          pupilRight.position.set(0, 0);
          scheduleEyeLook();
        }, 800);
        timeouts.push(r);
      }, delay);
      timeouts.push(t);
    }

    // Paw whack animation broken into three stages so the motion reads better.
    // The paw enlarges as it swings forward and a starburst highlights the text.

    // Text announcing the whack. Placed inside a container with a starburst so
    // both can be shown/hidden together.
    const whackEffect = new PIXI.Container();
    whackEffect.visible = false;
    c.addChild(whackEffect);

    const starburst = new PIXI.Graphics();
    starburst.beginFill(0xffff66);
    const starPoints: number[] = [];
    const rays = 8;
    const outerR = 20;
    const innerR = 8;
    for (let i = 0; i < rays * 2; i++) {
      const angle = (Math.PI * i) / rays;
      const r = i % 2 === 0 ? outerR : innerR;
      starPoints.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    starburst.drawPolygon(starPoints);
    starburst.endFill();
    whackEffect.addChild(starburst);

    const pawWhackText = new PIXI.Text('WHACK!', {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xff0000,
      fontWeight: 'bold',
    });
    pawWhackText.anchor.set(0.5);
    whackEffect.addChild(pawWhackText);

    const pawRightBaseY = pawRight.y;
    const pawRightBaseScale = pawRight.scale.x;
    function scheduleWhack(): void {
      const delay = 5000 + Math.random() * 7000;
      const t = setTimeout(() => {
        // Stage 1: lift the paw slightly before the strike
        pawRight.y = pawRightBaseY - 25;
        const stage2 = setTimeout(() => {
          // Stage 2: paw comes forward and enlarges for emphasis
          pawRight.y = pawRightBaseY - 40;
          pawRight.scale.set(pawRightBaseScale * 1.3);
          whackEffect.position.set(pawRight.x + 30, pawRight.y - 20);
          whackEffect.visible = true;
          const stage3 = setTimeout(() => {
            // Stage 3: return to normal
            pawRight.scale.set(pawRightBaseScale);
            pawRight.y = pawRightBaseY;
            whackEffect.visible = false;
            scheduleWhack();
          }, 500); // hold the whack on screen longer
          timeouts.push(stage3);
        }, 200);
        timeouts.push(stage2);
      }, delay);
      timeouts.push(t);
    }
    function scheduleMeow(): void {
      const delay = 3000 + Math.random() * 7000;
      const show = setTimeout(() => {
        // Randomize bubble position mostly to the left or right of the head
        // so the bubble doesn't appear above or below the cat.
        const side = Math.random() < 0.5 ? 0 : Math.PI; // choose right or left
        const angleOffset = (Math.random() - 0.5) * (Math.PI / 2); // up/down tilt
        const angle = side + angleOffset;
        const radius = 70;
        bubble.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius);

        // Draw the connector line from the head to the bubble
        bubbleConnector.visible = true;
        bubbleConnector.clear();
        bubbleConnector.setStrokeStyle({ width: 2, color: 0x000000 });
        // Attach the connector line to the mouth instead of the nose so
        // it's clear that the "meow" comes from the cat's mouth.
        bubbleConnector.moveTo(0, 14);
        bubbleConnector.lineTo(bubble.position.x, bubble.position.y);
        bubbleConnector.stroke();

        bubble.visible = true;
        const hide = setTimeout(() => {
          bubble.visible = false;
          bubbleConnector.visible = false;
          scheduleMeow();
        }, 1000);
        timeouts.push(hide);
      }, delay);
      timeouts.push(show);
    }
    scheduleMeow();
    scheduleEarTwitch();
    scheduleWhiskerTwitch();
    scheduleTailFlick();
    scheduleBlink();
    scheduleEyeLook();
    scheduleWhack();

    c.on('destroyed', () => {
      for (const t of timeouts) clearTimeout(t);
    });

    return c;
  }

  function applyPartColor(
    part: keyof CatColors,
    color: number | 'halfBlackGrey' | 'orangeStripes' | 'greyStripes' | 'greenBlueSplit'
  ): void {
    (currentColors as any)[part] = color;

    localStorage.setItem('catColors', JSON.stringify(currentColors));

    if (currentColors.belly === currentColors.body) {
      currentColors.belly = shadeColor(currentColors.body, 0.2);
    }

    if (currentCat) {
      redrawCat();
    }
  }

  let currentCat: PIXI.Container | null = null;

  function showCharacterCreator(): void {
    buttonBar.style.display = 'none';
    doneBtn.style.display = 'block';
    colorButtonsDiv.style.display = 'flex';

    if (!currentCat) {
      currentCat = createCat(currentColors, currentAccessory);
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
      let color: number | 'halfBlackGrey' | 'orangeStripes' | 'greyStripes' | 'greenBlueSplit' | null = null;
      if (special === 'halfBlackGrey') {
        color = 'halfBlackGrey';
      } else if (special === 'orangeStripes') {
        color = 'orangeStripes';
      } else if (special === 'greyStripes') {
        color = 'greyStripes';
      } else if (special === 'greenBlueSplit') {
        color = 'greenBlueSplit';
      } else if (colorStr) {
        color = parseInt(colorStr.replace('#', ''), 16);
      }
      if (part && color !== null) {
        applyPartColor(part, color);
      }
    });
  });

  const accessoryRadios = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[name="accessory"]')
  );
  accessoryRadios.forEach((r) => {
    if (r.value === currentAccessory) {
      r.checked = true;
    }
    r.addEventListener('change', () => {
      if (r.checked) {
        currentAccessory = r.value as Accessory;
        localStorage.setItem('catAccessory', currentAccessory);
        if (currentCat) {
          redrawCat();
        }
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
