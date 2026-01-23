let stream = null;
let photos = [];
let currentFilter = "none";
let currentBackground = "#ffffff";
let currentLayout = "2x2";

const cameraPreview = document.getElementById("cameraPreview");
const photoCanvas = document.getElementById("photoCanvas");
const cameraLoading = document.getElementById("cameraLoading");
const flashEffect = document.getElementById("flashEffect");
const countdownOverlay = document.getElementById("countdownOverlay");
const countdownNumber = document.getElementById("countdownNumber");
const galleryGrid = document.getElementById("galleryGrid");
const previewModal = document.getElementById("previewModal");
const previewImage = document.getElementById("previewImage");

// Filter definitions
const filters = {
  none: "none",
  grayscale: "grayscale(100%)",
  sepia: "sepia(100%)",
  vintage: "sepia(50%) contrast(110%) brightness(110%)",
  bright: "brightness(120%) contrast(110%)",
  contrast: "contrast(130%) saturate(120%)",
  warm: "sepia(30%) saturate(120%) hue-rotate(-10deg)",
  cool: "saturate(120%) hue-rotate(10deg) brightness(105%)",
};

// Start camera
document.getElementById("startCamera").addEventListener("click", async () => {
  try {
    cameraLoading.style.display = "flex";
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    cameraPreview.srcObject = stream;
    cameraPreview.onloadedmetadata = () => {
      cameraLoading.style.display = "none";
      document.getElementById("takePhoto").disabled = photos.length >= 6;
      setupCanvas();
    };
  } catch (err) {
    alert("Tidak dapat mengakses kamera: " + err.message);
    cameraLoading.style.display = "none";
  }
});

function setupCanvas() {
  photoCanvas.width = cameraPreview.videoWidth;
  photoCanvas.height = cameraPreview.videoHeight;
}

// Take photo
document.getElementById("takePhoto").addEventListener("click", () => {
  let count = 3;
  countdownNumber.textContent = count;
  countdownOverlay.classList.add("active");

  const interval = setInterval(() => {
    count--;
    countdownNumber.textContent = count;
    if (count <= 0) {
      clearInterval(interval);
      capturePhoto();
    }
  }, 1000);
});

function capturePhoto() {
  countdownOverlay.classList.remove("active");
  flashEffect.classList.add("active");
  setTimeout(() => flashEffect.classList.remove("active"), 300);

  const ctx = photoCanvas.getContext("2d");
  ctx.filter = filters[currentFilter];
  ctx.drawImage(cameraPreview, 0, 0);
  ctx.filter = "none";

  const photoData = photoCanvas.toDataURL("image/png");
  photos.push({
    data: photoData,
    filter: currentFilter,
    timestamp: Date.now(),
  });

  updateGallery();
  updateCounter();

  if (photos.length >= 6) {
    document.getElementById("takePhoto").disabled = true;
  }

  document.getElementById("generateStrip").disabled = photos.length < 2;
}

// Filter selection
document.querySelectorAll(".filter-option").forEach((option) => {
  option.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-option")
      .forEach((o) => o.classList.remove("active"));
    option.classList.add("active");
    currentFilter = option.dataset.filter;
    cameraPreview.style.filter = filters[currentFilter];
  });
});

// Background selection
document.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("click", () => {
    document
      .querySelectorAll(".color-option")
      .forEach((o) => o.classList.remove("active"));
    option.classList.add("active");
    currentBackground = option.dataset.color;
  });
});

// Layout selection
document.querySelectorAll(".layout-option").forEach((option) => {
  option.addEventListener("click", () => {
    document
      .querySelectorAll(".layout-option")
      .forEach((o) => o.classList.remove("active"));
    option.classList.add("active");
    currentLayout = option.dataset.layout;
  });
});

// Update gallery
function updateGallery() {
  if (photos.length === 0) {
    galleryGrid.innerHTML = `
              <div class="gallery-placeholder">
                  <i class="fas fa-camera" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                  <p>Foto akan muncul di sini</p>
              </div>
          `;
    return;
  }

  galleryGrid.innerHTML = photos
    .map(
      (photo, index) => `
          <div class="gallery-item">
              <img src="${photo.data}" alt="Foto ${index + 1}">
              <button class="delete-btn" onclick="deletePhoto(${index})">
                  <i class="fas fa-times"></i>
              </button>
          </div>
      `
    )
    .join("");
}

function deletePhoto(index) {
  photos.splice(index, 1);
  updateGallery();
  updateCounter();
  document.getElementById("takePhoto").disabled =
    photos.length >= 6 ? true : false;
  document.getElementById("generateStrip").disabled = photos.length < 2;
}

function updateCounter() {
  document.getElementById("photoCount").textContent = `${photos.length}/6 Foto`;
  const percentage = (photos.length / 6) * 100;
  document.getElementById("counterFill").style.width = percentage + "%";
}

// Clear all
document.getElementById("clearAll").addEventListener("click", () => {
  if (confirm("Hapus semua foto?")) {
    photos = [];
    updateGallery();
    updateCounter();
    document.getElementById("takePhoto").disabled = false;
    document.getElementById("generateStrip").disabled = true;
  }
});

// Generate photo strip
document.getElementById("generateStrip").addEventListener("click", () => {
  const layouts = {
    "2x2": { cols: 2, rows: 2, max: 4 },
    "2x3": { cols: 2, rows: 3, max: 6 },
    "1x4": { cols: 1, rows: 4, max: 4 },
  };

  const layout = layouts[currentLayout];
  const stripPhotos = photos.slice(0, layout.max);

  const stripCanvas = document.createElement("canvas");
  const photoWidth = 400;
  const photoHeight = 500;
  const padding = 40;
  const borderWidth = 20;

  stripCanvas.width =
    photoWidth * layout.cols + padding * (layout.cols + 1) + borderWidth * 2;
  stripCanvas.height =
    photoHeight * layout.rows + padding * (layout.rows + 1) + borderWidth * 2;

  const ctx = stripCanvas.getContext("2d");

  // Background
  ctx.fillStyle = currentBackground;
  ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);

  // Border
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    borderWidth,
    borderWidth,
    stripCanvas.width - borderWidth * 2,
    stripCanvas.height - borderWidth * 2
  );

  // Draw photos
  stripPhotos.forEach((photo, index) => {
    const col = index % layout.cols;
    const row = Math.floor(index / layout.cols);
    const x = borderWidth + padding + col * (photoWidth + padding);
    const y = borderWidth + padding + row * (photoHeight + padding);

    const img = new Image();
    img.src = photo.data;
    img.onload = () => {
      ctx.drawImage(img, x, y, photoWidth, photoHeight);

      // Add subtle shadow
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;

      if (index === stripPhotos.length - 1) {
        // Show preview
        previewImage.src = stripCanvas.toDataURL("image/png");
        previewModal.classList.add("active");
      }
    };
  });
});

// Preview modal handlers
document.getElementById("closePreview").addEventListener("click", () => {
  previewModal.classList.remove("active");
});

document.getElementById("downloadPreview").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `photostrip-${Date.now()}.png`;
  link.href = previewImage.src;
  link.click();
});

previewModal.addEventListener("click", (e) => {
  if (e.target === previewModal) {
    previewModal.classList.remove("active");
  }
});
