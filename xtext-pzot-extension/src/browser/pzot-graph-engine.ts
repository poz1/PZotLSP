import * as d3 from  'd3';
import { color, ValueFn, SimulationLinkDatum, Numeric } from 'd3';

import '../../src/browser/style/index.css';
import '../../src/browser/style/vis.min.css';
import cytoscape = require('cytoscape');
import vis = require('vis');
import { PZotGraphItem } from './pzot-graph-resource';


export class Node {
    label: string = "";
    id: string = "";
    period: number;
    
    constructor(input: PZotGraphItem) {
        this.label = input.label;
        this.period = input.period;
    }
}

export class Edge {
    source: Node;
    target: Node;

    constructor(source: Node, target: Node) {
        this.source = source;
        this.target = target;
    }
}

 export class PZotGraphEngine {

    private nodes = new Map<number, Array<Node>>();
    private edges = new Array<Edge>();

    private periods = 1;
    private width = 0;
    private height = 0;

    private nodeCount = 0;
    private maxPeriod = 0;
    private minPeriod = 0;

    public render(): string {
        let canvas = document.createElement("timeline");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.position = "inherit";
        canvas.id = "timeline";
        return canvas.outerHTML;
    }

    public reloadGraph() {
        let element = document.getElementById('timeline');
        if (element != null) {
            this.createGraph(element);
        }
    }

    public setData(data: Array<PZotGraphItem>) {
        data.forEach(element => {
            let parent = new Node(element)
            this.addNode(parent);

            element.getChildren().forEach(child => {
                let childNode = new Node(child);
                this.addNode(childNode);
                this.addEdge(new Edge(parent, childNode));
            });
        });   
    }

    public setTimelineLayout(periods: number) {

    }
    
    private createGraph(container: HTMLElement | null) {
        if (container != null) {

            this.width = container.scrollWidth;
            this.height = container.scrollHeight;

            this.periods = this.maxPeriod - this.minPeriod + 1;
            let cy = cytoscape({
                container: container,
        
                style: [
                {
                    selector: 'node',
                    style: {
                    'content': 'data(id)',
                    'text-opacity': 0.8,
                    'text-valign': 'center',
                    'text-halign': 'bottom',
                    'text-color': '#FFFFFF'
                    }
                },
            
                {
                    selector: 'edge',
                    style: {
                    'curve-style': 'bezier',
                    'width': 4,
                    'target-arrow-shape': 'triangle'
                    // 'line-color': '#9dbaea',
                    // 'target-arrow-color': '#9dbaea'
                    }
                }
                ],
            });

            try {
                this.nodes.forEach(period => {
                    period.forEach(element => {
                        cy.add({ data: { 
                            id : element.id, 
                            position : {
                                x : (this.width / this.periods) * element.period, 
                                y: 0} 
                            }, 
                            scatch: element.label 
                        });
                    });
                });

                this.edges.forEach(element => {
                    cy.add( { data: { source: element.source.id, target: element.target.id} });
                });
            
            } catch (error) {
                console.log(error);
            }
        }   
    }
        

    public addEdge(edge: Edge): void {
        this.edges.push(edge);
    }

    public addNode(node: Node): void {
        node.id = this.nodeCount.toString();
        this.nodeCount ++;

        let period = this.nodes.get(node.period)
        if (period == undefined) {
            this.nodes.set(node.period, new Array<Node>());

            if (node.period > this.maxPeriod) {
                this.maxPeriod = node.period;
            }
            if (node.period < this.minPeriod) {
                this.minPeriod = node.period;
            }
        }
         
        period = this.nodes.get(node.period)
        if (period != undefined) {
            period.push(node);
        }
    }


    // public getNode(index: number): Node {
    //     return this.nodes[index];
    // }

    public clear() {
        this.nodes.clear();
        this.edges = new Array<Edge>();
    }
}