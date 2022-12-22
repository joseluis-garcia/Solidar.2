import TCB from "./TCB.js";
/**
 * Es la función llamada desde InicializaAplicacion para cargar y activar la pestaña de consumos
 * 
 */

function inicializaEventos () {
// Evento para registrar el nombre del proyecto activo en TCB
document.getElementById("nombreProyecto").addEventListener("change", async function handleChange(event) {
    TCB.nombreProyecto = event.target.value;
});

}

async function gestionProyecto( accion) {
    let status;
    switch (accion) {
      case "Inicializa":
        status = await inicializaEventos();
        break;
      case "Valida":
        status =  await valida();
        break;
      case "Prepara":
        status = prepara();
        break;
    }
    return status;
  }


function export2txt(originalData) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(originalData, null, 2)], {
      type: "text/plain"
    }));
    a.setAttribute("download", "data.txt");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  export {gestionProyecto}