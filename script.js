async function cargarLogos() {
  try {
    const respuesta = await fetch('manifest.json');
    const logos = await respuesta.json();

    const marquee = document.getElementById('logosMarquee');
    if (!marquee) return;

    marquee.innerHTML = '';

    if (!Array.isArray(logos) || logos.length === 0) return;

    const crearGrupo = () => {
      const grupo = document.createElement('div');
      grupo.className = 'logos-group';

      logos.forEach((ruta) => {
        const item = document.createElement('div');
        item.className = 'logo-item';

        const img = document.createElement('img');
        img.src = ruta;
        img.alt = 'Logo empresa';
        img.loading = 'eager';

        item.appendChild(img);
        grupo.appendChild(item);
      });

      return grupo;
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
        img.alt = 'Logo empresa';
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
    console.error('Error al cargar logos:', error);
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

window.addEventListener('load', cargarLogos);
window.addEventListener('resize', () => {
  clearTimeout(window.__logosResizeTimer);
  window.__logosResizeTimer = setTimeout(() => {
    cargarLogos();
  }, 200);
});
