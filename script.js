async function cargarCarrusel() {
  try {
    const params = new URLSearchParams(window.location.search);
    const grupo = params.get('grupo');

    const respuesta = await fetch('manifest.json');
    const manifest = await respuesta.json();

    const marquee = document.getElementById('logosMarquee');
    marquee.innerHTML = '';

    if (!grupo) return;
    if (!manifest[grupo] || !Array.isArray(manifest[grupo]) || manifest[grupo].length === 0) return;

    const logos = manifest[grupo];

    const crearGrupo = () => {
      const grupoNode = document.createElement('div');
      grupoNode.className = 'logos-group';

      logos.forEach((ruta) => {
        const item = document.createElement('div');
        item.className = 'logo-item';

        const img = document.createElement('img');
        img.src = ruta;
        img.alt = `Logo ${grupo}`;
        img.loading = 'eager';

        item.appendChild(img);
        grupoNode.appendChild(item);
      });

      return grupoNode;
    };

    const grupoBase = crearGrupo();
    marquee.appendChild(grupoBase);

    await esperarImagenes(grupoBase);

    let anchoGrupo = grupoBase.offsetWidth;
    const anchoViewport = window.innerWidth;

    while (anchoGrupo < anchoViewport * 1.5) {
      logos.forEach((ruta) => {
        const item = document.createElement('div');
        item.className = 'logo-item';

        const img = document.createElement('img');
        img.src = ruta;
        img.alt = `Logo ${grupo}`;
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
  } catch (error) {
    console.error('Error al cargar carrusel:', error);
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

window.addEventListener('load', cargarCarrusel);
window.addEventListener('resize', () => {
  clearTimeout(window.__logosResizeTimer);
  window.__logosResizeTimer = setTimeout(() => {
    cargarCarrusel();
  }, 200);
});
