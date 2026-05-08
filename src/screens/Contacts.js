/* ============================================================
   EmergenciaApp — Contacts.js
   Pantalla de contactos de emergencia.
   Grupos: Congregación, Mi contacto de emergencia,
           Familia, Amigo, Servicios de emergencia.
   - Agregar / editar / eliminar contactos
   - Llamada directa con tel:
   - Nota explicativa para "Mi contacto de emergencia"
   - Persiste en localStorage
   ============================================================ */

'use strict';

import { CONTACT_GROUPS, CONTACT_GROUP_LABELS } from '../core/constants.js';
import { initials }                              from '../core/utils.js';
import { validateContact }                       from '../core/validators.js';
import { loadContacts, saveContacts }            from '../data/storage.js';
import { refresh as refreshDashboard }           from './Dashboard.js';

// ── Datos iniciales ───────────────────────────────────────
const DEFAULT_CONTACTS = [
  { id: 'c01', name: 'Superintendente de grupo', role: 'Sup. de grupo',  phone: '', group: CONTACT_GROUPS.CONGREGACION, color: '#ECEAFE:#4E45B0' },
  { id: 'c02', name: 'Auxiliar de grupo',      role: 'Aux. de grupo',  phone: '', group: CONTACT_GROUPS.CONGREGACION, color: '#ECEAFE:#4E45B0' },
  { id: 'c03', name: '',                        role: 'Contacto personal de emergencia', phone: '', group: CONTACT_GROUPS.EMERGENCIA,  color: '#F7EDD6:#B07213' },
  { id: 'c04', name: '',                        role: 'Familia',        phone: '', group: CONTACT_GROUPS.FAMILIA,      color: '#DCF0EA:#0E6650' },
  { id: 'c05', name: '',                        role: 'Amigo',          phone: '', group: CONTACT_GROUPS.AMIGO,        color: '#DFEcF8:#1A5A96' },
  { id: 'c06', name: 'Bomberos Voluntarios',   role: 'Emergencias',    phone: '100', group: CONTACT_GROUPS.SERVICIOS, color: '#F5DEDD:#C93A39' },
  { id: 'c07', name: 'SAME',                   role: 'Ambulancias',    phone: '107', group: CONTACT_GROUPS.SERVICIOS, color: '#F5DEDD:#C93A39' },
  { id: 'c08', name: 'Defensa Civil',          role: 'Desastres',      phone: '103', group: CONTACT_GROUPS.SERVICIOS, color: '#F5DEDD:#C93A39' },
];

// Orden de grupos para renderizar
const GROUP_ORDER = [
  CONTACT_GROUPS.CONGREGACION,
  CONTACT_GROUPS.EMERGENCIA,
  CONTACT_GROUPS.FAMILIA,
  CONTACT_GROUPS.AMIGO,
  CONTACT_GROUPS.SERVICIOS,
];

// ── Estado interno ────────────────────────────────────────
let _container = null;
let _contacts  = [];
let _editId    = null;   // id del contacto en edición (null = ninguno)
let _addGroup  = null;   // grupo para el formulario de nuevo contacto

// ── Entrada pública ───────────────────────────────────────

export function renderContacts(container) {
  _container = container;
  _contacts  = loadContacts(DEFAULT_CONTACTS);
  _render();
}

// ── Render principal ──────────────────────────────────────

function _render() {
  if (!_container) return;
  _container.innerHTML = _buildHTML();
  _bindEvents();
}

function _buildHTML() {
  const grouped = _groupContacts();

  const groupsHtml = GROUP_ORDER.map(groupId => {
    const contacts = grouped[groupId] || [];
    return _buildGroup(groupId, contacts);
  }).join('');

  return `
    ${_buildEmergencyNote()}
    ${groupsHtml}
    ${_buildAddForm()}
  `;
}

// ── Nota de emergencia ────────────────────────────────────

function _buildEmergencyNote() {
  return `
    <div class="info-note is-warn" style="margin-bottom:var(--space-lg);">
      <span class="info-note-icon">ℹ️</span>
      <div>
        <strong>Mi contacto de emergencia</strong> es la persona a quien se llamará
        si no se puede dar con el publicador. Asegurate de que esté al tanto.
      </div>
    </div>
  `;
}

// ── Grupo de contactos ────────────────────────────────────

function _buildGroup(groupId, contacts) {
  const label = CONTACT_GROUP_LABELS[groupId] || groupId;

  const cardsHtml = contacts.map(c => _buildCard(c)).join('');

  // Botón "Agregar" — no se muestra en Servicios de emergencia
  const canAdd = groupId !== CONTACT_GROUPS.SERVICIOS;
  const addBtn = canAdd ? `
    <button class="btn btn-dashed" data-action="open-add" data-group="${groupId}"
            style="margin-top:${contacts.length ? 'var(--space-xs)' : '0'};">
      + Agregar ${_groupSingular(groupId)}
    </button>
  ` : '';

  // Formulario inline si está abierto para este grupo
  const form = (_addGroup === groupId && _editId === null)
    ? _buildInlineForm(null, groupId)
    : '';

  return `
    <div style="margin-bottom:var(--space-lg);">
      <div class="contact-group-title">${_escHtml(label)}</div>
      ${cardsHtml}
      ${form}
      ${addBtn}
    </div>
  `;
}

// ── Tarjeta de contacto ───────────────────────────────────

function _buildCard(contact) {
  // Si está en modo edición, mostrar formulario en su lugar
  if (_editId === contact.id) {
    return _buildInlineForm(contact, contact.group);
  }

  const [bg, fg]    = (contact.color || '#F1EFE8:#5F5E5A').split(':');
  const ini         = initials(contact.name);
  const isEmpty     = !contact.name.trim();
  const hasPhone    = contact.phone && contact.phone.trim();
  const isSvc       = contact.group === CONTACT_GROUPS.SERVICIOS;

  return `
    <div class="contact-card" style="margin-bottom:var(--space-sm);">

      <!-- Avatar -->
      <div class="contact-avatar" style="background:${bg}; color:${fg};">
        ${isEmpty ? '?' : _escHtml(ini)}
      </div>

      <!-- Info -->
      <div class="contact-info">
        <div class="contact-name">
          ${isEmpty
            ? `<span style="color:var(--text-tertiary); font-style:italic;">Sin asignar</span>`
            : _escHtml(contact.name)}
        </div>
        <div class="contact-role">${_escHtml(contact.role)}</div>
        ${hasPhone ? `<div class="contact-phone">${_escHtml(contact.phone)}</div>` : ''}
      </div>

      <!-- Acciones -->
      <div style="display:flex; gap:var(--space-xs);">
        ${hasPhone ? `
          <a href="tel:${_escHtml(contact.phone)}"
             class="contact-action btn btn-icon"
             title="Llamar a ${_escHtml(contact.name || contact.role)}"
             style="text-decoration:none; display:flex; align-items:center; justify-content:center;">
            📞
          </a>
        ` : ''}
        <button class="contact-action btn btn-icon"
                data-action="edit" data-id="${contact.id}"
                title="Editar contacto">
          ✏️
        </button>
        ${!isSvc ? `
          <button class="contact-action btn btn-icon"
                  data-action="delete" data-id="${contact.id}"
                  title="Eliminar contacto"
                  style="color:var(--text-tertiary);">
            ✕
          </button>
        ` : ''}
      </div>

    </div>
  `;
}

// ── Formulario inline (nuevo o edición) ──────────────────

function _buildInlineForm(contact, groupId) {
  const isEdit  = !!contact;
  const val     = v => _escHtml(contact?.[v] || '');
  const isSvc   = groupId === CONTACT_GROUPS.SERVICIOS;

  // Opciones de grupo
  const groupOptions = GROUP_ORDER.map(gId => `
    <option value="${gId}" ${(contact?.group || groupId) === gId ? 'selected' : ''}>
      ${_escHtml(CONTACT_GROUP_LABELS[gId])}
    </option>
  `).join('');

  return `
    <div id="contact-form-${contact?.id || 'new'}"
         style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg);
                padding:var(--space-md) var(--space-lg); margin-bottom:var(--space-sm);">
      <div style="font-size:13px; font-weight:500; margin-bottom:var(--space-sm);">
        ${isEdit ? 'Editar contacto' : 'Nuevo contacto'}
      </div>

      <input id="cf-name" type="text" placeholder="Nombre *"
             value="${val('name')}" maxlength="60" autocomplete="off"
             style="${_inputStyle()}" />

      <input id="cf-role" type="text" placeholder="Rol (ej: Mamá, Vecino…)"
             value="${val('role')}" maxlength="60" autocomplete="off"
             style="${_inputStyle()}" />

      <input id="cf-phone" type="tel" placeholder="Teléfono"
             value="${val('phone')}" maxlength="20" autocomplete="tel"
             style="${_inputStyle()}" />

      ${!isSvc ? `
        <select id="cf-group" style="${_inputStyle()} appearance:none;">
          ${groupOptions}
        </select>
      ` : `<input type="hidden" id="cf-group" value="${groupId}" />`}

      <div id="cf-error"
           style="font-size:12px; color:var(--danger); margin-bottom:var(--space-sm); display:none;"></div>

      <div style="display:flex; gap:var(--space-sm);">
        <button data-action="form-cancel" data-id="${contact?.id || ''}"
                class="btn btn-outline" style="flex:1;">Cancelar</button>
        <button data-action="form-save"   data-id="${contact?.id || ''}"
                class="btn btn-primary"  style="flex:1;">
          ${isEdit ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </div>
  `;
}

function _inputStyle() {
  return `width:100%; font-size:13px; padding:8px 10px; border:1px solid var(--border);
          border-radius:var(--radius-md); background:var(--bg); color:var(--text-primary);
          margin-bottom:var(--space-sm);`;
}

// ── Formulario flotante "Agregar" (sin grupo activo) ──────

function _buildAddForm() {
  // Solo se usa cuando no hay grupo abierto
  return `<div id="contact-add-anchor"></div>`;
}

// ── Agrupado ──────────────────────────────────────────────

function _groupContacts() {
  const map = {};
  GROUP_ORDER.forEach(g => { map[g] = []; });
  _contacts.forEach(c => {
    if (map[c.group]) map[c.group].push(c);
    else map[CONTACT_GROUPS.FAMILIA].push(c); // fallback
  });
  return map;
}

// ── Acciones ──────────────────────────────────────────────

function _openEdit(id) {
  _editId   = id;
  _addGroup = null;
  _render();
  setTimeout(() => {
    _container?.querySelector('#cf-name')?.focus();
  }, 50);
}

function _openAdd(groupId) {
  _addGroup = groupId;
  _editId   = null;
  _render();
  setTimeout(() => {
    _container?.querySelector('#cf-name')?.focus();
  }, 50);
}

function _cancelForm() {
  _editId   = null;
  _addGroup = null;
  _render();
}

function _saveForm(existingId) {
  const name  = _container.querySelector('#cf-name')?.value  || '';
  const role  = _container.querySelector('#cf-role')?.value  || '';
  const phone = _container.querySelector('#cf-phone')?.value || '';
  const group = _container.querySelector('#cf-group')?.value || CONTACT_GROUPS.FAMILIA;

  const validation = validateContact({ name, phone, group });
  if (!validation.valid) {
    const errEl = _container.querySelector('#cf-error');
    if (errEl) { errEl.textContent = validation.errors[0]; errEl.style.display = 'block'; }
    return;
  }

  if (existingId) {
    // Edición
    const idx = _contacts.findIndex(c => c.id === existingId);
    if (idx !== -1) {
      _contacts[idx] = {
        ..._contacts[idx],
        name:  name.trim(),
        role:  role.trim() || _contacts[idx].role,
        phone: phone.trim(),
        group,
      };
    }
  } else {
    // Nuevo
    const color = _groupColor(group);
    _contacts.push({
      id:    'c-' + Date.now(),
      name:  name.trim(),
      role:  role.trim() || CONTACT_GROUP_LABELS[group],
      phone: phone.trim(),
      group,
      color,
    });
  }

  _editId   = null;
  _addGroup = null;
  _save();
  App.toast(existingId ? 'Contacto actualizado ✓' : 'Contacto agregado ✓');
}

function _deleteContact(id) {
  _contacts = _contacts.filter(c => c.id !== id);
  _save();
  App.toast('Contacto eliminado');
}

function _save() {
  saveContacts(_contacts);
  _render();
  refreshDashboard();
}

// ── Eventos ───────────────────────────────────────────────

function _bindEvents() {
  _container?.addEventListener('click', e => {
    const el     = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id     = el.dataset.id   || null;
    const group  = el.dataset.group || null;

    switch (action) {
      case 'edit':        _openEdit(id);           break;
      case 'delete':      _deleteContact(id);      break;
      case 'open-add':    _openAdd(group);         break;
      case 'form-cancel': _cancelForm();           break;
      case 'form-save':   _saveForm(id || null);   break;
    }
  });

  // Enter en campos del formulario
  _container?.querySelectorAll('#cf-name, #cf-role, #cf-phone').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const saveBtn = _container.querySelector('[data-action="form-save"]');
        saveBtn?.click();
      }
    });
  });
}

// ── Helpers ───────────────────────────────────────────────

function _groupSingular(groupId) {
  const map = {
    [CONTACT_GROUPS.CONGREGACION]: 'contacto de congregación',
    [CONTACT_GROUPS.EMERGENCIA]:   'contacto de emergencia',
    [CONTACT_GROUPS.FAMILIA]:      'familiar',
    [CONTACT_GROUPS.AMIGO]:        'amigo',
    [CONTACT_GROUPS.SERVICIOS]:    'servicio',
  };
  return map[groupId] || 'contacto';
}

function _groupColor(groupId) {
  const map = {
    [CONTACT_GROUPS.CONGREGACION]: '#ECEAFE:#4E45B0',
    [CONTACT_GROUPS.EMERGENCIA]:   '#F7EDD6:#B07213',
    [CONTACT_GROUPS.FAMILIA]:      '#DCF0EA:#0E6650',
    [CONTACT_GROUPS.AMIGO]:        '#DFEcF8:#1A5A96',
    [CONTACT_GROUPS.SERVICIOS]:    '#F5DEDD:#C93A39',
  };
  return map[groupId] || '#F1EFE8:#5F5E5A';
}

function _escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
