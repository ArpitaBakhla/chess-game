(function(root){
  "use strict";

  function createClock(timeControl){
    const config = {
      label: timeControl || 'unlimited',
      initialSeconds: 300,
      incrementSeconds: 0
    };

    if (timeControl === '5|3') {
      config.initialSeconds = 300;
      config.incrementSeconds = 3;
    } else if (timeControl === '10|0') {
      config.initialSeconds = 600;
      config.incrementSeconds = 0;
    } else {
      config.initialSeconds = null;
      config.incrementSeconds = 0;
    }

    return {
      config,
      active: Boolean(config.initialSeconds),
      time: { w: config.initialSeconds, b: config.initialSeconds }
    };
  }

  function formatTime(seconds){
    if (seconds === null || seconds === undefined) return '—';
    const safe = Math.max(0, seconds);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function applyIncrement(clockState, side){
    if (!clockState || !clockState.active || clockState.config.initialSeconds === null) return;
    const increment = clockState.config.incrementSeconds || 0;
    if (increment > 0) {
      clockState.time[side] = Math.min(clockState.config.initialSeconds, (clockState.time[side] || 0) + increment);
    }
  }

  root.LocalClock = { createClock, formatTime, applyIncrement };
})(window);
