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
    if (autoplayBtn) autoplayBtn.classList.remove('active-state');
    if (playIcon) playIcon.classList.remove('hidden');
    if (pauseIcon) pauseIcon.classList.add('hidden');
    if (playLabel) playLabel.textContent = 'Auto-Play';
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

  window.scrollToShowcase = function () {
    if (showcaseStart) {
      showcaseStart.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- 11. Persistent Background Audio Engine (User Provided bgm.mp3) ---
  const bgmAudio = document.getElementById('bgm-audio');
  if (bgmAudio) {
    bgmAudio.loop = true;
    bgmAudio.volume = 0.8;
  }

  function playBgm() {
    if (bgmAudio && bgmAudio.paused) {
      bgmAudio.play().catch(() => {
        // Will start playback on user gesture/interaction
      });
    }
  }

  // Continuous music in background on scroll and interactions - No switch-off toggle
  window.addEventListener('scroll', playBgm, { passive: true });
  window.addEventListener('wheel', playBgm, { passive: true });
  window.addEventListener('touchstart', playBgm, { passive: true });
  window.addEventListener('touchmove', playBgm, { passive: true });
  window.addEventListener('click', playBgm, { passive: true });
  window.addEventListener('keydown', playBgm, { passive: true });

  // --- 12. Aesthetic Showcase Micro-Interactions & Audio FX ---
  window.playTrigger = function (index, btn) {
    playBgm();

    const captions = [
      "Playing: The Tab Crack • Signature Snap",
      "Playing: Micro-Fizz • Pure Effervescence",
      "Playing: Sub-Zero Frost • Tumbling Chill"
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

  // --- 13. PhonePe UPI Payment Gateway & Concierge Cart Engine ---
  let selectedPackInfo = {
    name: "The Chic Sleek 6-Pack",
    cans: 6,
    pricePerCan: 40,
    total: 240
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

    const titleEl = card.querySelector('h4');
    let title = titleEl ? titleEl.innerText.trim() : "The Chic Sleek 6-Pack";
    let cans = 6;
    let total = 240;

    if (title.includes("12-Pack")) {
      cans = 12;
      total = 480;
    } else if (title.includes("Subscription") || title.includes("24")) {
      cans = 24;
      total = 960;
    }

    selectedPackInfo = {
      name: title,
      cans: cans,
      pricePerCan: 40,
      total: total
    };

    const bucketText = document.getElementById('bucket-text');
    if (bucketText) {
      bucketText.innerText = `Proceed to Checkout • ₹${total} (PhonePe UPI)`;
    }
  };

  window.openCheckoutModal = function (customPack) {
    playBgm();

    if (customPack === 'chilled-can') {
      selectedPackInfo = {
        name: "Single Sub-Zero Chilled Can",
        cans: 1,
        pricePerCan: 40,
        total: 40
      };
    }

    const packNameEl = document.getElementById('checkout-pack-name');
    const packBreakdownEl = document.getElementById('checkout-pack-breakdown');
    const totalPriceEl = document.getElementById('checkout-total-price');
    const upiAppLinkEl = document.getElementById('upi-app-link');

    if (packNameEl) packNameEl.innerText = selectedPackInfo.name;
    if (packBreakdownEl) {
      packBreakdownEl.innerText = `${selectedPackInfo.cans} Can${selectedPackInfo.cans > 1 ? 's' : ''} × ₹40 per can • Instant Cold Drop`;
    }
    if (totalPriceEl) totalPriceEl.innerText = `₹${selectedPackInfo.total}`;

    if (upiAppLinkEl) {
      const upiUrl = `upi://pay?pa=8102899986@ybl&pn=Ahsan%20Aziz&am=${selectedPackInfo.total}&cu=INR&tn=Diet%20Coke%20${encodeURIComponent(selectedPackInfo.name)}`;
      upiAppLinkEl.href = upiUrl;
    }

    const modal = document.getElementById('checkout-modal');
    const viewForm = document.getElementById('checkout-view-form');
    const viewSuccess = document.getElementById('checkout-view-success');

    if (viewForm) viewForm.classList.remove('hidden');
    if (viewSuccess) viewSuccess.classList.add('hidden');
    if (modal) modal.classList.remove('hidden');
  };

  window.closeCheckoutModal = function () {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.copyUpiId = function () {
    const upiId = "8102899986@ybl";
    const btn = document.getElementById('copy-upi-btn');

    const finish = () => {
      if (btn) {
        const orig = btn.innerText;
        btn.innerText = "COPIED ✓";
        btn.classList.add('bg-emerald-500/30', 'text-emerald-300');
        setTimeout(() => {
          btn.innerText = orig;
          btn.classList.remove('bg-emerald-500/30', 'text-emerald-300');
        }, 2200);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(upiId).then(finish).catch(finish);
    } else {
      finish();
    }
  };

  window.handleUpiPaymentSubmit = function (event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('pay-name');
    const phoneInput = document.getElementById('pay-phone');
    const addressInput = document.getElementById('pay-address');
    const utrInput = document.getElementById('pay-utr');

    const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Metropolitan Customer";
    const phone = phoneInput && phoneInput.value.trim() ? phoneInput.value.trim() : "8102899986";
    const address = addressInput && addressInput.value.trim() ? addressInput.value.trim() : "Sub-Zero Express Drop";
    const utr = utrInput && utrInput.value.trim() ? utrInput.value.trim() : `UPI-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    const orderId = `DC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderId,
      customer: name,
      phone: phone,
      pack: selectedPackInfo.name,
      cans: selectedPackInfo.cans,
      pricePerCan: 40,
      total: selectedPackInfo.total,
      status: "Sub-Zero Chilled",
      address: address,
      utr: utr,
      gateway: "PhonePe UPI (8102899986@ybl)",
      payee: "Ahsan Aziz",
      timestamp: new Date().toISOString()
    };

    // Save to local storage for instant dashboard reflection
    try {
      const existing = JSON.parse(localStorage.getItem("diet_coke_orders_v1") || "[]");
      existing.unshift(newOrder);
      localStorage.setItem("diet_coke_orders_v1", JSON.stringify(existing));
    } catch (e) {}

    // POST to backend API
    try {
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder)
      });
    } catch (e) {}

    // Update Success Screen
    const successOrderIdEl = document.getElementById('success-order-id');
    const successOrderTotalEl = document.getElementById('success-order-total');
    if (successOrderIdEl) successOrderIdEl.innerText = orderId;
    if (successOrderTotalEl) successOrderTotalEl.innerText = `₹${selectedPackInfo.total}`;

    const viewForm = document.getElementById('checkout-view-form');
    const viewSuccess = document.getElementById('checkout-view-success');
    if (viewForm) viewForm.classList.add('hidden');
    if (viewSuccess) viewSuccess.classList.remove('hidden');
  };

  window.addToBucket = function (btn) {
    window.openCheckoutModal();
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
