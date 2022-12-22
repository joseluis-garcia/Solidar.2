/**
 * @module  Gestion consumos
 * @fileoverview Modulo para la gestion de los consumos
 * @version      20221206
 * @author       José Luis García (SOM Madrid)
 * @copyright
 *
 * History
 * v 20221206 – Version inicial documentada
*/
import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";
import Consumo from "./Consumo.js";

// Estas variables son para cuando tengamos mas de un consumo en la tablaConsumos
var filaActiva;
var tablaActiva;
var featIDActivo;
var consumoActivo;

async function inicializaEventos () {

  // lectura del fichero de tarifas del servidor. Si falla se usan las de la TCB
  const ficheroTarifa = "./datos/tarifas.json";
  UTIL.debugLog("Tarifas leidas desde servidor:" + ficheroTarifa);
  try {
    const respuesta = await fetch(ficheroTarifa);
    if (respuesta.status === 200) {
      TCB.tarifas = await respuesta.json();
    }
  } catch (err) {
    UTIL.debugLog("Error leyendo tarifas del servidor " + err.message + "<br>Seguimos con TCB");
  }

  for (let i=0; i<=6; i++){
    let cTarifa = document.getElementById("tarifaP"+i);
    cTarifa.addEventListener("change", (evt) => {cambiaPrecios(evt.target)});
  }

}

function cambiaPrecios (evento) {
  setActivo(evento);
  consumoActivo.tarifa.precios[evento.id.substring(7)] = evento.target.value;
}

/**
 * Es la función llamada desde InicializaAplicacion para cargar y activar la pestaña de consumos
 * 
 */
async function gestionConsumos( accion) {
  let status;
  switch (accion) {
    case "Inicializa":
      status = await inicializaEventos();
      break;
    case "Valida":
      status =  await valida();
      break;
    case "Prepara":
      status = prepara();
      break;
  }
  return status;
}

// Esta funcion se ejecuta antes de mostrar la pestaña consumo
function prepara () {


  //Crea un consumo en TCB.consumos si no existe ninguno
  if (TCB.consumos.length === 0) {
    let nuevoPunto = {};
    nuevoPunto.nombre = "Consumo "+ TCB.idConsumo++;
    nuevoPunto.id = TCB.idConsumo.toString();
    nuevoPunto.fuente = "CSV";
    nuevoPunto.potenciaREE = 0;
    nuevoPunto.ficheroCSV = null;
    nuevoPunto.nombreTarifa = "2.0TD";
    let nuevoConsumo = new Consumo (nuevoPunto);
    TCB.consumos.push( nuevoConsumo);
  }

  // Si ya teniamos el consumo cargado no volvemos a cargarlo.
  if (!TCB.consumos[0].csvCargado) tablaConsumos ('tablaConsumo');

  // Muestra las tarifas en el formulario de consumos
  for (let i=0; i<=6; i++){
    let cTarifa = document.getElementById("tarifaP"+i);
    cTarifa.value = TCB.consumos[0].tarifa.precios[i];    
  }

  return true
}

// Esta funcion se ejecuta al dar a siguiente en el wizard
async function valida() {

document.getElementById('csvResumen').innerHTML ="";
// Habra que validar todos los consumos de TCB.consumos
const status = validaConsumos ();
if (!status) return false; 

// Aqui viene la creacion de un consumo sintesis de todos los consumos individuales
// TCB.consumo = new Consumo(); pero por ahora nos quedamos con el unico consumo que hay definido
TCB.consumo = TCB.consumos[0];

// Comrpobamos que estan cargados todos los rendimientos
  let waitLoop = 0;
  for (let i=0; i<TCB.bases.length; i++) {
    var sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
    if (!TCB.bases[i].rendimientoCreado) {
      document.getElementById('csvResumen').innerHTML = "Esperando PVGIS para base "+TCB.bases[i].id;
      while (!TCB.bases[i].rendimientoCreado && waitLoop++ < 30) {
        document.getElementById('csvResumen').innerHTML += "<"
        await sleep (1000);
      }
    }
  }
  //Dispatch ("Calcular energia")
  return status;
}

function validaConsumos () {
    let status = true;
    for (const consumo of TCB.consumos) {
      if (consumo.fuente === "REE") {
        if (!(consumo.potenciaREE > 0)) {
            alert (consumo.nombre + "\n" + i18next.t("consumo_MSG_definirPotenciaBaseREE"));
            status = false;
            break;
        } 
      } else if (consumo.fuente === "CSV") {
        if (consumo.ficheroCSV === null) {
            alert (consumo.nombre + "\n" + i18next.t("consumo_MSG_definirFicheroConsumo"));
            status = false;
            break;
        }
      }
    }
    return status;
}


function setActivo(evento) {

  filaActiva = evento.closest('tr');
  tablaActiva = filaActiva.parentNode.parentNode.id;
  featIDActivo = filaActiva.id;
  consumoActivo = TCB.consumos.find( consumo => consumo.id === featIDActivo); //Por ahora hay uno solo pero luego...

}

function tablaConsumos ( tablaDonde) {
  
  let tabla = document.getElementById(tablaDonde);
  var rowCount = tabla.rows.length;
  if (rowCount > 1) {
    for (let i = 1; i < rowCount; i++) tabla.deleteRow(1);
  }

  TCB.consumos.forEach ( consumo => {
    nuevaFilaEntablaConsumo (tabla, consumo)
  })
}

function nuevaFilaEntablaConsumo(tablaConsumos, consumo) {
    // Construccion de las filas de la tabla consumos
  let tmpHTML;

  var row = tablaConsumos.insertRow();
  row.id = consumo.id;
  let cell;

  // Columna ID
  cell = row.insertCell();
  cell.id = 'PuntoConsumo.id.'+consumo.id;
  cell.innerHTML = '<label class="text-end">' + consumo.id;

  // Incluimos un campo donde se puede definir el nombre del consumo
  cell = row.insertCell();
  cell.id = 'PuntoConsumo.nombre.'+consumo.id
  cell.innerHTML = '<input type="text" class="text-end" value="'+consumo.nombre+'">';
  cell.addEventListener('change', (evt) => {cambioNombreConsumo (evt.target)});

  /* // Escribimos las coordenadas en la tabla para cuando tengamos geoPuntos de consumo
  cell = row.insertCell();
  cell.id = 'PuntoConsumo.lonlat.'+consumo.id;
  cell.innerHTML = consumo.lonlat; */

  // Seleccion del tipo de información disponible para el perfil de este consumo
  cell = row.insertCell();
  cell.id = 'PuntoConsumo.fuente.'+consumo.id
  tmpHTML = '<select class="form-select col-md-2 tDyn" id="' + cell.id + '"';
  tmpHTML += ` data-bs-toggle="tooltip" data-placement="top" name="precios_TT_fuente">
            <option value="CSV">CSV de distribuidora</option>
            <option value="REE">REE perfil estandar</option>
            </select>`
  cell.innerHTML = tmpHTML;
  cell.addEventListener('change', (evt) => {cambioFuente (evt.target)});

  // Incluimos un campo donde se puede definir el consumo anual para perfil REE
  cell = row.insertCell();
  cell.id = "PuntoConsumo.potenciaREE."+consumo.id;
  cell.innerHTML = '<input type="number" class="text-end" value="0" disabled>';
  cell.addEventListener('change', (evt) => {cambioPotenciaREE (evt.target)});

  // Campo para la seleccion del fichero CSV
  cell = row.insertCell();
  cell.id = "PuntoConsumo.ficheroCSV."+consumo.id;
  cell.innerHTML = '<input class="form-control" type="file" accept=".csv">';
  cell.addEventListener('change', (evt) => {cargaCSV (evt.target)});

  // Seleccion de la tarifa
  cell = row.insertCell();
  cell.id = "PuntoConsumo.nombreTarifa."+consumo.id;
  tmpHTML = '<select class="form-select col-md-2 tDyn"';
  tmpHTML += `data-bs-toggle="tooltip" data-placement="top" name="consumo_TT_tarifa">
            <option value="2.0TD">2.0TD</option>
            <option value="3.0TD">3.0TD</option>
            </select>`
  cell.innerHTML = tmpHTML;
  cell.addEventListener('change', (evt) => {cambioTarifa (evt.target)});
}

function cambioTarifa (evento) {
  setActivo(evento);
  consumoActivo.tarifa.nombre = evento.value;
  consumoActivo.tarifa.setTarifa( consumoActivo.tarifa.nombre, TCB.territorio);
  // Muestra las tarifas en el formulario de consumos
  for (let i=0; i<=6; i++){
    let cTarifa = document.getElementById("tarifaP"+i);
    cTarifa.value = TCB.consumos[0].tarifa.precios[i];    
  }

  if (evento.value == "3.0TD") {
    document.getElementById("tablaTarifas3.0TD").style.display = "block";
  } else {
    document.getElementById("tablaTarifas3.0TD").style.display = "none";
  }
};

async function cargaCSV (evento) {
  setActivo(evento);
  consumoActivo.potenciaREE = 1;
  consumoActivo.ficheroCSV = evento.files[0]; //window.URL.createObjectURL(evt.target.files[0]);
  await consumoActivo.loadCSV();

  if (consumoActivo.numeroRegistros > 0) {
    let consumoMsg = i18next.t('consumo_MSG_resumen', {registros: consumoActivo.numeroRegistros, 
                              desde: consumoActivo.fechaInicio.toLocaleDateString(),
                              hasta: consumoActivo.fechaFin.toLocaleDateString()});
    document.getElementById("csvResumen").innerHTML = consumoMsg;
    TCB.graficos.consumo_3D(consumoActivo, "graf_resumenConsumo", "graf_perfilDia");
    document.getElementById('graf_resumenConsumo').style.display = "block";
    document.getElementById("graf_perfilDia").style.display = "block";
  }
}

async function cambioPotenciaREE ( evento) {
  setActivo(evento);
  consumoActivo.potenciaREE = evento.value;
  consumoActivo.ficheroCSV = await UTIL.getFileFromUrl(TCB.basePath + "datos/REE.csv");
  await consumoActivo.loadCSV();

  if (consumoActivo.numeroRegistros > 0) {
    let consumoMsg = i18next.t('consumo_MSG_resumen', {registros: consumoActivo.numeroRegistros, 
                              desde: consumoActivo.fechaInicio.toLocaleDateString(),
                              hasta: consumoActivo.fechaFin.toLocaleDateString()});
    document.getElementById("csvResumen").innerHTML = consumoMsg;
    TCB.graficos.consumo_3D(consumoActivo, "graf_resumenConsumo", "graf_perfilDia");
    document.getElementById('graf_resumenConsumo').style.display = "block";
    document.getElementById("graf_perfilDia").style.display = "block";
  }
}

function cambioNombreConsumo ( evento) {
  setActivo(evento);
  consumoActivo.nombre = evento.value;

  // Cuando tengamos geopuntos
  //setLabel( origenDatosSolidar.getFeatureById(componente), evento.value,[255, 255, 255, 1], [168, 50, 153, 0.6] );
}

function cambioFuente (evento) {
  setActivo(evento);
  document.getElementById('graf_resumenConsumo').style.display = "none";
  document.getElementById("graf_perfilDia").style.display = "none";
  var datoFichero = document.getElementById("PuntoConsumo.ficheroCSV."+featIDActivo);
  var datoPotencia = document.getElementById("PuntoConsumo.potenciaREE."+featIDActivo);
  consumoActivo.fuente = evento.value;
  consumoActivo.ficheroCSV = null;
  if (evento.value === "CSV") {
    datoPotencia.firstChild.value = "";
    datoPotencia.firstChild.disabled = true;
    datoFichero.firstChild.disabled = false;
  } else if (evento.value === "REE") {
    datoFichero.firstChild.value = null;
    datoFichero.firstChild.disabled = true;
    datoPotencia.firstChild.disabled = false;
    datoPotencia.firstChild.focus();
  }
}

export {gestionConsumos}