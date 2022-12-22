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
  return true;

}
export {gestionGraficos}