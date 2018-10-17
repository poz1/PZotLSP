import { PZotEdge } from "./pzot-edge";
import { PZotNode } from "./pzot-node";
import { Logger } from "../../debug";

export class PZotGraph {

    public periodCount: number;
    public maxNodesInPeriod = 0;
    public nodeCount = 0;
    public periodUpperBound = 0;
    public periodLowerBound = 0;
  

    //Nodes are indexed by period and label. Map<period, Map<label, node>>
    private nodes = new Map<number, Map<string, PZotNode>>();
    private edges = new Array<PZotEdge>();
    
    private isDirty = true;
    private nodesList = new Array<PZotNode>();
    
    private idCount = 0;

    public constructor(dependencyFormula: string) {
        Logger.log("Graoh - Creating Graph from: " + dependencyFormula);
        this.parseDependencies(dependencyFormula);
        this.toString();
    }

    private parseDependencies(text: string) {
        let input = text.replace(/\s|[\r\n]+/gm, "");
        let operators = input.match(/(?=\()\W\w+|(?=\()\W\W\W/g);

        if (operators != null) {
            operators.forEach(operator => {
                if (input != "") {
                    if (operator.match(/\(dep/)) {
                        let deps = input.split("(dep");
                        deps.forEach(element => {
                            this.parseDependency(element);
                            input = input.substring(element.length + operator.length);
                        });

                    } else {
                        input = input.substring(operator.length);
                    }
                }
            });
        }
    }

    private parseDependency(text: string) {
        Logger.log("1: Parsing : " + text);

        let nodes = text.split(")(");
        if (nodes != null && nodes.length > 0) {
            let node = new PZotNode(nodes[0]);
            //If we have an empty main node, we are dealing with a fake node with no dependencies
            if (node.label != "") {
                let mainNode = this.addNode(node);
                for (let index = 1; index < nodes.length; index++) {
                    const element = nodes[index];

                    if (element != "") {
                        let target = this.addNode(new PZotNode(element));
                        this.addEdge(new PZotEdge(mainNode, target));
                        mainNode.addDependency(target);
                    }
                };
            }
        }
    }

    private forceUpdate() {
        let result = new Array<PZotNode>();

        if (this.isDirty) {
            this.nodes.forEach(period => {
                period.forEach(node => {
                    result.push(node);
                });
            });

            this.nodesList = result;
            this.isDirty = false;
        }
    }

    public addNode(node: PZotNode): PZotNode {
        let nodesByPeriod = this.nodes.get(node.period);

        if (!nodesByPeriod) {
            this.nodes.set(node.period, new Map<string, PZotNode>());
        }

        nodesByPeriod = this.nodes.get(node.period);
        if (nodesByPeriod) {
            let temp = nodesByPeriod.get(node.label);
            //Duplicate node check
            if (temp == undefined) {
                if (node.id == undefined) {
                    node.id = this.idCount;
                    this.idCount++;
                    this.nodeCount++;
                }

                nodesByPeriod.set(node.label, node);
                this.updateGraphBounds(node);

                Logger.log("Graph - Adding node: " + node.toString());
                return node;
            } else {
                return temp;
            }
        }

        //never reached (in theory xD)
        Logger.log("Huston we have a problem! - addNode in pzot-graph");
        return node;
    }

    private updateGraphBounds(node: PZotNode) {
        this.periodUpperBound = Math.max(node.period, this.periodUpperBound);
        this.periodLowerBound = Math.min(node.period, this.periodLowerBound);

        this.computePeriodCount();

        let nodesInPeriod = this.nodes.get(node.period);
        if (nodesInPeriod)
            this.maxNodesInPeriod = Math.max(this.maxNodesInPeriod, nodesInPeriod.size);
    }

    private computePeriodCount() {
        this.periodCount = Math.abs(this.periodUpperBound - this.periodLowerBound) + 1;

        //This situation is reached when we delete the last node 
        if (this.periodUpperBound < this.periodLowerBound) {
            this.periodCount = 0;
            this.periodLowerBound = 0;
            this.periodUpperBound = 0;
        }
    }

    public getNodesList(): Array<PZotNode> {
        this.forceUpdate();
        return this.nodesList;
    }

    public getNode(period: number, label: string): PZotNode | undefined {
        let nodesByPeriod = this.nodes.get(period);
        if (nodesByPeriod) {
            let node = nodesByPeriod.get(label);
            if (node) {
                return node;
            } else {
                Logger.log("No node with " + label + " in graph");
                Logger.log(this.toString());
            }
        } else {
            Logger.log("No period " + period + " in graph");
            Logger.log(this.toString());
        }
    }

    public getNodesInPeriod(period: number): Map<string, PZotNode> | undefined {
        return this.nodes.get(period);
    }

    /**
     * renameNode
     */
    public renameNode(period: number, label: string, newLabel: string) {
        let nodesByPeriod = this.nodes.get(period);
        if (nodesByPeriod) {
            let node = nodesByPeriod.get(label);

            if (node) {
                this.removeNode(node.period, node.label);
                node.label = newLabel;
                this.addNode(node);
                this.isDirty = true;
            }
        } else {
            Logger.log("No node found in " + period + " with label " + label);
            Logger.log(this.toString());
        }
    }

    /**
     * updateNodePeriod
     */
    public updateNodePeriod(label: string, period: number, newPeriod: number) {
        Logger.log("updating node " + label + " from " + period + " to " + newPeriod);

        let node = this.getNode(period, label);
        if (node) {
            this.removeNode(period, label);
            node.period = newPeriod;
            this.addNode(node);
            this.isDirty = true;
        }
    }

    public getEdge(source?: PZotNode, target?: PZotNode): PZotEdge | Array<PZotEdge> {
        if (source && target) {
            this.edges.forEach(edge => {
                if (edge.source == source.id && edge.target == target.id) {
                    return edge;
                }
            });
        }

        let result = new Array<PZotEdge>();

        if (source) {
            this.edges.forEach(edge => {
                if (edge.source == source.id) {
                    result.push(edge);
                }
            });
        }

        if (target) {
            this.edges.forEach(edge => {
                if (edge.target == target.id) {
                    result.push(edge);
                }
            });
        }

        return result;
    }

    public getEdges(): Array<PZotEdge> {
        return this.edges;
    }

    public addEdge(edge: PZotEdge) {
        Logger.log("Graph - Adding edge from: " + edge.source.toString() + " to: " + edge.target.toString());
        return this.edges.push(edge);
    }

    public removeNode(period: number, label: string): void {
        let nodesByPeriod = this.nodes.get(period);
        if (nodesByPeriod) {

            this.removeRelatedEdges(nodesByPeriod.get(label));
            nodesByPeriod.delete(label);
            this.nodeCount--;

            //It was the only node in the period
            if (nodesByPeriod.size == 0) {
                //It's a bound period and we need to adjust the bounds
                if (period == this.periodLowerBound) {
                    this.periodLowerBound++;
                    Logger.log("New LowerBound is " + this.periodLowerBound);
                    this.computePeriodCount();
                    Logger.log("New PeriodCount is " + this.periodCount);
                }
                if (period == this.periodUpperBound) {
                    this.periodUpperBound--;
                    Logger.log("New UpperBound is " + this.periodUpperBound);
                    this.computePeriodCount();
                    Logger.log("New PeriodCount is " + this.periodCount);
                }

                //We eliminate the period as it's empty from the collection
                this.nodes.delete(period);
            }
           
            this.isDirty = true;
        } else {
            Logger.log("No period " + period + " in graph");
            Logger.log(this.toString());
        }
    }

    private removeRelatedEdges(node?: PZotNode) {
        if(node){
            let relatedEdges = new Array<PZotEdge>();
           
            relatedEdges = relatedEdges.concat(this.getEdge(node));
            relatedEdges = relatedEdges.concat(this.getEdge(undefined, node));

            relatedEdges.forEach(edge => {
                this.removeEdge(edge.source, edge.target);
            });
        }
    }

    public removeEdge(source: number, target: number): void {
        Logger.log("Graph - Deleting edge from: " + source + " to: " + target);

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
        this.nodes = new Map<number, Map<string, PZotNode>>();
        this.edges = new Array<PZotEdge>();
        this.isDirty = true;
    }

    public toDepFormula(): string {
        let dependecies = "";
        let mainNodes = this.getNodesList();

        if (mainNodes.length > 1) {
            dependecies = "(&& ";

            mainNodes.forEach(node => {
                dependecies = dependecies + node.toDependendency();
            });

            dependecies = dependecies + ")";
        } else if (mainNodes.length = 1) {
            dependecies = mainNodes[0].toDependendency();
        }

        //this.updatingDeps = true;
        //this.updateDependencies(dependecies);

        return dependecies;
    }

    public toString(): string {
        let result = "Graph lowerbound: " + this.periodLowerBound + " upperbound: " + this.periodUpperBound;
        result = result + " maxNodes: " + this.maxNodesInPeriod + "\n";
        let periods = this.nodes.keys();

        for (let period of periods) {
            result = result + ("Period: " + period + " contains: \n");
            let nodesMap = this.nodes.get(period);

            if (nodesMap) {
                let nodes = nodesMap.keys();
                for (let node of nodes) {
                    let nodeObj = nodesMap.get(node);
                    if (nodeObj)
                        result = result + (nodeObj.toString() + "\n");
                }
            }
        }

        this.edges.forEach(edge => {
            result = result + (edge.toString() + "\n");
        });


        return result;
    }
}