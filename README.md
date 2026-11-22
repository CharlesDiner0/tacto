# A 12 PASOS DE LA GLORIA — El remate está en tus manos

**T07 · Tacto · Diseño UDP · 2026**

Plataforma interactiva de imagen y sonido construida a partir de [Tacto](https://github.com/fefeliperoar/tacto), de Felipe Roa y Santiago Gaete. El teléfono funciona como control remoto MQTT: al deslizar un dedo se apunta un remate; al sostener el contacto se acumula potencia, y al soltar se dispara la pelota hacia el arco.

## 1. Concepto

**La gloria se decide en un solo gesto.** A 12 PASOS DE LA GLORIA explora la relación entre el gesto cotidiano de tocar una pantalla y el impulso físico de patear un balón. La persona moldea el remate con la mano: posición, duración del contacto e inclinación cambian dirección, elevación, potencia y curva. La imagen del arco recibe la trayectoria y el sonido acompaña la tensión, el golpe y el desenlace.

El título «12 pasos» es una expresión poética del recorrido hacia un instante decisivo, no una medida reglamentaria de la distancia del penal. La vista se sitúa detrás del jugador, frente al arco. La experiencia no busca ser un simulador futbolístico realista, sino una traducción sensorial entre tacto, imagen y sonido. Un disparo puede convertirse en gol, salir fuera o ser atajado. La dificultad busca premiar los tiros bien dirigidos a las esquinas sin regalar los remates centrales.

## 2. Funcionamiento

### Conexiones entre los datos y la experiencia

| Entrada del teléfono / gesto | Variable | Imagen | Sonido |
| --- | --- | --- | --- |
| `touch.x` / arrastrar horizontalmente | Dirección del tiro | Desplaza la mira y el punto de llegada | Paneo de fricción y patada |
| `touch.y` / arrastrar verticalmente | Elevación | Desplaza la mira hacia arriba o abajo | Modifica el contexto del disparo |
| `touch.down` / dedo apoyado | Carga temporal 0–100 % | Potenciómetro y guía de tiro | Pulso más frecuente y textura de carga |
| Transición `touch.down` de 1 a 0 / soltar | Disparar | El balón sigue la trayectoria | Golpe de patada |
| `ang.g` / inclinación lateral | Curvatura | Desvía la trayectoria y el punto de llegada | Espacialización vinculada a la dirección |
| Resultado calculado (gol, atajada o fuera) | Estado de juego | Anuncio y marcador | Red/público o caída sonora |

**Nota de accesibilidad técnica:** la presión `touch.f` no interviene en la potencia porque muchos teléfonos no la informan de forma útil. La carga depende del tiempo que el dedo permanece apoyado. La prueba sin teléfono utiliza el ratón sobre la cancha; la experiencia principal utiliza datos remotos MQTT.

### Banco de sonidos

Ocho archivos WAV **originales**, sintetizados para A 12 PASOS DE LA GLORIA mediante Python/NumPy y procesamiento de señales (osciladores, ruido filtrado, envolventes y modulación). No contienen fragmentos descargados de grabaciones ajenas ni material de transmisiones. **Autoría:** proyecto A 12 PASOS DE LA GLORIA. **Licencia:** CC0 1.0 para estos archivos originales del banco sonoro.

| Archivo `public/sonidos/` | Origen / tratamiento | Función |
| --- | --- | --- |
| `ambiente.wav` | Osciladores graves y ruido | Atmósfera del estadio |
| `pulso.wav` | Oscilador descendente y transiente | Carga del remate |
| `carga.wav` | Osciladores modulados | Tensión acumulada |
| `roce.wav` | Ruido filtrado y envolvente | Primer contacto / arrastre |
| `patada.wav` | Grave transiente y ruido filtrado | Impacto del balón |
| `red.wav` | Ruido granulado y decaimiento | Contacto con la red |
| `gol.wav` | Textura de ruido modulado en capas | Estallido celebratorio abstracto |
| `fallo.wav` | Grave descendente y ruido | Remate fallido / atajada |

Estos sonidos son **síntesis de diseño**, no grabaciones realistas de público o fútbol. La ambientación puede ampliarse con sonido de campo libre y documentado en otra versión.

### Conexión del teléfono mediante MQTT

1. Abrir la **experiencia en computador** desde `exp.html` en GitHub Pages y pulsar **Activar sonido**.
2. Escanear el QR de la tarjeta lateral con el teléfono (o abrir el vínculo de control desde el teléfono). El QR incorpora la **sala** y la dirección del **broker**.
3. En el teléfono, ingresar un nombre, tocar **Conectar** y permitir el sensor de **Giro** si se desea controlar la comba.
4. En la superficie del teléfono: **arrastrar para apuntar, mantener para cargar y soltar para patear**.
5. Las dos páginas se conectan por MQTT sobre WebSocket seguro. La versión publicada utiliza por defecto el broker de prueba de Tacto; `public/tacto.js` mantiene esa infraestructura original.

**Versión de prueba sin teléfono:** usar el ratón sobre la cancha, sostener el botón y soltar. Este modo permite evaluar física y audiovisualidad, pero **no sustituye la prueba MQTT**.

**Publicar en GitHub Pages:** en GitHub, `Settings → Pages → Source: GitHub Actions`. El workflow `.github/workflows/pages.yml` publica `public/`. En la web publicada: `exp.html` es el computador y `index.html` es el teléfono.

**Modo local:** ejecutar `npm install` una sola vez y `node server.js`. La versión local usa el broker incluido en Tacto y requiere aceptar el certificado HTTPS autofirmado.

**Limitaciones:** la latencia del broker público puede percibirse al soltar el dedo; la conexión depende del servicio público. Las salas evitan mezclar sesiones, pero el broker de prueba no cifra los contenidos por sala de manera privada frente a otros clientes con el código de sala. No enviar datos sensibles.

## 3. Reflexión y mejoras

La interacción muestra que el gesto de soltar es tan significativo como el contacto: sostiene la tensión y luego la interrumpe para convertirla en un acontecimiento audiovisual. El tiempo de contacto permite crear potencia sin requerir un sensor de presión. La posición y el giro permiten expresar intención, mientras que la posibilidad de fallar hace que el éxito no sea automático.

El modelo no reproduce la biomecánica real de una patada ni calcula aerodinámica futbolística exacta; utiliza una aproximación expresiva y legible. Tampoco reproduce el ambiente sonoro real de un estadio: usa síntesis original para evitar confundir una pieza audiovisual con una simulación deportiva.

**Mejora 1 — Retroalimentación háptica y latencia:** vibración breve en el teléfono en hitos del remate, cuando el navegador lo permita, y predicción audiovisual local para reducir la sensación de retraso MQTT.

**Mejora 2 — Defensa y dificultad configurables:** incorporar un portero con patrones de movimiento seleccionables, tiros con diferente curva y una dificultad explícita, para que los resultados se vinculen con más claridad al gesto.

### Procedencia

Proyecto basado en [Tacto, de Felipe Roa y Santiago Gaete](https://github.com/fefeliperoar/tacto). Se mantienen la biblioteca de conexión `public/tacto.js`, la página emisora del teléfono `public/index.html` y la publicación de GitHub Pages; se desarrollaron una experiencia visual, su lógica de juego, una identidad gráfica y un banco sonoro originales.


### Ajuste final de la experiencia (V4)

El nombre **A 12 pasos de la gloria** concentra el concepto en la espera previa a un disparo decisivo. Se conserva la dificultad de la V3, evaluada en pruebas con el teléfono, y se revisó la mezcla: golpes más definidos, ambiente menos invasivo, tonos agudos suavizados y carga sonora espaciada para evitar superposiciones. Los ocho WAV siguen siendo sonidos originales sintetizados. La comunicación MQTT, el QR y el control de audio permanecen sin cambios funcionales.

**Entrega:** publicar el repositorio y la experiencia en GitHub Pages. 
