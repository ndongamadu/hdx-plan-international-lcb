function hxlProxyToJSON(input){
    var output = [];
    var keys = [];
    input.forEach(function(e,i){
        if(i==0){
            e.forEach(function(e2,i2){
                var parts = e2.split('+');
                var key = parts[0]
                if(parts.length>1){
                    var atts = parts.splice(1,parts.length);
                    atts.sort();                    
                    atts.forEach(function(att){
                        key +='+'+att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

var blue = '#007CE0';
var blueLight = '#72B0E0';
var green = '#06C0B4';

function generate3W(data, geom) {
    var lookup = genLookup(geom);

    var where = dc.leafletChoroplethChart('#map');
    var sectorChart = dc.rowChart('#sectorChart');
    var donorChart = dc.rowChart('#donorChart');
    var communityChart = dc.rowChart('#communityChart');

    var approachChart = dc.pieChart('#approach');

    var cf = crossfilter(data);

    var whereDim = cf.dimension(function(d){
        return d['#adm1+code'];
    });
    var sectorDim = cf.dimension(function(d){
        return d['#sector'];
    });
    var donorDim = cf.dimension(function(d){
        return d['#donor'];
    });
    var approachDim = cf.dimension(function(d){
        return d['#indicator+approach'];
    });

    var communityDim = cf.dimension(function(d){
        return d['#loc+name'];
    });

    var whereGroup = whereDim.group();
    var sectorGroup = sectorDim.group();
    var donorGroup = donorDim.group();
    var approachGroup = approachDim.group();
    var communityGroup = communityDim.group();

    //tooltip
    var rowtip = d3.tip().attr('class', 'd3-tip').html(function (d) {
        return d.key + ': ' + d3.format('0,000')(d.value);

    });

 where.width($('#map').width())
            .height(400)
            .dimension(whereDim)
            .group(whereGroup)
            .center([0,0]) //8.779/13.436
            .zoom(0)
            .geojson(geom)
            .colors(['#DDDDDD', '#A7C1D3', blue])
            .colorDomain([0, 2])
            .colorAccessor(function (d) {
                var c = 0;
                if(d>100){
                    c = 2
                } else if (d>40){
                    c = 1 ;
                }
                return c;
            })
            .featureKeyAccessor(function(feature){
                return feature.properties['admin1Pcod'];
            }).popup(function(feature){
                return feature.properties['admin1Name'];
            });

    sectorChart.width(350)
        .height(750)
        .gap(2)
        .dimension(sectorDim)
        .group(sectorGroup)
        .data(function (group) {
            return group.top(Infinity);
        })
        .colors(blue)
        .elasticX(true)
        .renderTitle(false)
        .xAxis().ticks(5);

    donorChart.width(350)
        .height(750)
        .gap(2)
        .dimension(donorDim)
        .group(donorGroup)
        .data(function (group) {
            return group.top(Infinity);
        })
        .colors(blue)
        .elasticX(true)
        .renderTitle(false)
        .xAxis().ticks(5);

    communityChart.width(350)
        .height(750)
        .gap(2)
        .dimension(communityDim)
        .group(communityGroup)
        .data(function (group) {
            return group.top(20);
        })
        .colors(blue)
        .elasticX(true)
        .renderTitle(false)
        .xAxis().ticks(2);

    var approachColors = d3.scale.ordinal().range([blue, blueLight]);
    approachChart.width(350)
        .height(250)
        .radius(100)
        .dimension(approachDim)
        .group(approachGroup)
        .colors(approachColors)
        .title(function(d) {
            return;
        });

    dc.renderAll();

    //tooltip events
    d3.selectAll('g.row').call(rowtip);
    d3.selectAll('g.row').on('mouseover', rowtip.show).on('mouseout', rowtip.hide);

    var map = where.map();
    map.options.minZoom = 3;


    zoomToGeom(geom);


    function zoomToGeom(geom){
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
    }

    function genLookup(geojson){
        var lookup = {};
        geojson.features.forEach(function(e){
            lookup[e.properties['admin1Pcod']] = String(e.properties['admin1Name']);
        });
        return lookup;
    }

} //generate3W


var geodataCall = $.ajax({
    type: 'GET',
    dataType: 'json',
    url: 'data/lcb.json',
});

var dataCall = $.ajax({
    type: 'GET',
    dataType: 'json',
    url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1abyAjrq35THsb7kl8nWRaFDGT_YdcoKSrxUr71dQFmQ%2Fedit%23gid%3D0&force=on'
});

$.when(geodataCall, dataCall).then(function(geomArgs, dataArgs){
    var geom = geomArgs[0];
    var data = hxlProxyToJSON(dataArgs[0]);
    generate3W(data, geom);
});