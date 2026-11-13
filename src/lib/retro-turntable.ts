/** Static model geometry. The browser only animates the lid, arm and record. */
type Point = readonly [number, number];
const unit = (value: number) => `calc(${value} * var(--retro-unit))`;

function box(x: number, y: number, z: number, width: number, depth: number, height: number, material: string) {
  return `<span class="retro-box ${material}" style="left:${unit(x)};top:${unit(y)};transform:translateZ(${unit(z)});--w:${unit(width)};--d:${unit(depth)};--h:${unit(height)}">${['top', 'front', 'back', 'left', 'right'].map(face => `<i class="retro-face retro-face--${face}"></i>`).join('')}</span>`;
}

function cylinder(x: number, y: number, z: number, diameter: number, height: number, top: string, side: string, taper = 0) {
  return `<span class="retro-cylinder" style="left:${unit(x)};top:${unit(y)};transform:translateZ(${unit(z)});--size:${unit(diameter)};--cap:${top};--rim:${side}">${Array.from({length: height + 1}, (_, step) => `<i style="transform:translateZ(${unit(step)}) scale(${1 - taper * step / Math.max(1, height)})"></i>`).join('')}</span>`;
}

function prism(x: number, y: number, z: number, points: readonly Point[], height: number, material = '') {
  const width = Math.max(...points.map(point => point[0]));
  const depth = Math.max(...points.map(point => point[1]));
  const top = `<i class="retro-prism__top" style="clip-path:polygon(${points.map(([px, py]) => `${px / width * 100}% ${py / depth * 100}%`).join(',')})"></i>`;
  const edges = points.map(([px, py], index) => {
    const next = points[(index + 1) % points.length];
    const dx = next[0] - px, dy = next[1] - py;
    return `<i class="retro-prism__edge" style="width:${unit(Math.hypot(dx, dy))};transform:translate3d(${unit(px)},${unit(py)},0) rotateZ(${Math.atan2(dy, dx)}rad) rotateX(90deg)"></i>`;
  }).join('');
  return `<span class="retro-prism ${material}" style="left:${unit(x)};top:${unit(y)};width:${unit(width)};height:${unit(depth)};transform:translateZ(${unit(z)});--h:${unit(height)}">${top}${edges}</span>`;
}

export function renderRetroTurntable() {
  const feet = [[28,24], [562,24], [28,340], [562,340]].map(([x,y]) => cylinder(x,y,1,30,13,'#939b96','#838c86')).join('');
  const grille = [[34,128], [179,128]].map(([left,width]) => `<i class="retro-grille" style="left:${unit(left)};width:${unit(width)}"></i>`).join('');
  const cabinet = box(0,0,18,620,400,166,'retro-cabinet').replace('<i class="retro-face retro-face--front"></i>', `<i class="retro-face retro-face--front">${grille}</i>`);
  const arm = prism(-36,-16,0,[[27,0],[47,0],[47,151],[30,175],[18,207],[0,202],[11,164],[27,144]],10)
    + box(-8,-18,-1,19,28,9,'retro-matte')
    + prism(-32,174,-6,[[1,0],[14,2],[12,14],[0,12]],6,'retro-cartridge')
    + box(-25,184,-13,2,4,9,'retro-cartridge');
  const knobs = [111,154,197].map((y,index) => cylinder(413,y,137,16,12,'#969b9c','#828888',.18)
    + `<span class="retro-knob-label" style="left:${unit(442)};top:${unit(y+6)}">${['TONE','BASS','VOL'][index]}</span>`).join('');
  const keys = Array.from({length:5}, (_,index) => `<span class="retro-key" data-retro-key="${index}" style="left:${unit(411+index*30)}">${prism(0,0,0,[[1,0],[26,0],[27,3],[27,19],[25,22],[2,22],[0,19],[0,3]],6,'retro-key-material')}</span>`).join('');
  // A continuous side wall survives movement and a full turn; parallel disks alone do not.
  const rim = Array.from({length:80}, (_,index) => {
    const angle = index / 80 * Math.PI * 2;
    const next = (index + 1) / 80 * Math.PI * 2;
    const x = 129 + Math.cos(angle) * 129, y = 129 + Math.sin(angle) * 129;
    const dx = (Math.cos(next) - Math.cos(angle)) * 129;
    const dy = (Math.sin(next) - Math.sin(angle)) * 129;
    return `<i class="retro-vinyl-wall" style="width:${unit(Math.hypot(dx,dy)+.15)};transform:translate3d(${unit(x)},${unit(y)},0) rotateZ(${Math.atan2(dy,dx)}rad) rotateX(90deg)"></i>`;
  }).join('');
  const printedFace = '<span class="record__grooves"></span><span class="record__label"></span>';
  const record = `<span class="retro-record-carrier"><span class="retro-record-motion" data-record><span class="retro-record-flip" data-record-flip><i class="retro-vinyl-edge"></i>${rim}<span class="retro-record-side retro-record-face">${printedFace}</span><span class="retro-record-side retro-record-back">${printedFace}</span></span></span></span>`;

  return `<span class="retro-floor-shadow"></span><span class="retro-contact-shadow"></span>${feet}${box(4,4,12,612,392,6,'retro-base')}${cabinet}${box(-18,-7,7,22,416,196,'retro-wood')}${box(616,-7,7,22,416,196,'retro-wood')}
  <span class="retro-mechanism">
    ${box(34,26,137,346,330,5,'retro-inset')}<span class="retro-platter-shadow"></span>
    ${cylinder(59,54,143,278,8,'repeating-conic-gradient(#c8cdce 0deg 1deg,#a0a8aa 1deg 2deg)','#a0a8aa')}${cylinder(65,60,151,266,3,'#979fa0','#8f9899')}${record}${cylinder(194,189,162,8,10,'#d6dcdd','#a2abad')}
    <span class="retro-arm-shadow"></span>${box(330,62,143,35,267,2,'retro-arm-rest')}${cylinder(337,75,146,24,13,'#b8bdbb','#a4aaa7')}${cylinder(342,80,159,14,9,'#c5c9c7','#adb3af')}<span class="retro-tonearm" data-arm>${arm}</span>
    ${knobs}${cylinder(550,226,137,24,15,'#969b9c','#828888',.17)}${box(409,259,137,153,26,2,'retro-base')}${keys}
    <span class="retro-spec">33⅓ / 45</span><span class="retro-model">SELECTED WORKS · STEREO</span><i class="retro-power"></i><span class="retro-tuner"><i></i></span>
    ${[44,538].map(x => box(x,-4,137,38,12,9,'retro-matte')).join('')}
    <span class="retro-lid" id="turntable-lid"><span class="retro-lid__glass"></span><i class="retro-lid__front"></i><i class="retro-lid__side"></i><i class="retro-lid__side retro-lid__side--right"></i></span>
  </span>`;
}
