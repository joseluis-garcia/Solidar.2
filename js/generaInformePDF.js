import TCB from "./TCB.js";
import {suma, obtenerPropiedades, formatoValor, campos} from "./Utiles.js";

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


  function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
  } 
    const propiedades = obtenerPropiedades ( TCB.bases[0], 0);
    var dTabla = createArray(propiedades.length, TCB.bases.length);

    for(let k=0; k<TCB.bases.length; k++) {
      var i = 0;
      const propiedades = obtenerPropiedades ( TCB.bases[k], 0);
      propiedades.forEach ( (p) => {
/*         let oFila = {"nombre":"", "valores":[]};
        dTabla[i] = oFila;  */

        if (p.valor === "Objeto") {
          if (k == 0) {
            dTabla[i][k] = "*"+i18next.t("objeto_"+ p.nombre);
            dTabla[i++][k+1] = "***";
          } else {
            dTabla[i++][k+1] = "***";
          }
        } else if (campos[p.nombre].mostrar) {
          if (k == 0) {
            dTabla[i][k] = i18next.t("propiedad_"+ p.nombre);
            dTabla[i++][k+1] = formatoValor(p.nombre, p.valor);
          } else {
            dTabla[i++][k+1] = formatoValor(p.nombre, p.valor);
          }     
        }
      });
    }
    let dBody = dTabla.slice(0, i);
    console.log(dBody);

doc.autoTable({
  willDrawCell: (data) => {
     if (data.cell.raw === '***') {
      data.cell.text = '';
      doc.setFillColor(110,214,84);
    } else if (data.cell.raw[0] === "*") {
      data.cell.text = data.cell.raw.substring(1);
      doc.setFillColor(110,214,84);
      data.cell.colSpan = TCB.bases.length + 1;
    }
  },
  body: dBody,
  startY: 50,
  styles: {halign: 'right', lineWidth: 1},
  columnStyles: { 0: { halign: 'left'} },
  theme: 'striped',
  alternateRowStyles: {fillColor: [229,255,204]},
})
doc.addPage();


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
          doc.text(i18next.t("proyecto_LBL_nombre_proyecto") + " " + TCB.nombreProyecto, margenIzquierdo, _hdr + 7);
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

  export {generaInformePDF}