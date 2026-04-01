async function cargarLogos() {
  try {
    const respuesta = await fetch('manifest.json');
    const logos = await respuesta.json();

    const track = document.getElementById('logosTrack');
    track.innerHTML = '';

    if (!logos.length) return;

    const crearGrupo = () => {
      const grupo = document.createElement('div');
      grupo.className = 'logos-group';

      logos.forEach((ruta) => {
        const item = document.createElement('div');
        item.className = 'logo-item';

        const img = document.createElement('img');
        img.src = ruta;
        img.alt = 'Logo empresa';

        item.appendChild(img);
        grupo.appendChild(item);
      });

      return grupo;
    };

    track.appendChild(crearGrupo());
    track.appendChild(crearGrupo());
  } catch (error) {
    console.error('Error al cargar logos:', error);
  }
}

cargarLogos();
