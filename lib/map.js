import * as d3 from 'd3';
import { countriesJson } from '../data/countries';

const width = 1000;
const height = 600;

const svg = d3.select('#map')
              .append('svg')
              .attr('width', width)
              .attr('height', height)
              .append('g');

const projection = d3.geoMercator()
                   .translate([width/2, height/2]);

const path = d3.geoPath()
             .projection(projection);

svg.selectAll('.country')
   .data(countriesJson.features)
   .enter()
   .append('path')
   .attr('fill', '#efefef')
   .attr('stroke', '#999')
   .attr('class', 'country')
   .attr('d', path)
   .on('mouseover', function(d, i) {
     d3.select(this)
     .attr('fill', 'yellow');
     })
    .on('mouseleave', function(d, i) {
      d3.select(this)
      .attr('fill', '#efefef');
    });
