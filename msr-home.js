(function () {
  "use strict";

  var siteData = null;
  var galleryItems = [];
  var activeFilter = "all";
  var activeSlide = 0;

  function getPathSegmentsToSkip() {
    var s = window.location.pathname.split("/").filter(Boolean);
    return window.location.hostname.endsWith("github.io") && s.length > 1 ? 1 : 0;
  }
  function getBasePath() {
    var skip = getPathSegmentsToSkip();
    if (!skip) return "/";
    var s = window.location.pathname.split("/").filter(Boolean);
    return "/" + s.slice(0, skip).join("/") + "/";
  }
  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }
  function stars(n) {
    var h = "";
    for (var i = 0; i < 5; i++) h += '<span class="' + (i < n ? "text-gold-light" : "text-stone-dim") + '" aria-hidden="true">★</span>';
    return h;
  }

  function callHref() {
    if (siteData && siteData.business && siteData.business.phone) return "tel:" + siteData.business.phone.replace(/[^\d+]/g, "");
    return getBasePath() + "quote";
  }
  function callLabel() {
    if (siteData && siteData.business && siteData.business.phoneDisplay) return "Call " + siteData.business.phoneDisplay;
    if (siteData && siteData.business && siteData.business.phone) return "Call Now";
    return "Request Callback";
  }
  function applyCallLinks() {
    var href = callHref();
    var label = callLabel();
    document.querySelectorAll("[data-action='call']").forEach(function (el) {
      el.href = href;
      var lbl = el.querySelector(".call-label");
      if (lbl) lbl.textContent = label;
      else if (el.classList.contains("call-text-only")) el.textContent = label;
    });
  }
  function applyQuoteLinks() {
    var base = getBasePath();
    document.querySelectorAll("[data-action='quote']").forEach(function (el) {
      el.href = base + "quote";
    });
  }

  function injectSchema(data) {
    var b = data.business;
    var ar = data.aggregateRating;
    var ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "LocalBusiness",
          "@id": b.url + "#business",
          name: b.name,
          description: b.description,
          url: b.url,
          image: b.image,
          logo: b.logo,
          priceRange: b.priceRange,
          areaServed: b.serviceAreas,
          address: b.address,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ar.ratingValue,
            reviewCount: ar.reviewCount,
            bestRating: ar.bestRating,
            worstRating: ar.worstRating
          }
        },
        {
          "@type": "FAQPage",
          mainEntity: data.faqs.map(function (f) {
            return { "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } };
          })
        }
      ]
    };
    if (b.phone) ld["@graph"][0].telephone = b.phone;
    if (b.email) ld["@graph"][0].email = b.email;
    data.reviews.forEach(function (r) {
      ld["@graph"].push({
        "@type": "Review",
        author: { "@type": "Person", name: r.author },
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
        reviewBody: r.text,
        datePublished: r.date,
        itemReviewed: { "@id": b.url + "#business" }
      });
    });
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = "msr-schema";
    s.textContent = JSON.stringify(ld);
    var old = document.getElementById("msr-schema");
    if (old) old.remove();
    document.head.appendChild(s);
  }

  function renderTrustBar(data) {
    var el = document.getElementById("trust-bar");
    if (!el) return;
    el.innerHTML = data.trustStats.map(function (t, i) {
      var sep = i > 0 ? '<span class="hidden sm:inline text-gold/20">·</span>' : "";
      return sep + '<div class="text-center"><p class="font-display text-2xl sm:text-3xl text-gold-light font-semibold">' + esc(t.value) + '</p><p class="text-[10px] tracking-luxury uppercase text-stone-muted mt-1">' + esc(t.label) + '</p></div>';
    }).join("");
  }

  var shieldSvg = '<img src="assets/logo-msr.png" alt="" class="pillar-shield" width="24" height="24" aria-hidden="true" />';
  var crestSvg = '<img src="assets/logo-msr.png" alt="" class="gallery-crest" width="28" height="28" aria-hidden="true" />';

  function pillarIcon(numeral) {
    if (numeral === "I") return '<svg class="pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>';
    if (numeral === "II") return '<svg class="pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>';
    return '<svg class="pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>';
  }

  function renderPillars(data) {
    var el = document.getElementById("pillars-grid");
    if (!el || !data.pillars) return;
    el.innerHTML = data.pillars.map(function (p, i) {
      var feat = p.featured ? " pillar-featured" : "";
      return '<article class="reveal reveal-d' + (i + 1) + ' pillar-card rounded-sm p-7 sm:p-8' + feat + '" data-numeral="' + esc(p.numeral) + '">' +
        shieldSvg +
        '<div class="pillar-icon-wrap">' + pillarIcon(p.numeral) + '</div>' +
        '<p class="text-[10px] tracking-luxury uppercase text-gold/70 mb-2 font-medium">' + esc(p.numeral) + ' · ' + esc(p.title) + '</p>' +
        '<h3 class="font-display text-2xl text-gold-light font-semibold mb-2">' + esc(p.subtitle) + '</h3>' +
        '<p class="text-stone-soft text-sm leading-relaxed">' + esc(p.desc) + '</p></article>';
    }).join("");
  }

  function renderMarmorax(data) {
    var m = data.marmorax;
    if (!m) return;
    var heroTeaser = document.getElementById("hero-marmorax-teaser");
    if (heroTeaser) heroTeaser.textContent = m.heroTeaser;
    var wardenTeaser = document.getElementById("warden-teaser");
    if (wardenTeaser) wardenTeaser.textContent = m.wardenTeaser;
    var wardenImg = document.getElementById("warden-image");
    if (wardenImg) {
      wardenImg.src = m.image.replace(".webp", ".png");
      wardenImg.alt = m.imageAlt || (m.name + ", " + m.epithet);
    }
    renderLegend(m);
    renderLegendModal(m);
    var voiceList = document.getElementById("legend-voice-list");
    if (voiceList && m.brandVoice) {
      voiceList.innerHTML = m.brandVoice.map(function (v) {
        return '<li class="flex gap-2"><span class="text-gold shrink-0">◆</span><span>' + esc(v) + '</span></li>';
      }).join("");
    }
  }

  function renderLegend(m) {
    var timeline = document.getElementById("legend-timeline");
    if (timeline && m.timeline) {
      timeline.innerHTML = m.timeline.map(function (t, i) {
        return '<div class="reveal reveal-d' + (i % 4 + 1) + ' timeline-node">' +
          '<p class="text-[9px] tracking-luxury uppercase text-gold/60">' + esc(t.era) + ' · ' + esc(t.period) + '</p>' +
          '<h3 class="font-display text-xl text-gold-light font-semibold mt-1">' + esc(t.title) + '</h3>' +
          '<p class="text-stone-soft text-sm mt-2 leading-relaxed max-w-2xl">' + esc(t.desc) + '</p></div>';
      }).join("");
    }
    var body = document.getElementById("legend-body");
    if (body && m.legend) {
      body.innerHTML = m.legend.map(function (sec, i) {
        var paras = sec.paragraphs.map(function (p) {
          return '<p class="text-stone-soft text-sm sm:text-base leading-[1.85]">' + esc(p) + '</p>';
        }).join("");
        return '<article class="reveal reveal-d' + (i % 3 + 1) + ' legend-block">' +
          '<h3 class="font-display text-2xl text-gold-light font-semibold mb-4">' + esc(sec.title) + '</h3>' +
          '<div class="space-y-4">' + paras + '</div></article>';
      }).join("");
    }
  }

  function renderLegendModal(m) {
    var modalBody = document.getElementById("legend-modal-body");
    if (!modalBody || !m.legend) return;
    modalBody.innerHTML = m.legend.map(function (sec) {
      var paras = sec.paragraphs.map(function (p) {
        return '<p>' + esc(p) + '</p>';
      }).join("");
      return '<div><h3 class="font-display text-xl text-gold-light font-semibold mb-3">' + esc(sec.title) + '</h3>' +
        '<div class="space-y-3">' + paras + '</div></div>';
    }).join("");
  }

  function openLegendModal() {
    var modal = document.getElementById("legend-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLegendModal() {
    var modal = document.getElementById("legend-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("open");
    if (!document.getElementById("lightbox").classList.contains("open")) {
      document.body.style.overflow = "";
    }
  }

  function renderWhyChoose(data) {
    var wc = data.whyChoose;
    if (!wc) return;
    var headline = document.getElementById("why-headline");
    if (headline) headline.textContent = wc.headline;
    var phil = document.getElementById("why-philosophy");
    if (phil) phil.textContent = wc.philosophy;
    var highlights = document.getElementById("why-highlights");
    if (highlights) {
      highlights.innerHTML = wc.highlights.map(function (h, i) {
        return '<div class="reveal reveal-d' + (i % 3 + 1) + ' why-card rounded-sm p-6 sm:p-7">' +
          '<h3 class="font-display text-xl text-gold-light font-semibold mb-2">' + esc(h.title) + '</h3>' +
          '<p class="text-stone-soft text-sm leading-relaxed">' + esc(h.desc) + '</p></div>';
      }).join("");
    }
    var tech = document.getElementById("why-techniques");
    if (tech) {
      tech.innerHTML = wc.techniques.map(function (t) {
        return '<li class="flex gap-2 text-stone-soft text-sm"><span class="text-gold shrink-0">◆</span><span>' + esc(t) + '</span></li>';
      }).join("");
    }
  }

  function renderSliders(data) {
    var root = document.getElementById("slider-root");
    if (!root || !data.sliders.length) return;
    var slides = data.sliders;
    var html = '<div class="slider-stage relative">';
    slides.forEach(function (sl, i) {
      var hid = i === activeSlide ? "" : " hidden";
      html +=
        '<div class="slider-panel' + hid + '" data-slide="' + i + '" role="tabpanel"' + (i === activeSlide ? ' aria-hidden="false"' : ' aria-hidden="true"') + '>' +
        '<div class="ba-slider relative aspect-[16/10] sm:aspect-[16/9] rounded-sm overflow-hidden border border-gold/20 shadow-card" id="ba-' + i + '">' +
        '<img src="' + esc(sl.after) + '" alt="' + esc(sl.title) + ' after restoration" class="absolute inset-0 w-full h-full object-cover" loading="' + (i === 0 ? "eager" : "lazy") + '" />' +
        '<div class="ba-before absolute inset-y-0 left-0 overflow-hidden border-r-2 border-gold-light/80" style="width:50%">' +
        '<img src="' + esc(sl.before) + '" alt="' + esc(sl.title) + ' before restoration" class="absolute inset-0 h-full max-w-none object-cover ba-before-img" loading="' + (i === 0 ? "eager" : "lazy") + '" />' +
        '</div>' +
        '<div class="ba-handle absolute top-0 bottom-0 w-1 bg-gold-light shadow-[0_0_12px_rgba(232,197,71,0.8)] pointer-events-none" style="left:50%"></div>' +
        '<span class="absolute top-3 left-3 z-20 px-2 py-0.5 text-[8px] tracking-luxury uppercase rounded-sm label-before">Before</span>' +
        '<span class="absolute top-3 right-3 z-20 px-2 py-0.5 text-[8px] tracking-luxury uppercase rounded-sm label-after">After</span>' +
        '<input type="range" min="0" max="100" value="50" class="ba-range absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" aria-label="Drag to compare before and after: ' + esc(sl.title) + '" />' +
        '</div>' +
        '<div class="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">' +
        '<div><h3 class="font-display text-2xl text-gold-light font-semibold">' + esc(sl.title) + '</h3>' +
        '<p class="text-stone-soft text-sm mt-2 max-w-xl leading-relaxed">' + esc(sl.caption) + '</p></div>' +
        '<a href="' + getBasePath() + 'quote" data-action="quote" class="cta-primary shrink-0 inline-flex items-center justify-center min-h-[48px] px-6 border border-gold/50 text-gold-light font-display tracking-wide text-sm sm:text-base">Request a Quote</a>' +
        '</div></div>';
    });
    html += '</div><div class="flex flex-wrap items-center justify-center gap-2 mt-8" role="tablist" aria-label="Restoration projects">';
    slides.forEach(function (sl, i) {
      html += '<button type="button" class="slider-dot px-3 py-1.5 text-[9px] tracking-luxury uppercase border rounded-sm transition-all' + (i === activeSlide ? " is-active" : "") + '" data-slide-to="' + i + '" role="tab" aria-selected="' + (i === activeSlide ? "true" : "false") + '">' + esc(sl.title) + '</button>';
    });
    html += '</div>';
    root.innerHTML = html;
    initBaSliders();
    root.querySelectorAll(".slider-dot").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeSlide = +btn.getAttribute("data-slide-to");
        renderSliders(data);
      });
    });
    applyQuoteLinks();
  }

  function initBaSliders() {
    document.querySelectorAll(".ba-slider").forEach(function (slider) {
      var input = slider.querySelector(".ba-range");
      var before = slider.querySelector(".ba-before");
      var handle = slider.querySelector(".ba-handle");
      var img = slider.querySelector(".ba-before-img");
      if (!input || !before) return;
      function sync() {
        var v = +input.value;
        before.style.width = v + "%";
        if (handle) handle.style.left = v + "%";
        if (img && slider.offsetWidth) img.style.width = slider.offsetWidth + "px";
        input.setAttribute("aria-valuenow", v);
      }
      input.addEventListener("input", sync);
      window.addEventListener("resize", sync);
      sync();
    });
  }

  function renderReviews(data) {
    var el = document.getElementById("reviews-grid");
    if (!el) return;
    el.innerHTML = data.reviews.map(function (r, i) {
      var proj = r.project ? '<p class="text-[9px] tracking-luxury uppercase text-gold/60 mb-3">' + esc(r.project) + '</p>' : "";
      return '<article class="reveal reveal-d' + (i % 3 + 1) + ' review-card rounded-sm p-6 sm:p-7">' +
        proj +
        '<div class="flex gap-0.5 text-sm mb-3" aria-label="' + r.rating + ' out of 5 stars">' + stars(r.rating) + '</div>' +
        '<p class="text-stone-soft text-sm leading-relaxed italic">"' + esc(r.text) + '"</p>' +
        '<p class="mt-4 text-xs text-stone-muted"><span class="text-gold-light/90 font-medium">' + esc(r.author) + '</span> · ' + esc(r.location) + '</p></article>';
    }).join("");
  }

  function renderFaqs(data) {
    var el = document.getElementById("faq-list");
    if (!el) return;
    el.innerHTML = data.faqs.map(function (f, i) {
      return '<div class="faq-item border border-gold/12 rounded-sm overflow-hidden">' +
        '<button type="button" class="faq-trigger w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-display text-lg text-gold-light hover:bg-gold/5 transition-colors" aria-expanded="false" id="faq-btn-' + i + '" aria-controls="faq-panel-' + i + '">' +
        esc(f.question) + '<svg class="faq-chevron w-4 h-4 shrink-0 text-gold/60 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="1.5" d="M6 9l6 6 6-6"/></svg></button>' +
        '<div id="faq-panel-' + i + '" class="faq-panel hidden px-5 pb-4 text-stone-soft text-sm leading-relaxed" role="region" aria-labelledby="faq-btn-' + i + '">' + esc(f.answer) + '</div></div>';
    }).join("");
    el.querySelectorAll(".faq-trigger").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        el.querySelectorAll(".faq-trigger").forEach(function (b) {
          b.setAttribute("aria-expanded", "false");
          b.querySelector(".faq-chevron").classList.remove("rotate-180");
        });
        el.querySelectorAll(".faq-panel").forEach(function (p) { p.classList.add("hidden"); });
        if (!open) {
          btn.setAttribute("aria-expanded", "true");
          btn.querySelector(".faq-chevron").classList.add("rotate-180");
          document.getElementById(btn.getAttribute("aria-controls")).classList.remove("hidden");
        }
      });
    });
  }

  function renderGuarantees(data) {
    var el = document.getElementById("guarantee-list");
    if (!el) return;
    el.innerHTML = data.guarantees.map(function (g) {
      return '<li class="flex gap-3 text-stone-soft text-sm"><span class="text-gold shrink-0">✓</span><span>' + esc(g) + '</span></li>';
    }).join("");
  }

  /* --- gallery --- */
  function isSlugEntry(k, v) {
    if (k.charAt(0) === "_") return false;
    if (typeof v === "string") return /^https?:\/\//.test(v);
    return typeof v === "object" && v && v.url && /^https?:\/\//.test(v.url);
  }
  function getLinkMeta(v) {
    return typeof v === "string" ? { url: v, title: null, description: null } : { url: v.url, title: v.title || null, description: v.description || null };
  }
  function labelClass(l) {
    l = (l || "").toLowerCase();
    if (l === "after") return "label-after";
    if (l === "before") return "label-before";
    return "label-detail";
  }
  function matchesFilter(item) {
    if (activeFilter === "all") return true;
    return item.category === activeFilter;
  }
  function bindGallery(el, items) {
    el.querySelectorAll("[data-idx]").forEach(function (node) {
      var i = +node.getAttribute("data-idx");
      function go() { openLightbox(items[i]); }
      node.addEventListener("click", go);
      node.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  }
  function renderGalleryGrid(items) {
    var grid = document.getElementById("gallery-grid");
    if (!grid) return;
    var visible = items.filter(matchesFilter);
    var countEl = document.getElementById("gallery-count");
    if (countEl) countEl.textContent = items.length + " documented images · " + visible.length + " in current view";
    if (!visible.length) {
      grid.innerHTML = '<p class="col-span-full text-center text-stone-muted text-sm py-14">No images in this category.</p>';
      return;
    }
    grid.innerHTML = items.map(function (item, i) {
      var hid = matchesFilter(item) ? "" : " is-hidden";
      var feat = i === 0 && activeFilter === "all" ? " is-featured" : "";
      var lbl = item.label ? '<span class="absolute top-2 left-2 z-10 px-2 py-0.5 text-[8px] tracking-luxury uppercase rounded-sm ' + labelClass(item.label) + '">' + item.label + '</span>' : "";
      var title = item.title ? '<div class="gallery-hover-caption"><p class="font-display text-sm text-gold-light font-semibold">' + esc(item.title) + '</p>' +
        (item.caption ? '<p class="text-stone-muted text-xs mt-1 leading-snug">' + esc(item.caption) + '</p>' : '') + '</div>' : "";
      var aspect = feat ? "" : " aspect-[4/5]";
      return '<figure class="gallery-card relative rounded-sm shadow-card' + hid + feat + aspect + '" data-idx="' + i + '" tabindex="0" role="button">' + lbl + title + crestSvg +
        '<img src="' + item.src + '" alt="' + esc(item.alt) + '" loading="lazy" class="w-full h-full object-cover" /></figure>';
    }).join("");
    bindGallery(grid, items);
  }
  function renderLinks(links) {
    var grid = document.getElementById("links-grid");
    if (!grid) return;
    var featured = ["quote", "book", "portfolio", "contact", "memoir"];
    var keys = Object.keys(links).filter(function (k) { return isSlugEntry(k, links[k]) && featured.indexOf(k) === -1; });
    var base = getBasePath();
    grid.innerHTML = keys.map(function (key) {
      var m = getLinkMeta(links[key]);
      return '<a href="' + base + key + '" class="link-card block px-5 py-4 rounded-sm group">' +
        '<div class="flex justify-between gap-4 items-center"><div class="min-w-0">' +
        '<p class="font-mono text-gold-light text-base group-hover:text-gold transition-colors">/' + key + '</p>' +
        (m.title ? '<p class="font-display text-stone-soft text-sm mt-1">' + esc(m.title) + '</p>' : '') +
        (m.description ? '<p class="text-stone-muted text-xs mt-1 leading-relaxed">' + esc(m.description) + '</p>' : '') +
        '</div><span class="text-gold/30 group-hover:text-gold shrink-0 text-lg transition-colors">→</span></div></a>';
    }).join("");
  }
  function openLightbox(item) {
    document.getElementById("lightbox-img").src = item.src;
    document.getElementById("lightbox-img").alt = item.alt;
    document.getElementById("lightbox-caption").textContent = (item.title ? item.title + " — " : "") + (item.caption || item.alt);
    var lb = document.getElementById("lightbox");
    lb.classList.remove("hidden"); lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    var lb = document.getElementById("lightbox");
    lb.classList.add("hidden"); lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  function setFilter(f) {
    activeFilter = f;
    document.querySelectorAll(".filter-btn").forEach(function (b) {
      var on = b.getAttribute("data-filter") === f;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    renderGalleryGrid(galleryItems);
  }

  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-visible"); }); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (e) { obs.observe(e); });
  }
  function initNavSpy() {
    if (!("IntersectionObserver" in window)) return;
    var links = document.querySelectorAll(".nav-link[data-section]");
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) links.forEach(function (l) {
          l.classList.toggle("is-active", l.getAttribute("data-section") === e.target.getAttribute("data-section"));
        });
      });
    }, { threshold: 0.15, rootMargin: "-12% 0px -55% 0px" });
    document.querySelectorAll("[data-section]").forEach(function (s) { obs.observe(s); });
  }

  function initSite(data) {
    siteData = data;
    injectSchema(data);
    renderTrustBar(data);
    renderMarmorax(data);
    renderPillars(data);
    renderWhyChoose(data);
    renderSliders(data);
    renderReviews(data);
    renderFaqs(data);
    renderGuarantees(data);
    applyCallLinks();
    applyQuoteLinks();
    initReveal();
  }

  function initQuoteForm() {
    var form = document.getElementById("quote-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var q = [];
      fd.forEach(function (v, k) { if (v) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(v)); });
      window.location.href = getBasePath() + "quote" + (q.length ? "?" + q.join("&") : "");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var base = getBasePath();
    var hostEl = document.getElementById("domain-host");
    if (hostEl) hostEl.textContent = window.location.hostname;

    document.querySelectorAll(".slug-link, .slug-footer").forEach(function (a) {
      var slug = a.getAttribute("data-slug") || a.getAttribute("href");
      if (slug && slug.indexOf("http") !== 0) a.href = base + slug.replace(/^\//, "");
    });

    var bar = document.querySelector(".domain-bar .slug");
    document.querySelectorAll(".slug-link").forEach(function (a) {
      a.addEventListener("mouseenter", function () {
        var slug = a.getAttribute("data-slug");
        if (bar && slug) bar.textContent = "/" + slug;
      });
    });

    document.getElementById("site-header").classList.toggle("is-scrolled", false);
    window.addEventListener("scroll", function () {
      document.getElementById("site-header").classList.toggle("is-scrolled", window.scrollY > 24);
    }, { passive: true });

    document.getElementById("menu-toggle").addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      this.setAttribute("aria-expanded", open);
      this.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    document.querySelectorAll(".nav-mobile-link").forEach(function (l) {
      l.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
    });
    document.querySelectorAll(".filter-btn").forEach(function (b) {
      b.addEventListener("click", function () { setFilter(b.getAttribute("data-filter")); });
    });
    document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
    document.getElementById("lightbox").addEventListener("click", function (e) { if (e.target === this) closeLightbox(); });
    var legendOpen = document.getElementById("legend-open");
    var legendClose = document.getElementById("legend-modal-close");
    var legendModal = document.getElementById("legend-modal");
    if (legendOpen) legendOpen.addEventListener("click", openLegendModal);
    if (legendClose) legendClose.addEventListener("click", closeLegendModal);
    if (legendModal) legendModal.addEventListener("click", function (e) { if (e.target === legendModal) closeLegendModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeLightbox(); closeLegendModal(); }
    });
    if (location.hash === "#gallery" || location.hash === "#sliders" || location.hash === "#warden" || location.hash === "#legend") {
      setTimeout(function () {
        var t = document.querySelector(location.hash);
        if (t) t.scrollIntoView({ behavior: "smooth" });
      }, 400);
    }

    initQuoteForm();
    initNavSpy();

    var sx = new XMLHttpRequest();
    sx.onload = function () {
      try { initSite(JSON.parse(sx.response)); } catch (err) { console.error(err); }
    };
    sx.open("GET", base + "site.json");
    sx.send();

    var lx = new XMLHttpRequest();
    lx.onload = function () { try { renderLinks(jsyaml.load(lx.response)); } catch (e) {} };
    lx.open("GET", base + "links.yml");
    lx.send();

    var gx = new XMLHttpRequest();
    gx.onload = function () {
      try { galleryItems = JSON.parse(gx.response); renderGalleryGrid(galleryItems); }
      catch (e) { var g = document.getElementById("gallery-grid"); if (g) g.innerHTML = '<p class="col-span-full text-center text-stone-muted text-sm py-14">Gallery unavailable</p>'; }
    };
    gx.open("GET", base + "gallery.json");
    gx.send();
  });
})();
