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
    if (numeral === "I") return '<svg class="pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2...TRUNCATED_FOR_SIZE