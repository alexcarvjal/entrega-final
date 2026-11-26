# Mi viaje innovador, mi entrega final

Entrega final de Alex Carvajal: la aplicación a la beca de emprendimiento del Tec de Monterrey con Kaax, el robot acuático de DAY1Robotics.

Sitio: https://alexcarvjal.github.io/entrega-final/

## Estructura

```
index.html          La página (4 preguntas: proyecto, por qué, resultado, aprendizaje)
assets/styles.css   Estilos, en la misma familia visual que el sitio de DAY1Robotics
assets/kaax.js      Franja de agua con Kaax en pixel art que avanza con el scroll
assets/img/         Fotos (WebP) de Tech4Good, Cancún y las pruebas de Kaax
assets/video/       Video de la premiación de Tech4Good y de la prueba en presa
```

Kaax se dibuja en `assets/kaax.js` desde el arreglo `SPRITE` (una letra por pixel, colores en `PAL`).

## Ver en local

```bash
python -m http.server 8100
```

y abre http://localhost:8100.
