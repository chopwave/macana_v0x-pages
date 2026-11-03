// Anonymous page analytics: sends the page or screen, the referring site, UTM tags and whether a member is
// logged in. No cookie, storage identifier, IP address or user agent string is kept.
// Screens and actions are sent as paths under the page: <page>/screen/<id> and <page>/event/<name>.
(function () {
  'use strict';
  window.macanaTrack = function () {};
  try {
    const params = new URLSearchParams(location.search);
    const tags = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
    // ?notrack=1 excludes this browser (the operator's own visits); ?notrack=0 includes it again.
    const noTrack = params.get('notrack');
    try {
      if (noTrack === '1') localStorage.setItem('macanaNoTrack', '1');
      if (noTrack === '0') localStorage.removeItem('macanaNoTrack');
    } catch (_) {}
    const cleanUrl = () => {
      if (noTrack === null && !tags.some(key => params.has(key))) return;
      // Drop the tags from the address bar so a shared link is not counted as coming from note.
      for (const key of [...tags, 'notrack']) params.delete(key);
      const clean = location.pathname + (params.toString() ? '?' + params : '') + location.hash;
      history.replaceState(history.state, '', clean);
    };
    let excluded = false;
    try { excluded = localStorage.getItem('macanaNoTrack') === '1'; } catch (_) {}
    const config = window.JPX_DASHBOARD_PUBLIC_CONFIG?.auth || {};
    if (excluded || !/^https:\/\//.test(config.url || '') || location.protocol !== 'https:'
        || navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) {
      cleanUrl();
      return;
    }
    const base = {};
    try {
      const referrer = new URL(document.referrer);
      if (referrer.hostname !== location.hostname) base.referrer_host = referrer.hostname;
    } catch (_) {}
    for (const key of tags) {
      const value = params.get(key);
      if (value) base[key] = value.slice(0, 100);
    }
    const page = location.pathname;
    const url = config.url.replace(/\/$/, '') + '/functions/v1/page-event';
    const send = (path) => {
      const event = {...base, path};
      try { event.member = !!sessionStorage.getItem('macanaMemberSessionV1'); } catch (_) {}
      const body = JSON.stringify(event);
      if (!(navigator.sendBeacon && navigator.sendBeacon(url, body))) {
        fetch(url, {method: 'POST', body, keepalive: true, mode: 'no-cors'}).catch(() => {});
      }
    };
    send(page);
    cleanUrl();
    window.macanaTrack = function (name) {
      if (/^[\w\-/]{1,80}$/.test(name)) send(page.replace(/\/$/, '') + '/' + name);
    };
    document.addEventListener('click', (e) => {
      const place = e.target.closest?.('a[data-plan-place]')?.dataset.planPlace;
      if (place) window.macanaTrack('event/plan_click/' + place);
      const action = e.target.closest?.('a[data-track-event]')?.dataset.trackEvent;
      if (action) window.macanaTrack(action);
    });
  } catch (_) {}
})();
