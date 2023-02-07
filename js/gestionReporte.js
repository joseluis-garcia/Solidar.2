
import TCB from "./TCB.js";
import {suma, obtenerPropiedades, formatoValor, campos} from "./Utiles.js";
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
    for(let k=0; k<TCB.bases.length; k++) {
      let j = 0;
      const propiedades = obtenerPropiedades ( TCB.bases[k], 0);

      propiedades.forEach ( (p) => {
        if (p.valor === "Objeto") {
          if (k == 0) {
            dTabla[j] = {"nombre":p.nombre, "valores":[]}
            dTabla[j++].valores.push("***")
          } else {
            dTabla[j++].valores.push("***")
          }
        } else if (campos[p.nombre].mostrar) {
          if (k == 0) {
            dTabla[j] = {"nombre":p.nombre, "valores":[]}
            dTabla[j++].valores.push(formatoValor(p.nombre, p.valor));
          } else {
            dTabla[j++].valores.push(formatoValor(p.nombre, p.valor));
          }     
        }
      });
    }

    for (let j=0; j<dTabla.length; j++){
      if (dTabla[j].valores[0] === "***") {
        nuevaLinea('Titulo',i++, null, 'objeto_'+dTabla[j].nombre);
      } else {
        nuevaLinea('Dato', i++, 'propiedad_'+dTabla[j].nombre, dTabla[j].valores)
      }
    }

    var i = 1;
    nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
    nuevaLinea('Titulo',i++, null, 'informe_LBL_datosDeConsumo');
    nuevaLinea('Dato', i++, 'informe_LBL_localizacion', TCB.territorio);
    nuevaLinea('Dato', i++, 'informe_LBL_numeroRegistros', formatoValor('numeroRegistros', TCB.consumo.numeroRegistros));
    nuevaLinea('Dato', i++, 'informe_LBL_desde', TCB.consumo.fechaInicio.toLocaleDateString());
    nuevaLinea('Dato', i++, 'informe_LBL_hasta', TCB.consumo.fechaFin.toLocaleDateString());
  
    nuevaLinea('Dato', i++, 'resultados_LBL_maximoHora', formatoValor('energia',TCB.consumo.maximoAnual));
    nuevaLinea('Dato', i++, 'resultados_LBL_consumoPFVdiaria', formatoValor('energia',TCB.consumo.totalAnual / TCB.consumo.numeroDias));
    nuevaLinea('Dato', i++, 'resultados_LBL_consumoPFVmensual', formatoValor('energia',TCB.consumo.totalAnual / 12));
    nuevaLinea('Dato', i++, 'resultados_LBL_consumoPFVanual', formatoValor('energia',TCB.consumo.totalAnual));
   
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
    nuevaLinea('Dato', i++, 'resultados_LBL_produccionMediaDiaria', formatoValor('energia',TCB.produccion.totalAnual / 365));
    nuevaLinea('Dato', i++, 'resultados_LBL_produccionMediaMensual', formatoValor('energia',TCB.produccion.totalAnual / 12));
    nuevaLinea('Dato', i++, 'resultados_LBL_produccionMediaAnual', formatoValor('energia',TCB.produccion.totalAnual));
    nuevaLinea('Dato', i++, 'resultados_LBL_kgCO2AnualAhorradoRenovable', formatoValor('peso',TCB.conversionCO2[TCB.territorio].renovable * TCB.produccion.totalAnual));
    nuevaLinea('Dato', i++, 'resultados_LBL_kgCO2AnualAhorradoNoRenovable', formatoValor('peso',TCB.conversionCO2[TCB.territorio].norenovable * TCB.produccion.totalAnual));

    i = 1;
    nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
    nuevaLinea('Titulo',i++, null, 'informe_LBL_balanceEnergia');
    nuevaLinea('Dato', i++, 'resultados_LBL_energiaAhorrada', 
      formatoValor('porciento',((TCB.produccion.totalAnual / TCB.consumo.totalAnual) * 100)));
    nuevaLinea('Dato', i++, 'resultados_LBL_energíaDemandadaVersusGenerada', 
      formatoValor('porciento',((TCB.consumo.totalAnual / TCB.produccion.totalAnual) * 100)));
    let p_autoconsumo = (TCB.balance.autoconsumo / TCB.produccion.totalAnual) * 100;
    let p_autosuficiencia = (TCB.balance.autoconsumo / TCB.consumo.totalAnual) * 100;
    nuevaLinea('Dato', i++, 'resultados_LBL_autoconsumoMedioAnual', 
      formatoValor('energia',TCB.balance.autoconsumo) + "-> " + formatoValor('porciento',p_autoconsumo));
    nuevaLinea('Dato', i++, 'resultados_LBL_autosuficienciaMediaAnual', formatoValor('porciento',p_autosuficiencia));
    nuevaLinea('Dato', i++, 'resultados_LBL_autosuficienciaMaxima', formatoValor('porciento',(p_autosuficiencia + (100 - p_autoconsumo))));
    nuevaLinea('Dato', i++, 'resultados_LBL_energiaSobrante', 
      formatoValor('energia',TCB.balance.excedenteAnual) + " -> " + formatoValor('porciento',(TCB.balance.excedenteAnual / TCB.produccion.totalAnual * 100)));
    nuevaLinea('Dato', i++, 'resultados_LBL_energiaFaltante', 
      formatoValor('energia',TCB.balance.deficitAnual) + " -> " + formatoValor('porciento',(TCB.balance.deficitAnual / TCB.consumo.totalAnual * 100)));

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
    let tarifaActiva = TCB.consumo.tarifa.nombreTarifa
    if (tarifaActiva === "3.0TD") tarifaActiva += " (" + TCB.consumo.tarifa.territorio + ")";
    nuevaLinea('Dato', i++, 'consumo_LBL_tarifa', tarifaActiva);
    nuevaLinea('Dato', i++, 'consumo_LBL_compensa', TCB.consumo.tarifa.precios[0] + "€/kWh");
    for (let j=1; j<=6; j++) {
      if (TCB.consumo.tarifa.precios[j] > 0) 
          nuevaLinea('Dato', i++, "P"+j, TCB.consumo.tarifa.precios[j] + "€/kWh");
    }
    let consumoOriginalAnual = suma(TCB.consumo.economico.consumoOriginalMensual);
    let consumoConPlacasAnual = suma(TCB.consumo.economico.consumoConPlacasMensualCorregido);
    nuevaLinea('Dato', i++, 'precios_LBL_gastoAnualSinPlacas', formatoValor('dinero',consumoOriginalAnual));
    nuevaLinea('Dato', i++, 'precios_LBL_gastoAnualConPlacas', formatoValor('dinero',consumoConPlacasAnual));
    nuevaLinea('Dato', i++, 'parametros_LBL_IVAenergia', formatoValor('porciento',TCB.parametros.IVAenergia));
    nuevaLinea('Dato', i++, 'precios_LBL_ahorroAnual', formatoValor('dinero',TCB.consumo.economico.ahorroAnual));
    nuevaLinea('Dato', i++, 'precios_LBL_costeInstalacion', formatoValor('dinero',TCB.produccion.precioInstalacionCorregido));
    nuevaLinea('Dato', i++, 'parametros_LBL_IVAinstalacion', formatoValor('porciento',TCB.parametros.IVAinstalacion));
    nuevaLinea('Dato', i++, 'precios_LBL_noCompensadoAnual', formatoValor('dinero',suma(TCB.consumo.economico.perdidaMes)));
    nuevaLinea('Dato', i++, 'precios_LBL_ahorroAnualPorciento', formatoValor('porciento',(consumoOriginalAnual - consumoConPlacasAnual) / consumoOriginalAnual * 100));

    i = 1;
    nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
    nuevaLinea('Titulo',i++, null, 'informe_LBL_balanceFinanciero');

    const reportTable = document.getElementById('financiero').cloneNode(true);
    htdoc.appendChild(reportTable);
    nuevaLinea('Dato', i++, 'VAN', formatoValor('VAN', TCB.consumo.economico.VANProyecto));
    nuevaLinea('Dato', i++, 'TIR', formatoValor('TIR', TCB.consumo.economico.TIRProyecto));

    let textNode = document.createElement("p");
    let att1 = document.createAttribute("style");
    att1.value = "text-align:center";
    textNode.setAttributeNode(att1);
    textNode.innerHTML = "<br><h5>" + i18next.t("informe_LBL_disclaimer1") + "<br>" + i18next.t("informe_LBL_disclaimer2") + "</h5>";
    htdoc.appendChild(textNode);

    return true;
}

function nuevaLinea( tipo, linea, propiedad, valor) {

    let hoy = new Date();
    let nLine = document.createElement("HR");
    var textNode;
    switch (tipo) {
      case "Cabecera":
        break;
      case "Titulo":
          textNode = document.createElement('p');
          textNode.classList.add("titulo");
          let att1 = document.createAttribute("data-i18n");
          att1.value = valor;
          textNode.setAttributeNode(att1);
          textNode.innerHTML = i18next.t(valor);
          htdoc.appendChild(textNode);
          htdoc.appendChild(nLine);
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
          let att;
          let divNode0 = document.createElement("div");
          att = document.createAttribute("class");
          att.value = "form-group row justify-content-center";
          divNode0.setAttributeNode(att);
          htdoc.appendChild(divNode0);
          let divNode1 = document.createElement("div");
          att = document.createAttribute("class");
          att.value = "col-md-3 text-end";
          divNode1.setAttributeNode(att);

          att = document.createAttribute("data-i18n");
          att.value = propiedad;
          divNode1.setAttributeNode(att);
          divNode1.innerText = i18next.t(propiedad);
          divNode0.appendChild(divNode1);

          if (Array.isArray(valor)) {
            for (let val=0; val < valor.length; val++) {
              let divNode2 = document.createElement("div");
              att = document.createAttribute("class");
              att.value = "col-md-2 text-end";
              divNode2.setAttributeNode(att);
              divNode2.innerHTML = valor[val];
              divNode0.appendChild(divNode2);
            }
          } else {
            let divNode2 = document.createElement("div");
            att = document.createAttribute("class");
            att.value = "col-md-2 text-end";
            divNode2.setAttributeNode(att);
            divNode2.innerHTML = valor;
            divNode0.appendChild(divNode2);
          }
        break;
      case "Pie":
        break;
    }
  }

export {gestionReporte}