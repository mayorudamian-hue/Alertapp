/* ============================================================
   EmergenciaApp — Guides.js
   Pantalla de guías de preparación.

   Tres pestañas:
   ● Antes   — checklist con chips de navegación interna, progreso
   ● Durante — tarjetas colapsables por tipo de desastre,
               puntos de encuentro editables por situación
   ● Después — checklist de recuperación con chips de navegación

   Persiste en localStorage: checks Antes, checks Después,
   puntos de encuentro.
   ============================================================ */

'use strict';

import { SCREENS, GUIDE_PHASES, DISASTER_TYPES } from '../core/constants.js';
import { validateMeetingPoint }                   from '../core/validators.js';
import {
  loadAntesChecks,  saveAntesChecks,
  loadDespuesChecks, saveDespuesChecks,
  loadMeetingPoints, saveMeetingPoints,
}                                                 from '../data/storage.js';
import { refresh as refreshDashboard }            from './Dashboard.js';

// ── Contenido estático de las guías ──────────────────────

const ANTES_ITEMS = [
  // { text, note?, chips?, section? }
  { section: 'Mentalidad y conocimiento' },
  {
    text: 'Aceptar que los desastres pueden ocurrir en cualquier momento',
    note: 'La preparación previa marca la diferencia.',
  },
  {
    text: 'Informarse sobre los desastres más probables en tu zona',
    note: 'Consultá los servicios de protección civil locales.',
    chips: [
      { label: 'Ver contactos de emergencia', cls: 'chip-contacts', nav: SCREENS.CONTACTS },
      { label: 'Guías por tipo de desastre',  cls: 'chip-guide',    nav: GUIDE_PHASES.DURANTE },
    ],
  },
  {
    text: 'Localizar los refugios y puntos de encuentro más cercanos',
    chips: [
      { label: 'Definir puntos de encuentro', cls: 'chip-meeting', nav: GUIDE_PHASES.DURANTE },
    ],
  },

  { section: 'Tu hogar' },
  {
    text: 'Analizar si la estructura y ubicación de tu casa son seguras',
  },
  {
    text: 'Instalar detectores de humo y cambiar las pilas al menos una vez al año',
    chips: [
      { label: 'Ver guía: Incendio', cls: 'chip-guide', nav: DISASTER_TYPES.INCENDIO },
    ],
  },
  {
    text: 'Eliminar riesgos de incendio en el hogar',
    chips: [
      { label: 'Ver guía: Incendio', cls: 'chip-guide', nav: DISASTER_TYPES.INCENDIO },
    ],
  },
  {
    text: 'Mantener el tanque del vehículo al menos a la mitad',
    note: 'Para poder evacuar en cualquier momento.',
  },

  { section: 'Plan familiar' },
  {
    text: 'Elaborar un plan de escape y ensayarlo en familia',
    chips: [
      { label: 'Ver guía: Durante', cls: 'chip-guide', nav: GUIDE_PHASES.DURANTE },
    ],
  },
  {
    text: 'Definir dos puntos de encuentro: cerca de casa y fuera del vecindario',
    note: 'Ej: escuela, biblioteca pública.',
    chips: [
      { label: 'Establecer puntos por situación', cls: 'chip-meeting', nav: GUIDE_PHASES.DURANTE },
    ],
  },
  {
    text: 'Conocer el plan de emergencia de la escuela de los hijos',
  },
  {
    text: 'Tener a mano teléfonos de contactos cercanos y lejanos',
    chips: [
      { label: 'Ir a Contactos', cls: 'chip-contacts', nav: SCREENS.CONTACTS },
    ],
  },
  {
    text: 'Identificar vecinos mayores o enfermos a quienes ayudar',
  },
  {
    text: 'Revisar mochila de emergencia y suministros anualmente',
    chips: [
      { label: 'Ver mochila',              cls: 'chip-backpack', nav: SCREENS.BACKPACK  },
      { label: 'Ver suministros del hogar', cls: 'chip-supplies', nav: SCREENS.SUPPLIES },
    ],
  },
];

const DURANTE_DISASTERS = [
  {
    id:      DISASTER_TYPES.INCENDIO,
    icon:    '🔥',
    title:   'Incendio',
    sub:     'Evacuación y primeros auxilios',
    iconBg:  '#F5DEDD',
    meeting: true,
    steps: [
      'Al detectar humo: tocar puertas con el dorso antes de abrir.',
      'Mantenerse agachado — el aire limpio está abajo.',
      'No recoger pertenencias: unos segundos pueden marcar la diferencia.',
      'No usar ascensores. Cerrar puertas al evacuar para frenar el fuego.',
      'Si alguien cae, levantarlo y seguir avanzando sin detenerse.',
      'Una vez afuera: alejarse del edificio y llamar al 100.',
    ],
  },
  {
    id:      DISASTER_TYPES.TERREMOTO,
    icon:    '🌍',
    title:   'Terremoto',
    sub:     'Antes, durante y después del sismo',
    iconBg:  '#F7EDD6',
    meeting: true,
    steps: [
      'Meterse bajo una mesa maciza o esquina de pared interna / muro de carga.',
      'Agarrarse y proteger la cabeza y el cuello con los brazos.',
      'No correr hacia afuera durante el sismo — esperar a que pare.',
      'Salir del edificio cuanto antes; probablemente habrá réplicas.',
      'Mantenerse alejado de edificios, cables y árboles una vez afuera.',
      'Ayudar a otras personas si es posible — los equipos de rescate pueden tardar horas.',
    ],
  },
  {
    id:      DISASTER_TYPES.INUNDACION,
    icon:    '💧',
    title:   'Inundación',
    sub:     'Protocolo para zonas bajas',
    iconBg:  '#DFEcF8',
    meeting: true,
    steps: [
      'Conocer la cota de la vivienda respecto al nivel del río o arroyo.',
      'Cortar gas y electricidad antes de evacuar.',
      'No caminar ni conducir por el agua: puede ocultar escombros, alcantarillas o cables.',
      'Una corriente de 60 cm de profundidad puede arrastrar un automóvil.',
      'Dirigirse al punto de encuentro elevado definido.',
      'Llevar la mochila de emergencia preparada.',
    ],
  },
  {
    id:      DISASTER_TYPES.TORNADO,
    icon:    '🌪️',
    title:   'Tornado o huracán',
    sub:     'Refugio y protección',
    iconBg:  '#E4F0D6',
    meeting: true,
    steps: [
      'Ir de inmediato a un refugio para tormentas o sótano.',
      'Alejarse de ventanas y puertas exteriores.',
      'Si estás en un vehículo: no intentar superarlo — buscar refugio sólido.',
      'Proteger la cabeza con los brazos si no hay refugio disponible.',
      'Una vez que pase: verificar daños en gas, luz y agua antes de usar.',
    ],
  },
  {
    id:      DISASTER_TYPES.TSUNAMI,
    icon:    '🌊',
    title:   'Tsunami',
    sub:     'Evacuación costera',
    iconBg:  '#DFEcF8',
    meeting: false,
    steps: [
      'Si el mar se aleja repentinamente de la costa: correr a zona elevada de inmediato.',
      'No esperar confirmación oficial — la retirada del mar ES la señal.',
      'Quedarse en la zona elevada — vendrán más olas, posiblemente más grandes.',
      'No volver a la costa hasta que las autoridades lo indiquen.',
    ],
  },
  {
    id:      'rcp',
    icon:    '❤️',
    title:   'RCP básico',
    sub:     'Reanimación cardiopulmonar',
    iconBg:  '#F5DEDD',
    meeting: false,
    steps: [
      'Verificar que la escena es segura antes de acercarse.',
      'Llamar al 107 (SAME) o pedir a alguien que lo haga mientras iniciás RCP.',
      'Verificar respuesta: llamar fuerte y sacudir los hombros.',
      '30 compresiones en el centro del pecho — profundidad 5 cm, ritmo rápido.',
      '2 respiraciones de rescate si estás entrenado (si no, solo compresiones).',
      'Continuar hasta que llegue la ambulancia o la persona responda.',
    ],
  },
];

// Tips globales del "Durante"
const DURANTE_TIPS = [
  { text: 'Los mensajes de texto funcionan mejor que las llamadas durante una emergencia.', icon: '💬' },
  { text: 'Si ordenan evacuar: hacelo de inmediato y avisá a tus contactos dónde estás.',   icon: '🚶' },
  { text: 'Si ordenan quedarse: apagá la ventilación y sellá puertas y ventanas.',          icon: '🏠' },
];

const DESPUES_ITEMS = [
  { section: 'Seguridad física' },
  {
    text: 'Quedarse con amigos o familiares en vez de un campamento, si es posible',
    chips: [{ label: 'Ver contactos', cls: 'chip-contacts', nav: SCREENS.CONTACTS }],
  },
  {
    text: 'Usar equipo de protección al remover escombros',
    note: 'Guantes, calzado resistente, casco y mascarilla.',
    chips: [{ label: 'Revisar mochila', cls: 'chip-backpack', nav: SCREENS.BACKPACK }],
  },
  {
    text: 'Mantenerse alejado de edificaciones inundadas o dañadas',
  },
  {
    text: 'Cuidar cables eléctricos y brasas escondidas entre escombros',
  },

  { section: 'Bienestar emocional y rutina' },
  {
    text: 'Mantener la rutina familiar en la medida de lo posible',
    note: 'Los hijos necesitan ver calma y esperanza.',
  },
  {
    text: 'Seguir con lecciones, juegos y adoración a Dios en familia',
  },
  {
    text: 'No ver constantemente noticias de la tragedia',
    note: 'Ni descargar la ansiedad o frustración con la familia.',
  },
  {
    text: 'Identificar señales de daño emocional',
    note: 'Ansiedad, tristeza, cambios de humor, dificultad para dormir o trabajar. Hablar con amigos de confianza.',
    chips: [{ label: 'Ver contactos', cls: 'chip-contacts', nav: SCREENS.CONTACTS }],
  },
  {
    text: 'Aceptar ayuda y ofrecerla a los demás',
  },
];

// ── Estado interno ────────────────────────────────────────
let _container     = null;
let _phase         = GUIDE_PHASES.ANTES;   // pestaña activa
let _antesChecks   = {};                   // { itemIndex: boolean }
let _despuesChecks = {};                   // { itemIndex: boolean }
let _meetingPoints = {};                   // { disasterId: { p1, p2 } }
let _openDisasters = new Set();            // ids de tarjetas abiertas
let _editingSlot   = null;                 // 'disasterId-p1' | 'disasterId-p2' | null

// ── Entrada pública ───────────────────────────────────────

export function renderGuides(container) {
  _container     = container;
  _antesChecks   = loadAntesChecks({});
  _despuesChecks = loadDespuesChecks({});
  _meetingPoints = loadMeetingPoints({});
  _render();
}

// ── Render principal ──────────────────────────────────────

function _render() {
  if (!_container) return;
  _container.innerHTML = `
    ${_buildPhaseTabs()}
    ${_phase === GUIDE_PHASES.ANTES   ? _buildAntes()   : ''}
    ${_phase === GUIDE_PHASES.DURANTE ? _buildDurante() : ''}
    ${_phase === GUIDE_PHASES.DESPUES ? _buildDespues() : ''}
  `;
  _bindEvents();
}

// ── Pestañas de fase ──────────────────────────────────────

function _buildPhaseTabs() {
  const tabs = [
    { id: GUIDE_PHASES.ANTES,   icon: '🟡', label: 'Antes'   },
    { id: GUIDE_PHASES.DURANTE, icon: '🔴', label: 'Durante' },
    { id: GUIDE_PHASES.DESPUES, icon: '🟢', label: 'Después' },
  ];
  const html = tabs.map(t => `
    <button class="phase-tab ${_phase === t.id ? 'p-' + t.id : ''}"
            data-action="switch-phase" data-phase="${t.id}">
      <span class="phase-tab-icon">${t.icon}</span>
      <span class="phase-tab-label">${t.label}</span>
    </button>
  `).join('');

  return `
    <div class="phase-tabs" style="margin: calc(-1 * var(--space-lg)) calc(-1 * var(--space-lg)) var(--space-lg);">
      ${html}
    </div>
  `;
}

// ── ANTES ─────────────────────────────────────────────────

function _buildAntes() {
  const items   = ANTES_ITEMS.filter(i => !i.section);
  const total   = items.length;
  const done    = items.filter((_, i) => _antesChecks[_antesRealIndex(i)]).length;
  const pct     = total > 0 ? Math.round(done / total * 100) : 0;

  return `
    <div class="info-note is-warn">
      <span class="info-note-icon">🔑</span>
      <span>La preparación es la clave para sobrevivir. Si se prepara después de que el desastre haya sucedido, será demasiado tarde.</span>
    </div>

    <div style="margin-bottom:var(--space-md);">
      <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-secondary); margin-bottom:5px;">
        <span>Tareas completadas</span>
        <strong style="color:var(--text-primary);">${done} / ${total}</strong>
      </div>
      <div style="height:6px; background:var(--bg-subtle); border-radius:var(--radius-full); overflow:hidden; border:1px solid var(--border);">
        <div style="height:100%; width:${pct}%; background:var(--warn); border-radius:var(--radius-full); transition:width 0.4s;"></div>
      </div>
    </div>

    ${_buildChecklistItems(ANTES_ITEMS, _antesChecks, 'antes')}
  `;
}

// ── DURANTE ───────────────────────────────────────────────

function _buildDurante() {
  const tips = DURANTE_TIPS.map(t => `
    <div class="info-note is-info" style="margin-bottom:var(--space-xs);">
      <span class="info-note-icon">${t.icon}</span>
      <span>${t.text}</span>
    </div>
  `).join('');

  const cards = DURANTE_DISASTERS.map(d => _buildDisasterCard(d)).join('');

  return `${tips}<div style="margin-top:var(--space-md);">${cards}</div>`;
}

function _buildDisasterCard(disaster) {
  const isOpen = _openDisasters.has(disaster.id);

  const steps = disaster.steps.map((s, i) => `
    <div class="step-item">
      <div class="step-num">${i + 1}</div>
      <div class="step-text">${_escHtml(s)}</div>
    </div>
  `).join('');

  const meetingHtml = disaster.meeting
    ? _buildMeetingBlock(disaster.id)
    : '';

  return `
    <div class="collapsible ${isOpen ? 'is-open' : ''}" id="disaster-${disaster.id}">
      <div class="collapsible-header" data-action="toggle-disaster" data-id="${disaster.id}">
        <div class="collapsible-icon-wrap" style="background:${disaster.iconBg};">
          ${disaster.icon}
        </div>
        <div>
          <div class="collapsible-title">${_escHtml(disaster.title)}</div>
          <div class="collapsible-sub">${_escHtml(disaster.sub)}</div>
        </div>
        <div class="collapsible-arrow">▼</div>
      </div>
      <div class="collapsible-body">
        ${meetingHtml}
        ${steps}
      </div>
    </div>
  `;
}

// ── Punto de encuentro ────────────────────────────────────

function _buildMeetingBlock(disasterId) {
  const mp = _meetingPoints[disasterId] || { p1: '', p2: '' };

  const slot = (n) => {
    const key = `${disasterId}-p${n}`;
    const val = mp[`p${n}`] || '';
    const editing = _editingSlot === key;

    if (editing) {
      return `
        <div class="meeting-slot">
          <span class="meeting-slot-num">Punto ${n}:</span>
          <input class="meeting-slot-input"
                 id="mp-input-${key}"
                 placeholder="Ej: Escuela N°5, Plaza San Martín…"
                 value="${_escHtml(val)}"
                 maxlength="120" />
          <button class="meeting-slot-save"
                  data-action="save-meeting"
                  data-key="${key}"
                  data-disaster="${disasterId}"
                  data-slot="p${n}">OK</button>
        </div>
      `;
    }

    return `
      <div class="meeting-slot">
        <span class="meeting-slot-num">Punto ${n}:</span>
        <span class="meeting-slot-val ${val ? 'is-set' : ''}">${val || 'Sin definir — tocá ✏️ para agregar'}</span>
        <button class="meeting-slot-edit"
                data-action="edit-meeting"
                data-key="${key}"
                title="Editar punto de encuentro ${n}">✏️</button>
      </div>
    `;
  };

  return `
    <div class="meeting-block">
      <div class="meeting-block-label">📍 Puntos de encuentro</div>
      <div>${slot(1)}${slot(2)}</div>
    </div>
  `;
}

// ── DESPUÉS ───────────────────────────────────────────────

function _buildDespues() {
  const items = DESPUES_ITEMS.filter(i => !i.section);
  const total = items.length;
  const done  = items.filter((_, i) => _despuesChecks[_despuesRealIndex(i)]).length;
  const pct   = total > 0 ? Math.round(done / total * 100) : 0;

  return `
    <div class="info-note is-ok">
      <span class="info-note-icon">✅</span>
      <span>Pasado el peligro, quedan otros desafíos. Seguí estas pautas para mantener a tu familia segura y estable.</span>
    </div>

    <div style="margin-bottom:var(--space-md);">
      <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-secondary); margin-bottom:5px;">
        <span>Tareas completadas</span>
        <strong style="color:var(--text-primary);">${done} / ${total}</strong>
      </div>
      <div style="height:6px; background:var(--bg-subtle); border-radius:var(--radius-full); overflow:hidden; border:1px solid var(--border);">
        <div style="height:100%; width:${pct}%; background:var(--ok); border-radius:var(--radius-full); transition:width 0.4s;"></div>
      </div>
    </div>

    ${_buildChecklistItems(DESPUES_ITEMS, _despuesChecks, 'despues')}
  `;
}

// ── Checklist genérico (Antes y Después) ──────────────────

function _buildChecklistItems(data, checks, phase) {
  let itemIdx = 0;
  return data.map(entry => {
    if (entry.section) {
      return `<div class="section-title" style="margin-top:var(--space-lg);">${_escHtml(entry.section)}</div>`;
    }

    const idx    = itemIdx++;
    const done   = !!checks[idx];
    const chipsH = entry.chips ? _buildChips(entry.chips) : '';

    return `
      <div class="check-item" data-action="toggle-check"
           data-phase="${phase}" data-idx="${idx}"
           style="cursor:pointer;">
        <div class="cb ${done ? 'is-checked' : ''}" style="flex-shrink:0; margin-top:2px;"></div>
        <div style="flex:1; min-width:0;">
          <div class="check-item-name ${done ? 'is-done' : ''}">${_escHtml(entry.text)}</div>
          ${entry.note ? `<div class="check-item-meta">${_escHtml(entry.note)}</div>` : ''}
          ${chipsH}
        </div>
      </div>
    `;
  }).join('');
}

function _buildChips(chips) {
  const html = chips.map(c => `
    <button class="link-chip ${c.cls}"
            data-action="chip-nav" data-nav="${c.nav}"
            style="cursor:pointer;">
      ${_escHtml(c.label)}
    </button>
  `).join('');
  return `<div class="link-chips">${html}</div>`;
}

// ── Índices reales (saltando sections) ────────────────────

function _antesRealIndex(logicalIdx) {
  let count = 0;
  for (let i = 0; i < ANTES_ITEMS.length; i++) {
    if (ANTES_ITEMS[i].section) continue;
    if (count === logicalIdx) return i;
    count++;
  }
  return logicalIdx;
}

function _despuesRealIndex(logicalIdx) {
  let count = 0;
  for (let i = 0; i < DESPUES_ITEMS.length; i++) {
    if (DESPUES_ITEMS[i].section) continue;
    if (count === logicalIdx) return i;
    count++;
  }
  return logicalIdx;
}

// ── Acciones ──────────────────────────────────────────────

function _toggleCheck(phase, idx) {
  if (phase === 'antes') {
    _antesChecks[idx] = !_antesChecks[idx];
    saveAntesChecks(_antesChecks);
  } else {
    _despuesChecks[idx] = !_despuesChecks[idx];
    saveDespuesChecks(_despuesChecks);
  }
  setTimeout(() => _render(), 0);
  refreshDashboard();
}

function _toggleDisaster(id) {
  if (_openDisasters.has(id)) {
    _openDisasters.delete(id);
  } else {
    _openDisasters.add(id);
  }
  // setTimeout(0) evita que el nuevo listener (post-AbortController)
  // capture el mismo evento que disparó este toggle en móviles
  setTimeout(() => _render(), 0);
}

function _editMeeting(key) {
  _editingSlot = key;
  _render();
  setTimeout(() => {
    _container?.querySelector(`#mp-input-${key}`)?.focus();
  }, 50);
}

function _saveMeeting(key, disasterId, slot) {
  const input = _container?.querySelector(`#mp-input-${key}`);
  if (!input) return;

  const val        = input.value.trim();
  const validation = validateMeetingPoint(val);

  if (!validation.valid) {
    App.toast(validation.errors[0]);
    return;
  }

  if (!_meetingPoints[disasterId]) {
    _meetingPoints[disasterId] = { p1: '', p2: '' };
  }
  _meetingPoints[disasterId][slot] = val;
  _editingSlot = null;
  saveMeetingPoints(_meetingPoints);
  _render();
  refreshDashboard();
  App.toast('Punto de encuentro guardado ✓');
}

function _switchPhase(phase) {
  _phase       = phase;
  _editingSlot = null;
  setTimeout(() => _render(), 0);
}

function _chipNav(nav) {
  // Si es una fase de guías, cambiar pestaña
  if (Object.values(GUIDE_PHASES).includes(nav)) {
    _switchPhase(nav);
    return;
  }
  // Si es un tipo de desastre, ir a Durante y abrir esa tarjeta
  if (Object.values(DISASTER_TYPES).includes(nav)) {
    _phase = GUIDE_PHASES.DURANTE;
    _openDisasters.add(nav);
    _editingSlot = null;
    _render();
    // Scroll a la tarjeta
    setTimeout(() => {
      document.getElementById(`disaster-${nav}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return;
  }
  // Si es otra pantalla, navegar
  App.navigate(nav);
}

// ── Binding de eventos ────────────────────────────────────

// AbortController para cancelar listeners anteriores en cada re-render
let _abortCtrl = null;

function _bindEvents() {
  // Cancelar listeners del render anterior
  if (_abortCtrl) _abortCtrl.abort();
  _abortCtrl = new AbortController();
  const sig = { signal: _abortCtrl.signal };

  _container?.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;

    const action = el.dataset.action;

    switch (action) {
      case 'switch-phase':
        _switchPhase(el.dataset.phase);
        break;

      case 'toggle-check':
        _toggleCheck(el.dataset.phase, Number(el.dataset.idx));
        break;

      case 'toggle-disaster':
        _toggleDisaster(el.dataset.id);
        break;

      case 'edit-meeting':
        e.stopPropagation();
        _editMeeting(el.dataset.key);
        break;

      case 'save-meeting':
        e.stopPropagation();
        _saveMeeting(el.dataset.key, el.dataset.disaster, el.dataset.slot);
        break;

      case 'chip-nav':
        e.stopPropagation();
        _chipNav(el.dataset.nav);
        break;
    }
  }, sig);

  // Enter en inputs de puntos de encuentro
  _container?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('meeting-slot-input')) {
      const key = e.target.id.replace('mp-input-', '');
      const [disId, slot] = key.split('-p');
      _saveMeeting(key, disId, 'p' + slot);
    }
  }, sig);
}

// ── Helper ────────────────────────────────────────────────

function _escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
