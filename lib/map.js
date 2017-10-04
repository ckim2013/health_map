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

const redColor = ["#edeced", "#FF8E8B", "#DE5855", "#A11B17", "#780300"];
const redDomain = [0, 500, 5000, 10000, 50000, 100000];
const blueColor = ["#edeced", "#7070B7", "#4A4A9C", "#1F1F70", "#0C0C54"];
const blueDomain = [0, 100, 5000, 10000, 30000, 100000];

let color = d3.scaleThreshold()
   .domain(redDomain)
   .range(redColor);

const tooltip = d3.select('#map')
                  .append('div')
                  .attr('class', 'tooltip');
tooltip.append('div')
       .attr('class', 'label');
tooltip.append('div')
       .attr('class', 'deaths');


function ready(error, countries, disease) {
  if (error) throw error;
  let diseaseByCountry = {};

  disease.forEach(function(d) {
    let death = Number(d.deaths);
    if (isNaN(death)) {
      death = -1;
    }
    diseaseByCountry[d.Country] = death;
  });

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
     .transition().duration(500)
     .style('opacity', 1)
     .style('fill', function(d) {
       return color(diseaseByCountry[d.properties.name]);
    });

    svg.selectAll('path')
     .on('mouseover', function(d, i) {
       const country = d.properties.name;
       let deaths = diseaseByCountry[d.properties.name];
       if (deaths === -1 || deaths === undefined ) {
         deaths = 'No data available';
       }
       d3.select(this)
         .transition().duration(300)
         .style('fill', 'yellow');
       tooltip.select('.label').html(country);
       tooltip.select('.deaths').html(deaths);
       tooltip.style('display', 'block');
    })
     .on('mouseout', function(d, i) {
       d3.select(this)
         .transition().duration(200)
         .style('fill', color(diseaseByCountry[d.properties.name]));
      tooltip.style('display', 'none');
    })
     .on('mousemove', function(d, i) {
       tooltip.style('top', (d3.event.layerY + 10) + 'px')
              .style('left', (d3.event.layerX + 10) + 'px');
     })
     .on('click', function(d, i) {
       if (diseaseByCountry[d.properties.name] === -1) {
         alert(`No reported data for ${d.properties.name}`);
      } else {
         alert(`${d.properties.name} had ${diseaseByCountry[d.properties.name]} deaths`);
      }
    });

    // svg.exit().remove();
}

// Function to render the map for the very first time
function firstMap(dataSet) {
  d3.queue()
  .defer(d3.json, '../data/countries.geo.json')
  .defer(d3.csv, `${dataSet}`)
  .await(ready);
}

// Making the legend
let legend = svg.selectAll('g.legend')
                .data(color.range().map(function(legendColor) {
                  console.log('color range', color.range());
                  let d = color.invertExtent(legendColor);
                  console.log('before d', d);
                  if (!d[0] && d[0] !== 0) d[0] = -1;
                  if (!d[1] && d[1] !== 0) d[1] = 100000;
                  console.log('after d', d);
                  return d;
                }))
                .enter().append('g')
                .attr('class', 'legend');

const lsW = 20;
const lsH = 20;
const legendLabels = ["< 500", "500 - 5000", "5000 - 10000", "10000 - 50000", "> 50000"];

function legendSetup(disease) {
  legend.select('rect').remove();

  legend.append('rect')
  .attr('x', 20)
  .attr('y', function(d, i) {
    return height - (i * lsH) - 2*lsH;
  })
  .attr('width', lsW)
  .attr('height', lsH)
  .style('fill', function(d, i) {
    console.log(d);
    return color(d[0]);
  })
  .style('opacity', 0.8);

  legend.append('text')
  .attr('x', 50)
  .attr('y', function(d, i) {
    return height - i * lsH - lsH - 4;
  })
  .text(function(d, i) {
    console.log('inside text', d);
    return legendLabels[i];
  });
}

// Making the map and legend appear first!
firstMap('../data/aids_2000_data.csv');
legendSetup('malaria');

function selectColor(disease) {
  if (disease === 'malaria') {
    color = d3.scaleThreshold()
    .domain(blueDomain)
    .range(blueColor);
  } else {
    color = d3.scaleThreshold()
    .domain(redDomain)
    .range(redColor);
  }
}

function mapSetup() {
  const disease = document.getElementById('diseasedrop').value;
  selectColor(disease);
  legendSetup(disease);
  const year = years[document.getElementById('timeslider').value];
  const filepath = `../data/${disease}_${year}_data.csv`;
  document.getElementById('year').innerHTML = year;
  update(filepath);
}

let years = ['2000', '2005', '2010', '2015', '2016'];

d3.select('#timeslider').on('input', function() {
  mapSetup();
});

d3.select('#diseasedrop').on('change', function() {
  mapSetup();
});

function update(filepath) {
  d3.queue()
    .defer(d3.csv, `${filepath}`)
    .await(updateMap);
}

function updateMap(error, disease) {
  console.log(disease);
  let diseaseByCountry = {};
  disease.forEach(function(d) {
    let death = Number(d.deaths);
    if (isNaN(death)) {
      death = -1;
    }
    diseaseByCountry[d.Country] = death;
  });

  svg.selectAll('path')
  .transition().duration(300)
  .style('opacity', 1)
  .style('fill', function(d) {
    return color(diseaseByCountry[d.properties.name]);
 });
}
