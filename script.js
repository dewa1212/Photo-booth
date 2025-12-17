document.addEventListener("DOMContentLoaded", () => {
  const PHOTOS = 4;
  const COUNTDOWN = 3;
  const GAP = 8;
  const MARGIN = 16;

  const video = document.getElementById("video");
  const captureCanvas = document.getElementById("capture-canvas");
  const stripCanvas = document.getElementById("strip-canvas");
  const stripPreview = document.getElementById("strip-preview");

  const shootBtn = document.getElementById("shoot-btn");
  const saveBtn = document.getElementById("save-btn");
  const printBtn = document.getElementById("print-btn");
  const resetBtn = document.getElementById("reset-btn");

  const countdown = document.getElementById("countdown");
  const countdownNumber = document.getElementById("countdown-number");
  const status = document.getElementById("status");
  const statusCount = document.getElementById("status-count");
  const loading = document.getElementById("loading");

  let isCapturing = false;
  let photos = [];
  let stripDataUrl = null;

  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      shootBtn.disabled = false;
    } catch (e) {
      console.error(e);
      alert(
        "Tidak bisa akses webcam.\nPastikan izin kamera aktif dan tidak dipakai aplikasi lain."
      );
      shootBtn.disabled = true;
    }
  }

  function startStrip() {
    if (isCapturing) return;
    isCapturing = true;
    photos = [];
    stripDataUrl = null;

    shootBtn.disabled = true;
    saveBtn.disabled = true;
    printBtn.disabled = true;

    status.hidden = false;
    statusCount.textContent = "0";

    loading.hidden = false;
    stripPreview.hidden = true;

    captureWithCountdown(1);
  }

  function captureWithCountdown(n) {
    statusCount.textContent = String(n);
    let timeLeft = COUNTDOWN;

    countdownNumber.textContent = timeLeft;
    countdown.classList.add("show");

    const timer = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft > 0) {
        countdownNumber.textContent = timeLeft;
      } else if (timeLeft === 0) {
        countdownNumber.textContent = "Senyum!";
      } else {
        clearInterval(timer);
        countdown.classList.remove("show");
        grabFrame();

        if (n < PHOTOS) {
          setTimeout(() => captureWithCountdown(n + 1), 800);
        } else {
          finishStrip();
        }
      }
    }, 1000);
  }

  function grabFrame() {
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;

    captureCanvas.width = w;
    captureCanvas.height = h;

    const ctx = captureCanvas.getContext("2d");
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    const img = new Image();
    img.src = captureCanvas.toDataURL("image/png");
    photos.push(img);
  }

  function finishStrip() {
    // beri waktu image load
    setTimeout(() => buildStrip(), 400);
  }

  function buildStrip() {
    if (!photos.length) {
      isCapturing = false;
      shootBtn.disabled = false;
      return;
    }

    const w = photos[0].width || captureCanvas.width;
    const h = photos[0].height || captureCanvas.height;

    stripCanvas.width = w + MARGIN * 2;
    stripCanvas.height = PHOTOS * h + (PHOTOS - 1) * GAP + MARGIN * 2;

    const ctx = stripCanvas.getContext("2d");

    // kartu strip
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);

    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(
      4,
      4,
      stripCanvas.width - 8,
      stripCanvas.height - 8
    );

    photos.forEach((img, i) => {
      const x = (stripCanvas.width - w) / 2;
      const y = MARGIN + i * (h + GAP);
      ctx.drawImage(img, x, y, w, h);
    });

    ctx.fillStyle = "#6b7280";
    ctx.font = "13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      "Dewa Photo",
      stripCanvas.width / 2,
      stripCanvas.height - 8
    );

    stripDataUrl = stripCanvas.toDataURL("image/png");
    stripPreview.src = stripDataUrl;
    stripPreview.hidden = false;
    loading.hidden = true;

    saveBtn.disabled = false;
    printBtn.disabled = false;
    shootBtn.disabled = false;
    status.hidden = true;
    isCapturing = false;
  }

  function saveStrip() {
    if (!stripDataUrl) return;
    const a = document.createElement("a");
    a.href = stripDataUrl;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `dewa-photo-strip-${ts}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function printStrip() {
    if (!stripDataUrl) return;
    window.print();
  }

  function resetStrip() {
    photos = [];
    stripDataUrl = null;
    stripPreview.hidden = true;
    loading.hidden = false;
    saveBtn.disabled = true;
    printBtn.disabled = true;
  }

  shootBtn.addEventListener("click", startStrip);
  saveBtn.addEventListener("click", saveStrip);
  printBtn.addEventListener("click", printStrip);
  resetBtn.addEventListener("click", resetStrip);

  initCamera();
});
