import * as d3 from 'd3';

const width = 1000;
const height = 600;

const svg = d3.select('#map')
              .append('svg')
              .attr('width', width)
              .attr('height', height);
              // .append('g');

const projection = d3.geoMercator()
                   .translate([width/2, height/2]);

const path = d3.geoPath()
             .projection(projection);

const color = d3.scaleThreshold()
   .domain([0, 500, 1000, 5000, 10000, 20000])
   .range(["#efefef", "#f7bbcb", "#fc99b4", "#ff668f", "#fc2d64"]);


// d3.queue()
//   .defer(d3.json, '../data/countries.geo.json')
//   .defer(d3.csv, '../data/aids_date_data.csv')
//   .await(ready);

function ready(error, countries, disease) {
  if (error) throw error;
  console.log('inside ready');
  console.log(disease);
  let diseaseByCountry = {};

  disease.forEach(function(d) {
    let death = Number(d.death_2016);
    if (isNaN(death)) {
      death = -1;
    }
    diseaseByCountry[d.Country] = death;
  });

  console.log(diseaseByCountry);
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

update('../data/aids_date_data.csv');

// let inputValue = null;
// let year = ['2016', '2010', '2005', '2000'];

d3.select('#timeslider').on('input', function() {
  console.log('insideeeee');
  update('../data/malaria_date_data.csv');
});
//
// function update(value) {
//   document.getElementById('year').innerHTML = year[value];
//   inputValue = year[value];
//   console.log('update', inputValue);
// }
