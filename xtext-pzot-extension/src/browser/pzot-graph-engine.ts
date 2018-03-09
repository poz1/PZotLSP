import { PZotGraphItem, PZotGraphResource } from './pzot-graph-resource';
import cytoscape = require('cytoscape');
import edgehandles from 'cytoscape-edgehandles';
import '../../src/browser/style/cytoscape-context-menu.css';
import tippy = require('tippy.js');

export class PZotGraph {
    private nodesList = new Array<Node>();

    nodes = new Map<string, Map<string, Node>>();
    edges = new Array<Edge>();
    isDirty = true;

    public getNodesList(): Array<Node> {
        let result = new Array<Node>();

        if (this.isDirty) {
            this.nodes.forEach(period => {
                period.forEach(node => {
                    result.push(node);
                });
            });
    
            this.nodesList = result;
            this.isDirty = false;
        } else {
            result = this.nodesList;
        }

        return result;
    }

    public getNode(period: string, label: string): Node | undefined {
        let nodesByPeriod = this.nodes.get(period);
        if (nodesByPeriod) {
            return nodesByPeriod.get(label);
        }
    }

    /**
     * renameNode
     */
    public renameNode(period: string, label: string, newLabel: string) {
        let nodesByPeriod = this.nodes.get(period);
        if (nodesByPeriod) {
            let node = nodesByPeriod.get(label);
            
            if (node) {
                node.label = newLabel;
                this.isDirty = true;
            }
        }
    }

    public getEdge(source?: Node, target?: Node): Edge | Array<Edge> {        
        if (source && target) {
            this.edges.forEach(edge => {
                if (edge.source == source && edge.target == target) {
                    return edge;
                }
            });
        }

        let result = new Array<Edge>();

        if (source) {
            this.edges.forEach(edge => {
                if (edge.source == source) {
                    result.push(edge);
                }
            });
        }

        if (target) {
            this.edges.forEach(edge => {
                if (edge.target == target) {
                    result.push(edge);
                }
            });
        }

        return result;
    }

    public removeNode(period: string, label: string): void {
        let nodesByPeriod = this.nodes.get(period);
        if (nodesByPeriod) {
            nodesByPeriod.delete(label);
            this.isDirty = true;
        }
    }

    public removeEdge(source: Node, target: Node): void {
        let edge;
        this.edges.forEach(item => {
            if (item.source == source && item.target == target) {
                edge = item;
            }
        });
        
        if (edge) {
            this.edges.splice(this.edges.indexOf(edge), 1);
        }
    }

    public clear() {
        this.nodes = new Map<string, Map<string, Node>>();
        this.edges = new Array<Edge>();
        this.isDirty = true;
    }
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

class Popup {
    private popper: any;
    private input: HTMLInputElement;
    private div: HTMLElement;
    
    constructor(popper: any, containerDiv: HTMLElement, inputBox: HTMLInputElement) {
        this.popper = popper;
        this.div = containerDiv;
        this.input = inputBox;
    }

    /**
     * getLabel
     */
    public getLabel() {
        return this.input.value;
    }

    /**
     * dismiss
     */
    public dismiss() {
        console.log(this.div);
        this.popper.destroy();
        document.getElementsByTagName("BODY")[0].removeChild(this.div);
    }
}

export class PZotGraphEngine {

    private resource: PZotGraphResource | undefined;
    private graph = new PZotGraph();
    private periods = 1;
    private width = 0;
    private height = 0;

    private nodeCount = 0;
    private maxPeriod = 0;
    private minPeriod = 0;
    private isNormalizedMode = false;

    private cytoscapeEngine: any;
    private layout: any;
    private mousetrap: any;

    private contextMenu: any;
    private popus = new Map<string, Popup>();

    constructor() {
        this.initializeCytoscapePlugins();
    }

    /**
    * Creates the DOM element there the graph will be rendered
    * @param resource  The resource that is initializating the container.
    * @returns HTML code of the DOM container.
    */
    private initializeCytoscapePlugins() {
        let cytoscape = require('cytoscape');
        let edgehandles = require('cytoscape-edgehandles');
        let jquery = require('jquery');
        let contextMenus = require('cytoscape-context-menus');
        let cytoPopper = require('cytoscape-popper');
            
        cytoscape.use( edgehandles ); // register extension
        cytoscape.use( cytoPopper ); // register extension
        contextMenus( cytoscape, jquery ); // register extension
    }

    private initializeDoubleArrowShape() {
        // defineArrowShape( 'double-arrow', {
        //         points: [
        //           -0.15, -0.3,
        //           0, 0,
        //           0.15, -0.3,
        //           -0.15, -0.3
        //         ],
            
        //         pointsSecond: [
        //           0, -0.3,
        //           0.15, -0.6,
        //           -0.15, -0.6
        //         ],
            
        //         collide: function( x: any, y, size, angle, translation, padding ){
        //           var triPts = pointsToArr( transformPoints( this.points, size  2 * padding, angle, translation ) );
        //           var teePts = pointsToArr( transformPoints( this.pointsSecond, size  2 * padding, angle, translation ) );
            
        //           var inside = math.pointInsidePolygonPoints( x, y, triPts ) || math.pointInsidePolygonPoints( x, y, teePts );
            
        //           return inside;
        //         },
            
        //         draw: function( context, size, angle, translation ){
        //           var triPts = transformPoints( this.points, size, angle, translation );
        //           var teePts = transformPoints( this.pointsSecond, size, angle, translation );
            
        //           renderer.arrowShapeImpl( this.name )( context, triPts, teePts );
        //         }
        //       } );
    }
    /**
    * Creates the DOM element there the graph will be rendered
    * @param resource  The resource that is initializating the container.
    * @returns HTML code of the DOM container.
    */
    private initializeGraphEngine() {
        console.log("1.1 Initialiazing Graph Engine");

        let container = document.getElementById('timeline');
        if (container != null) {

            this.cytoscapeEngine = cytoscape({
                container: container,
                zoomingEnabled: false,
                userZoomingEnabled: false,
                // userPanningEnabled: false,

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
                    'curve-style': 'unbundled-bezier',
                    'width': 4,
                    'target-arrow-shape': 'triangle-backcurve'
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

                let eh = this.cytoscapeEngine.edgehandles( defaults );

                let menuOptions = {
                    // List of initial menu items
                    menuItems: [
                        {
                            id: 'rename', // ID of menu item
                            content: 'rename', // Display content of menu item
                            tooltipText: 'rename', // Tooltip text for menu item
                            // image: {src : "remove.svg", width : 12, height : 12, x : 6, y : 4}, // menu icon
                            // Filters the elements to have this menu item on cxttap
                            // If the selector is not truthy no elements will have this menu item on cxttap
                            selector: 'node', 
                            onClickFunction: this.renameGraphNode.bind(this),
                            disabled: false, // Whether the item will be created as disabled
                            show: true, // Whether the item will be shown or not
                            hasTrailingDivider: true, // Whether the item will have a trailing divider
                            coreAsWell: false // Whether core instance have this item on cxttap
                        },
                    {
                        id: 'remove', // ID of menu item
                        content: 'remove', // Display content of menu item
                        tooltipText: 'remove', // Tooltip text for menu item
                        // image: {src : "remove.svg", width : 12, height : 12, x : 6, y : 4}, // menu icon
                        // Filters the elements to have this menu item on cxttap
                        // If the selector is not truthy no elements will have this menu item on cxttap
                        selector: 'node, edge', 
                        onClickFunction: this.deleteGraphElement.bind(this),
                        disabled: false, // Whether the item will be created as disabled
                        show: true, // Whether the item will be shown or not
                        hasTrailingDivider: true, // Whether the item will have a trailing divider
                        coreAsWell: false // Whether core instance have this item on cxttap
                    },
                    {
                        id: 'add-node',
                        content: 'add node',
                        tooltipText: 'add node',
                        // image: {src : "add.svg", width : 12, height : 12, x : 6, y : 4},
                        selector: '',
                        coreAsWell: true,
                        onClickFunction: this.addGraphNode.bind(this)
                    }
                    ]
                };

                this.contextMenu = this.cytoscapeEngine.contextMenus( menuOptions );
                
            console.log("2. GraphEngineReady")
        }
    }

    /**
    * Creates the DOM element there the graph will be rendered
    * @param resource  The resource that is initializating the container.
    * @returns HTML code of the DOM container.
    */
    public initializeGraphContainer(resource: PZotGraphResource): string {
        this.cytoscapeEngine = undefined;
        
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

        console.log("1. GraphContainerReady")

        return canvas.outerHTML;
    }

    /**
    * Creates the DOM element there the graph will be rendered
    */
    public renderGraph(data?: Array<PZotGraphItem>) {
        if (!this.cytoscapeEngine) {
            this.initializeGraphEngine();
        }

        if (data) {
            this.clear();
            this.addData(data);
        }

        this.clearGraph();
        this.populateGraph();
        this.layoutGraph();
    }

    /**
    * Creates the DOM element there the graph will be rendered
    * @param resource  The resource that is initializating the container.
    * @returns HTML code of the DOM container.
    */
    private populateGraph() {
        this.periods = this.maxPeriod - this.minPeriod + 1;
            
        this.normalizePeriods(this.minPeriod);
        this.isNormalizedMode = true;

        try {
            this.graph.getNodesList().forEach(node => {                        
                this.cytoscapeEngine.add({ 
                    data: {id : node.id, label: node.label, period: node.period, isParent: node.isParent }, selectable: false
                });
            });

            this.graph.edges.forEach(element => {
                this.cytoscapeEngine.add( { data: { source: element.source.id, target: element.target.id}, selectable: false});
            });

            this.cytoscapeEngine.on('drag', 'node', this.onChangingPeriod.bind(this));
            // this.cy.on('click', 'node',  this.editNodeLabel.bind(this));
            // this.cytoscapeEngine.on('click', this.lol.bind(this));
            // this.cytoscapeEngine.on('cxttap',  this.deleteNode.bind(this));
            // this.cy.on('cxttap', 'node',  this.updateDependecies.bind(this));
            
            console.log("5. Graph Population Completed");
        } catch (error) {
            console.log("Error during graph population: " + error);
        }
    }

    /**
    * Creates the DOM element there the graph will be rendered
    */
    public layoutGraph() {
        if (this.cytoscapeEngine) {
            let element = document.getElementById('timeline');
        
            if (element != null) {
                this.width = element.scrollWidth;
                this.height = element.scrollHeight;

                this.cytoscapeEngine.resize();

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
                
                this.layout = this.cytoscapeEngine.layout(gridOptions);
                this.layout.run();
                this.cytoscapeEngine.fit();
                this.cytoscapeEngine.center();
            }

            console.log("6. Graph Layout Completed");
        }
    }

    /**
    * Creates the DOM element there the graph will be rendered
    * @param resource  The resource that is initializating the container.
    * @returns HTML code of the DOM container.
    */
    private addData(data: Array<PZotGraphItem>) {
        data.forEach(element => {
            this.addNode(new Node(element));

            element.getChildren().forEach(child => {
                this.addNode(new Node(child));
                

                let parent = this.graph.getNode(element.period.toString(), element.label);
                let childNode = this.graph.getNode(child.period.toString(), child.label);
           
                if (parent && childNode) {
                    this.addEdge(new Edge(parent, childNode));
                }
            });
        }); 
        console.log("4. Graph Data Ready")  
    }

    /**
    * Creates the DOM element there the graph will be rendered
    * @param resource  The resource that is initializating the container.
    * @returns HTML code of the DOM container.
    */
    private normalizePeriods(offset: number) {
        this.graph.getNodesList().forEach(node => {
            node.normalizePeriod( - offset);
        });
    }

    /**
     * renameGraphNode
     */
    private renameGraphNode(event: cytoscape.EventObject) {
        console.log("editLabel!" + event.target);
        let target = this.graph.getNodesList().find(x => x.id == event.target.id().toString());
        if (event.target) {
            try {
                if (target) {

                    let div = document.createElement('div');
                    let tippyInput = document.createElement('input');
                    let tippyButton = document.createElement('button');
                    let id = target.period + ":%:" + target.label;

                    let popper = event.target.popper({
                        content: () => {    
                            div.style.padding = "10px";
                            tippyButton.id = id;
                            tippyButton.onclick = this.changeNodeName.bind(this);

                            div.appendChild(tippyInput);
                            div.appendChild(tippyButton);

                            tippyButton.innerHTML = 'ChangeName';
                    
                        document.body.appendChild( div );
                    
                        return div;
                    },
                        popper: {}
                    });

                    this.popus.set(id , new Popup(popper, div, tippyInput));
                }
            } catch (error) {
                console.log("popper error: " + error);
            }
        }
    }

    private changeNodeName(ev: MouseEvent) {
        let button = ev.target as HTMLButtonElement;

        let popup = this.popus.get(button.id);

        if (popup) {
            let info = button.id.split(":%:");

            console.log("Node p: " + info[0] + " l: " + info[1]);
            
            this.graph.renameNode(info[0], info[1], popup.getLabel())
            
            popup.dismiss();

            console.log("dismissed pop");
            this.renderGraph();
        }
    }

    /**
     * deleteGraphElement
     */
    private deleteGraphElement(event: cytoscape.EventObject) {
        if (event.target.isNode()) {            
            let target = this.graph.getNodesList().find(x => x.id == event.target.id().toString());
            console.log(target);
            if (target != undefined) {
                this.graph.removeNode(target.period.toString(), target.label);
            }
        }
        
        if (event.target.isEdge()) {
            let source = this.graph.getNodesList().find(x => x.id == event.target.source().id().toString());
            let target = this.graph.getNodesList().find(x => x.id == event.target.target().id().toString());
            if (target && source) {
                this.graph.removeEdge(source, target);
            }
        }

        this.renderGraph();
    }

    /**
     * createNewNode
     */
    private addGraphNode(event: cytoscape.EventObject) {
            let node = new PZotGraphItem("undefined");

            let periodSize = (this.width / this.periods); 
            let newPeriod = Math.round(event.position.x / periodSize);

            node.period = newPeriod;
            console.log(newPeriod);

            this.addNode(new Node(node));
            this.renderGraph();
    }

    private onChangingPeriod(event: cytoscape.EventObject) {
        let node = event.target;
        let periodSize = (this.width / this.periods); 
        let newPeriod = Math.round(node.position().x / periodSize);

        this.graph.getNodesList()[node.id()].period = newPeriod;

        if (!this.isNormalizedMode) { 
            this.graph.getNodesList()[node.id()].period += this.minPeriod;
        }

        // TODO: bottoncino
        // this.updateDependecies();
    }

    private onNewEdge(sourceNode: any, targetNode: any, addedEles: any ) {

        let source = this.graph.getNodesList().find(x => x.id == sourceNode.id().toString());
        let target = this.graph.getNodesList().find(x => x.id == targetNode.id().toString());

        if (source != undefined && target != undefined) {
            this.graph.edges.push(new Edge(source, target));
        }
    }

    private updateDependecies() {
        if (this.isNormalizedMode) {
            this.normalizePeriods( - this.minPeriod);
            this.isNormalizedMode = false;
        }

        if (this.resource) {
            this.resource.graphToDependecies(this.graph);
        }
    }

    private addEdge(edge: Edge): void {
        this.graph.edges.push(edge);
    }

    private addNode(node: Node): void {
        let duplicate = false;
        this.graph.getNodesList().forEach(item => {
            if (item.period == node.period && item.label == node.label) {
                duplicate = true;
            }
        });

        if (!duplicate) {
            node.id = this.nodeCount.toString();
            this.nodeCount ++;

            if (node.period > this.maxPeriod) {
                this.maxPeriod = node.period;
            }
            if (node.period < this.minPeriod) {
                this.minPeriod = node.period;
            }

            if (!this.graph.nodes.has(node.period.toString())) {
                this.graph.nodes.set(node.period.toString(), new Map<string, Node>());
            }
            
            let nodesByPeriod = this.graph.nodes.get(node.period.toString());
            if (nodesByPeriod) {
                nodesByPeriod.set(node.label, node);
                this.graph.isDirty = true;
            }  
        }
    }

    private clear() {
        this.maxPeriod = 0;
        this.minPeriod = 0;
        this.nodeCount = 0;

        this.graph.clear();

        console.log("3. Graph data clear")
    }

    private clearGraph() {
        this.cytoscapeEngine.elements().remove();
        console.log("3.1 Graph clear")
    }
}