
import {optimizador} from "./optimizador.js";
import TCB from "./TCB.js";
import Produccion from "./Produccion.js";
import Balance from "./Balance.js";
import {formatoValor, muestraAtributos, muestra} from "./Utiles.js";

function gestionResultados( accion) {
    let status;
    switch (accion) {
    case "Inicializa":
        status = inicializaEventos();
        break;
    case "Valida":
        status = valida();
        break;
    case "Prepara":
        status = prepara();
        break;
    }
    return status;
  }

function inicializaEventos() {

}

function valida() {
    return true;
}

function prepara() {
    optimizador (TCB.bases, TCB.consumo,  TCB.parametros.potenciaPanelInicio);

// Esta funcon genera un objeto produccion a partir de la produccion de cada una de las bases

    TCB.bases.forEach( (base) => {
    if (base.produccionCreada) {
      delete base.produccion;
      base.produccionCreada = false;
    }
    base.produccion = new Produccion( base);
    });

    if (TCB.produccion.produccionCreada) {
        delete TCB.produccion.produccion;
        TCB.produccion.produccionCreada = false;
    }
    TCB.produccion = new Produccion();
    TCB.produccion.produccionCreada = true;



  // Función de construccion objeto Balance -------------------------------------------------------------------------------

    if (TCB.balanceCreado) {
      delete TCB.balance;
      TCB.balanceCreado = false;
    }
    TCB.balance = new Balance(TCB.produccion, TCB.consumo);
    TCB.balanceCreado = true;

    if (TCB.balanceCreado) muestraBalanceEnergia();
    return true;
}

function muestraBalanceEnergia() {
    // Muestra la tabla de bases al inicio del balance de energía
    tablaBases ( "tablaBases");

    // Mostramos todos los campos
    muestra("objetivoHora", "", formatoValor('energia', TCB.consumo.maximoAnual));
    muestra("PFVDiaria", "", formatoValor('energia', TCB.consumo.totalAnual / TCB.consumo.numeroDias));
    muestra("PFVMensual", "", formatoValor('energia', TCB.consumo.totalAnual / 12));
    muestra("PFVAnual", "", formatoValor('energia', TCB.consumo.totalAnual));
    muestra("potenciaDisponible", "",  formatoValor('potencia', TCB.produccion.potenciaTotal));
    muestra("produccionMediaDiaria", "", formatoValor('energia', TCB.produccion.totalAnual / 365));
    muestra("produccionMediaMensual", "", formatoValor('energia', TCB.produccion.totalAnual / 12));
    muestra("produccionMediaAnual", "",formatoValor('energia', TCB.produccion.totalAnual));
    muestra("energiaSobrante", "",formatoValor('energia', TCB.balance.excedenteAnual));
    muestra("energiaSobrante%Produccion", "",formatoValor('porciento', TCB.balance.excedenteAnual / TCB.produccion.totalAnual * 100));
    muestra("energiaFaltante", "", formatoValor('energia', TCB.balance.deficitAnual)); 
    muestra("energiaFaltante%Consumo", "", formatoValor('porciento', TCB.balance.deficitAnual / TCB.consumo.totalAnual * 100));
    muestra("fuente", "Datos de conversion para ",[TCB.territorio],"");
    muestra("CO2AnualRenovable", "",formatoValor('peso',TCB.conversionCO2[TCB.territorio].renovable * TCB.produccion.totalAnual));
    muestra("CO2AnualNoRenovable", "",formatoValor('peso',TCB.conversionCO2[TCB.territorio].norenovable * TCB.produccion.totalAnual));
    muestra("porcientoEnergiaAhorradaGenerada", "",formatoValor('porciento',TCB.consumo.totalAnual / TCB.produccion.totalAnual * 100));
    muestra("porcientoEnergiaAhorrada", "",formatoValor('porciento',TCB.produccion.totalAnual / TCB.consumo.totalAnual * 100));
    if (TCB.consumo.totalAnual / TCB.produccion.totalAnual < 0.8) {
      document.getElementById("porcientoEnergiaAhorradaGenerada").style.color = 'red';
    } else {
      document.getElementById("porcientoEnergiaAhorradaGenerada").style.color = 'black';
    }
    
    let p_autoconsumo = (TCB.balance.autoconsumo / TCB.produccion.totalAnual) * 100;
    let p_autosuficiencia = (TCB.balance.autoconsumo / TCB.consumo.totalAnual) * 100;
    let autoConsumo =  formatoValor('energia', TCB.balance.autoconsumo) + "->" + formatoValor("porciento", p_autoconsumo);
    muestra("porcientoAutoconsumo", autoConsumo, "");
    muestra("porcientoAutosuficiencia", "", formatoValor('porciento',p_autosuficiencia));
    muestra("autosuficienciaMaxima", "",formatoValor('porciento', p_autosuficiencia + 100 - p_autoconsumo));
  
    TCB.graficos.resumen_3D("graf_resumen");
    TCB.graficos.consumos_y_generacion("graf_1");
    TCB.graficos.balanceEnergia("graf_2", "graf_3");
}

function tablaBases ( tablaDonde) {

    let tabla = document.getElementById(tablaDonde);
    var rowCount = tabla.rows.length;
      var rowCount = document.getElementById(tablaDonde).rows.length;
      if (rowCount > 1) {
        for (let i = 1; i < rowCount; i++) tabla.deleteRow(1);
      }
      
      var row;
      var cell;
      for (let i=0; i<TCB.bases.length; i++) {
          row = tabla.insertRow(-1);
          let id = TCB.bases[i].id;
          // Columna ID
          cell = row.insertCell();
          cell.innerHTML = id;
          // Nombre
          cell = row.insertCell();
          cell.innerHTML = TCB.bases[i].nombre;
  
          // Rendimiento Unitario
          cell = row.insertCell();
          //cell.innerHTML = '<label class="text-end" id="H'+id+'">' + formatNumber(TCB.bases[i].rendimiento.unitarioTotal, 2) + '</label>';
          cell.innerHTML = '<label class="text-end" id="H'+id+'">' + formatoValor('unitarioTotal', (TCB.bases[i].rendimiento.unitarioTotal)) + '</label>';
          // Potencia disponible en base al area real
          cell = row.insertCell();
          //cell.innerHTML = '<label id="P'+id+'">' + formatNumber(TCB.bases[i].potenciaMaxima, 2) + '</label>';
          cell.innerHTML = '<label id="P'+id+'">' + formatoValor('potenciaMaxima', TCB.bases[i].potenciaMaxima) + '</label>';
          // Paneles
          cell = row.insertCell();
          cell.innerHTML = '<input type="number" class="text-end" style="width: 100px;" value="' + 
              formatoValor('paneles', TCB.bases[i].instalacion.paneles) + '" id="J'+id+'">';
          cell.addEventListener('change', (evt) => { nuevaInstalacion(evt)});  //Evento para gestionar el cambio de paneles
          // Potencia unitaria
          cell = row.insertCell();
          cell.innerHTML = '<input type="number" class="text-end" style="width: 100px;" value="' + 
              TCB.bases[i].instalacion.potenciaUnitaria + '" id="G'+id+'">';
          cell.addEventListener('change', (evt) => { nuevaInstalacion(evt)}); //Evento para gestionar el cambio de potencia unitaria de los paneles
          // Potencia total
          cell = row.insertCell();
          cell.innerHTML = '<label id="S'+id+'">' + formatoValor('potenciaTotal',TCB.bases[i].instalacion.potenciaTotal) + '</label>';

          // Energia anual producida
          cell = row.insertCell();
          cell.innerHTML = '<label id="T'+id+'">' + formatoValor('energia', 
                TCB.bases[i].rendimiento.unitarioTotal * TCB.bases[i].instalacion.potenciaTotal) + '</label>';
  
          // Boton de información detallada
          cell = row.insertCell();
          cell.innerHTML = `<button class="btn btn-default tDyn pull-right" type="button"
                            data-bs-toggle="tooltip" data-bs-placement="top" name="mapa_TT_borraBase"><span class="fa fa-info-circle"></span>`
          cell.addEventListener('click', (evt) => {muestraAtributos('base', id, evt)});  
      }
  }
  // Evento para gestionar el cambio de paneles o potenciaUnitaria en la tabla de bases
  function nuevaInstalacion (evento) {
      let tmpPotenciaUnitaria;
      let tmpPaneles;
      let filaActiva = evento.target.parentNode.parentNode;
      let featID = filaActiva.cells[0].outerText;

      let baseActiva = TCB.bases.find( e => e.id === featID);
      if (evento.target.id[0] === 'J') { //Cambio paneles
          tmpPaneles = evento.target.value;
          tmpPotenciaUnitaria = baseActiva.instalacion.potenciaUnitaria;
      } else {
          tmpPaneles = baseActiva.instalacion.paneles;
          tmpPotenciaUnitaria = evento.target.value;
      }
      if ((tmpPaneles * tmpPotenciaUnitaria) > baseActiva.potenciaMaxima) {
          alert (i18next.t('resultados_MSG_excesoPotencia'));
          document.getElementById("J"+featID).value = baseActiva.instalacion.paneles;
          document.getElementById("G"+featID).value = baseActiva.instalacion.potenciaUnitaria;
      } else {
          baseActiva.instalacion.potenciaUnitaria = tmpPotenciaUnitaria;
          baseActiva.instalacion.paneles = tmpPaneles;
          cambioInstalacion(baseActiva);
          muestraBalanceEnergia();
/*           document.getElementById("J"+featID).value = baseActiva.instalacion.paneles;
          document.getElementById("G"+featID).value = baseActiva.instalacion.potenciaUnitaria; */
      }
  }

  async function cambioInstalacion(base) {

    if (base.produccionCreada) {
      delete base.produccion;
      base.produccionCreada = false;
    }
  
    // creando nueva produccion
    base.produccion = new Produccion(base);
    base.produccionCreada = true;
    if (TCB.balanceCreado) {
      delete TCB.balance;
      TCB.balanceCreado = false;
    }
    TCB.produccion = new Produccion(); // despues de cambiar la produccion de una base se debe recalcular la produccion del conjunto
    TCB.balance = new Balance(TCB.produccion, TCB.consumo);
    TCB.balanceCreado = true;
    return true;
  }

export {gestionResultados}