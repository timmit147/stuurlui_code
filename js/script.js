class HeroSlider {
  constructor(rootElement, options = {}) {
    this.root = rootElement;
    this.duration = options.duration || 5000;

    this.track = this.root.querySelector(".slider-track");
    this.slides = Array.from(
      this.track.querySelectorAll(".slider-card[data-index]")
    );
    this.dots = Array.from(
      this.root.querySelectorAll(".slider-dot[data-index]")
    );
    this.playPauseButton = document.getElementById("sliderPlayPause");
    this.sliderWindow = this.root.querySelector(".slider-window");

    this.slideCount = this.slides.length;

    this.trackPositionIndex = 1;
    this.logicalSlideIndex = 0;

    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.userPaused = prefersReduced;
    this.hoverPaused = false;
    this.progress = 0;
    this.lastTimestamp = null;

    this.pointerStartX = null;
    this.pointerActive = false;
    this.isAnimating = false;

    this.setupClones();
    this.attachEvents();
    this.updateDotsAndBars();
    this.updateTransform(false);
    this.updatePlayPauseVisual();
    requestAnimationFrame(this.animationLoop.bind(this));
  }

  setupClones() {
    const firstRealSlide = this.slides[0];
    const lastRealSlide = this.slides[this.slideCount - 1];

    const firstClone = firstRealSlide.cloneNode(true);
    const lastClone = lastRealSlide.cloneNode(true);

    this.track.insertBefore(lastClone, firstRealSlide);
    this.track.appendChild(firstClone);
  }

  isPaused() {
    return this.userPaused || this.hoverPaused;
  }

  updateDotsAndBars() {
    this.dots.forEach((dot, index) => {
      const isActive = index === this.logicalSlideIndex;
      dot.classList.toggle("active", isActive);
      const bar = dot.querySelector(".slider-dot-bar");
      if (bar) {
        if (isActive) {
          bar.style.width = (this.progress * 100).toFixed(2) + "%";
        } else {
          bar.style.width = "0%";
        }
      }
    });
  }

  updateTransform(animated = true) {
    this.track.style.transition = animated
      ? "transform 1.1s ease-in-out"
      : "none";
    this.track.style.transform = `translateX(-${
      this.trackPositionIndex * 100
    }%)`;
  }

  goToSlide(index, animated = true) {
    if (animated && this.isAnimating) return;

    this.logicalSlideIndex = index;
    this.trackPositionIndex = index + 1;
    this.progress = 0;
    this.lastTimestamp = null;

    if (animated) {
      this.isAnimating = true;
    }

    this.updateDotsAndBars();
    this.updateTransform(animated);
  }

  goToNextSlide() {
    if (this.isAnimating) return;

    this.trackPositionIndex += 1;
    this.logicalSlideIndex = (this.logicalSlideIndex + 1) % this.slideCount;
    this.progress = 0;
    this.lastTimestamp = null;
    this.isAnimating = true;

    this.updateDotsAndBars();
    this.updateTransform(true);
  }

  goToPreviousSlide() {
    if (this.isAnimating) return;

    this.trackPositionIndex -= 1;
    this.logicalSlideIndex =
      (this.logicalSlideIndex - 1 + this.slideCount) % this.slideCount;
    this.progress = 0;
    this.lastTimestamp = null;
    this.isAnimating = true;

    this.updateDotsAndBars();
    this.updateTransform(true);
  }

  handleTransitionEnd(event) {
    if (event.target !== this.track || event.propertyName !== "transform") {
      return;
    }

    if (this.trackPositionIndex === this.slideCount + 1) {
      this.track.style.transition = "none";
      this.trackPositionIndex = 1;
      this.track.style.transform = `translateX(-${
        this.trackPositionIndex * 100
      }%)`;
      void this.track.offsetWidth;
      this.track.style.transition = "transform 1.1s ease-in-out";
    }

    if (this.trackPositionIndex === 0) {
      this.track.style.transition = "none";
      this.trackPositionIndex = this.slideCount;
      this.track.style.transform = `translateX(-${
        this.trackPositionIndex * 100
      }%)`;
      void this.track.offsetWidth;
      this.track.style.transition = "transform 1.1s ease-in-out";
    }

    this.isAnimating = false;
  }

  toggleUserPaused() {
    this.userPaused = !this.userPaused;
    this.progress = 0;
    this.lastTimestamp = null;
    this.updatePlayPauseVisual();
  }

  updatePlayPauseVisual() {
    if (!this.playPauseButton) return;
    if (this.userPaused) {
      this.playPauseButton.textContent = "▶";
      this.playPauseButton.setAttribute("aria-pressed", "true");
      this.playPauseButton.setAttribute("aria-label", "Start slider");
    } else {
      this.playPauseButton.textContent = "❚❚";
      this.playPauseButton.setAttribute("aria-pressed", "false");
      this.playPauseButton.setAttribute("aria-label", "Pauzeer slider");
    }
  }

  handleDotClick(dot) {
    const index = Number(dot.dataset.index);
    if (!Number.isNaN(index)) {
      this.goToSlide(index, true);
    }
  }

  handleKeydown(event) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      this.goToNextSlide();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.goToPreviousSlide();
    }
  }

  handlePointerDown(event) {
    if (event.pointerType === "touch" || event.pointerType === "mouse") {
      this.pointerActive = true;
      this.pointerStartX = event.clientX;
    }
  }

  handlePointerUp(event) {
    if (!this.pointerActive || this.pointerStartX == null) return;
    const dx = event.clientX - this.pointerStartX;
    const threshold = 40;
    if (dx > threshold) {
      this.goToPreviousSlide();
    } else if (dx < -threshold) {
      this.goToNextSlide();
    }
    this.pointerActive = false;
    this.pointerStartX = null;
  }

  attachEvents() {
    this.track.addEventListener("transitionend", (e) =>
      this.handleTransitionEnd(e)
    );

    // Whole slide clickable (including clones)
    this.track.addEventListener("click", (event) => {
      const card = event.target.closest(".slider-card");
      if (!card) return;
      const link = card.querySelector(".case-link");
      if (!link) return;

      // If you actually clicked the link, let the browser handle it
      if (event.target.closest("a")) return;

      link.click();
    });

    this.dots.forEach((dot) => {
      dot.addEventListener("click", () => this.handleDotClick(dot));
    });

    if (this.playPauseButton) {
      this.playPauseButton.addEventListener("click", () =>
        this.toggleUserPaused()
      );
    }

    this.root.addEventListener("mouseenter", () => {
      this.hoverPaused = true;
    });

    this.root.addEventListener("mouseleave", () => {
      this.hoverPaused = false;
    });

    // Arrow navigation when slider has focus
    this.root.addEventListener("keydown", (event) =>
      this.handleKeydown(event)
    );

    if (this.sliderWindow) {
      this.sliderWindow.addEventListener("pointerdown", (event) =>
        this.handlePointerDown(event)
      );
      this.sliderWindow.addEventListener("pointerup", (event) =>
        this.handlePointerUp(event)
      );
    }
  }

  animationLoop(timestamp) {
    if (this.lastTimestamp == null) {
      this.lastTimestamp = timestamp;
    }

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    if (!this.isPaused() && !this.isAnimating) {
      this.progress += deltaTime / this.duration;
      if (this.progress >= 1) {
        this.progress = 0;
        this.goToNextSlide();
      }
    }

    this.updateDotsAndBars();
    requestAnimationFrame(this.animationLoop.bind(this));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const heroSliderElement = document.getElementById("heroSlider");
  if (heroSliderElement) {
    new HeroSlider(heroSliderElement, { duration: 5000 });
  }
});
