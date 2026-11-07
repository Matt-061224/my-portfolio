(() => {
  const storageKey = 'matts-pocket-farm-v1';
  const crops = {
    carrot: { label: 'Carrot', cost: 2, reward: 5, emoji: '🥕' },
    berry: { label: 'Berry', cost: 3, reward: 7, emoji: '🍓' },
    sunflower: { label: 'Sunflower', cost: 4, reward: 9, emoji: '🌻' }
  };
  const weathers = ['Sunny', 'Breezy', 'Cloudy', 'Golden'];
  const freshState = () => ({ coins: 12, harvested: 0, day: 1, weather: 'Sunny', selected: 'carrot', plots: Array.from({ length: 6 }, () => ({ state: 'empty', crop: null })) });
  let farm = load();
  let resetArmed = false;
  const grid = document.getElementById('plot-grid');
  const message = document.getElementById('game-message');

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && Array.isArray(saved.plots) && saved.plots.length === 6) return { ...freshState(), ...saved };
    } catch (error) { console.warn('Saved farm could not be read.', error); }
    return freshState();
  }
  function save() { localStorage.setItem(storageKey, JSON.stringify(farm)); }
  function speak(icon, title, detail) { message.innerHTML = `<span aria-hidden="true">${icon}</span><p><b>${title}</b><br>${detail}</p>`; }
  function render() {
    document.getElementById('coin-count').textContent = farm.coins;
    document.getElementById('harvest-count').textContent = farm.harvested;
    document.getElementById('farm-day').textContent = farm.day;
    document.getElementById('weather-label').textContent = farm.weather;
    document.querySelectorAll('[data-seed]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.seed === farm.selected)));
    grid.replaceChildren();
    farm.plots.forEach((plot, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'plot';
      button.dataset.state = plot.state;
      const crop = plot.crop ? crops[plot.crop] : null;
      const action = plot.state === 'empty' ? `Plant ${crops[farm.selected].label}` : plot.state === 'planted' ? 'Water crop' : plot.state === 'watered' ? 'Help crop grow' : 'Harvest crop';
      button.setAttribute('aria-label', `Plot ${index + 1}. ${plot.state === 'empty' ? 'Empty.' : `${crop.label}, ${plot.state}.`} ${action}.`);
      const plantClass = plot.state === 'planted' ? 'seed' : plot.state === 'watered' ? 'sprout' : `ready ${plot.crop}`;
      button.innerHTML = `<span class="plot-number">PLOT ${String(index + 1).padStart(2, '0')}</span>${plot.state !== 'empty' ? `<span class="crop-plant ${plantClass}" aria-hidden="true"></span><span class="crop-name">${plot.state === 'ready' ? `${crop.emoji} READY` : plot.state.toUpperCase()}</span>` : ''}`;
      button.addEventListener('click', () => tend(index));
      grid.append(button);
    });
    save();
  }
  function tend(index) {
    const plot = farm.plots[index];
    if (plot.state === 'empty') {
      const crop = crops[farm.selected];
      if (farm.coins < crop.cost) { speak('🪙', 'Not enough coins yet.', 'Harvest another crop or choose a cheaper seed.'); return; }
      farm.coins -= crop.cost; plot.crop = farm.selected; plot.state = 'planted';
      speak('🌱', `${crop.label} planted in plot ${index + 1}.`, 'Click this plot again to give it some water.');
    } else if (plot.state === 'planted') {
      plot.state = 'watered'; speak('💧', `Plot ${index + 1} is watered.`, 'One more visit will help the crop finish growing.');
    } else if (plot.state === 'watered') {
      plot.state = 'ready'; speak('✨', `${crops[plot.crop].label} is ready!`, 'Click the glowing plot to collect your harvest.');
    } else {
      const crop = crops[plot.crop];
      farm.coins += crop.reward; farm.harvested += 1; farm.day = Math.floor(farm.harvested / 3) + 1; farm.weather = weathers[farm.harvested % weathers.length];
      farm.plots[index] = { state: 'empty', crop: null };
      speak(crop.emoji, `${crop.label} harvested! +${crop.reward} coins.`, 'The plot is ready for another seed.');
    }
    resetArmed = false; render();
  }

  document.querySelectorAll('[data-seed]').forEach(button => button.addEventListener('click', () => {
    farm.selected = button.dataset.seed; resetArmed = false;
    speak(crops[farm.selected].emoji, `${crops[farm.selected].label} selected.`, `Planting costs ${crops[farm.selected].cost} coins.`); render();
  }));
  document.getElementById('reset-farm').addEventListener('click', event => {
    if (!resetArmed) {
      resetArmed = true; event.currentTarget.textContent = 'Click again to confirm reset';
      speak('⚠️', 'Reset the whole farm?', 'Click the reset button once more to start fresh.'); return;
    }
    farm = freshState(); resetArmed = false; event.currentTarget.textContent = 'Start a fresh farm ↻';
    speak('🌱', 'Fresh soil, fresh start.', 'Choose a seed and plant your first crop.'); render();
  });
  render();
})();
