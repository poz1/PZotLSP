import { PZotGraphItem } from './pzot-graph-resource';
import cytoscape = require('cytoscape');

export class Node {
    label: string = "";
    id: string = "";
    period: number;
    isParent: boolean;

    constructor(input: PZotGraphItem) {
        this.label = input.label;
        this.period = input.period;
        this.isParent = input.isParent;
    }

    public normalizePeriod(offset: number) {
        this.period += offset;
    }

    public toString() {
        console.log("Node: " + this.label + " ID: " + this.id + " Period: " + this.period + " isParent: " + this.isParent);
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

    private periods = 1;
    private width = 0;
    private height = 0;

    private nodeCount = 0;
    private maxPeriod = 0;
    private minPeriod = 0;

    private cy: any;
    private layout: any;

    public init(): string {
        let canvas = document.createElement("timeline");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.position = "inherit";
        canvas.id = "timeline";
        return canvas.outerHTML;
    }

    /**
     * recomputeGraph
     */
    public recomputeGraph() {
        let element = document.getElementById('timeline');
        if (element != null) {
            this.createGraph(element);
            this.redrawGraph();
        }
    }

    public redrawGraph() {
        let element = document.getElementById('timeline');
        if (element != null) {
            this.width = element.scrollWidth;
            this.height = element.scrollHeight;

            this.cy.resize();

            let gridOptions = {
                name: 'grid',
            
                fit: true, // whether to fit the viewport to the graph
                padding: 100, // padding used on fit
                boundingBox: { x1: 0, y1: 0, w: this.width - 100, h: this.height - 100 }, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
                avoidOverlapPadding: 10, // extra spacing around nodes when avoidOverlap: true
                nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
                spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
                condense: false, // uses all available space on false, uses minimal space on true
                rows: undefined, // force num of rows in the grid
                cols: this.periods, // force num of columns in the grid
                position: function( node: any ) { return {col: node.data("period"), row: undefined }}, // returns { row, col } for element
                sort: undefined, // a sorting function to order the nodes; e.g. function(a, b){ return a.data('weight') - b.data('weight') }
                animate: false, // whether to transition the node positions
                animationDuration: 500, // duration of animation in ms if enabled
                animationEasing: undefined, // easing of animation if enabled
                animateFilter: function ( node: any, i: any ) { return true; }, // a function that determines whether the node should be animated.  
                // All nodes animated by default on animate enabled.  
                // Non-animated nodes are positioned immediately when the layout starts
                ready: undefined, // callback on layoutready
                stop: undefined, // callback on layoutstop
                // transform: function (node, position ){ return position; } // transform a given node position. Useful for changing flow direction in discrete layouts 
            };
            
            this.layout = this.cy.layout(gridOptions);
            this.layout.run();
            this.cy.center();
        }
    }

    public addData(data: Array<PZotGraphItem>) {
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

    public normalizePeriods(offset: number) {
        this.nodes.forEach(node => {
            node.normalizePeriod( - offset);
        });
    }
    
    private createGraph(container: HTMLElement | null) {
        if (container != null) {

            this.periods = this.maxPeriod - this.minPeriod + 1;
            this.normalizePeriods(this.minPeriod);

            this.cy = cytoscape({
                container: container,
                
                zoomingEnabled: false,
                userZoomingEnabled: false,

                style: [
                {
                    selector: 'node',
                    style: {
                    'content': 'data(label)',
                    'text-opacity': 0.8,
                    'text-valign': 'center',
                    'text-halign': 'center',
                    // 'text-color': '#ffffff'
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
                this.nodes.forEach(node => {                        
                    this.cy.add({ 
                            data: {id : node.id, label: node.label, period: node.period, isParent: node.isParent }
                    });
                });

                this.edges.forEach(element => {
                    this.cy.add( { data: { source: element.source.id, target: element.target.id} });
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
        node.toString();

        node.id = this.nodeCount.toString();
        this.nodeCount ++;

        if (node.period > this.maxPeriod) {
            this.maxPeriod = node.period;
        }
        if (node.period < this.minPeriod) {
            this.minPeriod = node.period;
        }

        this.nodes.push(node);
    }

    public clear() {
        this.maxPeriod = 0;
        this.minPeriod = 0;
        this.nodeCount = 0;

        this.nodes = new Array<Node>();
        this.edges = new Array<Edge>();

        if (this.cy != undefined) {
            this.cy.elements().remove();
        }
    }
}