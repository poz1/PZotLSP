import { PZotEdge } from "./pzot-edge";
import { PZotNode } from "./pzot-node";
import { Logger } from "../../debug";

export class PZotGraph {
    //Number of periods represented by the graph
    public periodCount: number;
    //Number nodes in the most populated period 
    public maxNodesInPeriod = 0;
    public nodeCount = 0;
    public periodUpperBound = 0;
    public periodLowerBound = 0;

    //TODO replace with id instead of node 
    //Nodes are indexed by period and label. Map<period, Map<label, node>>
    private nodes = new Map<number, Map<string, PZotNode>>();
    private nodesID = new Map<number, PZotNode>();

    private edges = new Array<PZotEdge>();

    //Used to regenerate the nodes list only if it is necessary
    private isDirty = true;
    private nodesList = new Array<PZotNode>();

    private idCount = 0;

    public constructor(dependencyFormula: string) {
        Logger.log("Graoh - Creating Graph from: " + dependencyFormula);
        this.parseDependencies(dependencyFormula);
        this.toString();
    }
    
    /**
    * Reads the Dependency formula and creates nodes and edges
    * @param text The Dependency Formula
    */
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

    /**
    * Reads the Dependency formula and creates nodes and edges
    * @param text The Dependency Formula
    */
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
                        this.addEdge(new PZotEdge(mainNode.id, target.id));
                        mainNode.addDependency(target.id);
                    }
                };
            }
        }
    }

   
    /**
    * Add a node to the data structure
    * @param node  The PZot Node to be added
    */
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
                }

                nodesByPeriod.set(node.label, node);
                this.nodesID.set(node.id, node);
                this.updateGraphBounds(node);
                this.nodeCount++;

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


    /**
    * Computes the graph bounds after the insertion of a new node
    * @param node  The PZot Node to be added
    */
    private updateGraphBounds(node: PZotNode) {
        this.periodUpperBound = Math.max(node.period, this.periodUpperBound);
        this.periodLowerBound = Math.min(node.period, this.periodLowerBound);

        this.computePeriodCount();

        let nodesInPeriod = this.nodes.get(node.period);
        if (nodesInPeriod)
            this.maxNodesInPeriod = Math.max(this.maxNodesInPeriod, nodesInPeriod.size);
    }

    /**
    * Computes the number of period used in the graph
    */
    private computePeriodCount() {
        this.periodCount = Math.abs(this.periodUpperBound - this.periodLowerBound) + 1;

        //This situation is reached when we delete the last node 
        if (this.periodUpperBound < this.periodLowerBound) {
            this.periodCount = 0;
            this.periodLowerBound = 0;
            this.periodUpperBound = 0;
        }
    }

    /**
    * Return the nodes as an unordered array
    * @returns Array of nodes.
    */
    public getNodesList(): Array<PZotNode> {
        let result = new Array<PZotNode>();

        // if (this.isDirty) {
        this.nodes.forEach(period => {
            period.forEach(node => {
                result.push(node);
            });
        });

        this.nodesList = result;
        this.isDirty = false;
        // }
        return this.nodesList;
    }
    
    /**
    * Return a specific node using period and label
    * Use getNodeByID instead of this if possible 
    * @param period  The period of the node
    * @param label The label of the node
    * @returns If the node is found returns it.
    */
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

    /**
    * Return a specific node using the id.
    * Use this instead of Period/label combo if possible 
    * @param ID  The id of the node
    * @returns If the node is found returns it.
    */
    public getNodeByID(ID: number) :PZotNode | undefined {
        Logger.log("node ids");
        Logger.log(this.nodesID);
        return this.nodesID.get(ID);
    }

    // public getNodesInPeriod(period: number): Map<string, PZotNode> | undefined {
    //     return this.nodes.get(period);
    // }

    /**
    * Changes the label attribute of a node.
    * If another node with the same label is already present in the period 
    * they are merged in one node with the edges of both
    * @param period The node period
    * @param label The node current label
    * @param newLabel The node new label
    */
    public renameNode(period: number, label: string, newLabel: string) {
        let node = this.getNode(period, label)

        if (node) {
            let relatedEdges = new Array<PZotEdge>();

            relatedEdges = relatedEdges.concat(this.getEdge(node));
            relatedEdges = relatedEdges.concat(this.getEdge(undefined, node));

            this.removeNode(node.period, node.label);
            node.label = newLabel;
            this.addNode(node);

            relatedEdges.forEach(edge => {
                //We are keeping the same id for the node so no change of id is nedded
                this.addEdge(edge);
            });
            this.isDirty = true;
        }
    }

    /**
    * Changes the period attribute of a node.
    * If another node with the same label is already present in the new period 
    * they are merged in one node with the edges of both
    * @param period The node period
    * @param label The node current label
    * @param newPeriod The node new period
    */
    public updateNodePeriod(label: string, period: number, newPeriod: number) {
        Logger.log("updating node " + label + " from " + period + " to " + newPeriod);

        let node = this.getNode(period, label);
        if (node) {
            let relatedEdges = new Array<PZotEdge>();

            relatedEdges = relatedEdges.concat(this.getEdge(node));
            relatedEdges = relatedEdges.concat(this.getEdge(undefined, node));

            this.removeNode(period, label);
            node.period = newPeriod;

            if (!this.getNode(newPeriod, label))
                relatedEdges.forEach(edge => {
                    //Not a duplicate, we readd the edges, otherwise edges get 
                    //translated to use new id and added by layout
                    this.addEdge(edge);
                });

            this.addNode(node);
            this.isDirty = true;
        }
    }

    /**
    * Returns the edge between two nodes. if used with onyly one parameter 
    * returns all the nodes leaving/arriving to that node
    * @param source The source node (optional)
    * @param target The target node (optional)
    * @returns Edge or Array of edges
    */
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

    /**
    * Returns an Array containig all the edges
    * @returns Array of all the edges
    */
    public getEdges(): Array<PZotEdge> {
        return this.edges;
    }

    /**
    * Adds a new edge. If its duplicate or a loop gets ignored
    * @param edge The edge to add
    */
    public addEdge(edge: PZotEdge) {
        let duplicate = false;
        this.edges.forEach(element => {
            if (edge.source == element.source && edge.target == element.source)
                duplicate = true;
        });
        //We do not want loops
        if (edge.source != edge.target && !duplicate) {
            Logger.log("Graph - Adding edge from: " + edge.source.toString() + " to: " + edge.target.toString());
            this.edges.push(edge);

            let sourceNode = this.getNodeByID(edge.source);
            if (sourceNode)
                sourceNode.addDependency(edge.target);
        }
    }

    /**
    * removes a node and recalculates the graph period bounds
    * @param period The node period
    * @param label The node current label
    */
    public removeNode(period: number, label: string): void {
        let node = this.getNode(period, label);
        let nodesByPeriod = this.nodes.get(period);
        if (nodesByPeriod && node) {

            this.removeRelatedEdges(nodesByPeriod.get(label));
            nodesByPeriod.delete(label);
            this.nodesID.delete(node.id);

            this.nodeCount--;

            //It was the only node in the period
            if (nodesByPeriod.size == 0) {
                //We eliminate the period as it's empty from the collection
                this.nodes.delete(period);

                //It's a bound period and we need to adjust the bounds
                if (period == this.periodLowerBound) {
                    this.periodLowerBound = Math.min(...Array.from(this.nodes.keys()));
                    Logger.log("New LowerBound is " + this.periodLowerBound);
                    this.computePeriodCount();
                    Logger.log("New PeriodCount is " + this.periodCount);
                }
                if (period == this.periodUpperBound) {
                    this.periodUpperBound = Math.max(...Array.from(this.nodes.keys()));
                    Logger.log("New UpperBound is " + this.periodUpperBound);
                    this.computePeriodCount();
                    Logger.log("New PeriodCount is " + this.periodCount);
                }
            }

            this.isDirty = true;
        } else {
            Logger.log("No period " + period + " in graph");
            Logger.log(this.toString());
        }
    }


    /**
    * Removes all the starting/arriving edges from a node.
    * @param node The node
    */
    private removeRelatedEdges(node?: PZotNode) {
        if (node) {
            let relatedEdges = new Array<PZotEdge>();

            relatedEdges = relatedEdges.concat(this.getEdge(node));
            relatedEdges = relatedEdges.concat(this.getEdge(undefined, node));

            relatedEdges.forEach(edge => {
                this.removeEdge(edge.source, edge.target);
            });
        }
    }


    /**
    * Removes an edge.
    * @param source The source node 
    * @param target The target node 
    */
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

    /**
    * Removes all nodes and all edges.
    */
    public clear() {
        this.nodes = new Map<number, Map<string, PZotNode>>();
        this.edges = new Array<PZotEdge>();
        this.isDirty = true;
    }

    /**
    * Creates the Pot Dependency Formula.
    * @returns The string containing the formula
    */
    public toDepFormula(): string {
        let dependecies = "";
        let mainNodes = this.getNodesList();

        //If we have only one dependency we do not need to put it in AND
        if (mainNodes.length > 1) {
            Logger.log("more than 1 node");

            dependecies = "(&& ";

            mainNodes.forEach(node => {
                Logger.log("Node: " + this.nodeToDependendency(node));
                dependecies = dependecies + this.nodeToDependendency(node);
            });

            dependecies = dependecies + ")";
        } else if (mainNodes.length = 1) {
            dependecies = this.nodeToDependendency(mainNodes[0]);
        }

        return dependecies;
    }

    /**
   * Transforms the graph instance in a PZot formula with all his dependencies 
   * @returns A string containing the PZot formula
   */
    public nodeToDependendency(node: PZotNode): string {
        let dependencies = node.getDependencies();
        if (dependencies.size > 0) {
            let dependecy = "(dep " + node.toLitteral();

            dependencies.forEach(dep => {
                let depNode = this.getNodeByID(dep);
                if(depNode)
                    dependecy = dependecy + (depNode.toLitteral());
            });

            return dependecy + ")";
        } else return "";
    }

    /**
   * Transforms the graph instance in string with the most important parameters 
   * @returns the string representation of the graph
   */
    public toString(): string {
        let result = "Graph lowerbound: " + this.periodLowerBound + " upperbound: " + this.periodUpperBound;
        result = result + " maxNodes: " + this.maxNodesInPeriod + " nodeCount: " + this.nodeCount + "\n";
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