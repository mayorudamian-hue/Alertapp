/* ============================================================
   EmergenciaApp — constants.js
   Valores fijos, enumeraciones y configuración global.
   ============================================================ */

'use strict';

// ── Versión ───────────────────────────────────────────────
export const APP_VERSION = '1.0.0';

// ── Pantallas / rutas ─────────────────────────────────────
export const SCREENS = {
  DASHBOARD:  'dashboard',
  BACKPACK:   'backpack',
  CONTACTS:   'contacts',
  GUIDES:     'guides',
  SUPPLIES:   'supplies',
};

// ── Pestañas de guías ─────────────────────────────────────
export const GUIDE_PHASES = {
  ANTES:    'antes',
  DURANTE:  'durante',
  DESPUES:  'despues',
};

// ── Tipos de desastre ─────────────────────────────────────
export const DISASTER_TYPES = {
  INCENDIO:   'incendio',
  TERREMOTO:  'terremoto',
  INUNDACION: 'inundacion',
  TORNADO:    'tornado',
  TSUNAMI:    'tsunami',
};

// ── Grupos de contactos ───────────────────────────────────
export const CONTACT_GROUPS = {
  CONGREGACION: 'congregacion',
  EMERGENCIA:   'emergencia',
  FAMILIA:      'familia',
  AMIGO:        'amigo',
  SERVICIOS:    'servicios',
};

export const CONTACT_GROUP_LABELS = {
  [CONTACT_GROUPS.CONGREGACION]: 'Congregación',
  [CONTACT_GROUPS.EMERGENCIA]:   'Mi contacto de emergencia',
  [CONTACT_GROUPS.FAMILIA]:      'Familia',
  [CONTACT_GROUPS.AMIGO]:        'Amigo',
  [CONTACT_GROUPS.SERVICIOS]:    'Servicios de emergencia',
};

// ── Estados de vencimiento ────────────────────────────────
export const EXP_STATUS = {
  EXPIRED:  'expired',   // ya venció
  SOON:     'soon',      // vence en ≤ 60 días
  OK:       'ok',        // en buen estado
  NONE:     'none',      // sin fecha cargada
};

export const EXP_SOON_DAYS = 60;   // umbral "vence pronto"

// ── Badges de ítems de mochila ────────────────────────────
export const ITEM_BADGE = {
  OK:   'ok',
  EXP:  'exp',
  MISS: 'miss',
};

// ── Claves de localStorage ────────────────────────────────
export const STORAGE_KEYS = {
  INVENTORY:       'ea_inventory',
  CONTACTS:        'ea_contacts',
  MEETING_POINTS:  'ea_meeting_points',
  FOOD_ITEMS:      'ea_food_items',
  PERSONS:         'ea_persons',
  DAYS:            'ea_days',
  ANTES_CHECKS:    'ea_antes_checks',
  DESPUES_CHECKS:  'ea_despues_checks',
  LAST_REVIEW:     'ea_last_review',
};

// ── Notificaciones ────────────────────────────────────────
export const NOTIF = {
  CHECK_INTERVAL_MS: 24 * 60 * 60 * 1000,  // cada 24 hs
  WARN_DAYS_BEFORE:  60,
};

// ── Valores por defecto ───────────────────────────────────
export const DEFAULTS = {
  PERSONS:       4,
  DAYS:          3,
  LITERS_PP:     11,    // litros por persona recomendados
  CALORIES_PP:   2000,  // calorías por persona por día
};

// ── Navegación inferior ───────────────────────────────────
export const NAV_ITEMS = [
  { id: SCREENS.DASHBOARD, icon: '⚡', label: 'Estado'      },
  { id: SCREENS.BACKPACK,  icon: '🎒', label: 'Mochila'     },
  { id: SCREENS.CONTACTS,  icon: '📞', label: 'Contactos'   },
  { id: SCREENS.GUIDES,    icon: '📋', label: 'Guías'       },
  { id: SCREENS.SUPPLIES,  icon: '🏠', label: 'Suministros' },
];
