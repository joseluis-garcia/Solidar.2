import Consumo from "./Consumo.js";
import Rendimiento from "./Rendimiento.js";

import Instalacion from "./Instalacion.js";
import Produccion from "./Produccion.js";
import Balance from "./Balance.js";
import Economico from "./Economico.js";
import BaseSolar from "./BaseSolar.js";
import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";
import {inicializaEventos} from "./InicializaAplicacion.js";
import * as MUESTRA from "./Muestra.js";


// Funcion principal para la gestion del flujo de eventos

var optimizacion;
var waitLoop;

export default async function _Dispatch(accion) {
  UTIL.debugLog("Dispatcher recibe: " + accion);
  var status = true;

  switch (accion) {
    case "Inicializa eventos":
      UTIL.debugLog("Dispatch => inicializaEventos");
      status = await inicializaEventos();
      if (!status) UTIL.debugLog("Error inicializando eventos");

      return status;

    case "Transicion Localizacion Consumo":
      UTIL.debugLog("Dispatch => sincronizaAreasConBases");
      //await sincronizaAreasConBases();
      //await gestionConsumo();
      return;

    case "Calcular energia":
      optimizacion = true;
      if (!TCB.consumo.csvCargado) {
        alert(i18next.t("dispatcher_MSG_defineConsumosPrimero"));
        return false;
      }

      UTIL.debugLog("Dispatch -> _initInstalacion");
      status = await _initInstalacion(); //await
      if (!status) {
        UTIL.debugLog("Error creando instalación");
        return status;
      }

    case "Produccion":
      UTIL.debugLog("Dispatch -> _initProduccion");
      status = await _initProduccion(); //await
      if (!status) {
        UTIL.debugLog("Error creando producción");
        return status;
      }

    case "Balance":
      UTIL.debugLog("Dispatch -> _initBalance");
      status = _initBalance();
      if (!status) {
        UTIL.debugLog("Error creando balance");
        return status;
      }
/* 
      if (optimizacion) {
        optimizacion = false;
        let autoconsumoInicial = TCB.balance.autoconsumo / TCB.produccion.totalAnual;
        let variacion = autoconsumoInicial / 0.5;  //fijamos un objetivo de 50% de autoconsumo
        let panelesOptimos = Math.trunc(TCB.instalacion.paneles * variacion);
        UTIL.debugLog("First pass con " +TCB.instalacion.paneles + 
                " Autoconsumo: " + autoconsumoInicial + 
                " Variacion propuesta " + variacion + 
                " nuevos paneles " + panelesOptimos);
        if (TCB.instalacion.paneles != panelesOptimos) {
          TCB.instalacion.paneles = panelesOptimos;
          document.getElementById("numeroPaneles").value = panelesOptimos;
        }
        //_Dispatch("Produccion");
        status = await _initProduccion();
        status = _initBalance();
      } */
      status = await _initProduccion();
      status = _initBalance();
      if (TCB.balanceCreado) MUESTRA.balanceEnergia();

    case "Economico":
      UTIL.debugLog("Dispatch -> _initEconomico");
      status = await _initEconomico();
      if (!status) {
        UTIL.debugLog("Error creando economico");
        return status;
      }
      if (TCB.economicoCreado) {
        MUESTRA.balanceEconomico();
        await muestraBalanceFinanciero();
      }
      return true;

    case "Cambio precio instalacion":
      TCB.produccion.precioInstalacionCorregido = 0;
      for (let i=0; i< TCB.bases.length; i++) {
        TCB.produccion.precioInstalacionCorregido += TCB.bases[i].instalacion.precioInstalacionCorregido;
      }

    case "Cambio subvencion":
      UTIL.debugLog("Dispatch -> _cambioSubvencion");
      TCB.economico.calculoFinanciero();
      await muestraBalanceFinanciero();
      return true;

    case "Cambio instalacion":
      UTIL.debugLog("Dispatch -> _cambioInstalacion");
      _cambioInstalacion();
      MUESTRA.balanceEnergia();
      UTIL.debugLog("Dispatch -> _initEconomico");
      await _initEconomico();
      if (TCB.economicoCreado) {
        MUESTRA.balanceEconomico();
        await muestraBalanceFinanciero();
      }
      return true;
  }
}

// Función de construccion objeto Instalacion inicial ----------------------------------------------------------------------
async function _initInstalacion() {

  // Ordenamos las bases por su rendimiento. Intentaremos asignar la mayor produccion a la mas productiva
  let totalAsignar = TCB.consumo.totalAnual;
  let tmpAsignado = 0;
  let tmpPaneles;
  if (TCB.bases.length > 1) TCB.bases.sort((a, b) => b.rendimiento.unitarioTotal - a.rendimiento.unitarioTotal);
  for (let i=0; i<TCB.bases.length; i++) {
    tmpAsignado = TCB.bases[i].rendimiento.unitarioTotal * TCB.bases[i].potenciaMaxima;
    console.log("base " + i + " a asignar " + totalAsignar + " puede asignar " + tmpAsignado);
    tmpAsignado = tmpAsignado > totalAsignar ? totalAsignar : tmpAsignado;

    tmpPaneles = Math.floor(tmpAsignado / TCB.bases[i].rendimiento.unitarioTotal / TCB.parametros.potenciaPanelInicio);
    console.log(" le asignamos " + tmpAsignado + "2 conseguidos con " + tmpPaneles);
    UTIL.debugLog("_initInstalacion con" + tmpPaneles + " paneles de " + TCB.parametros.potenciaPanelInicio + "kWp en la base ", TCB.bases[i].id);
    TCB.bases[i].instalacion = new Instalacion(tmpPaneles, TCB.parametros.potenciaPanelInicio); //Creamos una instalación por defecto que cubra el consumo maximo anual   
    totalAsignar -= tmpAsignado;
    console.log("quedan por asignar " + totalAsignar);
  }
  if (totalAsignar > 0) alert("no hay suficiente superficie");
  return true;
}

// Función de construccion objeto Producción -------------------------------------------------------------------------------
// Esta funcon genera un objeto produccion a partir de la produccion de cada una de las bases
async function _initProduccion() {

  if (TCB.produccionCreada) {
    delete TCB.produccion;
    TCB.produccionCreada = false;
  }

  TCB.produccion = new Produccion();
  return true;
}

// Función de construccion objeto Balance -------------------------------------------------------------------------------
function _initBalance() {
  if (TCB.balanceCreado) {
    delete TCB.balance;
    TCB.balanceCreado = false;
  }
  TCB.balance = new Balance(TCB.produccion, TCB.consumo);
  TCB.balanceCreado = true;

  return true;
}

async function _cambioInstalacion() {

  if (TCB.produccionCreada) {
    delete TCB.produccion;
    TCB.produccionCreada = false;
  }

  TCB.produccion = new Produccion();
  TCB.produccionCreada = true;
  if (TCB.balanceCreado) {
    delete TCB.balance;
    TCB.balanceCreado = false;
  }
  TCB.balance = new Balance(TCB.produccion, TCB.consumo);
  TCB.balanceCreado = true;
  return true;
}

// Función de construccion objeto Economico -------------------------------------------------------------------------------
async function _initEconomico() {
  if (TCB.economicoCreado) {
    delete TCB.economico;
    TCB.economicoCreado = false;
  }

  TCB.economico = new Economico();
  TCB.economicoCreado = true;
  return true;
}

async function muestraBalanceFinanciero() {

  var table = document.getElementById("financiero");

  var rowCount = table.rows.length;
  if (rowCount > 1) {
    for (let i = 1; i < rowCount; i++) {
      table.deleteRow(1);
    }
  }

  for (let i = 0; i < TCB.economico.cashFlow.length; i++) {
    var row = table.insertRow(i + 1);

    var cell = row.insertCell(0);
    cell.innerHTML = TCB.economico.cashFlow[i].ano;

    var cell = row.insertCell(1);
    if (TCB.economico.cashFlow[i].previo < 0) cell.classList.add("text-danger");
    cell.innerHTML = MUESTRA.formatNumber(TCB.economico.cashFlow[i].previo, 2) + "€";

    var cell = row.insertCell(2);
    if (TCB.economico.cashFlow[i].inversion < 0)
      cell.classList.add("text-danger");
    cell.innerHTML = MUESTRA.formatNumber(TCB.economico.cashFlow[i].inversion, 2) + "€";

    var cell = row.insertCell(3);
    cell.innerHTML = MUESTRA.formatNumber(TCB.economico.cashFlow[i].ahorro, 2) + "€";

    var cell = row.insertCell(4);
    cell.innerHTML = MUESTRA.formatNumber(TCB.economico.cashFlow[i].IBI, 2) + "€";

    var cell = row.insertCell(5);
    cell.innerHTML = MUESTRA.formatNumber(TCB.economico.cashFlow[i].subvencion, 2) + "€";

    var cell = row.insertCell(6);
    if (TCB.economico.cashFlow[i].pendiente < 0) cell.classList.add("text-danger");
    cell.innerHTML = MUESTRA.formatNumber(TCB.economico.cashFlow[i].pendiente, 2) + "€";
  }

  MUESTRA.muestra("VAN", "", MUESTRA.formatNumber(TCB.economico.VANProyecto, 2), "€");
  MUESTRA.muestra("TIR", "", MUESTRA.formatNumber(TCB.economico.TIRProyecto, 2), "%");
  //await loopAlternativas();
}

// Esta funcion hace un recorrido completo de todos los calculos con unos consumos y localizacion fija.
// Empieza con el número de paneles activo y busca alternativas para 25%, 50%, 150% y 200% de ese número
// Completa los arrays necesarios para el cálculo financiero.

/* async function loopAlternativas() {

  var numeroPanelesOriginal = TCB.instalacion.paneles;
  var intentos = [0.25, 0.5, 1, 1.5, 2];
  var paneles = [];
  var autoconsumo = [];
  var TIR = [];
  var autosuficiencia = [];
  var precioInstalacion = [];
  var consvsprod = [];
  var ahorroAnual = [];
  intentos.forEach((intento) => {
    let _pan = Math.trunc(numeroPanelesOriginal * intento);
    if (_pan >= 1) {
      _cambioInstalacion(_pan, TCB.instalacion.potenciaUnitaria);
      _initEconomico();
      paneles.push(_pan);
      autoconsumo.push((TCB.balance.autoconsumo / TCB.produccion.totalAnual) * 100);
      autosuficiencia.push((TCB.balance.autoconsumo / TCB.consumo.totalAnual) * 100);
      consvsprod.push((TCB.consumo.totalAnual/TCB.produccion.totalAnual) * 100);
      TIR.push(TCB.economico.TIRProyecto);
      precioInstalacion.push(TCB.instalacion.precioInstalacionCorregido());
      ahorroAnual.push(TCB.economico.ahorroAnual);
    }
  });

  // Dejamos las cosas como estaban antes del loop
  _cambioInstalacion(numeroPanelesOriginal, TCB.instalacion.potenciaUnitaria);
  await _initEconomico();

  //Buscamos punto en el que la produccion represente el 80% del consumo anual total
  let i = 0;
  while (consvsprod[i] > 80) i++;
    let pendiente = (consvsprod[i] - consvsprod[i-1]) / (paneles[i] - paneles[i-1]);
    let dif = 80 - consvsprod[i-1];
    let limiteSubvencion = paneles[i-1] + dif / pendiente; */
/*     TCB.graficos.plotAlternativas(
      "graf_5",
      TCB.instalacion.potenciaUnitaria,
      paneles,
      TIR,
      autoconsumo,
      autosuficiencia,
      precioInstalacion,
      ahorroAnual,
      limiteSubvencion
    ); 
}*/
// Asignación de la función _Dispatch al objeto global window.
window.Dispatch = _Dispatch;
