
import TCB from "./TCB.js";
import {copiaTablaLimpia, formatNumber } from "./Muestra.js";
import {suma, obtenerPropiedades, formatoValor} from "./Utiles.js";
import { generaInformePDF } from "./generaInformePDF.js";

let htdoc;
export default function gestionReporte( accion) {
    switch (accion) {
      case "Inicializa":
        inicializaEventos();
        break;
      case "Valida":
        valida();
        break;
      case "Prepara":
        return prepara();
        
    }
  }

function inicializaEventos() {
  // Inicialización y evento asociado a la generación del informe pdf
  htdoc = document.getElementById('contenido');
  document.getElementById('informeMenu').addEventListener("click", procesaInformePDF);
  document.getElementById('informeResumen').addEventListener("click", procesaInformePDF);
  
  function procesaInformePDF(event) { 
    if (TCB.consumo.economicoCreado) {
      generaInformePDF();
    } else {
      alert(TCB.i18next.t('informe_MSG_procesarPrimero'));
  }};
}

function valida() { //Nada que hacer, de aqui no se pasa a ningun nuevo tab
}

async function prepara() {

  htdoc.innerHTML = ""; //Limpia el DIV donde se generar el resumen
  i = 1;
    nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
    nuevaLinea('Titulo', i++, null, 'informe_LBL_datosLocalizacionAportados');
    let dTabla = [];
    for (let k=0; k<TCB.bases.length; k++) {
      let vectorPropiedades = obtenerPropiedades ( TCB.bases[k], 0);
      for (let i=0; i<vectorPropiedades.length; i++) {
        if (k === 0) {
          let oFila = {"nombre":"", "valores":""};
          if (vectorPropiedades[i].valor === "Objeto") 
            oFila.nombre = i18next.t("objeto_"+vectorPropiedades[i].nombre);
          else
            oFila.nombre = i18next.t("propiedad_"+vectorPropiedades[i].nombre);

          oFila.valores = [];
          dTabla.push(oFila);
        }

        if (vectorPropiedades[i].valor === "Objeto") {
          dTabla[i].valores.push("***");
        } else {
          dTabla[i].valores.push(formatoValor(vectorPropiedades[i].nombre, vectorPropiedades[i].valor))
        }
      }    
    }

    let nTabla = document.createElement('table');
    let nFila;
    let nCelda;
    let nLine = document.createElement('hr');
    for (let i=0; i<dTabla.length; i++){
      if (dTabla[i].valores[0] === "***") {
        htdoc.appendChild(nLine);
        nFila = document.createElement('theader');
        nCelda = document.createElement('th');
        nCelda.innerHTML = "<h4>"+dTabla[i].nombre+"</h4>";
        nCelda.setAttribute("colspan", TCB.bases.lenght+1);
        //nCelda.setAttribute("style","text-align:center");
      } else {
        nFila = document.createElement('tr');
        nCelda = document.createElement('td');
/*         let xatt = document.createAttribute("data-i18n");
        xatt.value = dTabla[i].nombre;
        nCelda.setAttributeNode(xatt); */
        nCelda.classList.add("text-start");
        nCelda.classList.add("col-md-3");
        nCelda.innerHTML = dTabla[i].nombre;
      }
      nFila.appendChild(nCelda);
      for (let j=0; j<TCB.bases.length; j++){
        let nCelda1 = document.createElement('td');
        nCelda1.innerHTML = (dTabla[i].valores[j] === "***") ? " " : dTabla[i].valores[j];
        nCelda1.classList.add("text-end");
        nFila.appendChild(nCelda1);
      }
      nTabla.appendChild(nFila);
    }
    htdoc.appendChild(nTabla);

    var i = 1;
    nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
    nuevaLinea('Titulo',i++, null, 'informe_LBL_datosDeConsumo');
    nuevaLinea('Dato', i++, 'informe_LBL_localizacion', TCB.territorio,"");
    nuevaLinea('Dato', i++, 'informe_LBL_numeroRegistros', formatNumber(TCB.consumo.numeroRegistros, 0), "");
    nuevaLinea('Dato', i++, 'informe_LBL_desde', TCB.consumo.fechaInicio.toLocaleDateString(), "");
    nuevaLinea('Dato', i++, 'informe_LBL_hasta', TCB.consumo.fechaFin.toLocaleDateString(), "");
  
    nuevaLinea('Dato', i++, 'resultados_LBL_maximoHora', formatNumber(TCB.consumo.maximoAnual, 2), "kWh");
    nuevaLinea('Dato', i++, 'resultados_LBL_consumoPFVdiaria', formatNumber(TCB.consumo.totalAnual / TCB.consumo.numeroDias, 2), "kWh");
    nuevaLinea('Dato', i++, 'resultados_LBL_consumoPFVmensual', formatNumber(TCB.consumo.totalAnual / 12, 2),  "kWh");
    nuevaLinea('Dato', i++, 'resultados_LBL_consumoPFVanual', formatNumber(TCB.consumo.totalAnual, 2), "kWh");
   
    var nImage;
    await Plotly.toImage('graf_resumenConsumo', { format: 'png', width: 800, height: 500 }).then(function (dataURL) {
      nImage = document.createElement("img");
      nImage.src = dataURL;
      nImage.width = 600;
      nImage.height = 400;
      nImage.classList.add('imagen-centrada');
    });
    htdoc.appendChild(nImage);

    i += 2;
    nuevaLinea("Titulo", i++, null, 'informe_LBL_produccionMediaEsperada');
    nuevaLinea('Dato', i++, 'resultados_LBL_produccionMediaDiaria', formatNumber(TCB.produccion.totalAnual / 365, 2) , "kWh");
    nuevaLinea('Dato', i++, 'resultados_LBL_produccionMediaMensual', formatNumber(TCB.produccion.totalAnual / 12, 2) , "kWh");
    nuevaLinea('Dato', i++, 'resultados_LBL_produccionMediaAnual', formatNumber(TCB.produccion.totalAnual, 2) , "kWh");
    nuevaLinea('Dato', i++, 'resultados_LBL_kgCO2AnualAhorradoRenovable', formatNumber(TCB.conversionCO2[TCB.territorio].renovable * TCB.produccion.totalAnual, 2)," kg")
    nuevaLinea('Dato', i++, 'resultados_LBL_kgCO2AnualAhorradoNoRenovable', formatNumber(TCB.conversionCO2[TCB.territorio].norenovable * TCB.produccion.totalAnual, 2)," kg");

    i = 1;
    nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
    nuevaLinea('Titulo',i++, null, 'informe_LBL_balanceEnergia');
    nuevaLinea('Dato', i++, 'resultados_LBL_energiaAhorrada', formatNumber((TCB.produccion.totalAnual / TCB.consumo.totalAnual) * 100, 2) , "%");
    nuevaLinea('Dato', i++, 'resultados_LBL_energíaDemandadaVersusGenerada', formatNumber((TCB.consumo.totalAnual / TCB.produccion.totalAnual) * 100, 2) , "%");
    let p_autoconsumo = (TCB.balance.autoconsumo / TCB.produccion.totalAnual) * 100;
    let p_autosuficiencia = (TCB.balance.autoconsumo / TCB.consumo.totalAnual) * 100;
    nuevaLinea('Dato', i++, 'resultados_LBL_autoconsumoMedioAnual', 
        formatNumber(TCB.balance.autoconsumo, 2) + " kWh -> " + formatNumber(p_autoconsumo, 2), "%");
    nuevaLinea('Dato', i++, 'resultados_LBL_autosuficienciaMediaAnual', formatNumber(p_autosuficiencia, 2) , "%");
    nuevaLinea('Dato', i++, 'resultados_LBL_autosuficienciaMaxima', formatNumber(p_autosuficiencia + (100 - p_autoconsumo),2) , "%");
    nuevaLinea('Dato', i++, 'resultados_LBL_energiaSobrante', 
        formatNumber(TCB.balance.excedenteAnual,2) + " kWh -> " + formatNumber(TCB.balance.excedenteAnual / TCB.produccion.totalAnual * 100, 2), "%");
    nuevaLinea('Dato', i++, 'resultados_LBL_energiaFaltante', 
    formatNumber(TCB.balance.deficitAnual,2) + " kWh -> " + formatNumber(TCB.balance.deficitAnual / TCB.consumo.totalAnual * 100, 2), "%");

    var nImage;
    await Plotly.toImage('graf_1', { format: 'png', width: 800, height: 500 }).then(function (dataURL) {
      nImage = document.createElement("img");
      nImage.src = dataURL;
      nImage.width = 600;
      nImage.height = 400;
      nImage.classList.add('imagen-centrada');
    });
    htdoc.appendChild(nImage);

    i = 1;
    nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
    nuevaLinea('Titulo',i++, null, 'informe_LBL_balanceEconomico');
    nuevaLinea('Dato', i++, 'consumo_LBL_tarifa', TCB.tarifaActiva, "");

    let consumoOriginalAnual = suma(TCB.consumo.economico.consumoOriginalMensual);
    let consumoConPlacasAnual = suma(TCB.consumo.economico.consumoConPlacasMensualCorregido);
    nuevaLinea('Dato', i++, 'precios_LBL_gastoAnualSinPlacas', formatNumber(consumoOriginalAnual, 2), "€");
    nuevaLinea('Dato', i++, 'precios_LBL_gastoAnualConPlacas', formatNumber(consumoConPlacasAnual, 2), "€");
    nuevaLinea('Dato', i++, 'parametros_LBL_IVAenergia', formatNumber(TCB.parametros.IVAenergia), "%");
    nuevaLinea('Dato', i++, 'precios_LBL_ahorroAnual', formatNumber(TCB.consumo.economico.ahorroAnual, 2), "€");
    nuevaLinea('Dato', i++, 'precios_LBL_costeInstalacion', formatNumber(TCB.produccion.precioInstalacionCorregido, 2), "€");
    nuevaLinea('Dato', i++, 'parametros_LBL_IVAinstalacion', formatNumber(TCB.parametros.IVAinstalacion), "%");
    nuevaLinea('Dato', i++, 'precios_LBL_noCompensadoAnual', formatNumber(suma(TCB.consumo.economico.perdidaMes), 2), "€");
    nuevaLinea('Dato', i++, 'precios_LBL_ahorroAnualPorciento', formatNumber((consumoOriginalAnual - consumoConPlacasAnual) / consumoOriginalAnual * 100, 2), "%");

    i = 1;
    nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
    nuevaLinea('Titulo',i++, null, 'informe_LBL_balanceFinanciero');

    const reportTable = document.getElementById('financiero').cloneNode(true);
    htdoc.appendChild(reportTable);
    nuevaLinea('Dato', i++, 'VAN', formatoValor('VAN', TCB.consumo.economico.VANProyecto), "");
    nuevaLinea('Dato', i++, 'TIR', formatoValor('TIR', TCB.consumo.economico.TIRProyecto), "");

    let textNode = document.createElement("p");
    let att1 = document.createAttribute("style");
    att1.value = "text-align:center";
    textNode.setAttributeNode(att1);
    textNode.innerHTML = "<br><h5>" + i18next.t("informe_LBL_disclaimer1") + "<br>" + i18next.t("informe_LBL_disclaimer2") + "</h5>";
    htdoc.appendChild(textNode);

    return true;
}

function nuevaLinea( tipo, linea, propiedad, valor, unidad) {
    // Hoja DIN A4 - 210 x 297

    const _hdr = 25;
    const footer = 285;
    const margenIzquierdo = 25;
    const margenDerecho = 195;
    const margenValor = 170;
    const margenUnidad = 180;
    const _vert = 10;
    const _delta = 7;
    const _font = {Cabecera: 22, Titulo: 16, Normal:12, Dato: 11, Pie:10}
    let renglon = _hdr + _vert + linea * _delta;
    let hoy = new Date();

    var textNode;
    var att1;
    switch (tipo) {
      case "Cabecera":
        break;
      case "Titulo":
          textNode = document.createElement('p');
          textNode.classList.add("titulo");
/*           let att1 = document.createAttribute("style");
          att1.value = "text-align:center; font-size:30px; font-weight: bold;";
          textNode.setAttributeNode(att1); */

          let att1 = document.createAttribute("data-i18n");
          att1.value = valor;
          textNode.setAttributeNode(att1);
          textNode.innerHTML = i18next.t(valor);
          htdoc.appendChild(textNode);
          break;
      case "Normal":
          textNode = document.createElement("p");
          textNode.innerHTML = valor;
          att1 = document.createAttribute("style");
          att1.value = "text-align:center";
          textNode.setAttributeNode(att1);
          htdoc.appendChild(textNode);
          break;
      case "Dato":
          let divNode0 = document.createElement("div");
          let att = document.createAttribute("class");
          att.value = "form-group row justify-content-center";
          divNode0.setAttributeNode(att);
          htdoc.appendChild(divNode0);
          let divNode1 = document.createElement("div");
          att = document.createAttribute("class");
          att.value = "col-md-2 text-end";
          divNode1.setAttributeNode(att);

          att = document.createAttribute("data-i18n");
          att.value = propiedad;
          divNode1.setAttributeNode(att);
          divNode1.innerText = i18next.t(propiedad);
          divNode0.appendChild(divNode1);

          let divNode2 = document.createElement("div");
          att = document.createAttribute("class");
          att.value = "col-md-2 text-end";
          divNode2.setAttributeNode(att);
          divNode2.innerHTML = valor + " " + unidad;
          divNode0.appendChild(divNode2);
        break;
      case "Pie":
        break;
    }
  }

export {gestionReporte}