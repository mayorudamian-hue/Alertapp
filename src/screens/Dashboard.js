/* ============================================================
   EmergenciaApp — Dashboard.js
   Pantalla de estado general.
   Muestra: nivel de preparación, métricas, alertas activas
   y accesos rápidos a las demás secciones.
   ============================================================ */

'use strict';

import { SCREENS, EXP_STATUS }         from '../core/constants.js';
import { expiryStatus, calcReadiness } from '../core/utils.js';
import {
  loadInventory,
  loadContacts,
  loadMeetingPoints,
  loadFoodItems,
  loadAntesChecks,
  loadLastReview,
  saveLastReview,
  DEFAULT_INVENTORY,
}                                       from '../data/storage.js';

const DEFAULT_CONTACTS = [];
const ANTES_TOTAL      = 12;   // total de tareas en Guías › Antes

// ── Estado del Dashboard ──────────────────────────────────
let _container = null;

// ── Entrada pública ───────────────────────────────────────

/**
 * Monta el Dashboard en el contenedor dado.
 * Llamado una sola vez desde index.html al iniciar la app.
 * @param {HTMLElement} container
 */
export function renderDashboard(container) {
  _container = container;
  refresh();
}

/**
 * Refresca el Dashboard con los datos más recientes del storage.
 * Puede llamarse desde otras pantallas cuando cambien datos relevantes.
 */
export function refresh() {
  if (!_container) return;

  const data    = collectData();
  const metrics = computeMetrics(data);

  _container.innerHTML = buildHTML(metrics, data);
  bindEvents(_container);

  // Actualizar barra del header
  App.updateReadiness({
    backpackDone:  metrics.backpackDone,
    backpackTotal: metrics.backpackTotal,
    contactsDone:  metrics.contactsDone,
    contactsTotal: metrics.contactsTotal,
    guidesDone:    metrics.guidesDone,
    guidesTotal:   metrics.guidesTotal,
    meetingsDone:  metrics.meetingsDone,
    meetingsTotal: metrics.meetingsTotal,
  });
}

// ── Recolección de datos ──────────────────────────────────

function collectData() {
  const inventory    = loadInventory(DEFAULT_INVENTORY);
  const contacts     = loadContacts(DEFAULT_CONTACTS);
  const meetingPts   = loadMeetingPoints({});
  const foodItems    = loadFoodItems([]);
  const antesChecks  = loadAntesChecks({});
  const lastReview   = loadLastReview();

  // Ítems planos de mochila
  const allInventoryItems = inventory.flatMap(cat => cat.items);

  // Ítems planos de suministros con fecha
  const allFoodItems = foodItems.filter(f => f.expDate);

  // Todos los ítems con posible vencimiento
  const allExpItems = [
    ...allInventoryItems.filter(i => i.expDate),
    ...allFoodItems,
  ];

  // Puntos de encuentro: cuenta los que tienen al menos p1 definido
  const meetingsDone  = Object.values(meetingPts).filter(mp => mp && mp.p1 && mp.p1.trim()).length;
  const meetingsTotal = 4; // incendio, terremoto, inundación, tornado

  // Contactos con teléfono cargado
  const contactsDone  = contacts.filter(c => c.phone && c.phone.trim()).length;
  const contactsTotal = Math.max(contacts.length, 1);

  // Tareas "Antes" completadas
  const guidesDone  = Object.values(antesChecks).filter(Boolean).length;
  const guidesTotal = ANTES_TOTAL;

  return {
    inventory, allInventoryItems, allFoodItems, allExpItems,
    contacts, meetingPts,
    meetingsDone, meetingsTotal,
    contactsDone, contactsTotal,
    guidesDone, guidesTotal,
    lastReview,
  };
}

// ── Cálculo de métricas ───────────────────────────────────

function computeMetrics(data) {
  const { allInventoryItems, allExpItems,
          contactsDone, contactsTotal,
          guidesDone, guidesTotal,
          meetingsDone, meetingsTotal } = data;

  // Mochila
  const backpackDone  = allInventoryItems.filter(i => i.done).length;
  const backpackTotal = allInventoryItems.length;

  // Vencimientos
  const expiredItems  = allExpItems.filter(i => expiryStatus(i.expDate).status === EXP_STATUS.EXPIRED);
  const soonItems     = allExpItems.filter(i => expiryStatus(i.expDate).status === EXP_STATUS.SOON);

  // Nivel de preparación global
  const readiness = calcReadiness({
    backpackDone, backpackTotal,
    contactsDone, contactsTotal,
    guidesDone,   guidesTotal,
    meetingsDone, meetingsTotal,
  });

  return {
    backpackDone, backpackTotal,
    contactsDone, contactsTotal,
    guidesDone,   guidesTotal,
    meetingsDone, meetingsTotal,
    expiredItems, soonItems,
    readiness,
  };
}

// ── Construcción del HTML ─────────────────────────────────

function buildHTML(metrics, data) {
  const {
    backpackDone, backpackTotal,
    contactsDone, contactsTotal,
    guidesDone,   guidesTotal,
    expiredItems, soonItems,
    readiness,
  } = metrics;

  const backpackPct = backpackTotal > 0
    ? Math.round(backpackDone / backpackTotal * 100) : 0;

  return `
    ${buildReadinessCard(readiness)}
    ${buildStatGrid(backpackPct, expiredItems.length + soonItems.length, contactsDone, guidesDone, guidesTotal)}
    ${buildAlerts(expiredItems, soonItems, data)}
    ${buildQuickAccess()}
    ${buildLastReviewNote(data.lastReview)}
  `;
}

// ── Tarjeta de nivel general ──────────────────────────────

function buildReadinessCard(readiness) {
  const label = readiness < 30 ? 'Inicio'
    : readiness < 60 ? 'En progreso'
    : readiness < 85 ? 'Buena preparación'
    : '¡Excelente preparación!';

  const color = readiness < 30 ? 'var(--danger)'
    : readiness < 60 ? 'var(--warn)'
    : 'var(--ok)';

  return `
    <div style="
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      margin-bottom: var(--space-md);
    ">
      <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-bottom: var(--space-sm);">
        <div>
          <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.07em; margin-bottom:4px;">Nivel de preparación</div>
          <div style="font-size:42px; font-weight:600; line-height:1; letter-spacing:-0.03em; color:${color};">${readiness}<span style="font-size:22px;">%</span></div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:13px; font-weight:500; color:${color};">${label}</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">actualizado ahora</div>
        </div>
      </div>
      <div style="height:8px; background:var(--bg-subtle); border-radius:var(--radius-full); overflow:hidden; border:1px solid var(--border);">
        <div style="height:100%; width:${readiness}%; background:${color}; border-radius:var(--radius-full); transition: width 0.6s ease;"></div>
      </div>
    </div>
  `;
}

// ── Grilla de estadísticas ────────────────────────────────

function buildStatGrid(backpackPct, alertCount, contactsDone, guidesDone, guidesTotal) {
  const stats = [
    {
      label: 'Mochila lista',
      value: backpackPct + '%',
      sub:   backpackPct === 100 ? '¡Completa!' : 'de ítems marcados',
      cls:   backpackPct === 100 ? 'is-ok' : backpackPct >= 60 ? 'is-warn' : 'is-alert',
      nav:   SCREENS.BACKPACK,
    },
    {
      label: 'Alertas activas',
      value: alertCount,
      sub:   alertCount === 0 ? 'Todo en orden' : 'vencidos o próximos',
      cls:   alertCount === 0 ? 'is-ok' : alertCount <= 2 ? 'is-warn' : 'is-alert',
      nav:   null,
    },
    {
      label: 'Contactos',
      value: contactsDone,
      sub:   'con teléfono cargado',
      cls:   contactsDone >= 3 ? 'is-ok' : contactsDone >= 1 ? 'is-warn' : 'is-alert',
      nav:   SCREENS.CONTACTS,
    },
    {
      label: 'Guía "Antes"',
      value: guidesDone + '/' + guidesTotal,
      sub:   'tareas completadas',
      cls:   guidesDone === guidesTotal ? 'is-ok' : guidesDone > 0 ? 'is-warn' : 'is-alert',
      nav:   SCREENS.GUIDES,
    },
  ];

  const cards = stats.map(s => `
    <div class="stat-card ${s.cls}"
         ${s.nav ? `style="cursor:pointer;" data-nav="${s.nav}"` : ''}
         role="${s.nav ? 'button' : ''}"
         aria-label="${s.nav ? 'Ir a ' + s.label : ''}">
      <div class="stat-card-label">${s.label}</div>
      <div class="stat-card-value">${s.value}</div>
      <div class="stat-card-sub">${s.sub}${s.nav ? ' →' : ''}</div>
    </div>
  `).join('');

  return `<div class="stat-grid">${cards}</div>`;
}

// ── Alertas activas ───────────────────────────────────────

function buildAlerts(expiredItems, soonItems, data) {
  const alerts = [];

  // Ítems vencidos
  expiredItems.forEach(item => {
    const { label } = expiryStatus(item.expDate);
    alerts.push({
      cls:  'is-danger',
      text: item.name,
      sub:  label + ' — reemplazar lo antes posible',
      nav:  item._source === 'food' ? SCREENS.SUPPLIES : SCREENS.BACKPACK,
    });
  });

  // Ítems próximos a vencer
  soonItems.forEach(item => {
    const { label } = expiryStatus(item.expDate);
    alerts.push({
      cls:  'is-warn',
      text: item.name,
      sub:  label,
      nav:  item._source === 'food' ? SCREENS.SUPPLIES : SCREENS.BACKPACK,
    });
  });

  // Mochila vacía
  const allItems = loadInventory(DEFAULT_INVENTORY).flatMap(c => c.items);
  const donePct  = allItems.length > 0
    ? Math.round(allItems.filter(i => i.done).length / allItems.length * 100) : 0;
  if (donePct === 0) {
    alerts.push({
      cls:  'is-warn',
      text: 'Mochila de emergencia sin preparar',
      sub:  'Ningún ítem marcado todavía',
      nav:  SCREENS.BACKPACK,
    });
  }

  // Sin contactos
  const contacts = loadContacts(DEFAULT_CONTACTS);
  if (contacts.length === 0) {
    alerts.push({
      cls:  'is-warn',
      text: 'Sin contactos de emergencia registrados',
      sub:  'Agregá al menos tu contacto principal',
      nav:  SCREENS.CONTACTS,
    });
  }

  // Sin puntos de encuentro definidos
  const mp = loadMeetingPoints({});
  const mpDefined = Object.values(mp).filter(v => v && v.p1 && v.p1.trim()).length;
  if (mpDefined === 0) {
    alerts.push({
      cls:  'is-warn',
      text: 'Puntos de encuentro sin definir',
      sub:  'Abrí una guía de desastre para establecerlos',
      nav:  SCREENS.GUIDES,
    });
  }

  // Revisión anual pendiente
  const lastReview = loadLastReview();
  if (lastReview) {
    const last    = new Date(lastReview + 'T00:00:00');
    const diffMs  = Date.now() - last.getTime();
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (diffMs >= oneYear) {
      alerts.push({
        cls:  'is-warn',
        text: 'Revisión anual vencida',
        sub:  'Pasó más de un año desde la última revisión de suministros',
        nav:  SCREENS.SUPPLIES,
      });
    }
  }

  // Todo bien
  if (alerts.length === 0) {
    alerts.push({
      cls:  'is-ok',
      text: 'Todo en orden',
      sub:  'Sin alertas activas en este momento',
      nav:  null,
    });
  }

  const rows = alerts.map(a => `
    <div class="alert-item ${a.cls}"
         ${a.nav ? `data-nav="${a.nav}" style="cursor:pointer;"` : ''}>
      <div class="alert-dot"></div>
      <div style="flex:1;">
        <div class="alert-text">${a.text}</div>
        <div class="alert-sub">${a.sub}</div>
      </div>
      ${a.nav ? `<div style="font-size:11px; color:var(--text-tertiary); flex-shrink:0;">→</div>` : ''}
    </div>
  `).join('');

  return `
    <div class="section-title">Alertas activas</div>
    <div id="dash-alerts">${rows}</div>
  `;
}

// ── Accesos rápidos ───────────────────────────────────────

function buildQuickAccess() {
  const items = [
    { icon: '🎒', label: 'Mochila',      nav: SCREENS.BACKPACK  },
    { icon: '📞', label: 'Contactos',    nav: SCREENS.CONTACTS  },
    { icon: '📋', label: 'Guías',        nav: SCREENS.GUIDES    },
    { icon: '🏠', label: 'Suministros',  nav: SCREENS.SUPPLIES  },
  ];

  const btns = items.map(i => `
    <button class="btn btn-outline"
            data-nav="${i.nav}"
            style="flex:1; flex-direction:column; gap:4px; padding: var(--space-md) var(--space-sm); height:auto; border-radius:var(--radius-lg);">
      <span style="font-size:20px;">${i.icon}</span>
      <span style="font-size:11px;">${i.label}</span>
    </button>
  `).join('');

  return `
    <div class="section-title">Acceso rápido</div>
    <div style="display:flex; gap:var(--space-sm); margin-bottom:var(--space-lg);">
      ${btns}
    </div>
  `;
}

// ── Nota de revisión anual ────────────────────────────────

function buildLastReviewNote(lastReview) {
  const dateLabel = lastReview
    ? (() => {
        const [y, m, d] = lastReview.split('-');
        return `${d}/${m}/${y}`;
      })()
    : null;

  const text = dateLabel
    ? `Última revisión anual: <strong>${dateLabel}</strong>. Las organizaciones de emergencia recomiendan revisar suministros una vez al año.`
    : 'Aún no registraste una revisión anual de suministros. Se recomienda hacerlo al menos una vez al año.';

  return `
    <div class="info-note is-info" style="margin-bottom:var(--space-md);">
      <span class="info-note-icon">🗓️</span>
      <div>${text}
        <div style="margin-top:var(--space-xs);">
          <button class="btn btn-ghost" id="btn-mark-review"
                  style="font-size:12px; padding:4px 0; color:var(--info);">
            Marcar revisión hoy →
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── Eventos ───────────────────────────────────────────────

function bindEvents(container) {
  // Navegación desde tarjetas y alertas
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      App.navigate(el.dataset.nav);
    });
  });

  // Marcar revisión anual
  container.querySelector('#btn-mark-review')?.addEventListener('click', async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    saveLastReview(todayStr);
    App.toast('Revisión anual registrada ✓');
    refresh();
  });
}
