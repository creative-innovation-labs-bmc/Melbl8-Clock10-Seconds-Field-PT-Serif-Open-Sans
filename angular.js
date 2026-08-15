(() => {
  'use strict';

  const STAGE_W = 3840;
  const STAGE_H = 804;
  const TIMEZONE = 'Australia/Melbourne';

  const DIGITS = {
    0: ['a','b','c','d','e','f'],
    1: ['b','c'],
    2: ['a','b','g','e','d'],
    3: ['a','b','c','d','g'],
    4: ['f','g','b','c'],
    5: ['a','f','g','c','d'],
    6: ['a','f','g','e','c','d'],
    7: ['a','b','c'],
    8: ['a','b','c','d','e','f','g'],
    9: ['a','b','c','d','f','g']
  };

  const SEGMENTS = [
    { id: 'a', cls: 'h segment-a', dir: 'left', modules: 3 },
    { id: 'b', cls: 'v segment-b', dir: 'up', modules: 2 },
    { id: 'c', cls: 'v segment-c', dir: 'down', modules: 2 },
    { id: 'd', cls: 'h segment-d', dir: 'right', modules: 3 },
    { id: 'e', cls: 'v segment-e', dir: 'down', modules: 2 },
    { id: 'f', cls: 'v segment-f', dir: 'up', modules: 2 },
    { id: 'g', cls: 'h segment-g', dir: 'right', modules: 3 }
  ];

  const TONES = ['#ffffff', '#dce3e0', '#bbc6c3', '#ffffff'];

  const viewport = document.getElementById('viewport');
  const stage = document.getElementById('stage');
  const timeDisplay = document.getElementById('timeDisplay');
  const weekdayEl = document.getElementById('weekday');
  const isBlueprint = Boolean(document.getElementById('blueprintRow'));
  const demoMode = new URLSearchParams(window.location.search).get('demo') === '1';

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

  function makeDigit(slotIndex = 0) {
    const digit = document.createElement('div');
    digit.className = 'digit';
    digit.dataset.value = '-1';

    SEGMENTS.forEach((spec, segmentIndex) => {
      const segment = document.createElement('div');
      segment.className = `segment ${spec.cls}`;
      segment.dataset.segment = spec.id;
      segment.dataset.dir = spec.dir;

      for (let i = 0; i < spec.modules; i += 1) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.setProperty('--tone', TONES[(slotIndex + segmentIndex + i) % TONES.length]);
        tile.style.setProperty('--delay', `${i * 24}ms`);
        segment.appendChild(tile);
      }
      digit.appendChild(segment);
    });
    return digit;
  }

  function makeColon() {
    const colon = document.createElement('div');
    colon.className = 'colon';
    colon.innerHTML = '<span class="colon-square"></span><span class="colon-square"></span>';
    return colon;
  }

  function getSegmentElement(digit, id) {
    return digit.querySelector(`[data-segment="${id}"]`);
  }

  function setSegmentState(segment, active, animate) {
    const tiles = [...segment.children];
    if (!animate) {
      tiles.forEach(tile => {
        tile.classList.toggle('active', active);
        tile.classList.remove('moving');
      });
      return;
    }

    tiles.forEach((tile, i) => {
      window.setTimeout(() => {
        tile.classList.add('moving');
        tile.classList.toggle('active', active);
        window.setTimeout(() => tile.classList.remove('moving'), 220);
      }, i * 22);
    });
  }

  function renderDigit(digit, value, animate = true) {
    const next = DIGITS[value];
    const previousValue = Number(digit.dataset.value);
    const previous = DIGITS[previousValue] || [];

    SEGMENTS.forEach(spec => {
      const wasActive = previous.includes(spec.id);
      const isActive = next.includes(spec.id);
      if (wasActive === isActive && previousValue >= 0) return;
      setSegmentState(getSegmentElement(digit, spec.id), isActive, animate && previousValue >= 0);
    });

    digit.dataset.value = String(value);
  }

  function buildClock() {
    const slots = [];
    for (let i = 0; i < 8; i += 1) {
      if (i === 2 || i === 5) {
        const colon = makeColon();
        timeDisplay.appendChild(colon);
        slots.push(colon);
      } else {
        const digit = makeDigit(i);
        timeDisplay.appendChild(digit);
        slots.push(digit);
      }
    }
    return slots;
  }

  function pulseColons(slots) {
    [2,5].forEach(index => {
      const colon = slots[index];
      colon.classList.add('tick');
      window.setTimeout(() => colon.classList.remove('tick'), 170);
    });
  }

  function getMelbourneParts(date) {
    const parts = timeFormatter.formatToParts(date);
    const values = { hour: '00', minute: '00', second: '00' };
    parts.forEach(part => {
      if (part.type in values) values[part.type] = part.value;
    });
    return values;
  }

  function buildBlueprint() {
    const row = document.getElementById('blueprintRow');
    for (let n = 0; n <= 9; n += 1) {
      const cell = document.createElement('div');
      cell.className = 'blueprint-cell';
      const wrap = document.createElement('div');
      wrap.className = 'blueprint-digit-wrap';
      const digit = makeDigit(n);
      wrap.appendChild(digit);
      cell.appendChild(wrap);
      const label = document.createElement('div');
      label.className = 'blueprint-label';
      label.textContent = String(n);
      cell.appendChild(label);
      row.appendChild(cell);
      renderDigit(digit, n, false);
    }
  }

  if (isBlueprint) {
    buildBlueprint();
    scaleStage();
  } else {
    const slots = buildClock();
    const digitSlotIndexes = [0,1,3,4,6,7];
    let lastText = '';
    let demoCounter = 0;

    function renderClock() {
      let hh = '12';
      let mm = '34';
      let ss = '56';
      let weekday = 'WEDNESDAY';

      if (demoMode) {
        const synthetic = demoCounter % 1000000;
        const str = String(synthetic).padStart(6, '0');
        hh = str.slice(0,2);
        mm = str.slice(2,4);
        ss = str.slice(4,6);
        demoCounter += 1;
      } else {
        const now = new Date();
        const parts = getMelbourneParts(now);
        hh = parts.hour;
        mm = parts.minute;
        ss = parts.second;
        weekday = weekdayFormatter.format(now).toUpperCase();
      }

      const nextText = `${hh}${mm}${ss}`;
      [...nextText].forEach((char, i) => {
        const slot = slots[digitSlotIndexes[i]];
        if (lastText[i] !== char) renderDigit(slot, Number(char), true);
      });

      weekdayEl.textContent = weekday;
      if (lastText && lastText !== nextText) pulseColons(slots);
      lastText = nextText;

      if (demoMode) {
        window.setTimeout(renderClock, 700);
      } else {
        const delay = Math.max(80, 1000 - (Date.now() % 1000) + 10);
        window.setTimeout(renderClock, delay);
      }
    }

    renderClock();
    scaleStage();
  }

  window.addEventListener('resize', scaleStage, { passive: true });
  window.addEventListener('orientationchange', scaleStage, { passive: true });
})();
