import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";

var campos = {
  "id": {"unidad":"", "decimales":0},
	"area": {"unidad": "m<sup>2</sup>", "decimales":2},
	"potenciaMaxima": {"unidad": " kWp", "decimales":2},
	"inclinacionPaneles": {"unidad":"º","decimales":2},
	"inclinacionTejado": {"unidad":"º","decimales":2},
	"acimut": {"unidad":"º","decimales":2},
	"fechaInicio": {"unidad":""},
	"fechaFin": {"unidad":""},
	"inclinacion": {"unidad":"º", "decimales":2},
	"rendimientoCreado": {"unidad": ""},
	"unitarioTotal": {"unidad":" kWh", "decimales":2},
  "energiaTotal": {"unidad":" kWh", "decimales":2},
	"system_loss": {"unidad":"%", "decimales":2},
	"technology": {"unidad":""},
	"inclinacionOptimal": {"unidad":""},
	"acimutOptimal": {"unidad":""},
	"radiation_db": {"unidad":"", "decimales":0},
	"meteo_db": {"unidad":""},
	"year_min": {"unidad":"","decimales":0},
	"year_max": {"unidad":"","decimales":0},
	"numeroRegistros": {"unidad":"","decimales":0},
	"potenciaUnitaria": {"unidad":" kWp","decimales":2},
	"paneles": {"unidad":"", "decimales":0},
  "potenciaTotal":{"unidad":" kWp", "decimales":2},
  "lon":{"unidad":"", "decimales":2},
  "lat":{"unidad":"", "decimales":2},
  "VAN":{"unidad":" €", "decimales":2},
  "TIR":{"unidad":"%", "decimales":2},
  "participacion":{"unidad":"%", "decimales":2}
}


function formatNumber( numero, decimal) {
    if (decimal !== undefined) {
      //Segun la definción ISO (https://st.unicode.org/cldr-apps/v#/es/Symbols/70ef5e0c9d323e01) los numeros en 'es' no llevan '.' si no hay mas de dos 
      //digitos delante del '.' Minimum Grouping Digits = 2. Como no estoy de acuerdo con este criterio en el caso de 'es' lo cambio a 'ca' que funciona bien
      let lng = TCB.i18next.language.substring(0,2) === 'es' ? 'ca' : TCB.i18next.language.substring(0,2);
      return numero.toLocaleString(lng, {maximumFractionDigits: decimal, minimumFractionDigits: decimal});
    } else {
      return numero.toLocaleString();
    }
}


function copiaTablaLimpia( original) {

    
    var tablaOriginal = document.getElementById(original);
    var tablaNueva = tablaOriginal.cloneNode(false);
    var filasOriginales = tablaOriginal.rows;
    var nuevaFila;

    let cabecera = true;
    for (let filaOriginal of filasOriginales) {
      if (cabecera) {
        nuevaFila = filaOriginal.cloneNode(true); // Es la cabecera y la copiamos tal cual
        cabecera = false;
      } else {
        nuevaFila = filaOriginal.cloneNode(false);
        for (let celdaOriginal of filaOriginal.cells) {
          let nuevaCelda;
          switch (celdaOriginal.firstChild.tagName) {
            case "INPUT":
              nuevaCelda = document.createElement("td");
              nuevaCelda.innerText = celdaOriginal.firstChild.value;
              break;
            case "LABEL":
            case undefined:
              nuevaCelda = celdaOriginal.cloneNode(true);
              break;
            default:
              nuevaCelda = ""
          }
          if (nuevaCelda !== "") nuevaFila.appendChild(nuevaCelda);
        }
      } 
      tablaNueva.appendChild( nuevaFila);
    }
    return tablaNueva;
    
}

export { formatNumber,  copiaTablaLimpia}
