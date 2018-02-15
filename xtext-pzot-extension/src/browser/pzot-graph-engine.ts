import * as d3 from  'd3';
import { color, ValueFn, SimulationLinkDatum, Numeric } from 'd3';

import '../../src/browser/style/index.css';

export class PZotGraphEngine {

    protected canvas: HTMLElement ;
    protected graph: any ;
    protected simulation: any ;

    protected  width: number;
    protected  height: number ;
    protected  color: any;

    private link: any;
    private node: any;
    private packLayout: any;

    // Dependency Tree Structure
    private data = {
        "name": "A1",
        "children": [
          {
            "name": "B1",
            "children": [
              {
                "name": "C1",
                "value": 100
              },
              {
                "name": "C2",
                "value": 300
              },
              {
                "name": "C3",
                "value": 200
              }
            ]
          },
          {
            "name": "B2",
            "value": 200
          }
        ]
      }

    private root = d3.hierarchy(this.data);

    constructor() {
        this.color = d3.scaleOrdinal(d3.schemeCategory10);

    }

    private generateCicrle(): void {
        this.packLayout = d3.pack();
        this.packLayout.size([300, 300]);

        this.root.sum(function(d: any) {
            return d.value;
          });

        this.packLayout(this.root);

        d3.select('svg g')
            .selectAll('circle')
            .data(this.root.descendants())
            .enter()
            .append('circle')
            .attr('cx', function(d: any) { return d.x; })
            .attr('cy', function(d: any) { return d.y; })
            .attr('r', function(d: any) { return d.r; })

        let nodes = this.graph
            .selectAll('g')
            .data(this.root.descendants())
            .enter()
            .append('g')
            .attr('transform', function(d: any) {return 'translate(' + [d.x, d.y] + ')'})

        nodes.append('circle')
            .attr('r', function(d: any) { return d.r; })

        nodes.append('text')
            .attr('dy', 4)
            .text(function(d: any) {
              return d.children === undefined ? d.data.name : '';
            })

        this.packLayout.padding(10)
    }

    public render(text: string): string {

        this.canvas = document.createElement("svg");
        this.canvas.setAttribute("height", "500px");
        this.canvas.setAttribute("width", "500px");

        this.graph = d3.select(this.canvas);

        this.generateCicrle();

        console.log(this.canvas.outerHTML);
        return this.canvas.outerHTML;
    }
}