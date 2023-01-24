import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";

export default class Instalacion {

  #precioFinal;

  constructor( paneles, potenciaUnitaria) {
    UTIL.debugLog("Nueva instalacion con "+paneles+" paneles de "+potenciaUnitaria+" kWp");
    this.potenciaUnitaria = potenciaUnitaria;
    this.paneles = paneles;
  }

  set precioFinal (precio) {
    this.#precioFinal = precio;
  }

  get potenciaTotal() {
    return this.potenciaUnitaria * this.paneles;
  }

  get precioInstalacion() {

    if (this.potenciaTotal > 0) {
      let potenciaBase = this.potenciaTotal;
      let i = TCB.precioInstalacion.precios.findIndex( rango => rango.desde <= potenciaBase && rango.hasta >= potenciaBase);
      this.#precioFinal = this.potenciaTotal * TCB.precioInstalacion.precios[i].precio * (1 + TCB.parametros.IVAinstalacion / 100);
    } else {
      this.#precioFinal = 0;
    }
    return this.#precioFinal;
  }

  get precioInstalacionCorregido () {
    let incremento = (100. + TCB.correccionPrecioInstalacion) / 100.;
    return this.#precioFinal * incremento;
  }

}
