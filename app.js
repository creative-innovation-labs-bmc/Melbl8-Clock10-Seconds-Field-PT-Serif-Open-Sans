(() => {
  'use strict';

  const STAGE_W = 3840;
  const STAGE_H = 804;
  const TIMEZONE = 'Australia/Melbourne';
  const COLS = 12;
  const ROWS = 5;
  const TOTAL = COLS * ROWS;

  const VARIANTS = {
    a: 'MOSAIC SCAN',
    b: 'COLUMN BUILD',
    c: 'CENTRE OUT',
    d: 'DIAGONAL SWEEP'
  };

  const viewport = document.getElementById('viewport');
  const stage = document.getElementById('stage');
  const timeEl = document.getElementById('time');
  const dateEl = document.getElementById('date');
  const weekdayEl = document.getElementById('weekday');
  const secondReadout = document.getElementById('secondReadout');
  const variantName = document.getElementById('variantName');
  const revealGrid = document.getElementById('revealGrid');

  const requestedVariant = new URLSearchParams(window.location.search).get('variant');
  const variant = requestedVariant && VARIANTS[requestedVariant.toLowerCase()]
    ? requestedVariant.toLowerCase()
    : 'a';

  stage.dataset.variant = variant;
  variantName.textContent = VARIANTS[variant];

  const timeFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });

  const weekdayFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: TIMEZONE,
    weekday: 'long'
  });

  const dateFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const tiles = [];
  let revealOrder = [];
  let lastSecond = -1;
  let lastDay = '';
  let timer = 0;

  function buildTiles() {
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < TOTAL; i += 1) {
      const tile = document.createElement('div');
      tile.className = 'reveal-tile';
      tile.dataset.index = String(i);
      fragment.appendChild(tile);
      tiles.push(tile);
    }

    revealGrid.appendChild(fragment);
  }

  function gridPoint(index) {
    return {
      x: index % COLS,
      y: Math.floor(index / COLS),
      index
    };
  }

  function makeRevealOrder(mode) {
    const points = Array.from({ length: TOTAL }, (_, index) => gridPoint(index));

    if (mode === 'a') {
      const order = [];
      for (let y = 0; y < ROWS; y += 1) {
        if (y % 2 === 0) {
          for (let x = 0; x < COLS; x += 1) order.push(y * COLS + x);
        } else {
          for (let x = COLS - 1; x >= 0; x -= 1) order.push(y * COLS + x);
        }
      }
      return order;
    }

    if (mode === 'b') {
      points.sort((p1, p2) => {
        if (p1.x !== p2.x) return p1.x - p2.x;
        return p2.y - p1.y;
      });
      return points.map(point => point.index);
    }

    if (mode === 'c') {
      const cx = (COLS - 1) / 2;
      const cy = (ROWS - 1) / 2;
      points.sort((p1, p2) => {
        const dx1 = p1.x - cx;
        const dy1 = p1.y - cy;
        const dx2 = p2.x - cx;
        const dy2 = p2.y - cy;
        const d1 = (dx1 * dx1) + (dy1 * dy1);
        const d2 = (dx2 * dx2) + (dy2 * dy2);
        if (d1 !== d2) return d1 - d2;
        return p1.index - p2.index;
      });
      return points.map(point => point.index);
    }

    points.sort((p1, p2) => {
      const diagonal1 = p1.x + p1.y;
      const diagonal2 = p2.x + p2.y;
      if (diagonal1 !== diagonal2) return diagonal1 - diagonal2;
      return p2.y - p1.y;
    });
    return points.map(point => point.index);
  }

  function getMelbourneParts(date) {
    const parts = timeFormatter.formatToParts(date);
    let hour = '00';
    let minute = '00';
    let second = '00';

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (part.type === 'hour') hour = part.value;
      if (part.type === 'minute') minute = part.value;
      if (part.type === 'second') second = part.value;
    }

    return {
      hour,
      minute,
      second,
      secondNumber: Number(second)
    };
  }

  function measureWeekday() {
    const range = document.createRange();
    range.selectNodeContents(weekdayEl);
    const rect = range.getBoundingClientRect();
    if (typeof range.detach === 'function') range.detach();
    return rect;
  }

  function fitWeekday() {
    let low = 180;
    let high = 620;
    const maxWidth = 3490;
    const maxHeight = 455;

    while (high - low > 2) {
      const mid = Math.floor((low + high) / 2);
      weekdayEl.style.fontSize = `${mid}px`;
      const rect = measureWeekday();

      if (rect.width <= maxWidth && rect.height <= maxHeight) low = mid;
      else high = mid;
    }

    weekdayEl.style.fontSize = `${low}px`;
  }

  function resetGrid() {
    for (let i = 0; i < tiles.length; i += 1) {
      tiles[i].classList.remove('revealed', 'current');
    }
  }

  function setRevealState(second, instant) {
    const count = Math.min(TOTAL, second + 1);

    if (instant) revealGrid.classList.add('instant');

    for (let i = 0; i < TOTAL; i += 1) {
      const tile = tiles[revealOrder[i]];
      tile.classList.remove('current');
      if (i < count) tile.classList.add('revealed');
      else tile.classList.remove('revealed');
    }

    if (instant) {
      void revealGrid.offsetWidth;
      revealGrid.classList.remove('instant');
    }
  }

  function advanceReveal(second) {
    if (lastSecond < 0) {
      setRevealState(second, true);
      return;
    }

    if (second === 0 || second < lastSecond) {
      resetGrid();
      const firstTile = tiles[revealOrder[0]];
      firstTile.classList.add('current');
      window.setTimeout(() => {
        firstTile.classList.remove('current');
        firstTile.classList.add('revealed');
      }, 90);
      return;
    }

    const tile = tiles[revealOrder[second]];
    if (!tile) return;

    tile.classList.add('current');
    window.setTimeout(() => {
      tile.classList.remove('current');
      tile.classList.add('revealed');
    }, 90);
  }

  function updateDay(now) {
    const weekday = weekdayFormatter.format(now).toUpperCase();
    if (weekday === lastDay) return;

    weekdayEl.textContent = weekday;
    dateEl.textContent = dateFormatter.format(now).toUpperCase();
    lastDay = weekday;

    window.requestAnimationFrame(fitWeekday);
  }

  function renderClock() {
    const now = new Date();
    const parts = getMelbourneParts(now);

    timeEl.textContent = `${parts.hour}:${parts.minute}:${parts.second}`;
    updateDay(now);

    if (parts.secondNumber !== lastSecond) {
      advanceReveal(parts.secondNumber);
      secondReadout.textContent = `${parts.second} / 60`;
      lastSecond = parts.secondNumber;
    }

    window.clearTimeout(timer);
    const delay = Math.max(60, 1000 - (Date.now() % 1000) + 12);
    timer = window.setTimeout(renderClock, delay);
  }

  function scaleStage() {
    const vw = viewport.clientWidth || window.innerWidth;
    const vh = viewport.clientHeight || window.innerHeight;
    const scale = Math.min(vw / STAGE_W, vh / STAGE_H);
    const scaledW = STAGE_W * scale;
    const scaledH = STAGE_H * scale;

    stage.style.left = `${Math.round((vw - scaledW) / 2)}px`;
    stage.style.top = `${Math.round((vh - scaledH) / 2)}px`;
    stage.style.transform = `scale(${scale})`;
  }

  buildTiles();
  revealOrder = makeRevealOrder(variant);
  scaleStage();
  renderClock();

  window.addEventListener('resize', scaleStage, { passive: true });
  window.addEventListener('orientationchange', scaleStage, { passive: true });
})();
