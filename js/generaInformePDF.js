import TCB from "./TCB.js";
import {copiaTablaLimpia, formatNumber } from "./Muestra.js";
import {suma, obtenerPropiedades, formatoValor} from "./Utiles.js";

var doc;
function newDoc() {
  return new jsPDF('portrait', 'mm', 'a4');
}

async function generaInformePDF() {

  TCB.doc = newDoc(); //Crea un nuevo pdf
  doc = TCB.doc;
  let pagina = 1;

  i = 1;
  nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
  nuevaLinea('Titulo', i++, null, 'informe_LBL_datosLocalizacionAportados');

    var bodyTable = [];
    let vectorPropiedades = [];


      for (let k=0; k<TCB.bases.length; k++) {
        vectorPropiedades = obtenerPropiedades ( TCB.bases[k], 0);
        for (let i=0; i<vectorPropiedades.length; i++) {
          if (k === 0) {
            let bodyRow = [];
            bodyTable.push(bodyRow);
            if (vectorPropiedades[i].valor === "Objeto") 
              bodyTable[i].push("*" + i18next.t("objeto_"+vectorPropiedades[i].nombre));
            else
              bodyTable[i].push(i18next.t("propiedad_"+vectorPropiedades[i].nombre));
          }
          bodyTable[i].push(formatoValor(vectorPropiedades[i].nombre, vectorPropiedades[i].valor));
        }
      }

doc.autoTable({
  willDrawCell: (data) => {
     if (data.cell.raw[0] === '*') {
      data.cell.text = data.cell.raw.substring(1);
      doc.setFillColor(110,214,84);
     // doc.rect(data.settings.margin.left, row.y, data.table.width, 20, 'F');
/*       doc.autoTableText("", data.settings.margin.left + data.table.width / 2, data.row.y + data.row.height / 2, {
                    halign: 'center',
                    valign: 'middle'
                }); */
      data.cell.colSpan = TCB.bases.length + 1;
    } else if (data.cell.raw === "Objeto") {
      data.cell.text = '';
      doc.setFillColor(110,214,84);
    }
  },
  body: bodyTable,
  startY: 50,
  styles: {halign: 'right', lineWidth: 1},
  columnStyles: { 0: { halign: 'left'} },
  theme: 'striped',
  alternateRowStyles: {fillColor: [229,255,204]},
})
doc.addPage();
 /*  let dTabla = [];
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

 */
/*   let nTabla = document.createElement('table');
  let nFila;
  let nCelda;
  for (let i=0; i<dTabla.length; i++){
    if (dTabla[i].valores[0] === "***") {
      nFila = document.createElement('theader');
      nCelda = document.createElement('th');
      nCelda.innerHTML = "<h4>"+dTabla[i].nombre+"</h4>";
      nCelda.setAttribute("colspan", TCB.bases.lenght+1);
      //nCelda.setAttribute("style","text-align:center");
    } else {
      nFila = document.createElement('tr');
      nCelda = document.createElement('td');
      nCelda.innerHTML = dTabla[i].nombre;
    }
    nFila.appendChild(nCelda);
    for (let j=0; j<TCB.bases.length; j++){
      let nCelda1 = document.createElement('td');
      nCelda1.innerHTML = (dTabla[i].valores[j] === "***") ? " " : dTabla[i].valores[j];
      nFila.appendChild(nCelda1);
    }
    nTabla.appendChild(nFila);
  } */
    //htdoc.appendChild(nTabla);

/* 
    nuevaLinea('Dato', i++, 'informe_LBL_localizacion', TCB.territorio,"");
    nuevaLinea('Dato', i++, 'proyecto_LBL_lonlat', formatNumber(TCB.rendimiento.lon, 4) + ", " + formatNumber(TCB.rendimiento.lat,4), "");
    nuevaLinea('Dato', i++, 'proyecto_LBL_inclinacion', formatNumber(TCB.rendimiento.inclinacion,0 ), "º");
    nuevaLinea('Dato', i++, 'mapa_LBL_acimut', formatNumber(TCB.rendimiento.acimut, 0), "º"); 
  
/*     nuevaLinea('Dato', i++, 'Radiation DB', TCB.rendimiento.radiation_db, "");
    nuevaLinea('Dato', i++, 'Meteo DB', TCB.rendimiento.meteo_db, "");
    nuevaLinea('Dato', i++, 'year_min', formatNumber(TCB.rendimiento.year_min, 0), "");
    nuevaLinea('Dato', i++, 'year_max', formatNumber(TCB.rendimiento.year_max, 0), "");
    nuevaLinea('Pie', pagina++, true);
  
    i = 1;
    nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
    nuevaLinea('Titulo', i++, null, 'informe_LBL_datosInstalacionAnalizada');
    nuevaLinea('Dato', i++, 'resultados_LBL_paneles', formatNumber(TCB.instalacion.paneles, 0) , "");
    nuevaLinea('Dato', i++, 'resultados_LBL_potenciaPanel', formatNumber(TCB.instalacion.potenciaUnitaria, 3), "kW");
    nuevaLinea('Dato', i++, 'resultados_LBL_potenciaDisponible', formatNumber(TCB.instalacion.potenciaTotal, 2), "kWp");
    nuevaLinea('Dato', i++, 'proyecto_LBL_inclinacion', formatNumber(TCB.rendimiento.inclinacion, 2), "º");
    nuevaLinea('Dato', i++, 'mapa_LBL_acimut', formatNumber(TCB.rendimiento.acimut, 2), "º");
    nuevaLinea('Dato', i++, 'resultados_LBL_system_loss', formatNumber(TCB.rendimiento.system_loss, 2), "%");
    nuevaLinea('Dato', i++, 'resultados_LBL_technology', TCB.rendimiento.technology, ""); */

  var i = 1;
  nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
  nuevaLinea('Titulo',i++, null, 'informe_LBL_datosDeConsumo');
/*     if (document.getElementById('desdeFichero').checked) {
    nuevaLinea('Normal', i++, null, i18next.t('informe_LBL_fichero') + TCB.consumo.csvFile.name);
  } else { // es una carga de perfil REE
    nuevaLinea('Normal', i++, null, i18next.t('proyecto_LBL_perfilREE') + " " + TCB.tarifaActiva + 
                                    i18next.t('informe_LBL_paraPotenciaAnual') + TCB.consumo.consumoBase + " kWh");
  } */
  nuevaLinea('Dato', i++, 'informe_LBL_localizacion', TCB.territorio,"");
  nuevaLinea('Dato', i++, 'informe_LBL_numeroRegistros', formatNumber(TCB.consumo.numeroRegistros, 0), "");
  nuevaLinea('Dato', i++, 'informe_LBL_desde', TCB.consumo.fechaInicio.toLocaleDateString(), "");
  nuevaLinea('Dato', i++, 'informe_LBL_hasta', TCB.consumo.fechaFin.toLocaleDateString(), "");

  nuevaLinea('Dato', i++, 'resultados_LBL_maximoHora', formatNumber(TCB.consumo.maximoAnual, 2), "kWh");
  nuevaLinea('Dato', i++, 'resultados_LBL_consumoPFVdiaria', formatNumber(TCB.consumo.totalAnual / TCB.consumo.numeroDias, 2), "kWh");
  nuevaLinea('Dato', i++, 'resultados_LBL_consumoPFVmensual', formatNumber(TCB.consumo.totalAnual / 12, 2),  "kWh");
  nuevaLinea('Dato', i++, 'resultados_LBL_consumoPFVanual', formatNumber(TCB.consumo.totalAnual, 2), "kWh");
   
/*     var nImage;
    await Plotly.toImage('graf_resumenConsumo', { format: 'png', width: 800, height: 500 }).then(function (dataURL) {
      nImage = document.createElement("img");
      nImage.src = dataURL;
      nImage.width = 600;
      nImage.height = 400;
      nImage.classList.add('imagen-centrada');
    }); */
    //htdoc.appendChild(nImage);

    i += 2;
    nuevaLinea("Titulo", i++, null, 'informe_LBL_produccionMediaEsperada');
    nuevaLinea('Dato', i++, 'resultados_LBL_produccionMediaDiaria', formatNumber(TCB.produccion.totalAnual / 365, 2) , "kWh");
    nuevaLinea('Dato', i++, 'resultados_LBL_produccionMediaMensual', formatNumber(TCB.produccion.totalAnual / 12, 2) , "kWh");
    nuevaLinea('Dato', i++, 'resultados_LBL_produccionMediaAnual', formatNumber(TCB.produccion.totalAnual, 2) , "kWh");
    nuevaLinea('Dato', i++, 'resultados_LBL_kgCO2AnualAhorradoRenovable', formatNumber(TCB.conversionCO2[TCB.territorio].renovable * TCB.produccion.totalAnual, 2)," kg")
    nuevaLinea('Dato', i++, 'resultados_LBL_kgCO2AnualAhorradoNoRenovable', formatNumber(TCB.conversionCO2[TCB.territorio].norenovable * TCB.produccion.totalAnual, 2)," kg");
    
    await Plotly.toImage('graf_1', { format: 'png', width: 800, height: 500 })
    .then(function (dataURL) {
        doc.addImage({imageData: dataURL, x: 40, y: 150, w:150, h:100})});
    nuevaLinea('Pie', pagina++, true);
    
  
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
    
/*       var nImage;
      await Plotly.toImage('graf_1', { format: 'png', width: 800, height: 500 }).then(function (dataURL) {
        nImage = document.createElement("img");
        nImage.src = dataURL;
        nImage.width = 600;
        nImage.height = 400;
        nImage.classList.add('imagen-centrada');
      });
      htdoc.appendChild(nImage); */


    await Plotly.toImage('graf_2', { format: 'png', width: 800, height: 500 }).then(function (dataURL) {
      doc.addImage({imageData: dataURL, x: 25, y: 100, w:90, h:70})});
    await Plotly.toImage('graf_3', { format: 'png', width: 800, height: 500 }).then(function (dataURL) {
      doc.addImage({imageData: dataURL, x: 110, y: 100, w:90, h:70})});
    nuevaLinea('Pie', pagina++, true);
  
    i = 1;
    nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
    nuevaLinea('Titulo',i++, null, 'informe_LBL_balanceEconomico');
    nuevaLinea('Dato', i++, 'consumo_LBL_tarifa', TCB.tarifaActiva, "");
/*     nuevaLinea('Dato', i++, 'precios_LBL_compensa', formatNumber(TCB.tarifas[TCB.tarifaActiva].precios[0], 2), "€/kWh");
    for (let j=1; j<TCB.tarifas[TCB.tarifaActiva].precios.length; j++) {
      if (TCB.tarifas[TCB.tarifaActiva].precios[j] > 0)
      nuevaLinea('Dato', i++, "P"+j, formatNumber(TCB.tarifas[TCB.tarifaActiva].precios[j], 2), "€/kWh");
    } */
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
    

    await Plotly.toImage('graf_4', { format: 'png', width: 800, height: 500 }).then(function (dataURL) {
      doc.addImage({imageData: dataURL, x: 40, y: 150, w:150, h:100})});
    nuevaLinea('Pie', pagina++, true);

    i = 1;
    nuevaLinea('Cabecera',null, null, 'main_LBL_titulo');
    nuevaLinea('Titulo',i++, null, 'informe_LBL_balanceFinanciero');
  

    var tcolumns= [
      { header: i18next.t('precios_LBL_año'), dataKey: 'ano' },
      { header: i18next.t('precios_LBL_previo'), dataKey: 'previo' },
      { header: i18next.t('precios_LBL_inversion'), dataKey: 'inversion' },
      { header: i18next.t('precios_LBL_ahorro'), dataKey: 'ahorro'},
      { header: i18next.t('precios_LBL_descuentoIBI'), dataKey: 'IBI'},
      { header: i18next.t('precios_LBL_subvencionEU'), dataKey: 'subvencion'},
      { header: i18next.t('precios_LBL_pendiente'), dataKey: 'pendiente'}
    ];
    var trows = TCB.consumo.economico.cashFlow.map( (row) => { var tt = {};
                                                      for (let objProp in row) {tt[objProp] = formatNumber(row[objProp], 2)};
                                                          return tt;
                                                      });
    doc.autoTable({columns: tcolumns, body: trows, margin:{left: 25, top:50}, 
      theme : 'striped', 
      styles: {halign: 'right', textColor: [0, 0, 0], lineColor: [0, 0, 0]},
      headStyles: {halign: 'center', fillColor: [255, 255, 255], lineColor: [0, 0, 0]},
      alternateRowStyles: {fillColor: [229,255,204]}
    });
/*       await Plotly.toImage('graf_5', { format: 'png', width: 800, height: 500 }).then(function (dataURL) {
        doc.addImage({imageData: dataURL, x: 40, y: 100, w:150, h:100})}); */

      
    // Texto de descargo de responsabilidad

    let lines = doc.splitTextToSize(i18next.t("informe_LBL_disclaimer1pdf"), 170);
    doc.text(25,150,lines);
    nuevaLinea('Pie', pagina++, false);
    doc.save('reporte.pdf');

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

    doc.setFontType('normal');
    doc.setFontSize(_font[tipo]);
    var textNode;

    switch (tipo) {
      case "Cabecera":
          doc.text(i18next.t(valor), margenIzquierdo, _hdr, {align: 'center'});
          doc.setFontSize(_font['Normal']);
          doc.text(i18next.t("proyecto_LBL_nombre_proyecto") + TCB.nombreProyecto, margenIzquierdo, _hdr + 7);
        break;
      case "Titulo":

          doc.text(i18next.t(valor), margenIzquierdo, renglon);
          doc.setLineWidth( 1 );
          doc.line(margenIzquierdo, renglon + 1, margenDerecho, renglon  + 1);
        break;
      case "Normal":
          doc.text( valor, margenIzquierdo, renglon);

        break;
      case "Dato":
          doc.setLineWidth( 0.1 );
          if (renglon % 2 == 0) 
            doc.setFillColor(255,255,255);
          else
            doc.setFillColor(229,255,204);
    
          doc.rect(margenIzquierdo, renglon - _delta + 2, margenDerecho - margenIzquierdo, 7, 'DF');
          doc.setFillColor(255,255,255);
          doc.text(i18next.t(propiedad), margenIzquierdo+1, renglon);
          if (unidad === "") {
            doc.text(valor, margenUnidad, renglon, null, null, 'right');
          } else {
            doc.text(valor, margenUnidad, renglon, null, null, 'right');
            doc.text(unidad, margenUnidad+1, renglon);
          }
        break;
      case "Pie":
          doc.setFillColor(0);
          doc.setLineWidth( 1 );
          doc.line(margenIzquierdo, footer, margenDerecho, footer);
          doc.text(hoy.toLocaleDateString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), margenIzquierdo, footer + 7);
          doc.text("Página: " + linea, margenDerecho, footer + 7,  null, null, 'right');
          if (propiedad) doc.addPage();
          break;

    }
  }

  export {generaInformePDF}