import TCB from "./TCB.js";

var campos = {
// Genericos
  "energia": {"unidad":" kWh", "decimales":2},
	"area": {"unidad": " m<sup>2</sup>", "decimales":2},
  "potencia": {"unidad": " kWp", "decimales":2},
  "porciento": {"unidad":"%", "decimales":2},
  "peso": {"unidad":" Kg", "decimales": 2},
  "dinero": {"unidad": " €", "decimales": 0},
// Especificos
  "id": {"unidad":"", "decimales":0},
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
  "participacion":{"unidad":"%", "decimales":2},
  "maximoAnual": {"unidad":" kWh", "decimales":2},
  "totalAnual": {"unidad":" kWh", "decimales":2},
  "precioInstalacion":{"unidad":"€", "decimales":0},
  "precioInstalacionCorregido":{"unidad":"€", "decimales":0},
}

export const nombreMes = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
//indiceDia es utilizado para convertir una fecha de un año cualquiera en un indice dia entre 0 y 364
export const indiceDia = [
  [0, 0, 30],
  [1, 31, 58],
  [2, 59, 89],
  [3, 90, 119],
  [4, 120, 150],
  [5, 151, 180],
  [6, 181, 211],
  [7, 212, 242],
  [8, 243, 272],
  [9, 273, 303],
  [10, 304, 333],
  [11, 334, 364],
];

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if(pair[0] == variable) {
          return pair[1];
      }
  }
  return false;
}

function debugLog(msg, obj) {

  if (TCB.debug !== false) {
    console.log(msg);
    if (obj !== undefined && typeof obj === "object") {
      var objPropTxt = "";
      for (let objProp in obj) objPropTxt += objProp + "->" + obj[objProp] + "\n";
      console.log(objPropTxt);
    }
  }
}

function mete(unDia, idxTable, outTable) {

  var indiceDia = indiceDesdeDiaMes(unDia.dia, unDia.mes);
  for (let hora = 0; hora < 24; hora++) {
    if (idxTable[indiceDia].previos > 0) {
      //Impica que ya habia registros previos para ese dia
      unDia.valores[hora] =
        (outTable[indiceDia][hora] * idxTable[indiceDia].previos +
          unDia.valores[hora]) /
        (idxTable[indiceDia].previos + 1);
    }
    outTable[indiceDia][hora] = unDia.valores[hora];
  }
  idxTable[indiceDia].previos = idxTable[indiceDia].previos + 1;
  idxTable[indiceDia].dia = unDia.dia;
  idxTable[indiceDia].mes = unDia.mes;
  idxTable[indiceDia].suma = suma(unDia.valores);
  idxTable[indiceDia].maximo = Math.max(...unDia.valores);
}

async function getFileFromUrl(url, type) {
  const response = await fetch(url);
  const data = await response.blob();
  const metadata = { type: type || "text/csv" };
  return new File([data], metadata);
}

function csvToArray(str, delimiter = ",") {
  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter
  try {
    var headers = str.slice(0, str.indexOf("\n")).split(delimiter);
  } catch (e) {
    alert("Posible error de formato fichero de consumos\n" + str);
    return;
  }
  debugLog("Cabecera CSV:", headers);

  // la diferencia entre los ficheros de Naturgy y de Iberdrola es que
  // la cuarta columna donde esta el consumo se llama Consumo en Naturgy y Consumo_kWh en Iberdrola y VIESGO y AE_kWh en ENDESA.
  // unificamos en "Consumo"
  if (headers[3] == "Consumo_kWh") headers[3] = "Consumo";
  if (headers[3] == "AE_kWh") headers[3] = "Consumo";

  let chk_consumo = false;
  let chk_fecha = false;
  let chk_hora = false;
  headers.forEach ( hdr => {
    if (hdr === "Consumo" || hdr === "2.0TD" || hdr === "3.0TD") chk_consumo = true;
    if (hdr === "Fecha") chk_fecha = true;
    if (hdr === "Hora") chk_hora = true;
  })
  if (! (chk_consumo && chk_fecha && chk_hora)) {
    let failHdr = "";
    if (!chk_consumo) failHdr += "Consumo "; 
    if (!chk_fecha) failHdr += "Fecha ";
    if (!chk_hora) failHdr += "Hora ";
    alert (i18next.t("consumo_MSG_errorCabeceras", {cabeceras: failHdr}));
    return [];
  }
  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row
  const rows = str.slice(str.indexOf("\n") + 1).split("\n");

  let arr = [];
  rows.forEach( (row) => {
    if(row.length > 1) {
      const values = row.split(delimiter);
      const el = headers.reduce(function (object, header, index) {
        object[header] = values[index];
        return object;
      }, {});
      arr.push(el);
    }
  })

  // return the array
  return arr;
}

function promedio(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function suma(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

// Funciones de gestion de indice de dias -------------------------------------------------------------------
function difDays(inicio, fin) {
  let diferencia = fin.getTime() - inicio.getTime();
  return Math.ceil(diferencia / (1000 * 3600 * 24));
}

function indiceDesdeFecha(fecha) {
  var dia = fecha.getDate();
  var mes = fecha.getMonth();
  return indiceDia[mes][1] + dia - 1;
}

function indiceDesdeDiaMes(dia, mes) {
  return indiceDia[mes][1] + dia - 1;
}

function fechaDesdeIndice(indice) {
  for (let i = 0; i < 12; i++) {
    if (indiceDia[i][2] >= indice) {
      let mes = i;
      let dia = indice - indiceDia[mes][1] + 1;
      return [dia, mes];
    }
  }
}

function resumenMensual(idx, prop) {
  let _consMes = new Array(12).fill(0);
  for (let i = 0; i < 365; i++) {
    _consMes[idx[i].mes] += idx[i][prop];
  }
  return _consMes;
}

function dumpData(nombre, idxTable, dataTable) {
  // Loop the array of objects
  var csv;
  for (let row = 0; row < idxTable.length; row++) {
    let keysAmount = Object.keys(idxTable[row]).length;
    let keysCounter = 0;

    // If this is the first row, generate the headings
    if (row === 0) {
      // Loop each property of the object
      for (let key in idxTable[row]) {
        // This is to not add a comma at the last cell
        // The '\n' adds a new line
        csv += key + (keysCounter + 1 < keysAmount ? ";" : "");
        keysCounter++;
      }
      for (let i = 0; i < 24; i++) {
        csv += ";" + i;
      }
      csv += "\r\n";
    }
    keysCounter = 0;
    for (let key in idxTable[row]) {
      csv += idxTable[row][key] + (keysCounter + 1 < keysAmount ? ";" : "");
      keysCounter++;
    }
    for (let i = 0; i < 24; i++) {
      csv += ";" + dataTable[row][i];
    }
    csv += "\r\n";
  }

  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(csv)
  );
  element.setAttribute("download", nombre);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function formatoValor( campo, valor) {
  const dato = campos[campo];

  if (dato === undefined) return valor;

  if (typeof valor === 'boolean') return i18next.t("valor_"+valor);

  if (dato.unidad === 'º') { //Se debe tener en cuanta que algunos campos de angulos para PVGIS pueden tener el valor Optimo por lo que no se añade º
      if (valor === 'Optimo') return i18next.t("propiedad_valorOptimo");
      if (valor === '') return '';
  }

  if (dato.decimales !== undefined) {
    //Segun la definción ISO (https://st.unicode.org/cldr-apps/v#/es/Symbols/70ef5e0c9d323e01) los numeros en 'es' no llevan '.' si no hay mas de dos 
    //digitos delante del '.' Minimum Grouping Digits = 2. Como no estoy de acuerdo con este criterio en el caso de 'es' lo cambio a 'ca' que funciona bien
    let lng = TCB.i18next.language.substring(0,2) === 'es' ? 'ca' : TCB.i18next.language.substring(0,2);
    return valor.toLocaleString(lng, {maximumFractionDigits: dato.decimales, minimumFractionDigits: dato.decimales}) + dato.unidad;
  } else {
    return valor.toLocaleString() + dato.unidad;
  }
}

function safeData(obj) {
  console.log(JSON.stringify(obj));
}



/* Función para mostrar el formulario modal de propiedades de un bojeto generico
@param: objeto -> es el objeto del que se mostrará todas las propiedades que devuelve getOwnPropertyDescriptors en la función
                obtenerPropiedades. La llamada es recursiva, si una propiedad es un objeto se mostrarán la propiedades de ese
                objeto tambien.
@param: descripcion -> titulo del <body> del formulario modal
 */
var modalWrap = null;
function formularioAtributos (objeto, descripcion, yesBtnLabel = 'Yes', noBtnLabel = 'Cancel', callback) {
  if (modalWrap !== null) {
    modalWrap.remove();
  }
  const vectorPropiedades = obtenerPropiedades(objeto, 0);
  modalWrap = document.createElement('div');
  let tmpHTML = `<div class="modal fade" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-light">
            <h5 class="modal-title">` + i18next.t("resultados_LBL_tituloPropiedades") + `</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>` + descripcion + `</p>
            <table id="tablaPropiedades" class="table table-sm table-striped table-bordered text-end center">`

            for (let i=0; i<vectorPropiedades.length; i++) {
                if (vectorPropiedades[i].valor === "Objeto") {
                    tmpHTML += "<tr class='table-info text-center'><td colspan=2>" + i18next.t("objeto_"+vectorPropiedades[i].nombre) + "</td><tr>";
                } else {
                    tmpHTML += "<tr><td class='text-start'>" + i18next.t("propiedad_"+vectorPropiedades[i].nombre) + 
                    "</td><td class='text-end'>" +  formatoValor(vectorPropiedades[i].nombre, vectorPropiedades[i].valor) + "</td></tr>";
                }
            }
    tmpHTML += 
            `</table>
          </div>
        </div>
      </div>
    </div>
  `;

  modalWrap.innerHTML = tmpHTML;
  //modalWrap.querySelector('.modal-success-btn').onclick = callback;
  document.body.append(modalWrap);
  var modal = new bootstrap.Modal(modalWrap.querySelector('.modal'));
  modal.show();
}

var prop_val;
function obtenerPropiedades ( objeto, nivel) {
  if (nivel == 0 ) prop_val = [];
  const propiedades = Object.getOwnPropertyDescriptors(objeto); 
  for (let prop in propiedades) {
    if (!Array.isArray(objeto[prop])) {
      let tipoPropiedad = typeof objeto[prop];
      if (tipoPropiedad === 'object') {
        if (objeto[prop] instanceof Date) {
            prop_val.push({'nombre': prop, 'valor': objeto[prop].toLocaleDateString() });
        } else {
            prop_val.push({'nombre': prop, 'valor': "Objeto" });
            obtenerPropiedades( objeto[prop], 1);
        }
      } else {
        prop_val.push({'nombre': prop, 'valor': objeto[prop] });
      }
    }
  }
  return prop_val;
}

function mensaje (campo, texto) {

  let nodoCampo = document.getElementById( campo);
  nodoCampo.innerHTML = i18next.t(texto);
  nodoCampo.setAttribute("data-i18n", texto);

}

function muestraAtributos (tipo, id, evento) {
  /*     const filaActiva = evento.target.parentNode.parentNode.parentNode;
      const id = filaActiva.cells[0].outerText; */
      let index;
      switch (tipo) {
        case 'base':
          index = TCB.bases.findIndex( base => base.id === id);
          formularioAtributos(TCB.bases[index], i18next.t("resultados_LBL_basePropiedades", {'id': id}));
          break;
        case 'consumo':
          index = TCB.consumos.findIndex( consumo => consumo.id === id);
          formularioAtributos(TCB.consumos[index], i18next.t("resultados_LBL_basePropiedades", {'id': id}));
      }
}

function muestra(donde, pre, valor, post) {
  if (document.getElementById(donde).type === 'number'){
    document.getElementById(donde).value = valor;
  } else {
    if (post != undefined) {
      document.getElementById(donde).innerHTML = pre + valor + post;
    } else {
      document.getElementById(donde).innerHTML = pre + valor;
    }
  }
}

export {
  suma,
  promedio,
  csvToArray,
  debugLog,
  difDays,
  indiceDesdeFecha,
  fechaDesdeIndice,
  indiceDesdeDiaMes,
  mete,
  resumenMensual,
  dumpData,
  getFileFromUrl,
  getQueryVariable,
  safeData,
  formatoValor,
  muestraAtributos,
  obtenerPropiedades,
  mensaje,
  muestra
};
window.dumpData = dumpData;