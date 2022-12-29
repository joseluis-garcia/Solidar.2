    import * as UTIL from "./Utiles.js";
    import TCB from "./TCB.js";

    async function initIdioma() {
    //Inicializacion proceso i18n
    UTIL.debugLog("_initEvents call i18next");
    TCB.i18next = window.i18next;
    TCB.i18next.use(i18nextBrowserLanguageDetector);
    TCB.i18next.use(i18nextHttpBackend);

    await TCB.i18next.init({
        debug: TCB.debug,
        fallbackLng: 'es',
        locales: ['es', 'ca', 'ga', 'en', 'eu'],
        backend: {loadPath: './locales/{{lng}}.json'}       
        }, (err, t) => {
        if (err) return console.error(err);
        traduce(TCB.i18next.language);
    })};

    function traduce( idioma) {
        idioma = idioma.substring(0,2); //Ignoramos los casos en-US o es-ES
        UTIL.debugLog("i18next cambiando idioma a " + idioma);
        TCB.i18next.changeLanguage(idioma, (err, t) => {
        if (err) return console.log(err);
        let t_i18n = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < t_i18n.length; i++) { 
            t_i18n[i].innerHTML = i18next.t(t_i18n[i].getAttribute("data-i18n")); 
        }
        // loop para traducir los tooltips
        let t_Dyns = document.querySelectorAll('.tDyn');
        for (var i = 0; i < t_Dyns.length; i++) { 
            t_Dyns[i].title = i18next.t(t_Dyns[i].getAttribute('name')); 
        }
        })
    };

    export {initIdioma, traduce}

