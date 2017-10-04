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

let color = d3.scaleThreshold()
   .domain([0, 500, 5000, 10000, 50000, 100000])
   .range(["#efefef", "#f7bbcb", "#fc99b4", "#ff668f", "#fc2d64"]);

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

  svg.append('g')
     .selectAll('.country')
     .data(countries.features)
     .enter()
     .append('path')
     .attr('class', 'country')
     .attr('fill', '#efefef')
     .attr('stroke', 'white')
     .attr('d', path)
     .style('fill', function(d) {
       return color(diseaseByCountry[d.properties.name]);
    })
     .on('mouseover', function(d, i) {
       d3.select(this)
        //  .transition().duration(300).style('opacity', 1)
         .style('fill', 'yellow');
    })
     .on('mouseleave', function(d, i) {
       d3.select(this)
         .style('fill', color(diseaseByCountry[d.properties.name]));
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

function update(dataSet) {
  d3.queue()
  .defer(d3.json, '../data/countries.geo.json')
  .defer(d3.csv, `${dataSet}`)
  .await(ready);
}

update('../data/malaria_2015_data.csv');

function selectColor(disease) {
  if (disease === 'malaria') {
    color = d3.scaleThreshold()
    .domain([0, 500, 5000, 10000, 50000, 100000])
    .range(["#efefef", "#5F8FC5", "#3B73B1", "#1C5EA6", "#0B478A"]);
  } else {
    color = d3.scaleThreshold()
    .domain([0, 500, 5000, 10000, 50000, 100000])
    .range(["#efefef", "#f7bbcb", "#fc99b4", "#ff668f", "#fc2d64"]);
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

let years = ['2016', '2015', '2010', '2005', '2000'];

d3.select('#timeslider').on('input', function() {
  mapSetup();
});

d3.select('#diseasedrop').on('change', function() {
  mapSetup();
});
