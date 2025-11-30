const SLIDE_DURATION = 5000;

const sliderElement = document.getElementById("heroSlider");
const trackElement = document.getElementById("sliderTrack");
const slideElements = Array.from(
  trackElement.querySelectorAll(".slider-card[data-index]")
);

const dots = document.querySelectorAll(".slider-dot");
const playPauseButton = document.getElementById("sliderPlayPause");

const slideCount = slideElements.length;

const firstRealSlide = slideElements[0];
const lastRealSlide = slideElements[slideCount - 1];

const firstClone = firstRealSlide.cloneNode(true);
const lastClone = lastRealSlide.cloneNode(true);

trackElement.insertBefore(lastClone, firstRealSlide);
trackElement.appendChild(firstClone);

let trackPositionIndex = 1;
let logicalSlideIndex = 0;

let userPaused = false;
let hoverPaused = false;
let progress = 0;
let lastTimestamp = null;

function isPaused() {
  return userPaused || hoverPaused;
}

function updateDotsAndBars() {
  dots.forEach((dot, index) => {
    const isActive = index === logicalSlideIndex;
    dot.classList.toggle("active", isActive);

    const bar = dot.querySelector(".slider-dot-bar");
    if (isActive) {
      bar.style.width = (progress * 100).toFixed(2) + "%";
    } else {
      bar.style.width = "0%";
    }
  });
}

function updateTransform(animated = true) {
  trackElement.style.transition = animated ? "transform 1.1s ease-in-out" : "none";
  trackElement.style.transform = `translateX(-${trackPositionIndex * 100}%)`;
}

function goToSlide(index, animated = true) {
  logicalSlideIndex = index;
  trackPositionIndex = index + 1;
  progress = 0;
  lastTimestamp = null;

  updateDotsAndBars();
  updateTransform(animated);
}

function goToNextSlide() {
  trackPositionIndex += 1;
  logicalSlideIndex = (logicalSlideIndex + 1) % slideCount;
  progress = 0;
  lastTimestamp = null;

  updateDotsAndBars();
  updateTransform(true);
}

function handleTransitionEnd(event) {
  if (event.target !== trackElement || event.propertyName !== "transform") return;

  if (trackPositionIndex === slideCount + 1) {
    trackElement.style.transition = "none";
    trackPositionIndex = 1;
    trackElement.style.transform = `translateX(-${trackPositionIndex * 100}%)`;
    void trackElement.offsetWidth;
    trackElement.style.transition = "transform 1.1s ease-in-out";
  }
}

function handleDotActivate(dot) {
  const index = Number(dot.dataset.index);
  goToSlide(index);
}

function handleDotKeydown(event, dot) {
  const key = event.key;
  if (key === "Enter" || key === " " || key === "Spacebar") {
    event.preventDefault();
    handleDotActivate(dot);
  }
}

function attachEvents() {
  trackElement.addEventListener("transitionend", handleTransitionEnd);

  dots.forEach((dot) => {
    dot.addEventListener("click", () => handleDotActivate(dot));

    dot.addEventListener("keydown", (event) => handleDotKeydown(event, dot));

    dot.addEventListener("focus", () => handleDotActivate(dot));
  });

  playPauseButton.addEventListener("click", () => {
    userPaused = !userPaused;
    playPauseButton.textContent = userPaused ? "▶" : "❚❚";
  });

  sliderElement.addEventListener("mouseenter", () => {
    hoverPaused = true;
  });

  sliderElement.addEventListener("mouseleave", () => {
    hoverPaused = false;
  });
}

function animationLoop(timestamp) {
  if (lastTimestamp == null) {
    lastTimestamp = timestamp;
  }

  const deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (!isPaused()) {
    progress += deltaTime / SLIDE_DURATION;
    if (progress >= 1) {
      progress = 0;
      goToNextSlide();
    }
  }

  updateDotsAndBars();
  requestAnimationFrame(animationLoop);
}

function initSlider() {
  updateDotsAndBars();
  updateTransform(false);
  attachEvents();
  requestAnimationFrame(animationLoop);
}

initSlider();
