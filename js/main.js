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
  const videoNoteText = document.getElementById("videoNoteText");
  const videoSource = video ? video.querySelector("source[data-src]") : null;
  const desktopVideoMedia = window.matchMedia("(min-width: 768px)");
  let videoLoader = null;
  let videoLoadStarted = false;
  let metadataReady = false;
  let frameReady = false;
  let videoReady = false;
  let targetTime = 0;
  let seekFrame = 0;
  let scrollProgress = 0;

  function paintProgress(value) {
    if (progress)
      progress.style.width = `${Math.max(0, Math.min(1, value)) * 100}%`;
  }

  function updateVideoNote(message, visible = true) {
    if (videoNoteText && message) videoNoteText.textContent = message;
    if (videoNote) videoNote.hidden = !visible;
  }

  // Start loading before the film section enters the viewport, giving the browser time
  // to fetch metadata and decode the first frame while the visitor reads the hero.
  function startVideoLoad() {
    // Mobile uses a still image; never download or decode the MP4 there.
    if (
      !desktopVideoMedia.matches ||
      !video ||
      !videoSource ||
      videoLoadStarted
    )
      return;
    const sourceUrl = videoSource.dataset.src;
    if (!sourceUrl) return;

    videoLoadStarted = true;
    video.preload = "auto";
    videoSource.src = sourceUrl;
    updateVideoNote("Preparing the film…", true);
    video.load();
  }

  function revealVideoWhenReady() {
    if (!stage || !videoReady) return;
    stage.classList.add("is-video-ready");
    updateVideoNote("", false);
  }

  function seekVideo(value) {
    if (
      !video ||
      !metadataReady ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    )
      return;
    targetTime = Math.max(
      0,
      Math.min(video.duration - 0.04, value * video.duration),
    );
    if (!frameReady || seekFrame) return;

    seekFrame = window.requestAnimationFrame(() => {
      seekFrame = 0;
      if (!videoReady || video.seeking) return;
      if (Math.abs(video.currentTime - targetTime) > 0.035) {
        try {
          video.currentTime = targetTime;
        } catch (_) {
          // The browser may not have enough data for this frame yet. The next seek/scroll
          // update will retry using the latest target time.
        }
      }
    });
  }

  if (video && stage) {
    video.addEventListener("loadedmetadata", () => {
      metadataReady = Number.isFinite(video.duration) && video.duration > 0;
      if (metadataReady) {
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        seekVideo(scrollProgress);
      }
    });

    // loadeddata means at least the first video frame is decoded; do not reveal a black
    // rectangle just because metadata arrived before the pixels did.
    video.addEventListener("loadeddata", () => {
      frameReady = video.videoWidth > 0;
      videoReady = frameReady && metadataReady;
      revealVideoWhenReady();
      seekVideo(scrollProgress);
    });

    video.addEventListener("canplay", () => {
      frameReady = video.videoWidth > 0;
      videoReady = frameReady && metadataReady;
      revealVideoWhenReady();
      seekVideo(scrollProgress);
    });

    // If scrolling changes the target while the browser is decoding a seek, apply the
    // most recent target after the current seek completes instead of queuing many seeks.
    video.addEventListener("seeked", () => {
      if (videoReady && Math.abs(video.currentTime - targetTime) > 0.06) {
        seekVideo(scrollProgress);
      }
    });

    video.addEventListener("error", () => {
      videoReady = false;
      frameReady = false;
      stage.classList.remove("is-video-ready");
      updateVideoNote(
        "Video unavailable. Check that assets/videos/love-story.mp4 exists and is optimized for web playback.",
        true,
      );
    });

    function observeVideoLoad() {
      if (!desktopVideoMedia.matches || videoLoadStarted || !stage) return;
      if (videoLoader) videoLoader.disconnect();
      if ("IntersectionObserver" in window) {
        videoLoader = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              startVideoLoad();
              if (videoLoader) videoLoader.disconnect();
            }
          },
          { rootMargin: `${Math.round(window.innerHeight * 1.8)}px 0px` },
        );
        videoLoader.observe(stage);
      } else {
        // Older desktop browsers: start immediately, since there is no reliable near-viewport signal.
        startVideoLoad();
      }
    }

    function updateVideoMode() {
      if (desktopVideoMedia.matches) {
        observeVideoLoad();
        updateVideoNote("Preparing the film…", !videoReady);
        return;
      }

      // Phones and narrow tablets use only the separate still image. If a user resizes
      // from desktop, remove the MP4 source and release the media resource as well.
      if (videoLoader) videoLoader.disconnect();
      video.pause();
      stage.classList.remove("is-video-ready");
      videoReady = false;
      frameReady = false;
      metadataReady = false;
      videoLoadStarted = false;
      if (videoSource && videoSource.hasAttribute("src")) {
        videoSource.removeAttribute("src");
        video.load();
      }
      updateVideoNote("", false);
      paintProgress(0);
    }

    if (desktopVideoMedia.addEventListener) {
      desktopVideoMedia.addEventListener("change", updateVideoMode);
    } else {
      desktopVideoMedia.addListener(updateVideoMode);
    }
    updateVideoMode();
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

    // Preserve the cinematic scroll-scrubbed implementation on desktop only.
    // GSAP matchMedia automatically reverts the pin when the viewport becomes mobile-sized.
    const desktopFilmMatch = window.gsap.matchMedia();
    desktopFilmMatch.add("(min-width: 768px)", () => {
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
          if (!desktopVideoMedia.matches) return;
          const rect = filmSection.getBoundingClientRect();
          const range = Math.max(
            1,
            filmSection.offsetHeight - window.innerHeight,
          );
          scrollProgress = Math.max(0, Math.min(1, -rect.top / range));
          paintProgress(scrollProgress);
        },
        { passive: true },
      );
    }
  }
})();
