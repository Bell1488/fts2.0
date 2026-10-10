(function (m, e, t, r, i, k, a) {
  m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
  m[i].l = 1 * new Date();
  for (var j = 0; j < document.scripts.length; j += 1) {
    if (document.scripts[j].src === r) return;
  }
  k = e.createElement(t);
  a = e.getElementsByTagName(t)[0];
  k.async = 1;
  k.src = r;
  a.parentNode.insertBefore(k, a);
})(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=113573294', 'ym');

ym(113573294, 'init', {
  ssr: true,
  webvisor: true,
  clickmap: true,
  ecommerce: 'dataLayer',
  referrer: document.referrer,
  url: location.href,
  accurateTrackBounce: true,
  trackLinks: true
});

window.trackMetrikaGoal = function (goal, params) {
  if (typeof window.ym === 'function') window.ym(113573294, 'reachGoal', goal, params);
};

document.addEventListener('click', function (event) {
  var link = event.target.closest('a[href*="t.me/FTSPay_Support"]');
  if (!link) return;

  window.trackMetrikaGoal('messenger_click', { href: link.href });

  var isTouchDevice = navigator.maxTouchPoints > 1;
  var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && isTouchDevice);
  if (!isMobile) return;

  event.preventDefault();
  var telegramUrl = 'tg://resolve?domain=FTSPay_Support';
  try {
    var message = new URL(link.href).searchParams.get('text');
    if (message) telegramUrl += '&text=' + encodeURIComponent(message);
  } catch (error) { /* Keep the direct manager link if the URL cannot be parsed. */ }

  var fallbackTimer = window.setTimeout(function () {
    if (document.visibilityState === 'visible') window.location.href = link.href;
  }, 1400);
  var cancelFallback = function () { window.clearTimeout(fallbackTimer); };
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') cancelFallback();
  }, { once: true });
  window.addEventListener('blur', cancelFallback, { once: true });
  window.addEventListener('pagehide', cancelFallback, { once: true });
  window.location.href = telegramUrl;
});
