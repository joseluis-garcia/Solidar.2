import TCB from "./TCB.js";
//import { inicializaEventosLocalizacion } from "./gestionLocalizacion.js";
//import { inicializaEventosConsumo } from "./gestionConsumo.js"
import * as UTIL from "./Utiles.js";
import Graficos from "./Graficos.js";
import { initIdioma, traduce} from "./Idioma.js";
import { gestionParametros } from "./gestionParametros.js";
import { inicializaWizard} from "./Wizard.js";


export default async function inicializaEventos() {

//Si recibimos argumento debug en la url ejecutamos con debug
  TCB.debug = UTIL.getQueryVariable('debug');
  UTIL.debugLog("_initEvents Debug activo: "+TCB.debug);

// Funcion para verificar que no se introducen valores negativos en los campos que tienen la clase .
// La validacion de html5 solo valida a nivel de submit del formulario pero no en cada campo
  var elems = document.getElementsByTagName("input");
  for(let i=0; i<elems.length; i++) {
      if (elems[i].type === 'number' && elems[i].min === '0') {
          elems[i].addEventListener("input", (e) => {
            e.target.checkValidity() ||(e.target.value='');
          })
      }
  }

  //Inicializacion graficos Plotly
  TCB.graficos = new Graficos();

  //Inicializacion proceso i18n

  await initIdioma();
  document.getElementById("idioma").value = TCB.i18next.language.substring(0,2);

  // Define la url base de la aplicación
  let fullPath = window.location.href;
  let ipos = fullPath.lastIndexOf("/");
  TCB.basePath = fullPath.slice(0, ipos + 1);
  UTIL.debugLog("_initEvents ejecutando desde " + TCB.basePath);

  // Se incializan los tooltips
  var tooltipList1 = [].slice.call(document.querySelectorAll('[data-bs-html="true"]'));
  var tooltipList2 = tooltipList1.map(function (tooltipTriggerfun) {  
    return new bootstrap.Tooltip(tooltipTriggerfun);  
  }) 
 
  // lectura del fichero de precios de instalación del servidor. Si falla se usan las de la TCB
  const ficheroPreciosInstalacion = "./datos/precios instalacion.json";
  UTIL.debugLog("Precios instalación leidos desde servidor:" + ficheroPreciosInstalacion);
  try {
    const precios = await fetch(ficheroPreciosInstalacion);
    if (precios.status === 200) {
      TCB.precioInstalacion = await precios.json();
    }
  } catch (err) {
    UTIL.debugLog("Error leyendo precios de instalación del servidor " + err.message + "<br>Seguimos con TCB");
  }

  // Evento del boton de instrucciones
  document.getElementById('instrucciones').addEventListener("click", async function handleChange(event) {
    let tlng = TCB.i18next.language;
    if (TCB.i18next.language === "eu") {  //Euskera aun no traducido
      alert("Lo sentimos, las instrucciones aun no estan traducidas al euskera. Las mostraremos en castellano");
      tlng = 'es';
    };
    window.open('./locales/instrucciones/Instrucciones_'+tlng+'.html', '_blank');
  });

  // Boton muestra/oculta ayuda
  document.getElementById("ayuda").addEventListener("click", function handleChange(event) { 
    var resultados = document.getElementById("panelDerecho");
    if (resultados.classList.contains( 'collapse' )) {
        resultados.classList.remove("collapse");
        resultados.classList.add("collapse.show");
    } else {
        resultados.classList.add("collapse");
    }
  });

  // Evento de cambio de idioma DOM.id: "idioma"
  const idioma = document.getElementById("idioma");
  idioma.addEventListener("change", function handleChange(event) {
      traduce(event.target.value);
  });

  // Formulario de bienvenida
  const noMostrarMas = document.cookie.split('=')[1];
  if (noMostrarMas === 'false' || noMostrarMas === undefined) {
    const ficheroBienvenida = "./locales/" + 'es' + '-bienvenida.htm';
    const text = await (await fetch(ficheroBienvenida)).text();
    const formBienvenida = document.getElementById("formularioBienvenida");
    document.getElementById('textoBienvenida').innerHTML = text;
    formBienvenida.style.display = "block";
    formBienvenida.classList.add("show");
    document.getElementById('cerrarBienvenida').addEventListener("click", async function handleChange(event) {
      document.cookie = "noMostrarMas=" + document.getElementById('noMostrarMas').checked;
      formBienvenida.style.display = "none";
      formBienvenida.classList.remove("show");
    });
  }

  // Inicializa formulario de parametros
  UTIL.debugLog("_initEvents call gestionParametros");
  gestionParametros();
  inicializaWizard();
  return true;
}
// Asignación de la función _Dispatch al objeto global window.
window.inicializaEventos = inicializaEventos;