    import {gestionLocalizacion} from "./gestionLocalizacion.js";
    import {gestionConsumos} from "./gestionConsumos.js";
    import {gestionResultados} from "./gestionResultados.js";
    import {gestionPrecios} from "./gestionPrecios.js";
    import {gestionGraficos} from "./gestionGraficos.js";
    import {gestionReporte} from "./gestionReporte.js";
    import {gestionProyecto} from "./gestionProyecto.js";
    
    // ---> Eventos de control del wizard y la ayuda


    const tabs =  [
            {"id":"localizacion-tab", "nombre":"main_TAB_localizacion", "interno":"localizacion", "gestor":"gestionLocalizacion", "siguiente":"consumos-tab"},
            {"id":"consumos-tab", "nombre":"main_TAB_consumo", "interno":"consumos", "gestor":"gestionConsumos",                 "siguiente":"resultados-tab"},
            {"id":"resultados-tab", "nombre":"main_TAB_resultados", "interno":"resultados", "gestor":"gestionResultados", "siguiente":"precios-tab"},
            {"id":"precios-tab", "nombre":"main_TAB_precios", "interno":"precios", "gestor":"gestionPrecios",                 "siguiente":"graficos-tab"},
            {"id":"graficos-tab", "nombre":"main_TAB_graficos", "interno":"graficos", "gestor":"gestionGraficos",                "siguiente":"reporte-tab"},
            {"id":"reporte-tab", "nombre":"main_TAB_reporte", "interno":"reporte",  "gestor":"gestionReporte", 
            "siguiente":""}
    ];

    function inicializaWizard() {
        gestionProyecto('Inicializa');
        // Botones de siguiente y anterior
        document.getElementById("btnSiguiente").addEventListener("click", function handleChange(event) { eventoWizard('Siguiente')});
        document.getElementById("btnAnterior").addEventListener("click", function handleChange(event) { eventoWizard('Anterior')});
        tabs.forEach ((tab) => {
            const funcionInicializacion = tab.gestor;
            eval (funcionInicializacion)( 'Inicializa');
        })
    // Se carga la pestaña inicial que es la de localización
      muestraPestana('localizacion');
    }

    async function eventoWizard( hacia) {
        let status;
        let gestor;

      // ¿que panel esta activo y en que direccion nos queremos mover?
      //let steps = ['localizacion', 'consumo', 'resultados', 'precios', 'graficos', 'reporte'];
      const current = document.getElementsByClassName("tab-pane active")[0];
      let tabIndex = tabs.findIndex((tab) => { return (tab.id === current.id) });
      if (hacia === 'Siguiente') {
        if (tabs[tabIndex].siguiente !== "") {
            gestor = tabs[tabIndex].gestor;
            
            status = await eval (gestor)("Valida");
            if (status) { //Valida que se puede salir de esta pestaña
                tabIndex += 1;
                gestor = tabs[tabIndex].gestor;
                eval (gestor)("Prepara"); // Se ejecuta antes de mostrar la pestaña
                muestraPestana(tabs[tabIndex].interno);
            }
        }
      } else {
        tabIndex -= 1;
        if (tabIndex >= 0) muestraPestana(tabs[tabIndex].interno);
      }
    }
    
    async function muestraPestana ( nombre) {
        document.getElementById('titulo').innerHTML = i18next.t("ayuda_TIT_"+ nombre);
        //Esta es la version buena cuando esten todos los idiomas disponibles
        //const ficheroAyuda = "./locales/" + TCB.i18next.language.substring(0,2) + '-ayuda-' + nombre + '.htm'; 
        const ficheroAyuda = "./locales/" + 'es' + '-ayuda-' + nombre + '.htm';
        const text = await (await fetch(ficheroAyuda)).text();
        document.getElementById('texto').innerHTML = text;
      
        var current = document.getElementsByClassName("active");
        let activos = current.length;
        for (let i=0; i<activos; i++) {
          current[0].classList.remove("active");
        }
        var resultados = document.getElementById("nav-"+nombre+"-tab");
        resultados.classList.add("active");
        resultados.classList.add("show");
        var resultados_tab = document.getElementById(nombre+"-tab");
        resultados_tab.classList.add("active");
        resultados_tab.classList.add("show");
      }

      export {inicializaWizard}