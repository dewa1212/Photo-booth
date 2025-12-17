document.addEventListener("DOMContentLoaded", () => {
  const PHOTOS_PER_STRIP = 4;
  const COUNTDOWN_TIME = 3;
  const DELAY_BETWEEN_PHOTOS = 1200;

  const video = document.getElementById("video");
  const captureCanvas = document.getElementById("capture-canvas");
  const stripCanvas = document.getElementById("strip-canvas");
  const photoStripElement = document.getElementById("photo-strip");

  const captureBtn = document.getElementById("capture-btn");
  const printBtn = document.getElementById("print-btn");
  const saveBtn = document.getElementById("save-btn");
  const retakeBtn = document.getElementById("retake-btn");

  const currentFilterLabel = document.getElementById("current-filter");
  const stripResultArea = document.getElementById("strip-result-area");
  const feedbackOverlay = document.getElementById("feedback-overlay");
  const feedbackText = document.getElementById("feedback-text");
  const flashOverlay = document.getElementById("flash-overlay");
  const progressInfo = document.getElementById("progress-info");
  const currentPhotoCountSpan = document.getElementById("current-photo-count");
  const totalPhotoCountSpan = document.getElementById("total-photo-count");
  const loadingStrip = document.getElementById("loading-strip");
  const filterOptions = document.querySelectorAll(".filter-option");
  const coverBg = document.getElementById("coverBg");
  const startBtn = document.getElementById("startBtn");

  let stream = null;
  let capturedPhotosData = [];
  let currentStripDataUrl = null;
  let isCapturing = false;
  let currentFilter = "normal";

  // Start Button Click
  startBtn.addEventListener("click", () => {
    coverBg.classList.add("hidden");
    setTimeout(() => {
      triggerLoadAnimation();
    }, 100);
  });

  async function initializeWebcam() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 800 },
          height: { ideal: 600 },
          facingMode: "user",
        },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      captureBtn.disabled = false;
      console.log("Webcam siap.");
    } catch (err) {
      console.error("Error webcam: ", err);
      alert(
        "Tidak bisa akses webcam.\nPastikan Anda memberikan izin dan tidak ada aplikasi lain yang menggunakannya."
      );
      captureBtn.disabled = true;
      captureBtn.innerHTML =
        '<i class="fas fa-video-slash"></i> Webcam Error';
    }
  }

  function triggerLoadAnimation() {
    setTimeout(() => {
      document.body.classList.add("loaded");
      initializeWebcam();
    }, 100);
  }

  function applyFilter(filterName) {
    currentFilter = filterName;
    currentFilterLabel.textContent =
      filterName.charAt(0).toUpperCase() + filterName.slice(1);
    video.style.filter = "";

    switch (filterName) {
      case "vintage":
        video.style.filter =
          "sepia(0.5) contrast(1.1) brightness(0.95)";
        break;
      case "grayscale":
        video.style.filter = "grayscale(1)";
        break;
      case "sepia":
        video.style.filter = "sepia(0.8)";
        break;
      case "funky":
        video.style.filter =
          "saturate(1.6) hue-rotate(45deg) contrast(1.1)";
        break;
      default:
        video.style.filter = "none";
    }
  }

  function startCaptureSequence() {
    if (isCapturing) return;
    isCapturing = true;

    capturedPhotosData = [];
    currentStripDataUrl = null;

    captureBtn.disabled = true;
    printBtn.disabled = true;
    saveBtn.disabled = true;
    retakeBtn.disabled = true;

    progressInfo.style.display = "inline-block";
    totalPhotoCountSpan.textContent = PHOTOS_PER_STRIP;
    currentPhotoCountSpan.textContent = "0";

    stripResultArea.classList.remove("active");
    photoStripElement.src = "";
    photoStripElement.style.display = "none";
    loadingStrip.style.display = "flex";

    captureBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Memproses...';

    capturePhotoWithCountdown(1);
  }

  function capturePhotoWithCountdown(photoNumber) {
    currentPhotoCountSpan.textContent = photoNumber;
    let count = COUNTDOWN_TIME;

    feedbackText.textContent = count;
    feedbackOverlay.classList.add("show");

    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        feedbackText.textContent = count;
      } else if (count === 0) {
        feedbackText.textContent = "SENYUM!";
      } else {
        clearInterval(countdownInterval);
        feedbackOverlay.classList.remove("show");
        captureSingleFrame(photoNumber);

        if (photoNumber < PHOTOS_PER_STRIP) {
          setTimeout(() => {
            capturePhotoWithCountdown(photoNumber + 1);
          }, DELAY_BETWEEN_PHOTOS);
        } else {
          setTimeout(() => {
            console.log("Selesai, membuat strip...");
            progressInfo.style.display = "none";
            captureBtn.innerHTML =
              '<i class="fas fa-camera"></i> Mulai Foto Strip';
            generatePhotoStrip();
          }, 500);
        }
      }
    }, 1000);
  }

  function captureSingleFrame(photoNumber) {
    flashOverlay.classList.add("flash");
    setTimeout(() => flashOverlay.classList.remove("flash"), 120);

    const context = captureCanvas.getContext("2d");
    captureCanvas.width = video.videoWidth || 800;
    captureCanvas.height = video.videoHeight || 600;

    // mirror video ke canvas
    context.save();
    context.translate(captureCanvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(
      video,
      0,
      0,
      captureCanvas.width,
      captureCanvas.height
    );
    context.restore();

    // simpan ke data URL
    const img = new Image();
    img.src = captureCanvas.toDataURL("image/png");
    capturedPhotosData.push(img);
  }

  function generatePhotoStrip() {
    if (capturedPhotosData.length === 0) {
      alert("Tidak ada foto yang tertangkap.");
      isCapturing = false;
      captureBtn.disabled = false;
      retakeBtn.disabled = false;
      loadingStrip.style.display = "none";
      return;
    }

    const sampleImg = capturedPhotosData[0];
    const singleWidth = sampleImg.width || captureCanvas.width;
    const singleHeight = sampleImg.height || captureCanvas.height;

    const gap = 20;
    const margin = 30;

    stripCanvas.width = singleWidth + 2 * 20;
    stripCanvas.height =
      PHOTOS_PER_STRIP * singleHeight +
      (PHOTOS_PER_STRIP - 1) * gap +
      2 * margin;

    const ctx = stripCanvas.getContext("2d");

    // background strip
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);

    // border
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, stripCanvas.width - 4, stripCanvas.height - 4);

    // gambar foto-foto
    capturedPhotosData.forEach((img, i) => {
      const x = (stripCanvas.width - singleWidth) / 2;
      const y = margin + i * (singleHeight + gap);
      ctx.drawImage(img, x, y, singleWidth, singleHeight);
    });

    // hasil
    currentStripDataUrl = stripCanvas.toDataURL("image/png");
    photoStripElement.src = currentStripDataUrl;
    photoStripElement.style.display = "block";
    stripResultArea.classList.add("active");
    loadingStrip.style.display = "none";

    printBtn.disabled = false;
    saveBtn.disabled = false;
    retakeBtn.disabled = false;
    captureBtn.disabled = false;
    isCapturing = false;
  }

  function saveStrip() {
    if (!currentStripDataUrl) return;
    const a = document.createElement("a");
    a.href = currentStripDataUrl;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `dewa-photo-strip-${ts}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function printStrip() {
    if (!currentStripDataUrl) return;
    window.print();
  }

  // Event listeners
  captureBtn.addEventListener("click", startCaptureSequence);
  saveBtn.addEventListener("click", saveStrip);
  printBtn.addEventListener("click", printStrip);

  retakeBtn.addEventListener("click", () => {
    capturedPhotosData = [];
    currentStripDataUrl = null;
    stripResultArea.classList.remove("active");
    photoStripElement.src = "";
    photoStripElement.style.display = "none";
    loadingStrip.style.display = "flex";
  });

  filterOptions.forEach((opt) => {
    opt.addEventListener("click", () => {
      filterOptions.forEach((o) => o.classList.remove("active"));
      opt.classList.add("active");
      applyFilter(opt.dataset.filter);
    });
  });

  // Kalau mau langsung tanpa cover, bisa panggil triggerLoadAnimation() di sini
  // triggerLoadAnimation();
});
