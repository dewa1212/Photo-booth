document.addEventListener("DOMContentLoaded", () => {
  const PHOTOS_PER_STRIP = 4;
  const COUNTDOWN_TIME = 3;
  const GAP = 10;
  const MARGIN = 16;

  const video = document.getElementById("video");
  const captureCanvas = document.getElementById("capture-canvas");
  const stripCanvas = document.getElementById("strip-canvas");
  const photoStrip = document.getElementById("photo-strip");

  const captureBtn = document.getElementById("capture-btn");
  const saveBtn = document.getElementById("save-btn");
  const printBtn = document.getElementById("print-btn");
  const retakeBtn = document.getElementById("retake-btn");

  const countdownOverlay = document.getElementById("countdown-overlay");
  const countdownText = document.getElementById("countdown-text");
  const progress = document.getElementById("progress");
  const currentCount = document.getElementById("current-count");
  const loading = document.getElementById("loading");

  let stream = null;
  let isCapturing = false;
  let photos = [];
  let stripDataUrl = null;

  async function initCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      captureBtn.disabled = false;
    } catch (err) {
      console.error(err);
      alert(
        "Tidak bisa akses webcam.\nPastikan izin kamera aktif dan tidak dipakai aplikasi lain."
      );
      captureBtn.disabled = true;
    }
  }

  function startStripCapture() {
    if (isCapturing) return;
    isCapturing = true;
    photos = [];
    stripDataUrl = null;

    captureBtn.disabled = true;
    saveBtn.disabled = true;
    printBtn.disabled = true;

    progress.hidden = false;
    currentCount.textContent = "0";

    loading.hidden = false;
    photoStrip.hidden = true;

    captureNext(1);
  }

  function captureNext(n) {
    currentCount.textContent = n.toString();
    let countdown = COUNTDOWN_TIME;

    countdownText.textContent = countdown;
    countdownOverlay.classList.add("show");

    const timer = setInterval(() => {
      countdown -= 1;
      if (countdown > 0) {
        countdownText.textContent = countdown;
      } else if (countdown === 0) {
        countdownText.textContent = "Senyum!";
      } else {
        clearInterval(timer);
        countdownOverlay.classList.remove("show");
        grabFrame();

        if (n < PHOTOS_PER_STRIP) {
          setTimeout(() => captureNext(n + 1), 800);
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
    // tunggu image load (simple delay cukup untuk kasus ini)
    setTimeout(() => {
      buildStrip();
    }, 400);
  }

  function buildStrip() {
    if (!photos.length) {
      isCapturing = false;
      captureBtn.disabled = false;
      return;
    }

    const w = photos[0].width || captureCanvas.width;
    const h = photos[0].height || captureCanvas.height;

    stripCanvas.width = w + MARGIN * 2;
    stripCanvas.height =
      PHOTOS_PER_STRIP * h + (PHOTOS_PER_STRIP - 1) * GAP + MARGIN * 2;

    const ctx = stripCanvas.getContext("2d");

    // kartu putih minimalis untuk strip
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);

    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(
      4,
      4,
      stripCanvas.width - 8,
      stripCanvas.height - 8
    );

    // isi
    photos.forEach((img, i) => {
      const x = (stripCanvas.width - w) / 2;
      const y = MARGIN + i * (h + GAP);
      ctx.drawImage(img, x, y, w, h);
    });

    // logo kecil “Dewa Photo” di bawah
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      "Dewa Photo",
      stripCanvas.width / 2,
      stripCanvas.height - 8
    );

    stripDataUrl = stripCanvas.toDataURL("image/png");
    photoStrip.src = stripDataUrl;
    photoStrip.hidden = false;
    loading.hidden = true;

    saveBtn.disabled = false;
    printBtn.disabled = false;
    captureBtn.disabled = false;
    isCapturing = false;
    progress.hidden = true;
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

  function resetResult() {
    photos = [];
    stripDataUrl = null;
    photoStrip.hidden = true;
    loading.hidden = false;
    saveBtn.disabled = true;
    printBtn.disabled = true;
  }

  captureBtn.addEventListener("click", startStripCapture);
  saveBtn.addEventListener("click", saveStrip);
  printBtn.addEventListener("click", printStrip);
  retakeBtn.addEventListener("click", resetResult);

  initCamera();
});
