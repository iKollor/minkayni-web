# Intro Lottie

`src/assets/lottie/logo_intro.json` no es el export directo de Bodymovin: la composición de After Effects usa cosas que Lottie no soporta y este script las convierte.

| En After Effects | En el JSON final |
| --- | --- |
| Cámara 3D + capas 3D (lottie-web deja de renderizar) | Nulo 2D con el mismo paneo y zoom |
| Efecto «Gradación de degradado» | Relleno degradado real recortado con mate alfa |
| Efecto «Relleno» | Color directo en las formas |
| «n» con Desplazar trazados + dos Recortar trazados | Trazo central con un solo Recortar trazados |
| CC Bend It | Flexión horneada como keyframes de trazado (`bend.cjs`) |

El desenfoque de movimiento no existe en Lottie y se pierde.

## Volver a exportar

1. En After Effects: Bodymovin → exportar `data.json` (sin «Glyphs», sin expresiones).
2. Ejecutar:

```bash
node tools/lottie-intro/fix.cjs ruta/a/data.json
```

Sobrescribe `src/assets/lottie/logo_intro.json`. El script depende de los nombres de capa y comp actuales (`ISOTIPO`, `TEXTO`, `TAG`, `Nulo 2`, `Cámara 1`…); si se renombran en el proyecto hay que actualizarlos aquí.

La intensidad de la flexión (`DEG_PER_BEND`) y su sentido (`SIGN`) se ajustan al inicio de `bend.cjs`.
