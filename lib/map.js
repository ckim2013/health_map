import * as d3 from 'd3';

const width = 1000;
const height = 700;
const svg = d3.select('#map')
              .append('svg')
              .attr('width', width)
              .attr('height', height);

const projection = d3.geoMercator()
                   .rotate([-9.5, 0])
                   .center([0, 45])
                   .translate([width/2, height/2]);

const path = d3.geoPath()
             .projection(projection);

const lsW = 20;
const lsH = 20;

const redDeathLegendLabels = ["No data", "0 - 5000", "5000 - 10000", "10000 - 50000", "> 50000"];
const blueDeathLegendLabels = ["No data", "0 - 5000", "5000 - 10000", "10000 - 30000", "> 30000"];
const orangeFrequencyLegendLabels = ["No data", "test1", "test2", "test3", "test4"];
const greenMoneyLegendLabels = ["No data", "test5", "test6", "test7", "test8"];

const redDeathColor = ["#edeced", "#FF8E8B", "#DE5855", "#A11B17", "#780300"];
const redDeathDomain = [0, 500, 5000, 10000, 50000, 100000];
const blueDeathColor = ["#edeced", "#7070B7", "#4A4A9C", "#1F1F70", "#0C0C54"];
const blueDeathDomain = [0, 100, 5000, 10000, 30000, 100000];
const orangeFrequencyColor = ["#edeced", "#ffc04d", "#ffae1a", "#e69500", "#b37400"];
const orangeFrequencyDomain = [0, 0.05, 1, 1.5, 2, 10];

const greenMoneyColor = ["#edeced", "#009900", "#007f00", "#006600", "#004c00"];
const greenMoneyDomain = [0, 100, 500, 1000, 5000, 8000];

let color = d3.scaleThreshold()
              .domain(redDeathDomain)
              .range(redDeathColor);

const tooltip = d3.select('#map')
                  .append('div')
                  .attr('class', 'tooltip');

tooltip.append('div')
       .attr('class', 'label');
tooltip.append('div')
       .attr('class', 'values');

firstMap('data/aids_2000_data.csv');
legendSetup('aids');

// Function to render the map for the very first time
function firstMap(dataSet) {
 d3.queue()
   .defer(d3.json, 'data/countries.geo.json')
   .defer(d3.csv, `${dataSet}`)
   .await(ready);
}

function makeObject(entity) {
  let entityByCountry = {};
  entity.forEach(function(d) {
    let item = Number(d.values);
    if (isNaN(item)) {
      item = -1;
    }
    entityByCountry[d.Country] = item;
  });
  return entityByCountry;
}

function ready(error, countries, disease) {
  if (error) throw error;

  let diseaseByCountry = makeObject(disease);

  // svg.select('g').remove();

  svg.append('g')
     .selectAll('.country')
     .data(countries.features)
     .enter()
     .append('path')
     .attr('d', path)
     .attr('class', 'country')
     .attr('fill', '#efefef')
     .attr('stroke', '#C0D3D9')
     .attr('stroke-width', 1)
     .transition().duration(500)
     .style('opacity', 1)
     .style('fill', function(d) {
       return color(diseaseByCountry[d.properties.name]);
     });

  mouseActions(diseaseByCountry);

  svg.exit().remove();
}

function legendSetup(disease) {
  svg.selectAll('g.legend').remove();

  let ultimateLegendLabels;
  let stat = document.getElementById('statdrop').value;
  let legend = svg.selectAll('g.legend')
                  .data(color.range().map(function(legendColor) {
                    let d = color.invertExtent(legendColor);
                    if (!d[0] && d[0] !== 0) d[0] = -1;
                    if (!d[1] && d[1] !== 0) d[1] = 100000;
                    return d;
                  }))
                  .enter().append('g')
                  .attr('class', 'legend');

  if (disease === 'aids' && stat === 'deaths') {
    ultimateLegendLabels = redDeathLegendLabels;
  } else if (disease === 'malaria' && stat === 'deaths') {
    ultimateLegendLabels = blueDeathLegendLabels;
  } else if (stat === 'population') {
    ultimateLegendLabels = orangeFrequencyLegendLabels;
  } else if (stat === 'healthspending') {
    ultimateLegendLabels = greenMoneyLegendLabels;
  }

  legend.append('rect')
        .attr('x', 20)
        .attr('y', function(d, i) {
           return height - (i * lsH) - 2*lsH;
        })
        .attr('width', lsW)
        .attr('height', lsH)
        .style('fill', function(d, i) {
          return color(d[0]);
        })
        .style('opacity', 0.8);

  legend.append('text')
        .attr('x', 50)
        .attr('y', function(d, i) {
          return height - i * lsH - lsH - 4;
        })
        .text(function(d, i) {
          return ultimateLegendLabels[i];
        });
}

let years = ['2000', '2005', '2010', '2015', '2016'];

d3.select('#timeslider').on('input', function() {
  mapSetup();
});

d3.select('#diseasedrop').on('change', function() {
  mapSetup();
});

d3.select('#statdrop').on('change', function() {
  mapSetup();
});

function mapSetup() {
  let statFilepath;
  const disease = document.getElementById('diseasedrop').value;
  const stat = document.getElementById('statdrop').value;
  selectColor(disease, stat);
  legendSetup(disease);
  const year = years[document.getElementById('timeslider').value];

  const deathFilepath = `data/${disease}_${year}_data.csv`;
  document.getElementById('year').innerHTML = year;

  if (stat === 'population') {
    statFilepath = `data/${stat}.csv`;
    updateWithPopulation(deathFilepath, statFilepath);
  } else if (stat === 'healthspending') {
    updateWithMoney();
  } else {
    update(deathFilepath);
  }
}

function selectColor(disease, stat) {
  if (stat === 'population') {
    color = d3.scaleThreshold()
              .domain(orangeFrequencyDomain)
              .range(orangeFrequencyColor);
  } else if (stat === 'healthspending') {
    color = d3.scaleThreshold()
              .domain(greenMoneyDomain)
              .range(greenMoneyColor);
  } else if (disease === 'malaria') {
    color = d3.scaleThreshold()
              .domain(blueDeathDomain)
              .range(blueDeathColor);
  } else if (disease === 'aids'){
    color = d3.scaleThreshold()
              .domain(redDeathDomain)
              .range(redDeathColor);
  }
}

function update(deathFilepath) {
  d3.queue()
  .defer(d3.csv, `${deathFilepath}`)
  .await(updateMap);
}

function updateWithMoney() {
  const year = years[document.getElementById('timeslider').value];
  d3.queue()
    .defer(d3.csv, 'data/healthspending.csv', function(d, i) {
      if (d.Year === year) return d;
    })
    .await(updateMap);
}

function updateWithPopulation(deathFilepath, statFilepath) {
  const year = years[document.getElementById('timeslider').value];
  d3.queue()
    .defer(d3.csv, `${deathFilepath}`)
    .defer(d3.csv, `${statFilepath}`, function(d) {
      if (d.Year === year) return d;
    })
    .await(updateMapWithPopulation);
}

function updateMapWithPopulation(error, disease, stats) {
  color = d3.scaleThreshold()
            .domain(orangeFrequencyDomain)
            .range(orangeFrequencyColor);

  let diseaseByCountry = makeObject(disease);

  let statsByCountry = makeObject(stats);

  svg.selectAll('path')
     .transition().duration(300)
     .style('opacity', 1)
     .style('fill', function(d) {
       return color(diseaseByCountry[d.properties.name]/statsByCountry[d.properties.name] * 10000);
     });

  mouseActions(diseaseByCountry, statsByCountry);
}

function updateMap(error, disease) {
  let objectByCountry = makeObject(disease);
  svg.selectAll('path')
     .transition().duration(300)
     .style('opacity', 1)
     .style('fill', function(d) {
       return color(objectByCountry[d.properties.name]);
 });
  mouseActions(objectByCountry);
}

function mouseActions(objectByCountry, statsByCountry) {
  // let objectByCountry = statsByCountry ? statsByCountry : objectByCountry;
  svg.selectAll('path')
     .on('mouseover', function(d, i) {
       const country = d.properties.name;
       let values = objectByCountry[country];
       if (statsByCountry) {
         values = objectByCountry[country] / statsByCountry[country] * 10000;
       }
       if (isNaN(values) || values === undefined || values < 0) {
         values = 'No data available';
     }
       d3.select(this)
         .transition().duration(300)
         .style('fill', 'yellow');
       tooltip.select('.label').html(country);
       tooltip.select('.values').html(values);
       tooltip.style('display', 'block');
  })
    .on('mouseout', function() {
      d3.select(this)
        .transition().duration(200)
        .style('fill', function(d) {
          if (statsByCountry) {
            return color(objectByCountry[d.properties.name]/statsByCountry[d.properties.name] * 10000);
          } else {
            return color(objectByCountry[d.properties.name]);
          }
        });
      tooltip.style('display', 'none');
  })
    .on('mousemove', function(d, i) {
      tooltip.style('top', (d3.event.layerY + 10) + 'px')
             .style('left', (d3.event.layerX + 10) + 'px');
   });
}
