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
  // --- 3. Draw Frame on Canvas with Aspect Ratio Contain & Fallback ---
  function getClosestLoadedFrame(index) {
    if (frames[index] && frames[index].complete && frames[index].naturalWidth > 0) {
      return frames[index];
    }
    // Search backwards first (most common scroll path)
    for (let i = index - 1; i >= 0; i--) {
      if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
        return frames[i];
      }
    }
    // Search forwards
    for (let i = index + 1; i < TOTAL_FRAMES; i++) {
      if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
        return frames[i];
      }
    }
    return frames[0] || null;
  }

  function renderFrame(index) {
    const img = getClosestLoadedFrame(index);
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

  // --- 4. Instant Millisecond Loader & Progressive Frame Streaming ---
  let loaderDismissed = false;

  function dismissLoader() {
    if (loaderDismissed) return;
    loaderDismissed = true;
    if (loader) {
      loader.classList.add('loaded');
      setTimeout(() => {
        loader.style.display = 'none';
      }, 200);
    }
  }

  function preloadImages() {
    // 1. Instant First Frame Load -> Instant Millisecond Reveal
    const firstImg = new Image();
    firstImg.src = `${FRAME_PREFIX}001${FRAME_EXT}`;
    firstImg.onload = () => {
      frames[0] = firstImg;
      loadedCount++;
      resizeCanvas();
      renderFrame(0);
      dismissLoader();
      startProgressiveStream();
    };
    firstImg.onerror = () => {
      dismissLoader();
      startProgressiveStream();
    };

    // 2. Strict Millisecond Guarantee: reveal within 200ms regardless of connection
    setTimeout(() => {
      dismissLoader();
      if (!firstImg.complete) {
        startProgressiveStream();
      }
    }, 200);
  }

  function startProgressiveStream() {
    // Prioritized queue:
    // A. Opening 25 frames for butter-smooth start
    // B. Keyframe milestones (every 6th frame) for instant timeline scrub
    // C. All remaining frames in parallel worker chunks
    const keyframes = [];
    for (let i = 2; i <= Math.min(25, TOTAL_FRAMES); i++) {
      keyframes.push(i);
    }
    for (let i = 30; i <= TOTAL_FRAMES; i += 6) {
      if (!keyframes.includes(i)) keyframes.push(i);
    }
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      if (!keyframes.includes(i)) keyframes.push(i);
    }

    let queueIdx = 0;
    const CONCURRENCY = 8;

    function fetchNext() {
      if (queueIdx >= keyframes.length) {
        isAllLoaded = true;
        return;
      }
      const frameNum = keyframes[queueIdx++];
      const fIdx = frameNum - 1;

      if (frames[fIdx]) {
        fetchNext();
        return;
      }

      const img = new Image();
      img.src = `${FRAME_PREFIX}${padNumber(frameNum)}${FRAME_EXT}`;
      img.onload = () => {
        frames[fIdx] = img;
        loadedCount++;
        fetchNext();
      };
      img.onerror = () => {
        loadedCount++;
        fetchNext();
      };
    }

    for (let c = 0; c < CONCURRENCY; c++) {
      fetchNext();
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

  // --- 11. Persistent Background Audio Engine (Starts when User Scrolls) ---
  const bgmAudio = document.getElementById('bgm-audio');
  if (bgmAudio) {
    bgmAudio.loop = true;
    bgmAudio.volume = 0.8;
  }

  let bgmStarted = false;
  function startBgmOnScroll() {
    if (!bgmStarted && bgmAudio) {
      bgmAudio.play().then(() => {
        bgmStarted = true;
      }).catch(() => {
        // Handled: Will retry on user gesture
      });
    }
  }

  // Audio starts specifically when user starts scrolling!
  window.addEventListener('scroll', startBgmOnScroll, { passive: true });
  window.addEventListener('wheel', startBgmOnScroll, { passive: true });
  window.addEventListener('touchmove', startBgmOnScroll, { passive: true });
  window.addEventListener('touchstart', startBgmOnScroll, { passive: true });

  // --- 12. Aesthetic Showcase Micro-Interactions & Audio FX ---
  window.playTrigger = function (index, btn) {
    startBgmOnScroll();

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

  // --- 13. PhonePe UPI Payment Gateway & Concierge Cart Engine (₹1 / Can) ---
  let selectedPackInfo = {
    name: "The Chic Sleek 6-Pack",
    cans: 6,
    pricePerCan: 1,
    total: 6
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
    let total = 6;

    if (title.includes("12-Pack")) {
      cans = 12;
      total = 12;
    } else if (title.includes("Subscription") || title.includes("24")) {
      cans = 24;
      total = 24;
    }

    selectedPackInfo = {
      name: title,
      cans: cans,
      pricePerCan: 1,
      total: total
    };

    const bucketText = document.getElementById('bucket-text');
    if (bucketText) {
      bucketText.innerText = `Proceed to Checkout • ₹${total} (PhonePe UPI)`;
    }
  };

  window.openCheckoutModal = function (customPack) {
    startBgmOnScroll();

    if (customPack === 'chilled-can') {
      selectedPackInfo = {
        name: "Single Sub-Zero Chilled Can",
        cans: 1,
        pricePerCan: 1,
        total: 1
      };
    }

    const packNameEl = document.getElementById('checkout-pack-name');
    const packBreakdownEl = document.getElementById('checkout-pack-breakdown');
    const totalPriceEl = document.getElementById('checkout-total-price');

    if (packNameEl) packNameEl.innerText = selectedPackInfo.name;
    if (packBreakdownEl) {
      packBreakdownEl.innerText = `${selectedPackInfo.cans} Can${selectedPackInfo.cans > 1 ? 's' : ''} × ₹1 per can • Instant Cold Drop`;
    }
    if (totalPriceEl) totalPriceEl.innerText = `₹${selectedPackInfo.total}`;

    // Always start at Step 1: Address First
    window.goToAddressStep();

    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('hidden');
  };

  window.closeCheckoutModal = function () {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.goToAddressStep = function () {
    const stepAddress = document.getElementById('checkout-step-address');
    const stepPayment = document.getElementById('checkout-step-payment');
    const stepSuccess = document.getElementById('checkout-step-success');
    const stepCaption = document.getElementById('modal-step-caption');

    if (stepAddress) stepAddress.classList.remove('hidden');
    if (stepPayment) stepPayment.classList.add('hidden');
    if (stepSuccess) stepSuccess.classList.add('hidden');
    if (stepCaption) stepCaption.innerText = "Step 1 of 2 • Delivery Location & Contact Details";
  };

  window.handleProceedToPayment = function (event) {
    if (event) event.preventDefault();

    const name = document.getElementById('pay-name')?.value.trim();
    const phone = document.getElementById('pay-phone')?.value.trim();
    const address = document.getElementById('pay-address')?.value.trim();
    const city = document.getElementById('pay-city')?.value.trim();
    const pincode = document.getElementById('pay-pincode')?.value.trim();

    if (!name || !phone || !address || !city || !pincode) {
      alert("Please fill in your delivery name, phone, address, city, and pincode.");
      return;
    }

    // Populate Step 2 confirmed summary
    const previewSummary = document.getElementById('preview-delivery-summary');
    const previewPhone = document.getElementById('preview-delivery-phone');
    const payAmountBadge = document.getElementById('pay-amount-badge');
    const upiAppLinkEl = document.getElementById('upi-app-link');

    if (previewSummary) previewSummary.innerText = `${name} • ${address}, ${city} - ${pincode}`;
    if (previewPhone) previewPhone.innerText = `Ph: ${phone}`;
    if (payAmountBadge) payAmountBadge.innerText = `₹${selectedPackInfo.total}`;

    if (upiAppLinkEl) {
      const upiUrl = `upi://pay?pa=8102899986@ybl&pn=Ahsan%20Aziz&am=${selectedPackInfo.total}&cu=INR&tn=Diet%20Coke%20${encodeURIComponent(selectedPackInfo.name)}`;
      upiAppLinkEl.href = upiUrl;
    }

    // Transition to Step 2
    const stepAddress = document.getElementById('checkout-step-address');
    const stepPayment = document.getElementById('checkout-step-payment');
    const stepSuccess = document.getElementById('checkout-step-success');
    const stepCaption = document.getElementById('modal-step-caption');

    if (stepAddress) stepAddress.classList.add('hidden');
    if (stepPayment) stepPayment.classList.remove('hidden');
    if (stepSuccess) stepSuccess.classList.add('hidden');
    if (stepCaption) stepCaption.innerText = `Step 2 of 2 • Pay ₹${selectedPackInfo.total} via PhonePe UPI`;
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

    const name = document.getElementById('pay-name')?.value.trim() || "Metropolitan Customer";
    const phone = document.getElementById('pay-phone')?.value.trim() || "8102899986";
    const address = document.getElementById('pay-address')?.value.trim() || "Sub-Zero Express Drop";
    const city = document.getElementById('pay-city')?.value.trim() || "Metro";
    const pincode = document.getElementById('pay-pincode')?.value.trim() || "400001";
    const landmark = document.getElementById('pay-landmark')?.value.trim();
    const utr = document.getElementById('pay-utr')?.value.trim() || `UPI-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    const fullAddress = `${address}, ${city} - ${pincode}${landmark ? ` (${landmark})` : ''}`;
    const orderId = `DC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderId,
      customer: name,
      phone: phone,
      pack: selectedPackInfo.name,
      cans: selectedPackInfo.cans,
      pricePerCan: 1,
      total: selectedPackInfo.total,
      status: "Sub-Zero Chilled",
      address: fullAddress,
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

    // Populate Step 3 Success Screen with drop animation
    const successOrderIdEl = document.getElementById('success-order-id');
    const successOrderTotalEl = document.getElementById('success-order-total');
    const successOrderPackEl = document.getElementById('success-order-pack');
    const successOrderAddressEl = document.getElementById('success-order-address');

    if (successOrderIdEl) successOrderIdEl.innerText = orderId;
    if (successOrderTotalEl) successOrderTotalEl.innerText = `₹${selectedPackInfo.total}`;
    if (successOrderPackEl) successOrderPackEl.innerText = selectedPackInfo.name;
    if (successOrderAddressEl) successOrderAddressEl.innerText = `${city} (${pincode})`;

    const stepAddress = document.getElementById('checkout-step-address');
    const stepPayment = document.getElementById('checkout-step-payment');
    const stepSuccess = document.getElementById('checkout-step-success');
    const stepCaption = document.getElementById('modal-step-caption');

    if (stepAddress) stepAddress.classList.add('hidden');
    if (stepPayment) stepPayment.classList.add('hidden');
    if (stepSuccess) stepSuccess.classList.remove('hidden');
    if (stepCaption) stepCaption.innerText = "Payment Verified • Order Dispatched";
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
