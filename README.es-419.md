# Mehrdadika · Atlas visual de inglés

[Abrir la edición en español](https://mehrdadxzaker.github.io/mehrdadika/#/es-419) · [English](README.md) · [فارسی](README.fa.md) · [Português](README.pt-BR.md) · [Código en GitHub](https://github.com/mehrdadxzaker/mehrdadika)

Un proyecto de código abierto para aprender inglés con imágenes, ejemplos y práctica, adaptado de [Word Atlas](https://github.com/designfuchen/word-atlas). La primera edición se creó para hablantes de persa. Esta primera versión en español latinoamericano (`es-419`) comparte las mismas funciones principales y conserva el inglés como idioma de estudio.

## Qué incluye

- 91 palabras, 92 sentidos, 184 ejemplos, 273 combinaciones frecuentes y 91 notas de uso traducidos al español.
- 32 categorías y 348 subcategorías, incluidas cocina, medicina e ingeniería, con contenido que se publica poco a poco.
- Configuración inicial, metas diarias, recuerdo activo y repaso espaciado con FSRS.
- Atlas ilustrado con búsqueda, filtros, palabras guardadas y una galaxia de progreso.
- Tres lecturas breves y un libro original de tres capítulos, con traducciones, comprensión, marcadores y continuación de la lectura.
- Práctica de escritura, copia de oraciones, dictado, paráfrasis y palabras que suelen confundirse.
- Preferencias y copias de seguridad del progreso local.

El contenido y las traducciones son una **vista previa editorial con ayuda de IA**. Aún requieren revisión humana independiente y, en los temas especializados, revisión por profesionales del área. Las etiquetas completas no significan que todas las categorías tengan cursos completos. El vocabulario profesional puede necesitar variantes regionales.

El progreso, las sesiones, las palabras guardadas y los datos de lectura se mantienen separados por edición. Las 16 palabras nuevas tienen ilustraciones originales; cuando falta una grabación licenciada, la pronunciación usa la voz inglesa disponible en el dispositivo. La narración de textos y libros también depende del dispositivo.

## Ejecutar y contribuir

Usa Node.js 22 o posterior:

```sh
npm ci
npm run dev
```

Abre la dirección local que aparece en la terminal y elige **Español**. Mantén un solo servidor local activo. No necesitas una clave de API, una cuenta de IA ni un servidor de base de datos.

```sh
npm test
npm run check:content
npm run build
```

Consulta la [localización del vocabulario](docs/portuguese-content.md), las [lecturas y prácticas](docs/localized-reading-content.md), el [plan de idiomas](docs/localization-roadmap.md) y la [guía de contribución](CONTRIBUTING.md). Las correcciones y la revisión de traducciones son bienvenidas; no atribuyas aprobación humana a contenido que aún no se ha revisado.

## Licencias y créditos

El código usa la [licencia MIT](LICENSE). El contenido sigue las condiciones de [CONTENT_LICENSE.md](CONTENT_LICENSE.md), incluida la atribución CC BY 4.0 cuando corresponda. Vocabulario, imágenes y grabaciones adaptados: **Word Atlas contributors — CC BY 4.0**. Traducciones y notas nuevas: **Mehrdadika contributors**. Las fuentes y dependencias mantienen sus propias licencias, descritas en los [avisos de terceros](THIRD_PARTY_NOTICES.md).

## Ciencias en inglés

En **Biblioteca → Cursos**, explora **Water and Weather**: ocho lecciones ilustradas para practicar inglés describiendo observaciones, comparando y explicando causas. El curso ofrece ayuda en español latinoamericano, 32 actividades y ocho propuestas de escritura con ejemplos y autoevaluación. Las 19 palabras nuevas de ciencias usan la revisión de vocabulario existente; completar una lección no modifica el dominio de las palabras. El progreso queda en este dispositivo y se incluye en las copias de seguridad y en el paquete de producción sin conexión. El contenido es una vista previa editorial con apoyo de IA y aún espera revisión independiente. [Guía del curso](docs/science-course.md).
