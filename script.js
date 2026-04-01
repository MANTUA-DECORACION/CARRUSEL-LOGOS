const BASE_URL = `${window.location.origin}${window.location.pathname}`;

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    grupo: p.get('grupo'),
    mode: p.get('mode') || 'panel',
    h: num(p.get('h'), 72),
    logo: num(p.get('logo'), 42),
    gap: num(p.get('gap'), 14),
    speed: num(p.get('speed'), 90),
    bg: p.get('bg') || 'ffffff',
  };
}

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function loadManifest() {
  const r = await fetch('manifest.json');
  return r.json();
}

function normalizeBg(bg) {
  return bg.startsWith('#') ? bg : `#${bg}`;
}

function titleCase(text) {
  return text.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function waitImages(container) {
  const images = Array.from(container.querySelectorAll('img'));
  return Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
}

function applyEmbedHeight(height) {
  const h = `${height}px`;

  document.documentElement.style.setProperty('--embed-h', h);
  document.body.style.setProperty('--embed-h', h);

  document.documentElement.classList.add('embed-mode');
  document.body.classList.add('embed-mode');

  document.documentElement.style.height = h;
  document.documentElement.style.minHeight = h;
  document.documentElement.style.maxHeight = h;
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';

  document.body.style.height = h;
  document.body.style.minHeight = h;
  document.body.style.maxHeight = h;
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
}

async function buildMarquee(target, logos, config, grupo) {
  target.innerHTML = '';

  applyEmbedHeight(config.h);

  const section = document.createElement('section');
  section.className = 'logos-section';
  section.style.setProperty('--embed-bg', normalizeBg(config.bg));
  section.style.setProperty('--embed-h', `${config.h}px`);

  const viewport = document.createElement('div');
  viewport.className = 'logos-viewport';

  const marquee = document.createElement('div');
  marquee.className = 'logos-marquee';

  const cellWidth = Math.max(110, Math.round(config.logo * 2.1));

  marquee.style.setProperty('--logo-max', `${config.logo}px`);
  marquee.style.setProperty('--gap', `${config.gap}px`);
  marquee.style.setProperty('--cell-width', `${cellWidth}px`);

  const createGroup = () => {
    const group = document.createElement('div');
    group.className = 'logos-group';

    logos.forEach(ruta => {
      const item = document.createElement('div');
      item.className = 'logo-item';

      const img = document.createElement('img');
      img.src = ruta;
      img.alt = `Logo ${grupo}`;
      img.loading = 'eager';
      img.decoding = 'async';

      item.appendChild(img);
      group.appendChild(item);
    });

    return group;
  };

  const baseGroup = createGroup();
  marquee.appendChild(baseGroup);
  viewport.appendChild(marquee);
  section.appendChild(viewport);
  target.appendChild(section);

  await waitImages(baseGroup);

  let width = baseGroup.offsetWidth;
  const viewportWidth = Math.max(window.innerWidth, target.clientWidth || 0);

  while (width < viewportWidth * 1.5) {
    logos.forEach(ruta => {
      const item = document.createElement('div');
      item.className = 'logo-item';

      const img = document.createElement('img');
      img.src = ruta;
      img.alt = `Logo ${grupo}`;
      img.loading = 'eager';
      img.decoding = 'async';

      item.appendChild(img);
      baseGroup.appendChild(item);
    });

    await waitImages(baseGroup);
    width = baseGroup.offsetWidth;
  }

  const clone = baseGroup.cloneNode(true);
  marquee.appendChild(clone);

  const groupWidth = baseGroup.offsetWidth;
  marquee.style.setProperty('--group-width', `${groupWidth}px`);
  marquee.style.setProperty('--duration', `${groupWidth / config.speed}s`);
}

function buildEmbedUrl(grupo, config) {
  const q = new URLSearchParams({
    mode: 'embed',
    grupo,
    h: String(config.h),
    logo: String(config.logo),
    gap: String(config.gap),
    speed: String(config.speed),
    bg: config.bg.replace('#', ''),
  });

  return `${BASE_URL}?${q.toString()}`;
}

function buildIframeCode(url, h) {
  return `<div style="width:100%;height:${h}px;max-height:${h}px;overflow:hidden;position:relative;margin:0;padding:0;line-height:0;">
  <iframe
    src="${url}"
    width="100%"
    height="${h}"
    frameborder="0"
    scrolling="no"
    allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:${h}px;max-height:${h}px;border:0;margin:0;padding:0;overflow:hidden;display:block;line-height:0;background:transparent;">
  </iframe>
</div>`;
}

async function renderPanel(manifest) {
  const app = document.getElementById('app');
  app.className = '';
  document.documentElement.classList.remove('embed-mode');
  document.body.className = '';

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
    const defaults = { h: 72, logo: 42, gap: 14, speed: 90, bg: 'ffffff' };

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
        bg: defaults.bg,
      };

      const url = buildEmbedUrl(grupo, config);
      const iframe = buildIframeCode(url, config.h);

      preview.src = url;
      preview.height = config.h;
      preview.style.height = `${config.h}px`;
      preview.style.maxHeight = `${config.h}px`;
      preview.style.overflow = 'hidden';
      preview.style.display = 'block';

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

async function renderEmbed(manifest, params) {
  const app = document.getElementById('app');
  document.documentElement.classList.add('embed-mode');
  document.body.className = 'embed-mode';
  app.className = 'embed-page';

  if (!params.grupo || !manifest[params.grupo] || !manifest[params.grupo].length) {
    app.innerHTML = '';
    return;
  }

  await buildMarquee(app, manifest[params.grupo], params, params.grupo);
}

async function init() {
  try {
    const manifest = await loadManifest();
    const params = getParams();

    if (params.mode === 'embed' && params.grupo) {
      await renderEmbed(manifest, params);
    } else {
      await renderPanel(manifest);
    }
  } catch (error) {
    console.error(error);
  }
}

window.addEventListener('load', init);

window.addEventListener('resize', () => {
  const params = getParams();

  if (params.mode === 'embed' && params.grupo) {
    clearTimeout(window.__mantuaResize);
    window.__mantuaResize = setTimeout(init, 220);
  }
});
