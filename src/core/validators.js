/* ============================================================
   EmergenciaApp — validators.js
   Validación de datos antes de guardarlos en storage.
   Devuelven { valid: boolean, errors: string[] }
   ============================================================ */

'use strict';

// ── Contacto ──────────────────────────────────────────────
/**
 * Valida un objeto contacto.
 * @param {object} contact
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateContact(contact) {
  const errors = [];

  if (!contact || typeof contact !== 'object') {
    return { valid: false, errors: ['Datos de contacto inválidos.'] };
  }

  if (!contact.name || contact.name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres.');
  }

  if (contact.phone && !/^[\d\s\-+()]{6,20}$/.test(contact.phone.trim())) {
    errors.push('El teléfono contiene caracteres inválidos.');
  }

  if (!contact.group) {
    errors.push('Debe seleccionarse un grupo para el contacto.');
  }

  return { valid: errors.length === 0, errors };
}

// ── Ítem de inventario ────────────────────────────────────
/**
 * Valida un ítem de la mochila o suministros.
 * @param {object} item
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateInventoryItem(item) {
  const errors = [];

  if (!item || typeof item !== 'object') {
    return { valid: false, errors: ['Ítem inválido.'] };
  }

  if (!item.name || item.name.trim().length < 2) {
    errors.push('El nombre del ítem debe tener al menos 2 caracteres.');
  }

  if (item.name && item.name.trim().length > 80) {
    errors.push('El nombre no puede superar los 80 caracteres.');
  }

  if (item.expDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(item.expDate)) {
      errors.push('La fecha de vencimiento debe tener el formato AAAA-MM-DD.');
    } else {
      const d = new Date(item.expDate + 'T00:00:00');
      if (isNaN(d.getTime())) {
        errors.push('La fecha de vencimiento no es válida.');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Punto de encuentro ────────────────────────────────────
/**
 * Valida un punto de encuentro.
 * @param {string} value
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMeetingPoint(value) {
  const errors = [];

  if (typeof value !== 'string') {
    return { valid: false, errors: ['Valor inválido.'] };
  }

  const trimmed = value.trim();

  if (trimmed.length > 0 && trimmed.length < 3) {
    errors.push('El punto de encuentro debe tener al menos 3 caracteres.');
  }

  if (trimmed.length > 120) {
    errors.push('El punto de encuentro no puede superar los 120 caracteres.');
  }

  return { valid: errors.length === 0, errors };
}

// ── Configuración de suministros ──────────────────────────
/**
 * Valida la configuración de personas y días.
 * @param {number} persons
 * @param {number} days
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSuppliesConfig(persons, days) {
  const errors = [];

  if (!Number.isInteger(persons) || persons < 1 || persons > 30) {
    errors.push('La cantidad de personas debe ser entre 1 y 30.');
  }

  if (!Number.isInteger(days) || days < 1 || days > 30) {
    errors.push('Los días de reserva deben ser entre 1 y 30.');
  }

  return { valid: errors.length === 0, errors };
}
