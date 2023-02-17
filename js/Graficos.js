import * as UTIL from "./Utiles.js";UTIL
import TCB from "./TCB.js";

import {nuevoTotalPaneles} from "./optimizador.js";
import {calculaResultados} from "./calculaResultados.js";
import {gestionPrecios} from "./gestionPrecios.js";
import {gestionResultados, muestraBalanceEnergia} from "./gestionResultados.js";
import { gestionGraficos } from "./gestionGraficos.js";

export default class Graficos { 

    constructor(lon, lat, inclinacion, acimut) {
        this.init = true;  
    }

    consumos_y_generacion(donde){
    var resConsumo = UTIL.resumenMensual(TCB.consumo.idxTable, 'suma');
    var trace1 = {
        x: UTIL.nombreMes,
        y: resConsumo,
        type: 'scatter',
        name: i18next.t('graficos_LBL_graficasConsumo')
    };
    
    var resProduccion = UTIL.resumenMensual(TCB.produccion.idxTable, 'suma');
    var trace2 = {
        x: UTIL.nombreMes,
        y: resProduccion,
        type: 'scatter',
        name: i18next.t('graficos_LBL_graficasProduccion')
    };

    var layout = {
        paper_bgcolor:'rgba(0,0,0,0)',
        plot_bgcolor:'rgba(0,0,0,0)',
        title: i18next.t('graficos_LBL_produccionMediaMensual', {potencia: UTIL.formatoValor('potencia', TCB.produccion.potenciaTotal)}),
        yaxis: {
            title: 'kWh'
        }
    };
    
    var data = [trace1, trace2];
    Plotly.react(donde, data, layout);
    }

    consumo_3D (consumo, donde1, donde2) {

        var g_consumo = {
            z: consumo.diaHora,
            y: consumo.idxTable.map((e) => {return (e.dia + " - " + TCB.i18next.t(UTIL.nombreMes[e.mes]))}),
            name: i18next.t('graficos_LBL_graficasConsumo'),
            type: 'heatmap',
            colorscale: 
             [
                ['0.0', 'rgb(255,255,224)'],
                ['0.10', 'rgb(255,255,224)'],
                ['0.10', 'rgb(144,238,144)'],
                ['0.25', 'rgb(144,238,144)'],
                ['0.25', 'rgb(0,255,255)'],
                ['0.5', 'rgb(0,255,255)'],
                ['0.5', 'rgb(255,127,80)'],
                ['0.75', 'rgb(255,127,80)'],
                ['1.0', 'rgb(254,0,0)']
            ],
            line: {
                width:0.1,
                smoothing: 0
            },
            zsmooth: 'best',
            connectgaps: true,
            showlegend: true,
            showscale: true,
            hovertemplate:
            "%{yaxis.title.text}: %{y}<br>" +
            "%{xaxis.title.text}: %{x}<br>" +
            i18next.t('graficos_LBL_graficasConsumo') + ": %{z:.2f} kWh"
        };

        var layout_resumen = {
            title: {
                text: i18next.t('graficos_LBL_graficasConsumo'),
                xanchor: 'left', 
                yanchor: 'bottom',
                x: 0,
                y: 0.5,
              },
            xaxis:{title: i18next.t('graficos_LBL_graficasHora')},
            yaxis:{title: i18next.t('graficos_LBL_graficasDia'),
                tickvals: UTIL.indiceDia.map((e) => {return (e[1])}),
                ticktext: UTIL.nombreMes,
            },
            zaxis:{title: 'kWh'},
            paper_bgcolor:'rgba(0,0,0,0)',
            plot_bgcolor:'rgba(0,0,0,0)',
            autosize: true,
            margin: {
                l: 150,
                r: 10,
                b: 65,
                t: 25
            },
            annotations: [{
                x: 0, y: UTIL.indiceDesdeFecha(consumo.fechaInicio),
                xref: 'x', yref: 'y',
                text: 'Inicio',
                xanchor: 'right',
                textangle: 0,
                ax: -20,
                ay: 0
            }],
            shapes: [{
                  type: 'line',
                  x0: -0.5, y0: UTIL.indiceDesdeFecha(consumo.fechaInicio),
                  x1: 23.5, y1: UTIL.indiceDesdeFecha(consumo.fechaInicio),
                  line: {color: 'rgb(255, 0, 0)', width: 1}
            }],
        };

        Plotly.react(donde1, [g_consumo], layout_resumen);

        var gd = document.getElementById(donde1);
        gd.addEventListener('click', function(evt) {
            // Cuando click en zona del grafico llega un MouseEvent en caso contrario es un PointerEvent y lo ignoramos
            if (evt instanceof PointerEvent) return;
            
            document.getElementById(donde2).style.display = "block";
            var posicion = this.getBoundingClientRect();
            var xaxis = this._fullLayout.xaxis;
            var yaxis = this._fullLayout.yaxis;
            var l = this._fullLayout.margin.l;
            var t = this._fullLayout.margin.t;
            var r = gd._fullLayout.margin.r;
            var w = gd._fullLayout.margin.width;

            let xInDataCoord = xaxis.p2c(evt.x - l - posicion.right);
            let yInDataCoord = yaxis.p2c(evt.y - t - posicion.top);

            let dia = Math.round(yInDataCoord);
            let fecha = UTIL.fechaDesdeIndice(dia);

            var trace1 = {
                y: consumo.diaHora[dia],
                type: 'scatter',
                showlegend : false,
                name: i18next.t('graficos_LBL_graficasConsumo'),
                line: {shape: 'spline', width:3, color:'rgb(0,0,255'}
            };

            var trace2 = {
                y: consumo.diaHora[dia],
                type: 'bar',
                showlegend : false,
                width: 0.1,
                hoverinfo: 'none',
                marker : {'color': consumo.diaHora[dia],
                    cmax : consumo.maximoAnual,
                    cmin : 0,
                    colorscale: [
                    ['0.0', 'rgb(250,250,250)'],
                    ['0.10', 'rgb(240,240,240)'],
                    ['0.20', 'rgb(230,200,200)'],
                    ['0.5', 'rgb(220,120,150)'],
                    ['1.0', 'rgb(254,79,67)']]}
            };
            var layout = {
                paper_bgcolor:'rgba(0,0,0,0)',
                plot_bgcolor:'rgba(0,0,0,0)',
                title: TCB.i18next.t("graficos_LBL_graficasDia") + ": " + fecha[0] + " - " + TCB.i18next.t(UTIL.nombreMes[parseInt(fecha[1])]),
                xaxis: {title: TCB.i18next.t('graficos_LBL_graficasHora'), dtick: 2},
                yaxis: {title: 'kWh', showline: true, zeroline: true, zerolinecolor :'#969696', zeroline : true, gridcolor : '#bdbdbd', gridwidth : 2 }
            };
            Plotly.react(donde2, [trace1, trace2], layout);
        });
    }

    resumen_3D ( donde) {

    var g_produccion = {
        z: TCB.produccion.diaHora,
        y: TCB.produccion.idxTable.map((e) => {return (e.dia + " - " + TCB.i18next.t(UTIL.nombreMes[e.mes]))}),
        name: i18next.t('graficos_LBL_graficasProduccion'),
        type: 'surface',
        colorscale: 'YlOrRd',
        opacity:1,
        showlegend: true,
        showscale: false,
        contours: {"x": {show: true, usecolormap: true, project:{y: true}}, 
                    "y": {show: true, usecolormap: true, project:{x: true}}
        },
        hovertemplate:
            TCB.i18next.t('graficos_LBL_graficasHora') + ": %{y}<br>" +
            TCB.i18next.t('graficos_LBL_graficasHora') + ": %{x}<br>" +
            i18next.t('graficos_LBL_graficasProduccion') + ": %{z:.2f} kWh"
        };

    var g_consumo = {
        z: TCB.consumo.diaHora,
        y: TCB.consumo.idxTable.map((e) => {return (e.dia + " - " + TCB.i18next.t(UTIL.nombreMes[e.mes]))}),
        name: i18next.t('graficos_LBL_graficasConsumo'),
        type: 'surface',
        colorscale: 'Picnic',
        opacity:0.8,
        showlegend:true,
        showscale: false,
        hovertemplate:
            TCB.i18next.t('graficos_LBL_graficasHora') + ": %{y}<br>" +
            TCB.i18next.t('graficos_LBL_graficasHora') + ": %{x}<br>" +
            TCB.i18next.t('graficos_LBL_graficasConsumo') + ": %{z:.2f} kWh"
        };
  
    var layout_resumen = {
        paper_bgcolor:'rgba(0,0,0,0)',
        plot_bgcolor:'rgba(0,0,0,0)',
        title: {
            text: i18next.t('graficos_LBL_graficasProduccion') + " vs " + i18next.t('graficos_LBL_graficasConsumo'),
            xanchor: 'left', 
            yanchor: 'bottom',
            x: 0,
            y: 0.5
            },

        scene: {camera: {eye: {x: -1.5, y: -1.5, z: 0.5}},
            xaxis:{title: TCB.i18next.t('graficos_LBL_graficasHora')},
            yaxis:{title: TCB.i18next.t('graficos_LBL_graficasDia'),
                tickvals: UTIL.indiceDia.map((e) => {return (e[1])}),
                ticktext: UTIL.nombreMes},
            zaxis:{title: 'kWh'}},
        autosize: false,
        width: 1200,
        height: 600,
        margin: {l: 200, r: 0, b: 65, t: 25},
        }
        
    Plotly.react(donde, [g_consumo, g_produccion], layout_resumen);
    }

    balanceEnergia (donde1, donde2){
        var autoconsumo = UTIL.resumenMensual(TCB.balance.idxTable, 'autoconsumo');
        var excedente = UTIL.resumenMensual(TCB.balance.idxTable, 'excedente');
        var deficit = UTIL.resumenMensual(TCB.balance.idxTable, 'deficit');
        var consumo = UTIL.resumenMensual(TCB.consumo.idxTable, 'suma');
        var produccion = UTIL.resumenMensual(TCB.produccion.idxTable, 'suma');
        
        var trace_produccion = {
            x: UTIL.nombreMes,
            y: produccion,
            name: i18next.t('graficos_LBL_graficasProduccion'),
            type: 'scatter'
        };
        
        var trace_consumo = {
            x: UTIL.nombreMes,
            y: consumo,
            name: i18next.t('graficos_LBL_graficasConsumo'),
            type: 'scatter'
        };

        var trace_excedente = {
            x: UTIL.nombreMes,
            y: excedente,
            name: i18next.t('graficos_LBL_graficasExcedente'),
            type: 'bar'
        };

        var trace_deficit = {
            x: UTIL.nombreMes,
            y: deficit,
            name: i18next.t('graficos_LBL_graficasDeficit'),
            type: 'bar'
        };

        var trace_autoconsumo = {
            x: UTIL.nombreMes,
            y: autoconsumo,
            name: i18next.t('graficos_LBL_graficasAutoconsumo'),
            type: 'bar'
        };

        var layout = {
            paper_bgcolor:'rgba(0,0,0,0)',
            plot_bgcolor:'rgba(0,0,0,0)',
            title: i18next.t('graficos_LBL_balanceProduccion', {potencia: UTIL.formatoValor('potencia', TCB.produccion.potenciaTotal)}),
            barmode: 'stack',
            yaxis: {
                title: 'kWh'
            }
        };
      
        var data = [trace_produccion, trace_autoconsumo, trace_excedente];
        Plotly.react(donde1, data, layout);

        var layout = {
            paper_bgcolor:'rgba(0,0,0,0)',
            plot_bgcolor:'rgba(0,0,0,0)',
            title: i18next.t('graficos_LBL_balanceConsumo', {potencia: UTIL.formatoValor('potencia', TCB.produccion.potenciaTotal)}),
            barmode: 'stack',
            yaxis: {
                title: 'kWh'
            }
        };
        var data1 = [trace_consumo, trace_autoconsumo, trace_deficit  ];
        Plotly.react(donde2, data1, layout);
    }

    balanceEconomico (donde1){

        var _perdidas = new Array(12);
        var _compensado = new Array(12);
        for (let i=0; i<12; i++) { //las perdidas y lo compensado lo graficamos negativo
            _perdidas[i] = -TCB.consumo.economico.perdidaMes[i];
            _compensado[i] = -TCB.consumo.economico.compensadoMensualCorregido[i];
        }

        var trace_pagado = {
            x: UTIL.nombreMes,
            y: TCB.consumo.economico.consumoConPlacasMensualCorregido,
            name: i18next.t('graficos_LBL_graficasGastoConPaneles'),
            type: 'scatter',
            line: {shape: 'spline', width:3, color:'rgb(0,0,255'}
        };

        var trace_base = {
            x: UTIL.nombreMes,
            y: TCB.consumo.economico.consumoConPlacasMensualCorregido,
            name: 'base',
            type: 'bar',
             hoverinfo: 'none',
            showlegend: false, 
            marker: {
                color: 'rgba(1,1,1,0.0)'
            }
        };

        var trace_consumo = {
            x: UTIL.nombreMes,
            y: TCB.consumo.economico.consumoOriginalMensual,
            name: i18next.t('graficos_LBL_graficasGastoSinPaneles'),
            type: 'scatter',
            line: {shape: 'spline', width:3, color:'rgb(255,0,0)'}
        }

        var trace_compensa = {
            x: UTIL.nombreMes,
            y: _compensado,
            width: 0.1,
            marker: {color: 'rgb(204, 186, 57)'},
            name: i18next.t('graficos_LBL_graficasCompensacion'),
            type: 'bar'
        }

        var trace_ahorro = {
            x: UTIL.nombreMes,
            y: TCB.consumo.economico.ahorradoAutoconsumoMes, //_ahorroAutoconsumo,
            width: 0.1,
            marker: {color: 'rgb(104, 158, 43)'},
            name: i18next.t('graficos_LBL_graficasAutoconsumo'),
            type: 'bar'
        }

         var trace_perdida = {
            x: UTIL.nombreMes,
            y: _perdidas,
            width: 0.5,
            name: i18next.t('graficos_LBL_graficasNoCompensado'),
            base:0,
            type: 'bar'
        } 

        var layout = {
            paper_bgcolor:'rgba(0,0,0,0)',
            plot_bgcolor:'rgba(0,0,0,0)',
            width: 800,
            height: 500,
            autoadjust: true,
            title: i18next.t('graficos_LBL_tituloBalanceEconomico', {potencia: UTIL.formatoValor('potencia', TCB.produccion.potenciaTotal)}),
            barmode: 'relative',
            yaxis: {
                title: 'Euros',
                gridcolor:'grey',
            },
            xaxis: {
                gridcolor:'grey'
            }
        };
        var data1 = [ trace_consumo, trace_pagado, trace_base, trace_compensa, trace_ahorro, trace_perdida]; //
        Plotly.react(donde1, data1, layout);
    }

    plotAlternativas (donde, potencia_kWp, paneles, TIR, autoconsumo, autosuficiencia, precioInstalacion, ahorroAnual, limiteSubvencion) {
        var trace_TIR = {
            x: paneles,
            y: TIR,
            name: 'TIR(%)',
            type: 'scatter'
        };

        var trace_autosuficiencia = {
            x: paneles,
            y: autosuficiencia,
            name: i18next.t('graficos_LBL_graficasAutosuficiencia') + "(%)",
            type: 'scatter'
        };

        var trace_autoconsumo = {
            x: paneles,
            y: autoconsumo,
            name: i18next.t('graficos_LBL_graficasAutoconsumo') + "(%)",
            type: 'scatter'
        };

        var trace_precioInstalacion = {
            x: paneles,
            y: precioInstalacion,
            name: i18next.t('graficos_LBL_graficasInversion') + "(€)",
            yaxis : 'y2',
            type: 'scatter'
        };

        var trace_ahorroAnual = {
            x: paneles,
            y: ahorroAnual,
            name: i18next.t('graficos_LBL_graficasAhorro') + "(€)",
            yaxis : 'y2',
            type: 'scatter'
        };

        var numeroMaximoPaneles = 0;
        TCB.bases.forEach ( (base) => { numeroMaximoPaneles +=  Math.trunc(base.potenciaMaxima / base.instalacion.potenciaUnitaria)});

        var layout = {
            paper_bgcolor:'rgba(0,0,0,0)',
            plot_bgcolor:'rgba(0,0,0,0)',
            width: 800,
            height: 500,
            title: TCB.i18next.t('graficos_LBL_alternativasPotencia', {potencia: UTIL.formatoValor('potencia',potencia_kWp)}),
            xaxis: {
                title: i18next.t('graficos_LBL_paneles')
            },
            yaxis: {
                title: '%'
            },
            yaxis2: {
                title: 'Euros',
                overlaying: 'y',
                side: 'right'
            },
            legend: {
                x:1.1, y:1.,
                orientation:'v'
            },
            shapes: [
                {
                type: 'line',
                x0: TCB.totalPaneles, y0: 0,
                x1: TCB.totalPaneles, y1: 100,
                line: {color: 'rgb(55, 128, 191)', width: 3}
                },
                {
                type: 'line',
                x0: 0, y0: 80,
                x1: limiteSubvencion, y1: 80,
                line: {color: 'rgb(87, 202, 0)', width: 2}
                },
                {
                type: 'line',
                x0: limiteSubvencion, y0: 0,
                x1: limiteSubvencion, y1: 80,
                line: {color: 'rgb(87, 202, 0)', width: 2}
                },

            ],
            annotations: [
                {
                    x: TCB.totalPaneles, y: 100,
                    xref: 'x', yref: 'y',
                    text: TCB.totalPaneles + " " + TCB.i18next.t("graficos_LBL_paneles"),
                    showarrow: true,
                    arrowhead: 2,
                    xanchor: 'left',
                    hovertext: TCB.i18next.t("graficos_LBL_panelesActuales",{paneles: TCB.totalPaneles}),
                    ax: 20,
                    ay: -20
                },
            ]
        };
        
        if (numeroMaximoPaneles === paneles[4]) {
            layout.annotations.push(
                {
                    x: numeroMaximoPaneles, y: 100,
                    xref: 'x', yref: 'y',
                    text: i18next.t("graficos_LBL_numeroMaximoPaneles", {'paneles': numeroMaximoPaneles}),
                    showarrow: true,
                    arrowhead: 3,
                    xanchor: 'right',
                    hovertext: i18next.t("graficos_LBL_maximoPanelesExplicacion", {'area':UTIL.formatoValor('superficie',TCB.areaTotal)}),
                    ax: -20,
                    ay: -5
                });
            layout.shapes.push(
                {
                    type: 'line',
                    x0: numeroMaximoPaneles, y0: 0,
                    x1: numeroMaximoPaneles, y1: 100,
                    line: {color: 'rgb(250, 20, 0)', width: 2}
                })
        }

        if (limiteSubvencion !== undefined) {
            layout.annotations.push({
                x: limiteSubvencion, y: 80,
                xref: 'x', yref: 'y',
                text: i18next.t("precios_LBL_subvencionEU"),
                showarrow: true,
                arrowhead: 3,
                xanchor: 'left',
                hovertext: limiteSubvencion.toFixed(1) + " " + i18next.t("graficos_LBL_paneles"),
                ax: 20,
                ay: 0
            })
        }
       
        var data = [trace_TIR, trace_autoconsumo, trace_autosuficiencia, trace_precioInstalacion, trace_ahorroAnual];
        Plotly.react(donde, data, layout)

        var gd = document.getElementById(donde);
        var xInDataCoord;
        var yInDataCoord;
   
        if (this.init) {
            this.init = false;
            gd.addEventListener('click', function(evt) {

                // Cuando click en zona del grafico llega un MouseEvent en caso contrario es un PointerEvent y lo ignoramos
                if (evt instanceof PointerEvent) return;

                if (TCB.totalPaneles != Math.round(xInDataCoord)) {
                    if (Math.round(xInDataCoord) > numeroMaximoPaneles) return;
                    TCB.totalPaneles = Math.round(xInDataCoord);
                    UTIL.debugLog("Grafico alternativas cambia a " + Math.round(TCB.totalPaneles ));

                    nuevoTotalPaneles ( TCB.totalPaneles);
                    calculaResultados();
                    gestionResultados('Prepara');
                    gestionPrecios('Prepara');
                    gestionGraficos('Prepara');
                }
            });
            
            gd.addEventListener('mousemove', function(evt) {
                var bb = evt.target.getBoundingClientRect();
                xInDataCoord = gd._fullLayout.xaxis.p2d(evt.clientX - bb.left);
                yInDataCoord = gd._fullLayout.yaxis.p2d(evt.clientY - bb.top);

                // Se limita el número de paneles que se puede seleccionar del gráfico desde 1 al máximo mostrado
                if (Math.round(xInDataCoord) > 0 && Math.round(xInDataCoord) <= paneles[paneles.length - 1]) {
                    Plotly.relayout(gd, 'title', 
                        [i18next.t('graficos_LBL_alternativasPotencia', {potencia: UTIL.formatoValor('potencia', potencia_kWp)}), 
                        i18next.t('graficos_LBL_cambiaPaneles', {paneles: Math.round(xInDataCoord)})].join("<br>"));
                }
            });
        }
    };

}
