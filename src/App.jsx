// Centro de Producción — v2 (guardado verificado + publicación)
import React, { useState, useEffect, useRef } from "react";
import {
  Package, ChefHat, BarChart3, Settings, Plus, Minus, Trash2, Lock, Unlock,
  ArrowLeft, ChevronLeft, ChevronRight, Check, X, Loader2, Store, Users,
  UtensilsCrossed, Pencil, Undo2, History, Download, ShieldAlert, Boxes, BookOpen, Save
} from "lucide-react";
import { supabase } from "./supabaseClient";

// ---------- Colores del sistema (fichas de cocina) ----------
const C = {
  paper: "#F6F1E6", paperDark: "#EFE7D6", ink: "#241F1C", inkSoft: "#5B5348",
  line: "#D9CDB8", amber: "#E2A03F", amberDark: "#B97C22", teal: "#2E6659",
  tealDark: "#1F4A3F", red: "#C1443C", green: "#4C8C6B", white: "#FFFDF9",
};

const PIN = "4500";
const ADMIN_NAMES = ["Vos (dueño)", "Mamá", "Hermano"];
const VENTANA_DESHACER_MS = 3 * 60 * 1000;
const UNIDADES = ["unidad", "gramo (g)", "kg", "l", "ml", "paquete", "cajas", "feta", "tapa", "plancha triple", "cucharada", "diente", "rodaja", "hoja", "manojo", "frasco"];

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

// ================= CATÁLOGO REAL (a partir de las recetas de Mamá) =================
const DEFAULT_PRODUCTOS = [
  // ---- INSUMOS ----
  { id: "i_huevo", nombre: "Huevo", tipo: "insumo", unidad: "unidad", unidadCompra: "Unidad", rendimiento: 1, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_ajo", nombre: "Ajo (diente)", tipo: "insumo", unidad: "diente", unidadCompra: "Cabeza de ajo", rendimiento: 10, notas: "~10 dientes por cabeza en promedio", precioVenta: 0, costo: 0 },
  { id: "i_perejil", nombre: "Perejil", tipo: "insumo", unidad: "manojo", unidadCompra: "Manojo", rendimiento: 1, notas: 'Uso "a gusto", no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_mostaza", nombre: "Mostaza", tipo: "insumo", unidad: "frasco", unidadCompra: "Frasco", rendimiento: 1, notas: 'Uso "a gusto", no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_pan_rallado", nombre: "Pan rallado", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "500g cada 1kg de carne (proporción)", precioVenta: 0, costo: 0 },
  { id: "i_cebolla", nombre: "Cebolla", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_cebolla_chica", nombre: "Cebolla chica", tipo: "insumo", unidad: "unidad", unidadCompra: "Unidad", rendimiento: 1, notas: "Para arrollado", precioVenta: 0, costo: 0 },
  { id: "i_pimiento", nombre: "Pimiento (rojo y verde)", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_pimiento_chico", nombre: "Pimiento rojo chico", tipo: "insumo", unidad: "unidad", unidadCompra: "Unidad", rendimiento: 1, notas: "Para arrollado", precioVenta: 0, costo: 0 },
  { id: "i_sal", nombre: "Sal", tipo: "insumo", unidad: "paquete", unidadCompra: "Paquete", rendimiento: 1, notas: 'A gusto, no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_pimienta", nombre: "Pimienta molida", tipo: "insumo", unidad: "frasco", unidadCompra: "Frasco", rendimiento: 1, notas: 'A gusto, no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_queso_cremoso", nombre: "Queso cremoso", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "Para pizza y arrollado", precioVenta: 0, costo: 0 },
  { id: "i_queso_rallado", nombre: "Queso rallado", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "Para cobertura del pastel de carne", precioVenta: 0, costo: 0 },
  { id: "i_queso_tybo", nombre: "Queso tybo", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Pieza (aprox. 4 a 4,5 kg)", rendimiento: 4250, notas: "Estimado (6-8 fetas/100g). A confirmar con pesaje exacto.", precioVenta: 0, costo: 0 },
  { id: "i_tomate_entero", nombre: "Tomate (entero)", tipo: "insumo", unidad: "unidad", unidadCompra: "Unidad", rendimiento: 1, notas: "Para tartas y arrollado", precioVenta: 0, costo: 0 },
  { id: "i_tomate_rodaja", nombre: "Tomate (rodajas)", tipo: "insumo", unidad: "rodaja", unidadCompra: "Unidad", rendimiento: 9, notas: "9 rodajas por tomate aprox.", precioVenta: 0, costo: 0 },
  { id: "i_pascualina", nombre: "Tapa de pascualina", tipo: "insumo", unidad: "tapa", unidadCompra: "Paquete", rendimiento: 2, notas: "El paquete trae 2 tapas", precioVenta: 0, costo: 0 },
  { id: "i_papa", nombre: "Papa", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_nuez_moscada", nombre: "Nuez moscada", tipo: "insumo", unidad: "frasco", unidadCompra: "Frasco", rendimiento: 1, notas: 'A gusto, no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_leche", nombre: "Leche", tipo: "insumo", unidad: "litro", unidadCompra: "Litro", rendimiento: 1, notas: 'A gusto, no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_carne_pastel", nombre: "Carne (para pastel de carne)", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "Distinta de la carne para pebete", precioVenta: 0, costo: 0 },
  { id: "i_pimenton", nombre: "Pimentón (condimento)", tipo: "insumo", unidad: "frasco", unidadCompra: "Frasco", rendimiento: 1, notas: 'A gusto, no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_oregano", nombre: "Orégano", tipo: "insumo", unidad: "frasco", unidadCompra: "Frasco", rendimiento: 1, notas: 'A gusto, no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_zapallitos", nombre: "Zapallitos", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_cebollin", nombre: "Cebollín", tipo: "insumo", unidad: "manojo", unidadCompra: "Manojo", rendimiento: 1, notas: 'A gusto, no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_crema_leche", nombre: "Crema de leche", tipo: "insumo", unidad: "cucharada", unidadCompra: "Pote", rendimiento: 14, notas: "1 pote rinde ~14 cucharadas (~20g c/u)", precioVenta: 0, costo: 0 },
  { id: "i_espinaca", nombre: "Espinaca", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_plancha_miga", nombre: "Plancha triple (pan de miga)", tipo: "insumo", unidad: "plancha triple", unidadCompra: "Molde de pan de miga", rendimiento: 12, notas: "Un molde rinde 12 planchas triple", precioVenta: 0, costo: 0 },
  { id: "i_mayonesa", nombre: "Mayonesa", tipo: "insumo", unidad: "frasco", unidadCompra: "Frasco", rendimiento: 1, notas: 'A gusto, no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_jamon", nombre: "Jamón", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Pieza (aprox. 3,5 kg)", rendimiento: 3150, notas: "Estimado: retazos 300-400g por pieza. A confirmar con pesaje.", precioVenta: 0, costo: 0 },
  { id: "i_salame", nombre: "Salame", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Pieza (aprox. 2,5 kg)", rendimiento: 2500, notas: "Estimado (6-7 fetas/100g). A confirmar con pesaje.", precioVenta: 0, costo: 0 },
  { id: "i_harina_0000", nombre: "Harina 0000 (blanca flor)", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_harina_comun", nombre: "Harina común", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_azucar", nombre: "Azúcar", tipo: "insumo", unidad: "A confirmar", unidadCompra: "A confirmar", rendimiento: "-", notas: "Cantidad real pendiente de confirmar", precioVenta: 0, costo: 0 },
  { id: "i_vainilla", nombre: "Vainilla líquida", tipo: "insumo", unidad: "frasco", unidadCompra: "Frasco", rendimiento: 1, notas: 'A gusto, no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_manteca", nombre: "Manteca", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "Se usa pomada", precioVenta: 0, costo: 0 },
  { id: "i_dulce_membrillo", nombre: "Dulce de membrillo", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_bife_milanesa", nombre: "Bife para milanesa (crudo)", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "Peso por milanesa: 85 a 100g (promedio ~92,5g usado en la receta)", precioVenta: 0, costo: 0 },
  { id: "i_lechuga", nombre: "Lechuga", tipo: "insumo", unidad: "hoja", unidadCompra: "Unidad (planta)", rendimiento: "A confirmar", notas: "Falta confirmar hojas por planta", precioVenta: 0, costo: 0 },
  { id: "i_medallon_hamb", nombre: "Medallón de hamburguesa", tipo: "insumo", unidad: "unidad", unidadCompra: "Unidad", rendimiento: 1, notas: "Viene armado", precioVenta: 0, costo: 0 },
  { id: "i_relleno_cp", nombre: "Relleno de empanada (carne o pollo)", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "A definir (semielaborado)", rendimiento: "-", notas: "Receta del relleno pendiente", precioVenta: 0, costo: 0 },
  { id: "i_relleno_arabe", nombre: "Relleno de empanada árabe", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "A definir (semielaborado)", rendimiento: "-", notas: "Receta del relleno pendiente", precioVenta: 0, costo: 0 },
  { id: "i_carne_pebete", nombre: "Ternera (cuadrada, hervida y feteada)", tipo: "insumo", unidad: "gramo (g) feteado", unidadCompra: "Kilogramo (kg) crudo", rendimiento: 700, notas: "Se hierve y fetea como fiambre; los retazos se desmechan para sandwiches de miga", precioVenta: 0, costo: 0 },
  { id: "i_aceite", nombre: "Aceite", tipo: "insumo", unidad: "litro", unidadCompra: "Litro", rendimiento: 1, notas: "Sin receta vinculada todavía", precioVenta: 0, costo: 0 },
  { id: "i_aceituna", nombre: "Aceituna", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "Sin receta vinculada todavía", precioVenta: 0, costo: 0 },
  { id: "i_aji", nombre: "Ají", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "Sin receta vinculada todavía", precioVenta: 0, costo: 0 },
  { id: "i_mortadela", nombre: "Mortadela", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "Sin receta vinculada todavía (pendiente: picadas)", precioVenta: 0, costo: 0 },
  { id: "i_queso_chancho", nombre: "Queso de chancho", tipo: "insumo", unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "Sin receta vinculada todavía (pendiente: picadas)", precioVenta: 0, costo: 0 },
  { id: "i_chimichurri", nombre: "Condimento (chimichurri)", tipo: "insumo", unidad: "frasco", unidadCompra: "Frasco", rendimiento: 1, notas: 'A gusto, no se descuenta automático', precioVenta: 0, costo: 0 },
  { id: "i_naranja", nombre: "Naranja", tipo: "insumo", unidad: "unidad", unidadCompra: "Unidad", rendimiento: 1, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_manzana", nombre: "Manzana", tipo: "insumo", unidad: "unidad", unidadCompra: "Unidad", rendimiento: 1, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_banana", nombre: "Banana", tipo: "insumo", unidad: "unidad", unidadCompra: "Unidad", rendimiento: 1, notas: "", precioVenta: 0, costo: 0 },
  { id: "i_yogurt_natural", nombre: "Yogurt natural", tipo: "insumo", unidad: "litro", unidadCompra: "Envase de 1 litro", rendimiento: 1, notas: "Viene en envases de 1 litro", precioVenta: 0, costo: 0 },
  { id: "i_huevo_bufet", nombre: "Huevo (bufet)", tipo: "insumo", unidad: "unidad", unidadCompra: "Unidad", rendimiento: 1, notas: "Para venta directa en el bufet, distinto del huevo de producción", precioVenta: 0, costo: 0 },
  { id: "i_leche_bufet", nombre: "Leche (bufet)", tipo: "insumo", unidad: "unidad", unidadCompra: "Unidad", rendimiento: 1, notas: "Envase para venta directa en el bufet, distinto de la leche de elaboración", precioVenta: 0, costo: 0 },
  // ---- PRODUCTOS (COMIDA) ----
  { id: "c_pizza", nombre: "Pizza porción", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "Receta pendiente", precioVenta: 1800, costo: 600 },
  { id: "c_tarta_jyq", nombre: "Tarta de jamón y queso", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "Rinde 4 porciones generosas", precioVenta: 0, costo: 0 },
  { id: "c_pastel_carne", nombre: "Pastel de carne", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_tarta_zapallitos", nombre: "Tarta de zapallitos", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_arrollado", nombre: "Arrollado de espinaca y queso", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_miga_jq", nombre: "Sandwich de miga - Jamón y queso", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_miga_sq", nombre: "Sandwich de miga - Salame y queso", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_miga_jh", nombre: "Sandwich de miga triple - Jamón y huevo", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_pastafrola", nombre: "Pastafrola", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "Rinde 2 tamaño pizza + 1 chica", precioVenta: 0, costo: 0 },
  { id: "c_pebete", nombre: "Pebete (armado)", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_mega", nombre: "Mega (armado)", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_sandwich_milanesa", nombre: "Sandwich de milanesa (armado)", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_empanada_cp", nombre: "Empanada de carne o pollo", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_empanada_arabe", nombre: "Empanada árabe", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_hamburguesa", nombre: "Hamburguesa (armado)", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "", precioVenta: 0, costo: 0 },
  { id: "c_pebete_ternera", nombre: "Pebete de ternera", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "Falta confirmar cantidad de ternera por unidad", precioVenta: 0, costo: 0 },
  { id: "c_miga_ternera", nombre: "Sandwich de miga - Ternera desmechada", tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: "Hecho con los retazos desmechados; falta confirmar cantidad por unidad", precioVenta: 0, costo: 0 },
];

const DEFAULT_RECETARIO = {
  c_pizza: [],
  c_tarta_jyq: [
    { insumoId: "i_cebolla", cantidad: 700 }, { insumoId: "i_pimiento", cantidad: 400 },
    { insumoId: "i_queso_tybo", cantidad: 150 }, { insumoId: "i_jamon", cantidad: 250 },
    { insumoId: "i_tomate_entero", cantidad: 1 }, { insumoId: "i_huevo", cantidad: 2 },
    { insumoId: "i_pascualina", cantidad: 2 },
  ],
  c_pastel_carne: [
    { insumoId: "i_papa", cantidad: 4000 }, { insumoId: "i_huevo", cantidad: 6 },
    { insumoId: "i_carne_pastel", cantidad: 2000 }, { insumoId: "i_cebolla", cantidad: 1000 },
    { insumoId: "i_pimiento", cantidad: 600 }, { insumoId: "i_ajo", cantidad: 1 },
    { insumoId: "i_queso_rallado", cantidad: 250 },
  ],
  c_tarta_zapallitos: [
    { insumoId: "i_cebolla", cantidad: 700 }, { insumoId: "i_pimiento", cantidad: 400 },
    { insumoId: "i_zapallitos", cantidad: 700 }, { insumoId: "i_ajo", cantidad: 1 },
    { insumoId: "i_huevo", cantidad: 2 }, { insumoId: "i_crema_leche", cantidad: 1 },
    { insumoId: "i_pascualina", cantidad: 2 },
  ],
  c_arrollado: [
    { insumoId: "i_espinaca", cantidad: 60 }, { insumoId: "i_cebolla_chica", cantidad: 1 },
    { insumoId: "i_pimiento_chico", cantidad: 1 }, { insumoId: "i_tomate_entero", cantidad: 1 },
    { insumoId: "i_queso_cremoso", cantidad: 180 }, { insumoId: "i_huevo", cantidad: 1 },
    { insumoId: "i_pascualina", cantidad: 1 },
  ],
  c_miga_jq: [{ insumoId: "i_plancha_miga", cantidad: 1 }, { insumoId: "i_jamon", cantidad: 50 }, { insumoId: "i_queso_tybo", cantidad: 42 }],
  c_miga_sq: [{ insumoId: "i_plancha_miga", cantidad: 1 }, { insumoId: "i_salame", cantidad: 75 }, { insumoId: "i_queso_tybo", cantidad: 42 }],
  c_miga_jh: [{ insumoId: "i_plancha_miga", cantidad: 1 }, { insumoId: "i_jamon", cantidad: 50 }, { insumoId: "i_huevo", cantidad: 1 }],
  c_pastafrola: [
    { insumoId: "i_harina_0000", cantidad: 1000 }, { insumoId: "i_harina_comun", cantidad: 500 },
    { insumoId: "i_huevo", cantidad: 4 }, { insumoId: "i_manteca", cantidad: 500 },
    { insumoId: "i_dulce_membrillo", cantidad: 400 },
  ],
  c_pebete: [{ insumoId: "i_queso_tybo", cantidad: 21 }, { insumoId: "i_jamon", cantidad: 25 }, { insumoId: "i_salame", cantidad: 30 }],
  c_mega: [{ insumoId: "i_queso_tybo", cantidad: 28 }, { insumoId: "i_jamon", cantidad: 50 }, { insumoId: "i_salame", cantidad: 45 }],
  c_sandwich_milanesa: [{ insumoId: "i_bife_milanesa", cantidad: 92.5 }, { insumoId: "i_huevo", cantidad: 0.5 }, { insumoId: "i_pan_rallado", cantidad: 46 }, { insumoId: "i_tomate_rodaja", cantidad: 3 }, { insumoId: "i_lechuga", cantidad: 0.25 }],
  c_empanada_cp: [{ insumoId: "i_relleno_cp", cantidad: 60 }],
  c_empanada_arabe: [{ insumoId: "i_relleno_arabe", cantidad: 67 }],
  c_hamburguesa: [{ insumoId: "i_medallon_hamb", cantidad: 1 }, { insumoId: "i_tomate_rodaja", cantidad: 3.5 }, { insumoId: "i_lechuga", cantidad: 0.5 }],
  c_pebete_ternera: [],
  c_miga_ternera: [],
};

const DEFAULT_PERSONAS = [{ id: "per1", nombre: "Fiorela" }, { id: "per2", nombre: "Mamá" }, { id: "per3", nombre: "Alan" }];
const DEFAULT_BUFETS = [{ id: "b1", nombre: "Escuela 1" }, { id: "b2", nombre: "Escuela 2" }];

function todayKey(d = new Date()) { return d.toISOString().slice(0, 10); }
function addDays(key, n) { const d = new Date(key + "T00:00:00"); d.setDate(d.getDate() + n); return todayKey(d); }
function formatFecha(key) { const d = new Date(key + "T00:00:00"); return d.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" }); }
function money(n) { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0); }
function horaAhora() { return new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }); }

async function safeGet(key) {
  try {
    const { data, error } = await supabase.from("app_storage").select("value").eq("key", key).maybeSingle();
    if (error) throw error;
    return data ? JSON.stringify(data.value) : null;
  } catch (e) { console.error("storage get error", e); return null; }
}
async function safeSet(key, value) {
  try {
    const parsed = JSON.parse(value);
    const { error } = await supabase.from("app_storage").upsert({ key, value: parsed, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true;
  } catch (e) { console.error("storage set error", e); return false; }
}
async function safeDelete(key) {
  try {
    const { error } = await supabase.from("app_storage").delete().eq("key", key);
    if (error) throw error;
    return true;
  } catch (e) { console.error("storage delete error", e); return false; }
}
// Trae todas las entradas cuya clave empieza con un prefijo (ej: todas las cargas de insumos de un día)
async function safeListPrefix(prefix) {
  try {
    const { data, error } = await supabase.from("app_storage").select("key,value").like("key", `${prefix}%`);
    if (error) throw error;
    return data || [];
  } catch (e) { console.error("storage list error", e); return []; }
}
async function testStorage() {
  try {
    const testKey = "diagnostico-guardado";
    const testValue = Date.now().toString();
    const ok = await safeSet(testKey, testValue);
    if (!ok) return false;
    const raw = await safeGet(testKey);
    return raw === testValue;
  } catch (e) { return false; }
}
async function registrarAuditoria(fecha, responsable, accion, detalle) {
  const entry = { id: Date.now().toString() + Math.random().toString(36).slice(2, 6), hora: horaAhora(), responsable, accion, detalle };
  await safeSet(`auditoria-${fecha}-${entry.id}`, JSON.stringify(entry));
}
async function leerStock() {
  const raw = await safeGet("stock-insumos");
  return raw ? JSON.parse(raw) : {};
}
// Ajusta el stock de UN insumo de forma atómica en la base de datos (evita que dos cargas simultáneas se pisen)
async function ajustarStock(insumoId, delta) {
  try {
    const { error } = await supabase.rpc("incrementar_stock", { p_insumo_id: insumoId, p_delta: delta });
    if (error) throw error;
    return await leerStock();
  } catch (e) { console.error("ajustarStock error", e); return null; }
}
// Aplica el descuento (o reversión) de TODA la receta de un producto, según cantidad producida — cada insumo se ajusta atómicamente
async function aplicarStockPorProduccion(recetario, productoId, cantidadProducida, signo) {
  const receta = recetario[productoId] || [];
  try {
    for (const ing of receta) {
      const { error } = await supabase.rpc("incrementar_stock", { p_insumo_id: ing.insumoId, p_delta: signo * ing.cantidad * cantidadProducida });
      if (error) throw error;
    }
    return await leerStock();
  } catch (e) { console.error("aplicarStockPorProduccion error", e); return null; }
}

// ================= MIGRACIÓN AUTOMÁTICA (corre una sola vez) =================
const MIGRATION_KEY = "migracion-2026-08-catalogo-v1";
function normalizeName(n) { return (n || "").trim().toLowerCase(); }

async function ejecutarMigracionCatalogo(prodOriginal, recOriginal, stockOriginal) {
  const yaHecha = await safeGet(MIGRATION_KEY);
  if (yaHecha) return null;

  let productos = [...prodOriginal];
  let recetario = { ...recOriginal };
  let stockInsumos = { ...stockOriginal };
  let cambios = false;

  function fusionarInsumosDuplicados(nombre) {
    const dups = productos.filter((p) => p.tipo === "insumo" && normalizeName(p.nombre) === normalizeName(nombre));
    if (dups.length === 0) return null;
    if (dups.length === 1) return dups[0];
    const principal = dups[0];
    let stockTotal = 0;
    dups.forEach((d) => { stockTotal += Number(stockInsumos[d.id]) || 0; });
    stockInsumos[principal.id] = round2(stockTotal);
    const idsAEliminar = dups.slice(1).map((d) => d.id);
    Object.keys(recetario).forEach((prodId) => {
      recetario[prodId] = (recetario[prodId] || []).map((ing) =>
        idsAEliminar.includes(ing.insumoId) ? { ...ing, insumoId: principal.id } : ing
      );
    });
    idsAEliminar.forEach((id) => { delete stockInsumos[id]; });
    productos = productos.filter((p) => !idsAEliminar.includes(p.id));
    cambios = true;
    return principal;
  }

  function crearEnvioDirectoSiFalta(nombreProducto, insumo, notas) {
    if (!insumo) return;
    const yaExiste = productos.some((p) => p.tipo === "comida" && normalizeName(p.nombre) === normalizeName(nombreProducto));
    if (yaExiste) return;
    const nuevoId = "c_envio_" + insumo.id + "_" + Date.now() + Math.random().toString(36).slice(2, 5);
    productos.push({ id: nuevoId, nombre: nombreProducto, tipo: "comida", unidad: "unidad", unidadCompra: "", rendimiento: "", notas: notas || "Envío directo al bufet", precioVenta: 0, costo: 0 });
    recetario[nuevoId] = [{ insumoId: insumo.id, cantidad: 1 }];
    cambios = true;
  }

  // 1) Frutilla: fusionar duplicados, se manda a bufets (ensalada de fruta) y también se usa para mermelada
  const frutilla = fusionarInsumosDuplicados("Frutilla");
  if (frutilla) {
    productos = productos.map((p) => (p.id === frutilla.id
      ? { ...p, unidad: "gramo (g)", unidadCompra: "Kilogramo (kg)", rendimiento: 1000, notas: "Se manda a bufets para ensalada de fruta; también se usa para mermelada" }
      : p));
    crearEnvioDirectoSiFalta("Frutilla (envío directo)", frutilla, "Se envía al bufet para ensalada de fruta");
  }

  // 2) Pera: arreglar el insumo (se compra por unidad) y convertir el duplicado "comida" en envío directo
  const perasInsumo = productos.filter((p) => p.tipo === "insumo" && normalizeName(p.nombre) === "pera");
  const pera = fusionarInsumosDuplicados("Pera") || perasInsumo[0];
  if (pera) {
    productos = productos.map((p) => (p.id === pera.id
      ? { ...p, unidad: "unidad", unidadCompra: "Unidad", rendimiento: 1, notas: "Se manda a bufets para ensalada de fruta o tartas" }
      : p));
    const peraComida = productos.find((p) => p.tipo === "comida" && normalizeName(p.nombre) === "pera");
    if (peraComida) {
      productos = productos.map((p) => (p.id === peraComida.id ? { ...p, nombre: "Pera (envío directo)" } : p));
      recetario[peraComida.id] = [{ insumoId: pera.id, cantidad: 1 }];
      cambios = true;
    } else {
      crearEnvioDirectoSiFalta("Pera (envío directo)", pera, "Se envía al bufet para ensalada de fruta o tartas");
    }
  }

  // 3) Ledevit crema: arreglar unidad (viene en pote) y crear el envío directo
  const ledevit = productos.find((p) => p.tipo === "insumo" && normalizeName(p.nombre).includes("ledevit"));
  if (ledevit) {
    productos = productos.map((p) => (p.id === ledevit.id
      ? { ...p, unidad: "unidad", unidadCompra: "Pote", rendimiento: 1, notas: "Crema vegetal para batir con azúcar; se envía al bufet para que terminen el postre" }
      : p));
    crearEnvioDirectoSiFalta("Ledevit crema (envío directo)", ledevit, "Se envía para que el bufet la bata con azúcar y arme el postre (ensalada de fruta, vaso de frutilla, etc.)");
    cambios = true;
  }

  // 4) Tomate: sacar duplicados rotos y unificar todo bajo "Tomate (entero)"
  const tomateEntero = productos.find((p) => p.tipo === "insumo" && normalizeName(p.nombre) === "tomate (entero)");
  const tomateBuffetRoto = productos.find((p) => p.tipo === "insumo" && normalizeName(p.nombre).includes("tomate (buffet)"));
  const tomateComidaRota = productos.find((p) => p.tipo === "comida" && normalizeName(p.nombre) === "tomate");
  if (tomateBuffetRoto) {
    if (tomateEntero) stockInsumos[tomateEntero.id] = round2((Number(stockInsumos[tomateEntero.id]) || 0) + (Number(stockInsumos[tomateBuffetRoto.id]) || 0));
    delete stockInsumos[tomateBuffetRoto.id];
    productos = productos.filter((p) => p.id !== tomateBuffetRoto.id);
    cambios = true;
  }
  if (tomateComidaRota) {
    productos = productos.filter((p) => p.id !== tomateComidaRota.id);
    delete recetario[tomateComidaRota.id];
    cambios = true;
  }
  if (tomateEntero) {
    crearEnvioDirectoSiFalta("Tomate (envío directo)", tomateEntero, "Envío directo al bufet, por unidad (mismo tomate que usan las tartas)");
  }

  await safeSet(MIGRATION_KEY, JSON.stringify({ fecha: todayKey(), cambios }));
  if (!cambios) return null;
  return { productos, recetario, stockInsumos };
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [productos, setProductos] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [bufets, setBufets] = useState([]);
  const [recetario, setRecetario] = useState({});
  const [stockInsumos, setStockInsumos] = useState({});
  const [insumosHoy, setInsumosHoy] = useState([]);
  const [produccionHoy, setProduccionHoy] = useState([]);
  const [cierreHoy, setCierreHoy] = useState(null);

  const [authenticated, setAuthenticated] = useState(false);
  const [adminActual, setAdminActual] = useState("");
  const [pendingView, setPendingView] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [responsableInput, setResponsableInput] = useState(ADMIN_NAMES[0]);
  const [pinError, setPinError] = useState(false);

  const [stamp, setStamp] = useState(null);
  const stampTimer = useRef(null);

  const [resumenFecha, setResumenFecha] = useState(todayKey());
  const [resumenInsumos, setResumenInsumos] = useState([]);
  const [resumenProduccion, setResumenProduccion] = useState([]);
  const [resumenCierre, setResumenCierre] = useState(null);
  const [resumenLoading, setResumenLoading] = useState(false);

  const [configTab, setConfigTab] = useState("productos");
  const [storageOk, setStorageOk] = useState(null); // null=verificando, true=ok, false=falló

  async function verificarGuardado() {
    setStorageOk(null);
    const ok = await testStorage();
    setStorageOk(ok);
    return ok;
  }

  async function refrescarDatosHoy() {
    const tk = todayKey();
    const insList = await safeListPrefix(`insumo-entrada-${tk}-`); setInsumosHoy(insList.map((r) => r.value));
    const prodList = await safeListPrefix(`produccion-entrada-${tk}-`); setProduccionHoy(prodList.map((r) => r.value));
    const stockRaw = await safeGet("stock-insumos"); setStockInsumos(stockRaw ? JSON.parse(stockRaw) : {});
    const cierreRaw = await safeGet(`cierre-${tk}`); setCierreHoy(cierreRaw ? JSON.parse(cierreRaw) : null);
  }

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap";
    document.head.appendChild(link);

    (async () => {
      let prod = await safeGet("catalogo-productos");
      if (!prod) { prod = DEFAULT_PRODUCTOS; await safeSet("catalogo-productos", JSON.stringify(prod)); } else prod = JSON.parse(prod);
      let per = await safeGet("catalogo-personas");
      if (!per) { per = DEFAULT_PERSONAS; await safeSet("catalogo-personas", JSON.stringify(per)); } else per = JSON.parse(per);
      let buf = await safeGet("catalogo-bufets");
      if (!buf) { buf = DEFAULT_BUFETS; await safeSet("catalogo-bufets", JSON.stringify(buf)); } else buf = JSON.parse(buf);
      let rec = await safeGet("catalogo-recetario");
      if (!rec) { rec = DEFAULT_RECETARIO; await safeSet("catalogo-recetario", JSON.stringify(rec)); } else rec = JSON.parse(rec);

      let stockActual = await safeGet("stock-insumos");
      stockActual = stockActual ? JSON.parse(stockActual) : {};

      const resultadoMigracion = await ejecutarMigracionCatalogo(prod, rec, stockActual);
      if (resultadoMigracion) {
        prod = resultadoMigracion.productos;
        rec = resultadoMigracion.recetario;
        stockActual = resultadoMigracion.stockInsumos;
        await safeSet("catalogo-productos", JSON.stringify(prod));
        await safeSet("catalogo-recetario", JSON.stringify(rec));
        await safeSet("stock-insumos", JSON.stringify(stockActual));
      }

      setProductos(prod); setPersonas(per); setBufets(buf); setRecetario(rec);
      await refrescarDatosHoy();
      await verificarGuardado();
      setLoading(false);
    })();
  }, []);

  useEffect(() => { if (view === "home") refrescarDatosHoy(); }, [view]);

  useEffect(() => {
    if (view !== "resumen") return;
    (async () => {
      setResumenLoading(true);
      const insList = await safeListPrefix(`insumo-entrada-${resumenFecha}-`); setResumenInsumos(insList.map((r) => r.value));
      const prodList = await safeListPrefix(`produccion-entrada-${resumenFecha}-`); setResumenProduccion(prodList.map((r) => r.value));
      const cierreRaw = await safeGet(`cierre-${resumenFecha}`); setResumenCierre(cierreRaw ? JSON.parse(cierreRaw) : null);
      setResumenLoading(false);
    })();
  }, [view, resumenFecha]);

  function showStamp(text) {
    setStamp({ text, error: false });
    if (stampTimer.current) clearTimeout(stampTimer.current);
    stampTimer.current = setTimeout(() => setStamp(null), 1100);
  }
  function showStampError(text) {
    setStamp({ text, error: true });
    if (stampTimer.current) clearTimeout(stampTimer.current);
    stampTimer.current = setTimeout(() => setStamp(null), 2200);
  }
  function goProtected(target) {
    if (authenticated) setView(target);
    else { setPendingView(target); setPinInput(""); setPinError(false); setView("pin"); }
  }
  function confirmPin() {
    if (pinInput === PIN) { setAuthenticated(true); setAdminActual(responsableInput); setView(pendingView || "home"); setPinError(false); }
    else { setPinError(true); setPinInput(""); }
  }

  async function guardarInsumo(entry) {
    const previos = insumosHoy;
    setInsumosHoy([...insumosHoy, entry]);
    const ok1 = await safeSet(`insumo-entrada-${todayKey()}-${entry.id}`, JSON.stringify(entry));
    const nuevoStock = ok1 ? await ajustarStock(entry.productoId, entry.cantidad) : null;
    if (!ok1 || !nuevoStock) {
      setInsumosHoy(previos);
      setStorageOk(false);
      showStampError("NO SE GUARDÓ — reintentá");
      return;
    }
    setStockInsumos(nuevoStock);
    showStamp("INSUMO CARGADO");
  }
  async function deshacerInsumo(id) {
    const entry = insumosHoy.find((e) => e.id === id);
    const previos = insumosHoy;
    setInsumosHoy(insumosHoy.filter((e) => e.id !== id));
    const ok1 = await safeDelete(`insumo-entrada-${todayKey()}-${id}`);
    if (!ok1) { setInsumosHoy(previos); setStorageOk(false); showStampError("NO SE PUDO DESHACER"); return; }
    if (entry) { const nuevoStock = await ajustarStock(entry.productoId, -entry.cantidad); if (nuevoStock) setStockInsumos(nuevoStock); else setStorageOk(false); }
  }
  async function guardarProduccion(entry) {
    const previos = produccionHoy;
    setProduccionHoy([...produccionHoy, entry]);
    const ok1 = await safeSet(`produccion-entrada-${todayKey()}-${entry.id}`, JSON.stringify(entry));
    const nuevoStock = ok1 ? await aplicarStockPorProduccion(recetario, entry.productoId, entry.cantidad, -1) : null;
    if (!ok1 || !nuevoStock) {
      setProduccionHoy(previos);
      setStorageOk(false);
      showStampError("NO SE GUARDÓ — reintentá");
      return;
    }
    setStockInsumos(nuevoStock);
    showStamp("PRODUCCIÓN CARGADA");
  }
  async function deshacerProduccion(id) {
    const entry = produccionHoy.find((e) => e.id === id);
    const previos = produccionHoy;
    setProduccionHoy(produccionHoy.filter((e) => e.id !== id));
    const ok1 = await safeDelete(`produccion-entrada-${todayKey()}-${id}`);
    if (!ok1) { setProduccionHoy(previos); setStorageOk(false); showStampError("NO SE PUDO DESHACER"); return; }
    if (entry) { const nuevoStock = await aplicarStockPorProduccion(recetario, entry.productoId, entry.cantidad, 1); if (nuevoStock) setStockInsumos(nuevoStock); else setStorageOk(false); }
  }

  async function guardarCatalogo(tipo, data) {
    const previo = tipo === "productos" ? productos : tipo === "personas" ? personas : bufets;
    if (tipo === "productos") setProductos(data);
    else if (tipo === "personas") setPersonas(data);
    else if (tipo === "bufets") setBufets(data);
    const ok = await safeSet(`catalogo-${tipo}`, JSON.stringify(data));
    if (!ok) {
      if (tipo === "productos") setProductos(previo);
      else if (tipo === "personas") setPersonas(previo);
      else if (tipo === "bufets") setBufets(previo);
      setStorageOk(false);
      showStampError("NO SE GUARDÓ — reintentá");
    }
    return ok;
  }
  async function actualizarCostoInsumo(insumoId, nuevoCosto) {
    const actualizados = productos.map((p) => (p.id === insumoId ? { ...p, costo: round2(nuevoCosto) } : p));
    await guardarCatalogo("productos", actualizados);
  }
  async function guardarRecetario(productoId, nuevaLista) {
    const previo = recetario;
    const nuevo = { ...recetario, [productoId]: nuevaLista };
    setRecetario(nuevo);
    const ok = await safeSet("catalogo-recetario", JSON.stringify(nuevo));
    if (!ok) { setRecetario(previo); setStorageOk(false); showStampError("NO SE GUARDÓ — reintentá"); }
    return ok;
  }
  async function guardarStockValor(insumoId, nuevoValor) {
    const previo = stockInsumos;
    const stock = { ...stockInsumos, [insumoId]: round2(nuevoValor) };
    setStockInsumos(stock);
    const ok = await safeSet("stock-insumos", JSON.stringify(stock));
    if (!ok) { setStockInsumos(previo); setStorageOk(false); showStampError("NO SE GUARDÓ — reintentá"); }
    return ok;
  }

  async function toggleCierre(fecha) {
    const estaCerrado = resumenCierre && resumenCierre.cerrado;
    if (estaCerrado) {
      const ok = await safeSet(`cierre-${fecha}`, JSON.stringify(null));
      if (!ok) { setStorageOk(false); showStampError("NO SE GUARDÓ — reintentá"); return; }
      setResumenCierre(null);
      await registrarAuditoria(fecha, adminActual, "Reabrió el día", `Se reabrió el día ${fecha} para carga.`);
    } else {
      const info = { cerrado: true, responsable: adminActual, hora: horaAhora() };
      const ok = await safeSet(`cierre-${fecha}`, JSON.stringify(info));
      if (!ok) { setStorageOk(false); showStampError("NO SE GUARDÓ — reintentá"); return; }
      setResumenCierre(info);
      await registrarAuditoria(fecha, adminActual, "Cerró el día", `Se cerró el día ${fecha}, ya no se puede cargar.`);
    }
    if (fecha === todayKey()) refrescarDatosHoy();
  }

  if (loading) {
    return (
      <div style={{ background: C.paper, fontFamily: "Inter, sans-serif" }} className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={28} color={C.inkSoft} />
      </div>
    );
  }

  const insumosCatalogo = productos.filter((p) => p.tipo === "insumo");

  return (
    <div style={{ background: C.paper, fontFamily: "Inter, sans-serif", color: C.ink }} className="min-h-screen">
      <style>{`
        @keyframes stampIn { 0% { opacity:0; transform:translate(-50%,-50%) scale(1.7) rotate(-10deg);} 55% {opacity:1; transform:translate(-50%,-50%) scale(0.95) rotate(-10deg);} 100%{opacity:1; transform:translate(-50%,-50%) scale(1) rotate(-10deg);} }
        .stamp-anim { animation: stampIn 0.35s ease-out; }
        .ticket-num { font-family: 'JetBrains Mono', monospace; }
        .display-font { font-family: 'Bebas Neue', 'Inter', sans-serif; letter-spacing: 0.04em; }
        input:focus, select:focus, button:focus { outline: 2px solid ${C.tealDark}; outline-offset: 2px; }
        .tabs-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="max-w-md mx-auto min-h-screen relative" style={{ background: C.white, boxShadow: "0 0 0 1px " + C.line }}>
        {stamp && (
          <div className="stamp-anim" style={{ position: "fixed", top: "40%", left: "50%", zIndex: 50, border: `4px solid ${stamp.error ? C.red : C.green}`, color: stamp.error ? C.red : C.green, padding: "10px 22px", borderRadius: 8, fontFamily: "Bebas Neue, sans-serif", fontSize: stamp.error ? 20 : 26, letterSpacing: "0.06em", background: "rgba(255,253,249,0.97)", pointerEvents: "none", textAlign: "center", maxWidth: "80%" }}>
            {stamp.error ? "✕" : "✓"} {stamp.text}
          </div>
        )}

        {view === "home" && <Home goProtected={goProtected} setView={setView} authenticated={authenticated} cierreHoy={cierreHoy} storageOk={storageOk} onVerificarGuardado={verificarGuardado} />}
        {view === "pin" && (
          <PinScreen pinInput={pinInput} setPinInput={setPinInput} responsableInput={responsableInput} setResponsableInput={setResponsableInput} pinError={pinError} confirmPin={confirmPin} onBack={() => setView("home")} />
        )}
        {view === "insumos" && (
          <CargarInsumos productos={productos.filter((p) => p.tipo === "insumo")} personas={personas} entradas={insumosHoy} cierreHoy={cierreHoy} stock={stockInsumos} onGuardar={guardarInsumo} onDeshacer={deshacerInsumo} onActualizarCosto={actualizarCostoInsumo} onBack={() => setView("home")} />
        )}
        {view === "produccion" && (
          <CargarProduccion productos={productos.filter((p) => p.tipo === "comida")} personas={personas} bufets={bufets} entradas={produccionHoy} cierreHoy={cierreHoy} recetario={recetario} insumosCatalogo={insumosCatalogo} onGuardar={guardarProduccion} onDeshacer={deshacerProduccion} onBack={() => setView("home")} />
        )}
        {view === "resumen" && (
          <Resumen fecha={resumenFecha} setFecha={setResumenFecha} insumos={resumenInsumos} produccion={resumenProduccion} cierre={resumenCierre} loading={resumenLoading}
            onToggleCierre={() => toggleCierre(resumenFecha)} onVerDetalle={() => setView("detalle")} onVerHistorial={() => setView("historial")} onVerStock={() => setView("stock")} onBack={() => setView("home")} />
        )}
        {view === "stock" && <StockView productos={insumosCatalogo} stock={stockInsumos} onBack={() => setView("resumen")} />}
        {view === "detalle" && <Detalle fecha={resumenFecha} adminActual={adminActual} recetario={recetario} onBack={() => setView("resumen")} />}
        {view === "historial" && <Historial fecha={resumenFecha} onBack={() => setView("resumen")} />}
        {view === "config" && (
          <Configuracion tab={configTab} setTab={setConfigTab} productos={productos} personas={personas} bufets={bufets} recetario={recetario} stockInsumos={stockInsumos}
            onGuardar={guardarCatalogo} onGuardarRecetario={guardarRecetario} onGuardarStockValor={guardarStockValor} onBack={() => setView("home")} />
        )}
      </div>
    </div>
  );
}

// ================= HOME =================
function Home({ goProtected, setView, authenticated, cierreHoy, storageOk, onVerificarGuardado }) {
  const [verificando, setVerificando] = useState(false);
  async function reintentar() {
    setVerificando(true);
    await onVerificarGuardado();
    setVerificando(false);
  }
  return (
    <div>
      <Header title="Centro de Producción" subtitle={formatFecha(todayKey())} />
      {storageOk === false && (
        <div className="mx-4 mt-4 p-3 rounded-xl flex items-start gap-2" style={{ background: "#F5E4E2", border: `2px solid ${C.red}` }}>
          <ShieldAlert size={20} color={C.red} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div style={{ fontSize: 13, color: C.red, fontWeight: 700 }}>El guardado automático no está funcionando</div>
            <div style={{ fontSize: 12, color: C.red, marginTop: 2 }}>Lo que cargues ahora puede no quedar guardado. No sigas cargando hasta que esto diga "funcionando".</div>
            <button onClick={reintentar} disabled={verificando} className="mt-2 rounded-lg px-3 py-1.5" style={{ background: C.red, color: C.white, fontSize: 12, fontWeight: 700 }}>
              {verificando ? "Probando..." : "Reintentar"}
            </button>
          </div>
        </div>
      )}
      {storageOk === true && (
        <div className="mx-4 mt-4 p-2 rounded-xl flex items-center gap-2" style={{ background: "#E3EFE8", border: `1px solid ${C.green}` }}>
          <Check size={15} color={C.green} className="flex-shrink-0" />
          <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Guardado automático funcionando</div>
        </div>
      )}
      {cierreHoy && cierreHoy.cerrado && (
        <div className="mx-4 mt-4 p-3 rounded-xl flex items-start gap-2" style={{ background: "#F5E4E2", border: `1px solid ${C.red}` }}>
          <ShieldAlert size={18} color={C.red} className="flex-shrink-0 mt-0.5" />
          <div style={{ fontSize: 12.5, color: C.red }}>El día de hoy está <strong>cerrado</strong> ({cierreHoy.responsable}, {cierreHoy.hora}). Reabrilo desde Resumen del Día con PIN.</div>
        </div>
      )}
      <div className="p-4 flex flex-col gap-3">
        <Tile icon={<Package size={26} color={C.white} />} bg={C.teal} title="Cargar Insumos" desc="Materia prima y consumibles que entran" onClick={() => setView("insumos")} />
        <Tile icon={<ChefHat size={26} color={C.white} />} bg={C.amber} title="Cargar Producción" desc="Qué se hizo hoy y para qué bufet" onClick={() => setView("produccion")} />
        <Tile icon={<BarChart3 size={26} color={C.white} />} bg={C.ink} title="Resumen del Día" desc="Totales, stock, cierre y correcciones" locked={!authenticated} onClick={() => goProtected("resumen")} />
        <Tile icon={<Settings size={26} color={C.white} />} bg={C.inkSoft} title="Configuración" desc="Productos, recetario, stock y más" locked={!authenticated} onClick={() => goProtected("config")} />
      </div>
      <div className="px-4 pb-6 pt-2 text-center" style={{ color: C.inkSoft, fontSize: 12 }}>
        Prototipo · Tocá "Compartir" en tu navegador y "Agregar a pantalla de inicio" para acceso rápido.
      </div>
    </div>
  );
}
function Tile({ icon, bg, title, desc, onClick, locked }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-2xl text-left active:scale-[0.98] transition-transform" style={{ background: C.white, border: `1px solid ${C.line}`, minHeight: 84 }}>
      <div className="rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg, width: 56, height: 56 }}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2"><span className="display-font" style={{ fontSize: 22, color: C.ink }}>{title}</span>{locked && <Lock size={14} color={C.inkSoft} />}</div>
        <div style={{ fontSize: 13, color: C.inkSoft }}>{desc}</div>
      </div>
    </button>
  );
}
function Header({ title, subtitle, onBack }) {
  return (
    <div className="px-4 pt-6 pb-4" style={{ background: C.ink, color: C.white, borderBottom: `3px dashed ${C.paperDark}` }}>
      {onBack && <button onClick={onBack} className="mb-2 flex items-center gap-1 opacity-80" style={{ fontSize: 13 }}><ArrowLeft size={16} /> Volver</button>}
      <div className="display-font" style={{ fontSize: 30, lineHeight: 1 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, opacity: 0.75, textTransform: "capitalize", marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

// ================= PIN =================
function PinScreen({ pinInput, setPinInput, responsableInput, setResponsableInput, pinError, confirmPin, onBack }) {
  return (
    <div>
      <Header title="Zona protegida" onBack={onBack} />
      <div className="p-6 flex flex-col items-center gap-4">
        <Lock size={32} color={C.inkSoft} />
        <div style={{ color: C.inkSoft, fontSize: 14, textAlign: "center" }}>Elegí quién sos e ingresá el PIN.</div>
        <div className="w-full"><Field label="¿Quién ingresa?"><Select value={responsableInput} onChange={setResponsableInput} options={ADMIN_NAMES.map((n) => ({ value: n, label: n }))} /></Field></div>
        <input type="password" inputMode="numeric" maxLength={6} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && confirmPin()}
          className="text-center rounded-xl px-4 py-3 w-40" style={{ border: `2px solid ${pinError ? C.red : C.line}`, fontSize: 24, letterSpacing: "0.3em" }} autoFocus />
        {pinError && <div style={{ color: C.red, fontSize: 13 }}>PIN incorrecto, probá de nuevo.</div>}
        <button onClick={confirmPin} className="w-full rounded-xl py-3 display-font" style={{ background: C.teal, color: C.white, fontSize: 20, letterSpacing: "0.05em" }}>Ingresar</button>
      </div>
    </div>
  );
}

// ================= DESHACER =================
function useTick(intervalMs) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), intervalMs); return () => clearInterval(id); }, [intervalMs]);
  return tick;
}
function BotonDeshacer({ entry, onDeshacer }) {
  useTick(1000);
  const creadoEn = Number(entry.id) || 0;
  const restante = VENTANA_DESHACER_MS - (Date.now() - creadoEn);
  if (restante <= 0 || !creadoEn) return null;
  const seg = Math.ceil(restante / 1000);
  const mm = String(Math.floor(seg / 60)).padStart(1, "0");
  const ss = String(seg % 60).padStart(2, "0");
  return (
    <button onClick={() => onDeshacer(entry.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full flex-shrink-0" style={{ background: C.paperDark, color: C.inkSoft, fontSize: 12 }}>
      <Undo2 size={13} /> Deshacer ({mm}:{ss})
    </button>
  );
}
function BloqueoCierre({ cierreHoy, onBack }) {
  return (
    <div>
      <Header title="Día cerrado" onBack={onBack} />
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <Lock size={30} color={C.inkSoft} />
        <div style={{ color: C.inkSoft, fontSize: 14 }}>El día de hoy fue cerrado por <strong>{cierreHoy.responsable}</strong> a las {cierreHoy.hora}.<br />Reabrilo desde "Resumen del Día" con el PIN.</div>
      </div>
    </div>
  );
}

// ================= CARGAR INSUMOS =================
function CargarInsumos({ productos, personas, entradas, cierreHoy, stock, onGuardar, onDeshacer, onActualizarCosto, onBack }) {
  const [personaId, setPersonaId] = useState(personas[0]?.id || "");
  const [productoId, setProductoId] = useState(productos[0]?.id || "");
  const [cantidad, setCantidad] = useState(1);
  const [montoBoleta, setMontoBoleta] = useState("");
  const producto = productos.find((p) => p.id === productoId);
  const stockActual = producto ? round2(stock[producto.id] || 0) : 0;
  const costoCalculado = montoBoleta && cantidad ? Number(montoBoleta) / Number(cantidad) : null;

  if (cierreHoy && cierreHoy.cerrado) return <BloqueoCierre cierreHoy={cierreHoy} onBack={onBack} />;
  if (productos.length === 0) return <EmptyCatalog onBack={onBack} tipo="insumos" />;

  function guardar() {
    if (!personaId || !producto || !cantidad || cantidad <= 0) return;
    const persona = personas.find((x) => x.id === personaId);
    onGuardar({ id: Date.now().toString(), personaId, personaNombre: persona?.nombre || "", productoId, productoNombre: producto.nombre, cantidad: Number(cantidad), unidad: producto.unidad, hora: horaAhora() });
    if (montoBoleta && Number(montoBoleta) > 0) {
      onActualizarCosto(producto.id, Number(montoBoleta) / Number(cantidad));
    }
    setCantidad(1);
    setMontoBoleta("");
  }

  return (
    <div>
      <Header title="Cargar Insumos" subtitle="Lo que entra al Centro de Producción" onBack={onBack} />
      <div className="p-4 flex flex-col gap-4">
        <Field label="¿Quién carga?"><Select value={personaId} onChange={setPersonaId} options={personas.map((p) => ({ value: p.id, label: p.nombre }))} /></Field>
        <Field label="Insumo"><Select value={productoId} onChange={setProductoId} options={productos.map((p) => ({ value: p.id, label: `${p.nombre} (${p.unidad})` }))} /></Field>
        {producto && (
          <div className="rounded-xl px-3 py-2 flex items-center justify-between" style={{ background: C.paperDark }}>
            <span style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 600 }}>Stock actual de {producto.nombre}</span>
            <span className="ticket-num" style={{ fontSize: 15, fontWeight: 700, color: C.teal }}>{stockActual} {producto.unidad}</span>
          </div>
        )}
        <Field label={`Cantidad (${producto?.unidad || ""})`}><Stepper value={cantidad} setValue={setCantidad} /></Field>
        <Field label="¿Cuánto pagaste por esta compra? (boleta, opcional)">
          <input type="number" value={montoBoleta} onChange={(e) => setMontoBoleta(e.target.value)} className="w-full rounded-lg px-3 py-2.5" style={{ border: `1px solid ${C.line}`, fontSize: 15 }} placeholder="$ ej: 3500" />
        </Field>
        {costoCalculado != null && (
          <div className="rounded-xl px-3 py-2 flex items-center justify-between" style={{ background: "#E3EFE8" }}>
            <span style={{ fontSize: 12.5, color: C.tealDark, fontWeight: 600 }}>Queda guardado a</span>
            <span className="ticket-num" style={{ fontSize: 14, fontWeight: 700, color: C.tealDark }}>{money(costoCalculado)} / {producto?.unidad}</span>
          </div>
        )}
        <button onClick={guardar} className="w-full rounded-xl py-4 display-font flex items-center justify-center gap-2" style={{ background: C.teal, color: C.white, fontSize: 22, letterSpacing: "0.05em" }}><Check size={22} /> Guardar</button>
      </div>
      <EntradasHoy titulo="Insumos cargados hoy" entradas={entradas} onDeshacer={onDeshacer} />
    </div>
  );
}

// ================= CARGAR PRODUCCIÓN =================
function CargarProduccion({ productos, personas, bufets, entradas, cierreHoy, recetario, insumosCatalogo, onGuardar, onDeshacer, onBack }) {
  const [personaId, setPersonaId] = useState(personas[0]?.id || "");
  const [productoId, setProductoId] = useState(productos[0]?.id || "");
  const [bufetId, setBufetId] = useState("general");
  const [cantidad, setCantidad] = useState(1);
  const producto = productos.find((p) => p.id === productoId);

  if (cierreHoy && cierreHoy.cerrado) return <BloqueoCierre cierreHoy={cierreHoy} onBack={onBack} />;
  if (productos.length === 0) return <EmptyCatalog onBack={onBack} tipo="productos de comida" />;

  const receta = recetario[productoId] || [];
  const consumo = receta.map((ing) => {
    const insumo = insumosCatalogo.find((i) => i.id === ing.insumoId);
    return { nombre: insumo?.nombre || ing.insumoId, cantidad: round2(ing.cantidad * (Number(cantidad) || 0)), unidad: insumo?.unidad || "" };
  });

  function guardar() {
    if (!personaId || !producto || !cantidad || cantidad <= 0) return;
    const persona = personas.find((x) => x.id === personaId);
    const bufet = bufets.find((b) => b.id === bufetId);
    onGuardar({
      id: Date.now().toString(), personaId, personaNombre: persona?.nombre || "", productoId, productoNombre: producto.nombre,
      cantidad: Number(cantidad), costo: producto.costo, precioVenta: producto.precioVenta,
      bufetId: bufetId === "general" ? null : bufetId, bufetNombre: bufetId === "general" ? "Sin destino / general" : bufet?.nombre || "", hora: horaAhora(),
    });
    setCantidad(1);
  }

  return (
    <div>
      <Header title="Cargar Producción" subtitle="Qué se hizo hoy" onBack={onBack} />
      <div className="p-4 flex flex-col gap-4">
        <Field label="¿Quién carga?"><Select value={personaId} onChange={setPersonaId} options={personas.map((p) => ({ value: p.id, label: p.nombre }))} /></Field>
        <Field label="Producto"><Select value={productoId} onChange={setProductoId} options={productos.map((p) => ({ value: p.id, label: p.nombre }))} /></Field>
        <Field label="Destino"><Select value={bufetId} onChange={setBufetId} options={[{ value: "general", label: "Sin destino / general" }, ...bufets.map((b) => ({ value: b.id, label: b.nombre }))]} /></Field>
        <Field label="Cantidad producida (unidades)"><Stepper value={cantidad} setValue={setCantidad} /></Field>

        {consumo.length > 0 && (
          <div className="rounded-xl p-3" style={{ background: C.paperDark }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Esto va a consumir (según receta)</div>
            {consumo.map((c) => (
              <div key={c.nombre} className="flex justify-between" style={{ fontSize: 12.5, color: C.ink, paddingTop: 2 }}>
                <span>{c.nombre}</span><span className="ticket-num">{c.cantidad} {c.unidad}</span>
              </div>
            ))}
          </div>
        )}
        {receta.length === 0 && (
          <div className="rounded-xl p-3 text-center" style={{ background: C.paperDark, color: C.inkSoft, fontSize: 12 }}>Este producto todavía no tiene receta cargada — no va a descontar stock.</div>
        )}

        <button onClick={guardar} className="w-full rounded-xl py-4 display-font flex items-center justify-center gap-2" style={{ background: C.amber, color: C.white, fontSize: 22, letterSpacing: "0.05em" }}><Check size={22} /> Guardar</button>
      </div>
      <EntradasHoy titulo="Producción cargada hoy" entradas={entradas} onDeshacer={onDeshacer} mostrarBufet />
    </div>
  );
}

// ================= RESUMEN =================
function Resumen({ fecha, setFecha, insumos, produccion, cierre, loading, onToggleCierre, onVerDetalle, onVerHistorial, onVerStock, onBack }) {
  const porProducto = {};
  produccion.forEach((e) => {
    if (!porProducto[e.productoNombre]) porProducto[e.productoNombre] = { cantidad: 0, costo: 0, venta: 0 };
    porProducto[e.productoNombre].cantidad += e.cantidad;
    porProducto[e.productoNombre].costo += e.cantidad * (e.costo || 0);
    porProducto[e.productoNombre].venta += e.cantidad * (e.precioVenta || 0);
  });
  const totalCosto = Object.values(porProducto).reduce((a, b) => a + b.costo, 0);
  const totalVenta = Object.values(porProducto).reduce((a, b) => a + b.venta, 0);
  const margen = totalVenta - totalCosto;

  const insumosAgrupados = {};
  insumos.forEach((e) => {
    const k = `${e.productoNombre}__${e.unidad}`;
    if (!insumosAgrupados[k]) insumosAgrupados[k] = { nombre: e.productoNombre, unidad: e.unidad, cantidad: 0 };
    insumosAgrupados[k].cantidad += e.cantidad;
  });

  function exportarCSV() {
    let csv = `Centro de Produccion - ${fecha}\n\nPRODUCCION\nProducto,Cantidad,Bufet,Persona,Hora,Costo unit,Venta unit\n`;
    produccion.forEach((e) => { csv += `${e.productoNombre},${e.cantidad},${e.bufetNombre || ""},${e.personaNombre},${e.hora},${e.costo || 0},${e.precioVenta || 0}\n`; });
    csv += "\nINSUMOS\nInsumo,Cantidad,Unidad,Persona,Hora\n";
    insumos.forEach((e) => { csv += `${e.productoNombre},${e.cantidad},${e.unidad},${e.personaNombre},${e.hora}\n`; });
    csv += `\nTOTALES\nCosto total,${totalCosto}\nVenta potencial,${totalVenta}\nMargen,${margen}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `centro-produccion-${fecha}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  const cerrado = cierre && cierre.cerrado;

  return (
    <div>
      <Header title="Resumen del Día" onBack={onBack} />
      <div className="px-4 pt-4 flex items-center justify-between">
        <button onClick={() => setFecha(addDays(fecha, -1))} className="p-2 rounded-full" style={{ background: C.paperDark }}><ChevronLeft size={18} /></button>
        <div className="text-center"><div style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>{formatFecha(fecha)}</div></div>
        <button onClick={() => setFecha(addDays(fecha, 1))} disabled={fecha >= todayKey()} className="p-2 rounded-full" style={{ background: C.paperDark, opacity: fecha >= todayKey() ? 0.4 : 1 }}><ChevronRight size={18} /></button>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center"><Loader2 className="animate-spin" color={C.inkSoft} /></div>
      ) : (
        <div className="p-4 flex flex-col gap-5">
          <div className="rounded-2xl p-4" style={{ background: C.ink, color: C.white }}>
            <div style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em" }}>Producción del día, en pesos</div>
            <div className="flex justify-between items-end mt-2">
              <div><div style={{ fontSize: 11, opacity: 0.7 }}>Costo total</div><div className="ticket-num" style={{ fontSize: 20 }}>{money(totalCosto)}</div></div>
              <div><div style={{ fontSize: 11, opacity: 0.7 }}>Venta potencial</div><div className="ticket-num" style={{ fontSize: 20 }}>{money(totalVenta)}</div></div>
              <div><div style={{ fontSize: 11, opacity: 0.7 }}>Margen</div><div className="ticket-num" style={{ fontSize: 20, color: C.amber }}>{money(margen)}</div></div>
            </div>
          </div>

          <button onClick={onVerStock} className="w-full rounded-xl py-3 flex items-center justify-center gap-2" style={{ background: C.teal, color: C.white }}>
            <Boxes size={18} /><span style={{ fontSize: 14, fontWeight: 700 }}>Ver stock de insumos</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={onToggleCierre} className="rounded-xl py-3 flex flex-col items-center gap-1" style={{ background: cerrado ? "#F5E4E2" : C.paperDark, color: cerrado ? C.red : C.ink }}>
              {cerrado ? <Unlock size={18} /> : <Lock size={18} />}<span style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}>{cerrado ? "Reabrir día" : "Cerrar día"}</span>
            </button>
            <button onClick={exportarCSV} className="rounded-xl py-3 flex flex-col items-center gap-1" style={{ background: C.paperDark, color: C.ink }}>
              <Download size={18} /><span style={{ fontSize: 12, fontWeight: 600 }}>Exportar CSV</span>
            </button>
            <button onClick={onVerDetalle} className="rounded-xl py-3 flex flex-col items-center gap-1" style={{ background: C.paperDark, color: C.ink }}>
              <Pencil size={18} /><span style={{ fontSize: 12, fontWeight: 600 }}>Ver y corregir</span>
            </button>
            <button onClick={onVerHistorial} className="rounded-xl py-3 flex flex-col items-center gap-1" style={{ background: C.paperDark, color: C.ink }}>
              <History size={18} /><span style={{ fontSize: 12, fontWeight: 600 }}>Historial</span>
            </button>
          </div>

          {cerrado && <div className="rounded-xl p-3 text-center" style={{ background: "#F5E4E2", color: C.red, fontSize: 12.5 }}>Día cerrado por {cierre.responsable} a las {cierre.hora}.</div>}

          <div>
            <SectionLabel>Producción por producto</SectionLabel>
            {Object.keys(porProducto).length === 0 ? <EmptyNote text="No se cargó producción este día." /> : (
              <ReceiptList>{Object.entries(porProducto).map(([nombre, d]) => (<ReceiptRow key={nombre} left={nombre} right={`${d.cantidad} u. · ${money(d.costo)}`} />))}</ReceiptList>
            )}
          </div>
          <div>
            <SectionLabel>Insumos cargados</SectionLabel>
            {Object.keys(insumosAgrupados).length === 0 ? <EmptyNote text="No se cargaron insumos este día." /> : (
              <ReceiptList>{Object.values(insumosAgrupados).map((d) => (<ReceiptRow key={d.nombre + d.unidad} left={d.nombre} right={`${d.cantidad} ${d.unidad}`} />))}</ReceiptList>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) { return <div className="display-font mb-2" style={{ fontSize: 18, color: C.inkSoft }}>{children}</div>; }
function EmptyNote({ text }) { return <div className="rounded-xl p-3 text-center" style={{ background: C.paperDark, color: C.inkSoft, fontSize: 13 }}>{text}</div>; }
function ReceiptList({ children }) { return <div className="rounded-xl p-3" style={{ background: C.white, border: `1px solid ${C.line}` }}>{children}</div>; }
function ReceiptRow({ left, right }) {
  return (
    <div className="flex items-baseline gap-2 py-1.5" style={{ borderBottom: `1px dashed ${C.line}` }}>
      <div style={{ fontSize: 13.5 }}>{left}</div>
      <div className="flex-1" style={{ borderBottom: `1px dotted ${C.line}`, marginBottom: 3 }} />
      <div className="ticket-num" style={{ fontSize: 13 }}>{right}</div>
    </div>
  );
}

// ================= STOCK (solo ver) =================
function StockView({ productos, stock, onBack }) {
  const ordenados = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  return (
    <div>
      <Header title="Stock de Insumos" subtitle="Nivel teórico actual" onBack={onBack} />
      <div className="p-4 flex flex-col gap-2">
        {ordenados.map((p) => {
          const cantidad = stock[p.id] || 0;
          const bajo = cantidad <= 0;
          return (
            <div key={p.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: C.white, border: `1px solid ${bajo ? C.red : C.line}` }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nombre}</div>
              <div className="ticket-num" style={{ fontSize: 14, color: bajo ? C.red : C.ink, fontWeight: 700 }}>{round2(cantidad)} {p.unidad}</div>
            </div>
          );
        })}
      </div>
      <div className="px-4 pb-8 text-center" style={{ fontSize: 12, color: C.inkSoft }}>
        Para ajustar estos números (conteo inicial o recuento físico), andá a Configuración → Stock.
      </div>
    </div>
  );
}

// ================= DETALLE Y CORRECCIONES =================
function Detalle({ fecha, adminActual, recetario, onBack }) {
  const [insumos, setInsumos] = useState([]);
  const [produccion, setProduccion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [valorEdit, setValorEdit] = useState("");
  const [motivo, setMotivo] = useState("");

  async function cargar() {
    setLoading(true);
    const insList = await safeListPrefix(`insumo-entrada-${fecha}-`); setInsumos(insList.map((r) => r.value));
    const prodList = await safeListPrefix(`produccion-entrada-${fecha}-`); setProduccion(prodList.map((r) => r.value));
    setLoading(false);
  }
  useEffect(() => { cargar(); }, [fecha]);

  function abrirAccion(tipo, id, accion, cantidadActual) { setEditando({ tipo, id, accion }); setValorEdit(String(cantidadActual)); setMotivo(""); }
  function cancelar() { setEditando(null); setMotivo(""); }

  async function confirmar() {
    if (!motivo.trim()) return;
    const lista = editando.tipo === "insumo" ? insumos : produccion;
    const prefijo = editando.tipo === "insumo" ? "insumo-entrada" : "produccion-entrada";
    const key = `${prefijo}-${fecha}-${editando.id}`;
    const entry = lista.find((e) => e.id === editando.id);
    if (!entry) return;

    if (editando.accion === "eliminar") {
      await safeDelete(key);
      const actualizados = lista.filter((e) => e.id !== editando.id);
      editando.tipo === "insumo" ? setInsumos(actualizados) : setProduccion(actualizados);
      if (editando.tipo === "insumo") await ajustarStock(entry.productoId, -entry.cantidad);
      else await aplicarStockPorProduccion(recetario, entry.productoId, entry.cantidad, 1);
      await registrarAuditoria(fecha, adminActual, "Eliminó carga",
        `${editando.tipo === "insumo" ? "Insumo" : "Producción"}: ${entry.productoNombre} · ${entry.cantidad} ${entry.unidad || "u."} (cargado por ${entry.personaNombre} a las ${entry.hora}). Motivo: ${motivo.trim()}`);
    } else {
      const nuevaCantidad = Number(valorEdit);
      if (!nuevaCantidad || nuevaCantidad <= 0) return;
      const entryActualizado = { ...entry, cantidad: nuevaCantidad };
      await safeSet(key, JSON.stringify(entryActualizado));
      const actualizados = lista.map((e) => (e.id === editando.id ? entryActualizado : e));
      editando.tipo === "insumo" ? setInsumos(actualizados) : setProduccion(actualizados);
      const delta = nuevaCantidad - entry.cantidad;
      if (editando.tipo === "insumo") await ajustarStock(entry.productoId, delta);
      else await aplicarStockPorProduccion(recetario, entry.productoId, delta, -1);
      await registrarAuditoria(fecha, adminActual, "Editó cantidad",
        `${editando.tipo === "insumo" ? "Insumo" : "Producción"}: ${entry.productoNombre} · de ${entry.cantidad} a ${nuevaCantidad} ${entry.unidad || "u."} (cargado por ${entry.personaNombre} a las ${entry.hora}). Motivo: ${motivo.trim()}`);
    }
    cancelar();
  }

  function Fila({ tipo, e }) {
    const activa = editando && editando.id === e.id && editando.tipo === tipo;
    return (
      <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: C.white, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{e.productoNombre}</div>
            <div style={{ fontSize: 12, color: C.inkSoft }}>{e.cantidad} {e.unidad || "u."} · {e.personaNombre} · {e.hora}{e.bufetNombre ? ` · ${e.bufetNombre}` : ""}</div>
          </div>
          {!activa && (
            <div className="flex gap-1">
              <button onClick={() => abrirAccion(tipo, e.id, "editar", e.cantidad)} className="p-2 rounded-full" style={{ color: C.inkSoft }}><Pencil size={16} /></button>
              <button onClick={() => abrirAccion(tipo, e.id, "eliminar", e.cantidad)} className="p-2 rounded-full" style={{ color: C.red }}><Trash2 size={16} /></button>
            </div>
          )}
        </div>
        {activa && (
          <div className="pt-2 flex flex-col gap-2" style={{ borderTop: `1px dashed ${C.line}` }}>
            {editando.accion === "editar" && (
              <Field label="Nueva cantidad"><input type="number" value={valorEdit} onChange={(ev) => setValorEdit(ev.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} /></Field>
            )}
            <Field label={editando.accion === "eliminar" ? "Motivo de la eliminación (obligatorio)" : "Motivo del cambio (obligatorio)"}>
              <input value={motivo} onChange={(ev) => setMotivo(ev.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} placeholder="Ej: se cargó por error, cantidad mal tipeada..." />
            </Field>
            <div className="flex gap-2">
              <button onClick={cancelar} className="flex-1 rounded-lg py-2 flex items-center justify-center gap-1" style={{ background: C.paperDark, color: C.ink, fontSize: 13 }}><X size={15} /> Cancelar</button>
              <button onClick={confirmar} disabled={!motivo.trim()} className="flex-1 rounded-lg py-2 flex items-center justify-center gap-1" style={{ background: editando.accion === "eliminar" ? C.red : C.teal, color: C.white, fontSize: 13, opacity: motivo.trim() ? 1 : 0.5 }}>
                <Check size={15} /> Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <Header title="Ver y corregir" subtitle={formatFecha(fecha)} onBack={onBack} />
      <div className="p-4 rounded-xl mx-4 mt-4" style={{ background: C.paperDark, fontSize: 12, color: C.inkSoft }}>
        Toda edición o eliminación queda registrada en el Historial, y ajusta el stock de insumos automáticamente.
      </div>
      {loading ? (
        <div className="p-8 flex justify-center"><Loader2 className="animate-spin" color={C.inkSoft} /></div>
      ) : (
        <div className="p-4 flex flex-col gap-5">
          <div><SectionLabel>Producción</SectionLabel>{produccion.length === 0 ? <EmptyNote text="Sin cargas de producción." /> : <div className="flex flex-col gap-2">{produccion.map((e) => <Fila key={e.id} tipo="produccion" e={e} />)}</div>}</div>
          <div><SectionLabel>Insumos</SectionLabel>{insumos.length === 0 ? <EmptyNote text="Sin cargas de insumos." /> : <div className="flex flex-col gap-2">{insumos.map((e) => <Fila key={e.id} tipo="insumo" e={e} />)}</div>}</div>
        </div>
      )}
    </div>
  );
}

// ================= HISTORIAL =================
function Historial({ fecha, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { setLoading(true); const list = await safeListPrefix(`auditoria-${fecha}-`); setItems(list.map((r) => r.value).sort((a, b) => (a.hora < b.hora ? 1 : -1))); setLoading(false); })(); }, [fecha]);
  return (
    <div>
      <Header title="Historial de cambios" subtitle={formatFecha(fecha)} onBack={onBack} />
      {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin" color={C.inkSoft} /></div> :
        items.length === 0 ? <div className="p-4"><EmptyNote text="No hubo ediciones, eliminaciones ni cierres este día." /></div> : (
          <div className="p-4 flex flex-col gap-2">
            {items.map((it) => (
              <div key={it.id} className="rounded-xl p-3" style={{ background: C.white, border: `1px solid ${C.line}` }}>
                <div className="flex items-center justify-between"><span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{it.accion}</span><span className="ticket-num" style={{ fontSize: 12, color: C.inkSoft }}>{it.hora}</span></div>
                <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 3 }}>{it.detalle}</div>
                <div style={{ fontSize: 11.5, color: C.teal, marginTop: 4, fontWeight: 600 }}>Por: {it.responsable}</div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ================= ENTRADAS DE HOY =================
function EntradasHoy({ titulo, entradas, onDeshacer, mostrarBufet }) {
  const ordenadas = [...entradas].reverse();
  return (
    <div className="px-4 pb-8">
      <SectionLabel>{titulo}</SectionLabel>
      {ordenadas.length === 0 ? <EmptyNote text="Todavía no cargaste nada hoy." /> : (
        <div className="flex flex-col gap-2">
          {ordenadas.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 rounded-xl p-3" style={{ background: C.white, border: `1px solid ${C.line}` }}>
              <div className="min-w-0">
                <div style={{ fontSize: 14, fontWeight: 600 }}>{e.productoNombre}</div>
                <div style={{ fontSize: 12, color: C.inkSoft }}>{e.cantidad} {e.unidad || "u."} · {e.personaNombre} · {e.hora}{mostrarBufet && e.bufetNombre ? ` · ${e.bufetNombre}` : ""}</div>
              </div>
              <BotonDeshacer entry={e} onDeshacer={onDeshacer} />
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 text-center" style={{ fontSize: 11.5, color: C.inkSoft }}>
        Podés deshacer una carga solo en los 3 minutos después de guardarla. Pasado ese tiempo, la corrección se hace desde Resumen del Día con PIN.
      </div>
    </div>
  );
}
function EmptyCatalog({ onBack, tipo }) {
  return (<div><Header title="Falta configurar" onBack={onBack} /><div className="p-6 text-center" style={{ color: C.inkSoft }}>Todavía no hay {tipo} cargados en el catálogo. Andá a Configuración para agregarlos.</div></div>);
}

// ================= CONFIGURACIÓN =================
function Configuracion({ tab, setTab, productos, personas, bufets, recetario, stockInsumos, onGuardar, onGuardarRecetario, onGuardarStockValor, onBack }) {
  return (
    <div>
      <Header title="Configuración" onBack={onBack} />
      <div className="flex px-4 pt-4 gap-2 overflow-x-auto tabs-scroll" style={{ scrollbarWidth: "none" }}>
        <TabBtn active={tab === "productos"} onClick={() => setTab("productos")} icon={<UtensilsCrossed size={14} />} label="Productos" />
        <TabBtn active={tab === "recetario"} onClick={() => setTab("recetario")} icon={<BookOpen size={14} />} label="Recetario" />
        <TabBtn active={tab === "stock"} onClick={() => setTab("stock")} icon={<Boxes size={14} />} label="Stock" />
        <TabBtn active={tab === "personas"} onClick={() => setTab("personas")} icon={<Users size={14} />} label="Personas" />
        <TabBtn active={tab === "bufets"} onClick={() => setTab("bufets")} icon={<Store size={14} />} label="Bufets" />
      </div>
      <div className="p-4">
        {tab === "productos" && <ProductosConfig productos={productos} onGuardar={(d) => onGuardar("productos", d)} />}
        {tab === "recetario" && <RecetarioConfig productos={productos} recetario={recetario} onGuardarRecetario={onGuardarRecetario} onGuardarProductos={(data) => onGuardar("productos", data)} />}
        {tab === "stock" && <StockConfig productos={productos.filter((p) => p.tipo === "insumo")} stock={stockInsumos} onGuardarValor={onGuardarStockValor} />}
        {tab === "personas" && <ListaSimpleConfig items={personas} onGuardar={(d) => onGuardar("personas", d)} placeholder="Nombre de la persona" />}
        {tab === "bufets" && <ListaSimpleConfig items={bufets} onGuardar={(d) => onGuardar("bufets", d)} placeholder="Nombre del bufet / escuela" />}
      </div>
    </div>
  );
}
function TabBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg flex-shrink-0 whitespace-nowrap" style={{ background: active ? C.ink : C.paperDark, color: active ? C.white : C.inkSoft, fontSize: 12.5, fontWeight: 600 }}>
      {icon} {label}
    </button>
  );
}

function ProductosConfig({ productos, onGuardar }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("comida");
  const [unidad, setUnidad] = useState("unidad");
  const [precioVenta, setPrecioVenta] = useState("");
  const [costo, setCosto] = useState("");
  const [unidadCompra, setUnidadCompra] = useState("");
  const [rendimiento, setRendimiento] = useState("");
  const [notas, setNotas] = useState("");
  const [costoEditando, setCostoEditando] = useState(null);
  const [costoValor, setCostoValor] = useState("");

  function agregar() {
    if (!nombre.trim()) return;
    const nuevo = { id: "prod_" + Date.now(), nombre: nombre.trim(), tipo, unidad, precioVenta: Number(precioVenta) || 0, costo: Number(costo) || 0, unidadCompra, rendimiento: rendimiento || "", notas };
    onGuardar([...productos, nuevo]);
    setNombre(""); setPrecioVenta(""); setCosto(""); setUnidadCompra(""); setRendimiento(""); setNotas("");
  }
  function borrar(id) { onGuardar(productos.filter((p) => p.id !== id)); }
  function abrirEdicionCosto(p) { setCostoEditando(p.id); setCostoValor(String(p.costo || "")); }
  function guardarCosto(id) {
    onGuardar(productos.map((p) => (p.id === id ? { ...p, costo: Number(costoValor) || 0 } : p)));
    setCostoEditando(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl p-3 flex flex-col gap-3" style={{ background: C.paperDark }}>
        <Field label="Nombre del producto"><input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} placeholder="Ej: Sandwich de milanesa" /></Field>
        <div className="flex gap-2">
          <Field label="Tipo"><Select value={tipo} onChange={setTipo} options={[{ value: "comida", label: "Comida (se vende)" }, { value: "insumo", label: "Insumo (materia prima)" }]} /></Field>
          <Field label="Unidad de uso"><Select value={unidad} onChange={setUnidad} options={UNIDADES.map((u) => ({ value: u, label: u }))} /></Field>
        </div>
        {tipo === "comida" ? (
          <div className="flex gap-2">
            <Field label="Precio de venta"><input type="number" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} placeholder="$" /></Field>
            <Field label="Costo aproximado"><input type="number" value={costo} onChange={(e) => setCosto(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} placeholder="$" /></Field>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Field label="Cómo lo comprás"><input value={unidadCompra} onChange={(e) => setUnidadCompra(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} placeholder="Ej: Kilogramo (kg)" /></Field>
              <Field label="Cuánto rinde"><input value={rendimiento} onChange={(e) => setRendimiento(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} placeholder="Ej: 1000" /></Field>
            </div>
            <Field label={`Costo por ${unidad} (opcional — también se puede cargar después, desde Cargar Insumos)`}><input type="number" value={costo} onChange={(e) => setCosto(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} placeholder="$" /></Field>
            <Field label="Notas (opcional)"><input value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} placeholder="Mermas, cocción, etc." /></Field>
          </>
        )}
        <button onClick={agregar} className="rounded-lg py-2.5 flex items-center justify-center gap-1" style={{ background: C.teal, color: C.white, fontWeight: 600, fontSize: 14 }}><Plus size={16} /> Agregar producto</button>
      </div>
      <div className="flex flex-col gap-2">
        {productos.map((p) => {
          const editandoEste = costoEditando === p.id;
          return (
            <div key={p.id} className="flex flex-col gap-2 rounded-xl p-3" style={{ background: C.white, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: C.inkSoft }}>
                    {p.tipo === "comida"
                      ? `Venta ${money(p.precioVenta)} · Costo ${money(p.costo)}`
                      : `${p.unidadCompra || "?"} → ${p.rendimiento || "?"} ${p.unidad}${p.costo ? ` · ${money(p.costo)}/${p.unidad}` : " · sin costo cargado"}`}
                  </div>
                </div>
                {p.tipo === "insumo" && !editandoEste && (
                  <button onClick={() => abrirEdicionCosto(p)} className="px-2.5 py-1.5 rounded-full flex-shrink-0" style={{ background: p.costo ? C.paperDark : "#FDECC8", color: C.inkSoft, fontSize: 12, fontWeight: 600 }}>
                    {p.costo ? money(p.costo) : "Cargar costo"}
                  </button>
                )}
                <button onClick={() => borrar(p.id)} className="p-2 rounded-full flex-shrink-0" style={{ color: C.red }}><Trash2 size={17} /></button>
              </div>
              {editandoEste && (
                <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px dashed ${C.line}` }}>
                  <Field label={`Costo por ${p.unidad}`}>
                    <input type="number" value={costoValor} onChange={(e) => setCostoValor(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} placeholder="$" autoFocus />
                  </Field>
                  <button onClick={() => guardarCosto(p.id)} className="p-2.5 rounded-full flex-shrink-0" style={{ background: C.teal, color: C.white }}><Save size={16} /></button>
                  <button onClick={() => setCostoEditando(null)} className="p-2.5 rounded-full flex-shrink-0" style={{ background: C.paperDark, color: C.ink }}><X size={16} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecetarioConfig({ productos, recetario, onGuardarRecetario, onGuardarProductos }) {
  const comidas = productos.filter((p) => p.tipo === "comida");
  const insumos = productos.filter((p) => p.tipo === "insumo");
  const [productoId, setProductoId] = useState(comidas[0]?.id || "");
  const [insumoId, setInsumoId] = useState(insumos[0]?.id || "");
  const [cantidad, setCantidad] = useState(1);

  const receta = recetario[productoId] || [];
  const productoActual = comidas.find((c) => c.id === productoId);

  function costoDeReceta(lista) {
    let total = 0;
    let faltanCostos = false;
    lista.forEach((r) => {
      const insumo = insumos.find((i) => i.id === r.insumoId);
      if (!insumo || !insumo.costo) { faltanCostos = true; return; }
      total += insumo.costo * r.cantidad;
    });
    const conMerma = total * 1.06;
    return { total, conMerma, faltanCostos };
  }
  const { total: costoReal, conMerma: costoConMerma, faltanCostos } = costoDeReceta(receta);

  function sincronizarCostoProducto(listaActualizada) {
    if (!onGuardarProductos) return;
    const { conMerma } = costoDeReceta(listaActualizada);
    onGuardarProductos(productos.map((p) => (p.id === productoId ? { ...p, costo: round2(conMerma) } : p)));
  }

  function agregarIngrediente() {
    if (!insumoId || !cantidad) return;
    const yaExiste = receta.some((r) => r.insumoId === insumoId);
    const nueva = yaExiste ? receta.map((r) => (r.insumoId === insumoId ? { ...r, cantidad: Number(cantidad) } : r)) : [...receta, { insumoId, cantidad: Number(cantidad) }];
    onGuardarRecetario(productoId, nueva);
    sincronizarCostoProducto(nueva);
    setCantidad(1);
  }
  function quitarIngrediente(insId) {
    const nueva = receta.filter((r) => r.insumoId !== insId);
    onGuardarRecetario(productoId, nueva);
    sincronizarCostoProducto(nueva);
  }

  if (comidas.length === 0) return <EmptyNote text="Todavía no hay productos de comida en el catálogo." />;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Producto"><Select value={productoId} onChange={setProductoId} options={comidas.map((c) => ({ value: c.id, label: c.nombre }))} /></Field>

      <div className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: faltanCostos ? "#FDECC8" : "#E3EFE8" }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, color: C.inkSoft }}>Costo real (según receta)</span>
          <span className="ticket-num" style={{ fontSize: 13, color: C.inkSoft }}>{money(costoReal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12.5, color: C.tealDark, fontWeight: 700 }}>Costo con 6% de merma (el que se usa)</span>
          <span className="ticket-num" style={{ fontSize: 16, fontWeight: 700, color: C.tealDark }}>{money(costoConMerma)}</span>
        </div>
      </div>
      {faltanCostos && receta.length > 0 && (
        <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: -8 }}>Ojo: algún ingrediente todavía no tiene costo cargado, así que este número está incompleto.</div>
      )}

      <div className="rounded-xl p-3" style={{ background: C.paperDark }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", marginBottom: 8 }}>Ingredientes actuales</div>
        {receta.length === 0 ? <EmptyNote text="Sin receta cargada todavía." /> : (
          <div className="flex flex-col gap-2">
            {receta.map((r) => {
              const insumo = insumos.find((i) => i.id === r.insumoId);
              const subtotal = insumo?.costo ? insumo.costo * r.cantidad : null;
              return (
                <div key={r.insumoId} className="flex items-center justify-between rounded-lg p-2" style={{ background: C.white, border: `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 13 }}>{insumo?.nombre || r.insumoId}</span>
                  <div className="flex items-center gap-2">
                    <span className="ticket-num" style={{ fontSize: 13 }}>{r.cantidad} {insumo?.unidad}</span>
                    <span className="ticket-num" style={{ fontSize: 12, color: subtotal != null ? C.teal : C.inkSoft }}>{subtotal != null ? money(subtotal) : "sin costo"}</span>
                    <button onClick={() => quitarIngrediente(r.insumoId)} className="p-1 rounded-full" style={{ color: C.red }}><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl p-3 flex flex-col gap-3" style={{ background: C.paperDark }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase" }}>Agregar / actualizar ingrediente</div>
        <Field label="Insumo"><Select value={insumoId} onChange={setInsumoId} options={insumos.map((i) => ({ value: i.id, label: `${i.nombre} (${i.unidad})` }))} /></Field>
        <Field label="Cantidad por unidad de producto"><input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} /></Field>
        <button onClick={agregarIngrediente} className="rounded-lg py-2.5 flex items-center justify-center gap-1" style={{ background: C.teal, color: C.white, fontWeight: 600, fontSize: 14 }}><Plus size={16} /> Guardar ingrediente</button>
      </div>
    </div>
  );
}

function StockConfig({ productos, stock, onGuardarValor }) {
  const [valores, setValores] = useState({});
  const ordenados = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl p-3" style={{ background: C.paperDark, fontSize: 12, color: C.inkSoft }}>
        Usá esto para el conteo inicial de stock, o para ajustar después de un recuento físico. Escribís el número real y tocás guardar — reemplaza el valor, no lo suma.
      </div>
      <div className="flex flex-col gap-2">
        {ordenados.map((p) => {
          const actual = stock[p.id] || 0;
          const editado = valores[p.id] !== undefined ? valores[p.id] : actual;
          return (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl p-3" style={{ background: C.white, border: `1px solid ${C.line}` }}>
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.nombre}</div>
                <div style={{ fontSize: 11.5, color: C.inkSoft }}>{p.unidad}</div>
              </div>
              <input type="number" value={editado} onChange={(e) => setValores({ ...valores, [p.id]: e.target.value })} className="text-center rounded-lg ticket-num" style={{ width: 70, fontSize: 15, border: `1px solid ${C.line}`, padding: "6px 0" }} />
              <button onClick={() => onGuardarValor(p.id, Number(valores[p.id] !== undefined ? valores[p.id] : actual))} className="p-2 rounded-full flex-shrink-0" style={{ background: C.teal, color: C.white }}><Save size={15} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListaSimpleConfig({ items, onGuardar, placeholder }) {
  const [nombre, setNombre] = useState("");
  function agregar() { if (!nombre.trim()) return; onGuardar([...items, { id: "id_" + Date.now(), nombre: nombre.trim() }]); setNombre(""); }
  function borrar(id) { onGuardar(items.filter((i) => i.id !== id)); }
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl p-3 flex gap-2" style={{ background: C.paperDark }}>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agregar()} className="flex-1 rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }} placeholder={placeholder} />
        <button onClick={agregar} className="rounded-lg px-4" style={{ background: C.teal, color: C.white }}><Plus size={18} /></button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: C.white, border: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{i.nombre}</div>
            <button onClick={() => borrar(i.id)} className="p-2 rounded-full" style={{ color: C.red }}><Trash2 size={17} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================= CONTROLES COMPARTIDOS =================
function Field({ label, children }) {
  return (<div className="flex-1"><div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>{children}</div>);
}
function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg px-3 py-2.5" style={{ border: `1px solid ${C.line}`, fontSize: 15, background: C.white }}>
      {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}
function Stepper({ value, setValue }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => setValue(Math.max(0, Number(value) - 1))} className="rounded-full flex items-center justify-center" style={{ width: 44, height: 44, background: C.paperDark }}><Minus size={18} /></button>
      <input type="number" value={value} onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))} className="text-center rounded-lg ticket-num" style={{ width: 72, fontSize: 22, border: `1px solid ${C.line}`, padding: "8px 0" }} />
      <button onClick={() => setValue(Number(value) + 1)} className="rounded-full flex items-center justify-center" style={{ width: 44, height: 44, background: C.amber, color: C.white }}><Plus size={18} /></button>
    </div>
  );
}
