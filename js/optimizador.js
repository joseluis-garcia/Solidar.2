import * as UTIL from "./Utiles.js";
import Instalacion from "./Instalacion.js";
//import Produccion from "./Produccion.js";

async function optimizador( bases, consumo, potenciaPanelInicio) {

    // Ordenamos las bases por su rendimiento. Intentaremos asignar la mayor produccion a la mas productiva
    let totalAsignar = consumo.totalAnual;
    let tmpAsignado = 0;
    let tmpPaneles;
    if (bases.length > 1) bases.sort((a, b) => b.rendimiento.unitarioTotal - a.rendimiento.unitarioTotal);
    for (let i=0; i<bases.length; i++) {
      tmpAsignado = bases[i].rendimiento.unitarioTotal * bases[i].potenciaMaxima;
      tmpAsignado = tmpAsignado > totalAsignar ? totalAsignar : tmpAsignado;
      tmpPaneles = Math.round(tmpAsignado / bases[i].rendimiento.unitarioTotal / potenciaPanelInicio);
      UTIL.debugLog("_initInstalacion con" + tmpPaneles + " paneles de " + potenciaPanelInicio + "kWp en la base ", bases[i].id);
      bases[i].instalacion = new Instalacion(tmpPaneles, potenciaPanelInicio); //Creamos una instalación por defecto que cubra el consumo maximo anual   
      totalAsignar -= tmpAsignado;
    }
    if (totalAsignar > 0) alert("no hay suficiente superficie");
    return true;
  }

  export {optimizador}