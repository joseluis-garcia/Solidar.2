import TCB from "./TCB.js";
/**
 * Class Tarifa
 * Cada consumo tiene una tarifa asignada
 */
export default class Tarifa {
/**
 * 
 * @param {string} nombre El formato del nombre de la tarifa es X.0TD-R 
 *    nombreExterno = [ 2.0TD, 3.0TD]
 *    territorio = ['Peninsula', 'Islas Baleares', 'Canarias', 'Melilla', 'Ceuta']                                       
 */
  constructor(nombre, territorio) {
    this.nombre = nombre;
    this.territorio = territorio;
    let ctarifa = nombre === "2.0TD" ? nombre : nombre + "-" + territorio;
    this.precios = TCB.tarifas[ctarifa].precios;
    this.horas = TCB.tarifas[ctarifa].horas;
  }

  setTarifa (nombre, territorio) {
    this.nombre = nombre;
    this.territorio = territorio;
    let ctarifa = nombre === "2.0TD" ? nombre : nombre + "-" + territorio;
    this.precios = TCB.tarifas[ctarifa].precios;
    this.horas = TCB.tarifas[ctarifa].horas;
  }
}