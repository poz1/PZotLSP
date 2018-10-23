import { PZotNode } from "./pzot-node";

export class PZotEdge {
    source: number;
    target: number;

    constructor(source: number, target: number) {
        this.source = source;
        this.target = target;
    }
    
    /**
    * ToString
    * @returns A string containing all the details about the edge.
    */
    public toString():string {
        return("Edge from ID: " + this.source + " to ID: " + this.target);
    }
}
