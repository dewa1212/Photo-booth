const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const video = $('#video'), canvas = $('#canvas'), stage = $('#cameraStage'),
  placeholder = $('#cameraPlaceholder'), cameraButton = $('#cameraButton'),
  captureButton = $('#captureButton'), flipButton = $('#flipCameraButton'),
  status = $('#cameraStatus'), timerText = $('#timerText'),
  countdown = $('#countdown'), flash = $('#flash'),
  gallery = $('#photoGallery'), galleryEmpty = $('#galleryEmpty'),
  galleryCount = $('#galleryCount'), toast = $('#toast'),
  reviewModal = $('#reviewModal'), reviewGrid = $('#reviewGrid');

let stream, filter = 'none', format = 'square', layout = 'single',
  cover = 'none', shots = 1, timer = 3, sticker = '✦',
  facing = 'user', session = [], startedAt;

const filters = {
  none: 'none',
  warm: 'sepia(.33) saturate(1.15) contrast(1.03)',
  mono: 'grayscale(1) contrast(1.18)',
  dream: 'sepia(.18) saturate(.8) hue-rotate(285deg) brightness(1.08)',
  noir: 'grayscale(1) contrast(1.45) brightness(.9)',
  pop: 'saturate(1.7) contrast(1.12)',
  faded: 'sepia(.2) saturate(.7) brightness(1.12) contrast(.88)',
  vintage: 'sepia(.45) contrast(1.1) saturate(1.25) hue-rotate(-12deg)',
  cyber: 'hue-rotate(160deg) saturate(1.65) contrast(1.15)',
  sepia: 'sepia(0.85) contrast(1.05) saturate(1.1)',
  cool: 'hue-rotate(190deg) saturate(1.2) contrast(1.05)',
  sunset: 'sepia(.3) saturate(1.55) hue-rotate(330deg) contrast(1.1)',
  emerald: 'hue-rotate(90deg) saturate(1.2) contrast(1.1) sepia(0.15)',
  soft: 'brightness(1.08) contrast(.92) saturate(.92) sepia(.12)',
  dramatic: 'contrast(1.5) saturate(1.35) brightness(.92)'
};

const photoSet = (prefix, ids) => ids.map((id, i) => [
  `${prefix}${i+1}`, `${prefix} ${i+1}`,
  `url(https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=80)`
]);

const covers = {
  studio: [
    ['none', 'Tanpa cover', ''],
    ['studio1', 'Studio Gray', 'url(https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=700&q=80)'],
    ['studio2', 'Studio Warm', 'url(https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=700&q=80)'],
    ['studio3', 'Studio Minimal', 'url(https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80)'],
    ['studio4', 'Studio Canvas', 'url(https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=700&q=80)'],
    ['studio5', 'Studio Soft', 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=700&q=80)'],
    ['studio6', 'Studio Moody', 'url(https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=700&q=80)'],
    ['studio7', 'Studio Color', 'url(https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=700&q=80)'],
    ['studio8', 'Studio Cream', 'url(https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=700&q=80)'],
    ['studio9', 'Studio Beige', 'url(https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=700&q=80)'],
    ['studio10', 'Studio Paper', 'linear-gradient(135deg,#f5efe6,#d8cab9)'],
    ['studio11', 'Studio Check', 'repeating-conic-gradient(#1f3027 0 25%,#ead6a8 0 50%)'],
    ['studio12', 'Peach', 'linear-gradient(135deg,#ffd3ba,#f28b74)'],
    ['studio13', 'Mint', 'linear-gradient(135deg,#d7eddc,#8cbda4)'],
    ['studio14', 'Lavender', 'linear-gradient(135deg,#d7c9ed,#9279b7)'],
    ['studio15', 'Midnight', 'linear-gradient(135deg,#10182c,#385e8f)'],
    ['studio16', 'Coral', 'linear-gradient(135deg,#ff9975,#dd4664)'],
    ['studio17', 'Dots', 'radial-gradient(#182018 1px,transparent 2px),#f2c23e'],
    ['studio18', 'Ivory', 'linear-gradient(135deg,#fffff0,#f5f5dc)'],
    ['studio19', 'Rose', 'linear-gradient(135deg,#e8b4b8,#d4758b)'],
    ['studio20', 'Latte', 'linear-gradient(135deg,#d2b48c,#a67b5b)']
  ],
  nature: photoSet('nature', [
    '1441974231531-c6227db76b6e', '1507525428034-b723cf961d3e', '1464822759023-fed622ff2c3b',
    '1499002238440-d264edd596ec', '1470252649378-9c29740c9fa8', '1470509037663-253afd7f0f51',
    '1433086966358-54859d0ed716', '1500534623283-312aade485b7', '1518837695005-2083093ee35b',
    '1506744038136-46273834b3fb', '1432405972618-c60b0225b8f9', '1459411552884-841db9b3cc2a',
    '1428592953211-077101b2021b', '1500534314209-a25ddb2bd429', '1473445361088-5c6a9a0f5c5b',
    '1472396961693-142e6e269027', '1448375240586-882707db888b', '1497250681960-ef046c08a56e',
    '1491002052546-bf38f186af56', '1501004318641-b39e6451bec6'
  ]),
  party: photoSet('party', [
    '1514525253161-7a46d19cd819', '1519608487953-e999c86e7455', '1492684223066-81342ee5ff30',
    '1516450360452-9312f5e86fc7', '1530103862676-de8c9debad1d', '1470225620780-dba8ba36b745',
    '1513151233558-d860c5398176', '1527529482837-4698179dc6ce', '1508997449629-303059a039c0',
    '1566737236500-c8ac43014a67', '1504196606672-aef5c9cefc92', '1496337589254-7e19d01cec44',
    '1517457373958-b7bdd4587205', '1485872299825-470a1a0c4974', '1514525253161-7a46d19cd819',
    '1520854221256-17451cc331bf', '1528459105426-b9548367069b', '1519710164239-da123dc03ef4',
    '1518709268805-4e9042af2176', '1509198397868-475647b2a1e5'
  ]),
  abstract: photoSet('abstract', [
    '1541701494587-cb58502866ab', '1550684848-fac1c5b4e853', '1579783900882-c0d3dad7b119',
    '1557683316-973673baf926', '1500530855697-b586d89ba3ee', '1550745165-9bc0b252726f',
    '1518709268805-4e9042af2176', '1531058020387-3be344556be6', '1553356084-58ef4a67b2a7',
    '1549490349-8643362247b5', '1508739773434-c26b3d09e071', '1618005182384-a83a8bd57fbe',
    '1579783902614-a3fb3927b675', '1563089145-599997674d42', '1534447677768-be436bb09401',
    '1509198397868-475647b2a1e5', '1513542789411-b6a5d4f31634', '1528459105426-b9548367069b',
    '1507679799987-c73779587ccf', '1558655146-d09347e92766'
  ]),
  pastel: photoSet('pastel', [
    '1490750967868-88aa4486c946', '1494438639946-1ebd1d20bf85', '1501004318641-b39e6451bec6',
    '1519331379826-f10be5486c6f', '1528459105426-b9548367069b', '1513159446162-54eb8bdaa79b',
    '1523978591478-c753949ff840', '1497366754035-f200968a6e72', '1499346030926-9a72daac6c63',
    '1500530855697-b586d89ba3ee', '1518709268805-4e9042af2176', '1557683316-973673baf926',
    '1549490349-8643362247b5', '1531058020387-3be344556be6', '1550684848-fac1c5b4e853',
    '1508739773434-c26b3d09e071', '1618005182384-a83a8bd57fbe', '1579783902614-a3fb3927b675',
    '1513542789411-b6a5d4f31634', '1507679799987-c73779587ccf'
  ]),
  urban: photoSet('urban', [
    '1477959858617-67f85cf4f1df', '1480714378408-67cf0d13bc1b', '1465447142348-e9952c393450',
    '1444723121867-7a241cacace9', '1486325212027-8081e485255e', '1449824913935-59a10b8d2000',
    '1519501025264-65ba15a82390', '1513694203232-719a280e022f', '1506751470038-e579ef920950',
    '1496568816309-51a7cbe28e9d', '1519608487953-e999c86e7455', '1514525253161-7a46d19cd819',
    '1492684223066-81342ee5ff30', '1516450360452-9312f5e86fc7', '1470225620780-dba8ba36b745',
    '1513151233558-d860c5398176', '1527529482837-4698179dc6ce', '1508997449629-303059a039c0',
    '1566737236500-c8ac43014a67', '1504196606672-aef5c9cefc92'
  ]),
  season: photoSet('season', [
    '1522383225653-ed111181a951', '1507525428034-b723cf961d3e', '1476820865390-c52aeefe9589',
    '1491002052546-bf38f186af56', '1437622368342-7a3d73a34c8f', '1513836279014-a89f7a76ae86',
    '1483921020237-2ff51e8e4b22', '1500534314209-a25ddb2bd429', '1519681393784-d120267933ba',
    '1469474968028-56623f02e42e', '1441974231531-c6227db76b6e', '1464822759023-fed622ff2c3b',
    '1499002238440-d264edd596ec', '1470252649378-9c29740c9fa8', '1470509037663-253afd7f0f51',
    '1433086966358-54859d0ed716', '1500534623283-312aade485b7', '1518837695005-2083093ee35b',
    '1506744038136-46273834b3fb', '1432405972618-c60b0225b8f9'
  ]),
  luxe: photoSet('luxe', [
    '1515562141207-7a88fb7ce338', '1529139574466-a303027c1d8b', '1497366811353-6870744d04b2',
    '1517841905240-472988babdf9', '1542038382126-77ae2819338d', '1519710164239-da123dc03ef4',
    '1524250502761-1ac6f2e30d43', '1509198397868-475647b2a1e5', '1518709268805-4e9042af2176',
    '1508739773434-c26b3d09e071', '1534447677768-be436bb09401', '1513542789411-b6a5d4f31634',
    '1507679799987-c73779587ccf', '1579783902614-a3fb3927b675', '1618005182384-a83a8bd57fbe',
    '1550684848-fac1c5b4e853', '1558655146-d09347e92766', '1528459105426-b9548367069b',
    '1541701494587-cb58502866ab', '1557683316-973673baf926'
  ]),
  toons: photoSet('toons', [
    '1579783902614-a3fb3927b675', '1513542789411-b6a5d4f31634', '1563089145-599997674d42',
    '1534447677768-be436bb09401', '1509198397868-475647b2a1e5', '1550745165-9bc0b252726f',
    '1518709268805-4e9042af2176', '1508739773434-c26b3d09e071', '1579783900882-c0d3dad7b119',
    '1618005182384-a83a8bd57fbe', '1541701494587-cb58502866ab', '1550684848-fac1c5b4e853',
    '1557683316-973673baf926', '1500530855697-b586d89ba3ee', '1531058020387-3be344556be6',
    '1553356084-58ef4a67b2a7', '1549490349-8643362247b5', '1490750967868-88aa4486c946',
    '1494438639946-1ebd1d20bf85', '1501004318641-b39e6451bec6'
  ]),
  lucu: photoSet('lucu', [
    '1514888286974-6c03e2ca1dba', '1543466835-00a7907e9de1', '1533738363-b7f9aef128ce',
    '1561948955-570b270e7c36', '1537151608828-ea2b11777ee8', '1505628346881-b72b27e84530',
    '1574158622682-e40e69881006', '1583511655857-d19b40a7a54e', '1517849845537-4d257902454a',
    '1548767797-d8c844163c4c', '1535930891776-0c2dfb7fda1a', '1573865526739-10659fec78a5',
    '1560807707-8cc77767d783', '1548802673-380ab8ebc7b7', '1574158622682-e40e69881006',
    '1518020382113-a7e8fc38eac9', '1530281700549-e82e7bf110d6', '1592194996308-7b43878e84a6',
    '1577023311546-acd076573138', '1526336024174-e58f5cdd8e13'
  ])
};

function wait(t) { return new Promise(r => setTimeout(r, t)); }

function notice(m) {
  toast.textContent = m;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function tick() {
  let s = (Date.now() - startedAt) / 1000 | 0;
  timerText.textContent = `${String(s / 60 | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function beep(f = 620) {
  try {
    let c = new (window.AudioContext || window.webkitAudioContext)(),
      o = c.createOscillator(), g = c.createGain();
    o.frequency.value = f; g.gain.value = .03;
    o.connect(g).connect(c.destination); o.start();
    g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .12);
    o.stop(c.currentTime + .12);
  } catch (e) {}
}

/* ── Camera ── */
async function startCamera() {
  stream?.getTracks().forEach(x => x.stop());
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing } }, audio: false
    });
    video.srcObject = stream;
    stage.classList.add('live');
    placeholder.hidden = true;
    cameraButton.hidden = true;
    flipButton.hidden = false;
    captureButton.disabled = false;
    status.textContent = 'LIVE';
    startedAt = Date.now();
    tick();
    clearInterval(window._dewaTimer);
    window._dewaTimer = setInterval(tick, 1000);
  } catch {
    notice('Kamera belum bisa diakses. Periksa izin browser kamu.');
  }
}

/* ── Drawing helpers ── */
function draw(c, img, x, y, w, h) {
  let r = Math.max(w / img.width, h / img.height),
    sw = w / r, sh = h / r;
  c.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

function activeCover() {
  return Object.values(covers).flat().find(x => x[0] === cover);
}

async function background(c, w, h) {
  let x = activeCover();
  c.fillStyle = '#f5f0e7';
  c.fillRect(0, 0, w, h);
  if (!x || x[0] === 'none') return;

  // Try URL image first
  let url = x[2].match(/url\((.+)\)/)?.[1];
  if (url) {
    try {
      let i = new Image(); i.crossOrigin = 'anonymous';
      i.src = url; await i.decode();
      draw(c, i, 0, 0, w, h);
      c.fillStyle = '#18201822'; c.fillRect(0, 0, w, h);
      return;
    } catch { /* fallback */ }
  }

  // Parse CSS gradient
  let style = x[2];
  if (style.includes('linear-gradient')) {
    let m = style.match(/linear-gradient\((\d+)deg/);
    let angle = m ? parseInt(m[1]) : 180;
    let stops = [...style.matchAll(/#([0-9a-f]{3,8})/gi)];
    if (stops.length) {
      let rad = (angle - 90) * Math.PI / 180;
      let len = Math.max(w, h);
      let cx = w / 2, cy = h / 2;
      let x1 = cx - Math.cos(rad) * len, y1 = cy - Math.sin(rad) * len;
      let x2 = cx + Math.cos(rad) * len, y2 = cy + Math.sin(rad) * len;
      let g = c.createLinearGradient(x1, y1, x2, y2);
      stops.forEach((s, i) => {
        let col = '#' + s[1];
        g.addColorStop(i / Math.max(stops.length - 1, 1), col);
      });
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      return;
    }
  }

  if (style.includes('radial-gradient') && !style.includes('repeating')) {
    let stops = [...style.matchAll(/#([0-9a-f]{3,8})/gi)];
    if (stops.length) {
      let g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      stops.forEach((s, i) => {
        g.addColorStop(i / Math.max(stops.length - 1, 1), '#' + s[1]);
      });
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      return;
    }
  }

  if (style.includes('conic-gradient')) {
    let stops = [...style.matchAll(/#([0-9a-f]{3,8})/gi)];
    if (stops.length) {
      let g = c.createConicGradient(0, w / 2, h / 2);
      stops.forEach((s, i) => {
        g.addColorStop(i / stops.length, '#' + s[1]);
      });
      g.addColorStop(1, '#' + stops[0][1]);
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      return;
    }
  }

  if (style.includes('repeating-conic')) {
    let stops = [...style.matchAll(/#([0-9a-f]{3,8})/gi)];
    if (stops.length >= 2) {
      let patSize = 40;
      let patCanvas = document.createElement('canvas');
      patCanvas.width = patSize;
      patCanvas.height = patSize;
      let pc = patCanvas.getContext('2d');
      let g = pc.createConicGradient(0, patSize / 2, patSize / 2);
      g.addColorStop(0, '#' + stops[0][1]);
      g.addColorStop(0.25, '#' + stops[0][1]);
      g.addColorStop(0.25, '#' + stops[1][1]);
      g.addColorStop(0.5, '#' + stops[1][1]);
      g.addColorStop(0.5, '#' + stops[0][1]);
      g.addColorStop(0.75, '#' + stops[0][1]);
      g.addColorStop(0.75, '#' + stops[1][1]);
      g.addColorStop(1, '#' + stops[1][1]);
      pc.fillStyle = g;
      pc.fillRect(0, 0, patSize, patSize);
      let pat = c.createPattern(patCanvas, 'repeat');
      c.fillStyle = pat;
      c.fillRect(0, 0, w, h);
      return;
    }
  }

  if (style.includes('repeating')) {
    let isLinear = style.includes('repeating-linear-gradient');
    let angle = 45;
    let am = style.match(/(\d+)deg/);
    if (am) angle = parseInt(am[1]);
    let stops = [...style.matchAll(/#([0-9a-f]{3,8})/gi)];
    if (stops.length >= 2) {
      let patSize = 20;
      let patCanvas = document.createElement('canvas');
      patCanvas.width = patSize * 2;
      patCanvas.height = patSize * 2;
      let pc = patCanvas.getContext('2d');
      if (isLinear) {
        let rad = (angle - 90) * Math.PI / 180;
        let len = patSize * 2;
        let cx = patSize, cy = patSize;
        let g = pc.createLinearGradient(
          cx - Math.cos(rad) * len, cy - Math.sin(rad) * len,
          cx + Math.cos(rad) * len, cy + Math.sin(rad) * len
        );
        stops.forEach((s, i) => {
          g.addColorStop(i / Math.max(stops.length - 1, 1), '#' + s[1]);
        });
        pc.fillStyle = g;
        pc.fillRect(0, 0, patSize * 2, patSize * 2);
      } else {
        pc.fillStyle = stops[0] ? '#' + stops[0][1] : '#fff';
        pc.fillRect(0, 0, patSize * 2, patSize * 2);
      }
      let pat = c.createPattern(patCanvas, 'repeat');
      c.fillStyle = pat;
      c.fillRect(0, 0, w, h);
      return;
    }
  }

  // Fallback: try to fill with first color found
  let fallbackColor = (style.match(/#([0-9a-f]{3,8})/i) || [])[1];
  if (fallbackColor) {
    c.fillStyle = '#' + fallbackColor;
    c.fillRect(0, 0, w, h);
  }
}

let captionPos = 'bottom';

/* ── Stamp (professional) ── */
function stamp(c, w, h, fr = 0, isPolaroid = false) {
  let message = $('#captionInput')?.value.trim() || '';
  c.textAlign = 'center';
  c.textBaseline = 'middle';

  // 1. Polaroid Caption
  if (isPolaroid) {
    if (message) {
      c.fillStyle = '#333';
      c.font = 'italic 600 17px "Cormorant Garamond", serif';
      c.fillText(message, w / 2, h - 45);
    }
    if (sticker) {
      c.font = '32px sans-serif';
      c.fillText(sticker, w - fr - 40, h - 45);
    }
    return;
  }

  let barTop = h - 65 - fr;
  let barMid = barTop + 24;
  let barBot = barTop + 48;

  // 2. DEWA Brand & Copyright at bottom
  c.fillStyle = '#182018';
  c.font = 'italic 700 32px "Cormorant Garamond", serif';
  c.fillText('DEWA', w / 2, barMid);

  c.font = '500 9px "DM Mono", monospace';
  c.fillStyle = '#666';
  c.fillText('PHOTO BOOTH  ·  MOMEN KECIL, CERITA BESAR', w / 2, barBot);

  let d = new Date();
  let ds = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  c.textAlign = 'right';
  c.font = '400 9px "DM Mono", monospace';
  c.fillStyle = '#999';
  c.fillText(ds, w - fr - 14, barBot);

  // 3. User Custom Photo Message Position (Top, Center, Bottom - NOT under copyright!)
  if (message) {
    let msgY = fr + 50;
    if (captionPos === 'center') msgY = h / 2;
    else if (captionPos === 'bottom') msgY = barTop - 28;

    c.save();
    c.font = '600 13px "DM Mono", monospace';
    let textW = c.measureText(message).width + 36;
    let textH = 32;

    // Draw translucent background pill
    c.fillStyle = 'rgba(24, 32, 24, 0.85)';
    roundRect(c, w / 2 - textW / 2, msgY - textH / 2, textW, textH, 16);
    c.fill();
    c.strokeStyle = 'rgba(245, 240, 231, 0.4)';
    c.lineWidth = 1;
    c.stroke();

    // Draw message text
    c.textAlign = 'center';
    c.fillStyle = '#f5f0e7';
    c.fillText(message, w / 2, msgY);
    c.restore();
  }

  // 4. Emoji / Sticker
  if (sticker) {
    c.save();
    c.font = '36px sans-serif';
    c.textAlign = 'left';
    c.fillText(sticker, fr + 16, fr + 48);
    c.restore();
  }
}

/* ── Countdown ── */
async function countdown3(label) {
  status.textContent = `FOTO ${label}`;
  for (let n = timer; n; n--) {
    countdown.textContent = n;
    countdown.classList.add('show');
    beep(500 + n * 60);
    await wait(1000);
  }
  countdown.classList.remove('show');
  status.textContent = 'LIVE';
}

/* ── Snap ── */
function snap() {
  let raw = document.createElement('canvas');
  raw.width = 800;
  raw.height = format === 'portrait' ? 1000 : 800;
  let c = raw.getContext('2d'),
    r = Math.max(raw.width / video.videoWidth, raw.height / video.videoHeight),
    sw = raw.width / r, sh = raw.height / r;
  c.filter = filters[filter];
  c.translate(raw.width, 0);
  c.scale(-1, 1);
  c.drawImage(video,
    (video.videoWidth - sw) / 2, (video.videoHeight - sh) / 2, sw, sh,
    0, 0, raw.width, raw.height
  );
  return raw;
}

/* ── Take Photo ── */
async function takePhoto() {
  if (!stream) return;
  captureButton.disabled = true;
  overlayCapture.disabled = true;
  session = [];
  for (let i = 0; i < shots; i++) {
    await countdown3(`${i + 1}/${shots}`);
    session.push({ raw: snap(), selected: true });
    flash.classList.add('go');
    setTimeout(() => flash.classList.remove('go'), 350);
    beep(900);
  }
  captureButton.disabled = false;
  overlayCapture.disabled = false;
  openReview();
}

function openReview() {
  renderReview();
  reviewModal.classList.add('open');
  reviewModal.setAttribute('aria-hidden', 'false');
}

function closeReview() {
  reviewModal.classList.remove('open');
  reviewModal.setAttribute('aria-hidden', 'true');
}

function renderReview() {
  reviewGrid.innerHTML = session.map((item, i) =>
    `<article class="review-item ${item.selected ? 'selected' : ''}" data-index="${i}">
      <img src="${item.raw.toDataURL('image/jpeg', .8)}" alt="Foto ${i + 1}">
      <button class="retake" data-retake="${i}" type="button">ULANG FOTO ${i + 1}</button>
    </article>`
  ).join('');
}

async function retake(i) {
  closeReview();
  captureButton.disabled = true;
  overlayCapture.disabled = true;
  await countdown3(`${i + 1}/${shots}`);
  session[i] = { raw: snap(), selected: true };
  flash.classList.add('go');
  setTimeout(() => flash.classList.remove('go'), 350);
  captureButton.disabled = false;
  overlayCapture.disabled = false;
  openReview();
  notice(`Foto ${i + 1} sudah diulang.`);
}

/* ── Make Print (all 7 layouts, professional output) ── */
async function makePrint() {
  let chosen = session.filter(x => x.selected).map(x => x.raw);
  if (!chosen.length) { notice('Pilih minimal satu foto.'); return; }

  // Limit per layout
  if (layout === 'single' || layout === 'polaroid') chosen = [chosen[0]];
  else if (layout === 'duo') chosen = chosen.slice(0, 2);
  else if (layout === 'grid') chosen = chosen.slice(0, 8);
  else if (layout === 'collage') chosen = chosen.slice(0, 8);
  else if (layout === 'strip' || layout === 'film') chosen = chosen.slice(0, 8);

  let portrait = format === 'portrait';
  let w, h, pad = 40, gap = 10, radius = 8;

  switch (layout) {
    case 'single':
      w = portrait ? 700 : 800;
      h = portrait ? 980 : 1050;
      break;
    case 'strip':
      w = portrait ? 680 : 780;
      h = chosen.length * (portrait ? 680 : 400) + pad * 2 + gap * (chosen.length - 1) + 90;
      break;
    case 'duo':
      w = portrait ? 700 : 800;
      h = portrait ? 1500 : 610;
      break;
    case 'grid':
      w = 800; h = 840;
      break;
    case 'film':
      w = 520;
      h = chosen.length * 300 + pad * 2 + 60;
      break;
    case 'polaroid':
      w = 620; h = 780;
      break;
    case 'collage':
      w = 800; h = 900;
      break;
  }

  canvas.width = w;
  canvas.height = h;
  let c = canvas.getContext('2d');
  let fr = 20; // frame thickness

  // ── 1. Frame border (entire canvas) ──
  c.fillStyle = '#e0d8c8';
  c.fillRect(0, 0, w, h);

  // ── 2. Background inside frame ──
  c.save();
  c.beginPath();
  c.rect(fr, fr, w - fr * 2, h - fr * 2);
  c.clip();
  try { await background(c, w, h); } catch (e) { console.warn('Background render error:', e); }
  c.restore();

  // ── 3. Inner border line ──
  c.strokeStyle = '#c5bba8';
  c.lineWidth = 1.5;
  c.strokeRect(fr - 0.75, fr - 0.75, w - fr * 2 + 1.5, h - fr * 2 + 1.5);

  // ── 4. Draw layout ──
  switch (layout) {
    case 'single': {
      let fw = w - fr * 2 - 40, fh = h - fr * 2 - 120;
      let ox = fr + 20, oy = fr + 20;
      // White card + shadow
      c.save();
      c.shadowColor = '#00000030'; c.shadowBlur = 20; c.shadowOffsetY = 6;
      c.fillStyle = '#fff';
      roundRect(c, ox - 6, oy - 6, fw + 12, fh + 12, radius + 2);
      c.fill();
      c.restore();
      // Photo clip + draw
      c.save();
      roundRect(c, ox, oy, fw, fh, radius);
      c.clip();
      draw(c, chosen[0], ox, oy, fw, fh);
      c.restore();
      break;
    }
    case 'strip': {
      let fw = w - fr * 2 - 40;
      let ox = fr + 20;
      let totalPhotosH = h - fr * 2 - 130;
      let fh = (totalPhotosH - gap * (chosen.length - 1)) / chosen.length;
      chosen.forEach((p, i) => {
        let y = fr + 20 + i * (fh + gap);
        c.save();
        c.shadowColor = '#00000025'; c.shadowBlur = 14; c.shadowOffsetY = 4;
        c.fillStyle = '#fff';
        roundRect(c, ox - 5, y - 5, fw + 10, fh + 10, radius);
        c.fill();
        c.restore();
        c.save();
        roundRect(c, ox, y, fw, fh, radius - 2);
        c.clip();
        draw(c, p, ox, y, fw, fh);
        c.restore();
      });
      break;
    }
    case 'duo': {
      if (portrait) {
        chosen.forEach((p, i) => {
          let y = fr + 20 + i * 640;
          let fw = 600, fh = 600;
          let ox = (w - fw) / 2;
          c.save();
          c.shadowColor = '#00000030'; c.shadowBlur = 18; c.shadowOffsetY = 5;
          c.fillStyle = '#fff';
          roundRect(c, ox - 6, y - 6, fw + 12, fh + 12, radius + 2);
          c.fill();
          c.restore();
          c.save();
          roundRect(c, ox, y, fw, fh, radius);
          c.clip();
          draw(c, p, ox, y, fw, fh);
          c.restore();
        });
      } else {
        chosen.forEach((p, i) => {
          let x = fr + 30 + i * 380;
          let fw = 340, fh = h - fr * 2 - 120;
          let oy = fr + 20;
          c.save();
          c.shadowColor = '#00000030'; c.shadowBlur = 18; c.shadowOffsetY = 5;
          c.fillStyle = '#fff';
          roundRect(c, x - 6, oy - 6, fw + 12, fh + 12, radius + 2);
          c.fill();
          c.restore();
          c.save();
          roundRect(c, x, oy, fw, fh, radius);
          c.clip();
          draw(c, p, x, oy, fw, fh);
          c.restore();
        });
      }
      break;
    }
    case 'grid': {
      let total = chosen.length;
      let cols = total > 4 ? 3 : 2;
      let rows = Math.ceil(total / cols);
      let gridW = w - fr * 2 - 40;
      let gridH = h - fr * 2 - 130;
      let cellW = (gridW - gap * (cols - 1)) / cols;
      let cellH = (gridH - gap * (rows - 1)) / rows;
      let ox = fr + 20, oy = fr + 20;
      chosen.slice(0, 8).forEach((p, i) => {
        let col = i % cols, row = Math.floor(i / cols);
        let x = ox + col * (cellW + gap);
        let y = oy + row * (cellH + gap);
        c.save();
        c.shadowColor = '#00000025'; c.shadowBlur = 14; c.shadowOffsetY = 4;
        c.fillStyle = '#fff';
        roundRect(c, x - 4, y - 4, cellW + 8, cellH + 8, radius);
        c.fill();
        c.restore();
        c.save();
        roundRect(c, x, y, cellW, cellH, radius - 2);
        c.clip();
        draw(c, p, x, y, cellW, cellH);
        c.restore();
      });
      break;
    }
    case 'film': {
      let filmW = w - fr * 2 - 20;
      let filmX = fr + 10;
      let sprocketW = 16;
      let photoW = filmW - sprocketW * 2 - 16;
      let photoH = 240;
      let photoX = filmX + sprocketW + 8;

      // Film background
      c.fillStyle = '#1a1a1a';
      roundRect(c, filmX, fr + 8, filmW, h - fr * 2 - 16, 4);
      c.fill();
      c.strokeStyle = '#444';
      c.lineWidth = 2;
      roundRect(c, filmX, fr + 8, filmW, h - fr * 2 - 16, 4);
      c.stroke();

      // Sprocket holes
      c.fillStyle = '#333';
      let totalH = h - fr * 2 - 16;
      for (let sy = 0; sy < totalH; sy += 26) {
        roundRect(c, filmX + 4, fr + 12 + sy, 8, 14, 2);
        c.fill();
        roundRect(c, filmX + filmW - 12, fr + 12 + sy, 8, 14, 2);
        c.fill();
      }

      // Photos
      chosen.forEach((p, i) => {
        let y = fr + 16 + i * (photoH + 10);
        c.save();
        c.shadowColor = '#00000066'; c.shadowBlur = 8;
        c.fillStyle = '#222';
        roundRect(c, photoX - 2, y - 2, photoW + 4, photoH + 4, 2);
        c.fill();
        c.restore();
        c.save();
        roundRect(c, photoX, y, photoW, photoH, 2);
        c.clip();
        draw(c, p, photoX, y, photoW, photoH);
        c.restore();
        c.fillStyle = '#555';
        c.font = '400 9px "DM Mono", monospace';
        c.textAlign = 'right';
        c.fillText(`${i + 1}A`, filmX + filmW - 16, y + photoH + 10);
      });
      break;
    }
    case 'polaroid': {
      let pw = 480, ph = 500;
      let bottomBar = 90;
      let ox = (w - pw) / 2;
      let oy = fr + 20;

      // Shadow
      c.save();
      c.shadowColor = '#00000040'; c.shadowBlur = 30; c.shadowOffsetY = 10;
      c.fillStyle = '#fff';
      roundRect(c, ox - 16, oy - 12, pw + 32, ph + bottomBar + 16, 6);
      c.fill();
      c.restore();

      // Photo
      c.save();
      roundRect(c, ox, oy, pw, ph, 3);
      c.clip();
      draw(c, chosen[0], ox, oy, pw, ph);
      c.restore();

      // Caption area
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#333';
      c.font = 'italic 600 17px "Cormorant Garamond", serif';
      let cap = $('#captionInput').value.trim() || 'DEWA PHOTO BOOTH';
      c.fillText(cap, w / 2, oy + ph + bottomBar / 2);
      break;
    }
    case 'collage': {
      let positions = [
        { x: 40, y: 20, w: 280, h: 350, rot: -4 },
        { x: 380, y: 30, w: 280, h: 350, rot: 3 },
        { x: 160, y: 220, w: 280, h: 350, rot: -1.5 },
        { x: 460, y: 240, w: 240, h: 290, rot: 5 },
        { x: 30, y: 400, w: 240, h: 290, rot: -6 },
        { x: 320, y: 420, w: 240, h: 290, rot: 4 },
        { x: 150, y: 480, w: 230, h: 280, rot: -3 },
        { x: 480, y: 490, w: 230, h: 280, rot: 2 }
      ];
      let offX = (w - 800) / 2;
      chosen.slice(0, 8).forEach((p, i) => {
        let pos = positions[i] || positions[0];
        let px = pos.x + offX;
        let py = pos.y + fr + 10;
        c.save();
        c.translate(px + pos.w / 2, py + pos.h / 2);
        c.rotate(pos.rot * Math.PI / 180);
        c.shadowColor = '#00000035'; c.shadowBlur = 18; c.shadowOffsetY = 6;
        c.fillStyle = '#fff';
        roundRect(c, -pos.w / 2 - 6, -pos.h / 2 - 6, pos.w + 12, pos.h + 12, 5);
        c.fill();
        c.restore();
        c.save();
        c.translate(px + pos.w / 2, py + pos.h / 2);
        c.rotate(pos.rot * Math.PI / 180);
        roundRect(c, -pos.w / 2, -pos.h / 2, pos.w, pos.h, 3);
        c.clip();
        draw(c, p, -pos.w / 2, -pos.h / 2, pos.w, pos.h);
        c.restore();
      });
      break;
    }
  }

  // ── 5. Caption bar (inside frame) ──
  if (layout !== 'polaroid') {
    let barH = 65;
    c.fillStyle = 'rgba(255,255,255,.92)';
    c.fillRect(fr, h - barH - fr, w - fr * 2, barH);
    c.fillStyle = '#e0d8c8';
    c.fillRect(fr, h - barH - fr, w - fr * 2, 1);
  }

  stamp(c, w, h, fr, layout === 'polaroid');
  add(canvas.toDataURL('image/jpeg', .92));
  closeReview();
  notice('Hasil siap. Tekan tombol kuning untuk unduh.');
}

/* ── Gallery ── */
function add(data) {
  galleryEmpty.hidden = true;
  gallery.hidden = false;
  let n = gallery.children.length + 1,
    card = document.createElement('article');
  card.className = `photo-card layout-${layout}`;
  card.style.setProperty('--tilt', `${[-2, 1.5, -1, 2][(n - 1) % 4]}deg`);
  card.innerHTML = `
    <img src="${data}" alt="Hasil foto DEWA ke-${n}">
    <span>DEWA / ${String(n).padStart(2, '0')}</span>
    <button class="download" title="Unduh foto" aria-label="Unduh foto">↓</button>`;
  card.querySelector('.download').onclick = () => {
    let a = document.createElement('a');
    a.href = data; a.download = `dewa-photo-${n}.jpg`; a.click();
  };
  gallery.prepend(card);
  galleryCount.textContent = `${n} FOTO TERSIMPAN DI SINI`;
}

/* ── UI helpers ── */
function choose(id, set, selector, e) {
  let b = e.target.closest('button');
  if (!b) return;
  set(b.dataset[id]);
  $$(selector).forEach(x => x.classList.toggle('active', x === b));
  return b;
}

function renderCovers(cat = 'studio') {
  $('#covers').innerHTML = covers[cat].map(([id, label, style]) =>
    `<button class="cover ${id === cover ? 'active' : ''}" data-cover="${id}" type="button" title="${label}" style="--cover:${style}"><i></i></button>`
  ).join('');
}

/* ── Event bindings ── */
const overlayCapture = $('#overlayCapture');
const captionInput = $('#captionInput');
const cameraCaptionOverlay = $('#cameraCaptionOverlay');

if (captionInput && cameraCaptionOverlay) {
  cameraCaptionOverlay.className = `camera-caption-overlay pos-${captionPos}`;
  captionInput.addEventListener('input', () => {
    const val = captionInput.value.trim();
    if (val) {
      cameraCaptionOverlay.textContent = val;
      cameraCaptionOverlay.classList.add('show');
    } else {
      cameraCaptionOverlay.textContent = '';
      cameraCaptionOverlay.classList.remove('show');
    }
  });
}

const captionPositions = $('#captionPositions');
if (captionPositions && cameraCaptionOverlay) {
  captionPositions.onclick = e => {
    let b = e.target.closest('button');
    if (!b) return;
    captionPos = b.dataset.pos;
    $$('#captionPositions .pos-btn').forEach(x => x.classList.toggle('active', x === b));
    const val = captionInput ? captionInput.value.trim() : '';
    cameraCaptionOverlay.className = `camera-caption-overlay pos-${captionPos} ${val ? 'show' : ''}`;
  };
}

const syncEmojiUI = (chosenEmoji) => {
  sticker = chosenEmoji;
  $$('#emojiPicker .emoji-opt').forEach(x => x.classList.toggle('active', x.dataset.emoji === sticker));
  $$('#modalEmojis .m-emoji').forEach(x => x.classList.toggle('active', x.dataset.emoji === sticker));
};

const emojiPicker = $('#emojiPicker');
if (emojiPicker) {
  emojiPicker.onclick = e => {
    let b = e.target.closest('button');
    if (!b) return;
    syncEmojiUI(b.dataset.emoji || '');
  };
}

const modalEmojis = $('#modalEmojis');
if (modalEmojis) {
  modalEmojis.onclick = e => {
    let b = e.target.closest('button');
    if (!b) return;
    syncEmojiUI(b.dataset.emoji || '');
  };
}

const customEmojiInput = $('#customEmojiInput');
if (customEmojiInput) {
  customEmojiInput.oninput = () => {
    let val = customEmojiInput.value.trim();
    syncEmojiUI(val);
  };
}

$('#filters').onclick = e => {
  let b = choose('filter', v => filter = v, '.filter', e);
  if (b) stage.style.setProperty('--camera-filter', filters[filter]);
};
$('#formats').onclick = e => {
  let b = choose('format', v => format = v, '.format', e);
  if (b) stage.style.setProperty('--stage-ratio', format === 'portrait' ? '4/5' : '16/10');
};
$('#shotCount').onclick = e => choose('shots', v => shots = Number(v), '.shot', e);
$('#timerOptions').onclick = e => {
  let b = choose('timer', v => timer = Number(v), '.timer', e);
  if (b) {
    let helpEl = $('#helpTimer');
    if (helpEl) helpEl.textContent = `Setiap foto diambil setelah hitung mundur ${timer} detik.`;
  }
};
$('#layouts').onclick = e => choose('layout', v => layout = v, '.layout', e);
$('#stickers').onclick = e => choose('sticker', v => sticker = v, '.sticker', e);

renderCovers();
$('#coverTabs').onclick = e => {
  let b = e.target.closest('button');
  if (!b) return;
  $$('.cover-tab').forEach(x => x.classList.toggle('active', x === b));
  renderCovers(b.dataset.category);
};
$('#covers').onclick = e => choose('cover', v => cover = v, '.cover', e);

reviewGrid.onclick = e => {
  let r = e.target.closest('[data-retake]');
  if (r) return retake(Number(r.dataset.retake));
  let card = e.target.closest('.review-item');
  if (!card) return;
  let item = session[Number(card.dataset.index)];
  item.selected = !item.selected;
  renderReview();
};

cameraButton.onclick = startCamera;
flipButton.onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; startCamera(); };
captureButton.onclick = takePhoto;
overlayCapture.onclick = () => captureButton.click();
$('#makePrintButton').onclick = makePrint;
$('#reviewClose').onclick = closeReview;

function toggleFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  } else {
    if (stage.requestFullscreen) stage.requestFullscreen();
    else if (stage.webkitRequestFullscreen) stage.webkitRequestFullscreen();
  }
}

function syncFullscreenUI() {
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
  const mainBtn = $('#fullscreenButton');
  const overlayBtn = $('#fsOverlayButton');
  if (mainBtn) mainBtn.innerHTML = isFS ? 'EXIT FULLSCREEN ↙' : 'FULLSCREEN ↗';
  if (overlayBtn) overlayBtn.innerHTML = isFS ? '⤢ KELUAR' : '⤢ FULLSCREEN';
}

document.addEventListener('fullscreenchange', syncFullscreenUI);
document.addEventListener('webkitfullscreenchange', syncFullscreenUI);

$('#fullscreenButton').onclick = toggleFullscreen;
$('#fsOverlayButton').onclick = toggleFullscreen;

$('#qrButton').onclick = () => {
  $('#qrImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(location.href)}`;
  $('#qrModal').classList.add('open');
};
$('#qrClose').onclick = () => $('#qrModal').classList.remove('open');

window.addEventListener('beforeunload', () => stream?.getTracks().forEach(x => x.stop()));
