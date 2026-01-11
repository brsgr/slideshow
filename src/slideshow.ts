import { MediaFile, loadMediaUrl, preloadMedia } from "./media-loader";

export interface SlideshowConfig {
  duration: number;
  shuffle: boolean;
  loop: boolean;
}

export class Slideshow {
  private files: MediaFile[];
  private config: SlideshowConfig;
  private currentIndex: number = 0;
  private isPaused: boolean = false;
  private timer: number | null = null;
  private videoProgressRAF: number | null = null;

  private imageEl: HTMLImageElement;
  private videoEl: HTMLVideoElement;
  private loadingEl: HTMLElement;
  private playPauseBtn: HTMLButtonElement;
  private progressFill: HTMLElement;

  private onEnd?: () => void;
  private onFileChange?: (filename: string) => void;

  constructor(
    files: MediaFile[],
    config: SlideshowConfig,
    elements: {
      image: HTMLImageElement;
      video: HTMLVideoElement;
      loading: HTMLElement;
      playPauseBtn: HTMLButtonElement;
      progressFill: HTMLElement;
    },
    callbacks?: {
      onEnd?: () => void;
      onFileChange?: (filename: string) => void;
    }
  ) {
    this.files = files;
    this.config = config;
    this.imageEl = elements.image;
    this.videoEl = elements.video;
    this.loadingEl = elements.loading;
    this.playPauseBtn = elements.playPauseBtn;
    this.progressFill = elements.progressFill;
    this.onEnd = callbacks?.onEnd;
    this.onFileChange = callbacks?.onFileChange;

    this.videoEl.addEventListener("ended", () => this.onVideoEnded());
  }

  async start() {
    this.currentIndex = 0;
    await this.showCurrent();
  }

  async showCurrent() {
    const file = this.files[this.currentIndex];
    if (!file) return;

    this.clearTimer();
    this.showLoading(true);
    this.onFileChange?.(file.name);

    try {
      const url = await loadMediaUrl(file);
      this.showLoading(false);

      if (file.type === "image") {
        await this.showImage(url);
      } else {
        await this.showVideo(url);
      }

      preloadMedia(this.files, this.currentIndex, 3);
    } catch (err) {
      console.error(`Failed to load ${file.name}:`, err);
      this.showLoading(false);
      this.next();
    }
  }

  private async showImage(url: string) {
    this.videoEl.classList.add("hidden");
    this.videoEl.pause();
    this.videoEl.src = "";

    this.imageEl.classList.add("fade-out");
    this.resetProgress();

    await new Promise((r) => setTimeout(r, 150));

    this.imageEl.src = url;
    this.imageEl.classList.remove("hidden");

    await new Promise((r) => setTimeout(r, 50));
    this.imageEl.classList.remove("fade-out");

    if (!this.isPaused) {
      this.startTimer();
      this.startProgressAnimation();
    }
  }

  private async showVideo(url: string) {
    this.imageEl.classList.add("hidden");
    this.imageEl.src = "";

    this.videoEl.classList.add("fade-out");
    this.resetProgress();

    await new Promise((r) => setTimeout(r, 150));

    this.videoEl.src = url;
    this.videoEl.classList.remove("hidden");

    await new Promise((r) => setTimeout(r, 50));
    this.videoEl.classList.remove("fade-out");

    if (!this.isPaused) {
      this.videoEl.play().catch(console.error);
      this.startVideoProgressLoop();
    }
  }

  private onVideoEnded() {
    if (!this.isPaused) {
      this.next();
    }
  }

  private startVideoProgressLoop() {
    this.stopVideoProgressLoop();

    const updateProgress = () => {
      if (this.videoEl.duration && !isNaN(this.videoEl.duration)) {
        const progress = (this.videoEl.currentTime / this.videoEl.duration) * 100;
        this.progressFill.style.width = `${progress}%`;
      }

      if (!this.isPaused && !this.videoEl.paused) {
        this.videoProgressRAF = requestAnimationFrame(updateProgress);
      }
    };

    this.videoProgressRAF = requestAnimationFrame(updateProgress);
  }

  private stopVideoProgressLoop() {
    if (this.videoProgressRAF !== null) {
      cancelAnimationFrame(this.videoProgressRAF);
      this.videoProgressRAF = null;
    }
  }

  private resetProgress() {
    this.stopVideoProgressLoop();
    this.progressFill.classList.remove("animate", "paused");
    this.progressFill.style.width = "0%";
  }

  private startProgressAnimation() {
    this.progressFill.style.setProperty("--progress-duration", `${this.config.duration}s`);
    this.progressFill.classList.remove("paused");
    this.progressFill.classList.add("animate");
  }

  private pauseProgress() {
    const currentFile = this.files[this.currentIndex];
    if (currentFile?.type === "image") {
      this.progressFill.classList.add("paused");
    }
  }

  private resumeProgress() {
    const currentFile = this.files[this.currentIndex];
    if (currentFile?.type === "image") {
      this.progressFill.classList.remove("paused");
    }
  }

  private startTimer() {
    this.clearTimer();
    this.timer = window.setTimeout(() => {
      this.next();
    }, this.config.duration * 1000);
  }

  private clearTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async next() {
    if (this.currentIndex >= this.files.length - 1) {
      if (this.config.loop) {
        this.currentIndex = 0;
      } else {
        this.onEnd?.();
        return;
      }
    } else {
      this.currentIndex++;
    }
    await this.showCurrent();
  }

  async prev() {
    if (this.currentIndex <= 0) {
      if (this.config.loop) {
        this.currentIndex = this.files.length - 1;
      } else {
        return;
      }
    } else {
      this.currentIndex--;
    }
    await this.showCurrent();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.playPauseBtn.textContent = this.isPaused ? "Play" : "Pause";

    const currentFile = this.files[this.currentIndex];

    if (this.isPaused) {
      this.clearTimer();
      this.pauseProgress();
      if (currentFile?.type === "video") {
        this.videoEl.pause();
        this.stopVideoProgressLoop();
      }
    } else {
      if (currentFile?.type === "image") {
        this.startTimer();
        this.resumeProgress();
      } else if (currentFile?.type === "video") {
        this.videoEl.play().catch(console.error);
        this.startVideoProgressLoop();
      }
    }
  }

  private showLoading(show: boolean) {
    this.loadingEl.classList.toggle("hidden", !show);
  }

  destroy() {
    this.clearTimer();
    this.stopVideoProgressLoop();
    this.videoEl.pause();
    this.videoEl.src = "";
    this.imageEl.src = "";
  }
}
