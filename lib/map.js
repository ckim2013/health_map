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

  svg.select('g').remove();

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

    svg.exit().remove();
}

function firstMap(dataSet) {
  d3.queue()
  .defer(d3.json, '../data/countries.geo.json')
  .defer(d3.csv, `${dataSet}`)
  .await(ready);
}

firstMap('../data/aids_2000_data.csv');

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
