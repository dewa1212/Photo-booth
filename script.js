const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const filterSelect = document.getElementById("filter");
const bgSelect = document.getElementById("background");
const download = document.getElementById("download");

// Akses kamera
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream);

// Ambil foto
function takePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.filter = filterSelect.value;

  // Background Unsplash
  if (bgSelect.value) {
    const bg = new Image();
    bg.crossOrigin = "anonymous";
    bg.src = bgSelect.value;
    bg.onload = () => {
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      finish();
    };
  } else {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    finish();
  }
}

function finish() {
  canvas.style.display = "block";
  const image = canvas.toDataURL("image/png");
  download.href = image;
}
