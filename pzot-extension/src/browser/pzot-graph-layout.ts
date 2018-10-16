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

export class PZotGraphLayout {

    //#region Properties
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

    //#endregion

    constructor() {
        this.initializeCytoscapePlugins();
    }

    //#region Layout Visualization Methods


    /**
    * Loads all the Cytoscape Library plugins needed
    */
    private initializeCytoscapePlugins() {
        let cytoscape = require('cytoscape');
        let jquery = require('jquery');

        // TODO: Add plugin description and github link
        let edgehandles = require('cytoscape-edgehandles');
        cytoscape.use(edgehandles);

        // TODO: Add plugin description and github link
        let cytoPopper = require('cytoscape-popper');
        cytoscape.use(cytoPopper);

        // TODO: Add plugin description and github link
        let contextMenus = require('cytoscape-context-menus');
        contextMenus(cytoscape, jquery);

        // TODO: Add plugin description and github link
        let cytoCanvas = require('cytoscape-canvas');
        cytoCanvas(cytoscape);

        // The GridContainer layout for Cytoscape.js
        let gridContainer = require('./grid-layout/register');
        gridContainer(cytoscape);
    }

    /**
    * Double ArrowShape code 
    */
    // private initializeDoubleArrowShape() {
    //    cytoscape.defineArrowShape( 'double-arrow', {
    //             points: [
    //               -0.15, -0.3,
    //               0, 0,
    //               0.15, -0.3,
    //               -0.15, -0.3
    //             ],

    //             pointsSecond: [
    //               0, -0.3,
    //               0.15, -0.6,
    //               -0.15, -0.6
    //             ],

    //             collide: function( x: any, y, size, angle, translation, padding ){
    //               var triPts = pointsToArr( transformPoints( this.points, size  2 * padding, angle, translation ) );
    //               var teePts = pointsToArr( transformPoints( this.pointsSecond, size  2 * padding, angle, translation ) );

    //               var inside = math.pointInsidePolygonPoints( x, y, triPts ) || math.pointInsidePolygonPoints( x, y, teePts );

    //               return inside;
    //             },

    //             draw: function( context, size, angle, translation ){
    //               var triPts = transformPoints( this.points, size, angle, translation );
    //               var teePts = transformPoints( this.pointsSecond, size, angle, translation );

    //               renderer.arrowShapeImpl( this.name )( context, triPts, teePts );
    //             }
    //           } );
    // }

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
                handlePosition: function (node: any) {
                    return 'middle top'; // sets the position of the handle in the format of "X-AXIS Y-AXIS" such as "left top", "middle top"
                },
                handleInDrawMode: false, // whether to show the handle in draw mode
                edgeType: function (sourceNode: any, targetNode: any) {
                    // can return 'flat' for flat edges between nodes or 'node' for intermediate node between them
                    // returning null/undefined means an edge can't be added between the two nodes
                    return 'flat';
                },
                loopAllowed: function (node: any) {
                    // for the specified node, return whether edges from itself to itself are allowed
                    return false;
                },
                nodeLoopOffset: -50, // offset for edgeType: 'node' loops
                nodeParams: function (sourceNode: any, targetNode: any) {
                    // for edges between the specified source and target
                    // return element object to be passed to cy.add() for intermediary node
                    return {};
                },
                edgeParams: function (sourceNode: any, targetNode: any, i: any) {
                    // for edges between the specified source and target
                    // return element object to be passed to cy.add() for edge
                    // NB: i indicates edge index in case of edgeType: 'node'
                    return {};
                },
                complete: this.onNewEdge.bind(this)
            };

            let eh = this.cytoscapeEngine.edgehandles(defaults);

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
                        onClickFunction: this.renameNode.bind(this),
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

            this.contextMenu = this.cytoscapeEngine.contextMenus(menuOptions);

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

    /**
    * EntryPoint!
    */
    public setGraph(graph: PZotGraph) {
        if (!this.cytoscapeEngine) {
            this.initializeGraphEngine();
        }

        this.graph = graph;
        Logger.log("New Graph!");

        this.clear();
        this.populateGraph(graph);

        Logger.log(this.graph.toDepFormula());
    }

    /**
    * Creates the DOM element there the graph will be rendered
    * @param resource  The resource that is initializating the container.
    * @returns HTML code of the DOM container.
    */
    private populateGraph(graph: PZotGraph) {
        //Whats the pourpose? 
        //this.normalizePeriods(this.minPeriod);
        //this.isNormalizedMode = true;

        try {
            let nodeList = graph.getNodesList();

            for (let index = 0; index < nodeList.length; index++) {
                this.addCytoscapeNode(nodeList[index]);
            }

            let edgeList = graph.getEdges();
            for (let index = 0; index < edgeList.length; index++) {
                this.addCytoscapeEdge(edgeList[index]);             
            }

            this.cytoscapeEngine.on('drag', 'node', this.onNodeDragged.bind(this));
            Logger.log("5. Graph Population Completed");
        } catch (error) {
            Logger.log("Error during graph population: " + error);
        }
    }

    private addCytoscapeNode(node: PZotNode) {
        this.cytoscapeEngine.add({
            data: {
                id: node.id, label: node.label,
                period: node.period, isParent: node.isParent
            }, selectable: false
        });
        Logger.log("Layout - Added node: " + node.label + " with ID: " + node.id + " in period: " + node.period);
    }

    private addCytoscapeEdge(edge: PZotEdge) {
        this.cytoscapeEngine.add({ data: { source: edge.source.id, target: edge.target.id }, selectable: false });
        Logger.log("Layout - Added edge from: " + edge.source.id + " to: " + edge.target.id);
    }

    /**
    * Creates the DOM element there the graph will be rendered
    */
    public renderGraph() {
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
                    boundingBox: { x1: 100, y1: 100, w: this.canvasWidth / 2, h: this.canvasHeight / 2 }, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                    avoidOverlap: false, // prevents node overlap, may overflow boundingBox if not enough space
                    avoidOverlapPadding: 10, // extra spacing around nodes when avoidOverlap: true
                    nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
                    condense: false, // uses all available space on false, uses minimal space on true
                    rows: this.graph.maxNodesInPeriod, // force num of rows in the grid
                    cols: this.graph.periods, // force num of columns in the grid
                    position: function (node: any) { return { col: node.data("period"), row: undefined } }, // returns { row, col } for element
                    // transform: function (node, position ){ return position; } // transform a given node position. Useful for changing flow direction in discrete layouts 
                };

                this.layout = this.cytoscapeEngine.layout(gridOptions);
                this.layout.run();

                this.cytoscapeEngine.fit();
                this.cytoscapeEngine.center();
            }

            this.renderBackgroundGrid();

            Logger.log("6. Graph Layout Completed");
        }
    }

    private renderBackgroundGrid() {
        Logger.log("renderBackgorundGrid");

        let layer = this.cytoscapeEngine.cyCanvas({
            zIndex: 1,
            pixelRatio: "auto",
        });

        let fontSize = 24;
        let canvas = layer.getCanvas();
        let ctx = canvas.getContext("2d");
        
        layer.resetTransform(ctx);
        layer.clear(ctx);

        this.canvasHeight = canvas.height - (2 * this.margin);
        this.canvasWidth = canvas.width - (2 * this.margin);

        // First two parameters: TopLeft Corner coordinates
        // Second two parameters: Width and Height of the rectangle
        ctx.strokeRect(100, 100, this.canvasWidth, this.canvasHeight);

        let lowerBound = canvas.height - fontSize;
        let periodWidth = (this.canvasWidth) / (this.graph.periods);

        for (let index = 0; index < this.graph.periods; index++) {
            // Draw text label for each period
            ctx.font = fontSize + "px Helvetica";
            ctx.fillStyle = "white";
            ctx.fillText(index, this.margin + ((periodWidth * (index + 1)) - (periodWidth / 2)), lowerBound);

            //Draw separator line for each period
            ctx.beginPath();
            ctx.moveTo(periodWidth * (index + 1) + this.margin, this.margin);
            ctx.lineTo(periodWidth * (index + 1) + this.margin, canvas.height - this.margin);
            ctx.stroke();
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

    //#endregion

    //#region Layout Interaction methods

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
        Logger.log("New node: " + node.toString());

    }

    /**
     * renameGraphNode
     */
    private renameNode(event: cytoscape.EventObject) {
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

                            document.body.appendChild(popupContainer);

                            return popupContainer;
                        },
                        popper: {}
                    });

                    let update = () => {
                        popper.scheduleUpdate();
                    };

                    event.target.on('position', update);
                    this.cytoscapeEngine.on('pan zoom resize', update);

                    this.popups.set(id, new Popup(popper, popupContainer, labelInput));
                }
            } catch (error) {
                Logger.log("popper error: " + error);
            }
        }
    }

    private deleteNode(node: PZotNode) {
        this.graph.removeNode(node.period.toString(), node.label);
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
        let node = new PZotNode();

        //shoud be fixed layout variable 
        let periodSize = (this.width / this.graph.periods);

        node.period = Math.floor((event.position.x) / periodSize);
        //Temp label, user will probably change it. (Or not, we don't care)
        node.label = "New Node " + (this.graph.nodeCount + 1);

        //We need to rerender also the backgorund grid as we are adding a new period
        // if (node.period > this.graph.periodUpperBound){
            
        //     this.renderBackgroundGrid();
        // }

        //Add the new node to the graph data structure
        this.graph.addNode(node);
        //Add the new node to the layout 
        //(we do not want to rebuild all the layout for just one node)
        this.addCytoscapeNode(node);

        this.renderGraph();


        Logger.log("Updating graph with new node: " + node.toString());
    }

    private onNodeDragged(event: cytoscape.EventObject) {
        let node = event.target;
        let nodeLabel = node.data().label;
        let nodePeriod = node.data().period;

        //We divide by two because canvas is double in size
        let periodSize = (this.canvasWidth / this.graph.periods) / 2;
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

    private onNewEdge(sourceNode: any, targetNode: any, addedEles: any) {

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
            let formula = this.graph.toDepFormula();
            Logger.log("Updating document with dependency formula: " + formula);
            this.resource.updateDependencies(formula);
        }
    }

    private addEdge(edge: PZotEdge): void {
        this.graph.addEdge(edge);
        Logger.log("Updating graph with new edge: " + this.graph.toString());
    }



    private clear() {
        this.cytoscapeEngine.elements().remove();
        Logger.log("3.1 Layout clear")
    }

    //#endregion
}