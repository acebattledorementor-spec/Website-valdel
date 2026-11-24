/* VDE site script – no dependencies. Progressive enhancement: every page works without it. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var cfg = {};
  try { cfg = JSON.parse(($('#site-config') || {}).textContent || '{}'); } catch (e) {}
  var page = document.body.getAttribute('data-page');

  /* ---------- analytics (loaded only after consent) ---------- */
  var queue = [];
  function track(name, props) {
    props = props || {};
    props.page = location.pathname;
    if (window.plausible) window.plausible(name, { props: props });
    else if (window.gtag) window.gtag('event', name, props);
    else queue.push([name, props]);
    if (cfg.preview && window.console) console.info('[track]', name, props);
  }
  window.vdeTrack = track;
  function loadAnalytics() {
    var a = cfg.analytics || {};
    if (!a.src && !a.domain) return; // provider not configured yet
    var s = document.createElement('script');
    s.defer = true;
    if (a.provider === 'ga4') {
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(a.domain);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', a.domain, { anonymize_ip: true });
    } else {
      s.src = a.src || 'https://plausible.io/js/script.tagged-events.js';
      s.setAttribute('data-domain', a.domain);
      window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    }
    document.head.appendChild(s);
    queue.splice(0).forEach(function (q) { track(q[0], q[1]); });
  }
  var consentBox = $('#consent');
  function consent() { try { return localStorage.getItem('vde_consent'); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem('vde_consent', v); } catch (e) {} consentBox.hidden = true; if (v === 'yes') loadAnalytics(); }
  if (consentBox) {
    if (!consent()) consentBox.hidden = false; else if (consent() === 'yes') loadAnalytics();
    $$('[data-consent]').forEach(function (b) { b.addEventListener('click', function () { setConsent(b.getAttribute('data-consent')); }); });
    $$('[data-consent-open]').forEach(function (b) { b.addEventListener('click', function () { consentBox.hidden = false; $('[data-consent=yes]', consentBox).focus(); }); });
  }

  /* ---------- clicks worth counting ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a,button');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var t = a.getAttribute('data-track');
    if (href.indexOf('mailto:') === 0) track('email_click', { to: href.slice(7).split('?')[0] });
    else if (href.indexOf('tel:') === 0) track('phone_click');
    else if (t === 'download_capability') track('download_capability');
    else if (t === 'download_datasheet') track('download_datasheet', { file: href });
    else if (t && t.indexOf('cta') === 0) track('cta_click', { cta: t, label: a.textContent.trim() });
  });

  /* ---------- header ---------- */
  var header = $('.site-header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var sheet = $('#menu-sheet'), opener = $('[data-menu-open]');
  function closeMenu() { sheet.hidden = true; opener.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; opener.focus(); }
  if (sheet && opener) {
    opener.addEventListener('click', function () { sheet.hidden = false; opener.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; $('nav a', sheet).focus(); });
    $('[data-menu-close]', sheet).addEventListener('click', closeMenu);
    sheet.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
      if (e.key === 'Tab') { // keep focus inside the sheet
        var f = $$('a,button', sheet), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- search ( / ) ---------- */
  var dlg = $('#search'), q = $('#q'), out = $('#search-results'), index = null, qTimer;
  function openSearch() {
    if (!dlg || dlg.open) return;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    q.value = ''; out.innerHTML = ''; q.focus();
    if (!index) fetch('/search-index.json').then(function (r) { return r.json(); }).then(function (j) { index = j; }).catch(function () { index = []; });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function runSearch() {
    var terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length || !index) { out.innerHTML = ''; return; }
    var hits = index.map(function (d) {
      var t = d.t.toLowerCase(), x = (d.x + ' ' + d.k).toLowerCase(), sc = 0;
      for (var i = 0; i < terms.length; i++) { if (t.indexOf(terms[i]) > -1) sc += 3; else if (x.indexOf(terms[i]) > -1) sc += 1; else return null; }
      return { d: d, sc: sc };
    }).filter(Boolean).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 12);
    out.innerHTML = hits.length ? hits.map(function (h) { return '<li><a href="' + h.d.u + '"><span class="type">' + esc(h.d.k) + '</span><strong>' + esc(h.d.t) + '</strong><span class="ex">' + esc(h.d.x.slice(0, 120)) + '</span></a></li>'; }).join('') : '<li class="search-empty">No results. Try “jacket”, “SACS” or “pre-bid”.</li>';
    clearTimeout(qTimer); qTimer = setTimeout(function () { track('search_query', { q: q.value.slice(0, 60), results: hits.length }); }, 900);
  }
  if (dlg) {
    $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', openSearch); });
    q.addEventListener('input', runSearch);
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var f = $('a', out); if (f) { e.preventDefault(); location.href = f.href; } } if (e.key === 'ArrowDown') { var a = $('a', out); if (a) { e.preventDefault(); a.focus(); } } });
    out.addEventListener('keydown', function (e) { var l = $$('a', out), i = l.indexOf(document.activeElement); if (e.key === 'ArrowDown' && l[i + 1]) { e.preventDefault(); l[i + 1].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); (l[i - 1] || q).focus(); } });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !/input|textarea|select/.test(tag) && !e.target.isContentEditable) { e.preventDefault(); openSearch(); }
  });

  /* ---------- project filters (shareable URL) ---------- */
  var filters = $('#filters');
  if (filters) {
    var cards = $$('[data-project]'), sels = $$('select', filters), params = new URLSearchParams(location.search);
    sels.forEach(function (s) { if (params.get(s.name)) s.value = params.get(s.name); });
    var apply = function (user) {
      var n = 0, p = new URLSearchParams();
      sels.forEach(function (s) { if (s.value) p.set(s.name, s.value); });
      cards.forEach(function (c) {
        var ok = sels.every(function (s) {
          if (!s.value) return true;
          var v = c.getAttribute('data-' + s.name) || '';
          var parts = s.name === 'software' ? v.split('|') : (s.name === 'asset' || s.name === 'service') ? v.split(' ') : [v];
          return parts.indexOf(s.value) > -1;
        });
        if (ok) { c.removeAttribute('data-hidden'); n++; } else c.setAttribute('data-hidden', '');
      });
      $('#filter-count').textContent = n + (n === 1 ? ' project' : ' projects');
      $('#no-results').hidden = n > 0;
      var qs = p.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
      if (user) track('filter_used', Object.fromEntries ? Object.fromEntries(p) : {});
    };
    sels.forEach(function (s) { s.addEventListener('change', function () { apply(true); }); });
    $('#filter-clear').addEventListener('click', function () { sels.forEach(function (s) { s.value = ''; }); apply(true); });
    apply(false);
  }

  /* ---------- capability matrix filter ---------- */
  var mx = $('#matrix');
  if (mx) {
    var fa = $('[data-matrix-filter=asset]'), fs = $('[data-matrix-filter=service]');
    var mxApply = function () {
      $$('tbody tr', mx).forEach(function (r) { r.classList.toggle('is-dim', !!fa.value && r.getAttribute('data-row') !== fa.value); });
      $$('[data-col]', mx).forEach(function (c) { c.classList.toggle('is-dim', !!fs.value && c.getAttribute('data-col') !== fs.value); });
      if (fa.value || fs.value) track('filter_used', { matrix: (fa.value || '*') + '×' + (fs.value || '*') });
    };
    fa.addEventListener('change', mxApply); fs.addEventListener('change', mxApply);
  }

  /* ---------- certificates: hide expired since the last build ---------- */
  var today = new Date().toISOString().slice(0, 10);
  $$('tr[data-expiry]').forEach(function (r) { var d = r.getAttribute('data-expiry'); if (d && d < today) r.remove(); });

  /* ---------- forms ---------- */
  var qp = new URLSearchParams(location.search);
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  $$('form[data-form]').forEach(function (form) {
    var type = form.getAttribute('data-form'), started = false;
    var pu = $('[name=page_url]', form); if (pu) pu.value = location.href.split('#')[0];
    // context from the link that brought the visitor here
    if (qp.get('asset') && $('[name=asset]', form)) $('[name=asset]', form).value = qp.get('asset');
    if (qp.get('service')) $$('[name=services]', form).forEach(function (c) { if (c.value === qp.get('service')) c.checked = true; });
    if (qp.get('from') && $('[name=context]', form)) $('[name=context]', form).value = 'case-study:' + qp.get('from');
    if ((qp.get('asset') || qp.get('service')) && $('details', form)) $('details', form).open = true;

    form.addEventListener('focusin', function () { if (!started) { started = true; if (type === 'tender' || type === 'prebid') track('tender_form_start', { form: type }); } });

    // apply form: personal-data consent before CV upload
    var consentBox = $('[name=consent]', form), cv = $('input[type=file]', form);
    if (type === 'job_apply' && consentBox && cv) { cv.disabled = !consentBox.checked; consentBox.addEventListener('change', function () { cv.disabled = !consentBox.checked; }); }

    $$('input[type=file]', form).forEach(function (f) {
      f.addEventListener('change', function () {
        var max = +f.getAttribute('data-max-mb') || 100, file = f.files[0];
        setErr(f, file && file.size > max * 1048576 ? 'This file is larger than ' + max + ' MB. Send a link to your document share instead.' : '');
        if (file) track('file_upload', { form: type, mb: Math.round(file.size / 1048576) });
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate(form);
      if (bad) { bad.focus(); return; }
      var btn = $('button[type=submit]', form), st = $('.form-status', form);
      btn.disabled = true; var label = btn.innerHTML; btn.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'The form service is not reachable.' }; }).then(function (j) { j.status = r.status; return j; }); })
        .then(function (j) {
          if (!j.ok) throw new Error(j.error || 'Something went wrong.');
          track(type === 'prebid' ? 'prebid_form_submit' : type === 'tender' ? 'tender_form_submit' : type === 'job_apply' ? 'job_apply' : type === 'prequal' ? 'prequal_request' : 'form_submit', { form: type });
          var nda = $('[name=nda]', form);
          location.href = '/contact/thanks/?type=' + encodeURIComponent(type) + (nda && nda.checked ? '&nda=1' : '');
        })
        .catch(function (err) {
          st.hidden = false; st.setAttribute('data-kind', 'error');
          st.textContent = (cfg.preview ? 'Preview build: the form back-end is not connected. ' : '') + err.message + ' You can also e-mail us directly.';
          btn.disabled = false; btn.innerHTML = label;
        });
    });
  });
  function setErr(el, msg) {
    var id = (el.id || '') + '-err', box = document.getElementById(id);
    if (box) box.textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }
  function validate(form) {
    var first = null;
    $$('input,textarea,select', form).forEach(function (el) {
      if (el.disabled || el.type === 'hidden' || el.closest('.hp')) return;
      var v = el.type === 'checkbox' ? el.checked : el.type === 'file' ? el.files.length : (el.value || '').trim(), msg = '';
      if (el.required && !v) msg = el.type === 'checkbox' ? 'Please confirm to continue.' : el.type === 'file' ? 'Please attach a file.' : 'Please fill in this field.';
      else if (el.type === 'email' && v && !EMAIL.test(v)) msg = 'Enter an e-mail address like name@company.com.';
      else if (el.type === 'url' && v && !/^https?:\/\//.test(v)) msg = 'Enter a full link starting with https://';
      else if (el.type === 'file' && el.files[0] && el.files[0].size > (+el.getAttribute('data-max-mb') || 100) * 1048576) msg = 'This file is too large.';
      if (el.type === 'checkbox' && el.name === 'consent') { var b = document.getElementById('apply-consent-err'); if (b) b.textContent = msg; }
      else setErr(el, msg);
      if (msg && !first) first = el;
    });
    return first;
  }

  /* ---------- thank-you page ---------- */
  if (page === 'thanks') {
    if (qp.get('nda')) $('[data-nda-note]').hidden = false;
    if (qp.get('type') === 'prequal') $('[data-thanks-msg]').textContent = 'Our business development team will e-mail you the prequalification pack.';
    if (qp.get('type') === 'job_apply') $('[data-thanks-msg]').textContent = 'HR has your application and will reply if there is a match.';
  }

  /* ---------- case study engagement ---------- */
  if (page === 'case-study') {
    track('case_study_view', { slug: location.pathname.split('/')[2] });
    var marks = { 50: false, 90: false };
    window.addEventListener('scroll', function () {
      var h = document.documentElement, pct = (h.scrollTop + window.innerHeight) / h.scrollHeight * 100;
      [50, 90].forEach(function (m) { if (!marks[m] && pct >= m) { marks[m] = true; track('scroll_' + m, { slug: location.pathname.split('/')[2] }); } });
    }, { passive: true });
  }

  /* ---------- subtle reveal (respects reduced motion via CSS) ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
})();
