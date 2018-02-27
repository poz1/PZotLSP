import { PZotGraphItem, PZotGraphResource } from './pzot-graph-resource';
import cytoscape = require('cytoscape');
import edgehandles from 'cytoscape-edgehandles';

export class PZotGraph {
    nodes = new Array<Node>();
    edges = new Array<Edge>();
}

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

    private resource: PZotGraphResource;
    private graph = new PZotGraph();
    private periods = 1;
    private width = 0;
    private height = 0;

    private nodeCount = 0;
    private maxPeriod = 0;
    private minPeriod = 0;
    private isNormalizedMode = false;

    private cy: any;
    private layout: any;
    private mousetrap: any;


    public init(resource: PZotGraphResource): string {
        this.resource = resource;
        this.mousetrap = require('mousetrap');

        let container = document.createElement("div");
        
        let canvas = document.createElement("div");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.position = "inherit";
        canvas.id = "timeline";

        let updateButton = document.createElement("button");
        updateButton.addEventListener("click", (e: Event) => this.updateDependecies());
        updateButton.className = "theia-button";
        
        container.appendChild(canvas);
        // container.appendChild(canvas);
        container.style.position = "inherit";

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
            this.cy.fit();
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
        this.graph.nodes.forEach(node => {
            node.normalizePeriod( - offset);
        });
    }
    
    private createGraph(container: HTMLElement | null) {
        if (container != null) {

            this.periods = this.maxPeriod - this.minPeriod + 1;
            
            this.normalizePeriods(this.minPeriod);
            this.isNormalizedMode = true;

            let cytoscape = require('cytoscape');
            let edgehandles = require('cytoscape-edgehandles');

            cytoscape.use( edgehandles ); // register extension

            let jquery = require('jquery');
            let contextMenus = require('cytoscape-context-menus');
            
            let popper = require('cytoscape-popper');

            cytoscape.use( popper ); // register extension

            contextMenus( cytoscape, jquery ); // register extension

            this.cy = cytoscape({
                container: container,
                
                zoomingEnabled: false,
                userZoomingEnabled: false,
                //userPanningEnabled: false,

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
                },
                {
                    selector: '.eh-handle',
                    style: {
                        'background-color': 'red',
                        'width': 12,
                        'height': 12,
                        'shape': 'ellipse',
                        'overlay-opacity': 0,
                        'border-width': 12, // makes the handle easier to hit
                        'border-opacity': 0
                    }
                },
                {
                    selector: '.eh-hover',
                    style: {
                        'background-color': 'red'
                    }
                },
                {
                    selector: '.eh-source',
                    style: {
                        'border-width': 2,
                        'border-color': 'red'
                    }
                },
                {
                    selector: '.eh-target',
                    style: {
                        'border-width': 2,
                        'border-color': 'red'
                    }
                },
                {
                    selector: '.eh-preview, .eh-ghost-edge',
                    style: {
                        'background-color': 'red',
                        'line-color': 'red',
                        'target-arrow-color': 'red',
                        'source-arrow-color': 'red'
                    }
                }
                ],
            });

            // the default values of each option are outlined below:
            let defaults = {
                preview: true, // whether to show added edges preview before releasing selection
                hoverDelay: 150, // time spent hovering over a target node before it is considered selected
                handleNodes: 'node', // selector/filter function for whether edges can be made from a given node
                handlePosition: function( node: any ) {
                return 'middle top'; // sets the position of the handle in the format of "X-AXIS Y-AXIS" such as "left top", "middle top"
                },
                handleInDrawMode: false, // whether to show the handle in draw mode
                edgeType: function( sourceNode: any, targetNode: any ) {
                // can return 'flat' for flat edges between nodes or 'node' for intermediate node between them
                // returning null/undefined means an edge can't be added between the two nodes
                return 'flat';
                },
                loopAllowed: function( node: any ) {
                // for the specified node, return whether edges from itself to itself are allowed
                return false;
                },
                nodeLoopOffset: -50, // offset for edgeType: 'node' loops
                nodeParams: function( sourceNode: any, targetNode: any ) {
                // for edges between the specified source and target
                // return element object to be passed to cy.add() for intermediary node
                return {};
                },
                edgeParams: function( sourceNode: any, targetNode: any, i: any ) {
                // for edges between the specified source and target
                // return element object to be passed to cy.add() for edge
                // NB: i indicates edge index in case of edgeType: 'node'
                return {};
                },
                complete: this.onNewEdge.bind(this)
            };

            let eh = this.cy.edgehandles( defaults );

            let menuOptions = {
                // List of initial menu items
                menuItems: [
                  {
                    id: 'remove', // ID of menu item
                    content: 'remove', // Display content of menu item
                    tooltipText: 'remove', // Tooltip text for menu item
                    //image: {src : "remove.svg", width : 12, height : 12, x : 6, y : 4}, // menu icon
                    // Filters the elements to have this menu item on cxttap
                    // If the selector is not truthy no elements will have this menu item on cxttap
                    selector: 'node, edge', 
                    onClickFunction: function () { // The function to be executed on click
                      console.log('remove element');
                    },
                    disabled: false, // Whether the item will be created as disabled
                    show: false, // Whether the item will be shown or not
                    hasTrailingDivider: true, // Whether the item will have a trailing divider
                    coreAsWell: false // Whether core instance have this item on cxttap
                  },
                 /* {
                    id: 'hide',
                    content: 'hide',
                    tooltipText: 'hide',
                    selector: 'node, edge',
                    onClickFunction: function () {
                      console.log('hide element');
                    },
                    disabled: true
                  },*/
                  {
                    id: 'add-node',
                    content: 'add node',
                    tooltipText: 'add node',
                    //image: {src : "add.svg", width : 12, height : 12, x : 6, y : 4},
                    selector: 'node',
                    coreAsWell: true,
                    onClickFunction: function () {
                      console.log('add node');
                    }
                  }
                ],
                // css classes that menu items will have
                // menuItemClasses: [
                //   // add class names to this list
                // ],
                // // css classes that context menu will have
                // contextMenuClasses: [
                //   // add class names to this list
                // ]
            };

            //this.cntxMenu = this.cy.contextMenus( menuOptions );

            try {
                this.graph.nodes.forEach(node => {                        
                    this.cy.add({ 
                            data: {id : node.id, label: node.label, period: node.period, isParent: node.isParent }, selectable: false
                    });
                });

                this.graph.edges.forEach(element => {
                    this.cy.add( { data: { source: element.source.id, target: element.target.id}, selectable: false});
                });

                this.cy.on('drag', 'node', this.onChangingPeriod.bind(this));
                //this.cy.on('click', 'node',  this.editNodeLabel.bind(this));
                this.cy.on('click', this.createNewNode.bind(this));
                this.cy.on('cxttap',  this.deleteNode.bind(this));
                //this.cy.on('cxttap', 'node',  this.updateDependecies.bind(this));

            } catch (error) {
                console.log(error);
            }
        }   
    }

    /**
     * editNodeLabel
     */
    public editNodeLabel(event: cytoscape.EventObject) {
        console.log("editLabel!");
        let target = this.graph.nodes.find(x => x.id == event.target.id().toString());
            let popper1 = event.target.popper({
                content: () => {
                        let div = document.createElement('div');

                        if (target != undefined) {

                        let form = document.createElement("form");

                        form.innerHTML = target.label;
                        div.appendChild(form);
                        document.body.appendChild(div);
                    }
                    return div;
                },
                popper: {} // my popper options here
            });
    }

    /**
     * deleteNode
     */
    public deleteNode(event: cytoscape.EventObject) {
        console.log("deleteeee");
        let target = this.graph.nodes.find(x => x.id == event.target.id().toString());
        
        if (target != undefined) {
            this.graph.nodes.splice(this.graph.nodes.indexOf(target));
        }

        this.recomputeGraph();
    }

    /**
     * createNewNode
     */
    public createNewNode(event: cytoscape.EventObject) {
        //if (!event.target.isNode()) {   
            console.log("new node!");
            let node = new PZotGraphItem("undefined");

            let periodSize = (this.width / this.periods); 
            let newPeriod = Math.round(event.position.x / periodSize);

            node.period = newPeriod;
            console.log(newPeriod);

            this.addNode(new Node(node));
            this.recomputeGraph();

        //}
    }

    public onChangingPeriod(event: cytoscape.EventObject) {
        let node = event.target;
        let periodSize = (this.width / this.periods); 
        let newPeriod = Math.round(node.position().x / periodSize);

        this.graph.nodes[node.id()].period = newPeriod;

        if (!this.isNormalizedMode) { 
            this.graph.nodes[node.id()].period += this.minPeriod;
        }

        //TODO: bottoncino
        //this.updateDependecies();
    }

    public onNewEdge(sourceNode: any, targetNode: any, addedEles: any ) {

        let source = this.graph.nodes.find(x => x.id == sourceNode.id().toString());
        let target = this.graph.nodes.find(x => x.id == targetNode.id().toString());

        if (source != undefined && target != undefined) {
            this.graph.edges.push(new Edge(source, target));
        }
    }

    public updateDependecies() {
        console.log("Updating!");
        if (this.isNormalizedMode) {
            this.normalizePeriods( - this.minPeriod);
            this.isNormalizedMode = false;
        }

        this.resource.graphToDependecies(this.graph);
    }

    public addEdge(edge: Edge): void {
        this.graph.edges.push(edge);
    }

    public addNode(node: Node): void {
        node.toString();

        node.id = this.nodeCount.toString();
        console.log("adding node " + node.label + "with id: " + node.id);
        this.nodeCount ++;

        if (node.period > this.maxPeriod) {
            this.maxPeriod = node.period;
        }
        if (node.period < this.minPeriod) {
            this.minPeriod = node.period;
        }

        this.graph.nodes.push(node);
    }

    public clear() {
        this.maxPeriod = 0;
        this.minPeriod = 0;
        this.nodeCount = 0;

        this.graph.nodes = new Array<Node>();
        this.graph.edges = new Array<Edge>();

        if (this.cy != undefined) {
            this.cy.elements().remove();
        }
    }
}