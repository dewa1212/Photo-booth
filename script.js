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
  const boothArea = document.getElementById("booth-area");
  const stripResultArea = document.getElementById("strip-result-area");
  const feedbackOverlay = document.getElementById("feedback-overlay");
  const feedbackText = document.getElementById("feedback-text");
  const flashOverlay = document.getElementById("flash-overlay");
  const progressInfo = document.getElementById("progress-info");
  const currentPhotoCountSpan = document.getElementById("current-photo-count");
  const totalPhotoCountSpan = document.getElementById("total-photo-count");
  const loadingStrip = document.getElementById("loading-strip");
  const boothContainer = document.querySelector(".booth-container");
  const filterOptions = document.querySelectorAll(".filter-option");

  let stream = null;
  let capturedPhotosData = [];
  let currentStripDataUrl = null;
  let isCapturing = false;
  let currentFilter = "normal";

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
      console.log("Webcam siap.");
      captureBtn.disabled = false;
    } catch (err) {
      console.error("Error webcam: ", err);
      alert(
        "Tidak bisa akses webcam.\nPastikan Anda memberikan izin dan tidak ada aplikasi lain yang menggunakannya."
      );
      captureBtn.disabled = true;
      captureBtn.innerHTML = '<i class="fas fa-video-slash"></i> Webcam Error';
    }
  }

  function triggerLoadAnimation() {
    setTimeout(() => {
      document.body.classList.add("loaded");
    }, 100);
  }

  function applyFilter(filterName) {
    currentFilter = filterName;
    currentFilterLabel.textContent =
      filterName.charAt(0).toUpperCase() + filterName.slice(1);
    video.style.filter = "";

    switch (filterName) {
      case "vintage":
        video.style.filter = "sepia(0.5) contrast(1.1) brightness(0.95)";
        break;
      case "grayscale":
        video.style.filter = "grayscale(1)";
        break;
      case "sepia":
        video.style.filter = "sepia(0.8)";
        break;
      case "funky":
        video.style.filter = "saturate(1.6) hue-rotate(45deg) contrast(1.1)";
        break;
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
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;

    context.translate(captureCanvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    context.setTransform(1, 0, 0, 1, 0, 0);

    if (currentFilter !== "normal") {
      context.save();
      switch (currentFilter) {
        case "vintage":
          context.filter = "sepia(0.5) contrast(1.1) brightness(0.95)";
          break;
        case "grayscale":
          context.filter = "grayscale(1)";
          break;
        case "sepia":
          context.filter = "sepia(0.8)";
          break;
        case "funky":
          context.filter = "saturate(1.6) hue-rotate(45deg) contrast(1.1)";
          break;
      }
      context.drawImage(captureCanvas, 0, 0);
      context.restore();
    }

    const dataUrl = captureCanvas.toDataURL("image/png");
    capturedPhotosData.push(dataUrl);
    console.log(`Foto ${photoNumber} captured.`);
  }

  async function generatePhotoStrip() {
    if (capturedPhotosData.length !== PHOTOS_PER_STRIP) {
      console.error("Jumlah foto tidak sesuai.");
      resetCaptureProcess("Error: Jumlah foto salah.");
      return;
    }

    stripResultArea.classList.add("active");
    loadingStrip.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Membuat strip...`;

    const stripCtx = stripCanvas.getContext("2d");
    const images = [];
    let photoWidth = 0,
      photoHeight = 0;

    try {
      const imagePromises = capturedPhotosData.map((dataUrl) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            if (images.length === 0) {
              photoWidth = img.naturalWidth;
              photoHeight = img.naturalHeight;
            }
            images.push(img);
            resolve(img);
          };
          img.onerror = reject;
          img.src = dataUrl;
        });
      });
      await Promise.all(imagePromises);
    } catch (error) {
      console.error("Gagal load gambar:", error);
      resetCaptureProcess("Error: Gagal memuat gambar.");
      return;
    }

    if (images.length !== PHOTOS_PER_STRIP || photoWidth === 0) {
      console.error("Load gambar gagal / dimensi 0.");
      resetCaptureProcess("Error: Gagal memproses gambar.");
      return;
    }

    const padding = Math.round(photoWidth * 0.02);
    const stripWidth = photoWidth + padding * 2;
    const stripHeight = (photoHeight + padding) * PHOTOS_PER_STRIP + padding;

    stripCanvas.width = stripWidth;
    stripCanvas.height = stripHeight;

    stripCtx.fillStyle = "#FFFFFF";
    stripCtx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);

    let currentY = padding;
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      stripCtx.drawImage(img, padding, currentY, photoWidth, photoHeight);
      currentY += photoHeight + padding;
    }

    stripCtx.strokeStyle = "#EEE";
    stripCtx.lineWidth = 1;
    stripCtx.strokeRect(0, 0, stripCanvas.width, stripCanvas.height);

    currentStripDataUrl = stripCanvas.toDataURL("image/png");
    photoStripElement.src = currentStripDataUrl;
    console.log("Strip dibuat.");

    loadingStrip.style.display = "none";
    photoStripElement.style.display = "block";
    printBtn.disabled = false;
    saveBtn.disabled = false;
    retakeBtn.disabled = false;
    isCapturing = false;
  }

  function resetCaptureProcess(errorMessage = null) {
    if (errorMessage) {
      alert(errorMessage);
    }
    isCapturing = false;
    capturedPhotosData = [];
    currentStripDataUrl = null;
    captureBtn.disabled = false;
    captureBtn.innerHTML = '<i class="fas fa-camera"></i> Mulai Foto Strip';
    printBtn.disabled = true;
    saveBtn.disabled = true;
    retakeBtn.disabled = false;
    progressInfo.style.display = "none";
    stripResultArea.classList.remove("active");
    setTimeout(() => {
      if (loadingStrip && photoStripElement) {
        loadingStrip.style.display = "flex";
        photoStripElement.style.display = "none";
        photoStripElement.src = "";
      }
    }, 300);
  }

  function printPhotoStrip() {
    if (!currentStripDataUrl || isCapturing) return;
    window.print();
  }

  function savePhotoStrip() {
    if (!currentStripDataUrl || isCapturing) return;
    const link = document.createElement("a");
    link.href = currentStripDataUrl;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.download = `dewaphoto_strip_${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function retakePhoto() {
    if (isCapturing) return;
    resetCaptureProcess();
  }

  captureBtn.addEventListener("click", startCaptureSequence);
  printBtn.addEventListener("click", printPhotoStrip);
  saveBtn.addEventListener("click", savePhotoStrip);
  retakeBtn.addEventListener("click", retakePhoto);

  filterOptions.forEach((option) => {
    option.addEventListener("click", function () {
      if (isCapturing) return;
      filterOptions.forEach((opt) => opt.classList.remove("active"));
      this.classList.add("active");
      applyFilter(this.dataset.filter);
    });
  });

  captureBtn.disabled = true;
  initializeWebcam();
  triggerLoadAnimation();
});
