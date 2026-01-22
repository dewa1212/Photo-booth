/**
 * Photobooth Modern
 * Aplikasi photobooth dengan fitur penggantian background dan frame
 * Dibuat dengan HTML, CSS, dan JavaScript murni
 */

// Inisialisasi variabel global
let cameraStream = null;
let currentBackground = "#ffffff";
let currentFrame = "none";
let photoTaken = false;
let backgroundImage = null;
let countdownInterval = null;
let photos = []; // Array untuk menyimpan foto-foto yang diambil (maksimal 6)
let activePhotoIndex = -1; // Indeks foto yang aktif (sedang dilihat/diedit)

// Daftar preset background (data URL untuk gambar sederhana)
const presetBackgrounds = {
  beach:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIGZpbGw9IiM0RUI4RjkiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjgwIiBmaWxsPSIjRkZDQzAwIi8+PHBhdGggZD0iTTAgNDUwSDEwMDBMODUwIDY1MEgxNTBMMCA0NTBaIiBmaWxsPSIjRkZDRTlCIi8+PC9zdmc+",
  nature:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIGZpbGw9IiM2OEE0NTMiLz48Y2lyY2xlIGN4PSIzMDAiIGN5PSIyMDAiIHI9IjEwMCIgZmlsbD0iIzRFQjhGOSIvPjxjaXJjbGUgY3g9IjcwMCIgY3k9IjE1MCIgcj0iNzAiIGZpbGw9IiM0RUI4RjkiLz48cmVjdCB5PSI0MDAiIHdpZHRoPSIxMDAwIiBoZWlnaHQ9IjM1MCIgZmlsbD0iIzRFQjhGOSIvPjwvc3ZnPg==",
  city: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIGZpbGw9IiMzMzMzMzMiLz48cmVjdCB4PSIxNTAiIHk9IjIwMCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzNTAiIGZpbGw9IiNGRkZGRkYiLz48cmVjdCB4PSI0MDAiIHk9IjE1MCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNGRkZGRkYiLz48cmVjdCB4PSI2NTAiIHk9IjI1MCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNGRkZGRkYiLz48Y2lyY2xlIGN4PSI4MDAiIGN5PSIxMDAiIHI9IjUwIiBmaWxsPSIjRkZDRjAwIi8+PC9zdmc+",
};

// Daftar ukuran cetak dalam cm dan konversi ke piksel (300 DPI untuk kualitas cetak)
const printSizes = {
  "3R": { width: 8.9, height: 12.7, name: "3R (8.9x12.7 cm)" },
  "4R": { width: 10, height: 15, name: "4R (10x15 cm)" },
  "5R": { width: 12.7, height: 17.8, name: "5R (12.7x17.8 cm)" },
  "6R": { width: 15.2, height: 20.3, name: "6R (15.2x20.3 cm)" },
  A4: { width: 21, height: 29.7, name: "A4 (21x29.7 cm)" },
  A5: { width: 14.8, height: 21, name: "A5 (14.8x21 cm)" },
};

// Inisialisasi DOM elements setelah halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
  // Ambil referensi ke elemen DOM yang diperlukan
  const cameraPreview = document.getElementById("cameraPreview");
  const photoCanvas = document.getElementById("photoCanvas");
  const cameraLoading = document.getElementById("cameraLoading");
  const flashEffect = document.getElementById("flashEffect");
  const countdownOverlay = document.getElementById("countdownOverlay");
  const countdownNumber = document.getElementById("countdownNumber");
  const photoPreview = document.getElementById("photoPreview");
  const previewImage = document.getElementById("previewImage");
  const cameraSound = document.getElementById("cameraSound");

  // Tombol-tombol kontrol
  const startCameraBtn = document.getElementById("startCamera");
  const takePhotoBtn = document.getElementById("takePhoto");
  const retakePhotoBtn = document.getElementById("retakePhoto");
  const printPhotoBtn = document.getElementById("printPhoto");
  const clearAllBtn = document.getElementById("clearAll");
  const closePreviewBtn = document.getElementById("closePreview");
  const downloadPreviewBtn = document.getElementById("downloadPreview");

  // Pilihan background
  const colorOptions = document.querySelectorAll(".color-option");
  const presetOptions = document.querySelectorAll(".preset-option");
  const uploadArea = document.getElementById("uploadArea");
  const backgroundUpload = document.getElementById("backgroundUpload");

  // Pilihan frame
  const frameOptions = document.querySelectorAll(".frame-option");

  // Setup event listeners
  setupEventListeners();

  // Fungsi untuk mengatur event listeners
  function setupEventListeners() {
    // Tombol untuk mengaktifkan kamera
    startCameraBtn.addEventListener("click", startCamera);

    // Tombol untuk mengambil foto
    takePhotoBtn.addEventListener("click", startCountdown);

    // Tombol untuk mengambil ulang foto
    retakePhotoBtn.addEventListener("click", retakePhoto);

    // Tombol untuk mencetak foto
    printPhotoBtn.addEventListener("click", printPhoto);

    // Tombol untuk menghapus semua foto
    clearAllBtn.addEventListener("click", clearAllPhotos);

    // Tombol untuk menutup preview
    closePreviewBtn.addEventListener("click", closePreview);

    // Tombol untuk mendownload foto
    downloadPreviewBtn.addEventListener("click", downloadPhoto);

    // Pilihan warna background
    colorOptions.forEach((option) => {
      option.addEventListener("click", function () {
        // Hapus kelas active dari semua opsi warna
        colorOptions.forEach((opt) => opt.classList.remove("active"));
        // Tambahkan kelas active ke opsi yang dipilih
        this.classList.add("active");
        // Set background ke warna yang dipilih
        currentBackground = this.getAttribute("data-color");
        backgroundImage = null; // Reset gambar background
        applyBackgroundToCanvas();
      });
    });

    // Pilihan preset background
    presetOptions.forEach((option) => {
      option.addEventListener("click", function () {
        // Hapus kelas active dari semua opsi preset
        presetOptions.forEach((opt) => opt.classList.remove("active"));
        // Tambahkan kelas active ke opsi yang dipilih
        this.classList.add("active");
        // Set background ke preset yang dipilih
        const preset = this.getAttribute("data-preset");
        applyPresetBackground(preset);
      });
    });

    // Upload background gambar
    backgroundUpload.addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = function (event) {
          // Hapus kelas active dari semua opsi background
          colorOptions.forEach((opt) => opt.classList.remove("active"));
          presetOptions.forEach((opt) => opt.classList.remove("active"));

          // Set background ke gambar yang diupload
          backgroundImage = new Image();
          backgroundImage.onload = function () {
            applyBackgroundToCanvas();
          };
          backgroundImage.src = event.target.result;
        };

        reader.readAsDataURL(file);
      }
    });

    // Pilihan frame
    frameOptions.forEach((option) => {
      option.addEventListener("click", function () {
        // Hapus kelas active dari semua opsi frame
        frameOptions.forEach((opt) => opt.classList.remove("active"));
        // Tambahkan kelas active ke opsi yang dipilih
        this.classList.add("active");
        // Set frame yang dipilih
        currentFrame = this.getAttribute("data-frame");
        applyFrameToCanvas();
      });
    });

    // Set opsi warna pertama sebagai aktif
    if (colorOptions.length > 0) {
      colorOptions[0].classList.add("active");
    }

    // Set opsi frame pertama sebagai aktif
    if (frameOptions.length > 0) {
      frameOptions[0].classList.add("active");
    }

    // Update counter foto
    updatePhotoCounter();
  }

  // Fungsi untuk mengaktifkan kamera
  async function startCamera() {
    try {
      // Tampilkan loading animation
      cameraLoading.style.display = "flex";
      startCameraBtn.disabled = true;

      // Minta akses ke kamera pengguna
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user", // Gunakan kamera depan
        },
        audio: false,
      });

      // Tampilkan stream kamera di elemen video
      cameraPreview.srcObject = cameraStream;

      // Tunggu sampai video siap diputar
      cameraPreview.onloadedmetadata = function () {
        // Sembunyikan loading animation dengan animasi fade out
        cameraLoading.style.opacity = "0";
        setTimeout(() => {
          cameraLoading.style.display = "none";
          cameraLoading.style.opacity = "1";
        }, 300);

        // Aktifkan tombol ambil foto jika belum mencapai 6 foto
        if (photos.length < 6) {
          takePhotoBtn.disabled = false;
        }
        takePhotoBtn.innerHTML = '<i class="fas fa-camera"></i> Ambil Foto';

        // Ubah teks tombol kamera
        startCameraBtn.innerHTML = '<i class="fas fa-sync"></i> Ganti Kamera';
        startCameraBtn.disabled = false;

        // Animasi masuk untuk preview kamera
        cameraPreview.classList.remove("hidden");

        // Setup canvas dengan ukuran yang sama dengan video
        setupCanvas();
      };
    } catch (error) {
      // Tangani error saat mengakses kamera
      console.error("Error mengakses kamera:", error);
      cameraLoading.innerHTML =
        "<p>Gagal mengakses kamera. Pastikan Anda memberikan izin akses kamera.</p>";
      startCameraBtn.disabled = false;

      // Tampilkan pesan error
      setTimeout(() => {
        cameraLoading.style.display = "none";
        alert(
          "Tidak dapat mengakses kamera. Pastikan Anda memberikan izin akses kamera dan perangkat Anda mendukung."
        );
      }, 2000);
    }
  }

  // Fungsi untuk menyiapkan canvas
  function setupCanvas() {
    const canvas = document.getElementById("photoCanvas");
    const video = document.getElementById("cameraPreview");

    // Set ukuran canvas sama dengan video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Apply background awal
    applyBackgroundToCanvas();
  }

  // Fungsi untuk menerapkan background ke canvas
  function applyBackgroundToCanvas() {
    if (!photoTaken && activePhotoIndex === -1) return;

    const canvas = document.getElementById("photoCanvas");
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gambar background
    if (backgroundImage) {
      // Gambar background image
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
      // Gambar background warna solid
      ctx.fillStyle = currentBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Jika ada foto aktif, gambar foto di atas background
    if (activePhotoIndex >= 0 && photos[activePhotoIndex]) {
      drawPhotoOnCanvas();
    } else if (photoTaken) {
      // Jika foto baru saja diambil, gambar dari video
      drawPhotoOnCanvas();
    }

    // Terapkan frame
    applyFrameToCanvas();

    // Update galeri jika ada foto aktif
    if (activePhotoIndex >= 0) {
      updateGalleryItem(activePhotoIndex);
    }
  }

  // Fungsi untuk menerapkan preset background
  function applyPresetBackground(preset) {
    if (presetBackgrounds[preset]) {
      backgroundImage = new Image();
      backgroundImage.onload = function () {
        applyBackgroundToCanvas();
      };
      backgroundImage.src = presetBackgrounds[preset];
    }
  }

  // Fungsi untuk menerapkan frame ke canvas
  function applyFrameToCanvas() {
    if (!photoTaken && activePhotoIndex === -1) return;

    const canvas = document.getElementById("photoCanvas");
    const ctx = canvas.getContext("2d");

    // Simpan gambar asli untuk digambar ulang nanti
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gambar ulang background dan foto
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = currentBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Gambar ulang foto
    drawPhotoOnCanvas();

    // Terapkan efek frame berdasarkan pilihan
    switch (currentFrame) {
      case "simple":
        // Frame sederhana: border abu-abu
        ctx.lineWidth = 20;
        ctx.strokeStyle = "#e0e0e0";
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        break;

      case "polaroid":
        // Frame polaroid: background putih dengan shadow
        // Gambar background putih di belakang foto
        ctx.fillStyle = "white";
        ctx.fillRect(30, 30, canvas.width - 60, canvas.height - 60);

        // Shadow effect
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        ctx.fillRect(30, 30, canvas.width - 60, canvas.height - 60);
        ctx.shadowColor = "transparent"; // Reset shadow

        // Gambar ulang foto di atas background putih
        drawPhotoOnCanvas(40, 40, canvas.width - 80, canvas.height - 80);
        break;

      case "elegant":
        // Frame elegan: border gradient
        // Buat border gradient
        const gradient = ctx.createLinearGradient(
          0,
          0,
          canvas.width,
          canvas.height
        );
        gradient.addColorStop(0, "#ff6b6b");
        gradient.addColorStop(0.5, "#4ecdc4");
        gradient.addColorStop(1, "#45b7d1");

        ctx.lineWidth = 30;
        ctx.strokeStyle = gradient;
        ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
        break;

      case "none":
      default:
        // Tidak ada frame
        break;
    }

    // Update galeri jika ada foto aktif
    if (activePhotoIndex >= 0) {
      updateGalleryItem(activePhotoIndex);
    }
  }

  // Fungsi untuk menggambar foto di canvas (dengan parameter opsional untuk posisi dan ukuran)
  function drawPhotoOnCanvas(x = 0, y = 0, width = null, height = null) {
    if (!photoTaken && activePhotoIndex === -1) return;

    const canvas = document.getElementById("photoCanvas");
    const ctx = canvas.getContext("2d");
    const video = document.getElementById("cameraPreview");

    // Jika parameter width dan height tidak diberikan, gunakan ukuran canvas
    const drawWidth = width || canvas.width;
    const drawHeight = height || canvas.height;

    // Jika ada foto aktif, gambar foto dari array
    if (activePhotoIndex >= 0 && photos[activePhotoIndex]) {
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
      };
      img.src = photos[activePhotoIndex].photoDataUrl;
    } else {
      // Gambar frame dari video ke canvas
      ctx.drawImage(video, x, y, drawWidth, drawHeight);
    }
  }

  // Fungsi untuk memulai countdown sebelum mengambil foto
  function startCountdown() {
    // Nonaktifkan tombol ambil foto selama countdown
    takePhotoBtn.disabled = true;
    takePhotoBtn.innerHTML = '<i class="fas fa-clock"></i> Siap...';

    // Tampilkan overlay countdown
    countdownOverlay.classList.add("active");
    let count = 3;
    countdownNumber.textContent = count;

    // Mulai countdown
    countdownInterval = setInterval(() => {
      count--;
      countdownNumber.textContent = count;

      // Jika countdown selesai, ambil foto
      if (count <= 0) {
        clearInterval(countdownInterval);
        takePhoto();
      }
    }, 1000);
  }

  // Fungsi untuk mengambil foto
  function takePhoto() {
    // Sembunyikan countdown overlay
    countdownOverlay.classList.remove("active");

    // Tampilkan efek flash
    flashEffect.classList.add("active");

    // Mainkan suara kamera jika tersedia
    if (cameraSound) {
      cameraSound.currentTime = 0;
      cameraSound
        .play()
        .catch((e) => console.log("Tidak dapat memutar suara: ", e));
    }

    // Set status foto telah diambil
    photoTaken = true;

    // Sembunyikan preview kamera dengan animasi
    cameraPreview.classList.add("hidden");

    // Tampilkan canvas dengan foto
    const canvas = document.getElementById("photoCanvas");
    canvas.classList.add("visible");

    // Ambil data URL dari canvas (foto asli tanpa background/frame)
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    const video = document.getElementById("cameraPreview");

    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCtx.drawImage(video, 0, 0);

    const photoDataUrl = tempCanvas.toDataURL("image/png");

    // Simpan foto ke array
    const photoId = Date.now();
    photos.push({
      id: photoId,
      photoDataUrl: photoDataUrl,
      background: currentBackground,
      frame: currentFrame,
      backgroundImage: backgroundImage ? backgroundImage.src : null,
    });

    // Set foto terakhir sebagai aktif
    activePhotoIndex = photos.length - 1;

    // Gambar foto ke canvas dengan background yang dipilih
    applyBackgroundToCanvas();

    // Update galeri
    updateGallery();

    // Update counter foto
    updatePhotoCounter();

    // Aktifkan tombol retake dan print
    retakePhotoBtn.disabled = false;
    printPhotoBtn.disabled = false;

    // Update teks tombol ambil foto
    if (photos.length >= 6) {
      takePhotoBtn.disabled = true;
      takePhotoBtn.innerHTML = '<i class="fas fa-ban"></i> Maksimal 6 Foto';
    } else {
      takePhotoBtn.innerHTML = '<i class="fas fa-camera"></i> Ambil Foto Lagi';
      takePhotoBtn.disabled = false;
    }

    // Hilangkan efek flash setelah animasi selesai
    setTimeout(() => {
      flashEffect.classList.remove("active");

      // Tampilkan preview foto setelah foto diambil
      setTimeout(() => {
        showPhotoPreview();
      }, 500);
    }, 500);
  }

  // Fungsi untuk menampilkan preview foto
  function showPhotoPreview() {
    const canvas = document.getElementById("photoCanvas");
    previewImage.src = canvas.toDataURL("image/png");
    photoPreview.classList.add("active");
  }

  // Fungsi untuk menutup preview foto
  function closePreview() {
    photoPreview.classList.remove("active");
  }

  // Fungsi untuk mengambil ulang foto (hanya untuk foto yang baru diambil, bukan dari galeri)
  function retakePhoto() {
    // Jika ada foto aktif dari galeri, hapus foto tersebut
    if (activePhotoIndex >= 0) {
      deletePhoto(activePhotoIndex);
      return;
    }

    // Reset status foto
    photoTaken = false;

    // Sembunyikan canvas
    const canvas = document.getElementById("photoCanvas");
    canvas.classList.remove("visible");

    // Tampilkan kembali preview kamera
    cameraPreview.classList.remove("hidden");

    // Nonaktifkan tombol retake dan print
    retakePhotoBtn.disabled = true;
    printPhotoBtn.disabled = true;

    // Tutup preview jika terbuka
    closePreview();
  }

  // Fungsi untuk mencetak foto
  function printPhoto() {
    // Dapatkan ukuran cetak yang dipilih
    const printSize = document.querySelector(
      'input[name="printSize"]:checked'
    ).value;
    const sizeInfo = printSizes[printSize];

    // Buat elemen sementara untuk mencetak
    const printWindow = window.open("", "_blank");
    printWindow.document.write(
      "<html><head><title>Cetak Foto Photobooth</title>"
    );

    // Tambahkan CSS untuk pencetakan
    printWindow.document.write(`
            <style>
                @page {
                    size: ${
                      printSize === "A4" || printSize === "A5"
                        ? printSize
                        : "auto"
                    };
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 10mm;
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    box-sizing: border-box;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 15mm;
                }
                .print-header h1 {
                    color: #1e88e5;
                    margin-bottom: 5mm;
                }
                .photo-container {
                    width: ${sizeInfo.width}cm;
                    height: ${sizeInfo.height}cm;
                    position: relative;
                    margin: 0 auto;
                    page-break-inside: avoid;
                }
                .photo-info {
                    text-align: center;
                    margin-top: 10mm;
                    font-size: 12pt;
                    color: #666;
                }
                .watermark {
                    position: absolute;
                    bottom: 5mm;
                    right: 5mm;
                    font-size: 10pt;
                    color: rgba(0,0,0,0.5);
                }
                @media print {
                    .no-print {
                        display: none;
                    }
                }
            </style>
        `);

    printWindow.document.write("</head><body>");

    // Tambahkan konten untuk dicetak
    const canvas = document.getElementById("photoCanvas");
    const imgData = canvas.toDataURL("image/png");

    // Konversi cm ke piksel untuk tampilan di layar (96 DPI)
    const pxWidth = Math.round(sizeInfo.width * 37.8);
    const pxHeight = Math.round(sizeInfo.height * 37.8);

    printWindow.document.write(`
            <div class="print-header">
                <h1>Photobooth Modern</h1>
                <p>Ukuran Cetak: ${sizeInfo.name}</p>
            </div>
            
            <div class="photo-container">
                <img src="${imgData}" style="width: 100%; height: 100%; object-fit: contain;" alt="Foto Photobooth" />
                <div class="watermark">© ${new Date().getFullYear()} Photobooth Modern</div>
            </div>
            
            <div class="photo-info">
                <p>Foto diambil pada: ${new Date().toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
                <p>Simpan kenangan indah Anda dengan Photobooth Modern</p>
            </div>
            
            <div class="no-print" style="margin-top: 20mm; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background-color: #1e88e5; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Cetak Halaman Ini
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                    Tutup Jendela
                </button>
            </div>
        `);

    printWindow.document.write("</body></html>");
    printWindow.document.close();

    // Tunggu konten dimuat sebelum mencetak
    printWindow.onload = function () {
      // Beri waktu sedikit untuk memastikan gambar dimuat
      setTimeout(() => {
        printWindow.print();
        // Jangan langsung tutup, biarkan pengguna melihat preview cetak
        // printWindow.close();
      }, 500);
    };
  }

  // Fungsi untuk mendownload foto
  function downloadPhoto() {
    const canvas = document.getElementById("photoCanvas");
    const link = document.createElement("a");
    link.download = `photobooth-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  // Fungsi untuk mengupdate galeri foto
  function updateGallery() {
    const galleryContainer = document.getElementById("galleryContainer");

    // Jika tidak ada foto, tampilkan placeholder
    if (photos.length === 0) {
      galleryContainer.innerHTML = `
                <div class="gallery-placeholder">
                    <i class="fas fa-camera"></i>
                    <p>Foto akan muncul di sini</p>
                </div>
            `;
      return;
    }

    // Kosongkan galeri
    galleryContainer.innerHTML = "";

    // Tambahkan setiap foto ke galeri
    photos.forEach((photo, index) => {
      const galleryItem = document.createElement("div");
      galleryItem.className = "gallery-item";
      if (index === activePhotoIndex) {
        galleryItem.classList.add("active");
      }

      // Buat thumbnail dari foto
      const thumbnailCanvas = document.createElement("canvas");
      const thumbnailCtx = thumbnailCanvas.getContext("2d");
      thumbnailCanvas.width = 300;
      thumbnailCanvas.height = 400;

      // Gambar thumbnail dengan background dan frame sederhana
      const img = new Image();
      img.onload = function () {
        // Gambar background
        if (photo.backgroundImage) {
          const bgImg = new Image();
          bgImg.onload = function () {
            thumbnailCtx.drawImage(bgImg, 0, 0, 300, 400);
            thumbnailCtx.drawImage(img, 20, 20, 260, 360);
            galleryItem.innerHTML = `
                            <img src="${thumbnailCanvas.toDataURL(
                              "image/png"
                            )}" alt="Foto ${index + 1}">
                            <div class="photo-number">${index + 1}</div>
                            <div class="delete-photo" data-index="${index}"><i class="fas fa-times"></i></div>
                            <div class="photo-actions">
                                <button class="photo-action-btn download-btn" data-index="${index}" title="Download">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="photo-action-btn print-btn" data-index="${index}" title="Cetak">
                                    <i class="fas fa-print"></i>
                                </button>
                            </div>
                        `;
          };
          bgImg.src = photo.backgroundImage;
        } else {
          thumbnailCtx.fillStyle = photo.background;
          thumbnailCtx.fillRect(0, 0, 300, 400);
          thumbnailCtx.drawImage(img, 20, 20, 260, 360);
          galleryItem.innerHTML = `
                        <img src="${thumbnailCanvas.toDataURL(
                          "image/png"
                        )}" alt="Foto ${index + 1}">
                        <div class="photo-number">${index + 1}</div>
                        <div class="delete-photo" data-index="${index}"><i class="fas fa-times"></i></div>
                        <div class="photo-actions">
                            <button class="photo-action-btn download-btn" data-index="${index}" title="Download">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="photo-action-btn print-btn" data-index="${index}" title="Cetak">
                                <i class="fas fa-print"></i>
                            </button>
                        </div>
                    `;
        }

        // Tambahkan event listener untuk memilih foto
        galleryItem.addEventListener("click", function (e) {
          // Jangan aktifkan jika klik pada tombol hapus atau tombol aksi
          if (
            !e.target.closest(".delete-photo") &&
            !e.target.closest(".photo-actions")
          ) {
            selectPhoto(index);
          }
        });

        // Tambahkan event listener untuk tombol hapus
        const deleteBtn = galleryItem.querySelector(".delete-photo");
        if (deleteBtn) {
          deleteBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            const deleteIndex = parseInt(this.getAttribute("data-index"));
            deletePhoto(deleteIndex);
          });
        }

        // Tambahkan event listener untuk tombol download
        const downloadBtn = galleryItem.querySelector(".download-btn");
        if (downloadBtn) {
          downloadBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            const downloadIndex = parseInt(this.getAttribute("data-index"));
            downloadPhotoFromGallery(downloadIndex);
          });
        }

        // Tambahkan event listener untuk tombol cetak
        const printBtn = galleryItem.querySelector(".print-btn");
        if (printBtn) {
          printBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            const printIndex = parseInt(this.getAttribute("data-index"));
            selectPhoto(printIndex);
            setTimeout(() => {
              printPhoto();
            }, 100);
          });
        }
      };
      img.src = photo.photoDataUrl;

      galleryContainer.appendChild(galleryItem);
    });
  }

  // Fungsi untuk mengupdate item galeri tertentu
  function updateGalleryItem(index) {
    if (index < 0 || index >= photos.length) return;

    const galleryItems = document.querySelectorAll(".gallery-item");
    if (galleryItems[index]) {
      const galleryItem = galleryItems[index];
      const photo = photos[index];

      // Buat thumbnail baru
      const thumbnailCanvas = document.createElement("canvas");
      const thumbnailCtx = thumbnailCanvas.getContext("2d");
      thumbnailCanvas.width = 300;
      thumbnailCanvas.height = 400;

      // Gambar thumbnail dengan background dan frame sederhana
      const img = new Image();
      img.onload = function () {
        // Gambar background
        if (photo.backgroundImage) {
          const bgImg = new Image();
          bgImg.onload = function () {
            thumbnailCtx.drawImage(bgImg, 0, 0, 300, 400);
            thumbnailCtx.drawImage(img, 20, 20, 260, 360);
            const imgElement = galleryItem.querySelector("img");
            if (imgElement) {
              imgElement.src = thumbnailCanvas.toDataURL("image/png");
            }
          };
          bgImg.src = photo.backgroundImage;
        } else {
          thumbnailCtx.fillStyle = photo.background;
          thumbnailCtx.fillRect(0, 0, 300, 400);
          thumbnailCtx.drawImage(img, 20, 20, 260, 360);
          const imgElement = galleryItem.querySelector("img");
          if (imgElement) {
            imgElement.src = thumbnailCanvas.toDataURL("image/png");
          }
        }
      };
      img.src = photo.photoDataUrl;
    }
  }

  // Fungsi untuk memilih foto dari galeri
  function selectPhoto(index) {
    if (index < 0 || index >= photos.length) return;

    // Set foto yang dipilih sebagai aktif
    activePhotoIndex = index;
    photoTaken = true;

    // Update tampilan galeri
    document.querySelectorAll(".gallery-item").forEach((item, i) => {
      if (i === index) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Ambil data foto yang dipilih
    const selectedPhoto = photos[index];

    // Set background dan frame sesuai dengan foto yang dipilih
    currentBackground = selectedPhoto.background;
    currentFrame = selectedPhoto.frame;

    // Set background image jika ada
    if (selectedPhoto.backgroundImage) {
      backgroundImage = new Image();
      backgroundImage.onload = function () {
        applyBackgroundToCanvas();
      };
      backgroundImage.src = selectedPhoto.backgroundImage;
    } else {
      backgroundImage = null;
    }

    // Update UI untuk background dan frame yang aktif
    updateActiveBackgroundUI();
    updateActiveFrameUI();

    // Tampilkan foto yang dipilih di canvas
    const canvas = document.getElementById("photoCanvas");
    canvas.classList.add("visible");

    // Sembunyikan preview kamera
    cameraPreview.classList.add("hidden");

    // Gambar foto ke canvas
    applyBackgroundToCanvas();

    // Aktifkan tombol retake dan print
    retakePhotoBtn.disabled = false;
    printPhotoBtn.disabled = false;

    // Tampilkan preview foto
    showPhotoPreview();
  }

  // Fungsi untuk menghapus foto
  function deletePhoto(index) {
    if (index < 0 || index >= photos.length) return;

    // Hapus foto dari array
    photos.splice(index, 1);

    // Jika foto yang dihapus adalah foto aktif, reset aktif photo
    if (activePhotoIndex === index) {
      activePhotoIndex = -1;
      photoTaken = false;

      // Sembunyikan canvas
      const canvas = document.getElementById("photoCanvas");
      canvas.classList.remove("visible");

      // Tampilkan kembali preview kamera
      cameraPreview.classList.remove("hidden");

      // Nonaktifkan tombol retake dan print
      retakePhotoBtn.disabled = true;
      printPhotoBtn.disabled = true;

      // Tutup preview
      closePreview();
    } else if (activePhotoIndex > index) {
      // Jika foto aktif setelah foto yang dihapus, kurangi indeks
      activePhotoIndex--;
    }

    // Update galeri
    updateGallery();

    // Update counter foto
    updatePhotoCounter();

    // Update tombol ambil foto
    if (photos.length < 6) {
      takePhotoBtn.disabled = false;
      takePhotoBtn.innerHTML = '<i class="fas fa-camera"></i> Ambil Foto';
    }
  }

  // Fungsi untuk menghapus semua foto
  function clearAllPhotos() {
    if (photos.length === 0) return;

    if (confirm("Apakah Anda yakin ingin menghapus semua foto?")) {
      // Reset semua data foto
      photos = [];
      activePhotoIndex = -1;
      photoTaken = false;

      // Update galeri
      updateGallery();

      // Update counter foto
      updatePhotoCounter();

      // Sembunyikan canvas
      const canvas = document.getElementById("photoCanvas");
      canvas.classList.remove("visible");

      // Tampilkan kembali preview kamera
      cameraPreview.classList.remove("hidden");

      // Nonaktifkan tombol retake dan print
      retakePhotoBtn.disabled = true;
      printPhotoBtn.disabled = true;

      // Tutup preview
      closePreview();

      // Aktifkan tombol ambil foto
      takePhotoBtn.disabled = false;
      takePhotoBtn.innerHTML = '<i class="fas fa-camera"></i> Ambil Foto';
    }
  }

  // Fungsi untuk mengupdate UI background yang aktif
  function updateActiveBackgroundUI() {
    // Update warna aktif
    colorOptions.forEach((option) => {
      if (option.getAttribute("data-color") === currentBackground) {
        option.classList.add("active");
      } else {
        option.classList.remove("active");
      }
    });

    // Update preset aktif
    presetOptions.forEach((option) => {
      if (
        backgroundImage &&
        backgroundImage.src.includes(
          presetBackgrounds[option.getAttribute("data-preset")]
        )
      ) {
        option.classList.add("active");
      } else {
        option.classList.remove("active");
      }
    });
  }

  // Fungsi untuk mengupdate UI frame yang aktif
  function updateActiveFrameUI() {
    frameOptions.forEach((option) => {
      if (option.getAttribute("data-frame") === currentFrame) {
        option.classList.add("active");
      } else {
        option.classList.remove("active");
      }
    });
  }

  // Fungsi untuk mengupdate counter foto
  function updatePhotoCounter() {
    const photoCount = document.getElementById("photoCount");
    const counterFill = document.getElementById("counterFill");

    const count = photos.length;
    photoCount.textContent = `${count}/6 Foto`;

    // Update lebar fill bar
    const percentage = (count / 6) * 100;
    counterFill.style.width = `${percentage}%`;

    // Ubah warna berdasarkan jumlah foto
    if (count === 6) {
      counterFill.style.background =
        "linear-gradient(to right, #f44336, #ef5350)";
    } else if (count >= 4) {
      counterFill.style.background =
        "linear-gradient(to right, #ff9800, #ffb74d)";
    } else {
      counterFill.style.background =
        "linear-gradient(to right, #43a047, #8bc34a)";
    }
  }

  // Fungsi untuk mendownload foto dari galeri
  function downloadPhotoFromGallery(index) {
    if (index < 0 || index >= photos.length) return;

    // Pilih foto terlebih dahulu
    selectPhoto(index);

    // Tunggu sebentar agar canvas diperbarui, lalu download
    setTimeout(() => {
      downloadPhoto();
    }, 100);
  }
});
