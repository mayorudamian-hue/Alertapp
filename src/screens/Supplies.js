/* ============================================================
   EmergenciaApp — Supplies.js
   Pantalla de suministros del hogar.

   Secciones:
   ● Calculadora familiar — litros de agua y calorías/día
   ● Agua                 — ítems con sub-tareas chequeables
   ● Alimentos            — ítems con fecha de vencimiento editable
   ● Revisión anual       — marcar fecha y ver última revisión

   Los vencimientos de alimentos aparecen en el Dashboard.
   Persiste en localStorage.
   ============================================================ */

'use strict';

import { DEFAULTS, EXP_STATUS }                   from '../core/constants.js';
import { expiryStatus, calcWater, calcCalories,
         formatNumber }                            from '../core/utils.js';
import { validateSuppliesConfig,
         validateInventoryItem }                   from '../core/validators.js';
import {
  loadFoodItems,    saveFoodItems,
  loadSuppliesConfig, saveSuppliesConfig,
  loadLastReview,   saveLastReview,
}                                                  from '../data/storage.js';
import { refresh as refreshDashboard }             from './Dashboard.js';

// ── Datos iniciales ───────────────────────────────────────

const DEFAULT_WATER_ITEMS = [
  {
    id: 'w01', icon: '🍶',
    name: 'Bidones de agua potable',
    meta: 'Sellados, en lugar fresco y oscuro',
    subs: [
      'Comprar bidones de 5L o 10L sellados',
      'Etiquetar con fecha de compra',
      'Almacenar lejos de productos químicos',
      'Renovar cada 12 meses o según indicación del envase',
    ],
  },
  {
    id: 'w02', icon: '🚰',
    name: 'Agua del grifo almacenada',
    meta: 'Alternativa económica — recipientes limpios y tapados',
    subs: [
      'Usar recipientes de plástico alimentario limpios',
      'Agregar 2 gotas de lavandina sin aroma por litro',
      'Tapar herméticamente y etiquetar con fecha',
      'Reemplazar cada 6 meses',
    ],
  },
  {
    id: 'w03', icon: '💧',
    name: 'Pastillas purificadoras',
    meta: 'Respaldo si el agua almacenada se agota',
    subs: [
      'Tener al menos 1 caja en la mochila de emergencia',
      'Verificar fecha de vencimiento anualmente',
    ],
  },
];

const DEFAULT_FOOD_ITEMS = [
  { id: 'f01', icon: '🥫', name: 'Atún en lata',                     qty: '6 latas × 170g',           expDate: '', checks: [] },
  { id: 'f02', icon: '🥫', name: 'Legumbres (garbanzos / lentejas)', qty: 'Enlatadas, listas para consumir', expDate: '', checks: [] },
  { id: 'f03', icon: '🥫', name: 'Tomate triturado',                  qty: '4 latas',                  expDate: '', checks: [] },
  { id: 'f04', icon: '🌾', name: 'Arroz',                             qty: '2 kg en recipiente hermético', expDate: '', checks: [] },
  { id: 'f05', icon: '🌾', name: 'Avena',                             qty: '1 kg',                     expDate: '', checks: [] },
  { id: 'f06', icon: '🌾', name: 'Fideos secos',                      qty: '2 kg',                     expDate: '', checks: [] },
  { id: 'f07', icon: '🍫', name: 'Barras energéticas / cereales',     qty: 'Caja de 12 unidades',      expDate: '', checks: [] },
  { id: 'f08', icon: '🥜', name: 'Frutas secas y maní',               qty: '500g en bolsa hermética',  expDate: '', checks: [] },
  { id: 'f09', icon: '🍼', name: 'Leche en polvo',                    qty: '1 kg',                     expDate: '', checks: [] },
];

// ── Estado interno ────────────────────────────────────────
let _container    = null;
let _persons      = DEFAULTS.PERSONS;
let _days         = DEFAULTS.DAYS;
let _waterChecks  = {};     // { 'itemId-subIdx': boolean }
let _foodItems    = [];     // copia de trabajo
let _dateOpenId   = null;   // id del alimento con fecha abierta
let _lastReview   = null;   // 'YYYY-MM-DD' | null

// ── Entrada pública ───────────────────────────────────────

export function renderSupplies(container) {
  _container  = container;
  const cfg   = loadSuppliesConfig({ persons: DEFAULTS.PERSONS, days: DEFAULTS.DAYS });
  _persons    = cfg.persons;
  _days       = cfg.days;
  _foodItems  = loadFoodItems(DEFAULT_FOOD_ITEMS);
  _lastReview = loadLastReview();
  // waterChecks vive en memoria (no persiste — son tareas de proceso)
  _render();
}

// ── Render principal ──────────────────────────────────────

function _render() {
  if (!_container) return;
  _container.innerHTML = `
    ${_buildInfoBanner()}
    ${_buildCalculator()}
    <div class="section-title">Agua</div>
    ${_buildWaterSection()}
    <div class="section-title" style="margin-top:var(--space-lg);">Alimentos no perecederos</div>
    ${_buildFoodSection()}
    ${_buildReviewSection()}
  `;
  _bindEvents();
}

// ── Banner informativo ────────────────────────────────────

function _buildInfoBanner() {
  return `
    <div class="info-note is-info" style="margin-bottom:var(--space-lg);">
      <span class="info-note-icon">🏛️</span>
      <div>
        Las organizaciones de gestión de desastres recomiendan tener en casa
        <strong>al menos ${DEFAULTS.LITERS_PP} litros de agua por persona</strong>
        y alimentos no perecederos para <strong>${DEFAULTS.DAYS} días</strong>.
        Revisá estos suministros al menos una vez al año.
      </div>
    </div>
  `;
}

// ── Calculadora ───────────────────────────────────────────

function _buildCalculator() {
  const water = calcWater(_persons, _days, DEFAULTS.LITERS_PP);
  const cals  = calcCalories(_persons, DEFAULTS.CALORIES_PP);

  return `
    <div class="section-title">Calculadora familiar</div>
    <div class="card" style="margin-bottom:var(--space-lg);">
      <div class="card-body">

        <div class="stepper-row">
          <span class="stepper-label">Personas en el hogar</span>
          <div class="stepper-ctrl">
            <button class="stepper-btn" data-action="calc" data-key="persons" data-delta="-1">−</button>
            <span class="stepper-val" id="val-persons">${_persons}</span>
            <button class="stepper-btn" data-action="calc" data-key="persons" data-delta="1">+</button>
          </div>
        </div>

        <div class="stepper-row">
          <span class="stepper-label">Días de reserva</span>
          <div class="stepper-ctrl">
            <button class="stepper-btn" data-action="calc" data-key="days" data-delta="-1">−</button>
            <span class="stepper-val" id="val-days">${_days}</span>
            <button class="stepper-btn" data-action="calc" data-key="days" data-delta="1">+</button>
          </div>
        </div>

        <div class="divider"></div>

        <div style="display:flex; gap:var(--space-lg);">
          <div style="flex:1;">
            <div style="font-size:11px; color:var(--text-secondary); margin-bottom:3px;">Agua necesaria</div>
            <div style="font-size:26px; font-weight:600; color:var(--info); letter-spacing:-0.02em;" id="res-water">${water} L</div>
            <div style="font-size:11px; color:var(--text-tertiary);" id="res-water-sub">
              ${DEFAULTS.LITERS_PP}L × ${_persons} × ${_days} días
            </div>
          </div>
          <div style="flex:1;">
            <div style="font-size:11px; color:var(--text-secondary); margin-bottom:3px;">Calorías / día</div>
            <div style="font-size:26px; font-weight:600; color:var(--teal); letter-spacing:-0.02em;" id="res-cal">${formatNumber(cals)}</div>
            <div style="font-size:11px; color:var(--text-tertiary);" id="res-cal-sub">
              ~${formatNumber(DEFAULTS.CALORIES_PP)} kcal × ${_persons} personas
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

// ── Sección agua ──────────────────────────────────────────

function _buildWaterSection() {
  return DEFAULT_WATER_ITEMS.map(item => {
    const doneCount = item.subs.filter((_, i) => _waterChecks[`${item.id}-${i}`]).length;
    const total     = item.subs.length;
    const allDone   = doneCount === total;
    const badgeCls  = allDone ? 'badge-ok' : doneCount > 0 ? 'badge-warn' : 'badge-neutral';
    const badgeTxt  = allDone ? 'Listo' : doneCount > 0 ? `${doneCount}/${total}` : 'Pendiente';

    const subsHtml = item.subs.map((sub, i) => {
      const key     = `${item.id}-${i}`;
      const checked = !!_waterChecks[key];
      return `
        <div class="check-item" style="padding:var(--space-sm) var(--space-md); background:var(--bg-subtle); cursor:pointer;"
             data-action="toggle-water" data-key="${key}">
          <div class="cb ${checked ? 'is-checked' : ''}" style="width:16px; height:16px; flex-shrink:0;"></div>
          <div class="check-item-name ${checked ? 'is-done' : ''}" style="font-size:13px;">${_escHtml(sub)}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="card" style="margin-bottom:var(--space-sm);">
        <div style="display:flex; align-items:flex-start; gap:var(--space-md); padding:var(--space-md) var(--space-lg);">
          <span style="font-size:22px; flex-shrink:0; margin-top:2px;">${item.icon}</span>
          <div style="flex:1; min-width:0;">
            <div style="font-size:14px; font-weight:500; color:var(--text-primary);">${_escHtml(item.name)}</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:1px;">${_escHtml(item.meta)}</div>
          </div>
          <span class="badge ${badgeCls}">${badgeTxt}</span>
        </div>
        <div style="border-top:1px solid var(--border);">${subsHtml}</div>
      </div>
    `;
  }).join('');
}

// ── Sección alimentos ─────────────────────────────────────

function _buildFoodSection() {
  const itemsHtml = _foodItems.map(item => _buildFoodItem(item)).join('');

  return `
    <div id="food-list">${itemsHtml}</div>
    <button class="btn btn-dashed" data-action="add-food" style="margin-bottom:var(--space-sm);">
      + Agregar alimento
    </button>
    ${_buildAddFoodForm()}
  `;
}

function _buildFoodItem(item) {
  const expInfo   = expiryStatus(item.expDate || '');
  const pillCls   = _expPillClass(expInfo.status);
  const pillLabel = item.expDate ? expInfo.label : 'Sin fecha';
  const dateOpen  = _dateOpenId === item.id;

  return `
    <div class="card" style="margin-bottom:var(--space-sm);" id="food-${item.id}">
      <div style="display:flex; align-items:flex-start; gap:var(--space-md); padding:var(--space-md) var(--space-lg);">
        <span style="font-size:20px; flex-shrink:0; margin-top:2px;">${item.icon || '🍱'}</span>
        <div style="flex:1; min-width:0;">
          <div style="font-size:14px; font-weight:500; color:var(--text-primary);">${_escHtml(item.name)}</div>
          ${item.qty ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:1px;">${_escHtml(item.qty)}</div>` : ''}
        </div>
        <div style="display:flex; align-items:center; gap:var(--space-xs);">
          <button class="badge ${pillCls}"
                  data-action="toggle-date" data-id="${item.id}"
                  style="cursor:pointer; border:none; white-space:nowrap;">
            ${_escHtml(pillLabel)}
          </button>
          <button class="btn btn-icon"
                  data-action="delete-food" data-id="${item.id}"
                  style="width:26px; height:26px; font-size:12px; color:var(--text-tertiary); border-color:transparent;"
                  title="Eliminar alimento">✕</button>
        </div>
      </div>

      ${dateOpen ? `
        <div style="border-top:1px solid var(--border); padding:var(--space-sm) var(--space-lg); display:flex; align-items:center; gap:var(--space-sm);">
          <label style="font-size:12px; color:var(--text-secondary); flex:1;">Fecha de vencimiento</label>
          <input type="date" id="food-date-${item.id}"
                 value="${item.expDate || ''}"
                 style="font-size:12px; padding:5px 8px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--bg-card); color:var(--text-primary);" />
          <button class="btn"
                  data-action="save-food-date" data-id="${item.id}"
                  style="font-size:12px; padding:5px 10px; background:var(--teal); color:white; border:none; border-radius:var(--radius-sm);">
            OK
          </button>
          ${item.expDate ? `
            <button data-action="clear-food-date" data-id="${item.id}"
                    style="font-size:11px; background:none; border:none; color:var(--text-tertiary); cursor:pointer; padding:4px;">
              Borrar
            </button>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

let _addFoodOpen = false;

function _buildAddFoodForm() {
  if (!_addFoodOpen) return `<div id="add-food-form"></div>`;

  return `
    <div id="add-food-form" style="background:var(--bg-card); border:1px solid var(--border);
         border-radius:var(--radius-lg); padding:var(--space-md) var(--space-lg); margin-bottom:var(--space-sm);">
      <div style="font-size:13px; font-weight:500; margin-bottom:var(--space-sm);">Nuevo alimento</div>
      <input id="af-name" type="text" placeholder="Nombre *" maxlength="80" autocomplete="off"
             style="${_inputStyle()}" />
      <input id="af-qty"  type="text" placeholder="Cantidad / descripción" maxlength="80" autocomplete="off"
             style="${_inputStyle()}" />
      <div id="af-error" style="font-size:12px; color:var(--danger); margin-bottom:var(--space-sm); display:none;"></div>
      <div style="display:flex; gap:var(--space-sm);">
        <button data-action="cancel-add-food" class="btn btn-outline" style="flex:1;">Cancelar</button>
        <button data-action="confirm-add-food" class="btn btn-primary" style="flex:1;">Agregar</button>
      </div>
    </div>
  `;
}

// ── Sección revisión anual ────────────────────────────────

function _buildReviewSection() {
  const dateLabel = _lastReview
    ? (() => {
        const [y, m, d] = _lastReview.split('-');
        return `${d}/${m}/${y}`;
      })()
    : null;

  const text = dateLabel
    ? `Última revisión anual: <strong>${dateLabel}</strong>.`
    : 'Aún no registraste una revisión anual.';

  return `
    <div class="info-note is-warn" style="margin-top:var(--space-lg); margin-bottom:var(--space-lg);">
      <span class="info-note-icon">🗓️</span>
      <div style="flex:1;">
        <div style="margin-bottom:var(--space-xs);">${text}
          Revisá y rotá los suministros <strong>una vez al año</strong>.
          Las necesidades varían según tu zona — consultá también a los servicios de
          protección civil locales.
        </div>
        <button class="btn btn-ghost" data-action="mark-review"
                style="font-size:12px; padding:4px 0; color:var(--warn);">
          Marcar revisión hoy →
        </button>
      </div>
    </div>
  `;
}

// ── Acciones ──────────────────────────────────────────────

function _updateCalc(key, delta) {
  const next = key === 'persons'
    ? Math.max(1, Math.min(30, _persons + delta))
    : Math.max(1, Math.min(30, _days    + delta));

  const validation = key === 'persons'
    ? validateSuppliesConfig(next, _days)
    : validateSuppliesConfig(_persons, next);

  if (!validation.valid) return;

  if (key === 'persons') _persons = next;
  else                   _days    = next;

  saveSuppliesConfig({ persons: _persons, days: _days });

  // Actualizar solo los valores numéricos sin re-render completo
  document.getElementById('val-persons').textContent = _persons;
  document.getElementById('val-days').textContent    = _days;
  const water = calcWater(_persons, _days, DEFAULTS.LITERS_PP);
  const cals  = calcCalories(_persons, DEFAULTS.CALORIES_PP);
  document.getElementById('res-water').textContent     = water + ' L';
  document.getElementById('res-water-sub').textContent = `${DEFAULTS.LITERS_PP}L × ${_persons} × ${_days} días`;
  document.getElementById('res-cal').textContent       = formatNumber(cals);
  document.getElementById('res-cal-sub').textContent   = `~${formatNumber(DEFAULTS.CALORIES_PP)} kcal × ${_persons} personas`;
}

function _toggleWater(key) {
  _waterChecks[key] = !_waterChecks[key];
  _render();
}

function _toggleFoodDate(id) {
  _dateOpenId = _dateOpenId === id ? null : id;
  _render();
  if (_dateOpenId) {
    setTimeout(() => {
      _container?.querySelector(`#food-date-${id}`)?.focus();
    }, 50);
  }
}

function _saveFoodDate(id, dateValue) {
  const item = _foodItems.find(f => f.id === id);
  if (!item) return;

  const validation = validateInventoryItem({ name: item.name, expDate: dateValue || '' });
  if (!validation.valid) { App.toast(validation.errors[0]); return; }

  item.expDate = dateValue || '';
  _dateOpenId  = null;
  _persistFood();
  App.toast('Fecha guardada ✓');
}

function _clearFoodDate(id) {
  const item = _foodItems.find(f => f.id === id);
  if (!item) return;
  item.expDate = '';
  _dateOpenId  = null;
  _persistFood();
}

function _addFoodItem(name, qty) {
  const trimmed    = name.trim();
  const validation = validateInventoryItem({ name: trimmed, expDate: '' });
  if (!validation.valid) {
    const errEl = _container?.querySelector('#af-error');
    if (errEl) { errEl.textContent = validation.errors[0]; errEl.style.display = 'block'; }
    return;
  }
  _foodItems.push({
    id:      'fc-' + Date.now(),
    icon:    '🍱',
    name:    trimmed,
    qty:     qty.trim(),
    expDate: '',
    checks:  [],
  });
  _addFoodOpen = false;
  _persistFood();
  App.toast('Alimento agregado ✓');
}

function _deleteFoodItem(id) {
  _foodItems = _foodItems.filter(f => f.id !== id);
  if (_dateOpenId === id) _dateOpenId = null;
  _persistFood();
  App.toast('Alimento eliminado');
}

function _markReview() {
  const today = new Date().toISOString().slice(0, 10);
  _lastReview = today;
  saveLastReview(today);
  _render();
  refreshDashboard();
  App.toast('Revisión anual registrada ✓');
}

function _persistFood() {
  saveFoodItems(_foodItems);
  _render();
  refreshDashboard();
}

// ── Binding de eventos ────────────────────────────────────

let _abortCtrl = null;

function _bindEvents() {
  if (_abortCtrl) _abortCtrl.abort();
  _abortCtrl = new AbortController();
  const sig = { signal: _abortCtrl.signal };

  _container?.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    switch (action) {
      case 'calc':
        _updateCalc(el.dataset.key, Number(el.dataset.delta));
        break;

      case 'toggle-water':
        _toggleWater(el.dataset.key);
        break;

      case 'toggle-date':
        _toggleFoodDate(el.dataset.id);
        break;

      case 'save-food-date': {
        const val = _container.querySelector(`#food-date-${el.dataset.id}`)?.value || '';
        _saveFoodDate(el.dataset.id, val);
        break;
      }

      case 'clear-food-date':
        _clearFoodDate(el.dataset.id);
        break;

      case 'delete-food':
        _deleteFoodItem(el.dataset.id);
        break;

      case 'add-food':
        _addFoodOpen = true;
        _render();
        setTimeout(() => _container?.querySelector('#af-name')?.focus(), 50);
        break;

      case 'cancel-add-food':
        _addFoodOpen = false;
        _render();
        break;

      case 'confirm-add-food': {
        const name = _container.querySelector('#af-name')?.value || '';
        const qty  = _container.querySelector('#af-qty')?.value  || '';
        _addFoodItem(name, qty);
        break;
      }

      case 'mark-review':
        _markReview();
        break;
    }
  }, sig);

  // Enter en input de fecha y en formulario nuevo alimento
  _container?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.type === 'date') {
      const id = e.target.id.replace('food-date-', '');
      _saveFoodDate(id, e.target.value);
    }
    if (e.key === 'Enter' && e.target.id === 'af-name') {
      _container.querySelector('[data-action="confirm-add-food"]')?.click();
    }
  }, sig);
}

// ── Helpers ───────────────────────────────────────────────

function _expPillClass(status) {
  if (status === EXP_STATUS.EXPIRED) return 'badge-danger';
  if (status === EXP_STATUS.SOON)    return 'badge-warn';
  if (status === EXP_STATUS.OK)      return 'badge-ok';
  return 'badge-neutral';
}

function _inputStyle() {
  return `width:100%; font-size:13px; padding:8px 10px; border:1px solid var(--border);
          border-radius:var(--radius-md); background:var(--bg); color:var(--text-primary);
          margin-bottom:var(--space-sm);`;
}

function _escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
