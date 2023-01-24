import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";
import { gestionLocalizacion, salvarDatosMapa } from "./gestionLocalizacion.js";
import { obtenerPropiedades, campos } from "./Utiles.js";
import { gestionConsumos } from "./gestionConsumos.js";
import { gestionResultados } from "./gestionResultados.js";
import { gestionPrecios } from "./gestionPrecios.js";
import * as GestionParametros from "./gestionParametros.js";
/**
 * Es la función llamada desde InicializaAplicacion para cargar la informacion de proyecto y el boton de salvar
 * 
 */

async function inicializaEventos () {
  // Evento para registrar el nombre del proyecto activo en TCB
  let proyecto = document.getElementById("nombreProyecto");
  TCB.nombreProyecto = "Mi proyecto";
  proyecto.value = TCB.nombreProyecto;
  proyecto.addEventListener("change", async function handleChange(event) {
      TCB.nombreProyecto = event.target.value;
  });

  // Evento para salvar el proyecto
  const exportar = document.getElementById("exportar");
  exportar.addEventListener("click", function handleChange(event) {
      exportarProyecto (event);
  });

  // Evento para importar un proyecto
  const importar = document.getElementById("importar");
  importar.addEventListener('click', async () => {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = '.solimp';
    input.onchange = _ => {
      UTIL.debugLog("Importando datos desde: "+ input.files[0].name);
      importarProyecto (input.files[0]);
      };
    input.click();
  });

  // Evento para gestionar boton deshacer. DOMid: "botonDeshacer"
  document.getElementById('botonDeshacer').addEventListener('click', function () {
    draw.removeLastPoint();
  });
}

async function gestionProyecto( accion) {
  UTIL.debugLog("gestionProyecto: " + accion);
  let status;
  switch (accion) {
    case "Inicializa":
      status = inicializaEventos();
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

function prepara() {
  return true;
}

function valida () {
  return true;
}

async function obtenerDatos (fichero) {
  var datos;
  let reader = new FileReader();
  return new Promise((resolve, reject) => {

    reader.onerror = (err) => {
      alert(i18next.t("precios_MSG_errorLecturaFicheroImportacion") + "\nReader.error: " + reader.error);
      reject("...error de lectura");
    }

    reader.onload = (e) => {
      try {
        datos = JSON.parse(e.target.result);
        resolve(datos);
       } catch (err) {
        alert(i18next.t("precios_MSG_errorLecturaFicheroImportacion") + "\nParser.error: " + err);
        reject();
      }
    }
   
    reader.readAsText(fichero);
  });
}

async function importarProyecto(fichero) {

  if (TCB.bases.length > 0) {
    if (!confirm(TCB.i18next.t("proyecto_MSG_confirmaImportacion"))) return;
  }
  TCB.bases = [];
  TCB.consumos = [];
  TCB.importando = true;
  TCB.requiereOptimizador = false;
  let cursorOriginal = document.body.style.cursor;
  document.body.style.cursor = "progress";
  document.getElementById('btnSiguiente').disabled = true;

  const datosImportar = await obtenerDatos(fichero);

  GestionParametros.importa( datosImportar);

  const btnLabel = document.getElementById("importar");
  btnLabel.disabled = true;

  btnLabel.innerText = i18next.t('proyecto_LBL_importando') + ' Bases ';
  await gestionLocalizacion( 'Importa', datosImportar);

  btnLabel.innerText = i18next.t('proyecto_LBL_importando') + ' Valida Bases ';
  await gestionLocalizacion( 'Valida');

  btnLabel.innerText = i18next.t('proyecto_LBL_importando') + ' Consumos ';
  await gestionConsumos( 'Importa', datosImportar);

  btnLabel.innerText = i18next.t('proyecto_LBL_importando') + ' Rendimientos ';
  await gestionConsumos( 'Valida');

  btnLabel.innerText = i18next.t('proyecto_LBL_importando') + ' Resultados ';
  await gestionResultados( 'Importa', datosImportar);

  TCB.requiereOptimizador = false;
  btnLabel.innerText = i18next.t('proyecto_LBL_importando') + ' Balances ' ;
  await gestionResultados( 'Prepara', datosImportar);

  btnLabel.innerText = i18next.t('proyecto_LBL_importando') + ' Precios ';
  gestionPrecios( 'Importa', datosImportar);

  btnLabel.innerText = i18next.t('proyecto_LBL_importar');
  btnLabel.disabled = false;
  document.getElementById('btnSiguiente').disabled = false;
  TCB.importando = false;
  document.body.style.cursor = cursorOriginal;
  alert ("Fichero importado satisfactoriamente");

}

function exportarProyecto (evento) {

    if (TCB.produccion === "" ) {
      alert ("Definir bases y consumos antes de salvar el proyecto");
      return
    }

    let proyecto = {'mapa': salvarDatosMapa(), 'bases':[], 'consumos':[], 'parametros':TCB.parametros};

    for(let k=0; k<TCB.bases.length; k++) {
      let unaBase = {};
      let propiedades = obtenerPropiedades ( TCB.bases[k], 0);
      propiedades.forEach ( (p) => {
        if (p.valor !== "Objeto") {
          if (campos[p.nombre].salvar) {
              unaBase[p.nombre] = p.valor;
          }
        }
      })
      proyecto.bases.push(unaBase);
    }

    let unConsumo = {};
    for(let k=0; k<TCB.consumos.length; k++) {
      const propiedades = obtenerPropiedades ( TCB.consumos[k], 0);
      propiedades.forEach ( (p) => {
        if (p.valor !== "Objeto") {
          if (campos[p.nombre].salvar) {
            unConsumo[p.nombre] = p.valor;
          }
        }
      })
      let consumoAnual = JSON.stringify(TCB.consumos[k].diaHora);
      unConsumo['consumoAnual'] = consumoAnual;
      let tarifa = JSON.stringify(TCB.consumos[k].tarifa);
      unConsumo['tarifa'] = tarifa;
      proyecto.consumos.push(unConsumo);
    }

    proyecto.correccionPrecioInstalacion = TCB.correccionPrecioInstalacion;
    console.log(TCB.precioInstalacion);
    proyecto.precioInstalacion = TCB.precioInstalacion;
    export2txt (proyecto);
}

function export2txt(originalData) {
 
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(originalData, null, 2)], {
    type: "text/plain"
  }));
  const date = new Date();
  let fName = TCB.nombreProyecto + "(" + date.getFullYear();
  fName += (date.getMonth()+1).toLocaleString(i18next.language, {minimumIntegerDigits: 2, useGrouping: false});
  fName +=  date.getDate().toLocaleString(i18next.language, {minimumIntegerDigits: 2, useGrouping: false});
  fName +=  "-"+ date.getHours().toLocaleString(i18next.language, {minimumIntegerDigits: 2, useGrouping: false});
  fName +=  date.getMinutes().toLocaleString(i18next.language, {minimumIntegerDigits: 2, useGrouping: false});
  fName += ").solimp"
  a.setAttribute("download", fName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a); 
}

export {gestionProyecto}