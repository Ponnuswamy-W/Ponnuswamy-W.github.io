const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const topbar = document.querySelector(".topbar");
const scrollProgress = document.querySelector("[data-scroll-progress]");
const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function closeNav() {
  if (!nav || !navToggle) {
    return;
  }

  nav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
}

function toggleNav() {
  if (!nav || !navToggle) {
    return;
  }

  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
}

function syncHeaderState() {
  if (topbar) {
    topbar.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  if (scrollProgress) {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? Math.min(window.scrollY / scrollableHeight, 1) : 0;
    scrollProgress.style.transform = `scaleX(${progress})`;
  }

  if (sections.length === 0) {
    return;
  }

  const offset = window.scrollY + 180;
  let currentId = sections[0].id;

  sections.forEach((section) => {
    if (section.offsetTop <= offset) {
      currentId = section.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${currentId}`);
  });
}

if (navToggle) {
  navToggle.addEventListener("click", toggleNav);
}

navLinks.forEach((link) => {
  link.addEventListener("click", closeNav);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNav();
  }
});

document.addEventListener("click", (event) => {
  if (!nav || !navToggle || !nav.classList.contains("is-open")) {
    return;
  }

  if (!nav.contains(event.target) && !navToggle.contains(event.target)) {
    closeNav();
  }
});

window.addEventListener("scroll", syncHeaderState, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    closeNav();
  }

  syncHeaderState();
});

syncHeaderState();

const revealItems = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const magneticButtons = prefersReducedMotion
  ? []
  : Array.from(document.querySelectorAll("[data-magnetic]"));
const lazyPdfEmbeds = Array.from(document.querySelectorAll("[data-lazy-pdf]"));
const heroThreeShell = document.querySelector("[data-hero-three]");
let hasRequestedHeroThree = false;

function requestHeroThree() {
  if (hasRequestedHeroThree || prefersReducedMotion || !heroThreeShell) {
    return;
  }

  hasRequestedHeroThree = true;

  const script = document.createElement("script");
  script.src = "hero-three.bundle.js";
  script.defer = true;
  document.head.appendChild(script);
}

function scheduleHeroThree() {
  if (prefersReducedMotion || !heroThreeShell) {
    return;
  }

  const interactiveSurface = heroThreeShell.closest(".hero-visual");

  if (interactiveSurface) {
    interactiveSurface.addEventListener("pointerenter", requestHeroThree, { once: true });
    interactiveSurface.addEventListener("focusin", requestHeroThree, { once: true });
    interactiveSurface.addEventListener("touchstart", requestHeroThree, { once: true, passive: true });
  }

  const loadWhenIdle = () => {
    window.setTimeout(requestHeroThree, 3200);
  };

  if (document.readyState === "complete") {
    loadWhenIdle();
  } else {
    window.addEventListener("load", loadWhenIdle, { once: true });
  }
}

function activatePdfEmbed(embed) {
  if (!embed || embed.dataset.loaded === "true") {
    return;
  }

  const source = embed.dataset.src;
  if (!source) {
    return;
  }

  const shell = embed.closest(".pdf-embed-shell");
  embed.dataset.loaded = "true";
  embed.data = source;
  shell?.classList.add("is-loaded");
}

function scheduleLazyPdfEmbeds() {
  if (lazyPdfEmbeds.length === 0) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    lazyPdfEmbeds.forEach((embed) => activatePdfEmbed(embed));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activatePdfEmbed(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "320px 0px"
    }
  );

  lazyPdfEmbeds.forEach((embed) => observer.observe(embed));
}

magneticButtons.forEach((button) => {
  const resetButtonPosition = () => {
    button.style.setProperty("--button-shift-x", "0px");
    button.style.setProperty("--button-shift-y", "0px");
  };

  button.addEventListener("pointermove", (event) => {
    const rect = button.getBoundingClientRect();
    const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
    const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 10;

    button.style.setProperty("--button-shift-x", `${offsetX.toFixed(2)}px`);
    button.style.setProperty("--button-shift-y", `${offsetY.toFixed(2)}px`);
  });

  button.addEventListener("pointerleave", () => {
    resetButtonPosition();
  });

  button.addEventListener("blur", resetButtonPosition);
});

scheduleHeroThree();
scheduleLazyPdfEmbeds();

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -36px 0px"
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}