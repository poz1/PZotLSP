import { PZotGraphResource } from './pzot-graph-resource';
import cytoscape = require('cytoscape');

import '../../src/browser/style/index.css';
import { PZotGraph } from './pzot-engine/pzot-graph';
import { PZotNode } from './pzot-engine/pzot-node';
import { PZotEdge } from './pzot-engine/pzot-edge';
import { Logger } from '../debug';

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
        Logger.log(this.div);
        this.popper.destroy();
        document.getElementsByTagName("BODY")[0].removeChild(this.div);
    }
}

export class PZotGraphEngine {

    private resource: PZotGraphResource | undefined;
    private graph: PZotGraph;
   
    private width = 0;
    private height = 0;

    private isNormalizedMode = false;
    private margin = 100;

    private cytoscapeEngine: any;
    private layout: any;
    private mousetrap: any;

    private contextMenu: any;
    private popups = new Map<string, Popup>();

    private canvasHeight = 0;
    private canvasWidth = 0;

    constructor() {
        this.initializeCytoscapePlugins();
    }

    /**
    * setGraph
    */
    public setGraph(graph:PZotGraph) {
        this.graph = graph;
    }
    /**
    * Loads all the Cytoscape Library plugins needed
    */
    private initializeCytoscapePlugins() {
        let cytoscape = require('cytoscape');
        let jquery = require('jquery');

        // TODO: Add plugin description and github link
        let edgehandles = require('cytoscape-edgehandles');
        cytoscape.use( edgehandles );
        
        // TODO: Add plugin description and github link
        let cytoPopper = require('cytoscape-popper');
        cytoscape.use( cytoPopper ); 
        
        // TODO: Add plugin description and github link
        let contextMenus = require('cytoscape-context-menus');
        contextMenus( cytoscape, jquery );
        
        // TODO: Add plugin description and github link
        let cytoCanvas = require('cytoscape-canvas');
        cytoCanvas( cytoscape ); 

        // The GridContainer layout for Cytoscape.js
        let gridContainer = require('./grid-layout/register');
        gridContainer(cytoscape);
    }

    /**
    * Double ArrowShape code 
    */
    //private initializeDoubleArrowShape() {
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
    //}

    /**
    * Creates the DOM element there the graph will be rendered
    * @param resource  The resource that is initializating the container.
    * @returns HTML code of the DOM container.
    */
    private initializeGraphEngine() {
        Logger.log("1.1 Initialiazing Graph Engine");

        let container = document.getElementById('timeline');
        if (container != null) {

            this.cytoscapeEngine = cytoscape({
                container: container,
                zoomingEnabled: false,
                userZoomingEnabled: false,
                userPanningEnabled: false,

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
                            content: 'Rename', // Display content of menu item
                            tooltipText: 'Rename', // Tooltip text for menu item
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
                            content: 'Remove', // Display content of menu item
                            tooltipText: 'Remove', // Tooltip text for menu item
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
                            content: 'Add Node',
                            tooltipText: 'Add Node',
                            // image: {src : "add.svg", width : 12, height : 12, x : 6, y : 4},
                            selector: '',
                            coreAsWell: true,
                            onClickFunction: this.addGraphNode.bind(this)
                        },
                        {
                            id: 'compute-formula',
                            content: 'Compute Formula',
                            tooltipText: 'Compute Formula',
                            // image: {src : "add.svg", width : 12, height : 12, x : 6, y : 4},
                            selector: '',
                            coreAsWell: true,
                            onClickFunction: this.updateDependeciesFormula.bind(this)
                        }
                    ]
                };

                this.contextMenu = this.cytoscapeEngine.contextMenus( menuOptions );
                
                this.renderGraphCanvas();

            Logger.log("2. GraphEngineReady")
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
        updateButton.addEventListener("click", (e: Event) => this.updateDependeciesFormula());
        updateButton.className = "theia-button";
        
        container.appendChild(canvas);
        // container.appendChild(canvas);
        container.style.position = "inherit";

        Logger.log("1. GraphContainerReady")

        return canvas.outerHTML;
    }

    private renderGraphCanvas() {
        Logger.log("RenderGraphCanvas");

        let layer = this.cytoscapeEngine.cyCanvas({
            zIndex: 1,
            pixelRatio: "auto",
        });

        let fontSize = 24;

        this.cytoscapeEngine.on("render cyCanvas.resize", (ev: any) => {
            let canvas = layer.getCanvas();
            let ctx = canvas.getContext("2d");

            layer.resetTransform(ctx);
            // layer.clear(ctx);
            // layer.setTransform(ctx);
        
            // ctx.save();
            // Draw a background
            // ctx.drawImage(background, 0, 0);
            //  Logger.log("CHeight: " + canvas.height);
            //  Logger.log("CWidth: " + canvas.width);

            // Logger.log("Height: " + this.cytoscapeEngine.container().offsetHeight);
            // Logger.log("Width: " + this.cytoscapeEngine.container().offsetWidth);
    
            this.canvasHeight = canvas.height - (2 * this.margin);
            this.canvasWidth = canvas.width - (2 * this.margin);

            // First two parameters: TopLeft Corner coordinates
            // Second two parameters: Width and Height of the rectangle
            ctx.strokeRect(100, 100, this.canvasWidth, this.canvasHeight);
            
            let lowerBound = canvas.height - fontSize;
            let periodWidth = (this.canvasWidth) / (this.graph.periods);
            //Logger.log("REAL Period SIZE: " + periodWidth);

            // Logger.log("CWidth: " + canvas.width);
            // Logger.log("periodWidth: " + periodWidth);

            for (let index = 0; index < this.graph.periods; index++) {
                // Draw text label for each period
                ctx.font = fontSize +  "px Helvetica";
                ctx.fillStyle = "white";
                ctx.fillText(index, this.margin + ((periodWidth * (index + 1)) - ( periodWidth / 2)),  lowerBound);
                //Logger.log("NEW PERIOD LABEL: " + index + " X: " + ((periodWidth * (index + 1)) - ( periodWidth / 2)) + " Y: " + lowerBound);
                
                //Draw separator line for each period
                ctx.beginPath();
                ctx.moveTo(periodWidth * (index + 1) + this.margin, this.margin);
                ctx.lineTo(periodWidth * (index + 1) + this.margin, canvas.height - this.margin);
                ctx.stroke();
            }

            // Draw shadows under nodes
            // ctx.shadowColor = "white";
            // ctx.shadowBlur = 25 * cy.zoom();
            // ctx.fillStyle = "white";
            // cy.nodes().forEach(node => {
            //   const pos = node.position();
            //   ctx.beginPath();
            //   ctx.arc(pos.x, pos.y, 10, 0, 2 * Math.PI, false);
            //   ctx.fill();
            // });
            // ctx.restore();
        });
    }

    /**
    * EntryPoiint!
    */
    public renderGraph(graph?: PZotGraph) {        
        if (!this.cytoscapeEngine) {
            this.initializeGraphEngine();
        }

        if (graph) {
            Logger.log("Setting Graph!");
            //Temporary
            this.setGraph(graph);
            this.clear();
            this.populateGraph(graph);
        }
        this.layoutGraph();
    }

    /**
    * Creates the DOM element there the graph will be rendered
    * @param resource  The resource that is initializating the container.
    * @returns HTML code of the DOM container.
    */
    private populateGraph(graph:PZotGraph) {
        Logger.log("X. Period count: " + this.graph.periods);
        Logger.log("X. MaxNodesInPeriods count: " + this.graph.maxNodesInPeriod);

        //Whats the pourpose? 
        //this.normalizePeriods(this.minPeriod);
        //this.isNormalizedMode = true;

        try {
            let nodeList = graph.getNodesList();
            
            for (let index = 0; index < nodeList.length; index++) {
                this.cytoscapeEngine.add({ 
                    data: {id : nodeList[index].id, label: nodeList[index].label, 
                        period: nodeList[index].period, isParent: nodeList[index].isParent }, selectable: false
                }); 
                Logger.log("Layout - Added node: " + nodeList[index].label + " with ID: " + nodeList[index].id + " in period: " + nodeList[index].period);
            }

            let edgeList = graph.getEdges();
            for (let index = 0; index < edgeList.length; index++) {
                this.cytoscapeEngine.add( { data: { source: edgeList[index].source.id, target: edgeList[index].target.id}, selectable: false});
                Logger.log("Layout - Added edge from: " + edgeList[index].source.id + " to: " + edgeList[index].target.id);
            }

            this.cytoscapeEngine.on('drag', 'node', this.onChangingPeriod.bind(this));
            // this.cy.on('click', 'node',  this.editNodeLabel.bind(this));
            // this.cytoscapeEngine.on('click', this.lol.bind(this));
            // this.cytoscapeEngine.on('cxttap',  this.deleteNode.bind(this));
            // this.cy.on('cxttap', 'node',  this.updateDependecies.bind(this));
            
            Logger.log("5. Graph Population Completed");
        } catch (error) {
            Logger.log("Error during graph population: " + error);
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
                    name: 'grid-container',
                
                    fit: false, // whether to fit the viewport to the graph
                    padding: 0, // padding used on fit
                    //CanvasWidth an canvasHeight have to be divided by 2 as canvas is doble the size of the real container
                    boundingBox: { x1: 100, y1: 100, w: this.canvasWidth / 2, h: this.canvasHeight / 2}, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                    avoidOverlap: false, // prevents node overlap, may overflow boundingBox if not enough space
                    avoidOverlapPadding: 10, // extra spacing around nodes when avoidOverlap: true
                    nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
                    condense: false, // uses all available space on false, uses minimal space on true
                    rows: this.graph.maxNodesInPeriod, // force num of rows in the grid
                    cols: this.graph.periods, // force num of columns in the grid
                    position: function( node: any ) { return {col: node.data("period"), row: undefined }}, // returns { row, col } for element
                    // transform: function (node, position ){ return position; } // transform a given node position. Useful for changing flow direction in discrete layouts 
                };


                this.layout = this.cytoscapeEngine.layout(gridOptions);
                this.layout.run();
                this.cytoscapeEngine.fit();
                this.cytoscapeEngine.center();
            }

            Logger.log("6. Graph Layout Completed");
        }
    }

    

    /**
    * Creates the DOM element there the graph will be rendered
    * @param resource  The resource that is initializating the container.
    * @returns HTML code of the DOM container.
    */
    // private normalizePeriods(offset: number) {
    //     let nodeList = this.graph.getNodesList();
    //         for (let index = 0; index < nodeList.length; index++) {
    //                 nodeList[index].normalizePeriod( - offset);
    //         }
    //     }

    /**
     * renameGraphNode
     */
    private renameGraphNode(event: cytoscape.EventObject) {
        Logger.log("editLabel!" + event.target);
        let target = this.graph.getNodesList().find(x => x.id == event.target.id().toString());
        if (event.target) {
            try {
                if (target) {

                    let popupContainer = document.createElement('div');
                    popupContainer.className = "popup-container";

                    let labelInput = document.createElement('input');
                    
                    let applyButton = document.createElement('button');
                    applyButton.innerHTML = 'Apply';
                    
                    let dismissButton = document.createElement('button');
                    dismissButton.innerHTML = 'Dismiss';

                    let id = target.period + ":%:" + target.label;
                    labelInput.value = target.label;

                    let popper = event.target.popper({
                        content: () => {                                
                            applyButton.id = id;
                            applyButton.onclick = this.changeNodeName.bind(this);
                            
                            dismissButton.id = id;
                            dismissButton.onclick = this.dismissPopup.bind(this);
                            
                            popupContainer.appendChild(labelInput);
                            popupContainer.appendChild(applyButton);
                            popupContainer.appendChild(dismissButton);

                        document.body.appendChild( popupContainer );
                    
                        return popupContainer;
                    },
                        popper: {}
                    });

                    let update = () => {
                        popper.scheduleUpdate();
                    };
                    
                    event.target.on('position', update);
                    this.cytoscapeEngine.on('pan zoom resize', update);

                    this.popups.set(id , new Popup(popper, popupContainer, labelInput));
                }
            } catch (error) {
                Logger.log("popper error: " + error);
            }
        }
    }

    private changeNodeName(ev: MouseEvent) {
        let button = ev.target as HTMLButtonElement;
        let popup = this.popups.get(button.id);

        if (popup) {
            let info = button.id.split(":%:");            
            this.graph.renameNode(info[0], info[1], popup.getLabel())
            popup.dismiss();
            this.renderGraph();
        }
    }

    private dismissPopup(ev: MouseEvent) {
        let button = ev.target as HTMLButtonElement;
        let popup = this.popups.get(button.id);
        
        if (popup) {
            popup.dismiss();
            this.renderGraph();
        }
    }

    /**
     * deleteGraphElement
     */
    private deleteGraphElement(event: cytoscape.EventObject) {
        if (event.target.isNode()) {            
            let target = this.graph.getNodesList().find(x => x.id == event.target.id().toString());
            Logger.log(target);
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
            let node = new PZotNode("undefined");
            //Logger.log("addW: " + this.width + " H: " + this.height);
            let periodSize = (this.width / this.graph.periods); 
            let newPeriod = Math.floor((event.position.x) / periodSize);

            //Logger.log("click in : " + event.position.x );
            node.period = newPeriod;
            Logger.log(newPeriod);

            this.addNode(node);
            this.renderGraph();
    }

    private onChangingPeriod(event: cytoscape.EventObject) {
        let node = event.target;
        let nodeLabel = node.data().label;
        let nodePeriod = node.data().period;

        //We divide by two because canvas is double in size
        let periodSize = (this.canvasWidth/ this.graph.periods) / 2; 
        let newPeriod = Math.floor((node.position().x - this.margin) / periodSize);
        
        Logger.log("node " + nodeLabel + " changed period from: " +
                           nodePeriod + " to: " + newPeriod);
        
        this.graph.updateNodePeriod(nodeLabel, nodePeriod, newPeriod);

        // if (!this.isNormalizedMode) { 
        //     this.graph.getNodesList()[node.id()].period += this.minPeriod;
        // }
        
        // TODO: bottoncino
        // this.updateDependecies();
    }

    private onNewEdge(sourceNode: any, targetNode: any, addedEles: any ) {

        let source = this.graph.getNodesList().find(x => x.id == sourceNode.id().toString());
        let target = this.graph.getNodesList().find(x => x.id == targetNode.id().toString());

        if (source != undefined && target != undefined) {
            this.graph.addEdge(new PZotEdge(source, target));
        }
    }

    private updateDependeciesFormula() {
        // if (this.isNormalizedMode) {
        //     this.normalizePeriods( - this.minPeriod);
        //     this.isNormalizedMode = false;
        // }

        if (this.resource) {
            //TODO
            //this.resource.graphToDependecies(this.graph);
        }
    }

    private addEdge(edge: PZotEdge): void {
        this.graph.addEdge(edge);
    }

    private addNode(node: PZotNode): void {
        // let duplicate = false;
        // this.graph.getNodesList().forEach(item => {
        //     if (item.period == node.period && item.label == node.label) {
        //         duplicate = true;
        //     }
        // });

        // if (!duplicate) {
        //     node.id = this.nodeCount;
        //     this.nodeCount ++;

        //     if (node.period > this.maxPeriod) {
        //         this.maxPeriod = node.period;
        //     }
        //     if (node.period < this.minPeriod) {
        //         this.minPeriod = node.period;
        //     }

        //     this.graph.addNode(node);
        // }
        this.graph.addNode(node);
    }

    // private clear() {
    //     this.maxPeriod = 0;
    //     this.minPeriod = 0;
    //     this.nodeCount = 0;

    //     //this.graph.clear();

    //     Logger.log("3. Graph data clear")
    // }

    private clear() {
        this.cytoscapeEngine.elements().remove();
        Logger.log("3.1 Graph clear")
    }
}