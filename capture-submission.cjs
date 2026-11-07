const fs = require('node:fs');

(async () => {
  const targets = await (await fetch('http://127.0.0.1:9223/json')).json();
  const target = targets.find(item => item.type === 'page');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const jobs = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const job = jobs.get(message.id);
    jobs.delete(message.id);
    message.error ? job.reject(message.error) : job.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    jobs.set(++id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable');
  for (const [name, width, height] of [['desktop', 1920, 1080], ['mobile', 375, 812]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 });
    await send('Page.navigate', { url: `http://127.0.0.1:8004/?capture=${Date.now()}` });
    await new Promise(resolve => setTimeout(resolve, 900));
    const result = await send('Runtime.evaluate', { expression: 'JSON.stringify({width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth})', returnByValue: true });
    console.log(name, result.result.value);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width, height, scale: 1 } });
    fs.writeFileSync(`submission/${name}.png`, Buffer.from(shot.data, 'base64'));
  }
  await send('Browser.close');
  socket.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
