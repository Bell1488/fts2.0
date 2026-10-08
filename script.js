document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  const cnyInput = document.querySelector('#cny-input');
  const rubTotal = document.querySelector('#rub-total');
  const rateDisplay = document.querySelector('#rate-display');
  const cbrBadge = document.querySelector('#cbr-rate-badge');
  const directionButtons = document.querySelectorAll('[direction-btn]');
  const leadForm = document.querySelector('#lead-form');
  const leadStatus = document.querySelector('#lead-status');
  const phoneInput = document.querySelector('#phone-input');
  const directionInput = document.querySelector('#lead-direction');
  const cnyHidden = document.querySelector('#lead-cny');
  const consentInput = document.querySelector('#lead-consent');
  const fixRateBtn = document.querySelector('#fix-rate-btn');
  let cbrRate = 12.75;
  let activeDirection = document.querySelector('[direction-btn].active')?.dataset.direction || 'Инвойс фабрики';

  function calculate() {
    if (!cnyInput || !rubTotal) return;
    const cny = Math.max(0, Number(cnyInput.value) || 0);
    const margin = cny >= 100000 ? 1.025 : cny >= 50000 ? 1.03 : 1.035;
    const effectiveRate = cbrRate * margin;
    const total = Math.round(cny * effectiveRate);
    if (rateDisplay) rateDisplay.textContent = `~${effectiveRate.toFixed(2).replace('.', ',')} ₽ / CNY`;
    rubTotal.textContent = `${total.toLocaleString('ru-RU')} ₽`;
    if (cnyHidden) cnyHidden.value = String(cny);
    if (fixRateBtn) {
      const text = cny > 0
        ? `Здравствуйте! Хочу зафиксировать курс на ${cny.toLocaleString('ru-RU')} CNY (${activeDirection}). Расчёт: ~${total.toLocaleString('ru-RU')} ₽.`
        : 'Здравствуйте! Хочу рассчитать и зафиксировать курс на оплату в Китае.';
      fixRateBtn.href = `https://t.me/FTSPay_Support?text=${encodeURIComponent(text)}`;
    }
  }

  cnyInput?.addEventListener('input', calculate);
  fixRateBtn?.addEventListener('click', (event) => {
    if (Number(cnyInput?.value) >= 500) return;
    event.preventDefault();
    if (leadStatus) {
      leadStatus.textContent = 'Сначала укажите сумму в юанях для расчёта';
      leadStatus.className = 'form-status error';
    }
    cnyInput?.focus();
  });
  directionButtons.forEach((button) => button.addEventListener('click', () => {
    directionButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    activeDirection = button.dataset.direction || button.textContent.trim();
    if (directionInput) directionInput.value = activeDirection;
    calculate();
  }));

  leadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!phoneInput?.value.trim()) {
      leadStatus.textContent = 'Укажите номер телефона, чтобы мы могли связаться';
      leadStatus.className = 'form-status error';
      phoneInput?.focus();
      return;
    }
    if (consentInput && !consentInput.checked) {
      leadStatus.textContent = 'Подтвердите согласие на обработку данных';
      leadStatus.className = 'form-status error';
      consentInput.focus();
      return;
    }
    const button = leadForm.querySelector('button[type="submit"]');
    button.disabled = true;
    button.style.opacity = '.7';
    leadStatus.textContent = 'Отправляем заявку менеджеру…';
    leadStatus.className = 'form-status';
    try {
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phoneInput.value.trim(), cny: Number(cnyInput?.value) || 0, direction: activeDirection }) });
      if (!response.ok) throw new Error('lead request failed');
      window.trackMetrikaGoal?.('form_submit', { direction: activeDirection, cny: Number(cnyInput?.value) || 0 });
      leadStatus.textContent = 'Заявка отправлена. Менеджер свяжется с вами в Telegram.';
      leadStatus.className = 'form-status success';
      leadForm.reset();
      if (cnyHidden) cnyHidden.value = String(Number(cnyInput?.value) || 0);
    } catch (error) {
      leadStatus.textContent = 'Не удалось отправить автоматически. Напишите менеджеру в Telegram.';
      leadStatus.className = 'form-status error';
    } finally {
      button.disabled = false;
      button.style.opacity = '';
    }
  });

  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('#main-nav');
  menuToggle?.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  mainNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => mainNav.classList.remove('open')));

  async function loadCbrRate() {
    try {
      const response = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
      const data = await response.json();
      if (data?.Valute?.CNY?.Value) {
        cbrRate = data.Valute.CNY.Value;
        if (cbrBadge) cbrBadge.textContent = `ЦБ: ${cbrRate.toFixed(2).replace('.', ',')} ₽`;
        calculate();
      }
    } catch { /* базовый курс остаётся, если ЦБ временно недоступен */ }
  }
  calculate();
  loadCbrRate();
});

