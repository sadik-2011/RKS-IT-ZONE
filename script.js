/* RK SKILL BD — shared front-end behaviour (no frameworks, no build step) */

(function () {
  "use strict";

  /* ---------- Theme toggle (persisted) ---------- */
  const root = document.documentElement;
  const saved = localStorage.getItem("rk-theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  if (saved) {
    root.setAttribute("data-theme", saved);
  } else if (prefersLight) {
    root.setAttribute("data-theme", "light");
  }

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".theme-toggle");
    if (!btn) return;
    const next = currentTheme() === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("rk-theme", next);
  });

  /* ---------- Sync real header height (fixes Android mobile-menu offset) ---------- */
  const headerEl = document.querySelector(".site-header");
  function syncHeaderHeight() {
    if (!headerEl) return;
    document.documentElement.style.setProperty("--header-h", headerEl.offsetHeight + "px");
  }
  syncHeaderHeight();
  window.addEventListener("resize", syncHeaderHeight);
  window.addEventListener("orientationchange", function () { setTimeout(syncHeaderHeight, 200); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(syncHeaderHeight); }

  /* ---------- Mobile nav ---------- */
  const navLinksEl = document.querySelector(".nav-links");
  const navBurgerEl = document.querySelector(".nav-burger");

  function closeMobileNav() {
    if (!navLinksEl || !navLinksEl.classList.contains("open")) return;
    navLinksEl.classList.remove("open");
    navBurgerEl && navBurgerEl.classList.remove("open");
    document.body.style.overflow = "";
  }

  function openMobileNav() {
    navLinksEl && navLinksEl.classList.add("open");
    navBurgerEl && navBurgerEl.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  document.addEventListener("click", function (e) {
    const burger = e.target.closest(".nav-burger");
    const link = e.target.closest(".nav-links a");
    if (burger) {
      if (navLinksEl && navLinksEl.classList.contains("open")) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    } else if (link) {
      closeMobileNav();
    } else if (
      navLinksEl &&
      navLinksEl.classList.contains("open") &&
      !e.target.closest(".nav-links")
    ) {
      /* Tap outside the open menu (the dimmed backdrop area) closes it. */
      closeMobileNav();
    }
  });

  /* Belt-and-braces: some Android WebViews fire touchend without a
     synthesized click on fixed-position overlays, so mirror the same
     outside-tap / link-tap closing logic there too. */
  document.addEventListener(
    "touchend",
    function (e) {
      if (!navLinksEl || !navLinksEl.classList.contains("open")) return;
      const burger = e.target.closest(".nav-burger");
      const link = e.target.closest(".nav-links a");
      if (burger) return; /* handled by click */
      if (link || !e.target.closest(".nav-links")) {
        closeMobileNav();
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", function () {
    if (window.innerWidth > 760) closeMobileNav();
  });

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMobileNav();
  });

  /* Android Chrome can restore a page from the back/forward cache with the
     menu's "open" class still applied from before navigation — this is
     what makes the menu bar appear "stuck" and not hide. Force-reset on
     every page show, including bfcache restores. */
  window.addEventListener("pageshow", closeMobileNav);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") closeMobileNav();
  });

  /* ---------- Active nav link by current page ---------- */
  (function markActive() {
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      const href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        a.classList.add("active");
      }
    });
  })();

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".card, .stat-box, .timeline-item, .accordion-item");
  if ("IntersectionObserver" in window && revealEls.length) {
    revealEls.forEach(function (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(18px)";
      el.style.transition = "opacity .55s ease, transform .55s ease";
    });
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero typing animation ---------- */
  const typeTarget = document.querySelector("[data-type-lines]");
  if (typeTarget) {
    const lines = JSON.parse(typeTarget.getAttribute("data-type-lines"));
    let li = 0, ci = 0;
    const cursor = typeTarget.querySelector(".type-cursor");
    function typeStep() {
      if (li >= lines.length) return;
      const full = lines[li];
      if (ci <= full.length) {
        const html = lines.slice(0, li).join("\n") + (li > 0 ? "\n" : "") + full.slice(0, ci);
        typeTarget.firstChild ? (typeTarget.childNodes[0].nodeValue = "") : null;
        typeTarget.innerHTML = html.replace(/\n/g, "<br>") + '<span class="type-cursor"></span>';
        ci++;
        setTimeout(typeStep, 22 + Math.random() * 30);
      } else {
        li++; ci = 0;
        setTimeout(typeStep, 420);
      }
    }
    typeStep();
  }

  /* ---------- Generic tabs / filters ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    const target = group.getAttribute("data-tabs");
    const items = document.querySelectorAll('[data-filter-group="' + target + '"]');
    group.querySelectorAll(".tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        group.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        const val = btn.getAttribute("data-filter");
        items.forEach(function (item) {
          const match = val === "all" || item.getAttribute("data-cat") === val;
          item.classList.toggle("show", match);
          item.classList.toggle("filter-item", true);
        });
      });
    });
  });

  /* ---------- Accordion ---------- */
  document.querySelectorAll(".accordion-head").forEach(function (head) {
    head.addEventListener("click", function () {
      const item = head.closest(".accordion-item");
      const wasOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".accordion-item").forEach(function (i) { i.classList.remove("open"); });
      if (!wasOpen) item.classList.add("open");
    });
  });

  /* ---------- Toast helper ---------- */
  window.rkToast = function (msg) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg><span></span>';
      document.body.appendChild(toast);
    }
    toast.querySelector("span").textContent = msg;
    toast.classList.add("show");
    clearTimeout(window.__rkToastT);
    window.__rkToastT = setTimeout(function () { toast.classList.remove("show"); }, 3200);
  };

  /* ---------- Contact form (submits via FormSubmit AJAX endpoint) ---------- */
  document.querySelectorAll(".js-contact-form").forEach(function (form) {
    const statusEl = form.querySelector(".form-status");
    const submitBtn = form.querySelector('button[type="submit"]');

    function setStatus(msg, state) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.classList.remove("is-success", "is-error");
      if (state) statusEl.classList.add(state);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const originalLabel = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }
      setStatus("Sending your message…", "");

      const ajaxAction = form.action.replace(
        "https://formsubmit.co/",
        "https://formsubmit.co/ajax/"
      );

      fetch(ajaxAction, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          return res.json();
        })
        .then(function () {
          setStatus("✅ Message sent successfully! We'll get back to you within 24 hours.", "is-success");
          rkToast("Message sent successfully!");
          form.reset();
        })
        .catch(function () {
          setStatus("❌ Something went wrong. Please try again or email us directly at rksitzone@gmail.com.", "is-error");
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
          }
        });
    });
  });

  /* ---------- Word / character counter tool (tools.html demo) ---------- */
  const counterInput = document.getElementById("counterInput");
  if (counterInput) {
    const wc = document.getElementById("wcWords");
    const cc = document.getElementById("wcChars");
    const sc = document.getElementById("wcSentences");
    const rt = document.getElementById("wcReadTime");
    counterInput.addEventListener("input", function () {
      const text = counterInput.value;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length : 0;
      wc.textContent = words;
      cc.textContent = chars;
      sc.textContent = sentences;
      rt.textContent = Math.max(1, Math.ceil(words / 200)) + " min";
    });
  }

  /* ---------- Case converter tool (tools.html demo) ---------- */
  document.querySelectorAll("[data-case]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const ta = document.getElementById("caseInput");
      if (!ta) return;
      const mode = btn.getAttribute("data-case");
      const v = ta.value;
      if (mode === "upper") ta.value = v.toUpperCase();
      else if (mode === "lower") ta.value = v.toLowerCase();
      else if (mode === "title") ta.value = v.replace(/\w\S*/g, function (t) { return t[0].toUpperCase() + t.slice(1).toLowerCase(); });
      else if (mode === "sentence") ta.value = v.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, function (c) { return c.toUpperCase(); });
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll(".js-year").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
