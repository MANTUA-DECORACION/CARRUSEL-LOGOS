async function cargarCarruseles() {
  try {
    const respuesta = await fetch('manifest.json');
    const grupos = await respuesta.json();

    const page = document.getElementById('logosPage');
    page.innerHTML = '';

    if (!grupos || typeof grupos !== 'object') return;

    for (const [nombreGrupo, logos] of Object.entries(grupos)) {
      if (!Array.isArray(logos) || logos.length === 0) continue;

      const bloque = document.createElement('section');
      bloque.className = 'grupo-section';

      const titulo = document.createElement('h2');
      titulo.className = 'grupo-title';
      titulo.textContent = nombreGrupo;

      const viewport = document.createElement('div');
      viewport.className = 'logos-viewport';

      const marquee = document.createElement('div');
      marquee.className = 'logos-marquee';

      const crearGrupo = () => {
        const grupo = document.createElement('div');
        grupo.className = 'logos-group';

        logos.forEach((ruta) => {
          const item = document.createElement('div');
          item.className = 'logo-item';

          const img = document.createElement('img');
          img.src = ruta;
          img.alt = `Logo ${nombreGrupo}`;
          img.loading = 'eager';

          item.appendChild(img);
          grupo.appendChild(item);
        });

        return grupo;
      };

      const grupoBase = crearGrupo();
      marquee.appendChild(grupoBase);
      viewport.appendChild(marquee);
      bloque.appendChild(titulo);
      bloque.appendChild(viewport);
      page.appendChild(bloque);

      await esperarImagenes(grupoBase);

      let anchoGrupo = grupoBase.offsetWidth;
      const anchoViewport = window.innerWidth;

      while (anchoGrupo < anchoViewport * 1.5) {
        logos.forEach((ruta) => {
          const item = document.createElement('div');
          item.className = 'logo-item';

          const img = document.createElement('img');
          img.src = ruta;
          img.alt = `Logo ${nombreGrupo}`;
          img.loading = 'eager';

          item.appendChild(img);
          grupoBase.appendChild(item);
        });

        await esperarImagenes(grupoBase);
        anchoGrupo = grupoBase.offsetWidth;
      }

      const clon = grupoBase.cloneNode(true);
      marquee.appendChild(clon);

      marquee.style.setProperty('--group-width', `${grupoBase.offsetWidth}px`);

      const velocidad = 90;
      const duracion = grupoBase.offsetWidth / velocidad;
      marquee.style.setProperty('--duration', `${duracion}s`);
    }
  } catch (error) {
    console.error('Error al cargar carruseles:', error);
  }
}

function esperarImagenes(contenedor) {
  const imagenes = Array.from(contenedor.querySelectorAll('img'));

  return Promise.all(
    imagenes.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
}

window.addEventListener('load', cargarCarruseles);
window.addEventListener('resize', () => {
  clearTimeout(window.__logosResizeTimer);
  window.__logosResizeTimer = setTimeout(() => {
    cargarCarruseles();
  }, 200);
});
