'use strict';

// Color codes
const SOLAR_COLOR = '#FFFF00'
const WIND_COLOR = '#008000'
const HYDRO_COLOR = '#2F76E9'
const GAS_COLOR = '#FFA07A'
const DIST_COLOR = '#FF0000'
const COAL_COLOR = '#000000'
const EXP_COLOR = '#A569BD'
const PUMP_COLOR = '#85C1E9'

// data
var coaldata = springfieldData[0];
var distdata = springfieldData[1];
var gasdata = springfieldData[2];
var hydrodata = springfieldData[3];
var pumpsdata = springfieldData[4];
var winddata = springfieldData[5];
var exportsdata = springfieldData[6];
var solardata = springfieldData[7];
var pricedata = springfieldData[8];
var tempdata = springfieldData[10];

var current_date;
var source_total = 0;
var net_total = 0;

// update data so they are all the same size as solar data
var toBeUpdated = [coaldata, distdata, gasdata, hydrodata, winddata, pumpsdata, exportsdata];
for (var i = 0; i < toBeUpdated.length; i ++) {
    var cpy = [];
    for (var j = 1; j < toBeUpdated[i]['history']['data'].length; j += 6) {
        cpy.push(toBeUpdated[i]['history']['data'][j])
    }
    toBeUpdated[i]['history']['data'] = cpy;
}
solardata['forecast']['data'].splice(-1, 1);

var syncedCharts = [];

var data = [distdata, winddata, hydrodata, gasdata, coaldata, exportsdata, pumpsdata]
var valTags = ['dist_val', 'wind_val', 'hydro_val', 'gas_val', 'coal_val', 'exp_val', 'pump_val'];
var percTags = ['solar_perc', 'dist_perc', 'wind_perc', 'hydro_perc', 'gas_perc', 'coal_perc', 'exp_perc', 'pump_perc', 'renew_perc'];
var percstamp = 0;

document.getElementById('sharedGrid').addEventListener( 'mousemove', function (e) {
    var chart, point, i, event;
    for (i = 0; i < syncedCharts.length; i ++) {
        chart = syncedCharts[i];
        // Find coordinates within the chart
        event = chart.pointer.normalize(e);
        // Get the hovered point
        point = chart.series[0].searchPoint(event, true);

        if (point) {
            percstamp = point.plotX / syncedCharts[0].plotSizeX
            try {
                point.highlight(e);
            } catch(err) {}
        }
    }
    
    renderLegend();
    renderPieGraph();
    document.getElementById('legendHeader').innerHTML = current_date;
});

Highcharts.Pointer.prototype.reset = function () {
    return undefined;
}

Highcharts.Point.prototype.highlight = function (event) {

    event = this.series.chart.pointer.normalize(event);
    this.onMouseOver(); // Show the hover marker
    this.series.chart.tooltip.refresh([this]); // Show the tooltip
    this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair

};

function syncExtremes(e) {

    var thisChart = this.chart;

    if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
        Highcharts.each(Highcharts.charts, function (chart) {
            if (chart !== thisChart) {
                if (chart.xAxis[0].setExtremes) { // It is null while updating
                    chart.xAxis[0].setExtremes(
                        e.min,
                        e.max,
                        undefined,
                        false,
                        { trigger: 'syncExtremes' }
                    );
                }
            }
        });
    }

}

function renderPieGraph() {
    Highcharts.chart('pieGrid', {
        chart: {
            type: 'pie'
        },
        title: {
            text: '<span style="font-size: 60px><b>' + source_total + ' MW</b></span>',
            verticalAlign: 'middle',
            floating: true
        },
        plotOptions: {
            pie: {
                innerSize: '50%',
                colors: [SOLAR_COLOR, DIST_COLOR, WIND_COLOR, HYDRO_COLOR, GAS_COLOR, COAL_COLOR],
                animation: false,
                //enableMouseTracking: false,
                shadow: false,
                allowPointSelect: false,
                cursor: 'pointer',
                dataLabels: {
                    enabled: false,
                }
            }
        },
        tooltip: {
            formatter: function() {
                return '<b>' + this.key + '</b>: ' + this.y + 'MW';
            }
        },
        series: [{
            name: 'Share',
            data: [
            {
                name: 'Solar',
                y: solardata['forecast']['data'][Math.floor(percstamp * solardata['forecast']['data'].length)]
            },
            {
                name: 'Distillate',
                y: distdata['history']['data'][Math.floor(percstamp * distdata['history']['data'].length)]
            },
            {
                name: 'Wind',
                y: winddata['history']['data'][Math.floor(percstamp * winddata['history']['data'].length)]
            },
            {
                name: 'Hydro',
                y: hydrodata['history']['data'][Math.floor(percstamp * hydrodata['history']['data'].length)]
            },
            {
                name: 'Gas',
                y: gasdata['history']['data'][Math.floor(percstamp * gasdata['history']['data'].length)]
            },
            {
                name: 'Coal',
                y: coaldata['history']['data'][Math.floor(percstamp * coaldata['history']['data'].length)]
            }]
        }]
    });
}


function renderLegend() {
    var total = 0, loadtotal = 0, vals = [];

    // Render energy values
    var val = solardata['forecast']['data'][Math.floor(percstamp * solardata['forecast']['data'].length)];
    total += val;
    vals.push(val);
    document.getElementById('solar_val').innerHTML = val;

    // Render source values
    for (var i = 0; i < 5; i ++) {
        val = data[i]['history']['data'][Math.floor(percstamp * data[i]['history']['data'].length)];
        document.getElementById(valTags[i]).innerHTML = val;
        total += val;
        vals.push(val);
    }
    var renewtotal = total - vals[5] - vals[3];
    // Render source totals
    document.getElementById('source_val').innerHTML = total.toFixed();
    source_total = total.toFixed().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    // Render load values
    for (i = 5; i < data.length; i ++) {
        val = 0 - data[i]['history']['data'][Math.floor(percstamp * data[i]['history']['data'].length)];
        document.getElementById(valTags[i]).innerHTML = val;
        loadtotal += val;
        total += val;
        vals.push(val);
    }
    vals.push(renewtotal);
    // Render load totals
    document.getElementById('load_val').innerHTML = loadtotal.toFixed();
    // Render net value
    document.getElementById('net_val').innerHTML = total.toFixed();
    net_total = total.toFixed();
    // Render contribution percentages
    for (i = 0; i < vals.length; i ++) {
        if (percTags[i] == 'dist_perc') {
            document.getElementById(percTags[i]).innerHTML = (vals[i] / total * 100).toFixed(4) + '%';
        } else {
            document.getElementById(percTags[i]).innerHTML = (vals[i] / total * 100).toFixed(1) + '%';
        }
    }
}


function displayGraphs(data) {
    //Load legend data
    renderLegend();

    var charts = [];
    charts.push(document.createElement('div'));
    charts[0].className = 'chart';
    document.getElementById('sharedGrid').appendChild(charts[0]);

    renderPieGraph();

    // Energy Chart
    syncedCharts.push(Highcharts.chart(charts[0], {
        chart: {
            type: 'area',
            marginLeft: 40, // Keep all charts left aligned
            spacingTop: 20,
            spacingBottom: 20,
            height: 350
        },
        title: {
            text: "Generation (MW)",
            align: 'left',
            margin: 0,
            x: 30
        },
        credits: {
            enabled: false
        },
        legend: {
            enabled: false
        },
        xAxis: {
            crosshair: true,
            type: 'datetime',
            labels: {
                formatter: function() {
                    return Highcharts.dateFormat('%a %d %b', this.value);
                }
            },
            events: {
                setExtremes: syncExtremes
            }
        },
        yAxis: {
            title: {
                text: null
            }
        },
        tooltip: {
            positioner: function () {
                return {
                    // right aligned
                    x: this.chart.chartWidth - this.label.width,
                    y: 10 // align to title
                };
            },
            formatter: function() {
                current_date = Highcharts.dateFormat('%e %b, %H:%M', new Date(this.x));
                return  '<table class="labeltable"><tr><td style="background-color:#FADBD8"><b>' + current_date + 
                        '</b></td><td style="background-color:#D6DBDF">&nbsp;&nbsp;Total <b>' + source_total + ' MW</b></td></tr></table>';
            },
            useHTML: true,
            borderWidth: 0,
            backgroundColor: 'none',
            shadow: false,
            shared: true,
            style: {
                fontSize: '18px'
            }
        },
        plotOptions: {
            series: {
                marker: false,
                states: {
                    hover: {
                        enabled: false
                    },
                    inactive: {
                        opacity: 1
                    }
                },
                lineWidth: 1
            },
            area: {
                stacking: 'normal'
            }
        },
        series: [
        {
            data: solardata['forecast']['data'],
            pointStart: 1571580000000,
            pointInterval: 1800000,
            name: 'Solar',
            color: SOLAR_COLOR
        },
        {
            data: distdata['history']['data'],
            pointStart: 1571580000000,
            pointInterval: 1800000,
            name: 'Distillate',
            color: DIST_COLOR
        },
        {
            data: winddata['history']['data'],
            pointStart: 1571580000000,
            pointInterval: 1800000,
            name: 'Wind',
            color: WIND_COLOR
        },
        {
            data: hydrodata['history']['data'],
            pointStart: 1571580000000,
            pointInterval: 1800000,
            name: 'Hydro',
            color: HYDRO_COLOR
        },
        {
            data: gasdata['history']['data'],
            pointStart: 1571580000000,
            pointInterval: 1800000,
            name: 'Gas',
            color: GAS_COLOR
        },
        {
            data: coaldata['history']['data'],
            pointStart: 1571580000000,
            pointInterval: 1800000,
            name: 'Coal',
            color: COAL_COLOR
        }]
    }));

    // Price Chart
    charts.push(document.createElement('div'));
    charts[1].className = 'chart';
    document.getElementById('sharedGrid').appendChild(charts[1]);

    syncedCharts.push(Highcharts.chart(charts[1], {
        chart: {
            marginLeft: 40, // Keep all charts left aligned
            spacingTop: 20,
            spacingBottom: 20,
            height: 250
        },
        title: {
            text: "Price ($/MWh)",
            align: 'left',
            margin: 0,
            x: 30
        },
        credits: {
            enabled: false
        },
        legend: {
            enabled: false
        },
        xAxis: {
            visible: false,
            crosshair: true,
            type: 'datetime',
            labels: {
                formatter: function() {
                    return Highcharts.dateFormat('%a %d %b', this.value);
                }
            },
            events: {
                setExtremes: syncExtremes
            }
        },
        yAxis: {
            title: {
                text: null
            }
        },
        plotOptions: {
            series: {
                states: {
                    hover: {
                        enabled: false
                    }
                },
                lineWidth: 1
            }
        },
        tooltip: {
            positioner: function () {
                return {
                    // right aligned
                    x: this.chart.chartWidth - this.label.width,
                    y: 10 // align to title
                };
            },
            formatter: function() {
                return  '<table class="labeltable"><tr><td style="background-color:#FADBD8"><b>' + Highcharts.dateFormat('%e %b, %H:%M', new Date(this.x)) + 
                        '</b></td><td style="background-color:#D6DBDF">&nbsp;&nbsp;<b>$' + this.y + '.00</b></td></tr></table>';
            },
            useHTML: true,
            borderWidth: 0,
            backgroundColor: 'none',
            shadow: false,
            style: {
                fontSize: '18px'
            }
        },
        series: [{
            data: pricedata['history']['data'],
            name: pricedata['type'],
            color: '#EC7063',
            fillOpacity: 0.3,
            pointStart: 1571580000000,
            pointInterval: 1800000,
        }]
    }));


    // Temperature Chart
    charts.push(document.createElement('div'));
    charts[2].className = 'chart';
    document.getElementById('sharedGrid').appendChild(charts[2]);

    // Temperature Chart
    syncedCharts.push(Highcharts.chart(charts[2], {
        chart: {
            marginLeft: 40, // Keep all charts left aligned
            spacingTop: 20,
            spacingBottom: 20,
            height: 250
        },
        title: {
            text: "Temperature (deg F)",
            align: 'left',
            margin: 0,
            x: 30
        },
        credits: {
            enabled: false
        },
        legend: {
            enabled: false
        },
        xAxis: {
            visible: false,
            crosshair: true,
            type: 'datetime',
            events: {
                setExtremes: syncExtremes
            }
        },
        yAxis: {
            title: {
                text: null
            }
        },
        plotOptions: {
            series: {
                states: {
                    hover: {
                        enabled: false
                    }
                },
                lineWidth: 1
            }
        },
        tooltip: {
            positioner: function () {
                return {
                    // right aligned
                    x: this.chart.chartWidth - this.label.width,
                    y: 10 // align to title
                };
            },
            formatter: function() {
                return  '<table class="labeltable"><tr><td style="background-color:#FADBD8"><b>' + Highcharts.dateFormat('%e %b, %H:%M', new Date(this.x)) + 
                        '</b></td><td style="background-color:#D6DBDF">&nbsp;&nbsp;Av <b>' + this.y + '&deg;F</b></td></tr></table>';
            },
            useHTML: true,
            borderWidth: 0,
            backgroundColor: 'none',
            shadow: false,
            style: {
                fontSize: '18px'
            }
        },
        series: [{
            data: tempdata['history']['data'],
            name: tempdata['type'],
            color: '#EC7063',
            fillOpacity: 0.3,
            pointStart: 1571580000000,
            pointInterval: 1800000,
        }]
    }));
};

document.onload = displayGraphs();


