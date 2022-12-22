import {formatoValor,  suma, muestra} from "./Utiles.js";
import Economico from "./Economico.js";
import TCB from "./TCB.js";  

export default function gestionPrecios( accion) {
    switch (accion) {
    case "Inicializa":
        inicializaEventos();
        break;
    case "Valida":
        return valida();
    case "Prepara":
        prepara();
        break;
    }
  }

function inicializaEventos() {

     // Estos eventos se iran al gestionXXX
    // ---> Eventos de la pestaña balance economico
    // Evento para gestionar la modificacion del precio de instalación
    document.getElementById("correccionCoste").addEventListener("change", (e) => modificaPrecioInstalacion( e));


    function modificaPrecioInstalacion(evento) {
      TCB.correccionPrecioInstalacion = parseFloat(evento.target.value);
      TCB.produccion.precioInstalacionCorregido = 0;
/*       TCB.bases.forEach( (base) => {
        console.log(base.instalacion.precioInstalacionCorregido);
        TCB.produccion.precioInstalacionCorregido += base.instalacion.precioInstalacionCorregido;
      }) */
      TCB.produccion.actualizaPrecioInstalacion();
    muestra("costeCorregido", "", formatoValor("dinero", TCB.produccion.precioInstalacionCorregido));
    TCB.consumo.economico.calculoFinanciero();
    muestraBalanceFinanciero();
    }


    // Evento para cargar la subvención EU DOMid: "subvencionEU"
    // La subvención EU solo se puede aplicar cuando el autoconsumo es superior al 80%
    const subvencion = document.getElementById("subvencionEU");
    subvencion.addEventListener("change", function handleChange(event) {
        TCB.consumo.economico.calculoFinanciero();
        muestraBalanceFinanciero();
    });
  
    // Evento para gestionar la subvención del IBI
    document.getElementById("valorIBI").addEventListener("change", chkIBI);
    document.getElementById("porcientoSubvencionIBI").addEventListener("change", chkIBI);
    document.getElementById("duracionSubvencionIBI").addEventListener("change", chkIBI);

    function chkIBI() {
        let valor = document.getElementById("valorIBI").value;
        let porcientoSubvencionIBI = document.getElementById("valorIBI").value;
        let duracionSubvencionIBI = document.getElementById("valorIBI").value;
        if (valor !== 0 && porcientoSubvencionIBI !== 0 && duracionSubvencionIBI !== 0) {
            TCB.consumo.economico.calculoFinanciero();
            muestraBalanceFinanciero();
        }
    }

}

function valida() {
    return true;
}

async function prepara() {

    TCB.consumos.forEach ((consumo) => {
        if (consumo.economicoCreado) {
            delete consumo.economico;
            consumo.economicoCreado = false;
        }
        consumo.economico = new Economico(consumo);
        consumo.economicoCreado = true;
    })
    // Teniendo en cuenta que puede haber muchos consumos y cada uno con su tarifa, debemos mantener un economico para cada consumo
    // Por ahora solo gestionamos el TCB.consumo que es igual a TCB.consumos[0].
    //TCB.consumo.economico = new Economico( );
    TCB.consumo.economico = TCB.consumos[0].economico;
    
    muestra("gastoAnualSinPlacas", "", formatoValor('dinero', TCB.consumo.economico.consumoOriginalAnual));
    muestra("gastoAnualConPlacas", "", formatoValor('dinero', TCB.consumo.economico.consumoConPlacasAnual));
    muestra("ahorroAnual", "", formatoValor('dinero', TCB.consumo.economico.ahorroAnual));
    muestra("costeInstalacion","",formatoValor('dinero', TCB.produccion.precioInstalacion));
    muestra("costeCorregido", "", formatoValor('dinero', TCB.produccion.precioInstalacionCorregido));
    muestra("noCompensado", "", formatoValor('dinero', suma(TCB.consumo.economico.perdidaMes)));
    muestra("ahorroAnualPorCiento", "",formatoValor('porciento',((TCB.consumo.economico.consumoOriginalAnual - TCB.consumo.economico.consumoConPlacasAnual) / TCB.consumo.economico.consumoOriginalAnual * 100)));

    await muestraBalanceFinanciero();
    TCB.graficos.balanceEconomico("graf_4");
    return true;
    
}

async function muestraBalanceFinanciero() {

    var table = document.getElementById("financiero");
  
    var rowCount = table.rows.length;
    if (rowCount > 1) {
      for (let i = 1; i < rowCount; i++) {
        table.deleteRow(1);
      }
    }
  
    for (let i = 0; i < TCB.consumo.economico.cashFlow.length; i++) {
      var row = table.insertRow(i + 1);
  
      var cell = row.insertCell(0);
      cell.innerHTML = TCB.consumo.economico.cashFlow[i].ano;
  
      var cell = row.insertCell(1);
      if (TCB.consumo.economico.cashFlow[i].previo < 0) cell.classList.add("text-danger");
      cell.innerHTML = formatoValor("dinero", TCB.consumo.economico.cashFlow[i].previo);
  
      var cell = row.insertCell(2);
      if (TCB.consumo.economico.cashFlow[i].inversion < 0)
        cell.classList.add("text-danger");
      cell.innerHTML = formatoValor("dinero", TCB.consumo.economico.cashFlow[i].inversion);
  
      var cell = row.insertCell(3);
      cell.innerHTML = formatoValor("dinero", TCB.consumo.economico.cashFlow[i].ahorro);
  
      var cell = row.insertCell(4);
      cell.innerHTML = formatoValor("dinero", TCB.consumo.economico.cashFlow[i].IBI);
  
      var cell = row.insertCell(5);
      cell.innerHTML = formatoValor("dinero", TCB.consumo.economico.cashFlow[i].subvencion);
  
      var cell = row.insertCell(6);
      if (TCB.consumo.economico.cashFlow[i].pendiente < 0) cell.classList.add("text-danger");
      cell.innerHTML = formatoValor("dinero", TCB.consumo.economico.cashFlow[i].pendiente);
    }
  
    muestra("VAN", "", formatoValor("dinero", TCB.consumo.economico.VANProyecto));
    muestra("TIR", "", formatoValor("porciento", TCB.consumo.economico.TIRProyecto));
    //await loopAlternativas();
  }

export {gestionPrecios}