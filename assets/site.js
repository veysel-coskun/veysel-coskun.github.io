/* Site motion and interaction. Everything degrades to a complete static page without JavaScript. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Reveal on scroll */
  var items = $$('.reveal');
  if (calm || !('IntersectionObserver' in window)) { items.forEach(function (e) { e.classList.add('in'); }); }
  else {
    var ro = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); ro.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (e) { ro.observe(e); });
  }

  /* Count-up figures: the final value is in the HTML, so nothing is lost if this never runs */
  var nums = $$('[data-count]');
  if (!calm && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        co.unobserve(x.target);
        var el = x.target, end = +el.dataset.count, pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = null;
        (function tick(t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - k, 3);
          el.textContent = pre + Math.round(end * e) + suf;
          if (k < 1) requestAnimationFrame(tick);
        })(performance.now());
      });
    }, { threshold: 0.4 });
    nums.forEach(function (e) { co.observe(e); });
  }

  /* Rotating word in the headline */
  var rot = document.querySelector('[data-rotate]');
  if (rot && !calm) {
    var words = rot.dataset.rotate.split('|'), i = 0;
    setInterval(function () {
      rot.classList.add('out');
      setTimeout(function () { i = (i + 1) % words.length; rot.textContent = words[i]; rot.classList.remove('out'); }, 320);
    }, 2800);
  }

  /* Tabs: AI across the finance cycle */
  $$('[data-tabs]').forEach(function (box) {
    var btns = $$('[role=tab]', box), panels = $$('[role=tabpanel]', box);
    function pick(n) {
      btns.forEach(function (b, j) { b.setAttribute('aria-selected', j === n); b.tabIndex = j === n ? 0 : -1; });
      panels.forEach(function (p, j) { p.hidden = j !== n; });
    }
    btns.forEach(function (b, n) {
      b.addEventListener('click', function () { pick(n); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { var m = (n + d + btns.length) % btns.length; pick(m); btns[m].focus(); }
      });
    });
    pick(0);
  });

  /* Cockpit screenshot switcher */
  $$('[data-shots]').forEach(function (box) {
    var btns = $$('button', box), img = box.querySelector('img'), cap = box.querySelector('figcaption');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        img.src = b.dataset.src; img.alt = b.dataset.alt; cap.textContent = b.dataset.cap;
      });
    });
  });

  /* Blog category filter */
  var chips = $$('[data-filter]');
  if (chips.length) {
    var posts = $$('[data-cat]');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.dataset.filter;
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c); });
        posts.forEach(function (p) { p.hidden = !(f === 'All' || p.dataset.cat === f); });
      });
    });
  }

  /* Reading progress on articles */
  var bar = document.querySelector('.progress span');
  if (bar) {
    var upd = function () {
      var h = root.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* Podcast: only one episode plays at a time */
  var tracks = $$('audio');
  tracks.forEach(function (a) { a.addEventListener('play', function () { tracks.forEach(function (o) { if (o !== a) o.pause(); }); }); });

  /* Margin simulator: illustrative P&L, one lever at a time, so the steps add up exactly */
  var sim = document.getElementById('sim');
  if (sim) {
    var chart = document.getElementById('simChart'), say = document.getElementById('simSay'), base = { gs: 1000, al: 310, cg: 280, lg: 60 };
    var defaults = { price: 2, allow: 1, vol: -3, cost: 2 };
    var sl = {}; ['price', 'allow', 'vol', 'cost'].forEach(function (k) { sl[k] = document.getElementById('s-' + k); });
    var vm = function (x) { return x.gs - x.al - x.cg - x.lg; };
    var r1 = function (v) { return Math.round(v * 10) / 10; };
    var fmt = function (v) { return '$' + r1(v).toFixed(1) + 'M'; };
    var sg = function (v) { var r = r1(v); return (r > 0 ? '+' : r < 0 ? '−' : '') + '$' + Math.abs(r).toFixed(1) + 'M'; };
    var draw = function () {
      var p = +sl.price.value / 100, a = +sl.allow.value / 100, v = +sl.vol.value / 100, c = +sl.cost.value / 100;
      ['price', 'allow', 'vol', 'cost'].forEach(function (k) {
        var n = +sl[k].value; document.getElementById('o-' + k).textContent = (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n) + (k === 'allow' ? ' pts' : '%');
      });
      var x = { gs: base.gs, al: base.al, cg: base.cg, lg: base.lg }, v0 = vm(x);
      x.gs *= 1 + p; x.al *= 1 + p; var v1 = vm(x);
      x.al += a * x.gs; var v2 = vm(x);
      x.gs *= 1 + v; x.al *= 1 + v; x.cg *= 1 + v; x.lg *= 1 + v; var v3 = vm(x);
      x.cg *= 1 + c; var v4 = vm(x);
      /* labels are rounded to one decimal; the last step absorbs any rounding so the printed figures always add up */
      var d1 = r1(v1 - v0), d2 = r1(v2 - v1), d3 = r1(v3 - v2), d4 = r1(r1(v4) - r1(v0) - d1 - d2 - d3);
      var steps = [{ k: 'Base VM', v: v0, t: 1 }, { k: 'Price', v: d1 }, { k: 'Allowances', v: d2 }, { k: 'Volume', v: d3 }, { k: 'Product cost', v: d4 }, { k: 'New VM', v: v4, t: 1 }];
      var W = 720, H = 300, pT = 30, pB = 40, run = 0, bars = steps.map(function (s) {
        if (s.t) { run = s.v; return { s: s, a: 0, b: s.v }; }
        var o = { s: s, a: run, b: run + s.v }; run += s.v; return o;
      });
      var mx = Math.max.apply(null, bars.map(function (b) { return Math.max(b.a, b.b); })) * 1.04, y = function (q) { return pT + (mx - q) / mx * (H - pT - pB); }, st = W / bars.length, bw = Math.min(70, st - 34), g = '';
      g += '<line class="ax" x1="0" x2="' + W + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
      bars.forEach(function (b, i) {
        var cx = i * st + st / 2, t = Math.min(y(b.a), y(b.b)), h = Math.max(2, Math.abs(y(b.a) - y(b.b)));
        var cls = b.s.t ? 'tot' : b.s.v >= 0 ? 'up' : 'dn', lab = b.s.t ? fmt(b.s.v) : sg(b.s.v);
        if (i < bars.length - 1) g += '<line class="cn" x1="' + (cx + bw / 2) + '" x2="' + (cx + st - bw / 2) + '" y1="' + y(b.b) + '" y2="' + y(b.b) + '"/>';
        g += '<rect class="' + cls + '" x="' + (cx - bw / 2) + '" y="' + t + '" width="' + bw + '" height="' + h + '" rx="3"><title>' + b.s.k + ': ' + lab + '</title></rect>';
        g += '<text class="val" x="' + cx + '" y="' + (t - 8) + '">' + lab + '</text>';
        g += '<text class="cat" x="' + cx + '" y="' + (H - pB + 20) + '">' + b.s.k + '</text>';
      });
      chart.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Variable margin bridge from ' + fmt(v0) + ' to ' + fmt(v4) + '">' + g + '</svg>';
      var ns = x.gs - x.al, top = steps.slice(1, 5).sort(function (m, n) { return Math.abs(n.v) - Math.abs(m.v); })[0];
      var worst = steps.slice(1, 5).sort(function (m, n) { return m.v - n.v; })[0], tips = {
        Price: 'Check discount approvals and whether the price change will hold in the market.',
        Allowances: 'Review what each allowance buys, and tie trade terms to performance.',
        Volume: 'Test whether the volume loss is avoidable before reaching for more promotion.',
        'Product cost': 'Look at sourcing and mix, and how much of the increase price can recover.'
      };
      document.getElementById('simAct').textContent = Math.abs(v4 - v0) < 0.5 ? 'Move a lever to see a suggestion.'
        : worst.v < -0.5 ? tips[worst.k] : 'Pressure-test the assumptions, then agree owners for delivering them.';
      say.textContent = Math.abs(v4 - v0) < 0.5
        ? 'No change yet. Move a lever to see the effect on variable margin.'
        : 'Variable margin moves from ' + fmt(v0) + ' to ' + fmt(v4) + ' (' + (v0 / 690 * 100).toFixed(1) + '% to ' + (v4 / ns * 100).toFixed(1) + '% of net revenue). The biggest driver is ' + top.k.toLowerCase() + ' at ' + sg(top.v) + '.';
    };
    var pre = $$('.presets button', sim), mark = function (b) { pre.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); };
    Object.keys(sl).forEach(function (k) { sl[k].addEventListener('input', function () { mark(null); draw(); }); });
    pre.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.dataset.set.split(','); ['price', 'allow', 'vol', 'cost'].forEach(function (k, i) { sl[k].value = v[i]; });
        mark(b); draw();
      });
    });
    document.getElementById('simReset').addEventListener('click', function () { Object.keys(sl).forEach(function (k) { sl[k].value = 0; }); mark(null); draw(); });
    Object.keys(defaults).forEach(function (k) { sl[k].value = defaults[k]; });
    draw();
  }
})();
