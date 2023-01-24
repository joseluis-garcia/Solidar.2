import * as UTIL from "./Utiles.js";
import Rendimiento from "./Rendimiento.js";
import Base from "./Base.js";

/**
 * Clase para definir las bases solares en las que se instalarán las fuentes de producción
 */
export default class BaseSolar extends Base {
/**
 * 
 * @param {Object area} area Descripción del area donde se instalará los paneles
 */

  constructor( area ) {
    super (area);
    super.tipo = "Solar";
    super.nombre = area.nombre;
    this.area = area.area;         //El area en el mapa
    this.areaReal = area.areaReal; //El area corregida por la inclinaciond e l tejado
    this.lonlat = area.lonlat;
    this.potenciaMaxima = parseFloat(area.potenciaMaxima);
    this.rendimientoCreado = false;
    this.requierePVGIS = true; //Flag para controlar si es necesario llamar a PVGIS o no despues de cambios
    this.inclinacionOptima = area.inclinacionOptima;
    this.inclinacionPaneles = area.inclinacionPaneles;
    this.inclinacionTejado = area.inclinacionTejado;
    this.angulosOptimos = area.angulosOptimos;
    this.inAcimut = area.inAcimut;

    this.rendimiento = "";
    this.instalacion = "";
    this.produccion = "";

    UTIL.debugLog("Nuueva base solar "+area.nombre+" creada");
    
  }

  async cargaRendimiento() {
    if (this.rendimientoCreado) {
      delete this.rendimiento;
      this.rendimientoCreado = false;
    }
    this.rendimiento = new Rendimiento( this);
  }

}