(function () {
  "use strict";

  var siteData = null;
  var linksData = null;
  var galleryItems = [];
  var activeFilter = "all";
  var activeSlide = 0;

  function getLinkUrlFromMap(links, slug) {
    if (!links || !links[slug]) return null;
    var v = links[slug];
    return typeof v === "string" ? v : (v && v.url);
  }

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

  function phoneDigits() {
    if (!siteData || !siteData.business || !siteData.business.phone) return "";
    return siteData.business.phone.replace(/[^\d+]/g, "");
  }

  function callHref() {
    var digits = phoneDigits();
    if (digits) return "tel:" + digits;
    return getBasePath() + "quote";
  }

  function smsHref() {
    var digits = phoneDigits();
    return digits ? "sms:" + digits : null;
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
    var sms = smsHref();
    var smsEl = document.getElementById("footer-sms");
    if (smsEl) smsEl.classList.toggle("hidden", !sms);
    document.querySelectorAll("[data-action='sms']").forEach(function (el) {
      if (sms) el.href = sms;
    });
  }

  function renderFooterContact(data) {
    var el = document.getElementById("footer-direct-contact");
    if (!el || !data || !data.business) return;
    var b = data.business;
    var parts = [];
    if (b.phone && b.phoneDisplay) {
      parts.push('<a href="' + esc(callHref()) + '" class="hover:text-gold-light transition-colors">' + esc(b.phoneDisplay) + '</a>');
    } else if (b.phone) {
      parts.push('<a href="' + esc(callHref()) + '" class="hover:text-gold-light transition-colors">' + esc(b.phone) + '</a>');
    }
    if (smsHref()) {
      parts.push('<a href="' + esc(smsHref()) + '" class="hover:text-gold-light transition-colors">Text</a>');
    }
    if (b.email) {
      parts.push('<a href="mailto:' + esc(b.email) + '" class="hover:text-gold-light transition-colors">' + esc(b.email) + '</a>');
    }
    if (parts.length) {
      el.innerHTML = parts.join(' <span class="text-stone-dim">·</span> ');
      return;
    }
    var locality = b.address && b.address.addressLocality ? b.address.addressLocality + ", FL" : "SWFL";
    el.textContent = locality + " · Request callback via quote form";
  }

  function suggestedTemplateKey(lead) {
    var qual = scoreLead(lead);
    if (/price|cost|how much|ballpark|\$/i.test(lead.message || "")) return "priceShopper";
    if (qual.tier === "Hot") return "hotLead";
    if (qual.tier === "Warm") return "coldInquiry";
    return "coldInquiry";
  }

  function templateLabel(key) {
    var labels = {
      hotLead: "Hot Lead",
      coldInquiry: "Education First",
      priceShopper: "Price Shopper",
      siteVisitConfirmation: "Site Visit"
    };
    return labels[key] || key;
  }

  function isValidPhone(value) {
    return String(value || "").replace(/\D/g, "").length >= 10;
  }

  function formatLeadSummary(lead) {
    var root = canonicalSiteRoot();
    var qual = scoreLead(lead);
    return [
      "Master Sanctum Restoration — Gatekeeper Lead",
      "----------------------------------------",
      "Name: " + (lead.name || ""),
      lead.phone ? "Phone: " + lead.phone : "",
      lead.email ? "Email: " + lead.email : "",
      lead.message ? "Project: " + lead.message : "",
      "Qualification: " + qual.tier + " (" + qual.score + "%)",
      "Suggested template: " + suggestedTemplateKey(lead),
      "Source: " + root + "/#quote",
      "Submitted: " + (lead.ts ? new Date(lead.ts).toLocaleString() : "recent"),
      "",
      "Next: Site assessment + intake (" + root + "/intake)"
    ].filter(Boolean).join("\n");
  }

  function applyTemplateVars(text, vars) {
    return String(text || "").replace(/\{\{(\w+)\}\}/g, function (_, key) {
      return vars[key] != null && vars[key] !== "" ? vars[key] : "{{" + key + "}}";
    });
  }

  function leadTemplateVars(lead) {
    var b = (siteData && siteData.business) || {};
    var root = canonicalSiteRoot();
    var locality = b.address && b.address.addressLocality ? b.address.addressLocality : "SWFL";
    return {
      name: lead && lead.name ? lead.name.split(" ")[0] : "there",
      city: locality,
      stoneType: "your stone",
      primaryIssue: lead && lead.message ? lead.message.slice(0, 160) : "restoration needs",
      surface: "as described in your inquiry",
      location: locality + ", FL",
      timeline: "your stated timeline",
      goal: lead && lead.message ? lead.message : "restore and protect the surface",
      intakeUrl: root + "/intake",
      phone: b.phoneDisplay || b.phone || "(callback via quote form)",
      email: b.email || "(contact pending setup)",
      gatekeeperName: "Master-Sanctum-Gatekeeper",
      slot1: "a weekday morning",
      slot2: "a weekday afternoon",
      date: "TBD",
      time: "TBD",
      timezone: "ET",
      address: "On file after confirmation",
      assessor: "Master Sanctum conservation team"
    };
  }

  function copyToClipboard(text, onDone) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { onDone(true); }).catch(function () { onDone(false); });
      return;
    }
    onDone(false);
  }

  var LEAD_ARCHIVE_KEY = "msr-quote-archive";
  var LEAD_ARCHIVE_MAX = 20;
  var LEAD_ARCHIVE_TTL = 2592000000;
  var QUOTE_DRAFT_KEY = "msr-quote-draft";

  function getPendingLead() {
    var raw;
    try { raw = sessionStorage.getItem("msr-quote-pending"); } catch (e) { return null; }
    if (!raw) return null;
    var lead;
    try { lead = JSON.parse(raw); } catch (e) { return null; }
    if (!lead || !lead.name) return null;
    if (lead.ts && Date.now() - lead.ts > 86400000) {
      try { sessionStorage.removeItem("msr-quote-pending"); } catch (err) {}
      return null;
    }
    return lead;
  }

  function getLeadArchive() {
    try {
      var raw = localStorage.getItem(LEAD_ARCHIVE_KEY);
      if (!raw) return [];
      var list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      var now = Date.now();
      return list.filter(function (l) {
        return l && l.name && (!l.ts || now - l.ts < LEAD_ARCHIVE_TTL);
      });
    } catch (e) { return []; }
  }

  function saveLeadArchive(list) {
    try {
      localStorage.setItem(LEAD_ARCHIVE_KEY, JSON.stringify(list.slice(0, LEAD_ARCHIVE_MAX)));
    } catch (e) {}
  }

  function archiveLead(lead) {
    if (!lead || !lead.name) return;
    var list = getLeadArchive().filter(function (l) { return l.ts !== lead.ts; });
    list.unshift(lead);
    saveLeadArchive(list);
  }

  function removeFromArchive(ts) {
    saveLeadArchive(getLeadArchive().filter(function (l) { return l.ts !== ts; }));
  }

  function setPendingLead(lead) {
    try { sessionStorage.setItem("msr-quote-pending", JSON.stringify(lead)); } catch (e) {}
    updatePendingLeadBadge();
    renderPendingQuoteLead();
    renderLeadArchive();
  }

  function scoreLead(lead) {
    if (!lead) return { score: 0, tier: "Cold" };
    var score = 0;
    if (lead.name) score += 10;
    if (lead.phone) score += 25;
    if (lead.email) score += 15;
    if (lead.message) {
      if (lead.message.length > 30) score += 20;
      if (lead.message.length > 80) score += 10;
      if (/marble|granite|travertine|limestone|counter|vanity|etch|stain|north port|venice|swfl|sarasota|fort myers/i.test(lead.message)) score += 20;
    }
    score = Math.min(100, score);
    var tier = score >= 75 ? "Hot" : score >= 50 ? "Warm" : score >= 25 ? "Developing" : "Cold";
    return { score: score, tier: tier };
  }

  function updatePendingLeadBadge() {
    var lead = getPendingLead();
    var on = !!lead;
    ["nav-pending-badge", "nav-pending-badge-mobile"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle("hidden", !on);
    });
    var mobileQuote = document.querySelector(".mobile-bar [data-action='quote']");
    if (mobileQuote) {
      if (on) {
        mobileQuote.href = "#gatekeeper";
        mobileQuote.textContent = "Gatekeeper Queue";
        mobileQuote.setAttribute("aria-label", "Open Gatekeeper queue for " + (lead.name || "pending lead"));
      } else {
        mobileQuote.textContent = "Request Quote";
        mobileQuote.removeAttribute("aria-label");
        applyQuoteLinks();
      }
    }
  }

  function downloadLeadTxt(lead) {
    var blob = new Blob([formatLeadSummary(lead)], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "msr-lead-" + (lead.name || "inquiry").replace(/[^\w.-]+/g, "-").toLowerCase() + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadTextFile(text, filename, mime) {
    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function leadFilenameBase(lead) {
    return "msr-lead-" + (lead.name || "inquiry").replace(/[^\w.-]+/g, "-").toLowerCase();
  }

  function downloadLeadJson(lead) {
    downloadTextFile(JSON.stringify(lead, null, 2), leadFilenameBase(lead) + ".json", "application/json;charset=utf-8");
  }

  function clearQuoteDraft() {
    try { localStorage.removeItem(QUOTE_DRAFT_KEY); } catch (e) {}
  }

  function restoreQuoteDraft() {
    var params = new URLSearchParams(window.location.search);
    if (params.has("name") || params.has("phone") || params.has("email") || params.has("message")) return;
    var draft;
    try {
      var raw = localStorage.getItem(QUOTE_DRAFT_KEY);
      if (!raw) return;
      draft = JSON.parse(raw);
    } catch (e) { return; }
    if (!draft) return;
    var map = [["qf-name", "name"], ["qf-phone", "phone"], ["qf-email", "email"], ["qf-message", "message"]];
    var restored = false;
    map.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (!el || !draft[pair[1]]) return;
      if (!el.value) {
        el.value = draft[pair[1]];
        restored = true;
      }
    });
    if (!restored) return;
    var hint = document.getElementById("quote-draft-hint");
    if (!hint) {
      var form = document.getElementById("quote-form");
      if (!form) return;
      hint = document.createElement("p");
      hint.id = "quote-draft-hint";
      hint.className = "text-stone-muted text-xs mb-3 italic";
      form.insertBefore(hint, form.querySelector("h3").nextSibling);
    }
    hint.textContent = "Draft restored from your last session — edit and submit when ready.";
  }

  function bindQuoteDraftAutosave(form) {
    var fields = ["qf-name", "qf-phone", "qf-email", "qf-message"];
    var timer;
    function snapshot() {
      var draft = {};
      fields.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.name) draft[el.name] = el.value;
      });
      if (!draft.name && !draft.phone && !draft.email && !draft.message) {
        clearQuoteDraft();
        return;
      }
      try { localStorage.setItem(QUOTE_DRAFT_KEY, JSON.stringify(draft)); } catch (e) {}
    }
    fields.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(snapshot, 500);
      });
    });
  }

  var GK_TEMPLATE_KEYS = ["hotLead", "coldInquiry", "priceShopper", "siteVisitConfirmation"];

  function renderGatekeeperTemplates(templates) {
    var wrap = document.getElementById("gatekeeper-templates");
    var grid = document.getElementById("gatekeeper-templates-grid");
    if (!wrap || !grid || !templates) return;
    var pending = getPendingLead();
    var suggestedKey = pending ? suggestedTemplateKey(pending) : null;
    var cards = GK_TEMPLATE_KEYS.map(function (key) {
      var t = templates[key];
      if (!t || !t.body) return "";
      var sug = key === suggestedKey ? " is-suggested" : "";
      return '<article class="gk-template-card rounded-sm p-5 text-left' + sug + '" data-template-key="' + esc(key) + '">' +
        (key === suggestedKey ? '<p class="text-[9px] tracking-luxury uppercase text-gold/80 mb-2 font-medium">Suggested for current lead</p>' : '') +
        '<p class="text-[10px] tracking-luxury uppercase text-gold/65 mb-2 font-medium">' + esc(t.name || key) + '</p>' +
        '<p class="text-stone-muted text-xs mb-3 leading-snug"><span class="text-stone-dim">Subject:</span> ' + esc(t.subject || "") + '</p>' +
        '<div class="flex flex-wrap gap-2">' +
        '<button type="button" class="gk-tpl-copy-subject btn-legend min-h-[36px] px-4 text-xs text-stone-soft font-display tracking-wide">Copy Subject</button>' +
        '<button type="button" class="gk-tpl-copy-body btn-call min-h-[36px] px-4 text-xs text-gold-light font-display tracking-wide">Copy Body</button>' +
        '</div>' +
        '<p class="gk-tpl-status text-gold-light/80 text-xs mt-2 hidden" role="status"></p>' +
        '</article>';
    }).filter(Boolean);
    if (!cards.length) return;
    wrap.classList.remove("hidden");
    grid.innerHTML = cards.join("");
    grid.querySelectorAll(".gk-template-card").forEach(function (card) {
      var key = card.getAttribute("data-template-key");
      var t = templates[key];
      if (!t) return;
      var statusEl = card.querySelector(".gk-tpl-status");
      function showStatus(msg) {
        if (!statusEl) return;
        statusEl.classList.remove("hidden");
        statusEl.textContent = msg;
      }
      var subBtn = card.querySelector(".gk-tpl-copy-subject");
      var bodyBtn = card.querySelector(".gk-tpl-copy-body");
      if (subBtn) {
        subBtn.addEventListener("click", function () {
          var vars = pending ? leadTemplateVars(pending) : leadTemplateVars({});
          copyToClipboard(applyTemplateVars(t.subject, vars), function (ok) {
            showStatus(ok ? "Subject copied." : "Copy failed — select manually.");
          });
        });
      }
      if (bodyBtn) {
        bodyBtn.addEventListener("click", function () {
          var vars = pending ? leadTemplateVars(pending) : leadTemplateVars({});
          copyToClipboard(applyTemplateVars(t.body, vars), function (ok) {
            showStatus(ok ? "Body copied — paste into email or CRM." : "Copy failed — select manually.");
          });
        });
      }
    });
  }

  function renderGatekeeperExample(sim) {
    var wrap = document.getElementById("gatekeeper-example");
    var body = document.getElementById("gatekeeper-example-body");
    var title = document.getElementById("gatekeeper-example-title");
    if (!wrap || !body || !sim || !sim.conversation) return;
    if (title && sim._meta && sim._meta.scenario) title.textContent = sim._meta.scenario;
    body.innerHTML = sim.conversation.map(function (turn) {
      var who = turn.role === "customer" ? "Customer" : "Gatekeeper";
      var cls = turn.role === "customer" ? "text-stone-soft" : "text-gold-light/90";
      return '<div class="mb-4 pb-4 border-b border-gold/8 last:border-0 last:mb-0 last:pb-0">' +
        '<p class="text-[10px] tracking-luxury uppercase text-gold/50 mb-1.5 font-medium">' + esc(who) +
        (turn.channel ? ' · ' + esc(turn.channel) : '') + '</p>' +
        '<p class="' + cls + ' whitespace-pre-line leading-relaxed">' + esc(turn.text) + '</p></div>';
    }).join("");
    wrap.classList.remove("hidden");
  }

  function loadGatekeeperAssets() {
    if (window.__MSR_INLINE__ && window.__MSR_INLINE__.gatekeeperTemplates) {
      renderGatekeeperTemplates(window.__MSR_INLINE__.gatekeeperTemplates);
    } else {
      var base = getBasePath();
      var tx = new XMLHttpRequest();
      tx.onload = function () {
        try { renderGatekeeperTemplates(JSON.parse(tx.response)); } catch (e) {}
      };
      tx.open("GET", base + "gatekeeper/templates.json");
      tx.send();
    }
    if (window.__MSR_INLINE__ && window.__MSR_INLINE__.gatekeeperExample) {
      renderGatekeeperExample(window.__MSR_INLINE__.gatekeeperExample);
    } else {
      var base2 = getBasePath();
      var sx = new XMLHttpRequest();
      sx.onload = function () {
        try { renderGatekeeperExample(JSON.parse(sx.response)); } catch (e) {}
      };
      sx.open("GET", base2 + "gatekeeper/simulations/north-port-marble-counter.json");
      sx.send();
    }
  }
  function externalQuoteUrl() {
    var map = (window.__MSR_INLINE__ && window.__MSR_INLINE__.links) || linksData;
    var url = map ? getLinkUrlFromMap(map, "quote") : null;
    if (url) {
      if (url.charAt(0) === "#") return url;
      if (url.indexOf("http") === 0) return url;
      return getBasePath() + url.replace(/^\//, "");
    }
    return "#quote";
  }
  function applyQuoteLinks() {
    var href = externalQuoteUrl();
    document.querySelectorAll("[data-action='quote']").forEach(function (el) {
      el.href = href;
    });
  }
  function resolveSlugHref(slug) {
    var map = (window.__MSR_INLINE__ && window.__MSR_INLINE__.links) || linksData;
    if (map) {
      var url = getLinkUrlFromMap(map, slug);
      if (url) {
        if (url.charAt(0) === "#") return url;
        if (url.charAt(0) === "?") return getBasePath() + url;
        if (url.indexOf("http") !== 0) return getBasePath() + url.replace(/^\//, "");
        if (slug === "portfolio" && url.indexOf("#") !== -1) {
          var hash = url.split("#")[1];
          return hash ? "#" + hash : "#sliders";
        }
        return url;
      }
    }
    if (slug === "marmorax") return "#warden";
    if (slug === "gatekeeper") return "#gatekeeper";
    if (slug === "quote" || slug === "book" || slug === "contact") return slug === "book" ? "#gatekeeper" : "#quote";
    if (slug === "intake") return getBasePath() + "intake.html";
    return getBasePath() + slug.replace(/^\//, "");
  }

  function canonicalSiteRoot() {
    var base = getBasePath();
    var origin = window.location.origin.replace(/\/$/, "");
    if (base === "/") return origin;
    return origin + base.replace(/\/$/, "");
  }

  function normalizeBusinessUrls(data) {
    if (!data || !data.business) return data;
    var root = canonicalSiteRoot();
    var b = data.business;
    b.url = root;
    b.logo = root + "/assets/logo-msr.webp";
    b.image = root + "/assets/guardian-marble.webp";
    if (data.gatekeeper) data.gatekeeper.intakeUrl = root + "/intake";
    return data;
  }

  function syncSocialMeta(b) {
    var setMeta = function (sel, val) {
      var el = document.querySelector(sel);
      if (el && val) el.setAttribute("content", val);
    };
    setMeta('meta[property="og:url"]', b.url + "/");
    setMeta('meta[property="og:image"]', b.image);
    setMeta('meta[name="twitter:image"]', b.image);
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon && b.url) canon.setAttribute("href", b.url + "/");
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
    if (b.address && b.address.addressLocality) {
      ld["@graph"][0].geo = {
        "@type": "GeoCoordinates",
        latitude: 27.0442,
        longitude: -82.2359
      };
    }
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
    var florida = document.getElementById("warden-florida");
    if (florida && m.floridaHeritage) florida.textContent = m.floridaHeritage;
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

  function renderGatekeeper(data) {
    var gk = data.gatekeeper;
    if (!gk) return;
    var headline = document.getElementById("gatekeeper-headline");
    if (headline && gk.headline) headline.textContent = gk.headline;
    var sub = document.getElementById("gatekeeper-subheadline");
    if (sub && gk.subheadline) sub.textContent = gk.subheadline;
    var teaser = document.getElementById("gatekeeper-teaser");
    if (teaser && gk.teaser) teaser.textContent = gk.teaser;
    var steps = document.getElementById("gatekeeper-steps");
    if (steps && gk.steps) {
      steps.innerHTML = gk.steps.map(function (s, i) {
        return '<article class="reveal reveal-d' + (i + 1) + ' gatekeeper-step rounded-sm p-6 sm:p-7">' +
          '<p class="text-[10px] tracking-luxury uppercase text-gold/70 mb-2 font-medium">' + esc(s.numeral) + ' · ' + esc(s.title) + '</p>' +
          '<h3 class="font-display text-xl text-gold-light font-semibold mb-2">' + esc(s.title) + '</h3>' +
          '<p class="text-stone-soft text-sm leading-relaxed">' + esc(s.desc) + '</p></article>';
      }).join("");
    }
    var questions = document.getElementById("gatekeeper-questions");
    if (questions && gk.discoveryQuestions) {
      questions.innerHTML = gk.discoveryQuestions.map(function (q, i) {
        return '<li class="discovery-item flex gap-3 py-3 text-stone-soft">' +
          '<span class="text-gold/70 font-mono text-xs shrink-0 pt-0.5">' + String(i + 1).padStart(2, "0") + '</span>' +
          '<span>' + esc(q) + '</span></li>';
      }).join("");
    }
    var ctaIntake = document.getElementById("gatekeeper-cta-intake");
    if (ctaIntake && gk.ctaIntake) ctaIntake.textContent = gk.ctaIntake;
    var ctaQuote = document.getElementById("gatekeeper-cta-quote");
    if (ctaQuote && gk.ctaQuote) ctaQuote.textContent = gk.ctaQuote;
    var swflWrap = document.getElementById("gatekeeper-swfl");
    if (swflWrap && gk.swflCities && gk.swflCities.length) {
      swflWrap.classList.remove("hidden");
      var swflHead = document.getElementById("gatekeeper-swfl-headline");
      if (swflHead && gk.serviceAreaHeadline) swflHead.textContent = gk.serviceAreaHeadline;
      var swflCities = document.getElementById("gatekeeper-swfl-cities");
      if (swflCities) swflCities.textContent = gk.swflCities.join(" · ");
      var swflNote = document.getElementById("gatekeeper-swfl-note");
      if (swflNote && gk.serviceAreaNote) swflNote.textContent = gk.serviceAreaNote;
    }
    renderPendingQuoteLead();
    renderLeadArchive();
    loadGatekeeperAssets();
  }

  function renderLeadArchive() {
    var wrap = document.getElementById("gatekeeper-archive");
    if (!wrap) return;
    var list = getLeadArchive();
    var pending = getPendingLead();
    var visible = list.filter(function (l) { return !pending || l.ts !== pending.ts; });
    if (!visible.length) {
      wrap.classList.add("hidden");
      wrap.innerHTML = "";
      return;
    }
    wrap.classList.remove("hidden");
    wrap.innerHTML =
      '<details class="gatekeeper-panel rounded-sm p-5 sm:p-6 text-left">' +
      '<summary class="cursor-pointer list-none flex items-center justify-between gap-3">' +
      '<div><p class="text-[10px] tracking-luxury uppercase text-gold/65 mb-1 font-medium">Lead Archive</p>' +
      '<p class="font-display text-lg text-gold-light font-semibold">' + visible.length + ' saved lead' + (visible.length === 1 ? "" : "s") + '</p></div>' +
      '<span class="text-gold/50 text-xs shrink-0">▼</span></summary>' +
      '<div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gold/10">' +
      '<button type="button" id="gk-export-all" class="btn-call min-h-[36px] px-4 text-xs text-gold-light font-display tracking-wide">Export All (.txt)</button>' +
      '<button type="button" id="gk-export-all-json" class="btn-legend min-h-[36px] px-4 text-xs text-stone-soft font-display tracking-wide">Export All (.json)</button>' +
      '<button type="button" id="gk-clear-archive" class="btn-legend min-h-[36px] px-4 text-xs text-stone-soft font-display tracking-wide">Clear Archive</button>' +
      '</div>' +
      '<ul class="mt-4 space-y-3">' +
      visible.map(function (l) {
        var when = l.ts ? new Date(l.ts).toLocaleString() : "recent";
        return '<li class="border border-gold/12 rounded-sm p-4" data-archive-ts="' + l.ts + '">' +
          '<p class="font-display text-gold-light font-semibold">' + esc(l.name) + '</p>' +
          '<p class="text-stone-muted text-xs mt-1">' + esc(when) + (l.phone ? " · " + esc(l.phone) : "") + '</p>' +
          (l.message ? '<p class="text-stone-soft text-xs mt-2 leading-relaxed line-clamp-2">' + esc(l.message) + '</p>' : '') +
          '<div class="flex flex-wrap gap-2 mt-3">' +
          '<button type="button" class="gk-arch-restore btn-call min-h-[32px] px-3 text-xs text-gold-light font-display tracking-wide">Restore to Queue</button>' +
          '<button type="button" class="gk-arch-copy btn-legend min-h-[32px] px-3 text-xs text-stone-soft font-display tracking-wide">Copy</button>' +
          '<button type="button" class="gk-arch-remove btn-legend min-h-[32px] px-3 text-xs text-stone-soft font-display tracking-wide">Remove</button>' +
          '</div></li>';
      }).join("") +
      '</ul></details>';
    var exportAll = document.getElementById("gk-export-all");
    var exportAllJson = document.getElementById("gk-export-all-json");
    var clearAll = document.getElementById("gk-clear-archive");
    if (exportAll) {
      exportAll.addEventListener("click", function () {
        var all = getLeadArchive();
        if (!all.length) return;
        var body = all.map(formatLeadSummary).join("\n\n========================================\n\n");
        var stamp = new Date().toISOString().slice(0, 10);
        downloadTextFile(body, "msr-leads-export-" + stamp + ".txt");
      });
    }
    if (exportAllJson) {
      exportAllJson.addEventListener("click", function () {
        var all = getLeadArchive();
        if (!all.length) return;
        var stamp = new Date().toISOString().slice(0, 10);
        downloadTextFile(JSON.stringify(all, null, 2), "msr-leads-export-" + stamp + ".json", "application/json;charset=utf-8");
      });
    }
    if (clearAll) {
      clearAll.addEventListener("click", function () {
        if (!window.confirm("Clear all saved leads from this browser?")) return;
        saveLeadArchive([]);
        renderLeadArchive();
      });
    }
    wrap.querySelectorAll("[data-archive-ts]").forEach(function (row) {
      var ts = +row.getAttribute("data-archive-ts");
      var lead = visible.find(function (l) { return l.ts === ts; });
      if (!lead) return;
      var restore = row.querySelector(".gk-arch-restore");
      var copy = row.querySelector(".gk-arch-copy");
      var remove = row.querySelector(".gk-arch-remove");
      if (restore) {
        restore.addEventListener("click", function () {
          setPendingLead(lead);
          document.getElementById("gatekeeper").scrollIntoView({ behavior: "smooth" });
        });
      }
      if (copy) {
        copy.addEventListener("click", function () {
          copyToClipboard(formatLeadSummary(lead), function () {});
        });
      }
      if (remove) {
        remove.addEventListener("click", function () {
          removeFromArchive(ts);
          renderLeadArchive();
        });
      }
    });
  }

  function renderPendingQuoteLead() {
    var section = document.getElementById("gatekeeper");
    if (!section) return;
    var mount = document.getElementById("gatekeeper-pending");
    if (!mount) {
      mount = document.createElement("div");
      mount.id = "gatekeeper-pending";
      mount.className = "hidden reveal max-w-2xl mx-auto mb-8 px-0";
      var steps = document.getElementById("gatekeeper-steps");
      var inner = section.querySelector(".max-w-6xl");
      if (inner && steps) inner.insertBefore(mount, steps);
    }
    var lead = getPendingLead();
    updatePendingLeadBadge();
    if (!lead) {
      mount.classList.add("hidden");
      return;
    }
    mount.classList.remove("hidden");
    var summary = formatLeadSummary(lead);
    var qual = scoreLead(lead);
    mount.innerHTML =
      '<div class="gatekeeper-panel rounded-sm p-5 sm:p-6 text-left border border-gold/30">' +
      '<p class="text-[10px] tracking-luxury uppercase text-gold/70 mb-2 font-medium">Pending Lead — Gatekeeper Queue</p>' +
      '<p class="font-display text-xl text-gold-light font-semibold mb-1">' + esc(lead.name) + '</p>' +
      '<p class="text-stone-muted text-xs mb-2">Qualification: <span class="text-gold-light/90 font-medium">' + esc(qual.tier) + '</span> (' + qual.score + '%) · Suggested: <button type="button" id="gk-scroll-template" class="text-gold-light/80 hover:text-gold-light underline underline-offset-2">' + esc(suggestedTemplateKey(lead)) + '</button></p>' +
      '<ul class="text-stone-soft text-sm space-y-1">' +
      (lead.phone ? '<li>Phone: ' + esc(lead.phone) + '</li>' : '') +
      (lead.email ? '<li>Email: ' + esc(lead.email) + '</li>' : '') +
      (lead.message ? '<li class="pt-2 text-stone-muted leading-relaxed">' + esc(lead.message) + '</li>' : '') +
      '</ul>' +
      '<p class="text-stone-muted text-xs mt-4 italic">Export for follow-up, draft a hot-lead reply from templates below, or dismiss when handled.</p>' +
      '<div class="flex flex-wrap gap-2 mt-4">' +
      '<button type="button" id="gk-copy-lead" class="btn-call min-h-[40px] px-5 text-sm text-gold-light font-display tracking-wide">Copy Lead Summary</button>' +
      '<button type="button" id="gk-download-lead" class="btn-legend min-h-[40px] px-5 text-sm text-stone-soft font-display tracking-wide">Download .txt</button>' +
      '<button type="button" id="gk-download-json" class="btn-legend min-h-[40px] px-5 text-sm text-stone-soft font-display tracking-wide">Download .json</button>' +
      '<button type="button" id="gk-draft-suggested" class="btn-call min-h-[40px] px-5 text-sm text-gold-light font-display tracking-wide">Draft ' + esc(templateLabel(suggestedTemplateKey(lead))) + ' Reply</button>' +
      (navigator.share ? '<button type="button" id="gk-share-lead" class="btn-legend min-h-[40px] px-5 text-sm text-stone-soft font-display tracking-wide">Share</button>' : '') +
      '<button type="button" id="gk-dismiss-lead" class="btn-legend min-h-[40px] px-5 text-sm text-stone-soft font-display tracking-wide">Dismiss</button>' +
      '</div>' +
      '<p id="gk-copy-status" class="text-gold-light/80 text-xs mt-2 hidden" role="status"></p>' +
      '</div>';
    var copyBtn = document.getElementById("gk-copy-lead");
    var downloadBtn = document.getElementById("gk-download-lead");
    var downloadJsonBtn = document.getElementById("gk-download-json");
    var draftBtn = document.getElementById("gk-draft-suggested");
    var scrollTpl = document.getElementById("gk-scroll-template");
    var shareBtn = document.getElementById("gk-share-lead");
    var dismissBtn = document.getElementById("gk-dismiss-lead");
    var statusEl = document.getElementById("gk-copy-status");
    function showStatus(msg) {
      if (!statusEl) return;
      statusEl.classList.remove("hidden");
      statusEl.textContent = msg;
    }
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        copyToClipboard(summary, function (ok) {
          showStatus(ok ? "Lead summary copied — paste into email or CRM." : "Copy failed — select text manually.");
        });
      });
    }
    if (downloadBtn) {
      downloadBtn.addEventListener("click", function () {
        downloadLeadTxt(lead);
        showStatus("Lead summary downloaded.");
      });
    }
    if (downloadJsonBtn) {
      downloadJsonBtn.addEventListener("click", function () {
        downloadLeadJson(lead);
        showStatus("Lead JSON downloaded.");
      });
    }
    if (scrollTpl) {
      scrollTpl.addEventListener("click", function () {
        var tplWrap = document.getElementById("gatekeeper-templates");
        if (tplWrap) {
          tplWrap.classList.remove("hidden");
          tplWrap.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
    if (draftBtn) {
      draftBtn.addEventListener("click", function () {
        var templates = window.__MSR_INLINE__ && window.__MSR_INLINE__.gatekeeperTemplates;
        function draftFrom(tpl) {
          var key = suggestedTemplateKey(lead);
          var t = tpl && tpl[key];
          if (!t) {
            showStatus("Templates loading — try Copy Body below.");
            return;
          }
          var vars = leadTemplateVars(lead);
          var text = "Subject: " + applyTemplateVars(t.subject, vars) + "\n\n" + applyTemplateVars(t.body, vars);
          copyToClipboard(text, function (ok) {
            showStatus(ok ? templateLabel(key) + " reply copied — paste into your email client." : "Copy failed — use template below.");
          });
        }
        if (templates) {
          draftFrom(templates);
          return;
        }
        var base = getBasePath();
        var dx = new XMLHttpRequest();
        dx.onload = function () {
          try { draftFrom(JSON.parse(dx.response)); } catch (e) { showStatus("Could not load templates."); }
        };
        dx.open("GET", base + "gatekeeper/templates.json");
        dx.send();
      });
    }
    if (shareBtn && navigator.share) {
      shareBtn.addEventListener("click", function () {
        navigator.share({
          title: "MSR Lead — " + lead.name,
          text: summary
        }).then(function () {
          showStatus("Lead shared.");
        }).catch(function () {});
      });
    }
    if (dismissBtn) {
      dismissBtn.addEventListener("click", function () {
        try { sessionStorage.removeItem("msr-quote-pending"); } catch (err) {}
        mount.classList.add("hidden");
        updatePendingLeadBadge();
        renderLeadArchive();
      });
    }
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
    var featured = ["quote", "book", "portfolio", "contact", "memoir", "marmorax", "gatekeeper", "intake", "north-port", "swfl"];
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

  function renderDomainBanner() {
    if (window.__MSR_STANDALONE__) return;
    var mount = document.getElementById("domain-banner-mount");
    if (!mount) return;
    if (!window.location.hostname.endsWith("github.io")) {
      mount.classList.add("hidden");
      return;
    }
    try {
      if (sessionStorage.getItem("msr-domain-banner-dismiss")) {
        mount.classList.add("hidden");
        return;
      }
    } catch (e) {}
    mount.classList.remove("hidden");
    mount.innerHTML =
      '<span>Preview host · Custom domain <strong class="text-gold-light/90 font-medium">sanctum-shortener.is-a.dev</strong> pending is-a.dev approval — </span>' +
      '<button type="button" id="domain-banner-dismiss" class="text-gold-light/80 hover:text-gold-light underline underline-offset-2 ml-1">dismiss</button>';
    var btn = document.getElementById("domain-banner-dismiss");
    if (btn) {
      btn.addEventListener("click", function () {
        try { sessionStorage.setItem("msr-domain-banner-dismiss", "1"); } catch (err) {}
        mount.classList.add("hidden");
      });
    }
  }

  function initSite(data) {
    data = normalizeBusinessUrls(data);
    siteData = data;
    syncSocialMeta(data.business);
    injectSchema(data);
    renderDomainBanner();
    renderTrustBar(data);
    renderMarmorax(data);
    renderPillars(data);
    renderWhyChoose(data);
    renderSliders(data);
    renderReviews(data);
    renderFaqs(data);
    renderGuarantees(data);
    renderGatekeeper(data);
    applyCallLinks();
    applyQuoteLinks();
    renderFooterContact(data);
    initReveal();
  }

  function postQuoteWebhook(payload) {
    var url = siteData && siteData.integrations && siteData.integrations.quoteWebhook;
    if (!url || typeof fetch !== "function") return;
    var body = {
      source: "msr-quote-form",
      site: canonicalSiteRoot(),
      submittedAt: new Date(payload.ts || Date.now()).toISOString(),
      lead: payload
    };
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true
    }).catch(function () {});
  }

  function showQuoteConfirmation(form) {
    var el = document.getElementById("quote-confirm");
    if (!el) {
      el = document.createElement("div");
      el.id = "quote-confirm";
      el.className = "text-gold-light text-sm mt-4 leading-relaxed border border-gold/25 rounded-sm p-4 bg-marble-dark/40";
      form.appendChild(el);
    }
    var intake = getBasePath() + "intake.html";
    el.innerHTML = 'Thank you — your request is logged under <a href="#gatekeeper" class="text-gold-light underline underline-offset-2 hover:text-gold transition-colors">Gatekeeper protocol</a>. ' +
      'We\'ll follow up to schedule your site assessment. ' +
      '<a href="' + esc(intake) + '" class="text-gold-light underline underline-offset-2 hover:text-gold transition-colors">Download the intake questionnaire</a> when you\'re ready.';
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    form.reset();
    clearQuoteDraft();
    var hint = document.getElementById("quote-draft-hint");
    if (hint) hint.remove();
    prefillQuoteFormFromQuery(true);
  }

  function prefillQuoteFormFromQuery(reapplyOnly) {
    var params = new URLSearchParams(window.location.search);
    var fields = [
      ["qf-name", "name"],
      ["qf-phone", "phone"],
      ["qf-email", "email"],
      ["qf-message", "message"]
    ];
    var hasQuery = false;
    fields.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (!el || !params.has(pair[1])) return;
      el.value = params.get(pair[1]);
      hasQuery = true;
    });
    if (!reapplyOnly && hasQuery) {
      var quote = document.getElementById("quote");
      if (quote && !location.hash) quote.scrollIntoView({ behavior: "smooth" });
    }
  }

  function initQuoteForm() {
    var form = document.getElementById("quote-form");
    if (!form) return;
    prefillQuoteFormFromQuery(false);
    restoreQuoteDraft();
    bindQuoteDraftAutosave(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      if ((fd.get("website") || "").trim()) return;
      var phoneVal = fd.get("phone") || "";
      if (!isValidPhone(phoneVal)) {
        var phoneEl = document.getElementById("qf-phone");
        if (phoneEl) {
          phoneEl.focus();
          phoneEl.setCustomValidity("Enter a valid phone number (at least 10 digits).");
          phoneEl.reportValidity();
          phoneEl.setCustomValidity("");
        }
        return;
      }
      var payload = {
        name: fd.get("name") || "",
        phone: fd.get("phone") || "",
        email: fd.get("email") || "",
        message: fd.get("message") || "",
        ts: Date.now()
      };
      var dest = externalQuoteUrl();
      var b = siteData && siteData.business;

      if (b && b.email) {
        archiveLead(payload);
        postQuoteWebhook(payload);
        var subject = encodeURIComponent("MSR Quote Request — " + payload.name);
        var body = encodeURIComponent(
          "Name: " + payload.name + "\nPhone: " + payload.phone + "\nEmail: " + payload.email + "\n\nProject:\n" + payload.message
        );
        window.location.href = "mailto:" + b.email + "?subject=" + subject + "&body=" + body;
        return;
      }

      if (dest.charAt(0) === "#") {
        archiveLead(payload);
        postQuoteWebhook(payload);
        setPendingLead(payload);
        var target = document.querySelector(dest) || document.getElementById("gatekeeper");
        if (target) target.scrollIntoView({ behavior: "smooth" });
        showQuoteConfirmation(form);
        return;
      }

      var q = [];
      fd.forEach(function (v, k) { if (v) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(v)); });
      window.location.href = dest + (q.length ? (dest.indexOf("?") >= 0 ? "&" : "?") + q.join("&") : "");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var base = getBasePath();
    var hostEl = document.getElementById("domain-host");
    if (hostEl) hostEl.textContent = window.location.hostname;

    document.querySelectorAll(".slug-link, .slug-footer").forEach(function (a) {
      var slug = a.getAttribute("data-slug") || a.getAttribute("href");
      if (slug && slug.indexOf("http") !== 0) a.href = resolveSlugHref(slug.replace(/^\//, ""));
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
    if (location.hash === "#gallery" || location.hash === "#sliders" || location.hash === "#warden" || location.hash === "#legend" || location.hash === "#gatekeeper" || location.hash === "#quote") {
      setTimeout(function () {
        var t = document.querySelector(location.hash);
        if (t) t.scrollIntoView({ behavior: "smooth" });
      }, 400);
    }

    initQuoteForm();
    initNavSpy();
    updatePendingLeadBadge();
    renderLeadArchive();

    if (window.__MSR_INLINE__) {
      try {
        initSite(window.__MSR_INLINE__.site);
        galleryItems = window.__MSR_INLINE__.gallery || [];
        renderGalleryGrid(galleryItems);
        if (window.__MSR_INLINE__.links) {
          linksData = window.__MSR_INLINE__.links;
          renderLinks(window.__MSR_INLINE__.links);
          applyQuoteLinks();
        }
      } catch (err) { console.error(err); }
      return;
    }

    var sx = new XMLHttpRequest();
    sx.onload = function () {
      try { initSite(JSON.parse(sx.response)); } catch (err) { console.error(err); }
    };
    sx.open("GET", base + "site.json");
    sx.send();

    function loadLinks(data) {
      linksData = data;
      try {
        renderLinks(data);
        applyQuoteLinks();
        document.querySelectorAll(".slug-link, .slug-footer").forEach(function (a) {
          var slug = a.getAttribute("data-slug") || a.getAttribute("href");
          if (slug && slug.indexOf("http") !== 0 && slug.indexOf("#") !== 0) {
            a.href = resolveSlugHref(slug.replace(/^\//, ""));
          }
        });
      } catch (e) { console.error(e); }
    }
    var lx = new XMLHttpRequest();
    lx.onload = function () {
      try { loadLinks(jsyaml.load(lx.response)); }
      catch (e) {
        var jx = new XMLHttpRequest();
        jx.onload = function () { try { loadLinks(JSON.parse(jx.response)); } catch (err) {} };
        jx.open("GET", base + "links.json");
        jx.send();
      }
    };
    lx.onerror = function () {
      var jx = new XMLHttpRequest();
      jx.onload = function () { try { loadLinks(JSON.parse(jx.response)); } catch (err) {} };
      jx.open("GET", base + "links.json");
      jx.send();
    };
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