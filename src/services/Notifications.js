/* ============================================================
   EmergenciaApp — Notifications.js
   Notificaciones locales para vencimientos y revisión anual.
   Usa la Web Notifications API (requiere permiso del usuario).
   ============================================================ */

'use strict';

import { expiryStatus } from '../core/utils.js';
import { EXP_STATUS }   from '../core/constants.js';

const APP_NAME = 'EmergenciaApp';

// ── Permiso ───────────────────────────────────────────────

/**
 * Solicita permiso de notificaciones al usuario.
 * @returns {Promise<boolean>} — true si fue concedido
 */
export async function requestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Devuelve true si las notificaciones están disponibles y permitidas.
 * @returns {boolean}
 */
export function canNotify() {
  return 'Notification' in window && Notification.permission === 'granted';
}

// ── Envío de notificación ─────────────────────────────────

/**
 * Muestra una notificación nativa.
 * @param {string} title
 * @param {string} body
 * @param {object} [options]
 */
function notify(title, body, options = {}) {
  if (!canNotify()) return;
  new Notification(title, {
    body,
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-192.png',
    lang: 'es',
    ...options,
  });
}

// ── Chequeo de vencimientos ───────────────────────────────

/**
 * Revisa todos los ítems y notifica los que vencen pronto o ya vencieron.
 * @param {Array} allItems  — array plano de { name, expDate }
 */
export function checkExpirations(allItems) {
  if (!canNotify()) return;

  const expired = [];
  const soon    = [];

  allItems.forEach(item => {
    if (!item.expDate) return;
    const { status, label } = expiryStatus(item.expDate);
    if (status === EXP_STATUS.EXPIRED) expired.push({ name: item.name, label });
    if (status === EXP_STATUS.SOON)    soon.push({ name: item.name, label });
  });

  if (expired.length > 0) {
    const names = expired.map(i => i.name).join(', ');
    notify(
      `${APP_NAME} — Artículos vencidos`,
      expired.length === 1
        ? `${expired[0].name}: ${expired[0].label}. Reemplazarlo lo antes posible.`
        : `${expired.length} artículos vencidos: ${names}.`,
      { tag: 'expired', requireInteraction: true }
    );
  }

  if (soon.length > 0) {
    const names = soon.map(i => i.name).join(', ');
    notify(
      `${APP_NAME} — Próximos vencimientos`,
      soon.length === 1
        ? `${soon[0].name}: ${soon[0].label}.`
        : `${soon.length} artículos por vencer: ${names}.`,
      { tag: 'soon' }
    );
  }
}

// ── Recordatorio de revisión anual ────────────────────────

/**
 * Notifica si pasó más de 1 año desde la última revisión.
 * @param {string|null} lastReviewDateStr — 'YYYY-MM-DD' o null
 */
export function checkAnnualReview(lastReviewDateStr) {
  if (!canNotify()) return;
  if (!lastReviewDateStr) {
    notify(
      `${APP_NAME} — Revisión pendiente`,
      'Todavía no registraste una revisión anual de tus suministros.',
      { tag: 'annual-review' }
    );
    return;
  }

  const last = new Date(lastReviewDateStr + 'T00:00:00');
  const now  = new Date();
  const diffMs = now - last;
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  if (diffMs >= oneYear) {
    notify(
      `${APP_NAME} — Revisión anual`,
      'Pasó más de un año desde tu última revisión de suministros. ¡Es momento de actualizarlos!',
      { tag: 'annual-review', requireInteraction: true }
    );
  }
}

// ── Programador periódico ─────────────────────────────────

let _checkInterval = null;

/**
 * Inicia un chequeo periódico de vencimientos (cada 24 hs mientras la app esté abierta).
 * @param {Function} getItems       — función que devuelve los ítems actuales
 * @param {Function} getLastReview  — función que devuelve la fecha de última revisión
 */
export function startPeriodicCheck(getItems, getLastReview) {
  if (_checkInterval) return; // ya iniciado

  const run = () => {
    checkExpirations(getItems());
    checkAnnualReview(getLastReview());
  };

  run(); // chequeo inmediato al abrir la app
  _checkInterval = setInterval(run, 24 * 60 * 60 * 1000);
}

/**
 * Detiene el chequeo periódico.
 */
export function stopPeriodicCheck() {
  if (_checkInterval) {
    clearInterval(_checkInterval);
    _checkInterval = null;
  }
}
