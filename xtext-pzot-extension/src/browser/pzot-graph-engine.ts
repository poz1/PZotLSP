import * as d3 from  'd3';
import { color, ValueFn } from 'd3';

export class PZotGraphEngine {

    protected readonly svg = d3.select("svg");
    protected readonly width = +this.svg.attr("width");
    protected readonly height = +this.svg.attr("height");

    protected readonly color = d3.scaleOrdinal(d3.schemeCategory10);

    private parseGraph(text: string): any {
        let regex = /(-p- \w)/g;
        let nodes = text.match(regex);

        if (nodes != null) {
            let node = this.svg.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(nodes)
                .enter().append("circle")
                .attr("r", 5);
                // .attr("fill", d => return color(d.group); });
                // .call(d3.drag()
                //     .on("start", dragstarted)
                //     .on("drag", dragged)
                //     .on("end", dragended));

        }
    }

    public render(text: string): string {

        //this.parseGraph(text);

        // let simulation = d3.forceSimulation()
        //     .force("link", d3.forceLink().id(function(d) { return d.id; }))
        //     .force("charge", d3.forceManyBody())
        //     .force("center", d3.forceCenter(width / 2, height / 2));

        // d3.json("miserables.json", function(error, graph) {
        //   if (error) throw error;

        //   let link = svg.append("g")
        //       .attr("class", "links")
        //     .selectAll("line")
        //     .data(graph.links)
        //     .enter().append("line")
        //       .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

        

        //   node.append("title")
        //       .text(function(d) { return d.id; });

        //   simulation
        //       .nodes(graph.nodes)
        //       .on("tick", ticked);

        //   simulation.force("link")
        //       .links(graph.links);

        //   function ticked() {
        //     link
        //         .attr("x1", function(d) { return d.source.x; })
        //         .attr("y1", function(d) { return d.source.y; })
        //         .attr("x2", function(d) { return d.target.x; })
        //         .attr("y2", function(d) { return d.target.y; });

        //     node
        //         .attr("cx", function(d) { return d.x; })
        //         .attr("cy", function(d) { return d.y; });
        //   }
        // });

        // function dragstarted(d) {
        //   if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        //   d.fx = d.x;
        //   d.fy = d.y;
        // }

        // function dragged(d) {
        //   d.fx = d3.event.x;
        //   d.fy = d3.event.y;
        // }

        // function dragended(d) {
        //   if (!d3.event.active) simulation.alphaTarget(0);
        //   d.fx = null;
        //   d.fy = null;
        // }

        return "<svg width='100%' height='100%'></svg>";
    }
}