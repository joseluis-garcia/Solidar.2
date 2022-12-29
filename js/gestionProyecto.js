import TCB from "./TCB.js";
/**
 * Es la función llamada desde InicializaAplicacion para cargar la informacion de proyecto y el boton de salvar
 * 
 */

function inicializaEventos () {
  // Evento para registrar el nombre del proyecto activo en TCB
  let proyecto = document.getElementById("nombreProyecto");
  TCB.nombreProyecto = "Mi proyecto";
  proyecto.value = TCB.nombreProyecto;
  proyecto.addEventListener("change", async function handleChange(event) {
      TCB.nombreProyecto = event.target.value;
  });
  // Evento para salvar el proyecto
/*   const idioma = document.getElementById("guardar");
  idioma.addEventListener("click", function handleChange(event) {
      salvarProyecto (event);
  }); */
}

async function gestionProyecto( accion) {
  let status;
  switch (accion) {
    case "Inicializa":
      status = inicializaEventos();
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

function prepara() {
  return true;
}

function valida () {
  return true;
}

function salvarProyecto (evento) {

    let proyecto = {'bases':TCB.bases, 'consumos':TCB.consumos, 'parametros':TCB.parametros}
    export2txt (TCB.bases);
}

function export2txt(originalData) {
  console.log(originalData);
  console.log(JSON.stringify(originalData));
  
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(originalData, null, 2)], {
    type: "text/plain"
  }));
  console.log(a);
  a.setAttribute("download", "data.txt");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a); 
}

export {gestionProyecto}