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

// ── Inventario por defecto (evita import assert { type: 'json' }) ──

export const DEFAULT_INVENTORY = [
  { cat: "Abrigo y vestimenta", items: [
    { id:"av01", name:"Mantas / frazadas térmicas",       meta:"Una por persona",                        done:false, badge:"miss", expDate:"" },
    { id:"av02", name:"Muda completa de ropa de abrigo",  meta:"Incluye ropa interior y calcetines",     done:false, badge:"miss", expDate:"" },
    { id:"av03", name:"Calzado resistente",               meta:"Suela gruesa, para escombros o barro",   done:false, badge:"miss", expDate:"" },
  ]},
  { cat: "Iluminación y comunicación", items: [
    { id:"ic01", name:"Linterna",                         meta:"Probar mensualmente",                    done:false, badge:"miss", expDate:"" },
    { id:"ic02", name:"Radio AM/FM a pilas o manivela",   meta:"Para alertas oficiales",                 done:false, badge:"miss", expDate:"" },
    { id:"ic03", name:"Pilas de repuesto",                meta:"Del tamaño adecuado para cada equipo",   done:false, badge:"miss", expDate:"" },
  ]},
  { cat: "Botiquín y seguridad", items: [
    { id:"bs01", name:"Botiquín de primeros auxilios",    meta:"Vendas, gasas, antiséptico",             done:false, badge:"miss", expDate:"" },
    { id:"bs02", name:"Medicamentos con receta",          meta:"En recipiente impermeable",              done:false, badge:"miss", expDate:"" },
    { id:"bs03", name:"Silbato para pedir ayuda",         meta:"Uno por persona",                        done:false, badge:"miss", expDate:"" },
    { id:"bs04", name:"Mascarillas",                      meta:"Ante humo, polvo o gases",               done:false, badge:"miss", expDate:"" },
  ]},
  { cat: "Herramientas y abrigo rápido", items: [
    { id:"ha01", name:"Herramienta multiusos de bolsillo",meta:"Tipo Victorinox o similar",             done:false, badge:"miss", expDate:"" },
    { id:"ha02", name:"Fósforos a prueba de agua",        meta:"En recipiente hermético",               done:false, badge:"miss", expDate:"" },
    { id:"ha03", name:"Cinta adhesiva a prueba de agua",  meta:"",                                      done:false, badge:"miss", expDate:"" },
    { id:"ha04", name:"Lona plástica",                    meta:"Para cubrirse o improvisar refugio",    done:false, badge:"miss", expDate:"" },
  ]},
  { cat: "Utensilios", items: [
    { id:"ut01", name:"Cubiertos (cuchara, tenedor, cuchillo)", meta:"",                               done:false, badge:"miss", expDate:"" },
    { id:"ut02", name:"Abrelatas manual",                 meta:"",                                     done:false, badge:"miss", expDate:"" },
  ]},
  { cat: "Higiene personal", items: [
    { id:"hp01", name:"Cepillos de dientes y pasta",      meta:"Uno por persona",                      done:false, badge:"miss", expDate:"" },
    { id:"hp02", name:"Jabón",                            meta:"",                                     done:false, badge:"miss", expDate:"" },
    { id:"hp03", name:"Toallas",                          meta:"Compactas o microfibra",               done:false, badge:"miss", expDate:"" },
    { id:"hp04", name:"Papel higiénico",                  meta:"En bolsa hermética",                   done:false, badge:"miss", expDate:"" },
  ]},
  { cat: "Necesidades especiales", items: [
    { id:"ne01", name:"Artículos para cuidado de niños",  meta:"Pañales, leche, chupete, etc.",        done:false, badge:"miss", expDate:"" },
    { id:"ne02", name:"Artículos para personas mayores o enfermas", meta:"Adaptado a cada caso",       done:false, badge:"miss", expDate:"" },
  ]},
  { cat: "Agua y alimentación", items: [
    { id:"aa01", name:"Agua embotellada (3L/persona)",    meta:"Mín. 3 días de reserva",              done:false, badge:"miss", expDate:"" },
    { id:"aa02", name:"Alimentos no perecederos",         meta:"Enlatados, barras energéticas",        done:false, badge:"miss", expDate:"" },
  ]},
  { cat: "Documentos e información", items: [
    { id:"di01", name:"Copias de documentos importantes", meta:"DNI, CUIL, recibos — en sobre hermético", done:false, badge:"miss", expDate:"" },
    { id:"di02", name:"Lista de contactos de emergencia", meta:"Impresa, no solo en el celular",       done:false, badge:"miss", expDate:"" },
    { id:"di03", name:"Mapa de la zona y puntos de encuentro", meta:"Con rutas de evacuación marcadas", done:false, badge:"miss", expDate:"" },
  ]},
  { cat: "Dinero y llaves", items: [
    { id:"dl01", name:"Tarjetas bancarias",               meta:"",                                     done:false, badge:"miss", expDate:"" },
    { id:"dl02", name:"Efectivo en billetes chicos",      meta:"Por si los cajeros no funcionan",      done:false, badge:"miss", expDate:"" },
    { id:"dl03", name:"Juego extra de llaves (casa y auto)", meta:"En sobre rotulado",                 done:false, badge:"miss", expDate:"" },
  ]},
  { cat: "Para los niños y espíritu", items: [
    { id:"ne03", name:"Papel y lápices",                  meta:"",                                     done:false, badge:"miss", expDate:"" },
    { id:"ne04", name:"Libros y juegos para niños",       meta:"Sin batería ni pantalla",              done:false, badge:"miss", expDate:"" },
    { id:"ne05", name:"Biblia",                           meta:"",                                     done:false, badge:"miss", expDate:"" },
  ]},
];

// ── Inventario (mochila) ──────────────────────────────────

export function saveInventory(inventory) {
  return save(STORAGE_KEYS.INVENTORY, inventory);
}

export function loadInventory(defaultData = DEFAULT_INVENTORY) {
  return load(STORAGE_KEYS.INVENTORY, defaultData);
}

// ── Contactos ─────────────────────────────────────────────

export function saveContacts(contacts) {
  return save(STORAGE_KEYS.CONTACTS, contacts);
}

export function loadContacts(defaultData = []) {
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

export function loadFoodItems(defaultData = []) {
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
