(() => {
  const canvas = document.getElementById('farm-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hint = document.getElementById('scene-hint');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const camera = { yaw: .48, targetYaw: .48, pitch: .53, zoom: 1 };
  const view = { width: 0, height: 0, dpr: 1, cx: 0, cy: 0, scale: 1 };
  const pointer = { down: false, moved: false, x: 0, y: 0, startX: 0, startY: 0, hover: null };
  const hotspots = [];
  let lastInteraction = performance.now();
  let entered = false;

  const palette = {
    ink: '#17291f', grass: '#75a850', grassLight: '#98c166', grassDark: '#4f7b3c',
    soil: '#88502f', soilDark: '#603a29', red: '#d6543d', redDark: '#a93c31',
    orange: '#ef8d3b', cream: '#fff7dc', wood: '#bd7541', woodDark: '#805033',
    sky: '#9ed9e9', skyLight: '#d7f0ef', water: '#58b9d4', yellow: '#ffd34f', white: '#fffdf3'
  };

  function resize() {
    const box = canvas.getBoundingClientRect();
    view.dpr = Math.min(devicePixelRatio || 1, 2);
    view.width = Math.max(1, box.width);
    view.height = Math.max(1, box.height);
    canvas.width = Math.round(view.width * view.dpr);
    canvas.height = Math.round(view.height * view.dpr);
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  }

  function cameraValues() {
    const mobile = view.width < 680;
    view.cx = view.width * (mobile || entered ? .5 : .67);
    view.cy = view.height * (mobile ? .57 : .53);
    const introScale = !mobile && !entered ? .84 : 1;
    view.scale = Math.min(view.width / (mobile ? 10.8 : 12.7), view.height / 9.2) * camera.zoom * introScale;
  }

  function project(point) {
    const c = Math.cos(camera.yaw), s = Math.sin(camera.yaw);
    const rx = point.x * c - point.z * s;
    const rz = point.x * s + point.z * c;
    const horizon = Math.cos(camera.pitch);
    const elevation = Math.sin(camera.pitch);
    return {
      x: view.cx + rx * view.scale,
      y: view.cy + rz * view.scale * horizon - point.y * view.scale * elevation,
      depth: rz
    };
  }

  function poly(points, fill, stroke = palette.ink, width = 1.5) {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.stroke(); }
  }

  function line(points, stroke, width = 2) {
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }

  function shade(hex, amount) {
    const value = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (value >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((value >> 8) & 255) + amount));
    const b = Math.max(0, Math.min(255, (value & 255) + amount));
    return `rgb(${r},${g},${b})`;
  }

  function box3d(x, y, z, w, h, d, color) {
    const points = {
      a: project({ x: x - w/2, y, z: z - d/2 }), b: project({ x: x + w/2, y, z: z - d/2 }),
      c: project({ x: x + w/2, y, z: z + d/2 }), d: project({ x: x - w/2, y, z: z + d/2 }),
      e: project({ x: x - w/2, y: y+h, z: z - d/2 }), f: project({ x: x + w/2, y: y+h, z: z - d/2 }),
      g: project({ x: x + w/2, y: y+h, z: z + d/2 }), h: project({ x: x - w/2, y: y+h, z: z + d/2 })
    };
    const faces = [
      { p: [points.a,points.b,points.f,points.e], c: shade(color,-25), d:(points.a.depth+points.b.depth)/2 },
      { p: [points.b,points.c,points.g,points.f], c: shade(color,-12), d:(points.b.depth+points.c.depth)/2 },
      { p: [points.c,points.d,points.h,points.g], c: shade(color,-34), d:(points.c.depth+points.d.depth)/2 },
      { p: [points.d,points.a,points.e,points.h], c: shade(color,-19), d:(points.d.depth+points.a.depth)/2 }
    ].sort((a,b)=>a.d-b.d);
    faces.slice(2).forEach(face => poly(face.p, face.c));
    poly([points.e,points.f,points.g,points.h], shade(color,18));
    return points;
  }

  function roof(x, y, z, w, d, height, color) {
    const c = Math.cos(camera.yaw), s = Math.sin(camera.yaw);
    const ridgeAlongX = Math.abs(c) > Math.abs(s);
    let faces;
    if (ridgeAlongX) {
      const l1=project({x:x-w/2,y,z:z-d/2}),l2=project({x:x+w/2,y,z:z-d/2}),l3=project({x:x+w/2,y,z:z+d/2}),l4=project({x:x-w/2,y,z:z+d/2});
      const r1=project({x:x-w/2,y:y+height,z}),r2=project({x:x+w/2,y:y+height,z});
      faces=[{p:[l1,l2,r2,r1],d:(l1.depth+l2.depth)/2,c:shade(color,18)},{p:[l4,l3,r2,r1],d:(l4.depth+l3.depth)/2,c:shade(color,-8)},{p:[l1,l4,r1],d:l1.depth,c:shade(color,-18)},{p:[l2,l3,r2],d:l2.depth,c:shade(color,-25)}];
    } else {
      const l1=project({x:x-w/2,y,z:z-d/2}),l2=project({x:x+w/2,y,z:z-d/2}),l3=project({x:x+w/2,y,z:z+d/2}),l4=project({x:x-w/2,y,z:z+d/2});
      const r1=project({x,y:y+height,z:z-d/2}),r2=project({x,y:y+height,z:z+d/2});
      faces=[{p:[l1,l4,r2,r1],d:(l1.depth+l4.depth)/2,c:shade(color,18)},{p:[l2,l3,r2,r1],d:(l2.depth+l3.depth)/2,c:shade(color,-8)},{p:[l1,l2,r1],d:l1.depth,c:shade(color,-18)},{p:[l4,l3,r2],d:l4.depth,c:shade(color,-25)}];
    }
    faces.sort((a,b)=>a.d-b.d).slice(1).forEach(face=>poly(face.p,face.c));
  }

  function circle3d(x, y, z, radius, color, stroke = palette.ink) {
    const p = project({x,y,z});
    ctx.beginPath(); ctx.arc(p.x,p.y,radius*view.scale,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}
  }

  function drawSky(time) {
    const gradient = ctx.createLinearGradient(0,0,0,view.height);
    gradient.addColorStop(0, palette.sky); gradient.addColorStop(.63, palette.skyLight); gradient.addColorStop(1, '#b7d8a1');
    ctx.fillStyle = gradient; ctx.fillRect(0,0,view.width,view.height);
    const sunX = view.width * .82, sunY = view.height * .16;
    ctx.beginPath();ctx.arc(sunX,sunY,Math.min(view.width,view.height)*.055,0,Math.PI*2);ctx.fillStyle=palette.yellow;ctx.fill();ctx.strokeStyle=palette.ink;ctx.lineWidth=2;ctx.stroke();
    const cloudOffset = reducedMotion ? 0 : Math.sin(time*.00015)*25;
    drawCloud(view.width*.22+cloudOffset,view.height*.17,1); drawCloud(view.width*.65-cloudOffset*.4,view.height*.1,.65);
    ctx.fillStyle='rgba(74,124,67,.18)';
    ctx.beginPath();ctx.moveTo(0,view.height*.54);for(let x=0;x<=view.width;x+=80){ctx.lineTo(x,view.height*.50+Math.sin(x*.014+camera.yaw)*28);}ctx.lineTo(view.width,view.height);ctx.lineTo(0,view.height);ctx.fill();
  }

  function drawCloud(x,y,size){ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.fillStyle='rgba(255,253,243,.85)';ctx.strokeStyle=palette.ink;ctx.lineWidth=2;ctx.beginPath();ctx.arc(-34,8,22,0,Math.PI*2);ctx.arc(0,-2,33,0,Math.PI*2);ctx.arc(38,10,25,0,Math.PI*2);ctx.rect(-35,8,75,27);ctx.fill();ctx.stroke();ctx.restore();}

  function drawIsland() {
    const top=[], bottom=[]; const count=28;
    for(let i=0;i<count;i++){const a=Math.PI*2*i/count;const rx=5.1,rz=4.45;top.push(project({x:Math.cos(a)*rx,y:0,z:Math.sin(a)*rz}));bottom.push(project({x:Math.cos(a)*rx,y:-.55,z:Math.sin(a)*rz}));}
    poly(bottom,palette.soilDark);
    for(let i=0;i<count;i++){const next=(i+1)%count;if((top[i].depth+top[next].depth)/2>0)poly([top[i],top[next],bottom[next],bottom[i]],i%2?palette.soil:shade(palette.soil,-10));}
    poly(top,palette.grass);
    const inner=[];for(let i=0;i<count;i++){const a=Math.PI*2*i/count;inner.push(project({x:Math.cos(a)*4.73,y:.02,z:Math.sin(a)*4.08}));}poly(inner,palette.grassLight,null);
  }

  function drawPath() {
    const points=[{x:0,z:3.9},{x:.4,z:2.1},{x:.1,z:.8},{x:-1.3,z:-.4},{x:-2.2,z:-1.2}];
    for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=-dz/len*.18,nz=dx/len*.18;poly([project({x:a.x+nx,y:.035,z:a.z+nz}),project({x:b.x+nx,y:.035,z:b.z+nz}),project({x:b.x-nx,y:.035,z:b.z-nz}),project({x:a.x-nx,y:.035,z:a.z-nz})], '#e8c780', null);}
  }

  function drawHouse(x,z){box3d(x,.03,z,1.75,1.3,1.45,palette.cream);roof(x,1.33,z,2,1.75,.8,palette.orange);const door=project({x:x,z:z+.74,y:.52});ctx.fillStyle=palette.wood;ctx.strokeStyle=palette.ink;ctx.lineWidth=2;ctx.fillRect(door.x-10,door.y-25,20,25);ctx.strokeRect(door.x-10,door.y-25,20,25);const chimney=box3d(x-.5,1.82,z-.2,.25,.7,.25,palette.red);return project({x,y:2.35,z});}
  function drawBarn(x,z){box3d(x,.03,z,2.1,1.55,1.65,palette.red);roof(x,1.58,z,2.35,1.95,.95,palette.orange);const door=project({x,y:.65,z:z+.84});ctx.fillStyle=palette.ink;ctx.strokeStyle=palette.cream;ctx.lineWidth=2;ctx.fillRect(door.x-17,door.y-32,34,32);ctx.strokeRect(door.x-17,door.y-32,34,32);line([{x:door.x-16,y:door.y-31},{x:door.x+16,y:door.y}],palette.cream,2);line([{x:door.x+16,y:door.y-31},{x:door.x-16,y:door.y}],palette.cream,2);return project({x,y:2.6,z});}
  function drawTree(x,z,scale=1){box3d(x,.02,z,.22,.75*scale,.22,palette.woodDark);circle3d(x,.95*scale,z,.48*view.scale/view.scale*scale,palette.grassDark);circle3d(x-.18*scale,1.2*scale,z,.38*scale,palette.grass);circle3d(x+.2*scale,1.15*scale,z,.36*scale,palette.grassLight);}
  function drawField(x,z){for(let row=0;row<3;row++){const z1=z+(row-1)*.48;const p1=project({x:x-.95,y:.035,z:z1-.18}),p2=project({x:x+.95,y:.035,z:z1-.18}),p3=project({x:x+.95,y:.035,z:z1+.18}),p4=project({x:x-.95,y:.035,z:z1+.18});poly([p1,p2,p3,p4],row%2?shade(palette.soil,9):palette.soil);for(let col=0;col<5;col++){const cx=x-.76+col*.38;const cp=project({x:cx,y:.19,z:z1});ctx.fillStyle=row===1?palette.yellow:palette.grassDark;ctx.strokeStyle=palette.ink;ctx.lineWidth=1;ctx.beginPath();ctx.arc(cp.x,cp.y,Math.max(2,view.scale*.055),0,Math.PI*2);ctx.fill();ctx.stroke();}}return project({x,y:.65,z});}
  function drawAnimal(x,z,type='cow',flip=1){
    const body=project({x,y:.48,z}), head=project({x:x+.34*flip,y:.63,z});
    const scale=Math.max(7,view.scale*.2);ctx.save();ctx.lineWidth=1.5;ctx.strokeStyle=palette.ink;
    ctx.fillStyle=type==='cow'?palette.white:'#f3d2a0';ctx.beginPath();ctx.ellipse(body.x,body.y,type==='chicken'?scale*.9:scale*1.55,type==='chicken'?scale*.7:scale*.82,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(head.x,head.y,scale*.62,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle=palette.ink;ctx.lineWidth=2;[-.65,.55].forEach(offset=>{ctx.beginPath();ctx.moveTo(body.x+offset*scale,body.y+scale*.5);ctx.lineTo(body.x+offset*scale,body.y+scale*1.2);ctx.stroke();});
    if(type==='cow'){ctx.fillStyle=palette.ink;ctx.beginPath();ctx.arc(body.x-scale*.45,body.y-scale*.2,scale*.26,0,Math.PI*2);ctx.arc(body.x+scale*.35,body.y+scale*.23,scale*.2,0,Math.PI*2);ctx.fill();}
    else {ctx.fillStyle=palette.red;ctx.beginPath();ctx.arc(head.x,head.y-scale*.58,scale*.18,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=palette.orange;ctx.beginPath();ctx.moveTo(head.x+scale*.5*flip,head.y);ctx.lineTo(head.x+scale*.9*flip,head.y+scale*.12);ctx.lineTo(head.x+scale*.5*flip,head.y+scale*.24);ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.fillStyle=palette.ink;ctx.beginPath();ctx.arc(head.x+scale*.18*flip,head.y-scale*.1,1.8,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawMeadow(x,z){
    const corners=[[-1.25,-.8],[1.25,-.8],[1.25,.8],[-1.25,.8]];
    corners.forEach(([dx,dz])=>box3d(x+dx,.02,z+dz,.1,.5,.1,palette.wood));
    for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4];line([project({x:x+a[0],y:.35,z:z+a[1]}),project({x:x+b[0],y:.35,z:z+b[1]})],palette.woodDark,3);}
    drawAnimal(x-.45,z,'cow',1);drawAnimal(x+.55,z+.25,'chicken',-1);return project({x,y:1.05,z});
  }
  function drawPond(x,z){const pts=[];for(let i=0;i<20;i++){const a=i/20*Math.PI*2;pts.push(project({x:x+Math.cos(a)*.85,y:.04,z:z+Math.sin(a)*.55}));}poly(pts,palette.water,palette.ink);const c=project({x,y:.06,z});ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(c.x,c.y,view.scale*.3,view.scale*.06,0,0,Math.PI*2);ctx.stroke();return project({x,y:.75,z});}
  function drawMailbox(x,z){box3d(x,.02,z,.12,.8,.12,palette.woodDark);box3d(x,.82,z,.65,.4,.42,palette.red);const flag1=project({x:x+.28,y:1.02,z}),flag2=project({x:x+.28,y:1.55,z});line([flag1,flag2],palette.ink,3);const f=project({x:x+.46,y:1.48,z});ctx.fillStyle=palette.yellow;ctx.strokeStyle=palette.ink;ctx.lineWidth=1.5;ctx.fillRect(f.x-8,f.y-6,16,12);ctx.strokeRect(f.x-8,f.y-6,16,12);return project({x,y:1.65,z});}
  function drawWindmill(x,z,time){box3d(x,.02,z,.32,2,.32,palette.cream);roof(x,2.02,z,.65,.65,.45,palette.red);const hub=project({x,y:1.8,z:z+.18});const angle=(reducedMotion?0:time*.0012);ctx.save();ctx.translate(hub.x,hub.y);ctx.strokeStyle=palette.ink;ctx.lineWidth=3;for(let i=0;i<4;i++){ctx.save();ctx.rotate(angle+i*Math.PI/2);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-48);ctx.stroke();ctx.fillStyle=palette.cream;ctx.strokeStyle=palette.ink;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-3,-15);ctx.lineTo(-12,-47);ctx.lineTo(5,-52);ctx.lineTo(4,-15);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}ctx.fillStyle=palette.orange;ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
  function drawSignLabels() {
    hotspots.forEach(spot=>{
      const active=pointer.hover===spot.place;ctx.font='800 8px Inter, sans-serif';const width=ctx.measureText(spot.label).width+20;ctx.fillStyle=active?palette.yellow:'rgba(255,253,243,.9)';ctx.strokeStyle=palette.ink;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(spot.x-width/2,spot.y-8,width,18,8);ctx.fill();ctx.stroke();ctx.fillStyle=palette.ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(spot.label,spot.x,spot.y+1);
    });
  }

  function draw(time) {
    camera.yaw += (camera.targetYaw-camera.yaw)*.12;
    /* Camera height and distance stay fixed; only the horizontal orbit changes. */
    cameraValues(); drawSky(time); drawIsland(); drawPath(); hotspots.length=0;
    const objects=[
      {x:-1.8,z:-1.35,draw:()=>hotspots.push({...drawHouse(-1.8,-1.35),place:'house',label:'SUPPLY HOUSE'})},
      {x:-1.6,z:1.8,draw:()=>hotspots.push({...drawField(-1.6,1.8),place:'field',label:'CROP FIELD'})},
      {x:2.3,z:.35,draw:()=>hotspots.push({...drawMeadow(2.3,.35),place:'animals',label:'ANIMAL MEADOW'})},
      {x:2.15,z:2.3,draw:()=>hotspots.push({...drawPond(2.15,2.3),place:'pond',label:'FISH POND'})},
      {x:.15,z:-3.1,draw:()=>drawWindmill(.15,-3.1,time)},
      {x:-4,z:-.3,draw:()=>drawTree(-4,-.3,1.05)},{x:-3.4,z:2.6,draw:()=>drawTree(-3.4,2.6,.82)},
      {x:4,z:-.3,draw:()=>drawTree(4,-.3,.95)},{x:3.55,z:-2.6,draw:()=>drawTree(3.55,-2.6,.75)},
      {x:.2,z:3.65,draw:()=>drawTree(.2,3.65,.72)}
    ];
    const c=Math.cos(camera.yaw),s=Math.sin(camera.yaw);objects.forEach(o=>o.depth=o.x*s+o.z*c);objects.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
    drawSignLabels();
    requestAnimationFrame(draw);
  }

  function hotspotAt(x,y){let best=null,distance=Infinity;hotspots.forEach(spot=>{const d=Math.hypot(x-spot.x,y-spot.y);if(d<distance&&d<55){distance=d;best=spot;}});return best;}
  canvas.addEventListener('pointerdown',event=>{pointer.down=true;pointer.moved=false;pointer.x=pointer.startX=event.clientX;pointer.y=pointer.startY=event.clientY;lastInteraction=performance.now();canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{
    const rect=canvas.getBoundingClientRect();
    if(pointer.down){const dx=event.clientX-pointer.x;if(Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>5)pointer.moved=true;camera.targetYaw+=dx*.009;pointer.x=event.clientX;pointer.y=event.clientY;lastInteraction=performance.now();}
    const spot=hotspotAt(event.clientX-rect.left,event.clientY-rect.top);pointer.hover=spot?.place||null;canvas.style.cursor=pointer.down?'grabbing':spot?'pointer':'grab';if(hint&&!pointer.down)hint.textContent=spot?`Click to open ${spot.label.toLowerCase()}.`:'Drag left or right to rotate 360°';
  });
  function release(event){if(!pointer.down)return;pointer.down=false;canvas.releasePointerCapture?.(event.pointerId);if(!pointer.moved){const rect=canvas.getBoundingClientRect();const spot=hotspotAt(event.clientX-rect.left,event.clientY-rect.top);if(spot)dispatchEvent(new CustomEvent('farm-place-selected',{detail:{place:spot.place}}));}}
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',()=>{pointer.down=false;});
  addEventListener('farm-focus-place',event=>{const angles={house:.5,field:2.8,animals:5.35,pond:4.45};if(event.detail?.place in angles)camera.targetYaw=angles[event.detail.place];entered=true;lastInteraction=performance.now();});
  addEventListener('farm-enter',()=>{entered=true;lastInteraction=performance.now();});
  addEventListener('resize',resize);resize();requestAnimationFrame(draw);
})();
