import TCB from "./TCB.js";
/**
 * Class Tarifa
 * Cada consumo tiene una tarifa asignada
 */
export default class Tarifa {
/**
 * 
 * @param {string} nombreTarifa El formato del nombre de la tarifa es X.0TD-R 
 *    nombreTarifa = [ 2.0TD, 3.0TD]
 *    territorio = ['Península', 'Islas Baleares', 'Canarias', 'Melilla', 'Ceuta']                                       
 */
  constructor(nombreTarifa, territorio) {
    this.nombreTarifa = nombreTarifa;
    this.territorio = territorio;
    let ctarifa = nombreTarifa === "2.0TD" ? nombreTarifa : nombreTarifa + "-" + territorio;
    this.precios = TCB.tarifas[ctarifa].precios;
    this.horas = TCB.tarifas[ctarifa].horas;
  }

  setTarifa (nombreTarifa, territorio) {
    this.nombreTarifa = nombreTarifa;
    this.territorio = territorio;
    let ctarifa = nombreTarifa === "2.0TD" ? nombreTarifa : nombreTarifa + "-" + territorio;
    this.precios = TCB.tarifas[ctarifa].precios;
    this.horas = TCB.tarifas[ctarifa].horas;
  }
}