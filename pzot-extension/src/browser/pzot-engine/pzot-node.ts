export class PZotNode {
    public label: string = "";
    public id: number;
    public period: number;
    public isParent: boolean;

    public periodUpperBound = 0;
    public periodLowerBound = 0;
    
    private dependencies = new Array<PZotNode>();

    constructor(text:string) {
        this.parsePZotItem(text);
    }

    private parsePZotItem(element: string) {
        if ( element != "undefined") {
            let n = (element.match(/next/g) || []).length;
            let p = (element.match(/yesterday/g) || []).length;

            element = element.replace(/\(|\)|-p-|next|yesterday/g, '');

            this.label = element;
            this.period = n - p;

            this.periodUpperBound = this.period;
            this.periodLowerBound = this.period;
        }
    }

    /**
    * addDependency
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

    public normalizePeriod(offset: number) {
        this.period += offset;
    }

    public toDependendency(): string {
        if(this.dependencies.length > 0){
            let dependecy = "(dep " + this.toLitteral();

            this.dependencies.forEach(dep => {
                dependecy = dependecy + (dep.toLitteral());
            });

            return dependecy + ")";
        } else return "";
    }

    public toLitteral(): string {
        let litteral = "(-p- " + this.label + ")";
        let yn = "";
        
        this.period < 0 ? yn = "yesterday" : yn = "next";
        
        for (let index = Math.abs(this.period); index > 0; index --) {
            litteral = "(" + yn + " " + litteral + ")";
        }

        return litteral;
    }

    public toString():string {
       return("Node: " + this.label + " ID: " + this.id + " Period: " + this.period + " isParent: " + this.isParent);
    }
}