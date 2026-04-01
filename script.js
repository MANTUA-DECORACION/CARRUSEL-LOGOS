const BASE_DIR = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function loadManifest() {
  const r = await fetch('manifest.json');
  return r.json();
}

function titleCase(text) {
  return text.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildEmbedUrl(grupo, config) {
  const q = new URLSearchParams({
    grupo,
    h: String(config.h),
    logo: String(config.logo),
    gap: String(config.gap),
    speed: String(config.speed),
    bg: config.bg.replace('#', '')
  });

  return `${BASE_DIR}embed.html?${q.toString()}`;
}

function buildIframeCode(url, h) {
  return `<iframe
  src="${url}"
  width="100%"
  height="${h}"
  frameborder="0"
  scrolling="no"
  style="display:block;width:100%;height:${h}px;border:0;margin:0;padding:0;overflow:hidden;background:transparent;">
</iframe>`;
}

async function renderPanel(manifest) {
  const app = document.getElementById('app');
  const groups = Object.entries(manifest).filter(([, logos]) => Array.isArray(logos) && logos.length);

  if (!groups.length) {
    app.innerHTML = `
      <section class="empty-state">
        <h2>No hay carruseles disponibles</h2>
        <p>Sube logos dentro de <span class="code">logos/TU_GRUPO/</span> y el sistema los detectará.</p>
      </section>
    `;
    return;
  }

  app.innerHTML = `
    <div class="panel-page">
      <div class="panel-header">
        <h1 class="panel-title">Panel de carruseles Mantua</h1>
        <p class="panel-subtitle">Cada grupo genera su preview, link e iframe listo para incrustar.</p>
      </div>
      <div class="cards-grid" id="cardsGrid"></div>
    </div>
  `;

  const grid = document.getElementById('cardsGrid');

  for (const [grupo, logos] of groups) {
    const defaults = { h: 72, logo: 40, gap: 14, speed: 90, bg: 'ffffff' };

    const card = document.createElement('article');
    card.className = 'carousel-card';
    card.innerHTML = `
      <div class="carousel-card-head">
        <h2 class="carousel-card-title">${titleCase(grupo)}</h2>
        <div class="carousel-card-count">${logos.length} logo(s)</div>
      </div>

      <div class="preview-shell">
        <iframe class="embed-frame" title="Preview ${grupo}" scrolling="no"></iframe>
      </div>

      <div class="controls-grid">
        <div class="control-box">
          <label>Alto carrusel</label>
          <input type="number" min="50" value="${defaults.h}" data-role="h">
        </div>
        <div class="control-box">
          <label>Logo máximo</label>
          <input type="number" min="20" value="${defaults.logo}" data-role="logo">
        </div>
        <div class="control-box">
          <label>Separación</label>
          <input type="number" min="4" value="${defaults.gap}" data-role="gap">
        </div>
        <div class="control-box">
          <label>Velocidad</label>
          <input type="number" min="20" value="${defaults.speed}" data-role="speed">
        </div>
      </div>

      <div class="output-label">Link</div>
      <div class="output-row">
        <input type="text" readonly data-role="link">
        <button class="copy-btn" data-copy="link">Copiar</button>
      </div>

      <div class="output-label">Iframe</div>
      <div class="output-row">
        <textarea readonly rows="4" data-role="iframe"></textarea>
        <button class="copy-btn" data-copy="iframe">Copiar</button>
      </div>

      <div class="actions-row">
        <button class="open-btn" data-open="preview">Abrir</button>
      </div>
    `;

    grid.appendChild(card);

    const preview = card.querySelector('.embed-frame');
    const inputH = card.querySelector('[data-role="h"]');
    const inputLogo = card.querySelector('[data-role="logo"]');
    const inputGap = card.querySelector('[data-role="gap"]');
    const inputSpeed = card.querySelector('[data-role="speed"]');
    const linkField = card.querySelector('[data-role="link"]');
    const iframeField = card.querySelector('[data-role="iframe"]');
    const copyButtons = card.querySelectorAll('.copy-btn');
    const openBtn = card.querySelector('[data-open="preview"]');

    const refresh = () => {
      const config = {
        h: num(inputH.value, defaults.h),
        logo: num(inputLogo.value, defaults.logo),
        gap: num(inputGap.value, defaults.gap),
        speed: num(inputSpeed.value, defaults.speed),
        bg: defaults.bg
      };

      const url = buildEmbedUrl(grupo, config);
      const iframe = buildIframeCode(url, config.h);

      preview.src = url;
      preview.height = config.h;
      preview.style.height = `${config.h}px`;

      linkField.value = url;
      iframeField.value = iframe;
      openBtn.onclick = () => window.open(url, '_blank');
    };

    [inputH, inputLogo, inputGap, inputSpeed].forEach(el => {
      el.addEventListener('input', refresh);
    });

    copyButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const type = btn.dataset.copy;
        const text = type === 'link' ? linkField.value : iframeField.value;

        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = 'Copiado';
          setTimeout(() => {
            btn.textContent = 'Copiar';
          }, 1000);
        } catch {
          btn.textContent = 'Error';
          setTimeout(() => {
            btn.textContent = 'Copiar';
          }, 1000);
        }
      });
    });

    refresh();
  }
}

async function init() {
  try {
    const manifest = await loadManifest();
    await renderPanel(manifest);
  } catch (error) {
    console.error(error);
  }
}

window.addEventListener('load', init);
