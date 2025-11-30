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

function isSliderPaused() {
  return userPaused || hoverPaused;
}

function setActiveDots() {
  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === logicalSlideIndex);
  });
}

function updateSliderTransform(animated = true) {
  trackElement.style.transition = animated ? "transform 1.1s ease-in-out" : "none";
  trackElement.style.transform = `translateX(-${trackPositionIndex * 100}%)`;
}

function updateProgressBars() {
  dots.forEach((dot, index) => {
    const bar = dot.querySelector(".slider-dot-bar");
    if (index === logicalSlideIndex) {
      bar.style.width = (progress * 100).toFixed(2) + "%";
    } else {
      bar.style.width = "0%";
    }
  });
}

function goToNextSlide() {
  trackPositionIndex += 1;
  logicalSlideIndex = (logicalSlideIndex + 1) % slideCount;
  progress = 0;
  lastTimestamp = null;

  setActiveDots();
  updateSliderTransform(true);
  updateProgressBars();
}

trackElement.addEventListener("transitionend", (event) => {
  const isTransformTransition =
    event.target === trackElement && event.propertyName === "transform";

  if (!isTransformTransition) return;

  if (trackPositionIndex === slideCount + 1) {
    trackElement.style.transition = "none";
    trackPositionIndex = 1;
    trackElement.style.transform = `translateX(-${trackPositionIndex * 100}%)`;
    void trackElement.offsetWidth;
    trackElement.style.transition = "transform 1.1s ease-in-out";
  }
});

function goToSlide(index) {
  logicalSlideIndex = index;
  trackPositionIndex = index + 1;
  progress = 0;
  lastTimestamp = null;

  setActiveDots();
  updateSliderTransform(true);
  updateProgressBars();
}

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const index = Number(dot.dataset.index);
    goToSlide(index);
  });
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

function animationLoop(timestamp) {
  if (lastTimestamp == null) {
    lastTimestamp = timestamp;
  }

  const deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (!isSliderPaused()) {
    progress += deltaTime / SLIDE_DURATION;

    if (progress >= 1) {
      progress = 0;
      goToNextSlide();
    }
  }

  updateProgressBars();
  requestAnimationFrame(animationLoop);
}

setActiveDots();
updateSliderTransform(false);
requestAnimationFrame(animationLoop);
