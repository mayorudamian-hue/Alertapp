# EmergenciaApp

Aplicación PWA de preparación familiar para emergencias y desastres.  
Funciona **100% offline** una vez instalada. Compatible con Android, iOS y navegadores de escritorio.

---

## Estructura del proyecto

```
EmergenciaApp/
├── index.html              # Entrada principal — router y layout
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker — cache offline
├── assets/
│   ├── styles.css          # Estilos globales y design tokens
│   ├── icons/              # icon-192.png, icon-512.png
│   ├── images/             # Diagramas de primeros auxilios
│   └── docs/               # Manuales en Markdown
└── src/
    ├── core/
    │   ├── constants.js    # Enumeraciones y configuración global
    │   ├── utils.js        # Funciones puras (fechas, cálculos, formato)
    │   └── validators.js   # Validación de datos
    ├── data/
    │   ├── storage.js      # Capa sobre localStorage
    │   └── inventory.json  # Inventario inicial de la mochila
    ├── screens/
    │   ├── Dashboard.js    # Estado general de preparación
    │   ├── Backpack.js     # Checklist de la mochila
    │   ├── Contacts.js     # Contactos de emergencia
    │   ├── Guides.js       # Guías: Antes / Durante / Después
    │   └── Supplies.js     # Suministros del hogar
    └── services/
        └── Notifications.js # Alertas locales de vencimientos
```

---

## Pantallas

| Pantalla      | Función                                                      |
|---------------|--------------------------------------------------------------|
| **Estado**    | Indicador global de preparación, alertas activas             |
| **Mochila**   | Checklist editable con categorías, badges y fechas de vencimiento |
| **Contactos** | Grupos: Congregación, Emergencia, Familia, Amigo, Servicios  |
| **Guías**     | Protocolos Antes / Durante / Después con puntos de encuentro editables |
| **Suministros** | Calculadora de agua y alimentos, fechas de vencimiento     |

---

## Tecnología

- **HTML / CSS / JS vanilla** — sin frameworks, sin dependencias externas
- **ES Modules** — código modular con `import/export`
- **PWA** — `manifest.json` + Service Worker para instalación y uso offline
- **localStorage** — persistencia de datos sin servidor

---

## Instalación local

```bash
# Con cualquier servidor estático, por ejemplo:
npx serve .
# o
python3 -m http.server 8080
```

Luego abrir `http://localhost:8080` en el navegador.

---

## Deploy en GitHub Pages

1. Subir el proyecto a un repositorio público.
2. En Settings → Pages → Source: seleccionar `main` / `root`.
3. La app quedará disponible en `https://usuario.github.io/EmergenciaApp/`.

---

## Notas

- Los íconos `icon-192.png` y `icon-512.png` deben generarse y colocarse en `assets/icons/`.
- Para instalar en Android: abrir en Chrome → menú → "Agregar a pantalla de inicio".
- Para instalar en iOS: abrir en Safari → compartir → "Agregar a pantalla de inicio".
