import { PZotNode } from "./pzot-node";

export class PZotEdge {
    source: number;
    target: number;

    constructor(source: number, target: number) {
        this.source = source;
        this.target = target;
    }

    public toString():string {
        return("Edge from ID: " + this.source + " to ID: " + this.target);
    }
}
