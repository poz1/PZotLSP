import { PZotEdge } from "./pzot-edge";
import { PZotNode } from "./pzot-node";
import { Logger } from "../../debug";

export class PZotGraph {
    
    public periods: number;
    public maxNodesInPeriod = 0;
    public nodeCount = 0;

    private nodesList = new Array<PZotNode>();

    //Nodes are indexed by period and label. Map<period, Map<label, node>>
    private nodes = new Map<string, Map<string, PZotNode>>();
    private edges = new Array<PZotEdge>();
    private isDirty = true;
    public periodUpperBound = 0;
    public periodLowerBound = 0;

    public constructor(dependencyFormula: string) {
        Logger.log("0: Creating Graph from: " + dependencyFormula);
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
                        let target =  this.addNode(new PZotNode(element));
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

    public addNode(node: PZotNode) : PZotNode{
        let nodesByPeriod = this.nodes.get(node.period.toString());

        if (!nodesByPeriod) {
            this.nodes.set(node.period.toString(), new Map<string, PZotNode>());
        }

        nodesByPeriod = this.nodes.get(node.period.toString());
        if (nodesByPeriod) {
            let temp = nodesByPeriod.get(node.label);
            //Duplicate node check
            if (temp == undefined) {
                if (node.id == undefined) {
                    node.id = this.nodeCount;
                    this.nodeCount++;
                }

                nodesByPeriod.set(node.label, node);
                this.updateGraphBounds(node);

                Logger.log("Graph - Adding node: " + node.label + " to graph with ID: " + node.id);
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
        if (node.periodUpperBound > this.periodUpperBound) {
            this.periodUpperBound = node.periodUpperBound;
        }

        if (node.periodLowerBound < this.periodLowerBound) {
            this.periodLowerBound = node.periodLowerBound;
        }

        this.periods = Math.abs(this.periodUpperBound) + Math.abs(this.periodLowerBound);
        //We add the "0" period to the count if it's in the interval
        if (this.periodUpperBound >= 0 && this.periodLowerBound <= 0)
            this.periods++;

        let nodesInPeriod = this.nodes.get(node.period.toString());
        if(nodesInPeriod)
            this.maxNodesInPeriod = Math.max(this.maxNodesInPeriod, nodesInPeriod.size);
    }

    public getNodesList(): Array<PZotNode> {
        this.forceUpdate();
        return this.nodesList;
    }

    public getNode(period: string, label: string): PZotNode | undefined {
        let nodesByPeriod = this.nodes.get(period);
        if (nodesByPeriod) {
            return nodesByPeriod.get(label);
        }
    }

    public getNodesInPeriod(period: string): Map<string, PZotNode> | undefined {
        return this.nodes.get(period);
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

    /**
     * updateNodePeriod
     */
    public updateNodePeriod(label: string, period: string, newPeriod: number) {
        this.forceUpdate();

        Logger.log("updating node " + label + " from " + period + " to " + newPeriod);
        let nodesByPeriod = this.nodes.get(period);
        Logger.log("PCZZ");

        Logger.log(this.nodes);
        Logger.log(nodesByPeriod);
        if (nodesByPeriod) {
            Logger.log("NP0");

            let node = nodesByPeriod.get(label);
            Logger.log(node);

            if (node) {
                Logger.log("NP1");

                Logger.log("p1 : " + node.period);
                node.period = newPeriod;
                Logger.log("p2 : " + node.period);
                this.isDirty = true;
            }
        }
    }

    public getEdge(source?: PZotNode, target?: PZotNode): PZotEdge | Array<PZotEdge> {
        if (source && target) {
            this.edges.forEach(edge => {
                if (edge.source == source && edge.target == target) {
                    return edge;
                }
            });
        }

        let result = new Array<PZotEdge>();

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

    public getEdges(): Array<PZotEdge> {
        return this.edges;
    }

    public addEdge(edge: PZotEdge) {
        Logger.log("Graph - Adding arc from: " + edge.source.label + " to: " + edge.target.label );
        return this.edges.push(edge);
    }

    public removeNode(period: string, label: string): void {
        let nodesByPeriod = this.nodes.get(period);
        if (nodesByPeriod) {
            nodesByPeriod.delete(label);
            this.isDirty = true;
        }
    }

    public removeEdge(source: PZotNode, target: PZotNode): void {
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
        this.nodes = new Map<string, Map<string, PZotNode>>();
        this.edges = new Array<PZotEdge>();
        this.isDirty = true;
    }

    public toDepFormula():string {
        let dependecies = "";
        let mainNodes = this.getNodesList();

            if (mainNodes.length > 1) {
                dependecies = "(&& ";

                mainNodes.forEach(node => {
                    dependecies = dependecies + node.toDependendency();
                });

                dependecies = dependecies + ")";
            } else if (mainNodes.length = 1){
                dependecies = mainNodes[0].toDependendency();
            }

            //this.updatingDeps = true;
            //this.updateDependencies(dependecies);

        return dependecies;
    }

    public toString() {
        Logger.log("Graph lowerbound: " + this.periodLowerBound + " upperbound: " + this.periodUpperBound);
        let periods = this.nodes.keys();

        for (let period of periods) {
            Logger.log("Period: " + period + " contains: ");
            let nodesMap = this.nodes.get(period);

            if (nodesMap) {
                let nodes = nodesMap.keys();
                for (let node of nodes) {
                    let nodeObj = nodesMap.get(node);
                    if (nodeObj)
                        Logger.log(nodeObj.toString());
                }
            }
        }

        this.edges.forEach(edge => {
            Logger.log(edge.toString());
        });
    }
}