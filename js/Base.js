import Produccion from "./Produccion.js";
import Rendimiento from "./Rendimiento.js";
import TCB from "./TCB.js";
/**
 * Clase para definir las bases en las que se instalarán las fuentes de producción
 */
export default class Base {
/**
 * 
 * @param {Object area} area Descripción del area donde se instalará la fuente
 */
  constructor( area ) {
    this.id = area.id;
    this.nombre = area.nombre;
    this.tipo = area.tipo;

  }
}