/* Text-To-Image Balder – EMBED
   Placér denne fil som /embed/embed.js og link til den i theme.liquid.
   Kræver at du har sat window.TTIBalderConfig i theme.liquid før scriptet indlæses.
*/
(function () {
  // --- 1) Konfiguration (kunde kan overstyre via window.TTIBalderConfig) ---
  var cfg = Object.assign(
    {
      title: "Text-To-Image Balder",
      selector: "#ttibalder-root",
      productFormSelector: 'form[action="/cart/add"]',
      cartNoteLabel: "Kundedesign (Balder)",
      allowedPlacements: ["center", "left", "right"],
      defaultPlacement: "center",
      defaultScale: 80,
      language: "da",
      // URL til hostet iframe-app (kan overstyres af kunden)
      iframeSrc:
        "https://DIN-APP-DOMÆNE/embeds/ttibalder/iframe?title=Text-To-Image%20Balder&lang=da",
      // Mulighed for at overstyre sti til styles.css (ellers autodetekteres)
      stylesHref: null
    },
    (typeof window !== "undefined" && window.TTIBalderConfig) || {}
  );

  // --- 2) Hjælpere til sti-opløsning ---
  function getCurrentScript() {
    // Støtter også ældre browsere
    return document.currentScript || (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1] || null;
    })();
  }

  function resolveStylesHref() {
    if (cfg.stylesHref) return cfg.stylesHref;
    var s = getCurrentScript();
    if (!s || !s.src) return null;
    // erstat "embed.js" med "styles.css"
    try {
      var url = new URL(s.src, window.location.href);
      var parts = url.pathname.split("/");
      parts.pop(); // fjern "embed.js"
      parts.push("styles.css");
      url.pathname = parts.join("/");
      return url.toString();
    } catch (e) {
      return null;
    }
  }

  // --- 3) Find/byg container ---
  function ensureContainer() {
    var el = document.querySelector(cfg.selector);
    if (!el) {
      el = document.createElement("div");
      var id = cfg.selector.charAt(0) === "#" ? cfg.selector.slice(1) : "ttibalder-root";
      el.id = id;
      document.body.appendChild(el);
    }
    if (!el.classList.contains("ttibalder-host")) {
      el.classList.add("ttibalder-host");
    }
    return el;
  }

  // --- 4) Hent variant-id fra produktformular ---
  function getVariantId() {
    try {
      var form = document.querySelector(cfg.productFormSelector);
      if (!form) return null;

      var hidden = form.querySelector('input[name="id"]');
      if (hidden && hidden.value) return hidden.value;

      var select = form.querySelector('select[name="id"]');
      if (select && select.value) return select.value;
    } catch (_) {}
    return null;
  }

  // --- 5) Tilføj til kurv via Shopify AJAX API ---
  function addToCart(opts) {
    var variantId = opts.variantId;
    var properties = opts.properties || {};
    var payload = {
      items: [
        {
          id: variantId,
          quantity: 1,
          properties: properties
        }
      ]
    };
    return fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin"
    }).then(function (res) {
      if (!res.ok) return res.text().then(function (t) {
        throw new Error("Cart add failed: " + res.status + " " + t);
      });
      return res.json();
    });
  }

  // --- 6) Mount UI (overskrift + iframe) ---
  function mountIframe(container) {
    // Inject styles.css hvis vi kan finde den
    var href = resolveStylesHref();
    if (href) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }

    var wrapper = document.createElement("div");
    wrapper.className = "ttibalder-wrapper";

    var header = document.createElement("div");
    header.className = "ttibalder-header";
    header.textContent = cfg.title || "Text-To-Image Balder";
    wrapper.appendChild(header);

    var iframe = document.createElement("iframe");
    iframe.className = "ttibalder-iframe";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    iframe.src = cfg.iframeSrc;
    wrapper.appendChild(iframe);

    container.innerHTML = "";
    container.appendChild(wrapper);

    // Lyt efter besked fra iframen: { type: "TTI_BALDER_ADD_TO_CART", payload: {...} }
    window.addEventListener("message", function (event) {
      var data = event && event.data;
      if (!data || data.type !== "TTI_BALDER_ADD_TO_CART") return;

      try {
        var variantId = (data.payload && data.payload.variantId) || getVariantId();
        if (!variantId) throw new Error("Variant ikke valgt. Vælg størrelse/variant.");

        var imgUrl = (data.payload && data.payload.imageUrl) || "";
        var placement = (data.payload && data.payload.placement) || cfg.defaultPlacement;
        var scale = (data.payload && (data.payload.scale != null ? data.payload.scale : null));
        if (scale == null) scale = cfg.defaultScale;

        var base = cfg.cartNoteLabel || "Kundedesign (Balder)";
        var props = {};
        props[base + " – Billede URL"] = imgUrl;
        props[base + " – Placering"] = placement;
        props[base + " – Skalering (%)"] = String(scale);

        addToCart({ variantId: variantId, properties: props })
          .then(function () {
            window.location.href = "/cart";
          })
          .catch(function (err) {
            console.error(err);
            alert("Kunne ikke tilføje til kurven. Tjek at en variant er valgt, og prøv igen.");
          });
      } catch (err) {
        console.error(err);
        alert("Noget gik galt. Prøv igen.");
      }
    });
  }

  // --- 7) Init ---
  function init() {
    var container = ensureContainer();
    mountIframe(container);
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }

  // (valgfrit) Eksponer et globalt API til debugging
  window.TTIBalder = {
    _config: cfg,
    getVariantId: getVariantId,
    addToCart: addToCart
  };
})();
