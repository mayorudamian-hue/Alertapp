/* ============================================================
   EmergenciaApp — storage.js
   Capa de abstracción sobre localStorage.
   Serializa/deserializa JSON con manejo de errores.
   ============================================================ */

'use strict';

import { STORAGE_KEYS } from '../core/constants.js';

// ── Primitivas ────────────────────────────────────────────

/**
 * Guarda un valor en localStorage (serializado a JSON).
 * @param {string} key
 * @param {*} value
 * @returns {boolean} — true si se guardó correctamente
 */
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`[storage] Error al guardar "${key}":`, e);
    return false;
  }
}

/**
 * Recupera un valor de localStorage.
 * @param {string} key
 * @param {*} fallback — valor por defecto si no existe o hay error
 * @returns {*}
 */
export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[storage] Error al leer "${key}":`, e);
    return fallback;
  }
}

/**
 * Elimina una clave de localStorage.
 * @param {string} key
 */
export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`[storage] Error al eliminar "${key}":`, e);
  }
}

/**
 * Borra todos los datos de la app (solo claves propias).
 */
export function clearAll() {
  Object.values(STORAGE_KEYS).forEach(key => remove(key));
}

// ── Inventario (mochila) ──────────────────────────────────

export function saveInventory(inventory) {
  return save(STORAGE_KEYS.INVENTORY, inventory);
}

export function loadInventory(defaultData) {
  return load(STORAGE_KEYS.INVENTORY, defaultData);
}

// ── Contactos ─────────────────────────────────────────────

export function saveContacts(contacts) {
  return save(STORAGE_KEYS.CONTACTS, contacts);
}

export function loadContacts(defaultData) {
  return load(STORAGE_KEYS.CONTACTS, defaultData);
}

// ── Puntos de encuentro ───────────────────────────────────

export function saveMeetingPoints(points) {
  return save(STORAGE_KEYS.MEETING_POINTS, points);
}

export function loadMeetingPoints(defaultData = {}) {
  return load(STORAGE_KEYS.MEETING_POINTS, defaultData);
}

// ── Alimentos / suministros ───────────────────────────────

export function saveFoodItems(items) {
  return save(STORAGE_KEYS.FOOD_ITEMS, items);
}

export function loadFoodItems(defaultData) {
  return load(STORAGE_KEYS.FOOD_ITEMS, defaultData);
}

// ── Configuración de suministros ──────────────────────────

export function saveSuppliesConfig({ persons, days }) {
  save(STORAGE_KEYS.PERSONS, persons);
  save(STORAGE_KEYS.DAYS, days);
}

export function loadSuppliesConfig(defaults = { persons: 4, days: 3 }) {
  return {
    persons: load(STORAGE_KEYS.PERSONS, defaults.persons),
    days:    load(STORAGE_KEYS.DAYS,    defaults.days),
  };
}

// ── Checklists de guías ───────────────────────────────────

export function saveAntesChecks(checks) {
  return save(STORAGE_KEYS.ANTES_CHECKS, checks);
}

export function loadAntesChecks(defaultData = {}) {
  return load(STORAGE_KEYS.ANTES_CHECKS, defaultData);
}

export function saveDespuesChecks(checks) {
  return save(STORAGE_KEYS.DESPUES_CHECKS, checks);
}

export function loadDespuesChecks(defaultData = {}) {
  return load(STORAGE_KEYS.DESPUES_CHECKS, defaultData);
}

// ── Fecha de última revisión ──────────────────────────────

export function saveLastReview(dateStr) {
  return save(STORAGE_KEYS.LAST_REVIEW, dateStr);
}

export function loadLastReview() {
  return load(STORAGE_KEYS.LAST_REVIEW, null);
}
