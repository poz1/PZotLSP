import { PZotNode } from "./pzot-node";

export class PZotEdge {
    source: PZotNode;
    target: PZotNode;

    constructor(source: PZotNode, target: PZotNode) {
        this.source = source;
        this.target = target;
    }

    public toString():string {
        return("Edge from: " + this.source.label + " of period: " + this.source.period  + " with ID: " + this.source.id + 
                    " to: " + this.target.label + " of period: " + this.target.period + " with ID: " + this.target.id);
    }
}
