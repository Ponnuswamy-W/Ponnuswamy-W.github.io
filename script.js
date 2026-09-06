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