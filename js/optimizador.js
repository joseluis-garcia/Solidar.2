import * as UTIL from "./Utiles.js";
import Instalacion from "./Instalacion.js";
import TCB from "./TCB.js";
//import Produccion from "./Produccion.js";

/** 
 * Funcion para asignar un número de paneles de potencia unitaria (segun valor argumento potenciaPanelInicio) 
 * a cada base de forma de cubrir la demanda total a las bases disponibles teniendo en cuenta las limitaciones de superficie.
 *  
 * @param {Base[]} bases Conjunto de objetos Base disponibles
 * @param {Consumo} consumo Un objeto Consumo a cubrir
 * @param {Float} potenciaPanelInicio Potencia unitaria de cada panel
 * @returns {Float} energiaPendiente Es el valor de la energoa que no ha podiod ser asignada
 */
async function optimizador( bases, consumo, potenciaPanelInicio) {

  let energiaPendiente = consumo.totalAnual;
  let energiaAsignada = 0;
  let tmpPaneles;
  TCB.totalPaneles = 0;

  // Ordenamos las bases de mayor a menos por su rendimiento. Intentaremos asignar la mayor produccion a la mas productiva
  if (bases.length > 1) bases.sort((a, b) => b.rendimiento.unitarioTotal - a.rendimiento.unitarioTotal);

  for (let i=0; i<bases.length; i++) {
    energiaAsignada = bases[i].rendimiento.unitarioTotal * bases[i].potenciaMaxima;
    energiaAsignada = energiaAsignada > energiaPendiente ? energiaPendiente : energiaAsignada;
    tmpPaneles = Math.round(energiaAsignada / bases[i].rendimiento.unitarioTotal / potenciaPanelInicio);
    UTIL.debugLog("_initInstalacion con" + tmpPaneles + " paneles de " + potenciaPanelInicio + "kWp en la base ", bases[i].id);
    //Creamos una instalación por defecto que cubra el consumo maximo anual   
    bases[i].instalacion = new Instalacion(tmpPaneles, potenciaPanelInicio);
    TCB.totalPaneles += tmpPaneles;
    energiaPendiente -= energiaAsignada;
  }

  return energiaPendiente;
}
/**
 * 
 * @param {Int} panelesNuevo Número total de paneles que se quieren instalar entre todas las bases
 * @param {Base[]} bases Conjunto de objetos Base disponibles
 * @param {*} potenciaPanelInicio Potencia unitaria de cada panel
 * @returns {}
 */
function nuevoTotalPaneles ( panelesNuevo) {

  let tmpPaneles;
  let panelesPendientes = panelesNuevo;
  let maxPanelesBase;

  UTIL.debugLog("nuevo cantidad de paneles a asignar:" + panelesNuevo);
  // Ordenamos las bases de mayor a menos por su rendimiento. Intentaremos asignar la mayor produccion a la mas productiva
  if (TCB.bases.length > 1) TCB.bases.sort((a, b) => b.rendimiento.unitarioTotal - a.rendimiento.unitarioTotal);

  for (let i=0; i<TCB.bases.length; i++) {
    maxPanelesBase = Math.trunc(TCB.bases[i].potenciaMaxima / TCB.bases[i].instalacion.potenciaUnitaria);
    tmpPaneles = maxPanelesBase > panelesPendientes ? panelesPendientes : maxPanelesBase;
    UTIL.debugLog("asignados " + "tmpPaneles a base "+TCB.bases[i].id);
    TCB.bases[i].instalacion = new Instalacion(tmpPaneles, TCB.bases[i].instalacion.potenciaUnitaria); 
    panelesPendientes -= tmpPaneles;
  }

  if (panelesPendientes > 0 ) console.log("no hay suficiente superficie para instalar " + panelesNuevo + " paneles");
  return panelesPendientes;
}

export {optimizador, nuevoTotalPaneles}