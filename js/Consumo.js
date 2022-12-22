import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";
import Tarifa from "./Tarifa.js";

export default class Consumo {

  constructor(puntoConsumo) {
    this.idxTable = Array(365);
    // Inicializa la tabla indice de acceso
    this.diaHora = Array.from(Array(365), () => new Array(24).fill(0));
    for (let i = 0; i < 365; i++) {
      this.idxTable[i] = { previos: 0, dia: i, mes: 0, suma: 0, maximo: 0 };
    }
    this.maximoAnual = 0;
    this.totalAnual = 0;
    if (puntoConsumo !== undefined) { //Viene un puntoConsumo del mapa
      this.id = puntoConsumo.id;
      this.nombre = puntoConsumo.nombre;
      this.lonlat = puntoConsumo.lonlat;
      this.fuente = puntoConsumo.fuente;
      this.potenciaREE = puntoConsumo.potenciaREE;
      this.ficheroCSV = puntoConsumo.ficheroCSV;
      this.nombreTarifa = puntoConsumo.nombreTarifa;
      this.csvCargado = false;

      this.fechaInicio = new Date(1, 1, 1900);
      this.horaInicio = -1;
      this.fechaFin = new Date(1, 1, 1900);
      this.horaFin = -1;

      this.numeroRegistros = 0;
      this.numeroDias = 0;
      UTIL.debugLog("Cargando consumo con tarifa: "+this.nombreTarifa +"-"+TCB.territorio);
      this.tarifa = new Tarifa(this.nombreTarifa, TCB.territorio);

    } else { // Es la construccion del consumo que sintetiza todos los consumos individuales
      let ultimaFechaFin = new Date(1, 1, 1900); 
      for (let i=0; i<TCB.consumos.length; i++) {
        for (let dia=0; dia<365; dia++) {
          for (let hora=0; hora<24; hora++) {
            this.diaHora[dia][hora] += TCB.consumos[i].diaHora[dia][hora];
          }
          this.idxTable[dia].dia = TCB.consumos[i].idxTable[dia].dia;
          this.idxTable[dia].mes = TCB.consumos[i].idxTable[dia].mes;
          this.idxTable[dia].suma += TCB.consumos[i].idxTable[dia].suma;
          this.idxTable[dia].maximo += TCB.consumos[i].idxTable[dia].maximo;
        }
        if (TCB.consumos[i].fechaFin > ultimaFechaFin ) {
          ultimaFechaFin = TCB.consumos[i].fechaFin;
        }
        this.fechaFin = ultimaFechaFin;
        this.fechaInicio = new  Date(1, 1, this.fechaFin.getFullYear());
      }
      this.sintesis();
    }
    this.economico = {};
  } // End constructor

  async loadCSV() {
    var campo;
    var lastLine;
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onerror = () => {
        alert(
          i18next.t("consumo_MSG_errorLecturaFicheroConsumo") +
            "\nReader.error: " + reader.error 
        );
        reject("...error de lectura");
      };

      reader.onload = (e) => {
        const text = e.target.result;
        const data = UTIL.csvToArray(text, ";");

        if (data.length == 0) return false;

        if (data.length < 8760) {
          if ( !window.confirm( i18next.t("consumo_MSG_numeroLimitadoRegistros", {registros: data.length})))
          {
            return false;
          }
        }
        UTIL.debugLog("Consumo procesando " + data.length + " registros del fichero " + this.ficheroCSV.name);
        try {
          var lastFecha = new Date(1970, 1, 1);
          var hora;
          var unDia = { dia: 0, mes: 0, valores: Array(24).fill(0) }; //el mes es 0-11, la hora es 0-23
          var decimalCaracter;
          if (this.fuente === "REE") {
            decimalCaracter = ".";
            campo = this.nombreTarifa; 
          }
          if (this.fuente === "CSV") {
            decimalCaracter = ","; 
            campo = "Consumo"; 
          }

          // Se han detectado ficheros de Naturgy con registros vacios al final del mismo
          // si el campo fecha viene vacio consideramos que hay que ignorar el regsitro
          let vacio = false; 

          for (var i = 0; i < data.length; i++) {
            lastLine = data[i];
            if (data[i]["Fecha"] === "") {
              vacio = true;
              continue;
            }
            //Para gestionar fechas en formato dd/mm/aaaa como vienen en el CSV debamos invertir a aaaa/mm/dd en javascript
            let parts = data[i]["Fecha"].split("/"); //separamos la hora
            let _dia = parts[0];
            let _mes = parts[1] - 1; //_mes es el indice interno gestionado por JS pero es 1-24 en los ficheros de las distribuidoras
            let _ano = parts[2];

            //Hay casos en ficheros CSV que aparece una hora 25 los dias de cambio de horario.
            hora = data[i]["Hora"] - 1; //hora viene 1-24. Se cambia al interno 0-23
            if (hora < 0) hora = 0;
            if (hora >= 23) hora = 23;
            let currFecha = new Date(_ano, _mes, _dia, 0, 0);

            if (_mes == 1 && _dia == 29) continue; //Ignoramos el 29/2 de los años bisiestos
            //Registramos los datos del primer registro
            if (i == 0) {
              this.fechaInicio = currFecha;
              this.horaInicio = hora + 1;
            }

            if (currFecha.getTime() == lastFecha.getTime()) {
              //debemos cambiar la , por el . para obtener el valor
              unDia.valores[hora] =
                parseFloat(data[i][campo].replace(decimalCaracter, ".")) *
                this.potenciaREE;
            } else {
              if (i == 0) {
                unDia = {
                  dia: currFecha.getDate(),
                  mes: currFecha.getMonth(),
                  valores: Array(24).fill(0),
                };
                unDia.valores[hora] =
                  parseFloat(
                    data[i][campo].replace(decimalCaracter, ".")
                  ) * this.potenciaREE;
              } else {
                UTIL.mete(unDia, this.idxTable, this.diaHora);
                unDia = {
                  dia: currFecha.getDate(),
                  mes: currFecha.getMonth(),
                  valores: Array(24).fill(0),
                };
                unDia.valores[hora] =
                  parseFloat(
                    data[i][campo].replace(decimalCaracter, ".")
                  ) * this.potenciaREE;
              }
              lastFecha = currFecha;
              if (isNaN(unDia.valores[hora])) {
                console.log(lastLine);
                throw "Conversión consumo";
              };
            }
          }
          // Si el ultimo registro no vino vacio lo metemos
          if (!vacio) UTIL.mete(unDia, this.idxTable, this.diaHora);
          this.fechaFin = lastFecha;
          this.horaFin = hora;
          this.numeroRegistros = data.length;
          this.sintesis();
          resolve();
        } catch (error) {
          this.numeroRegistros = 0;
          alert ("Error lectura en linea:\n" + JSON.stringify(lastLine) + "\n" + error);
          reject(error);
        }
      };
      reader.readAsText(this.ficheroCSV);
    });
  }

  async actualiza ( propuesta) {

    this.nombre = propuesta.nombre;
    this.ficheroCSV = propuesta.ficheroCSV;
    this.nombreTarifa = propuesta.tarifa;
    this.potenciaREE = propuesta.potenciaREE;
    let requiereLoadCSV = false;
    if (this.fuente !== propuesta.fuente) {
      requiereLoadCSV = true;
    } else {
      if (this.fuente === "REE") {
        if (this.nombreTarifa !== propuesta.nombreTarifa)  requiereLoadCSV = true;
        if (this.potenciaREE !== propuesta.potenciaREE) requiereLoadCSV = true;
      } else if (this.fuente === "CSV") {
        requiereLoadCSV = true;
      }
    }
    if (requiereLoadCSV) {
      this.csvCargado = false;
      await this.loadCSV();
    }
    //hay que ver que diferencias entre this y propuesta requieren hacer que cosas
  }

  sintesis() {
    var maxIDX = 0;
    this.totalAnual = 0;
    this.maximoAnual = -1;
    for (let i = 0; i < 365; i++) {
      if (this.idxTable[i].maximo > this.maximoAnual) {
        this.maximoAnual = this.idxTable[i].maximo;
        maxIDX = i;
      }
      if (this.idxTable[i].previos > 0) this.numeroDias++;
      this.totalAnual += this.idxTable[i].suma;
    }
    this.csvCargado = true;
    UTIL.debugLog("Consumo:", {desde: this.fechaInicio,
      hasta: this.fechaFin,
      maximo: this.maximoAnual.toFixed(2), 
      dia: UTIL.fechaDesdeIndice(maxIDX), 
      total: this.totalAnual.toFixed(2), 
      mensual: (this.totalAnual / 12).toFixed(2),
      diaria:  (this.totalAnual / 365).toFixed(2)});   
  }
}
