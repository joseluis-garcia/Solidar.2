import TCB from "./TCB.js";  
import * as UTIL from "./Utiles.js"
  
  //Botones del formulario de parametros para descargar matrices de los objetos de la aplicación
  //Estas funciones permiten descargar las tablas de la aplicación para verificacion o debug
  function inicializaEventosParametros() {

/* Las funciones de dump de datos de produccion y rendimiento se deben redefinir al existir multiples bases
  document.getElementById("dumpConsumo").addEventListener("click", function handleChange(event) { 
    if (TCB.consumoCreado) dumpData("consumos.csv",TCB.consumo.idxTable, TCB.consumo.diaHora)});
  document.getElementById("dumpProduccion").addEventListener("click", function handleChange(event) { 
    if (TCB.produccionCreada) dumpData("produccion.csv", TCB.produccion.idxTable, TCB.produccion.diaHora)});
  document.getElementById("dumpRendimiento").addEventListener("click", function handleChange(event) { 
    if (TCB.rendimientoCreado) dumpData("rendimiento.csv", TCB.rendimiento.idxTable, TCB.rendimiento.diaHora)});
  document.getElementById("dumpBalance").addEventListener("click", function handleChange(event) { 
    if (TCB.balanceCreado) dumpData("balance.csv", TCB.balance.idxTable, TCB.balance.diaHora)});
  document.getElementById("dumpPrecioOriginal").addEventListener("click", function handleChange(event) { 
    if (TCB.economicoCreado) dumpData("precioSinPaneles.csv", TCB.economico.idxTable, TCB.economico.diaHoraPrecioOriginal)});
  document.getElementById("dumpPrecioConPaneles").addEventListener("click", function handleChange(event) { 
      if (TCB.economicoCreado) dumpData("precioConPaneles.csv", TCB.economico.idxTable, TCB.economico.diaHoraPrecioConPaneles)});
 */
  // lectura del fichero de tarifas del servidor. Si falla se usan las de la TCB
  const ficheroTarifa = "./datos/tarifas.json";
  UTIL.debugLog("Tarifas leidas desde servidor:" + ficheroTarifa);
  try {
    const respuesta = fetch(ficheroTarifa);
    if (respuesta.status === 200) {
      TCB.tarifas = respuesta.json();
    }
  } catch (err) {
    UTIL.debugLog("Error leyendo tarifas del servidor " + err.message + "<br>Seguimos con TCB");
  }

  // Inicializa evento fichero tarifas en el formulario de parametros
  document.getElementById('tarifaFile').addEventListener("change", async function handleChange(event) {
    if (this.files.length == 1) {
      let reader = new FileReader();
      reader.onload = (e) => {
        try {
          TCB.tarifas = JSON.parse(e.target.result);
        } catch (err) {
          alert(i18next.t("precios_MSG_errorLecturaFicheroTarifas") + "\nParser.error: " + err);
        }
      }
      reader.onerror = (err) => {
        alert(i18next.t("precios_MSG_errorLecturaFicheroTarifas") + "\nReader.error: " + reader.error);
        reject("...error de lectura");
      }
      
      reader.readAsText(this.files[0]);
    }
  });
  }

  export default function gestionParametros() {

    inicializaEventosParametros();
    // Los parametros estan definidos en el objeto TCB.parametros

  // Este modulo asigna los valores por defecto inicializados en TCB y asigna eventlisteners para cambiar la TCB en funcion de lo
  // entrado por el usuario en el formulario de parametros
  for (let param in TCB.parametros) {
    let campo = document.getElementById(param);
    campo.value = TCB.parametros[param];
    campo.addEventListener("change", function handleChange(event) { 
      TCB.parametros[event.target.id] = event.target.value == "" ? 0 : event.target.value;
    });
  }
}

export {gestionParametros}