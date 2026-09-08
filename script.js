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
const pdfPreviewShells = Array.from(document.querySelectorAll(".pdf-embed-shell"));
const heroThreeShell = document.querySelector("[data-hero-three]");
const assetVersion = "20260908a";
let hasRequestedHeroThree = false;
let pdfLibraryPromise;

function requestHeroThree() {
  if (hasRequestedHeroThree || prefersReducedMotion || !heroThreeShell) {
    return;
  }

  hasRequestedHeroThree = true;

  const script = document.createElement("script");
  script.src = `hero-three.bundle.js?v=${assetVersion}`;
  script.defer = true;
  document.head.appendChild(script);
}

function scheduleHeroThree() {
  if (prefersReducedMotion || !heroThreeShell) {
    return;
  }

  const interactiveSurface = heroThreeShell.closest(".hero-visual");

  if (interactiveSurface) {
    interactiveSurface.addEventListener("pointermove", requestHeroThree, { once: true, passive: true });
    interactiveSurface.addEventListener("click", requestHeroThree, { once: true });
    interactiveSurface.addEventListener("touchstart", requestHeroThree, { once: true, passive: true });
  }
}

function loadPdfLibrary() {
  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  if (pdfLibraryPromise) {
    return pdfLibraryPromise;
  }

  pdfLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `assets/vendor/pdf.min.js?v=${assetVersion}`;
    script.async = true;
    script.onload = () => {
      if (!window.pdfjsLib) {
        reject(new Error("PDF.js unavailable"));
        return;
      }

      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `assets/vendor/pdf.worker.min.js?v=${assetVersion}`;
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error("PDF.js failed to load"));
    document.head.appendChild(script);
  });

  return pdfLibraryPromise;
}

async function renderPdfPage(page, canvas, wrapper) {
  const baseViewport = page.getViewport({ scale: 1 });
  await new Promise((resolve) => window.requestAnimationFrame(resolve));

  const maxPreviewWidth = window.innerWidth <= 760 ? Math.min(Math.round(window.innerWidth * 0.82), 300) : 320;
  const availableWidth = Math.min(Math.max(wrapper.clientWidth || 0, canvas.parentElement?.clientWidth || 0, 220), maxPreviewWidth);
  const fitScale = availableWidth / baseViewport.width;
  const outputScale = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale: fitScale * outputScale });
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    throw new Error("Canvas unavailable");
  }

  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  canvas.style.width = `${Math.round(baseViewport.width * fitScale)}px`;
  canvas.style.height = `${Math.round(baseViewport.height * fitScale)}px`;

  await page.render({
    canvasContext: context,
    viewport
  }).promise;
}

async function activatePdfPreview(root) {
  if (!root) {
    return;
  }

  const shell = root;
  const viewer = shell.querySelector("[data-pdf-viewer]");
  const placeholder = shell.querySelector("[data-pdf-placeholder]");
  const fallback = shell.querySelector("[data-pdf-fallback]");

  if (!viewer || viewer.dataset.loaded === "true" || viewer.dataset.loading === "true") {
    return;
  }

  const source = viewer.dataset.pdfSrc;
  if (!source) {
    return;
  }

  viewer.dataset.loading = "true";

  if (placeholder && viewer.dataset.loadingLabel) {
    placeholder.textContent = viewer.dataset.loadingLabel;
  }

  try {
    const pdfjsLib = await loadPdfLibrary();
    const pdf = await pdfjsLib.getDocument({ url: source }).promise;
    const totalPages = Math.min(pdf.numPages, 4);
    const pages = await Promise.all(
      Array.from({ length: totalPages }, (_, index) => pdf.getPage(index + 1))
    );

    viewer.textContent = "";
    const renderJobs = [];

    pages.forEach((page, index) => {
      const pageNumber = index + 1;
      const figure = document.createElement("figure");
      figure.className = "pdf-page";

      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-label", `${viewer.dataset.pageLabel || "Preview page"} ${pageNumber}`);
      figure.appendChild(canvas);
      viewer.appendChild(figure);

      renderJobs.push(
        renderPdfPage(page, canvas, figure).then(() => {
          if (!shell?.classList.contains("is-loaded")) {
            shell?.classList.remove("is-error");
            shell?.classList.add("is-loaded");
          }
        })
      );
    });

    await Promise.all(renderJobs);

    viewer.dataset.loaded = "true";
    viewer.dataset.loading = "false";
    shell?.classList.remove("is-error");

    if (fallback) {
      fallback.hidden = true;
    }
  } catch (error) {
    viewer.dataset.loading = "false";
    shell?.classList.add("is-error");

    if (placeholder && viewer.dataset.errorLabel) {
      placeholder.textContent = viewer.dataset.errorLabel;
    }

    if (fallback) {
      fallback.hidden = false;
    }
  }
}

function scheduleLazyPdfPreviews() {
  if (pdfPreviewShells.length === 0) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    pdfPreviewShells.forEach((shell) => activatePdfPreview(shell));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activatePdfPreview(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "220px 0px"
    }
  );

  pdfPreviewShells.forEach((shell) => observer.observe(shell));

  const triggerFallbackLoad = () => {
    window.setTimeout(() => {
      pdfPreviewShells.forEach((shell) => activatePdfPreview(shell));
    }, 1200);
  };

  if (document.readyState === "complete") {
    triggerFallbackLoad();
  } else {
    window.addEventListener("load", triggerFallbackLoad, { once: true });
  }
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
scheduleLazyPdfPreviews();

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