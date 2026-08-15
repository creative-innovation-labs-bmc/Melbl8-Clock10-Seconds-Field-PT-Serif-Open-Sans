(() => {
  'use strict';

  const STAGE_W = 3840;
  const STAGE_H = 804;
  const TIMEZONE = 'Australia/Melbourne';
  const VARIANTS = {
    a: 'STAIR FIELD',
    b: 'EQUAL STEMS',
    c: 'CENTRE PULSE',
    d: 'WAVE FIELD'
  };

  const viewport = document.getElementById('viewport');
  const stage = document.getElementById('stage');
  const timeEl = document.getElementById('time');
  const dateEl = document.getElementById('date');
  const secondReadout = document.getElementById('secondReadout');
  const variantName = document.getElementById('variantName');
  const field = document.getElementById('secondsField');

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

  const dateFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const ticks = [];
  let lastSecond = -1;
  let lastDateKey = '';
  let timer = 0;
  let pulseTimer = 0;

  function buildField() {
    const fragment = document.createDocumentFragment();
    let globalIndex = 0;

    for (let groupIndex = 0; groupIndex < 6; groupIndex += 1) {
      const group = document.createElement('div');
      group.className = 'second-group';

      for (let itemIndex = 0; itemIndex < 10; itemIndex += 1) {
        const tick = document.createElement('div');
        tick.className = 'tick';
        tick.style.setProperty('--level', String(itemIndex));

        const wave = (Math.sin((globalIndex / 59) * Math.PI * 4 - Math.PI / 2) + 1) / 2;
        const waveHeight = Math.round(145 + wave * 300);
        tick.style.setProperty('--wave-h', `${waveHeight}px`);

        tick.setAttribute('aria-hidden', 'true');
        group.appendChild(tick);
        ticks.push(tick);
        globalIndex += 1;
      }

      fragment.appendChild(group);
    }

    field.appendChild(fragment);
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

  function pulseCurrent(tick) {
    if (variant !== 'c' || !tick) return;

    window.clearTimeout(pulseTimer);
    tick.classList.remove('pulse');
    void tick.offsetWidth;
    tick.classList.add('pulse');

    pulseTimer = window.setTimeout(() => {
      tick.classList.remove('pulse');
    }, 260);
  }

  function renderInitialField(second) {
    for (let i = 0; i < ticks.length; i += 1) {
      ticks[i].classList.remove('past', 'current', 'pulse');
      if (i < second) ticks[i].classList.add('past');
      if (i === second) ticks[i].classList.add('current');
    }
    pulseCurrent(ticks[second]);
  }

  function advanceField(second) {
    if (lastSecond < 0) {
      renderInitialField(second);
      return;
    }

    if (second === 0 || second < lastSecond) {
      for (let i = 0; i < ticks.length; i += 1) {
        ticks[i].classList.remove('past', 'current', 'pulse');
      }
      ticks[0].classList.add('current');
      pulseCurrent(ticks[0]);
      return;
    }

    if (lastSecond >= 0 && lastSecond < ticks.length) {
      ticks[lastSecond].classList.remove('current', 'pulse');
      ticks[lastSecond].classList.add('past');
    }

    if (second >= 0 && second < ticks.length) {
      ticks[second].classList.remove('past');
      ticks[second].classList.add('current');
      pulseCurrent(ticks[second]);
    }
  }

  function renderClock() {
    const now = new Date();
    const parts = getMelbourneParts(now);
    const fullTime = `${parts.hour}:${parts.minute}:${parts.second}`;
    const dateKey = `${parts.hour}:${parts.minute}:${dateFormatter.format(now)}`;

    timeEl.textContent = fullTime;

    if (dateKey !== lastDateKey) {
      dateEl.textContent = dateFormatter.format(now).toUpperCase();
      lastDateKey = dateKey;
    }

    if (parts.secondNumber !== lastSecond) {
      advanceField(parts.secondNumber);
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

  buildField();
  scaleStage();
  renderClock();

  window.addEventListener('resize', scaleStage, { passive: true });
  window.addEventListener('orientationchange', scaleStage, { passive: true });
})();
