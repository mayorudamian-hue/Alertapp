/* ============================================================
   EmergenciaApp — Backpack.js
   Pantalla de mochila de emergencia.
   - Checklist por categorías con progreso individual
   - Badges: OK / Falta / Vence pronto
   - Fechas de vencimiento editables por ítem
   - Agregar ítems personalizados
   - Eliminar ítems que no apliquen
   - Buscador en tiempo real
   - Persiste en localStorage
   ============================================================ */

'use strict';

import { EXP_STATUS }              from '../core/constants.js';
import { expiryStatus }            from '../core/utils.js';
import { validateInventoryItem }   from '../core/validators.js';
import { loadInventory, saveInventory } from '../data/storage.js';
import { refresh as refreshDashboard }  from './Dashboard.js';

import DEFAULT_INVENTORY from '../data/inventory.json' assert { type: 'json' };

// ── Estado interno ────────────────────────────────────────
let _container  = null;
let _inventory  = [];          // copia de trabajo en memoria
let _query      = '';          // filtro de búsqueda actual
let _addOpen    = false;       // formulario de agregar abierto
let _dateOpen   = null;        // id del ítem con fecha abierta: 'catIdx-itemIdx'

// ── Entrada pública ───────────────────────────────────────

/**
 * Monta la pantalla en el contenedor.
 * @param {HTMLElement} container
 */
export function renderBackpack(container) {
  _container = container;
  _inventory = loadInventory(DEFAULT_INVENTORY);
  _render();
}

// ── Render principal ──────────────────────────────────────

function _render() {
  if (!_container) return;

  const filtered = _filterInventory(_inventory, _query);
  const allItems = _inventory.flatMap(c => c.items);
  const done     = allItems.filter(i => i.done).length;
  const total    = allItems.length;
  const pct      = total > 0 ? Math.round(done / total * 100) : 0;

  _container.innerHTML = `
    ${_buildTopBar(pct, done, total)}
    ${_buildAddForm()}
    ${_buildInfoNote()}
    ${_buildCategoryList(filtered)}
  `;

  _bindEvents();
}

// ── Barra superior ────────────────────────────────────────

function _buildTopBar(pct, done, total) {
  return `
    <div style="margin-bottom: var(--space-md);">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-sm);">
        <div>
          <span style="font-size:22px; font-weight:600; letter-spacing:-0.02em;">${done}</span>
          <span style="font-size:13px; color:var(--text-secondary);"> / ${total} ítems listos</span>
        </div>
        <span style="font-size:13px; font-weight:500; color:${pct === 100 ? 'var(--ok)' : pct >= 60 ? 'var(--warn)' : 'var(--danger)'};">${pct}%</span>
      </div>
      <div style="height:6px; background:var(--bg-subtle); border-radius:var(--radius-full); overflow:hidden; border:1px solid var(--border);">
        <div style="height:100%; width:${pct}%; background:${pct === 100 ? 'var(--ok)' : pct >= 60 ? 'var(--warn)' : 'var(--danger)'}; border-radius:var(--radius-full); transition:width 0.4s ease;"></div>
      </div>
    </div>

    <div style="display:flex; gap:var(--space-sm); margin-bottom:var(--space-md);">
      <input
        type="search"
        id="bp-search"
        placeholder="Buscar elemento…"
        value="${_escHtml(_query)}"
        autocomplete="off"
        style="flex:1; font-size:13px; padding:8px 12px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary);"
      />
      <button id="bp-add-btn" class="btn btn-primary" style="white-space:nowrap; padding:8px 14px;">
        + Agregar
      </button>
    </div>
  `;
}

// ── Formulario agregar ítem ───────────────────────────────

function _buildAddForm() {
  if (!_addOpen) return `<div id="bp-add-form"></div>`;

  const catOptions = _inventory
    .map(c => `<option value="${_escHtml(c.cat)}">${_escHtml(c.cat)}</option>`)
    .join('');

  return `
    <div id="bp-add-form" style="
      background:var(--bg-card);
      border:1px solid var(--border);
      border-radius:var(--radius-lg);
      padding:var(--space-md) var(--space-lg);
      margin-bottom:var(--space-md);
    ">
      <div style="font-size:13px; font-weight:500; margin-bottom:var(--space-sm);">Nuevo ítem</div>
      <input id="bp-new-name" type="text" placeholder="Nombre del elemento *"
        style="width:100%; font-size:13px; padding:8px 10px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg); color:var(--text-primary); margin-bottom:var(--space-sm);"
        maxlength="80" autocomplete="off" />
      <input id="bp-new-meta" type="text" placeholder="Nota opcional (ej: x2 unidades)"
        style="width:100%; font-size:13px; padding:8px 10px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg); color:var(--text-primary); margin-bottom:var(--space-sm);"
        maxlength="100" autocomplete="off" />
      <select id="bp-new-cat"
        style="width:100%; font-size:13px; padding:8px 10px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg); color:var(--text-primary); margin-bottom:var(--space-md);">
        ${catOptions}
      </select>
      <div id="bp-add-error" style="font-size:12px; color:var(--danger); margin-bottom:var(--space-sm); display:none;"></div>
      <div style="display:flex; gap:var(--space-sm);">
        <button id="bp-add-cancel" class="btn btn-outline" style="flex:1;">Cancelar</button>
        <button id="bp-add-confirm" class="btn btn-primary" style="flex:1;">Agregar ítem</button>
      </div>
    </div>
  `;
}

// ── Nota informativa ──────────────────────────────────────

function _buildInfoNote() {
  return `
    <div class="info-note is-warn" style="margin-bottom:var(--space-md);">
      <span class="info-note-icon">ℹ️</span>
      <span>No todos los elementos son necesarios en tu caso. Eliminá los que no apliquen con el botón <strong>✕</strong>.</span>
    </div>
  `;
}

// ── Lista de categorías ───────────────────────────────────

function _buildCategoryList(filtered) {
  if (filtered.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        No se encontraron ítems para "<em>${_escHtml(_query)}</em>".
      </div>
    `;
  }

  return filtered.map(({ cat, catIdx, items }) => {
    const done  = items.filter(i => i.done).length;
    const total = items.length;
    const pct   = total > 0 ? Math.round(done / total * 100) : 0;

    const itemsHtml = items.map(({ item, itemIdx }) =>
      _buildItem(item, catIdx, itemIdx)
    ).join('');

    return `
      <div style="margin-bottom:var(--space-md);">
        <div class="progress-cat">
          <span class="progress-cat-label">${_escHtml(cat)}</span>
          <div class="progress-cat-bar">
            <div class="progress-cat-fill" style="width:${pct}%;"></div>
          </div>
          <span class="progress-cat-count">${done}/${total}</span>
        </div>
        <div class="card">
          ${itemsHtml}
        </div>
      </div>
    `;
  }).join('');
}

// ── Ítem individual ───────────────────────────────────────

function _buildItem(item, catIdx, itemIdx) {
  const uid        = `${catIdx}-${itemIdx}`;
  const expInfo    = expiryStatus(item.expDate || '');
  const badgeCls   = _badgeClass(item, expInfo);
  const badgeLabel = _badgeLabel(item, expInfo);
  const dateOpen   = _dateOpen === uid;

  return `
    <div class="check-item" style="padding: var(--space-sm) var(--space-md); display:flex; flex-direction:column; gap:0;">
      <div style="display:flex; align-items:flex-start; gap:var(--space-sm);">

        <!-- Checkbox -->
        <div class="cb ${item.done ? 'is-checked' : ''}"
             data-action="toggle" data-uid="${uid}"
             style="margin-top:2px; flex-shrink:0; cursor:pointer;"
             role="checkbox" aria-checked="${item.done}" aria-label="${_escHtml(item.name)}">
        </div>

        <!-- Nombre y meta -->
        <div style="flex:1; min-width:0; cursor:pointer;" data-action="toggle" data-uid="${uid}">
          <div class="check-item-name ${item.done ? 'is-done' : ''}">${_escHtml(item.name)}</div>
          ${item.meta ? `<div class="check-item-meta">${_escHtml(item.meta)}</div>` : ''}
        </div>

        <!-- Badge de vencimiento -->
        <button class="badge ${badgeCls}"
                data-action="toggle-date" data-uid="${uid}"
                style="cursor:pointer; border:none; margin-top:2px;"
                title="Editar fecha de vencimiento">
          ${badgeLabel}
        </button>

        <!-- Botón eliminar -->
        <button class="btn btn-icon"
                data-action="delete" data-uid="${uid}"
                title="Eliminar ítem"
                style="width:28px; height:28px; font-size:13px; color:var(--text-tertiary); border-color:transparent; flex-shrink:0;">
          ✕
        </button>

      </div>

      <!-- Campo de fecha (colapsable) -->
      ${dateOpen ? _buildDateField(item, uid) : ''}
    </div>
  `;
}

// ── Campo de fecha ────────────────────────────────────────

function _buildDateField(item, uid) {
  return `
    <div class="date-field" style="margin-left:28px;">
      <label for="date-${uid}">Fecha de vencimiento</label>
      <input type="date" id="date-${uid}"
             value="${item.expDate || ''}"
             style="font-size:12px; padding:5px 8px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--bg-card); color:var(--text-primary);" />
      <button class="btn btn-save" data-action="save-date" data-uid="${uid}"
              style="font-size:12px; padding:5px 10px; background:var(--teal); color:white; border:none; border-radius:var(--radius-sm);">
        Guardar
      </button>
      ${item.expDate ? `
        <button data-action="clear-date" data-uid="${uid}"
                style="font-size:11px; background:none; border:none; color:var(--text-tertiary); cursor:pointer; padding:4px;">
          Borrar
        </button>` : ''}
    </div>
  `;
}

// ── Helpers de badge ──────────────────────────────────────

function _badgeClass(item, expInfo) {
  if (expInfo.status === EXP_STATUS.EXPIRED) return 'badge-danger';
  if (expInfo.status === EXP_STATUS.SOON)    return 'badge-warn';
  if (expInfo.status === EXP_STATUS.OK)      return 'badge-ok';
  // Sin fecha: usar estado del ítem
  return item.done ? 'badge-ok' : 'badge-neutral';
}

function _badgeLabel(item, expInfo) {
  if (expInfo.status === EXP_STATUS.EXPIRED) return expInfo.label;
  if (expInfo.status === EXP_STATUS.SOON)    return expInfo.label;
  if (expInfo.status === EXP_STATUS.OK)      return expInfo.label;
  return item.done ? 'OK' : 'Falta';
}

// ── Filtrado ──────────────────────────────────────────────

function _filterInventory(inventory, query) {
  const q = query.trim().toLowerCase();

  return inventory
    .map((cat, catIdx) => {
      const items = cat.items
        .map((item, itemIdx) => ({ item, itemIdx }))
        .filter(({ item }) =>
          !q ||
          item.name.toLowerCase().includes(q) ||
          (item.meta && item.meta.toLowerCase().includes(q))
        );
      return { cat: cat.cat, catIdx, items };
    })
    .filter(c => c.items.length > 0);
}

// ── Parsing de uid ────────────────────────────────────────

function _parseUid(uid) {
  const [catIdx, itemIdx] = uid.split('-').map(Number);
  return { catIdx, itemIdx };
}

// ── Acciones sobre datos ──────────────────────────────────

function _toggleItem(uid) {
  const { catIdx, itemIdx } = _parseUid(uid);
  const item = _inventory[catIdx]?.items[itemIdx];
  if (!item) return;
  item.done = !item.done;
  _save();
}

function _deleteItem(uid) {
  const { catIdx, itemIdx } = _parseUid(uid);
  const cat = _inventory[catIdx];
  if (!cat) return;
  cat.items.splice(itemIdx, 1);
  // Si la categoría quedó vacía, eliminarla también
  if (cat.items.length === 0) {
    _inventory.splice(catIdx, 1);
  }
  if (_dateOpen === uid) _dateOpen = null;
  _save();
}

function _saveDateForItem(uid, dateValue) {
  const { catIdx, itemIdx } = _parseUid(uid);
  const item = _inventory[catIdx]?.items[itemIdx];
  if (!item) return;

  const validation = validateInventoryItem({ name: item.name, expDate: dateValue || '' });
  if (!validation.valid) {
    _showAddError(validation.errors[0]);
    return;
  }

  item.expDate = dateValue || '';
  // Actualizar badge automáticamente
  const expInfo = expiryStatus(item.expDate);
  if (expInfo.status === EXP_STATUS.EXPIRED || expInfo.status === EXP_STATUS.SOON) {
    item.badge = 'exp';
  } else if (item.done) {
    item.badge = 'ok';
  } else {
    item.badge = 'miss';
  }

  _dateOpen = null;
  _save();
}

function _clearDateForItem(uid) {
  const { catIdx, itemIdx } = _parseUid(uid);
  const item = _inventory[catIdx]?.items[itemIdx];
  if (!item) return;
  item.expDate = '';
  item.badge   = item.done ? 'ok' : 'miss';
  _dateOpen = null;
  _save();
}

function _addItem(name, meta, catName) {
  const trimmedName = name.trim();
  const validation  = validateInventoryItem({ name: trimmedName, expDate: '' });

  if (!validation.valid) {
    _showAddError(validation.errors[0]);
    return false;
  }

  const newItem = {
    id:      'custom-' + Date.now(),
    name:    trimmedName,
    meta:    meta.trim(),
    done:    false,
    badge:   'miss',
    expDate: '',
  };

  const cat = _inventory.find(c => c.cat === catName);
  if (cat) {
    cat.items.push(newItem);
  } else {
    // Categoría nueva (no debería pasar normalmente, pero por si acaso)
    _inventory.push({ cat: catName, items: [newItem] });
  }

  _addOpen = false;
  _save();
  return true;
}

// ── Persistencia ──────────────────────────────────────────

function _save() {
  saveInventory(_inventory);
  _render();
  refreshDashboard();
}

// ── Binding de eventos ────────────────────────────────────

function _bindEvents() {
  if (!_container) return;

  // Delegación de eventos en el contenedor
  _container.addEventListener('click', _handleClick, { once: true });
  _container.addEventListener('keydown', _handleKeydown, { once: true });

  // Búsqueda en tiempo real
  const searchInput = _container.querySelector('#bp-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      _query = e.target.value;
      _render();
    }, { once: true });
    // Enfocar solo si no es móvil (evita abrir teclado al entrar)
    if (window.innerWidth > 600) searchInput.focus();
  }

  // Botón abrir formulario
  _container.querySelector('#bp-add-btn')?.addEventListener('click', () => {
    _addOpen = true;
    _render();
    _container.querySelector('#bp-new-name')?.focus();
  }, { once: true });

  // Formulario: cancelar
  _container.querySelector('#bp-add-cancel')?.addEventListener('click', () => {
    _addOpen = false;
    _render();
  }, { once: true });

  // Formulario: confirmar
  _container.querySelector('#bp-add-confirm')?.addEventListener('click', () => {
    const name = _container.querySelector('#bp-new-name')?.value || '';
    const meta = _container.querySelector('#bp-new-meta')?.value || '';
    const cat  = _container.querySelector('#bp-new-cat')?.value  || '';
    _addItem(name, meta, cat);
  }, { once: true });

  // Enter en campo nombre del formulario
  _container.querySelector('#bp-new-name')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      _container.querySelector('#bp-add-confirm')?.click();
    }
  }, { once: true });
}

function _handleClick(e) {
  const action = e.target.closest('[data-action]')?.dataset?.action;
  const uid    = e.target.closest('[data-action]')?.dataset?.uid;

  if (!action) {
    // Re-registrar para el próximo click
    _container?.addEventListener('click', _handleClick, { once: true });
    return;
  }

  switch (action) {
    case 'toggle':
      _toggleItem(uid);
      break;

    case 'toggle-date':
      _dateOpen = _dateOpen === uid ? null : uid;
      _render();
      // Enfocar el input de fecha
      setTimeout(() => {
        _container?.querySelector(`#date-${uid}`)?.focus();
      }, 50);
      break;

    case 'save-date': {
      const dateVal = _container.querySelector(`#date-${uid}`)?.value || '';
      _saveDateForItem(uid, dateVal);
      break;
    }

    case 'clear-date':
      _clearDateForItem(uid);
      break;

    case 'delete':
      _deleteItem(uid);
      break;

    default:
      _container?.addEventListener('click', _handleClick, { once: true });
  }
}

function _handleKeydown(e) {
  // Guardar fecha con Enter
  if (e.key === 'Enter' && e.target.type === 'date') {
    const uid = e.target.id.replace('date-', '');
    _saveDateForItem(uid, e.target.value);
  }
  _container?.addEventListener('keydown', _handleKeydown, { once: true });
}

// ── UI helpers ────────────────────────────────────────────

function _showAddError(msg) {
  const el = _container?.querySelector('#bp-add-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function _escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
