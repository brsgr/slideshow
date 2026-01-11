import { scanDirectory, shuffleArray, MediaFile } from "./media-loader";
import { Slideshow, SlideshowConfig } from "./slideshow";

const startScreen = document.getElementById("start-screen")!;
const slideshowScreen = document.getElementById("slideshow")!;
const selectFolderBtn = document.getElementById(
  "select-folder"
) as HTMLButtonElement;
const durationInput = document.getElementById("duration") as HTMLInputElement;
const shuffleCheckbox = document.getElementById("shuffle") as HTMLInputElement;
const loopCheckbox = document.getElementById("loop") as HTMLInputElement;

const imageEl = document.getElementById("slide-image") as HTMLImageElement;
const videoEl = document.getElementById("slide-video") as HTMLVideoElement;
const controlsEl = document.getElementById("controls")!;
const loadingEl = document.getElementById("loading")!;
const filenameEl = document.getElementById("filename")!;
const progressFill = document.getElementById("progress-fill")!;

const prevBtn = document.getElementById("prev") as HTMLButtonElement;
const playPauseBtn = document.getElementById("play-pause") as HTMLButtonElement;
const nextBtn = document.getElementById("next") as HTMLButtonElement;
const exitBtn = document.getElementById("exit") as HTMLButtonElement;

let slideshow: Slideshow | null = null;
let controlsTimeout: number | null = null;

function getConfig(): SlideshowConfig {
  return {
    duration: parseInt(durationInput.value) || 5,
    shuffle: shuffleCheckbox.checked,
    loop: loopCheckbox.checked,
  };
}

async function selectFolder() {
  try {
    const dirHandle = await window.showDirectoryPicker();
    const files = await scanDirectory(dirHandle);

    if (files.length === 0) {
      alert("No supported media files found in the selected folder.");
      return;
    }

    const config = getConfig();
    let orderedFiles: MediaFile[] = files;

    if (config.shuffle) {
      orderedFiles = shuffleArray(files);
    }

    startSlideshow(orderedFiles, config);
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      console.error("Failed to select folder:", err);
      alert("Failed to access folder. Please try again.");
    }
  }
}

async function startSlideshow(files: MediaFile[], config: SlideshowConfig) {
  startScreen.classList.add("hidden");
  slideshowScreen.classList.remove("hidden");

  try {
    await document.documentElement.requestFullscreen();
  } catch (err) {
    console.warn("Could not enter fullscreen:", err);
  }

  slideshow = new Slideshow(
    files,
    config,
    {
      image: imageEl,
      video: videoEl,
      loading: loadingEl,
      playPauseBtn: playPauseBtn,
      progressFill: progressFill,
    },
    {
      onEnd: () => exitSlideshow(),
      onFileChange: (filename: string) => {
        filenameEl.textContent = filename;
      },
    }
  );

  await slideshow.start();
  setupControls();
}

function exitSlideshow() {
  if (slideshow) {
    slideshow.destroy();
    slideshow = null;
  }

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(console.warn);
  }

  slideshowScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  imageEl.classList.add("hidden");
  videoEl.classList.add("hidden");
  controlsEl.classList.add("hidden");
  filenameEl.textContent = "";
}

function setupControls() {
  showControls();
}

function showControls() {
  controlsEl.classList.remove("hidden");
  resetControlsTimeout();
}

function hideControls() {
  controlsEl.classList.add("hidden");
}

function resetControlsTimeout() {
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
  }
  controlsTimeout = window.setTimeout(() => {
    hideControls();
  }, 3000);
}

// Event listeners
selectFolderBtn.addEventListener("click", selectFolder);

prevBtn.addEventListener("click", () => {
  slideshow?.prev();
  resetControlsTimeout();
});

playPauseBtn.addEventListener("click", () => {
  slideshow?.togglePause();
  resetControlsTimeout();
});

nextBtn.addEventListener("click", () => {
  slideshow?.next();
  resetControlsTimeout();
});

exitBtn.addEventListener("click", exitSlideshow);

// Mouse movement shows controls
slideshowScreen.addEventListener("mousemove", showControls);

// Keyboard controls
document.addEventListener("keydown", (e) => {
  if (!slideshow) return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      slideshow.togglePause();
      showControls();
      break;
    case "ArrowLeft":
      slideshow.prev();
      showControls();
      break;
    case "ArrowRight":
      slideshow.next();
      showControls();
      break;
    case "Escape":
      exitSlideshow();
      break;
  }
});

// Handle fullscreen exit
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && slideshow) {
    exitSlideshow();
  }
});
