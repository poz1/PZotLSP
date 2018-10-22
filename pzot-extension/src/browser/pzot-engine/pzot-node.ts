import { Logger } from "../../debug";

export class PZotNode {
    public label: string = "";
    public id: number;
    public period: number;
    
    private dependencies = new Set<number>();

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
        }
    }

    //TODO we can use just the node ID
    /**
    * Add a new dependency (in the form of a node) to the node
    * @param node  The node that we want to depend on this one.
    */
    public addDependency(nodeID: number) {
        Logger.log("Added dep: " + nodeID + " to: " + this.id);

        this.dependencies.add(nodeID)
    }

    /**
    * getDependencies
    */
    public getDependencies(): Set<number> {
        return this.dependencies;
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