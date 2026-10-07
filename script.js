/**
 * DIET COKE KINETIC EXPERIENCE & AESTHETIC SHOWCASE
 * High-performance canvas frame sequence + interactive lookbook engine.
 */

(function () {
  'use strict';

  // --- Configuration ---
  const TOTAL_FRAMES = 240;
  const FRAME_PREFIX = 'frames/ezgif-frame-';
  const FRAME_EXT = '.jpg';
  const LERP_FACTOR = 0.12;

  // --- DOM Elements ---
  const canvas = document.getElementById('coke-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const loader = document.getElementById('loader');
  const loaderPercent = document.getElementById('loader-percent');
  const loaderBar = document.getElementById('loader-bar');
  const navFrameNum = document.getElementById('nav-frame-num');
  const autoplayBtn = document.getElementById('autoplay-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const playLabel = document.getElementById('play-label');
  const soundBtn = document.getElementById('sound-btn');
  const soundIconOff = document.getElementById('sound-icon-off');
  const soundIconOn = document.getElementById('sound-icon-on');
  const scrubberSlider = document.getElementById('scrubber-slider');
  const scrubFill = document.getElementById('scrub-fill');
  const scrubFrameVal = document.getElementById('scrub-frame-val');
  const replayBtn = document.getElementById('replay-btn');
  const scrollAnimationTrack = document.getElementById('scroll-animation-track');
  const storyOverlays = document.getElementById('story-overlays');
  const bottomController = document.getElementById('bottom-controller');
  const showcaseStart = document.getElementById('showcase-start');
  const sections = Array.from(document.querySelectorAll('.story-section'));
  const markerBtns = Array.from(document.querySelectorAll('.marker-btn'));

  // --- State Variables ---
  const frames = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let isAllLoaded = false;
  let targetProgress = 0;
  let currentProgress = 0;
  let activeFrameIndex = 0;
  let isAutoplaying = false;
  let autoplayTimer = null;
  let isUserScrubbing = false;

  // Web Audio Context
  let audioCtx = null;
  let soundEnabled = false;
  let lastSoundFrame = 0;

  // --- 1. Helper: Pad Number ---
  function padNumber(num) {
    return String(num).padStart(3, '0');
  }

  // --- 2. Canvas Resizing with Retina DPR ---
  let canvasWidth = 0;
  let canvasHeight = 0;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    renderFrame(activeFrameIndex);
  }

  window.addEventListener('resize', resizeCanvas);

  // --- 3. Draw Frame on Canvas with Aspect Ratio Contain ---
  function renderFrame(index) {
    const img = frames[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    // Fill background with matching dark shade
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const imgRatio = imgW / imgH;
    const screenRatio = canvasWidth / canvasHeight;

    let drawW, drawH, drawX, drawY;

    if (screenRatio > imgRatio) {
      drawH = canvasHeight;
      drawW = canvasHeight * imgRatio;
      drawX = (canvasWidth - drawW) / 2;
      drawY = 0;
    } else {
      drawW = canvasWidth;
      drawH = canvasWidth / imgRatio;
      drawX = 0;
      drawY = (canvasHeight - drawH) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  // --- 4. Frame Preloader ---
  function preloadImages() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const index = i - 1;
      const src = `${FRAME_PREFIX}${padNumber(i)}${FRAME_EXT}`;

      img.src = src;
      img.onload = () => {
        frames[index] = img;
        loadedCount++;

        const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        if (loaderPercent) loaderPercent.textContent = `${percent}%`;
        if (loaderBar) loaderBar.style.width = `${percent}%`;

        if (loadedCount === 1) {
          resizeCanvas();
          renderFrame(0);
        }

        if (loadedCount === TOTAL_FRAMES) {
          isAllLoaded = true;
          setTimeout(() => {
            if (loader) loader.classList.add('loaded');
          }, 350);
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          isAllLoaded = true;
          if (loader) loader.classList.add('loaded');
        }
      };
    }
  }

  // --- 5. Scroll Progress Calculation (Pure & Rock-Solid) ---
  function getTrackScrollHeight() {
    return scrollAnimationTrack ? scrollAnimationTrack.offsetHeight : window.innerHeight * 4.2;
  }

  function onScroll() {
    if (isUserScrubbing) return;
    const trackHeight = getTrackScrollHeight();
    const scrollY = window.scrollY;

    // Progress across the 240 frames
    targetProgress = Math.min(1, Math.max(0, scrollY / trackHeight));

    // Hide fixed overlays and bottom controller when scrolled into showcase
    const enteredShowcase = scrollY >= trackHeight;
    if (bottomController) {
      if (enteredShowcase) {
        bottomController.classList.add('hidden-state');
      } else {
        bottomController.classList.remove('hidden-state');
      }
    }

    if (storyOverlays) {
      if (enteredShowcase) {
        storyOverlays.classList.add('hidden-state');
      } else {
        storyOverlays.classList.remove('hidden-state');
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // --- 6. Section Visibility Across Rest, Burst, Zero-G, and Settle ---
  function updateStorySections(progress) {
    const isPastAnimation = window.scrollY >= getTrackScrollHeight();

    sections.forEach((section) => {
      if (isPastAnimation) {
        section.classList.remove('active');
        return;
      }

      const start = parseFloat(section.dataset.start);
      const end = parseFloat(section.dataset.end);

      if (progress >= start && progress < end) {
        if (!section.classList.contains('active')) {
          section.classList.add('active');
        }
      } else {
        if (section.classList.contains('active')) {
          section.classList.remove('active');
        }
      }
    });

    // Update bottom marker active states
    markerBtns.forEach((btn) => {
      const markerVal = parseFloat(btn.dataset.target);
      const diff = Math.abs(progress - markerVal);
      if (diff < 0.16 && !isPastAnimation) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --- 7. Main Animation Loop (rAF + Silky Lerp) ---
  function animate() {
    const diff = targetProgress - currentProgress;
    if (Math.abs(diff) > 0.0001) {
      currentProgress += diff * LERP_FACTOR;
    } else {
      currentProgress = targetProgress;
    }

    const frameIdx = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.round(currentProgress * (TOTAL_FRAMES - 1)))
    );

    if (frameIdx !== activeFrameIndex) {
      activeFrameIndex = frameIdx;
      renderFrame(activeFrameIndex);

      if (soundEnabled && Math.abs(activeFrameIndex - lastSoundFrame) > 3) {
        playCrispFizzSound(activeFrameIndex);
        lastSoundFrame = activeFrameIndex;
      }

      if (navFrameNum) {
        navFrameNum.textContent = padNumber(activeFrameIndex + 1);
      }

      if (scrubFrameVal) {
        scrubFrameVal.textContent = padNumber(activeFrameIndex + 1);
      }

      if (!isUserScrubbing && scrubberSlider) {
        scrubberSlider.value = activeFrameIndex;
        const percent = (activeFrameIndex / (TOTAL_FRAMES - 1)) * 100;
        if (scrubFill) scrubFill.style.width = `${percent}%`;
      }
    }

    updateStorySections(currentProgress);

    requestAnimationFrame(animate);
  }

  // --- 8. Scrubber Slider Events ---
  if (scrubberSlider) {
    scrubberSlider.addEventListener('input', (e) => {
      isUserScrubbing = true;
      if (isAutoplaying) stopAutoplay();

      const frameVal = parseInt(e.target.value, 10);
      const newProgress = frameVal / (TOTAL_FRAMES - 1);
      targetProgress = newProgress;
      currentProgress = newProgress;

      const trackHeight = getTrackScrollHeight();
      const targetScrollY = newProgress * trackHeight;

      window.scrollTo({
        top: targetScrollY,
        behavior: 'instant'
      });

      if (scrubFill) {
        scrubFill.style.width = `${newProgress * 100}%`;
      }
      if (scrubFrameVal) {
        scrubFrameVal.textContent = padNumber(frameVal + 1);
      }
    });

    scrubberSlider.addEventListener('change', () => {
      isUserScrubbing = false;
    });
  }

  // --- 9. Timeline Marker Jump Buttons (Rest, Burst, Zero-G, Settle) ---
  markerBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (isAutoplaying) stopAutoplay();
      const targetVal = parseFloat(btn.dataset.target);
      const trackHeight = getTrackScrollHeight();
      const targetScrollY = targetVal * trackHeight;

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    });
  });

  // Global helper to scroll down into the showcase
  window.scrollToShowcase = function () {
    if (isAutoplaying) stopAutoplay();
    const trackHeight = getTrackScrollHeight();
    window.scrollTo({
      top: trackHeight + 20,
      behavior: 'smooth'
    });
  };

  // --- 10. Auto-Play Mode ---
  function startAutoplay() {
    isAutoplaying = true;
    autoplayBtn.classList.add('active-state');
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    playLabel.textContent = 'Pause';

    const trackHeight = getTrackScrollHeight();

    if (currentProgress >= 0.98 || window.scrollY >= trackHeight) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      targetProgress = 0;
      currentProgress = 0;
    }

    const duration = 9500;
    const startProg = currentProgress;
    const startTime = performance.now();

    function autoplayStep(now) {
      if (!isAutoplaying) return;
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const nextProgress = startProg + t * (1 - startProg);

      targetProgress = nextProgress;
      const targetY = nextProgress * trackHeight;
      window.scrollTo({
        top: targetY,
        behavior: 'instant'
      });

      if (t < 1) {
        autoplayTimer = requestAnimationFrame(autoplayStep);
      } else {
        stopAutoplay();
      }
    }

    autoplayTimer = requestAnimationFrame(autoplayStep);
  }

  function stopAutoplay() {
    isAutoplaying = false;
    if (autoplayTimer) cancelAnimationFrame(autoplayTimer);
    autoplayBtn.classList.remove('active-state');
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    playLabel.textContent = 'Auto-Play';
  }

  if (autoplayBtn) {
    autoplayBtn.addEventListener('click', () => {
      if (isAutoplaying) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });
  }

  window.addEventListener('wheel', () => {
    if (isAutoplaying) stopAutoplay();
  }, { passive: true });

  window.addEventListener('touchstart', () => {
    if (isAutoplaying) stopAutoplay();
  }, { passive: true });

  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      if (isAutoplaying) stopAutoplay();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- 11. Web Audio API Sensory Sound Design ---
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playCrispFizzSound(frameIdx) {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const baseFreq = frameIdx > 40 && frameIdx < 160 ? 1200 : 800;
      osc.frequency.setValueAtTime(baseFreq + Math.random() * 600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  function playASMRSound(stage) {
    initAudio();
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (stage === 0) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (stage === 1) {
        const bufferSize = audioCtx.sampleRate * 0.25;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 5000;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch (e) {}
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      initAudio();
      soundEnabled = !soundEnabled;

      if (soundEnabled) {
        soundIconOff.classList.add('hidden');
        soundIconOn.classList.remove('hidden');
        soundBtn.classList.add('active-state');
      } else {
        soundIconOff.classList.remove('hidden');
        soundIconOn.classList.add('hidden');
        soundBtn.classList.remove('active-state');
      }
    });
  }

  // --- 12. Aesthetic Showcase Micro-Interactions ---
  window.playTrigger = function (index, btn) {
    playASMRSound(index);

    const captions = [
      "Playing: Tab Crack (Snap)",
      "Playing: Micro-Fizz (Effervescence)",
      "Playing: Clinking Ice Cubes (Tumble)"
    ];
    const captionEl = document.getElementById('asmr-caption');
    if (captionEl) captionEl.innerText = captions[index];

    const buttons = document.querySelectorAll('.asmr-btn');
    buttons.forEach((b, i) => {
      if (i === index) {
        b.classList.remove('bg-surface-container');
        b.classList.add('bg-surface-container-highest', 'scale-[1.02]');
        const icon = b.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.classList.add('text-primary');
          icon.classList.remove('text-secondary');
        }
      } else {
        b.classList.add('bg-surface-container');
        b.classList.remove('bg-surface-container-highest', 'scale-[1.02]');
        const icon = b.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.classList.remove('text-primary');
          icon.classList.add('text-secondary');
        }
      }
    });
  };

  window.togglePin = function (btn) {
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon.textContent === 'bookmark') {
      icon.textContent = 'bookmark_added';
      btn.classList.add('text-primary');
    } else {
      icon.textContent = 'bookmark';
      btn.classList.remove('text-primary');
    }
  };

  window.selectPack = function (card) {
    const allCards = document.querySelectorAll('.pack-card');
    allCards.forEach(c => {
      c.classList.remove('ring-2', 'ring-primary-container', 'bg-surface-container-high');
      c.classList.add('bg-surface-container-low');
      const check = c.querySelector('.pack-check');
      if (check) {
        check.classList.remove('bg-primary-container', 'text-on-primary-container');
        check.classList.add('bg-surface-container-highest', 'text-secondary');
        const icon = check.querySelector('.material-symbols-outlined');
        if (icon) icon.classList.add('hidden');
      }
    });

    card.classList.remove('bg-surface-container-low');
    card.classList.add('ring-2', 'ring-primary-container', 'bg-surface-container-high');
    const activeCheck = card.querySelector('.pack-check');
    if (activeCheck) {
      activeCheck.classList.add('bg-primary-container', 'text-on-primary-container');
      activeCheck.classList.remove('bg-surface-container-highest', 'text-secondary');
      const icon = activeCheck.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.remove('hidden');
    }

    const priceText = card.querySelector('span.font-semibold').innerText.split('/')[0].trim();
    const bucketText = document.getElementById('bucket-text');
    if (bucketText) bucketText.innerText = `Add to Ice Bucket • ${priceText}`;
  };

  window.addToBucket = function (btn) {
    // Determine active selected pack
    const activeCard = document.querySelector('.pack-card.ring-primary-container') || document.querySelector('.pack-card');
    let packName = "The Chic Sleek 6-Pack";
    let cans = 6;
    let total = 240;

    if (activeCard) {
      const titleEl = activeCard.querySelector('h4');
      if (titleEl) packName = titleEl.innerText.trim();
      if (packName.includes("12-Pack")) {
        cans = 12;
        total = 480;
      } else if (packName.includes("Subscription")) {
        cans = 24;
        total = 960;
      }
    }

    const newOrder = {
      id: `DC-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: "Metropolitan Customer",
      pack: packName,
      cans: cans,
      pricePerCan: 40,
      total: total,
      status: "Sub-Zero Chilled",
      address: "Express Cold Drop",
      timestamp: new Date().toISOString()
    };

    // Save to local storage for immediate Admin Dashboard visibility
    try {
      const existing = JSON.parse(localStorage.getItem("diet_coke_orders_v1") || "[]");
      existing.unshift(newOrder);
      localStorage.setItem("diet_coke_orders_v1", JSON.stringify(existing));
    } catch (e) {}

    // Send to backend API
    try {
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder)
      });
    } catch (e) {}

    // Button feedback
    const original = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined text-[20px] text-emerald-300">verified</span> Added to Chiller • ₹${total} (View in Dashboard ⚡)`;
    btn.classList.add('bg-white', 'text-black');

    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.remove('bg-white', 'text-black');
    }, 2800);
  };

  window.handleSubscribe = function (btn) {
    const input = btn.previousElementSibling.querySelector('input');
    if (input && input.value.includes('@')) {
      const email = input.value.trim();
      btn.innerText = "✓ Welcome to the Silver Circle";
      btn.classList.add('bg-primary-container', 'text-on-primary-container');
      input.value = "";

      // Post to backend API
      try {
        fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
      } catch (e) {}
    } else if (input) {
      input.focus();
    }
  };

  // --- 13. Initialization ---
  preloadImages();
  resizeCanvas();
  onScroll();
  requestAnimationFrame(animate);

})();
