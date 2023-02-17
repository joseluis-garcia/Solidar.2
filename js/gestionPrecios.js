import {formatoValor,  suma, muestra, debugLog} from "./Utiles.js";
import Economico from "./Economico.js";
import {calculaResultados} from "./calculaResultados.js";
import TCB from "./TCB.js";  
import { nuevoTotalPaneles } from "./optimizador.js";

export default function gestionPrecios( accion, datos) {
  debugLog("gestionPrecios: " + accion);
  switch (accion) {
  case "Inicializa":
      inicializaEventos();
      break;
  case "Valida":
      return valida();
  case "Prepara":
      prepara();
      break;
  case "Importa":
      importa(datos);
      break;
  }
}

function inicializaEventos() {

    // ---> Eventos de la pestaña balance economico
    // Evento para gestionar la modificacion del precio de instalación
    document.getElementById("correccionCoste").addEventListener("change", (e) => modificaPrecioInstalacion( e));


    function modificaPrecioInstalacion(evento) {

      TCB.correccionPrecioInstalacion = 1 + parseFloat(evento.target.value) / 100;

      TCB.bases.forEach( (base) => {
        base.produccion.precioInstalacionCorregido = base.produccion.precioInstalacion * TCB.correccionPrecioInstalacion;
      });
      TCB.produccion.precioInstalacionCorregido = TCB.produccion.precioInstalacion * TCB.correccionPrecioInstalacion;
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

function importa (datosImportar) {

  document.getElementById("duracionSubvencionIBI").value =  datosImportar.consumos[0].tiempoSubvencionIBI;
  document.getElementById("valorIBI").value = datosImportar.consumos[0].valorSubvencionIBI;
  document.getElementById("porcientoSubvencionIBI").value = datosImportar.consumos[0].porcientoSubvencionIBI * 100;
  document.getElementById("subvencionEU").value = datosImportar.consumos[0].tipoSubvencionEU;
  TCB.precioInstalacion = datosImportar.precioInstalacion;
  TCB.correccionPrecioInstalacion = datosImportar.correccionPrecioInstalacion;
  document.getElementById("correccionCoste").value = ((TCB.correccionPrecioInstalacion - 1) * 100).toFixed(2);
}

function valida() {
    return true;
}

async function prepara() {

    // Teniendo en cuenta que puede haber muchos consumos y cada uno con su tarifa, debemos mantener un economico para cada consumo
    // Por ahora solo gestionamos el TCB.consumo que es igual a TCB.consumos[0].
    //TCB.consumo.economico = new Economico( );
    TCB.consumo.economico = TCB.consumos[0].economico;
   
    muestraDatosEconomicos();
    await muestraBalanceFinanciero();
    await muestraGraficosEconomicos();

    return true;
    
}

function muestraDatosEconomicos() {
  muestra("gastoAnualSinPlacas", "", formatoValor('dinero', TCB.consumo.economico.consumoOriginalAnual));
  muestra("gastoAnualConPlacas", "", formatoValor('dinero', TCB.consumo.economico.consumoConPlacasAnual));
  muestra("ahorroAnual", "", formatoValor('dinero', TCB.consumo.economico.ahorroAnual));
  muestra("costeInstalacion","",formatoValor('dinero', TCB.produccion.precioInstalacion));
  muestra("costeCorregido", "", formatoValor('dinero', TCB.produccion.precioInstalacionCorregido));
  muestra("noCompensado", "", formatoValor('dinero', suma(TCB.consumo.economico.perdidaMes)));
  muestra("ahorroAnualPorCiento", "",formatoValor('porciento',((TCB.consumo.economico.consumoOriginalAnual - TCB.consumo.economico.consumoConPlacasAnual) / TCB.consumo.economico.consumoOriginalAnual * 100)));
  return;
}

async function muestraGraficosEconomicos() {
  await graficoAlternativas();
  TCB.graficos.balanceEconomico("graf_4");
  return;
}
/**
 * Esta funcion produce el grafico de alternativas para lo que debe realziar todos los calculos para un numero 
 * determinado de alternativas que se definen dependiendo del numero maximo de paneles que soportan las bases definidas
 */
async function graficoAlternativas() {

  var numeroPanelesOriginal = TCB.totalPaneles;
  var intentos = [0.25, 0.5, 1, 1.5, 2];
  var paneles = [];
  var autoconsumo = [];
  var TIR = [];
  var autosuficiencia = [];
  var precioInstalacion = [];
  var consvsprod = [];
  var ahorroAnual = [];

  // Calcula el numero maximo de paneles que soportan todas la bases
  let numeroMaximoPaneles = 0;
  TCB.bases.forEach ( (base) => { numeroMaximoPaneles +=  Math.trunc(base.potenciaMaxima / base.instalacion.potenciaUnitaria)});

  // El maximo numero de paneles a graficar es el doble de lo propuesto o el maximo numero de paneles

  let maximoPanelesEnX = numeroMaximoPaneles > (2 * TCB.totalPaneles) ? (2 * TCB.totalPaneles) : numeroMaximoPaneles;
  var intentos = [1, 0.25*maximoPanelesEnX, 0.5*maximoPanelesEnX,  0.75*maximoPanelesEnX, maximoPanelesEnX]; //, TCB.totalPaneles];
  intentos.sort((a, b) => a - b);

  // Bucle del calculo de resultados para cada alternativa propuesta
  intentos.forEach((intento) => {
    if (intento >= 1) {

      // Establecemos la configuracion de bases para este numero de paneles
      nuevoTotalPaneles (intento);

      // Se realizan todos los calculos
      calculaResultados();

      // Se extraen los valores de las variavbles que forman parte del grafico
      paneles.push(intento);
      autoconsumo.push((TCB.balance.autoconsumo / TCB.produccion.totalAnual) * 100);
      autosuficiencia.push((TCB.balance.autoconsumo / TCB.consumo.totalAnual) * 100);
      consvsprod.push((TCB.consumo.totalAnual/TCB.produccion.totalAnual) * 100);
      TIR.push(TCB.consumo.economico.TIRProyecto);
      precioInstalacion.push(TCB.produccion.precioInstalacionCorregido);
      ahorroAnual.push(TCB.consumo.economico.ahorroAnual);

    }
  });

  //Dejamos las cosas como estaban al principio antes del loop
  nuevoTotalPaneles (numeroPanelesOriginal);
  calculaResultados();

  //Buscamos punto en el que la produccion represente el 80% del consumo anual total para definir el limite subvencion EU
  let i = 0;
  while (consvsprod[i] > 80) i++;
  let pendiente = (consvsprod[i] - consvsprod[i-1]) / (paneles[i] - paneles[i-1]);
  let dif = 80 - consvsprod[i-1];
  let limiteSubvencion = paneles[i-1] + dif / pendiente;

  // Producimos el grafico
  TCB.graficos.plotAlternativas(
    "graf_5",
    TCB.bases[0].instalacion.potenciaUnitaria,
    paneles,
    TIR,
    autoconsumo,
    autosuficiencia,
    precioInstalacion,
    ahorroAnual,
    limiteSubvencion
  );
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

  }

export {gestionPrecios}