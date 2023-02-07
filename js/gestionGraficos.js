import TCB from "./TCB.js";

function gestionGraficos( accion) {
    switch (accion) {
      case "Inicializa":
        inicializaEventos();
        break;
      case "Valida":
        return valida();

      case "Prepara":
        return prepara();

    }
  }

function inicializaEventos() {

}

function valida() {
    return true;
}

function prepara() {
  TCB.graficos.consumos_y_generacion("graf_1");
  TCB.graficos.balanceEnergia("graf_2", "graf_3");
  return true;

}
export {gestionGraficos}