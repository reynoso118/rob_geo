/* Robert & Geo Take On Yellowstone & Grand Teton — app behavior
   Vanilla JS, no dependencies. Handles accordions, checklist persistence,
   reveal-on-tap confirmations, countdown, offline status, and nav highlighting. */

// Set to false to keep confirmation numbers and the Wi-Fi password hidden
// and unrevealable everywhere in the app (useful before making the repo public).
const SHOW_SENSITIVE_DETAILS = true;

(function () {
  "use strict";

  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);

  const liveRegion = $("#liveRegion");
  function announce(msg) {
    if (!liveRegion) return;
    liveRegion.textContent = "";
    // Re-trigger so repeated identical messages are still announced.
    window.requestAnimationFrame(() => { liveRegion.textContent = msg; });
  }

  /* ---------------------------------------------------------------
     Maps links: Apple Maps on iOS/Mac, Google Maps universal link
     everywhere else. No API key, works offline-tolerant (fails
     gracefully — these links simply need connectivity to resolve).
     --------------------------------------------------------------- */
  function isApplePlatform() {
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isMac = /Macintosh/.test(ua) && !isIOS;
    return isIOS || isMac;
  }

  function setupMapsLinks() {
    const apple = isApplePlatform();
    $$("[data-maps-query]").forEach((el) => {
      const query = el.getAttribute("data-maps-query");
      const encoded = encodeURIComponent(query);
      el.href = apple
        ? `https://maps.apple.com/?q=${encoded}`
        : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    });
  }

  /* ---------------------------------------------------------------
     Day accordions
     --------------------------------------------------------------- */
  const EXPANDED_KEY = "rg-yellowstone-expanded-days";

  function readExpandedSet() {
    try {
      return new Set(JSON.parse(localStorage.getItem(EXPANDED_KEY) || "[]"));
    } catch (e) {
      return new Set();
    }
  }

  function writeExpandedSet(set) {
    try {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify(Array.from(set)));
    } catch (e) { /* storage unavailable — ignore */ }
  }

  function setDayOpen(header, body, open) {
    header.setAttribute("aria-expanded", String(open));
    body.hidden = !open;
  }

  function setupAccordions() {
    const expanded = readExpandedSet();
    $$(".day-header").forEach((header) => {
      const body = document.getElementById(header.getAttribute("aria-controls"));
      const card = header.closest(".day-card");
      if (expanded.has(card.id)) setDayOpen(header, body, true);

      header.addEventListener("click", () => {
        const isOpen = header.getAttribute("aria-expanded") === "true";
        setDayOpen(header, body, !isOpen);
        const set = readExpandedSet();
        if (isOpen) set.delete(card.id); else set.add(card.id);
        writeExpandedSet(set);
      });
    });
  }

  function expandAllDays() {
    $$(".day-header").forEach((header) => {
      const body = document.getElementById(header.getAttribute("aria-controls"));
      setDayOpen(header, body, true);
    });
    const set = new Set($$(".day-card").map((c) => c.id));
    writeExpandedSet(set);
  }

  function collapseAllDays() {
    $$(".day-header").forEach((header) => {
      const body = document.getElementById(header.getAttribute("aria-controls"));
      setDayOpen(header, body, false);
    });
    writeExpandedSet(new Set());
  }

  /* ---------------------------------------------------------------
     Mark day reviewed
     --------------------------------------------------------------- */
  const REVIEWED_PREFIX = "rg-yellowstone-reviewed-";

  function setupReviewedButtons() {
    $$(".day-card").forEach((card) => {
      const key = REVIEWED_PREFIX + card.id;
      const isReviewed = localStorage.getItem(key) === "1";
      card.dataset.reviewed = isReviewed ? "true" : "false";
    });

    $$("[data-mark-reviewed]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".day-card");
        const key = REVIEWED_PREFIX + card.id;
        const nowReviewed = card.dataset.reviewed !== "true";
        card.dataset.reviewed = nowReviewed ? "true" : "false";
        try { localStorage.setItem(key, nowReviewed ? "1" : "0"); } catch (e) { /* ignore */ }
        btn.textContent = nowReviewed ? "✓ Reviewed" : "✓ Mark day reviewed";
        announce(nowReviewed ? "Day marked reviewed" : "Day marked not reviewed");
      });
      const card = btn.closest(".day-card");
      if (card.dataset.reviewed === "true") btn.textContent = "✓ Reviewed";
    });
  }

  /* ---------------------------------------------------------------
     Checklist: persistence, progress, controls
     --------------------------------------------------------------- */
  function checklistStorageKey(cb) { return "rg-yellowstone-" + cb.dataset.key; }

  function setupChecklist() {
    const boxes = $$(".check-input[data-key]");
    // A few keys (the two pending cancellations) appear twice in the page —
    // once under "Still to cancel" and once in the Urgent group. Count each
    // unique key once, and keep same-key checkboxes in sync live.
    const uniqueKeys = Array.from(new Set(boxes.map((b) => b.dataset.key)));

    function boxesForKey(key) { return boxes.filter((b) => b.dataset.key === key); }

    function updateProgress() {
      const done = uniqueKeys.filter((key) => boxesForKey(key)[0].checked).length;
      const total = uniqueKeys.length;
      $("#progressText").textContent = `${done} of ${total} complete`;
      const pct = total ? Math.round((done / total) * 100) : 0;
      $("#progressFill").style.width = pct + "%";
    }

    function syncItemVisual(cb) {
      const item = cb.closest(".check-item");
      item.classList.toggle("done", cb.checked);
    }

    boxes.forEach((cb) => {
      let stored;
      try { stored = localStorage.getItem(checklistStorageKey(cb)); } catch (e) { stored = null; }
      cb.checked = stored === "1";
      syncItemVisual(cb);

      cb.addEventListener("change", () => {
        try { localStorage.setItem(checklistStorageKey(cb), cb.checked ? "1" : "0"); } catch (e) { /* ignore */ }
        // Mirror state to any other checkbox sharing this key.
        boxesForKey(cb.dataset.key).forEach((other) => {
          if (other !== cb) { other.checked = cb.checked; syncItemVisual(other); }
        });
        syncItemVisual(cb);
        updateProgress();
        applyHideCompleted();
      });
    });

    updateProgress();

    $("#btnResetChecklist").addEventListener("click", () => {
      if (!window.confirm("Clear every checklist item? This cannot be undone.")) return;
      boxes.forEach((cb) => {
        cb.checked = false;
        try { localStorage.removeItem(checklistStorageKey(cb)); } catch (e) { /* ignore */ }
        syncItemVisual(cb);
      });
      updateProgress();
      applyHideCompleted();
      announce("Checklist reset");
    });

    let hideCompleted = false;
    function applyHideCompleted() {
      $$(".check-item").forEach((item) => {
        const cb = item.querySelector(".check-input");
        if (!cb) return;
        item.classList.toggle("is-hidden", hideCompleted && cb.checked);
      });
    }

    $("#btnHideCompleted").addEventListener("click", (e) => {
      hideCompleted = !hideCompleted;
      e.target.setAttribute("aria-pressed", String(hideCompleted));
      e.target.textContent = hideCompleted ? "Show completed" : "Hide completed";
      applyHideCompleted();
    });

    function setGroupsOpen(open) {
      $$(".checklist-group").forEach((g) => g.style.display = "");
      // groups are always visible; "expand/collapse all" applies to day accordions
      // and is also offered here for convenience since checklist groups are flat lists.
    }

    $("#btnExpandAll").addEventListener("click", () => { expandAllDays(); announce("All days expanded"); });
    $("#btnCollapseAll").addEventListener("click", () => { collapseAllDays(); announce("All days collapsed"); });
  }

  /* ---------------------------------------------------------------
     RV pickup/return walkthrough checklist (rendered into #rvChecklist)
     --------------------------------------------------------------- */
  function renderRvChecklist() {
    const container = $("#rvChecklist");
    if (!container) return;
    const items = [
      ["rv-exterior-photos-2", "Photograph exterior damage"],
      ["rv-interior-photos", "Photograph interior condition"],
      ["rv-water-system", "Test water system"],
      ["rv-electrical-hookups", "Test electrical hookups"],
      ["rv-fridge-2", "Test refrigerator"],
      ["rv-propane-2", "Confirm propane level"],
      ["rv-fuel-return", "Confirm fuel return level"],
      ["rv-wastewater", "Confirm wastewater tank requirements"],
      ["rv-generator-rules", "Confirm generator rules"],
      ["rv-cleaning-policy", "Confirm cleaning policy"],
      ["rv-emergency-contact", "Confirm emergency contact number"],
    ];
    container.innerHTML = items.map(([key, label]) => `
      <label class="check-item" style="border-left-color:#3d6ea5">
        <input class="check-input" type="checkbox" data-key="${key}">
        <span class="check-text"><span class="check-title">${label}</span></span>
      </label>
    `).join("");
  }

  /* ---------------------------------------------------------------
     Reveal-on-tap confirmation numbers (sessionStorage only)
     --------------------------------------------------------------- */
  function setupReveal() {
    $$(".reveal-row").forEach((row) => {
      const valueEl = row.querySelector(".reveal-value");
      const toggleBtn = row.querySelector("[data-reveal-toggle]");
      const copyBtn = row.querySelector("[data-copy-target]");
      const secret = valueEl.getAttribute("data-secret");
      const groupKey = "rg-yellowstone-reveal-" + (row.getAttribute("data-reveal-group") || secret);

      if (!SHOW_SENSITIVE_DETAILS) {
        toggleBtn.disabled = true;
        toggleBtn.textContent = "Hidden";
        toggleBtn.title = "Sensitive details are disabled in this deployment.";
        return;
      }

      function render(revealed) {
        valueEl.textContent = revealed ? secret : "•".repeat(Math.min(secret.length, 14));
        toggleBtn.textContent = revealed ? "Hide" : "Reveal";
        toggleBtn.setAttribute("aria-pressed", String(revealed));
        copyBtn.hidden = !revealed;
      }

      let revealed = sessionStorage.getItem(groupKey) === "1";
      render(revealed);

      toggleBtn.addEventListener("click", () => {
        revealed = !revealed;
        try { sessionStorage.setItem(groupKey, revealed ? "1" : "0"); } catch (e) { /* ignore */ }
        render(revealed);
        announce(revealed ? "Confirmation number revealed" : "Confirmation number hidden");
      });

      copyBtn.addEventListener("click", () => copyText(secret, copyBtn));
    });
  }

  /* ---------------------------------------------------------------
     Copy to clipboard (addresses + confirmation numbers)
     --------------------------------------------------------------- */
  function copyText(text, sourceEl) {
    const done = () => {
      announce("Copied to clipboard");
      if (sourceEl) {
        const original = sourceEl.textContent;
        sourceEl.textContent = "✓";
        setTimeout(() => { sourceEl.textContent = original; }, 1200);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  function setupCopyButtons() {
    $$("[data-copy-text]").forEach((btn) => {
      btn.addEventListener("click", () => copyText(btn.getAttribute("data-copy-text")));
    });
  }

  /* ---------------------------------------------------------------
     Countdown
     --------------------------------------------------------------- */
  function setupCountdown() {
    const el = $("#countdownValue");
    const wrap = $("#countdown");
    if (!el) return;

    const start = new Date("2026-08-15T00:00:00");
    const end = new Date("2026-08-20T00:00:00"); // end of Aug 19

    function tick() {
      const now = new Date();
      if (now < start) {
        const diffMs = start - now;
        const days = Math.floor(diffMs / 86400000);
        const hours = Math.floor((diffMs % 86400000) / 3600000);
        el.textContent = days > 0
          ? `${days} day${days === 1 ? "" : "s"}, ${hours} hr${hours === 1 ? "" : "s"} to go`
          : `${hours} hour${hours === 1 ? "" : "s"} to go`;
      } else if (now >= start && now < end) {
        el.textContent = "Adventure in progress";
      } else {
        el.textContent = "Adventure complete";
      }
    }
    tick();
    setInterval(tick, 60000);
  }

  /* ---------------------------------------------------------------
     "View today" quick action
     --------------------------------------------------------------- */
  function setupViewToday() {
    const btn = $("#qaToday");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const todayStr = new Date().toISOString().slice(0, 10);
      let card = $(`.day-card[data-date="${todayStr}"]`);
      if (!card) {
        // Fall back to the next upcoming day, or the first day before the trip,
        // or the last day after the trip.
        const cards = $$(".day-card");
        card = cards.find((c) => c.dataset.date >= todayStr) || cards[cards.length - 1];
      }
      if (!card) { window.location.hash = "#days"; return; }
      const header = card.querySelector(".day-header");
      const body = document.getElementById(header.getAttribute("aria-controls"));
      setDayOpen(header, body, true);
      const set = readExpandedSet();
      set.add(card.id);
      writeExpandedSet(set);
      card.scrollIntoView({ behavior: "smooth", block: "start" });
      card.setAttribute("tabindex", "-1");
      card.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------------
     Active-section nav highlighting
     --------------------------------------------------------------- */
  function setupNavHighlighting() {
    const navLinks = $$("[data-nav]");
    const sectionIds = ["home", "route", "days", "checklist", "reservations"];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("data-nav") === id));
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });

    sections.forEach((s) => observer.observe(s));
  }

  /* ---------------------------------------------------------------
     Offline status indicator
     green = available offline, amber = installing,
     gray = not yet cached, red = update failed
     --------------------------------------------------------------- */
  function setStatus(state, text) {
    $$(".status-pill").forEach((pill) => {
      pill.dataset.state = state;
      pill.querySelector(".status-text").textContent = text;
    });
  }

  function setupServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      setStatus("not-cached", "Offline mode unsupported");
      return;
    }

    setStatus("installing", "Preparing offline files…");

    navigator.serviceWorker.register("service-worker.js").then((reg) => {
      function trackWorker(worker) {
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed") {
            setStatus(navigator.serviceWorker.controller ? "offline-ready" : "installing",
              navigator.serviceWorker.controller ? "Available offline" : "Finishing setup…");
          }
          if (worker.state === "redundant") {
            setStatus("update-failed", "Update failed");
          }
        });
      }
      if (reg.installing) trackWorker(reg.installing);
      if (reg.waiting) setStatus("offline-ready", "Available offline (update ready)");
      if (reg.active && !reg.installing) setStatus("offline-ready", "Available offline");
      reg.addEventListener("updatefound", () => trackWorker(reg.installing));
    }).catch(() => {
      setStatus("update-failed", "Offline setup failed");
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      setStatus("offline-ready", "Available offline");
    });
  }

  /* ---------------------------------------------------------------
     Init
     --------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    setupMapsLinks();
    renderRvChecklist();
    setupAccordions();
    setupReviewedButtons();
    setupChecklist();
    setupReveal();
    setupCopyButtons();
    setupCountdown();
    setupViewToday();
    setupNavHighlighting();
    setupServiceWorker();
  });
})();
