(() => {
  "use strict";

  const config = window.weddingConfig || {};
  const placeholderWords =
    /your name|partner's name|wedding date|wedding time|venue name|full venue address|your city/i;

  // Fill all matching text locations from js/config.js.
  document.querySelectorAll("[data-bind]").forEach((element) => {
    const key = element.getAttribute("data-bind");
    if (typeof config[key] === "string" && config[key].length) {
      element.textContent = config[key];
    }
  });

  // Load temporary photos (or local paths chosen in config.js) with a background fallback if one fails.
  document.querySelectorAll("[data-image]").forEach((image) => {
    const key = image.getAttribute("data-image");
    const url = config.images && config.images[key];
    if (url) {
      image.src = url;
      image.addEventListener(
        "error",
        () => {
          image.classList.add("image-failed");
          image.removeAttribute("src");
        },
        { once: true },
      );
    }
  });

  // Show one Instagram link for the shared couple account (never individual accounts).
  const instagramLink = document.getElementById("instagramLink");
  const instagramHandleLabel = document.getElementById("instagramHandleLabel");
  const instagramHandle = String(config.instagramHandle || "")
    .trim()
    .replace(/^@+/, "");
  if (instagramLink && instagramHandle) {
    instagramLink.href = instagramHandle;
    instagramLink.hidden = false;
    instagramLink.setAttribute(
      "aria-label",
      `Visit our shared Instagram account @${instagramHandle}`,
    );
    if (instagramHandleLabel)
      instagramHandleLabel.textContent = `@${instagramHandle}`;
    document.body.classList.add("has-instagram");
  }

  // Google Maps link remains politely disabled until a real venue address has been entered.
  const mapLink = document.getElementById("mapLink");
  const mapLinkLabel = document.getElementById("mapLinkLabel");
  const address = String(config.address || "").trim();
  const hasAddress = address && !placeholderWords.test(address);
  if (mapLink && hasAddress) {
    const mapUrl =
      String(config.mapUrl || "").trim() ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    mapLink.href = mapUrl;
    mapLink.classList.remove("is-disabled");
    mapLink.removeAttribute("aria-disabled");
    if (mapLinkLabel) mapLinkLabel.textContent = "Open in Google Maps";
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const video = document.getElementById("storyVideo");
  const stage = document.querySelector(".film-stage");
  const progress = document.getElementById("filmProgress");
  const videoNote = document.getElementById("videoNote");
  let videoReady = false;
  let targetTime = 0;
  let seekFrame = 0;
  let scrollProgress = 0;

  // This is a scroll-scrubbed film, not an autoplay video. Some mobile browsers
  // can resume muted inline media unexpectedly, so explicitly lock it to paused
  // playback and let scroll-driven currentTime seeks choose the displayed frame.
  if (video) {
    video.autoplay = false;
    video.removeAttribute("autoplay");
    video.defaultMuted = true;
    video.muted = true;
    video.pause();

    const keepVideoPaused = () => {
      if (!video.paused) video.pause();
    };
    video.addEventListener("play", keepVideoPaused);
    video.addEventListener("playing", keepVideoPaused);
    document.addEventListener("visibilitychange", keepVideoPaused);
  }

  function paintProgress(value) {
    if (progress)
      progress.style.width = `${Math.max(0, Math.min(1, value)) * 100}%`;
  }

  function seekVideo(value) {
    if (!videoReady || !Number.isFinite(video.duration) || video.duration <= 0)
      return;
    targetTime = Math.max(
      0,
      Math.min(video.duration - 0.04, value * video.duration),
    );
    if (seekFrame) return;
    seekFrame = window.requestAnimationFrame(() => {
      seekFrame = 0;
      // Never allow natural playback; only the scroll position may advance frames.
      if (!video.paused) video.pause();
      if (videoReady && Math.abs(video.currentTime - targetTime) > 0.035) {
        try {
          video.currentTime = targetTime;
          video.pause();
        } catch (_) {
          /* Wait for the browser to make the frame seekable. */
        }
      }
    });
  }

  if (video && stage) {
    video.addEventListener("loadedmetadata", () => {
      videoReady = Number.isFinite(video.duration) && video.duration > 0;
      if (videoReady) {
        stage.classList.add("is-video-ready");
        if (videoNote) videoNote.hidden = true;
        seekVideo(scrollProgress);
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }
    });
    video.addEventListener("canplay", () => {
      if (video.videoWidth > 0) {
        videoReady = true;
        stage.classList.add("is-video-ready");
        if (videoNote) videoNote.hidden = true;
        seekVideo(scrollProgress);
      }
    });
    video.addEventListener("error", () => {
      // Expected until assets/videos/love-story.mp4 is added; keep the still-image fallback visible.
      videoReady = false;
      stage.classList.remove("is-video-ready");
      if (videoNote) videoNote.hidden = false;
    });
  }

  // GSAP is progressive enhancement: the static page remains usable if the CDN is unavailable.
  function initScrollAnimations() {
    if (reducedMotion || !window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);

    window.gsap.fromTo(
      ".hero-eyebrow, .hero h1, .hero-tagline, .hero-divider, .hero-date",
      {
        opacity: 0,
        y: 18,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1.05,
        stagger: 0.11,
        ease: "power2.out",
        delay: 0.15,
      },
    );

    window.gsap.fromTo(
      ".chapter-photo",
      { scale: 1.08 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".chapter-section",
          start: "top bottom",
          end: "center center",
          scrub: 0.7,
        },
      },
    );

    window.gsap.fromTo(
      ".chapter-copy > *",
      { opacity: 0, y: 22 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.09,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".chapter-copy",
          start: "top 78%",
          once: true,
        },
      },
    );

    window.gsap.fromTo(
      ".invitation-heading, .invitation-details, .invitation-closing",
      { opacity: 0, y: 22 },
      {
        opacity: 1,
        y: 0,
        duration: 0.85,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".invitation-section",
          start: "top 72%",
          once: true,
        },
      },
    );

    // Pin the video frame while scroll position scrubs through the movie in either direction.
    window.ScrollTrigger.create({
      trigger: ".film-section",
      start: "top top",
      end: () => `+=${Math.round(window.innerHeight * 1.55)}`,
      pin: ".film-stage",
      pinSpacing: true,
      scrub: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        scrollProgress = self.progress;
        paintProgress(scrollProgress);
        seekVideo(scrollProgress);
      },
      onRefresh(self) {
        scrollProgress = self.progress;
        paintProgress(scrollProgress);
        seekVideo(scrollProgress);
      },
    });
  }

  if (document.readyState === "complete") initScrollAnimations();
  else window.addEventListener("load", initScrollAnimations, { once: true });

  // If GSAP/CDN is unavailable, keep a simple progress indicator as a fallback.
  if (!window.gsap || !window.ScrollTrigger) {
    const filmSection = document.querySelector(".film-section");
    if (filmSection) {
      window.addEventListener(
        "scroll",
        () => {
          const rect = filmSection.getBoundingClientRect();
          const range = Math.max(
            1,
            filmSection.offsetHeight - window.innerHeight,
          );
          scrollProgress = Math.max(0, Math.min(1, -rect.top / range));
          paintProgress(scrollProgress);
          seekVideo(scrollProgress);
        },
        { passive: true },
      );
    }
  }
})();
