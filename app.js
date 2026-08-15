(() => {
  'use strict';

  const STAGE_W = 3840;
  const STAGE_H = 804;
  const TIMEZONE = 'Australia/Melbourne';

  const viewport = document.getElementById('viewport');
  const stage = document.getElementById('stage');
  const timeEl = document.getElementById('time');
  const dateEl = document.getElementById('date');
  const secondReadout = document.getElementById('secondReadout');
  const field = document.getElementById('secondsField');

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
  let lastMinuteKey = '';
  let timer = 0;

  function buildField() {
    const fragment = document.createDocumentFragment();

    for (let groupIndex = 0; groupIndex < 6; groupIndex += 1) {
      const group = document.createElement('div');
      group.className = 'second-group';

      for (let itemIndex = 0; itemIndex < 10; itemIndex += 1) {
        const tick = document.createElement('div');
        tick.className = 'tick';
        tick.style.setProperty('--level', String(itemIndex));
        tick.setAttribute('aria-hidden', 'true');
        group.appendChild(tick);
        ticks.push(tick);
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

  function renderInitialField(second) {
    for (let i = 0; i < ticks.length; i += 1) {
      ticks[i].classList.remove('past', 'current');
      if (i < second) ticks[i].classList.add('past');
      if (i === second) ticks[i].classList.add('current');
    }
  }

  function advanceField(second) {
    if (lastSecond < 0) {
      renderInitialField(second);
      return;
    }

    if (second === 0 || second < lastSecond) {
      for (let i = 0; i < ticks.length; i += 1) {
        ticks[i].classList.remove('past', 'current');
      }
      ticks[0].classList.add('current');
      return;
    }

    if (lastSecond >= 0 && lastSecond < ticks.length) {
      ticks[lastSecond].classList.remove('current');
      ticks[lastSecond].classList.add('past');
    }

    if (second >= 0 && second < ticks.length) {
      ticks[second].classList.remove('past');
      ticks[second].classList.add('current');
    }
  }

  function renderClock() {
    const now = new Date();
    const parts = getMelbourneParts(now);
    const minuteKey = `${parts.hour}:${parts.minute}`;

    if (minuteKey !== lastMinuteKey) {
      timeEl.textContent = minuteKey;
      dateEl.textContent = dateFormatter.format(now).toUpperCase();
      lastMinuteKey = minuteKey;
    }

    if (parts.secondNumber !== lastSecond) {
      advanceField(parts.secondNumber);
      secondReadout.textContent = `${String(parts.secondNumber).padStart(2, '0')} / 60`;
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
