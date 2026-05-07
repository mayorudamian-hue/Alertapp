/* ============================================================
   EmergenciaApp — utils.js
   Funciones puras. Sin efectos secundarios, sin DOM.
   ============================================================ */

'use strict';

import { EXP_STATUS, EXP_SOON_DAYS } from './constants.js';

// ── Fechas ────────────────────────────────────────────────

/**
 * Devuelve la fecha de hoy a medianoche (sin hora).
 * @returns {Date}
 */
export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Parsea un string 'YYYY-MM-DD' a Date local (sin desfase UTC).
 * @param {string} str
 * @returns {Date|null}
 */
export function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Formatea una Date a 'DD/MM/YYYY'.
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Diferencia en días entre dos fechas (b - a).
 * @param {Date} a
 * @param {Date} b
 * @returns {number}
 */
export function diffDays(a, b) {
  return Math.round((b - a) / 86_400_000);
}

// ── Estado de vencimiento ─────────────────────────────────

/**
 * Evalúa el estado de vencimiento de un ítem.
 * @param {string} dateStr  — 'YYYY-MM-DD' o ''
 * @returns {{ status: string, label: string, days: number|null }}
 */
export function expiryStatus(dateStr) {
  if (!dateStr) {
    return { status: EXP_STATUS.NONE, label: 'Sin fecha', days: null };
  }

  const exp  = parseDate(dateStr);
  const diff = diffDays(today(), exp);

  if (diff < 0) {
    const abs = Math.abs(diff);
    return {
      status: EXP_STATUS.EXPIRED,
      label:  abs === 1 ? 'Venció ayer' : `Venció hace ${abs} días`,
      days:   diff,
    };
  }

  if (diff <= EXP_SOON_DAYS) {
    return {
      status: EXP_STATUS.SOON,
      label:  diff === 0 ? 'Vence hoy' : `Vence en ${diff} día${diff !== 1 ? 's' : ''}`,
      days:   diff,
    };
  }

  const months = Math.floor(diff / 30);
  const label  = months >= 2
    ? `Vence en ~${months} meses`
    : `Vence en ${diff} días`;

  return { status: EXP_STATUS.OK, label, days: diff };
}

// ── Cálculos de suministros ───────────────────────────────

/**
 * Calcula litros de agua necesarios.
 * @param {number} persons
 * @param {number} days
 * @param {number} [litersPerPerson=11]
 * @returns {number}
 */
export function calcWater(persons, days, litersPerPerson = 11) {
  return persons * litersPerPerson * days;
}

/**
 * Calcula calorías diarias totales.
 * @param {number} persons
 * @param {number} [caloriesPerPerson=2000]
 * @returns {number}
 */
export function calcCalories(persons, caloriesPerPerson = 2000) {
  return persons * caloriesPerPerson;
}

// ── Progreso general de preparación ──────────────────────

/**
 * Calcula el porcentaje de preparación global (0–100).
 * Pondera: mochila 40%, contactos 20%, guías-antes 30%, puntos encuentro 10%.
 *
 * @param {object} p
 * @param {number} p.backpackDone   — ítems marcados
 * @param {number} p.backpackTotal  — ítems totales
 * @param {number} p.contactsDone   — contactos con teléfono cargado
 * @param {number} p.contactsTotal  — contactos totales
 * @param {number} p.guidesDone     — tareas "antes" marcadas
 * @param {number} p.guidesTotal
 * @param {number} p.meetingsDone   — puntos de encuentro definidos
 * @param {number} p.meetingsTotal
 * @returns {number}
 */
export function calcReadiness({ backpackDone, backpackTotal, contactsDone, contactsTotal, guidesDone, guidesTotal, meetingsDone, meetingsTotal }) {
  const pct = (done, total) => total > 0 ? done / total : 0;

  const score =
    pct(backpackDone,  backpackTotal)  * 40 +
    pct(contactsDone,  contactsTotal)  * 20 +
    pct(guidesDone,    guidesTotal)    * 30 +
    pct(meetingsDone,  meetingsTotal)  * 10;

  return Math.round(score);
}

// ── Texto ─────────────────────────────────────────────────

/**
 * Iniciales de un nombre (máx. 2 caracteres).
 * @param {string} name
 * @returns {string}
 */
export function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Trunca un string a maxLen caracteres.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(str, maxLen = 40) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + '…';
}

/**
 * Formatea un número con separador de miles (locale es-AR).
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  return n.toLocaleString('es-AR');
}
