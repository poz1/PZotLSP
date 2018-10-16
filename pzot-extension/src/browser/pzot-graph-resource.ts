import { injectable, inject } from "inversify";
import { ResourceResolver, Resource, ResourceProvider, DisposableCollection, Emitter, Event } from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { FileSystem } from '@theia/filesystem/lib/common';
import { Workspace} from '@theia/languages/lib/browser';
import { PZotUri } from "./pzot-uri";
import { PZotGraphEngine } from "./pzot-graph-engine";
import { ConsoleLogger } from "vscode-ws-jsonrpc/lib";
import { PZotGraph } from "./pzot-engine/pzot-graph";

// export class PZotGraphItem {
//     label: string = "";
//     period: number = 0;
//     id: string = "";
//     periodUpperBound = 0;
//     periodLowerBound = 0;

//     private dependencies = new Array<PZotGraphItem>();

//     constructor(text: string) {
//         this.parsePZotItem(text);
//     }

//     get isParent() {return this.dependencies.length != 0}

//     private parsePZotItem(element: string) {
//         if ( element != "undefined") {
//             let n = (element.match(/next/g) || []).length;
//             let p = (element.match(/yesterday/g) || []).length;

//             element = element.replace(/\(|\)|-p-|next|yesterday/g, '');

//             this.label = element;
//             this.period = n - p;

//             this.periodUpperBound = this.period;
//             this.periodLowerBound = this.period;
//         }
//     }

//     /**
//      * addChildren
//      */
//     public addDependency(node: PZotGraphItem) {
//         this.dependencies.push(node)

//         if (node.period > this.periodUpperBound) {
//             this.periodUpperBound = node.period;
//         }

//         if (node.period < this.periodLowerBound) {
//             this.periodLowerBound = node.period;
//         }
//     }

//     /**
//      * getChildren
//      */
//     public getDependencies(): Array<PZotGraphItem> {
//         return this.dependencies;
//     }

//     /**
//      * toString
//      */
//     public toString() {
//         console.log("Node: " + this.label);
//         console.log("UpperBound: " + this.periodUpperBound + "LowerBound: " + this.periodLowerBound);
//         console.log("Children: ");
//         this.dependencies.forEach(element => {
//             element.toString();
//         });
//     }
// }

export class PZotGraphResource implements Resource {

    protected readonly originalUri: string;
    protected readonly toDispose = new DisposableCollection();
    protected readonly onDidChangeContentsEmitter = new Emitter<void>();

    // private items = new Array<PZotGraphItem>();
    
    // private periodUpperBound = 0;
    // private periodLowerBound = 0;
    public updatingDeps = false;
    private formula = "";

    constructor(
        public readonly uri: URI,
        protected readonly originalResource: Resource,
        protected readonly workspace: Workspace,
        protected readonly engine: PZotGraphEngine
    ) {
        this.originalUri = this.originalResource.uri.toString();
        this.toDispose.push(originalResource);
        this.toDispose.push(this.onDidChangeContentsEmitter);
        if (originalResource.onDidChangeContents) {
            this.toDispose.push(originalResource.onDidChangeContents(() => this.fireDidChangeContents()));
        }
        this.toDispose.push(this.workspace.onDidOpenTextDocument(({ uri }) => this.fireDidChangeContents(uri)));
        this.toDispose.push(this.workspace.onDidChangeTextDocument(({ textDocument }) => this.fireDidChangeContents(textDocument.uri)));
        this.toDispose.push(this.workspace.onDidCloseTextDocument(({ uri }) => this.fireDidChangeContents(uri)));
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    get onDidChangeContents(): Event<void> {
        return this.onDidChangeContentsEmitter.event;
    }

    protected fireDidChangeContents(affectedUri?: string): void {
        if (this.shouldFireDidChangeContents(affectedUri)) {
            this.onDidChangeContentsEmitter.fire(undefined);
        }
    }
    protected shouldFireDidChangeContents(affectedUri?: string): boolean {
        return !affectedUri || affectedUri === this.originalUri;
    }

    async readContents(options?: { encoding?: string | undefined; }): Promise<string> {
        return this.engine.initializeGraphContainer(this);
    }

    public updateDependencies(text: string) {
        if (this.originalResource.saveContents) {
            this.originalResource.saveContents("DEPENDENCIES: " + text + "\n" + this.formula);
        }
    }

   

    //TODO move to graph class
    // public pzotGraphItemToDependendency(source: PZotGraphItem): string {
    //     let dependecy = "(dep " + this.pzotGraphItemToLitteral(source);

    //     source.getDependencies().forEach(child => {
    //         dependecy = dependecy + this.pzotGraphItemToLitteral(child);
    //     });

    //     return dependecy + ")";
    // }

    // public pzotGraphItemToLitteral(source: PZotGraphItem): string {
    //     let litteral = "(-p- " + source.label + ")";
    //     let yn = "";
        
    //     source.period < 0 ? yn = "yesterday" : yn = "next";
        
    //     for (let index = Math.abs(source.period); index > 0; index --) {
    //         litteral = "(" + yn + " " + litteral + ")";
    //     }

    //     return litteral;
    // }

    

    public renderGraph(graph:PZotGraph) {
        console.log("Render Request");
        //TODO change to use graph
        this.engine.renderGraph(graph);
    }

    public layoutGraph() {
        this.engine.layoutGraph();
    }

    /**
    * ParseDependencies
    * @returns Dependencies Formula extrated from the document
    */
    public parseDocument() : string  {
        try {
            let dep = "";
            const document = this.workspace.textDocuments.find(document => document.uri === this.originalUri);
            if (document) {
                let text = document.getText();
                
                if (text != null) {
                    let startTrim = text.indexOf("DEPENDENCIES:") + 13;
                    let endTrim = text.indexOf("FORMULA:") - 13;
                    
                    this.formula = text.substr(endTrim + 13);
                    dep = dep + text.substr(startTrim, endTrim)

                    
                        
                        //this.parseDependencies(dep);
                        //this.calculateTimeBounds();
                        // this.logNodes();
                    
                }
            }
            return dep;
        } catch (error) {
            console.log(error);
            return "";
        }
    }

    // private parseDependencies(text: string) {
    //     let input = text.replace(/\s|[\r\n]+/gm, "");
    //     let operators = input.match(/(?=\()\W\w+|(?=\()\W\W\W/g);

    //     if (operators != null ) {
    //         operators.forEach(operator => {
    //             if (input != "") {
    //                 if (operator.match(/\(dep/)) {
    //                     let deps = input.split("(dep");
    //                     deps.forEach(element => {
    //                         this.parseDependency(element);
    //                         input = input.substring(element.length + operator.length);
    //                     });
        
    //                 } else {
    //                     input = input.substring(operator.length);
    //                 }
    //             }
    //         });
    //     }    
    // }

    // private parseDependency(text: string) {
    //     let nodes = text.split(")(");
        
    //     if (nodes != null) {
    //         let mainNode = new PZotGraphItem('%null%');

    //         nodes.forEach(element => {
    //             if (element != "") {
    //                 let index = nodes.indexOf(element);

    //                 if (index == 0) {
    //                     mainNode = new PZotGraphItem(element);
    //                 } else {
    //                     mainNode.addDependency(new PZotGraphItem(element))
    //                 }
    //             }
    //         });

    //         if (mainNode.label != '%null%') {
    //             this.items.push(mainNode);
    //         }
    //     }
    // }

    // private createGraph() {
    //     this.engine.addData(this.items);
    // }
    
    // private calculateTimeBounds() {
    //     this.items.forEach(node => {
    //         if (node.periodUpperBound > this.periodUpperBound) {
    //             this.periodUpperBound = node.periodUpperBound;
    //         }
    
    //         if (node.periodLowerBound < this.periodLowerBound) {
    //             this.periodLowerBound = node.periodLowerBound;
    //         }
    //     });
    // }

    // public clearGraph() {
    //     this.items = new Array<PZotGraphItem>();
    // }
}

@injectable()
export class PZotGraphResourceResolver implements ResourceResolver {

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(PZotUri)
    protected readonly pzotUri: PZotUri;

    @inject(Workspace)
    protected readonly workspace: Workspace;

    @inject(ResourceProvider)
    protected readonly resourceProvider: ResourceProvider;

    async resolve(uri: URI): Promise<PZotGraphResource> {
        const resourceUri = this.pzotUri.from(uri);
        const originalResource = await this.resourceProvider(resourceUri);
        return new PZotGraphResource(uri, originalResource, this.workspace, this.getEngine());
    }

    protected engine: PZotGraphEngine | undefined;
    protected getEngine(): PZotGraphEngine {
        if (!this.engine) {
            this.engine = new PZotGraphEngine();
        }
        return this.engine;
    }
}