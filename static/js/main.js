(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var heroVideo = document.querySelector('.hero-bg');
  if (reduceMotion && heroVideo) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }

  // ---------- lazy, in-view autoplay for looping clips ----------
  function ensureSrc(v) {
    if (!v.getAttribute('src') && v.dataset.src) {
      v.src = v.dataset.src;
      v.load();
    }
  }
  function tryPlay(v) {
    if (reduceMotion && !v.dataset.userPlay) return;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  var loader = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { ensureSrc(e.target); loader.unobserve(e.target); }
    });
  }, { rootMargin: '600px 0px' });

  var player = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { ensureSrc(v); tryPlay(v); }
      else if (!v.paused) { v.pause(); }
    });
  }, { threshold: 0.25 });

  function watch(v) { loader.observe(v); player.observe(v); }
  document.querySelectorAll('video.lazy').forEach(watch);

  // ---------- generic two-way view switches (data-switch="<video id>") ----------
  function swapVideo(v, src, poster) {
    var t = v.currentTime || 0;
    var wasVisible = v.dataset.visible !== '0';
    v.poster = poster || '';
    v.src = src;
    v.dataset.src = src;
    v.load();
    v.addEventListener('loadedmetadata', function once() {
      v.removeEventListener('loadedmetadata', once);
      if (t && v.duration && t < v.duration) v.currentTime = t;
    });
    if (wasVisible) tryPlay(v);
  }

  document.querySelectorAll('[data-switch]').forEach(function (group) {
    var v = document.getElementById(group.dataset.switch);
    group.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-pressed') === 'true') return;
        group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        swapVideo(v, b.dataset.src, b.dataset.poster);
      });
    });
  });

  // ---------- terrain gallery ----------
  var TERRAINS = [
    { key: 'tilted_grid', name: 'Tilted grid' },
    { key: 'random_spread', name: 'Random boxes' },
    { key: 'discrete_obstacles', name: 'Discrete obstacles' },
    { key: 'random_rough', name: 'Random rough' },
    { key: 'pyramid_stair', name: 'Pyramid stairs' },
    { key: 'pyramid_stair_inv', name: 'Inverted pyramid stairs' },
    { key: 'random_stairs', name: 'Random stairs' },
    { key: 'stepping_stones', name: 'Stepping stones' },
    { key: 'hf_pyramid_slope', name: 'Pyramid slope' },
    { key: 'hf_pyramid_slope_inv', name: 'Inverted pyramid slope' }
  ];
  var tabs = document.getElementById('terrain-tabs');
  var tvs = [document.getElementById('terrain-video'), document.getElementById('terrain-video-rear')];
  if (tabs && tvs[0]) {
    var base = 'static/videos/terrain/';
    var views = ['side', 'rear34'];
    var panel = document.getElementById('terrain-panel');
    var setTerrain = function (key) {
      var t = TERRAINS.filter(function (x) { return x.key === key; })[0];
      if (panel) panel.setAttribute('aria-labelledby', 'terrain-tab-' + key);
      tabs.querySelectorAll('button').forEach(function (b) {
        var on = b.dataset.key === key;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      tvs.forEach(function (tv, k) {
        if (!tv) return;
        var stem = base + key + '_' + views[k];
        tv.poster = stem + '.jpg';
        tv.dataset.src = stem + '.mp4';
        tv.setAttribute('aria-label', t.name + (k ? ', rear view' : ', side view'));
        if (tv.getAttribute('src') || tv.dataset.visible === '1') { tv.src = stem + '.mp4'; tv.load(); tryPlay(tv); }
      });
    };
    TERRAINS.forEach(function (t, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.id = 'terrain-tab-' + t.key;
      b.setAttribute('aria-controls', 'terrain-panel');
      b.dataset.key = t.key;
      b.innerHTML = '<img alt="" loading="lazy" src="static/images/terrain/' + t.key + '.jpg"><span></span>';
      b.querySelector('span').textContent = t.name;
      b.addEventListener('click', function () { setTerrain(t.key); });
      b.addEventListener('keydown', function (ev) {
        var n = TERRAINS.length;
        var j = ev.key === 'ArrowRight' ? (i + 1) % n : ev.key === 'ArrowLeft' ? (i - 1 + n) % n
          : ev.key === 'Home' ? 0 : ev.key === 'End' ? n - 1 : -1;
        if (j < 0) return;
        ev.preventDefault();
        setTerrain(TERRAINS[j].key);
        tabs.querySelectorAll('button')[j].focus();
      });
      tabs.appendChild(b);
    });
    setTerrain(TERRAINS[0].key);
    tvs.forEach(function (tv) { if (tv) watch(tv); });
  }

  // ---------- method step-through (mirrors the slide deck) ----------
  var ms = document.getElementById('method-steps');
  if (ms) {
    var mBtns = ms.querySelectorAll('.method-tabs button');
    var mCur = 0, mTimer = null, mAuto = !reduceMotion;
    var showStep = function (n) {
      mCur = n;
      ms.classList.toggle('dimmed', n > 0);
      ms.querySelectorAll('[data-step]').forEach(function (el) {
        var on = Number(el.dataset.step) === n;
        if (el.tagName === 'BUTTON') el.setAttribute('aria-selected', String(on));
        else if (el.tagName === 'P') el.hidden = !on;
        else el.classList.toggle('on', on);
      });
    };
    var tick = function () { showStep((mCur + 1) % mBtns.length); };
    var start = function () { if (mAuto && !mTimer) mTimer = setInterval(tick, 3500); };
    var stop = function () { clearInterval(mTimer); mTimer = null; };
    mBtns.forEach(function (b) {
      b.addEventListener('click', function () { mAuto = false; stop(); showStep(Number(b.dataset.step)); });
    });
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); else stop(); }, { threshold: 0.4 }).observe(ms);
    showStep(0);
  }

  // track visibility for swapVideo()
  var vis = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.target.dataset.visible = e.isIntersecting ? '1' : '0'; });
  }, { threshold: 0.25 });
  document.querySelectorAll('video.lazy, #terrain-video, #terrain-video-rear').forEach(function (v) { vis.observe(v); });

  // ---------- lightbox ----------
  var lb = document.getElementById('lightbox');
  var lbVideo = lb.querySelector('video');
  var lbCap = lb.querySelector('.cap');
  var lbClose = lb.querySelector('.close');
  var lastFocus = null;
  var lbSource = null;
  function openLightbox(src, caption, time, source) {
    lastFocus = document.activeElement;
    lbSource = source || null;
    if (lbSource && !lbSource.paused) lbSource.pause();
    lbVideo.src = src;
    lbCap.textContent = caption || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbVideo.addEventListener('loadedmetadata', function once() {
      lbVideo.removeEventListener('loadedmetadata', once);
      if (time && time < lbVideo.duration) lbVideo.currentTime = time;
    });
    var p = lbVideo.play(); if (p && p.catch) p.catch(function () {});
    lbClose.focus();
  }
  function closeLightbox() {
    lbVideo.pause();
    lbVideo.removeAttribute('src');
    lbVideo.load();
    lb.classList.remove('open');
    document.body.style.overflow = '';
    if (lbSource && lbSource.dataset.visible !== '0') tryPlay(lbSource);
    lbSource = null;
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.clip.zoomable .media').forEach(function (m) {
    var v = m.querySelector('video');
    var cap = m.closest('figure').querySelector('figcaption');
    var capText = cap ? cap.textContent.replace(/\s+/g, ' ').trim() : '';
    m.setAttribute('role', 'button');
    m.setAttribute('tabindex', '0');
    m.setAttribute('aria-label', capText ? 'Enlarge video: ' + capText : 'Enlarge video');
    var open = function () {
      ensureSrc(v);
      openLightbox(v.currentSrc || v.src || v.dataset.src, capText, v.currentTime, v);
    };
    m.addEventListener('click', open);
    m.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  lbClose.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === 'Tab') {
      // keep focus on the close button and the player while the dialog is open
      var next = document.activeElement === lbClose ? lbVideo : lbClose;
      e.preventDefault();
      if (next === lbVideo) lbVideo.tabIndex = 0;
      next.focus();
    }
  });

  // ---------- navigation ----------
  var nav = document.getElementById('topnav');
  var hero = document.querySelector('.hero');
  new IntersectionObserver(function (entries) {
    nav.classList.toggle('visible', !entries[0].isIntersecting);
  }, { threshold: 0.08 }).observe(hero);

  var links = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  // highlight the section that crosses 40% of the viewport; at the very bottom, the last one
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > section[id]'));
  var current = null;
  var spyQueued = false;
  function updateSpy() {
    spyQueued = false;
    var line = window.innerHeight * 0.4;
    var doc = document.documentElement;
    var atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
    var sec = null;
    if (atBottom) {
      sec = sections[sections.length - 1];
    } else {
      sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) sec = s; });
    }
    var a = sec ? links[sec.id] || null : null;
    if (a === current) return;
    if (current) { current.classList.remove('active'); current.removeAttribute('aria-current'); }
    current = a;
    if (current) {
      current.classList.add('active');
      current.setAttribute('aria-current', 'true');
      // on narrow screens the link row scrolls sideways; keep the active link in view
      var ul = current.closest('ul');
      if (ul && ul.scrollWidth > ul.clientWidth) {
        ul.scrollTo({ left: current.offsetLeft - (ul.clientWidth - current.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
  }
  window.addEventListener('scroll', function () {
    if (!spyQueued) { spyQueued = true; requestAnimationFrame(updateSpy); }
  }, { passive: true });
  window.addEventListener('resize', updateSpy);
  updateSpy();

  // ---------- copy BibTeX ----------
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = document.getElementById(b.dataset.copy).textContent;
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
        ta.select(); try { document.execCommand('copy'); done(); } catch (err) {} ta.remove();
      }
    });
  });
})();
