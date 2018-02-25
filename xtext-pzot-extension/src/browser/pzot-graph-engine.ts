import * as d3 from  'd3';
import { color, ValueFn, SimulationLinkDatum, Numeric } from 'd3';

import '../../src/browser/style/index.css';
import '../../src/browser/style/vis.min.css';
import cytoscape = require('cytoscape');
import vis = require('vis');
import { PZotGraphItem } from './pzot-graph-resource';


export class Node {
    label: string = "";

    constructor(input: PZotGraphItem) {
        this.label = input.label;
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

    private nodes = new Array<Node>();
    private edges = new Array<Edge>();


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
    
    private createGraph(container: HTMLElement | null) {
        if (container != null) {
            console.log(container);
            console.log(this.nodes);

            let cy = cytoscape({
                container: container,
        
                style: [
                {
                    selector: 'node',
                    style: {
                    'content': 'data(id)',
                    'text-opacity': 0.5,
                    'text-valign': 'center',
                    'text-halign': 'right'
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
                this.nodes.forEach(element => {
                        cy.add({ data: { id: element.label } });
                });

                this.edges.forEach(element => {
                    cy.add( { data: { source: element.source.label, target: element.target.label} });
                });
            
                cy.center();
            } catch (error) {
                console.log(error);
            }
        }   
    }
        

    public addEdge(edge: Edge): void {
        this.edges.push(edge);
    }

    public addNode(node: Node): void {
        this.nodes.push(node);
    }

    public getNode(index: number): Node {
        return this.nodes[index];
    }

    public clear() {
        this.nodes = new Array<Node>();
        this.edges = new Array<Edge>();
    }
}