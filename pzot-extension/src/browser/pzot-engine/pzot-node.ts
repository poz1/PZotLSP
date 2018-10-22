import { number } from "prop-types";

export class PZotNode {
    public label: string = "";
    public id: number;
    public period: number;
    
    public periodUpperBound = 0;
    public periodLowerBound = 0;
    
    // //Array of the nodes reachable from this node thorugh an edge
    // public stratingEdges = new Array<number>();
    // //Array of the nodes that can reach this node thorugh an edge
    // public endingEdges = new Array<number>();

    //TODO we can store just the ID of the node
    private dependencies = new Array<PZotNode>();

    /**
    * Creates a new node instance starting from a PZot formula of a litteral
    * @param formula  The PZot formula of a litteral ( Eg. (next(-p- sample)) )
    */
    constructor(formula?:string) {
        if(formula)
            this.parsePZotItem(formula);
    }

    /**
    * Parses the node portion of the formula (that may contain next or yesterday tokens to define the period).
    * Eg. (next(-p- sample))
    * @param formula  The formula portion to parse.
    */
    private parsePZotItem(formula: string) {
        if ( formula != "undefined") {
            let n = (formula.match(/next/g) || []).length;
            let p = (formula.match(/yesterday/g) || []).length;

            formula = formula.replace(/\(|\)|-p-|next|yesterday/g, '');

            this.label = formula;
            this.period = n - p;

            this.periodUpperBound = this.period;
            this.periodLowerBound = this.period;
        }
    }

    /**
    * Add a new dependency (in the form of a node) to the node
    * @param node  The node that we want to depend on this one.
    */
    public addDependency(node: PZotNode) {
        this.dependencies.push(node)

        if (node.period > this.periodUpperBound) {
            this.periodUpperBound = node.period;
        }

        if (node.period < this.periodLowerBound) {
            this.periodLowerBound = node.period;
        }
    }

    //mbho
    public normalizePeriod(offset: number) {
        this.period += offset;
    }

    /**
    * Transforms the node instance in a PZot formula with all his dependencies 
    * @returns A string containing the PZot formula
    */
    public toDependendency(): string {
        if(this.dependencies.length > 0){
            let dependecy = "(dep " + this.toLitteral();

            this.dependencies.forEach(dep => {
                dependecy = dependecy + (dep.toLitteral());
            });

            return dependecy + ")";
        } else return "";
    }

    /**
    * Transforms the node instance in a PZot formula without his dependencies 
    * @returns A string containing the PZot formula
    */
    public toLitteral(): string {
        let litteral = "(-p- " + this.label + ")";
        let yn = "";
        
        this.period < 0 ? yn = "yesterday" : yn = "next";
        
        for (let index = Math.abs(this.period); index > 0; index --) {
            litteral = "(" + yn + " " + litteral + ")";
        }

        return litteral;
    }

    /**
    * ToString
    * @returns A string containing all the details about the node.
    */
    public toString():string {
       return("Node: " + this.label + " ID: " + this.id + " Period: " + this.period);
    }
}