(() => {
  const panel = document.getElementById('place-panel');
  const content = document.getElementById('panel-content');
  const close = document.getElementById('panel-close');
  const intro = document.querySelector('.world-intro');
  const dockButtons = [...document.querySelectorAll('[data-place]')];
  const soundButton = document.getElementById('sound-toggle');
  const toast = document.getElementById('world-toast');
  let soundOn = true;
  let audioContext;
  let toastTimer;

  const fieldKey = 'matts-world-field-v1';
  const crops = {
    carrot: { icon: '🥕', label: 'Carrot', cost: 2, reward: 5 },
    berry: { icon: '🍓', label: 'Berry', cost: 3, reward: 7 },
    sunflower: { icon: '🌻', label: 'Sunflower', cost: 4, reward: 9 }
  };
  const freshField = () => ({ coins: 12, day: 1, selected: 'carrot', plots: Array.from({length:4},()=>({state:'empty',crop:null})) });
  let field = loadField();

  function loadField() {
    try {
      const value = JSON.parse(localStorage.getItem(fieldKey));
      if (value?.plots?.length === 4) return { ...freshField(), ...value };
    } catch (error) { console.warn('World field save could not be loaded.', error); }
    return freshField();
  }
  function saveField() {
    localStorage.setItem(fieldKey, JSON.stringify(field));
    document.getElementById('world-coins').textContent = field.coins;
    document.getElementById('world-day').textContent = String(field.day).padStart(2,'0');
  }

  function ding(frequency = 720, duration = .11) {
    if (!soundOn) return;
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.35, audioContext.currentTime + duration);
    gain.gain.setValueAtTime(.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.12, audioContext.currentTime + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  }

  function notify(text) {
    clearTimeout(toastTimer); toast.textContent = text; toast.classList.add('is-visible');
    toastTimer = setTimeout(()=>toast.classList.remove('is-visible'), 2200);
  }

  function enterWorld() {
    intro.classList.add('is-dismissed');
    dispatchEvent(new CustomEvent('farm-enter'));
    notify('Drag left or right to orbit the farm.');
    ding(540, .14);
  }

  function openPlace(place) {
    const template = document.getElementById(`${place}-panel`);
    if (!template) return;
    enterWorld();
    content.replaceChildren(template.content.cloneNode(true));
    panel.setAttribute('aria-hidden','false');
    dockButtons.forEach(button => button.setAttribute('aria-current', String(button.dataset.place === place)));
    dispatchEvent(new CustomEvent('farm-focus-place',{detail:{place}}));
    if (place === 'field') initialiseFieldPanel();
    content.querySelector('[data-open-field]')?.addEventListener('click',()=>openPlace('field'));
    close.focus({preventScroll:true}); ding(650, .1);
  }

  function closePanel() {
    panel.setAttribute('aria-hidden','true');
    dockButtons.forEach(button => button.removeAttribute('aria-current'));
    ding(410, .08);
  }

  function initialiseFieldPanel() {
    const plots = document.getElementById('world-plots');
    const instruction = document.getElementById('field-instruction');
    const seedButtons = [...content.querySelectorAll('[data-world-seed]')];
    function render() {
      seedButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.worldSeed===field.selected)));
      plots.replaceChildren();
      field.plots.forEach((plot,index)=>{
        const button=document.createElement('button');button.type='button';button.className='world-plot';button.dataset.state=plot.state;
        const crop=plot.crop?crops[plot.crop]:null;
        button.innerHTML=`${plot.state==='empty'?'＋':plot.state==='planted'?'🌱':plot.state==='watered'?'💧':crop.icon}<small>PLOT ${index+1} · ${plot.state.toUpperCase()}</small>`;
        button.setAttribute('aria-label',`Plot ${index+1}, ${plot.state}${crop?`, ${crop.label}`:''}`);
        button.addEventListener('click',()=>tend(index));plots.append(button);
      });
      saveField();
    }
    function tend(index) {
      const plot=field.plots[index];
      if(plot.state==='empty'){
        const crop=crops[field.selected];
        if(field.coins<crop.cost){instruction.textContent='You need more coins. Harvest a crop first.';notify('Not enough coins yet.');return;}
        field.coins-=crop.cost;plot.crop=field.selected;plot.state='planted';instruction.textContent=`${crop.label} planted. Click again to water it.`;ding(520,.09);
      }else if(plot.state==='planted'){plot.state='watered';instruction.textContent='Watered! Click once more to help it grow.';ding(680,.1);
      }else if(plot.state==='watered'){plot.state='ready';instruction.textContent='Your crop is ready. Collect the harvest!';ding(820,.15);
      }else{const crop=crops[plot.crop];field.coins+=crop.reward;field.day+=1;field.plots[index]={state:'empty',crop:null};instruction.textContent=`${crop.label} harvested! +${crop.reward} coins.`;notify(`${crop.icon} Harvest complete · +${crop.reward} coins`);ding(920,.18);}
      render();
    }
    seedButtons.forEach(button=>button.addEventListener('click',()=>{field.selected=button.dataset.worldSeed;instruction.textContent=`${crops[field.selected].label} selected · costs ${crops[field.selected].cost} coins.`;render();ding(600,.08);}));
    render();
  }

  dockButtons.forEach(button=>button.addEventListener('click',()=>openPlace(button.dataset.place)));
  addEventListener('farm-place-selected',event=>openPlace(event.detail.place));
  document.getElementById('world-start').addEventListener('click',enterWorld);
  close.addEventListener('click',closePanel);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel.getAttribute('aria-hidden')==='false')closePanel();});
  soundButton.addEventListener('click',()=>{
    soundOn=!soundOn;soundButton.setAttribute('aria-pressed',String(soundOn));soundButton.innerHTML=`<span>♪</span> Sound ${soundOn?'on':'off'}`;
    if(soundOn)ding(740,.12);
  });
  addEventListener('farm-camera-change',event=>{document.getElementById('angle-value').textContent=`${String(Math.round(event.detail.angle)).padStart(3,'0')}°`;});
  function updateClock(){document.getElementById('world-time').textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false});}
  updateClock();setInterval(updateClock,30000);saveField();
})();
