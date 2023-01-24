import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";

export default class Economico {
  constructor( consumo) {
    // Mietras no tengamos gestion multiconsumo
    if (consumo === undefined) {
      TCB.consumo.economico = TCB.consumos[0].economico;
      return;
    }
    // Inicializa la tabla indice de acceso
    this.idxTable = Array(365);
    for (let i = 0; i < 365; i++) {
      let tmp = UTIL.fechaDesdeIndice(i);
      this.idxTable[i] = {
        dia: tmp[0],
        mes: tmp[1],
        consumoOriginal: 0,
        consumoConPlacas: 0,
        compensado: 0,
        ahorradoAutoconsumo: 0,
        diaSemana: 0,
      }; //Este array contiene lo pagado por consumo, lo cobrado por compensacion y el balance neto sin tener en cuenta posibles limites
    }

    this.diaHoraPrecioOriginal = Array.from(Array(365), () => new Array(24).fill(0));
    this.diaHoraPrecioConPaneles = Array.from(Array(365), () => new Array(24).fill(0));
    this.diaHoraTarifaOriginal = Array.from(Array(365), () => new Array(24).fill(0));
    this.diaHoraTarifaConPaneles = Array.from(Array(365), () => new Array(24).fill(0));

    this.impuestoTotal = (TCB.parametros.IVAenergia + TCB.parametros.impuestoElectrico) / 100;

    this.consumoOriginalAnual = 0;
    this.consumoConPlacasAnual = 0; 
    this.consumoOriginalMensual = new Array(12);  
    this.consumoConPlacasMensual = new Array(12);
    this.consumoConPlacasMensualCorregido = new Array(12);
    this.compensadoMensual = new Array(12);
    this.compensadoMensualCorregido = new Array(12);
    this.tarifa = consumo.tarifa;
    this.ahorradoAutoconsumoMes = new Array(12);
    this.perdidaMes = new Array(12);
    this.ahorroAnual = 0;
    this.TIRProyecto = 0;
    this.VANProyecto = 0;
    this.interesVAN = TCB.parametros.interesVAN;
    this.reCalculo();
  }

  reCalculo() {
    //Completamos las tabla de tarifas
    for (let dia=0; dia < 365; dia++) {
      this.idxTable[dia].consumoOriginal = 0;
      this.idxTable[dia].consumoConPlacas = 0;
      this.idxTable[dia].ahorradoAutoconsumo = 0;
      this.idxTable[dia].compensado = 0;

      //El dia de calculo a efectos de tarifa es el dia / mes del año del último registro del fichero de consumos
      let diaCalculo = new Date(TCB.consumo.fechaFin.getYear(),this.idxTable[dia].mes,this.idxTable[dia].dia);
      let diaSemana = diaCalculo.getDay();
      this.idxTable[dia].diaSemana = diaSemana;

      for (let hora = 0; hora < 24; hora++) {
        if (this.tarifa.nombreTarifa === "2.0TD") {
          if (diaSemana == 0 || diaSemana == 6) {             //es un fin de semana por lo que tarifa P3 todo el dia
            this.diaHoraTarifaOriginal[dia][hora] = this.tarifa.precios[3];
          } else {
            this.diaHoraTarifaOriginal[dia][hora] = this.tarifa.precios[this.tarifa.horas[hora]];              
          }
        } else {
          if (diaSemana == 0 || diaSemana == 6) {
            this.diaHoraTarifaOriginal[dia][hora] = this.tarifa.precios[6]; //es un fin de semana por lo que tarifa P6 todo el dia
          } else {
            this.diaHoraTarifaOriginal[dia][hora] = this.tarifa.precios[[this.tarifa.horas[this.idxTable[dia].mes][hora]]];
          }
        }

        this.diaHoraPrecioOriginal[dia][hora] = TCB.consumo.diaHora[dia][hora] * this.diaHoraTarifaOriginal[dia][hora] * (1 + this.impuestoTotal);
        // Determinamos el precio de esa hora (la tarifa) segun sea el balance. Si es negativo compensa
        if (TCB.balance.diaHora[dia][hora] < 0) {  
          this.diaHoraTarifaConPaneles[dia][hora] = this.tarifa.precios[0];
          this.idxTable[dia].ahorradoAutoconsumo += TCB.consumo.diaHora[dia][hora] * this.diaHoraTarifaOriginal[dia][hora] * (1 + this.impuestoTotal);
          this.diaHoraPrecioConPaneles[dia][hora] += TCB.balance.diaHora[dia][hora] * this.diaHoraTarifaConPaneles[dia][hora] * (1 + this.impuestoTotal);
          this.idxTable[dia].compensado += this.diaHoraPrecioConPaneles[dia][hora];
        } else {
          this.diaHoraTarifaConPaneles[dia][hora] = this.diaHoraTarifaOriginal[dia][hora];
          this.diaHoraPrecioConPaneles[dia][hora] = TCB.balance.diaHora[dia][hora] * this.diaHoraTarifaConPaneles[dia][hora] * (1 + this.impuestoTotal);
          this.idxTable[dia].ahorradoAutoconsumo += TCB.produccion.diaHora[dia][hora] * this.diaHoraTarifaOriginal[dia][hora] * (1 + this.impuestoTotal);
        }

        this.idxTable[dia].consumoOriginal += this.diaHoraPrecioOriginal[dia][hora];
        this.idxTable[dia].consumoConPlacas += this.diaHoraPrecioConPaneles[dia][hora];
      }
    }

    this.consumoOriginalMensual = UTIL.resumenMensual(this.idxTable, "consumoOriginal" );
    this.consumoConPlacasMensual = UTIL.resumenMensual(this.idxTable, "consumoConPlacas" );
    this.compensadoMensual = UTIL.resumenMensual(this.idxTable, "compensado");
    this.ahorradoAutoconsumoMes = UTIL.resumenMensual(this.idxTable, "ahorradoAutoconsumo");

    for (let i = 0; i < 12; i++) {
      if (this.consumoConPlacasMensual[i] < 0) {
        //Se debe corregir que si la comercializadora limita economicamente la compensacion al consumo
        this.perdidaMes[i] = -this.consumoConPlacasMensual[i];
        this.compensadoMensualCorregido[i] = this.compensadoMensual[i] + this.perdidaMes[i];
        this.consumoConPlacasMensualCorregido[i] = 0;
      } else {
        this.perdidaMes[i] = 0;
        this.compensadoMensualCorregido[i] = this.compensadoMensual[i];
        this.consumoConPlacasMensualCorregido[i] = this.consumoConPlacasMensual[i];
      }
    }
    this.consumoOriginalAnual += UTIL.suma(this.consumoOriginalMensual);
    this.consumoConPlacasAnual += UTIL.suma(this.consumoConPlacasMensualCorregido);

    this.calculoFinanciero();
  }

  calculoFinanciero() {
    const tiempoSubvencionIBI = document.getElementById("duracionSubvencionIBI").value;
    const valorSubvencionIBI = document.getElementById("valorIBI").value;
    const porcientoSubvencionIBI = document.getElementById("porcientoSubvencionIBI").value / 100;

    // Calculo de la subvención EU
    const tipoSubvencionEU = document.getElementById("subvencionEU").value;
    var valorSubvencionEU;
    if ((TCB.consumo.totalAnual / TCB.produccion.totalAnual) * 100 < 80 || tipoSubvencionEU === 'Sin') {
      valorSubvencionEU = 0;
    } else {
      if ( TCB.produccion.potenciaTotal <= 10) {
        valorSubvencionEU = TCB.subvencionEU[tipoSubvencionEU]['<=10kWp'] * TCB.produccion.potenciaTotal;
      } else {
        valorSubvencionEU = TCB.subvencionEU[tipoSubvencionEU]['>10kWp'] * TCB.produccion.potenciaTotal;
      }
    }
    var cuotaPeriodo = [];
    this.cashFlow = [];
    var cuota; 
    this.ahorroAnual = UTIL.suma(this.consumoOriginalMensual) - UTIL.suma(this.consumoConPlacasMensualCorregido);
    var i = 1;
    var unFlow = new Object;
      unFlow = {"ano": i, 
        "ahorro": this.ahorroAnual, 
        "previo":0, 
        "inversion": -TCB.produccion.precioInstalacionCorregido,
        "subvencion": 0,
        "IBI": 0,
        "pendiente": -TCB.produccion.precioInstalacionCorregido + this.ahorroAnual
    }
    cuota = unFlow.inversion + unFlow.ahorro;
    cuotaPeriodo.push(cuota);
    this.cashFlow.push(unFlow);

    // Se genera la tabla hasta alcanzar el retorno de la inversión o la finalización de la subvención de IBI
    while (unFlow.pendiente < 0 || unFlow.IBI > 0) {
      let lastPendiente = unFlow.pendiente;
      unFlow = new Object;
      unFlow.ano = ++i;
      unFlow.ahorro = this.ahorroAnual;
      unFlow.previo = lastPendiente;
      unFlow.inversion = 0;
      if (i == 2) {  //La subvención se cobra con suerte despues de un año
        unFlow.subvencion = valorSubvencionEU;
      } else {
        unFlow.subvencion = 0;
      }

      if ((i-1) <= tiempoSubvencionIBI) {
        unFlow.IBI = valorSubvencionIBI * porcientoSubvencionIBI;
      } else {
        unFlow.IBI = 0;
      }

      cuota = unFlow.ahorro + unFlow.IBI + unFlow.subvencion;
      cuotaPeriodo.push(cuota);
      unFlow.pendiente = unFlow.previo + cuota;
      this.cashFlow.push(unFlow);
    }
    this.VANProyecto = this.VAN(this.interesVAN, cuotaPeriodo);
    this.TIRProyecto = this.TIR(this.interesVAN * 2, cuotaPeriodo);
    this.tiempoSubvencionIBI = tiempoSubvencionIBI;
    this.valorSubvencionIBI = valorSubvencionIBI;
    this.porcientoSubvencionIBI = porcientoSubvencionIBI;
    this.valorSubvencionEU = valorSubvencionEU;
    this.tipoSubvencionEU = tipoSubvencionEU;
  }

  // Calculo de TIR
  TIR(initRate, args) {
    var depth = 20;
    var numberOfTries = 1;

    var positive, negative;
    args.forEach(function (value) {
      if (value > 0) positive = true;
      if (value < 0) negative = true;
    });
    if (!positive || !negative)
      throw new Error("TIR necesita al menos un valor negativo");

    let rate = initRate;
    let delta = 1;
    let flag = false;
    while (numberOfTries < depth) {
      let _van = this.VAN(rate, args);
      if (_van < 0) {
        delta = delta / 2;
        flag = true;
        rate = rate - delta;
        if (rate < 0) {
          alert("rate:" + rate);
          numberOfTries = depth;
        }
      } else {
        flag ? (delta /= 2) : (delta *= 2);
        rate = rate + delta;
      }
      numberOfTries++;
    }
    return rate;
  }

  // Calculo de VAN
  VAN(rate, units) {
    var rate = rate / 100;
    var _npv = units[0];
    for (var i = 1; i < units.length; i++) {
      _npv += units[i] / Math.pow(1 + rate, i);
    }
    return Math.round(_npv * 100) / 100;
  }
}
