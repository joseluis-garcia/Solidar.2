# Historial de versiones:

## 20221010: Primera version de Solidar

## 20221011: 
- Modificación llamada Nominatim para que devuelva siempre el texto en español
- Añadido de la potencia inicial de paneles a TCB.parametros
- Las tarifas se cargan desde el fichero <urlbase>:/datos/tarifas.json 
- Posibilidad de cargar tarifas desde fichero local

## 20221013:
- Cambio definicion de limite subvencion con cociente minimo de Consumo / Produccion > 80%
- Cambio en la gráfica de alternativas volviendo a incluir autosuficiencia

## 20221017:
- Las instrucciones aparecen en una pestaña nueva y no en la isma ventana
- Modificación precios SOM en tarifas.json
- Se crea la version indexNoEntero donde se puede poner un numero no entero de paneles para el cálculo. Aun no se modifica el gráfico de alternativas que sigue siendo un número entero
- Se incluyen los ficheros detallados de carga de CSV para I-DE y Naturgy

## 20221024:
- Se modficia la carga de CSV para prever que puedan venir registros vacios al final del fichero (detectado en Naturgy Santa Ana)
- Modificación unidades potencia disponible a kWp en balance energía y reporte.
- Se añade un número al nombre de la pestaña para dejar mas claro que el proceso es una secuencia
- Se modifican los nombres de los campos en el balance de energía para darle mas coherencia y se añaden los tooltips

## 20221109:
- Se quita la limitación de un número entero de paneles
- Se añaden las instrucciones detalladas de como obtener el CSV en el portal de VIESGO
- Nueva forma de calcular los precios de la instalación según tabla json
- Modificación del cálculo de subvención EU
- Se añade pantalla de bienvenida
- Se añade limitación de responsabilidad en el report pdf

## 20221107
- Nuevos ficheros de instrucciones traducidos y cambio a locales/instrucciones
- Nuevo ficheros de enlaces a distribuidoras para descarga CSV

## 20221114
- Cambio cálculo tabla financiera para que muestre las filas necesarias para un saldo pendiente positivo
- Cambio lógica llamada PVGIS para que no sea síncrona. La verificación queda pendiente para el paso cálculo energía del dispatcher.

## 20221116
- Se separa el IVA en dos valores, uno para la energía y otro para la instalación
- Se incluye texto de salvedad en el formulario de contactos
- Cambiado logo a versión transparente
- Cambiada logica en grafico de alternativas que provocaba cuelgue de aplicación si se hacia muchas veces. No llamar eventlistener cada vez que se genera un gráfico.

## 20221121
- Se incluye el cálculo de CO2 equivalente basado en la región en el balance de energía y se incluye en el report
- Se reporta el problema de OSM con Ceuta. Resuelto
- Nueva pestaña resumen como final del workflow con opción de generar pdf

## 20221124
- Se incorpora un campo que permite aumentar o disminuir en un porcentaje fijo el precio de la instalación.
- Nueva versión fichero detallado de como obtener CSV de I-DE
- Modificación instrucciones (todos los idiomas) se retira la frase que hablaba del precio de instalación €/kWp, parámetro que ya no existe

## 20221128
- Modificada lógica para poder indicar la localizacion por latlon directamente en el campo. Antes no funcionaba.
- Incorporados tooltips de pestañas 1-Localización y 2-Consumo
- Cambio en la tabla financiera para que incluya todos los años en los que hay subvención de IBI aunque se hubiera alcanzado el retorno antes.
