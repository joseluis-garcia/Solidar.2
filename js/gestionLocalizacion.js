/**
 * @module  Localizacion
 * @fileoverview Modulo para la gestion de las localizaciones en el mapa
 * @version      20221206
 * @author       José Luis García (SOM Madrid)
 * @copyright
 *
 * History
 * v 20221206 – Version inicial documentada
*/
import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";
import BaseSolar from "./BaseSolar.js";
import Consumo from "./Consumo.js";

var map;

var origenDatosSolidar;
var draw; 
var featID = 0;  //Identificador unico de cada objeto
var geometriaActiva = {'nombre':'AreaSolar', 'tipo':'Polygon'}; //Tomará el valor ['Consumo', 'AreaSolar','acimut']
var geometriaPrevia; //Es para el caso de tener que volver a activar un tipo de geometria despues de una interaccion

let featIDActivo;
let filaActiva;
let baseActiva;
let tablaActiva;


// Variables comunes para todos los modulos de construccion de objetos Solidar
let geometria;
let componente;
let puntoAplicacion;
let puntoAplicacion_4326;
let territorioEnEspana;


//let tablaPuntoConsumo = document.getElementById('tablaPuntoConsumo');
let tablaAreaSolar = document.getElementById('tablaAreaSolar');

/**
 *  Es la funcion en la que se inicializan todos los listeners de la pestaña localizacion
 * 
 */

function inicializaEventos () {

  // Evento disparado al escribir una dirección. DOMid: "direccion"
  // Una vez capturado el nombre se pasa a Nominatim para obtener la lista de candidatos. DOMid: "direccion"
  document.getElementById('direccion').value = i18next.t("mapa_LBL_localizacion");
  document.getElementById("direccion").addEventListener("change", async function handleChange1(event) {
    await mapaPorDireccion("localizacion");
  });

  // Evento disparado el seleccionar una direccion de la lista de candidatos obtenida de Nominatim. DOMid: "candidatos"
  // Cada  elemento de la lista de candidatos tiene asociado el value de lon-lat que es pasado en el evento
  document.getElementById("candidatos").addEventListener("click", async function handleChange(event) {
    await centraMapa(event.target.value);
  });

  // Evento para gestionar boton deshacer. DOMid: "botonDeshacer"
  document.getElementById('botonDeshacer').addEventListener('click', function () {
    draw.removeLastPoint();
  });

  // Evento del boton que permite crear nuevos consumos. DIMid: "botonConsumo"
/*   document.getElementById('botonConsumo').addEventListener('click', function () {
    if (tablaPuntoConsumo.rows.length > 1) tablaPuntoConsumo.style.display = 'block';
    tablaAreaSolar.style.display = 'none';
    tablaActiva = "tablaPuntoConsumo"
    geometriaActiva = {'nombre':'Consumo', 'tipo': 'Point'};
    addInteraction();
  }); */

  // Evento para crear nuevas bases. DOMid: "botonAreaSolar"
  document.getElementById('botonAreaSolar').addEventListener('click', function () {
    //tablaPuntoConsumo.style.display = 'none';
    if (tablaAreaSolar.rows.length > 1) tablaAreaSolar.style.display = 'block';
    tablaActiva = "tablaAreaSolar";   
    geometriaActiva = {'nombre':'AreaSolar', 'tipo': 'Polygon'};
    addInteraction();
  });

  //--> operativa para cambiar la vista entre Vector y Satelite. DOMid: "botonTipoMapa"
  let botonTipoMapa = document.getElementById("botonTipoMapa");
  botonTipoMapa.addEventListener("click", function handleChange(event) { 
    if (botonTipoMapa.innerText === TCB.i18next.t('mapa_LBL_vector')) {
      botonTipoMapa.innerText = TCB.i18next.t('mapa_LBL_satelite');
    } else {
      botonTipoMapa.innerText = TCB.i18next.t('mapa_LBL_vector');
    }
    let OSM = map.getLayers().getArray().find(layer => layer.get('name') == 'OSM');
    let SAT = map.getLayers().getArray().find(layer => layer.get('name') == 'SAT');
    OSM.setVisible(!OSM.getVisible());
    SAT.setVisible(!SAT.getVisible());
  });

  // Evento para registrar la entrada de lon-lat a mano
  const campoLONLAT = document.getElementById("campoLONLAT");
  campoLONLAT.addEventListener("change", async function handleChange(event) {
    let point = campoLONLAT.value.split(',').map(x => parseFloat(x));
    if (!await verificaTerritorio(point)) {
      document.getElementById("lonlat").value = "";
      return false;
    } else {
      centraMapa(campoLONLAT.value);
      TCB.nuevaLocalizacion = true;
    }
  });

  // Inicializa el mapa
  // Definiciones del mapa
  var attribution = new ol.control.Attribution({collapsible: false});

  // Cartografía básica de Open Street Map
  const OSM = new ol.layer.Tile({
    source: new ol.source.OSM({
      crossOrigin: null,
      maxZoom: 30
    })
  });
  OSM.set('name', 'OSM');
  
  // Vector es el Layer que muestra los features mantenidos en la fuente origenDatosSolidar
  origenDatosSolidar = new ol.source.Vector({wrapX: false});
  const vector = new ol.layer.Vector({ source: origenDatosSolidar,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        fillcolor: [0,250,0,0.5],
        color: [0, 250, 0, 1],
        width: 4,
      }),
      fill: new ol.style.Fill({
        color: 'rgba(0, 255, 0, 0.3)',
      }),
    }),
  });
  
  // SAT es el layer con la imagen satelite provista por ESRI via arcgisonline
  const SAT = new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 30,
    })
  });
  SAT.set('name', 'SAT');
  SAT.setVisible(false);

  // Creación del mapa
  map = new ol.Map({
    interactions: ol.interaction.defaults({ doubleClickZoom: false }),  //Desabilitamos el zoom in del doubleclick
    controls: ol.control.defaults({ attribution: false }).extend([attribution]),
    target: "map",
    view: new ol.View({
      center: ol.proj.fromLonLat([-3.7, 40.45]),
      maxZoom: 20,
      zoom: 18,  //6
    }),
  });
  
  map.addLayer(SAT);
  map.addLayer(OSM);
  map.addLayer(vector);
  map.addControl(new ol.control.ZoomSlider());

  // Dejamos inicializado el proceso para que se puedan ir dibujando las areas de AreaSolar
  //geometriaActiva = {'nombre':'nada', 'tipo':'nada' }
  tablaActiva = "tablaAreaSolar";   
  geometriaActiva = {'nombre':'AreaSolar', 'tipo': 'Polygon'};
  addInteraction();

  /* Esta función es llamada cada vez que Interaction crea un nuevo feature en origenDatosSolidar.
  El nuevo feature se convertira en un objeto de Solidar en funcion de cual sea la geometriaActiva:
  - un AreaSolar (Polygon) donde se instalarán los paneles en cuyo caso el feature creado es de tipo Polygon
  - una acimut (LineString) en la linea que define el acimut de alguna Base previamente creada, en cuyo caso es de tipo LineString
  - un Consumo (Point) donde se definirá un perfil de consumo
  */
  origenDatosSolidar.on('addfeature', (featCreado) => {
    switch (geometriaActiva.nombre) {
    case 'AreaSolar':
      construirAreaSolar ( featCreado);
      break;
    case 'acimut':
      modificaAcimutAreaSolar ( featCreado);
      break;
/*     case 'Consumo':
      construirPuntoConsumo ( featCreado); */
      break;
    }
  });
}

/**
 * Es la función llamada desde InicializaAplicacion para cargar y activar el mapa
 * 
 */
async function gestionLocalizacion( accion) {
  let status;
  switch (accion) {
  case "Inicializa":
    status = inicializaEventos();
    break;
  case "Valida":
    status = await valida();
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

async function valida () {
  // Valida que los datos de las bases existentes son coherentes
  if (!validaBases ()) return false;
    
  //Carga rendimientos de cada base que lo requiera asincronicamente
  //La propiedad requierePVGIS es gestionada en GestionLocalizacion y se pone a true cuando cambia algun angulo
  try {
      TCB.bases.forEach (base => {
          if (base.requierePVGIS) {
            UTIL.debugLog("Base requiere PVGIS:", base);
            base.cargaRendimiento();
          }
      })

      return true;
  } catch (err) {
      alert (err);
      return false;
  }
}

function validaBases () {
  if (TCB.bases.length === 0) {
    alert (TCB.i18next.t("mapa_MSG_definePosicionMapa"));
    return false;
  }
  return true;
}

function setActivo(evento) {

  filaActiva = evento.closest('tr');
  tablaActiva = filaActiva.parentNode.parentNode.id;
  featIDActivo = filaActiva.id;

  switch (tablaActiva) {
    case "tablaAreaSolar":
      baseActiva = TCB.bases.find( base => base.id === featIDActivo);
      break;
    case "tablaPuntoConsumo":
      consumoActivo = TCB.consumos.find( consumo => consumo.id === featIDActivo);
      break;
  }
}

async function construirAreaSolar ( AreaSolar) {
/*  El feature AreaSolar esta compuesto por 3 geometrias:
    Polygon con ID AreaSolar.area.+featID
    Label con AreaSolar.label.+featID
    Linea de acimut con ID AreaSolar.acimut.+featID Se construirá luego si el usuario lo define con ID A+featID
    Marker de fin da acimut AreaSolar.symbol.+featID 
    */

  // Incrementamos el featID
  featIDActivo = featID++;

  // Construimos la geometria del AreaSolar
  geometria = AreaSolar.feature.getGeometry();

  // Calculamos una coordenada central para esta base que utilizaremos en PVGIS y donde rotularemos el area
  puntoAplicacion = geometria.getInteriorPoint().getCoordinates();

  // Transformamos el punto al EPSG:4326 necesario para Nominatim
  puntoAplicacion_4326 = ol.proj.transform(puntoAplicacion, "EPSG:3857", "EPSG:4326");

  //Verificamos que el punto esta en España y ademas fijamos el territorio
  territorioEnEspana = await verificaTerritorio(puntoAplicacion_4326);
  if (!territorioEnEspana) { //Si no esta en España no seguimos
    origenDatosSolidar.removeFeature(AreaSolar.feature);
    return false;
  }

  AreaSolar.feature.setId("AreaSolar.area." + featIDActivo);
  let nuevaArea = {};
  nuevaArea.nombre ='Area '+ featIDActivo;

  //Creamos el label
  nuevoLabel ("AreaSolar.label." + featIDActivo, 
              puntoAplicacion, 
              nuevaArea.nombre , 
              [255, 255, 255, 1], 
              [168, 50, 153, 0.6]);

  nuevaArea.id = featIDActivo.toString();
  nuevaArea.lonlat = puntoAplicacion_4326[0].toFixed(4) + "," + puntoAplicacion_4326[1].toFixed(4);
  nuevaArea.area = ol.sphere.getArea(geometria, { projection: "EPSG:3857" });
  nuevaArea.inclinacionTejado = 0;
  nuevaArea.areaReal = nuevaArea.area;
  nuevaArea.potenciaMaxima = nuevaArea.area / TCB.parametros.conversionAreakWp;
  nuevaArea.inclinacionPaneles = "";
  nuevaArea.inclinacionOptima = false;
  nuevaArea.acimut = "";
  nuevaArea.angulosOptimos = true;
  let nuevaBase = new BaseSolar(nuevaArea);
  TCB.bases.push( nuevaBase);
  nuevaFilaEnTablaAreaSolar (nuevaBase);

}

function nuevaFilaEnTablaAreaSolar(base) {

  // Construccion de las filas de la tabla areas
  let tmpHTML;

  // Tendremos una tabla para visualizar las bases que se van creando
  var tablaAreas = document.getElementById("tablaAreaSolar");
  if (TCB.bases.length >= 1) tablaAreas.style.display = 'block';
  var row = tablaAreas.insertRow();
  row.id = base.id;
  let cell;

  // Columna ID
  cell = row.insertCell();
  cell.id = 'AreaSolar.id.'+base.id;
  cell.innerHTML = '<label class="text-end">' + base.id;

  // Incluimos un campo donde se puede definir el nombre de la base
  cell = row.insertCell();
  cell.id = 'AreaSolar.nombre.'+base.id;
  cell.innerHTML = '<input type="text" class="text-end" value="'+base.nombre+'">';
  cell.addEventListener('change', (evt) => { cambioNombreBase (evt.target)})

  // Escribimos las coordenadas en la tabla
  cell = row.insertCell();
  cell.id = 'AreaSolar.lonlat.'+base.id;
  cell.innerHTML = base.lonlat;

  // Escribimos el area de la superficie plana que se cálcula del mapa
  cell = row.insertCell();
  cell.id = 'AreaSolar.area.'+base.id;
  cell.innerHTML = '<label class="text-end">' + UTIL.formatoValor('area', base.area) + '</label>';

  // Incluimos un campo donde se puede definir la inclinación del tejado
  cell = row.insertCell();
  cell.id = 'AreaSolar.inclinacionTejado.'+base.id;
  cell.innerHTML = '<input type="number" class="text-end" style="width: 100px;" value=0>';
  cell.addEventListener('change', (evt) => { inclinacionTejado (evt.target)})

  // Area corregida por la inclinación del tejado. Inicialmente la misma
  cell = row.insertCell();
  cell.id = 'AreaSolar.areaReal.'+base.id;
  cell.setAttribute( "valor", base.area);
  cell.innerHTML = '<label>' + UTIL.formatoValor('area', base.area)+ '</label>';

  // Potencia disponible en base al area real
  cell = row.insertCell();
  cell.id = 'AreaSolar.potenciaMaxima.'+base.id;
  cell.setAttribute( "valor", base.potenciaMaxima);
  cell.innerHTML = '<label>' + 
    UTIL.formatoValor('potencia', base.potenciaMaxima) + '</label>';

  // Campo para definir inclinacion del panel
  cell = row.insertCell();
  cell.id = 'AreaSolar.inclinacion.'+base.id;
  cell.setAttribute( "valor", "");
  cell.innerHTML = '<input type="number" class="text-end" style="width: 100px;" value="">';
  cell.addEventListener('change', (evt) => {inclinacionPaneles (evt.target)});

  // Boton para definir la inclinacion optima
  cell = row.insertCell();
  cell.id = 'AreaSolar.inclinacionOptima.'+base.id;
  cell.setAttribute( "valor", "checked");
  cell.innerHTML = '<input class="form-check-input" type="checkbox">';
  cell.addEventListener('click', (evt) => {inclinacionOptima (evt.target)});

  // Boton para definir el acimut
  cell = row.insertCell();
  cell.id = 'AreaSolar.acimut.'+base.id;
  cell.setAttribute( "valor", "");
  cell.innerHTML = '<input type="number" class="text-end" style="width: 100px;" value="" readonly>';
  cell.addEventListener('click', (evt) => {acimutAreaSolar (evt.target)});

  // Boton para definir el acimut optimo
  cell = row.insertCell();
  cell.id = 'AreaSolar.angulosOptimos.'+base.id;
  cell.setAttribute( "valor", "checked");
  cell.innerHTML = '<input class="form-check-input" type="checkbox" checked>';
  cell.addEventListener('click', (evt) => {angulosOptimos (evt.target)});

  // Boton de borrado
  cell = row.insertCell();
  cell.id = 'AreaSolar.borrar.'+base.id;
  tmpHTML = '<button class="btn btn-default tDyn pull-right" type="button"';
  tmpHTML += 'data-bs-toggle="tooltip" data-bs-placement="top" name="mapa_TT_borraBase"><span class="fa fa-trash-o"></span>';
  cell.innerHTML = tmpHTML;
  cell.addEventListener('click', (evt) => {borraObjeto (evt.target)});
}

/** LLamada cuando addInteracion recibio un acimut
 * 
 * @param {Objeto creado por addInteraction} acimutAreaSolar 
 */
function modificaAcimutAreaSolar ( acimutAreaSolar ) {

  // Borramos la linea y el marker si existieran
  origenDatosSolidar.removeFeature(origenDatosSolidar.getFeatureById("AreaSolar.acimut."+featIDActivo));
  origenDatosSolidar.removeFeature(origenDatosSolidar.getFeatureById("AreaSolar.symbol."+featIDActivo));

  acimutAreaSolar.feature.setId("AreaSolar.acimut."+ featIDActivo);
  let acimutCoordinates = acimutAreaSolar.feature.getGeometry().getCoordinates();
  let point1 = acimutCoordinates[0];
  let point2 = acimutCoordinates[1];
  if (acimutCoordinates.length > 2) { //Truncamos el line starig a los dos primerso vertices
    acimutAreaSolar.feature.setGeometry(new ol.geom.LineString([point1,point2]));
  }

  // Calculamos el nuevo acimut y actualizamos la tabla
  let acimut = (Math.atan2(point1[0] - point2[0], point1[1] - point2[1]) * 180) / Math.PI;
  componente = "AreaSolar.acimut."+featIDActivo;
  document.getElementById(componente).firstChild.value = acimut.toFixed(2);
  baseActiva.acimut = acimut;
  baseActiva.acimutOptimo = false;
  componente = 'AreaSolar.angulosOptimos.' + featIDActivo;
  document.getElementById(componente).firstChild.checked = false;

  // Creamos el nuevo marker
  var markerAcimutSymbol = new ol.style.Style({
    image: new ol.style.Icon({
      scale: 1,
      anchor: [0.5, 1],
      src: "./datos/ABC.svg",
    }),
  });

  let markerAcimut = new ol.Feature({ geometry: new ol.geom.Point(point2)});
  markerAcimut.setStyle(markerAcimutSymbol);
  markerAcimut.setId("AreaSolar.symbol."+featIDActivo);

  geometriaActiva = { 'nombre':'nada', 'tipo':'nada'}; 
  origenDatosSolidar.addFeatures([markerAcimut]);
  addInteraction();
}

function nuevoLabel (id, punto, nombreInicial , color, bgcolor) {
  let label = new ol.Feature({ geometry: new ol.geom.Point(punto)});
  label.setId (id);
  setLabel (label, nombreInicial, color, bgcolor);
  geometriaPrevia = geometriaActiva.nombre;
  geometriaActiva.nombre = 'texto';
  origenDatosSolidar.addFeatures([label]); 
  geometriaActiva.nombre = geometriaPrevia;
  addInteraction();
}

function setLabel ( feature, texto, colorArray, bgcolorArray) {
  let posicionTexto = "center"
  switch (tablaActiva) {
    case "tablaAreaSolar":
      posicionTexto = "center";
      break;
    case "tablaPuntoConsumo":
      posicionTexto = "start";
      break;
  }
  var Slabel = new ol.style.Style({
    text: new ol.style.Text({
      font: '16px sans-serif',
      textAlign: posicionTexto,
      text: texto,
      fill: new ol.style.Fill({ color: colorArray}),
      backgroundFill: new ol.style.Fill({ color: bgcolorArray}),
      padding: [2, 2, 2, 2],
    })
  })
  feature.setStyle(Slabel);
}

/** 
  Vamos a verificar si el punto dado esta en España
  Devuelve false si no lo esta o alguno de los siguientes valores en caso de estar en España
  ['Peninsula', 'Islas Baleares', 'Canarias', 'Melilla', 'Ceuta']
 * 
 * @param {array} point [Latitud, Longitud]
 * @returns false si no esta en España
 * @returns true si el punto esta en territorio español
 */
async function verificaTerritorio (point) {

  let territorio = await verificaTerritorioNominatim( point);
  if (!territorio) {
    alert (TCB.i18next.t("mapa_MSG_territorio")); //Quiere decir que no estamos en España
    TCB.territorio = "";
    return false;
  } else {
    TCB.territorio = territorio;
    if (territorio !== 'Peninsula') alert (TCB.i18next.t('mapa_MSG_insular')); //Temporalmente avisamos que las tarifas fuera de la peninsula no estan cargadas
    return true;
  }
}

/**
 * Realiza la llamada a Nominatim para determinar el territorio donde se encuentra point
 * @param {array} point [Latitud, Longitud] 
 * @returns false en caso de error en la llamada Nominatim
 * @returns territorio entre los siguientes valores: ['Peninsula', 'Islas Baleares', 'Canarias', 'Melilla', 'Ceuta'];
 */

async function verificaTerritorioNominatim(point) {

    let url = "https://nominatim.openstreetmap.org/reverse?lat="+point[1].toFixed(4)+"&lon="+point[0].toFixed(4)+
    "&format=json&zoom=5&accept-language='es'";
    UTIL.debugLog("Call reverse Nominatim :" + url);
    try {
      const respTerritorio = await fetch(url);
      if (respTerritorio.status === 200) {
      let datoTerritorio = await respTerritorio.text();
      let jsonTerritorio = JSON.parse(datoTerritorio);
      UTIL.debugLog("El punto esta en:", jsonTerritorio);
      if ( jsonTerritorio.address.country !== 'España') return false;

      // Verificamos si estamos en territorio insular. Por ahora solo damos un aviso porque no estan cargadas las configuraciones de las tarifas
      let territorio = "Peninsula";
      let detalle = jsonTerritorio.display_name.split(",");
      const islas = ['Islas Baleares', 'Canarias', 'Melilla', 'Ceuta'];
      if (islas.includes(detalle[0])) territorio = detalle[0];
        UTIL.debugLog("Localización:" + territorio);
        return territorio
      } else {
        alert(i18next.t("nominatim_MSG_errorBuscandoTerritorio", {"resp":respTerritorio}));
        return false;
      }
    } catch (err) {
      alert(i18next.t("nominatim_MSG_errorFetch", {"err": err.message, "url": url}));
      return false;
    }

}

async function mapaPorDireccion() {
  var localizacion = document.getElementById("direccion");
  var listaCandidatos = document.getElementById("candidatos");
  let url =
    "https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&addressdetails=1&countrycodes=es&";
  url += "q=" + localizacion.value;
  UTIL.debugLog("Call Nominatim:" + url);
  var latlons = [];
  const respCandidatos = await fetch(url);
  if (respCandidatos.status === 200) {
    var dataCartoCiudad = await respCandidatos.text();
    var jsonAdd = JSON.parse(dataCartoCiudad);

    while (listaCandidatos.firstChild) {
      listaCandidatos.removeChild(listaCandidatos.firstChild);
    }

    jsonAdd.forEach(function (item) {
      var nitem = document.createElement("option");
      nitem.value = [item.lon, item.lat];
      nitem.text = item.display_name.toString();
      latlons.push = [item.lat, item.lon];
      listaCandidatos.appendChild(nitem);
    });

    if (listaCandidatos.childElementCount > 0 ) {
      listaCandidatos.disabled = false;
    } else {
      listaCandidatos.disabled = true;
    }

  } else {
    alert("Error conectando con Nominatim: " + respuesta.status + "\n" + url);
    return false;
  }
}

async function centraMapa(direccion) {
  let coords = direccion.split(",");
  map
    .getView()
    .setCenter(
      ol.proj.transform([coords[0], coords[1]], "EPSG:4326", "EPSG:3857")
    );
  map.getView().setZoom(17);
}

function cambioNombreBase ( evento) {
  setActivo(evento);
  baseActiva.nombre = evento.value;
  componente = 'AreaSolar.label.' + featIDActivo;
  setLabel( origenDatosSolidar.getFeatureById(componente), evento.value,[255, 255, 255, 1], [168, 50, 153, 0.6] );
}

function inclinacionPaneles (evento) {
  setActivo(evento);
  baseActiva.inclinacionPaneles = evento.value;
  baseActiva.requierePVGIS = true;

  baseActiva.inclinacionOptima = false;
  componente = 'AreaSolar.inclinacionOptima.' + featIDActivo;
  document.getElementById(componente).firstChild.checked = false;
  baseActiva.angulosOptimos = false;
  componente = 'AreaSolar.angulosOptimos.' + featIDActivo; 
  document.getElementById(componente).firstChild.checked = false;
}

function inclinacionOptima (evento) {
  setActivo(evento);
  baseActiva.requierePVGIS = true;
  componente = 'AreaSolar.inclinacion.' + featIDActivo;
  if (evento.checked) {
    document.getElementById(componente).firstChild.value = "";
    baseActiva.inclinacionOptima = true;
    baseActiva.angulosOptimos = false;
    componente = 'AreaSolar.angulosOptimos.' + featIDActivo; 
    document.getElementById(componente).firstChild.checked = false;
  } else {
    document.getElementById(componente).firstChild.focus();
    baseActiva.inclinacionOptima = false;
  }
}

function inclinacionTejado( evento) {
  setActivo(evento);
  baseActiva.inclinacionTejado = evento.value;
  componente = 'AreaSolar.area.' + featIDActivo;
  let nuevaArea = baseActiva.area / Math.cos(baseActiva.inclinacionTejado / 180 * Math.PI);
  let nuevaPotencia = nuevaArea / TCB.parametros.conversionAreakWp;
  componente = 'AreaSolar.areaReal.' + featIDActivo; 
  document.getElementById(componente).innerHTML = UTIL.formatoValor('area', nuevaArea);
  componente = 'AreaSolar.potenciaMaxima.' + featIDActivo; 
  document.getElementById(componente).innerHTML = UTIL.formatoValor('potenciaMaxima', nuevaPotencia);
}

/** LLamada desde la tabla area al seleccionar el campo Acimut de una fila
 * 
 * @param {DOM event*} evento 
 */
 function acimutAreaSolar(evento){
  setActivo(evento);
  baseActiva.requierePVGIS = true;
  componente = 'AreaSolar.angulosOptimos.' + featIDActivo; 
  document.getElementById(componente).firstChild.checked = false;
  baseActiva.angulosOptimos = false;
  geometriaActiva = {'nombre' : 'acimut', 'tipo': 'LineString'};
  addInteraction();
}

/**
 * Si se seleccion angulos optimos se debe desabilitar la posibilidad de inclinacion, inclinacionOptima y acimut
 * @param {*} evento 
 */
function angulosOptimos (evento) {
  setActivo(evento);

  if (evento.checked) {
    baseActiva.angulosOptimos = true;
    componente = 'AreaSolar.acimut.' + featIDActivo;
    document.getElementById(componente).firstChild.value = "";
    origenDatosSolidar.removeFeature(origenDatosSolidar.getFeatureById(componente));
    baseActiva.acimut = "";

    componente = 'AreaSolar.inclinacion.' + featIDActivo;
    document.getElementById(componente).firstChild.value = "";
    baseActiva.inclinacion = "";

    componente = 'AreaSolar.inclinacionOptima.' + featIDActivo;
    document.getElementById(componente).firstChild.checked = false;
    baseActiva.inclinacionOptima = false;
  } else {
    baseActiva.angulosOptimos = false;
  }

  componente = 'AreaSolar.symbol.' + featIDActivo;
  origenDatosSolidar.removeFeature(origenDatosSolidar.getFeatureById(componente));
};

function addInteraction() {
  UTIL.mensaje("accionMapa", i18next.t("mapa_MSG_"+geometriaActiva.tipo));
  map.removeInteraction(draw);
  if (geometriaActiva.nombre !== 'nada'){  
    draw = new ol.interaction.Draw({
      source: origenDatosSolidar,
      type: geometriaActiva.tipo,
    });
    map.addInteraction(draw); 
    //Si estamos dibujando el acimut de un AreaSolar tomamos el primer punto como el punto de aplicacion del area
    if (geometriaActiva.nombre === 'acimut') {
      componente = "AreaSolar.label."+featIDActivo;
      let baseGeom = origenDatosSolidar.getFeatureById(componente).getGeometry();
      let geomPuntoAplicacion = baseGeom.getCoordinates();
      let coord = [geomPuntoAplicacion[0],geomPuntoAplicacion[1]];
      draw.appendCoordinates([coord]);
    }
  } 
}

function borraObjeto(evento){

  setActivo(evento);
  const tablaActiva = filaActiva.parentNode.parentNode;

  filaActiva.remove();
  if (tablaActiva.id === "tablaAreaSolar") {
    origenDatosSolidar.removeFeature(origenDatosSolidar.getFeatureById("AreaSolar.area."+featIDActivo));
    origenDatosSolidar.removeFeature(origenDatosSolidar.getFeatureById("AreaSolar.symbol."+featIDActivo));
    origenDatosSolidar.removeFeature(origenDatosSolidar.getFeatureById("AreaSolar.label."+featIDActivo));
    origenDatosSolidar.removeFeature(origenDatosSolidar.getFeatureById("AreaSolar.acimut."+featIDActivo));
    baseActiva = TCB.bases.find( base => base.id === featIDActivo);
    TCB.bases.splice(baseActiva, 1);

  } else if (tablaActiva.id === "tablaPuntoConsumo") {
    origenDatosSolidar.removeFeature(origenDatosSolidar.getFeatureById("PuntoConsumo.symbol."+featIDActivo));
    origenDatosSolidar.removeFeature(origenDatosSolidar.getFeatureById("PuntoConsumo.label."+featIDActivo));
  }
  if (tablaActiva.rows.length <= 1) tablaActiva.style.display = 'none';
} 

// Las funciones a continuación estan preparadas cuando se generen puntos de consumo en el mapa.
async function construirPuntoConsumo ( puntoConsumo) {
  /*  El feature Consumo esta compuesto por 2 geometrias:
    Point con ID consumo.symbol.featID
    Label con ID consumo.label.featID
    */

    // Incrementamos el featID
    featIDActivo = featID++;

    // Construimos la geometria del AreaSolar
    geometria = puntoConsumo.feature.getGeometry();
  
    // Calculamos una coordenada 
    puntoAplicacion = geometria.getCoordinates();
  
    // Transformamos el punto al EPSG:4326 necesario para Nominatim
    puntoAplicacion_4326 = ol.proj.transform(puntoAplicacion, "EPSG:3857", "EPSG:4326");
  
    //Verificamos que el punto esta en España y ademas fijamos el territorio
    territorioEnEspana = await verificaTerritorio(puntoAplicacion_4326);
    if (!territorioEnEspana) { //Si no esta en España no seguimos
      origenDatosSolidar.removeFeature(puntoConsumo.feature);
      return false;
    }

    //Definimos el estilo
    var markerConsumo = new ol.style.Style({
      image: new ol.style.Icon({
        scale: 1,
        anchor: [0.5, 1],
        src: "./datos/marker.png",
      }),
    });

    puntoConsumo.feature.setStyle(markerConsumo);
    puntoConsumo.feature.setId("PuntoConsumo.symbol." + featIDActivo);
    let nuevoPunto = {};
    nuevoPunto.nombre = "Consumo "+ featIDActivo;

    //Creamos el label
    componente = "PuntoConsumo.label."+featIDActivo;
    nuevoLabel (componente, puntoAplicacion, nuevoPunto.nombre , [55, 255, 25, 1], [168, 50, 153, 0.6] );

    nuevoPunto.id = featIDActivo.toString();
    nuevoPunto.lonlat = puntoAplicacion_4326[0].toFixed(4) + "," + puntoAplicacion_4326[1].toFixed(4);
    nuevoPunto.fuente = "CSV";
    nuevoPunto.potenciaREE = 0;
    nuevoPunto.tarifa = "2.0TD";
    let nuevoConsumo = new Consumo (nuevoPunto);
    TCB.consumos.push( nuevoConsumo);
    nuevaFilaEntablaPuntoConsumo( nuevoConsumo);
}

export { gestionLocalizacion };
