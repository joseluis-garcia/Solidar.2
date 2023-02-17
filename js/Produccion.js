import * as UTIL from "./Utiles.js";
import TCB from "./TCB.js";

// Crea el objeto produccion como agregación de la produccion de las bases existentes
export default class Produccion {
/**
 * Si base es undefined se creará un objeto produccion resultante de la suma de la produccion de todas las bases
 * en caso contrario se crea el objeto produccion con los datos que vienen en el objeto base
 * @param {Object} base 
 */
  constructor( base) {

    this.potenciaTotal = 0;
    this.precioInstalacion = 0;
    this.precioInstalacionCorregido = 0;
    this.idxTable = Array(365);

    // Inicializa la tabla indice de acceso
    for (let i = 0; i < 365; i++) {
      this.idxTable[i] = { dia: i, mes: 0, suma: 0, maximo: 0 };
    }
    this.diaHora = Array.from(Array(365), () => new Array(24).fill(0));

    this.maximoAnual = 0;
    this.totalAnual = 0;

    if (base !== undefined) {
      for (let idxDia = 0; idxDia < 365; idxDia++) {
        for (let hora = 0; hora < 23; hora++) {
          this.diaHora[idxDia][hora] += (base.rendimiento.diaHora[idxDia][hora] * base.instalacion.potenciaTotal) / 1000;
        }
      }
      this.potenciaTotal = base.instalacion.potenciaTotal;
      this.precioInstalacion = base.instalacion.precioInstalacion;
      this.precioInstalacionCorregido = base.instalacion.precioInstalacionCorregido;
      
      for (let idxDia = 0; idxDia < 365; idxDia++) {
        let tmp = UTIL.fechaDesdeIndice(idxDia);
        this.idxTable[idxDia].dia = tmp[0];
        this.idxTable[idxDia].mes = tmp[1];
        this.idxTable[idxDia].suma = UTIL.suma(this.diaHora[idxDia]);
        this.idxTable[idxDia].maximo = Math.max(...this.diaHora[idxDia]);
      }
      this.sintesis(base);

    } else { // Es la construccion de la produccion que sintetiza la produccion de todas las bases
      for (let i=0; i<TCB.bases.length; i++) {
        for (let dia=0; dia<365; dia++) {
          for (let hora=0; hora<24; hora++) {
            this.diaHora[dia][hora] += TCB.bases[i].produccion.diaHora[dia][hora];
          }
          this.idxTable[dia].dia = TCB.bases[i].produccion.idxTable[dia].dia;
          this.idxTable[dia].mes = TCB.bases[i].produccion.idxTable[dia].mes;
          this.idxTable[dia].suma += TCB.bases[i].produccion.idxTable[dia].suma;
          this.idxTable[dia].maximo += TCB.bases[i].produccion.idxTable[dia].maximo;
        }
        this.potenciaTotal += TCB.bases[i].instalacion.potenciaTotal;
        
        // En el caso de Solidar.2 se asume que toda la instalación se hace junta independientemente de que existan mas de una base
        // En ese caso se asume que el precio de la instalacion será el de la potencia total y no la suma de cada una de las base
        this.precioInstalacion += TCB.bases[i].instalacion.precioInstalacion;
        this.precioInstalacionCorregido += TCB.bases[i].instalacion.precioInstalacionCorregido; 
      }

// El precio de la instalación no lo obtenemos como la suma de los precios de cada base sino como si fuera una unica base con 
// el total de la potencia instalada

      let potenciaBase = this.potenciaTotal;
      let i = TCB.precioInstalacion.precios.findIndex( rango => rango.desde <= potenciaBase && rango.hasta >= potenciaBase);
      this.precioInstalacion = this.potenciaTotal * TCB.precioInstalacion.precios[i].precio * (1 + TCB.parametros.IVAinstalacion / 100);
      //let incremento = (100. + TCB.correccionPrecioInstalacion) / 100.;
      this.precioInstalacionCorregido = this.precioInstalacion * TCB.correccionPrecioInstalacion;

      this.sintesis();
    }
  }

  /* TCB.Produccion sintetiza la produccion de todas las bases y tambien la utilziamos para acumular el precio de todas las instalaciones
  por lo que cuando se actualiza el precio de las instalaciones es necesario recalcularlo */
  
/*   actualizaPrecioInstalacion () {
    this.precioInstalacion = 0;
    this.precioInstalacionCorregido = 0;
    TCB.bases.forEach ((base) => {
      this.precioInstalacion += base.instalacion.precioInstalacion;
      base.produccion.precioInstalacionCorregido = base.instalacion.precioInstalacionCorregido;
      this.precioInstalacionCorregido += base.instalacion.precioInstalacionCorregido;
    })
  } */

  sintesis(base) {
    for (let i = 0; i < 365; i++) {
      if (this.idxTable[i].maximo > this.maximoAnual) {
        this.maximoAnual = this.idxTable[i].maximo;
      }
      this.totalAnual += this.idxTable[i].suma;
    }
    if (base !== undefined) 
      base.produccionCreada = true;
    else
      TCB.produccionCreada = true;
  }
}
