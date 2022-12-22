import TCB from "./TCB.js";

export default class Instalacion {

  #precioFinal;

  constructor( paneles, potenciaUnitaria) {
    this.potenciaUnitaria = potenciaUnitaria;
    this.paneles = paneles;

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
