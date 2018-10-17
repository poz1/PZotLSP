import { PZotNode } from "./pzot-node";

export class PZotEdge {
    source: number;
    target: number;

    constructor(source: PZotNode, target: PZotNode) {
        this.source = source.id;
        this.target = target.id;
    }

    public toString():string {
        return("Edge from ID: " + this.source + " to ID: " + this.target);
    }
}
