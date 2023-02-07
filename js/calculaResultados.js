import TCB from "./TCB.js";
import Produccion from "./Produccion.js";
import Balance from "./Balance.js";
import Economico from "./Economico.js";

/**
 * Esta funcion realiza los calculos del balance de energia para la configuracion de bases y consumos existentes
 */
function calculaResultados () {

    // Se genera un objeto produccion para cada una de las bases
    TCB.bases.forEach( (base) => {
        if (base.produccionCreada) {
            base.produccion = {};
            base.produccionCreada = false;
        }
        base.produccion = new Produccion( base);
    });

    // Se genera un unico objeto produccion que totaliza la produccion de todas las bases
    if (TCB.produccion.produccionCreada) {
        TCB.produccion.produccion = {};
        TCB.produccion.produccionCreada = false;
    }
    TCB.produccion = new Produccion();
    TCB.produccion.produccionCreada = true;

    // Construccion objeto Balance global
    if (TCB.balanceCreado) {
        TCB.balance = {};
        TCB.balanceCreado = false;
    }
    TCB.balance = new Balance(TCB.produccion, TCB.consumo);
    TCB.balanceCreado = true;

    // Se crea el balance economico para cada uno de los consumos
    TCB.consumos.forEach ((consumo) => {
        if (consumo.economicoCreado) {
            consumo.economico = {};
            consumo.economicoCreado = false;
        }
        consumo.economico = new Economico(consumo);
        consumo.economicoCreado = true;
    })
    return;

}

export {calculaResultados}







