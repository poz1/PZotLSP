import { injectable, inject } from "inversify";
import { ResourceResolver, Resource, ResourceProvider, DisposableCollection, Emitter, Event } from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { FileSystem } from '@theia/filesystem/lib/common';
import { Workspace } from '@theia/languages/lib/common';
import { PZotUri } from "./pzot-uri";
import { PZotGraphEngine, Edge, Node } from "./pzot-graph-engine";

export class PZotGraphItem {
    label: string = "";
    period: number = 0;

    periodUpperBound = 0;
    periodLowerBound = 0;

    private children = new Array<PZotGraphItem>();

    constructor(text: string) {
        this.parsePZotItem(text);
    }

    private parsePZotItem(element: string) {
        let n = (element.match(/next/g) || []).length;
        let p = (element.match(/yesterday/g) || []).length;

        element = element.replace(/\(|\)|-p-|next|yesterday/g, '');

        this.label = element;
        this.period = n - p;

        this.periodUpperBound = this.period;
        this.periodLowerBound = this.period;

    }

    /**
     * addChildren
     */
    public addChildren(node: PZotGraphItem) {
        this.children.push(node)

        if (node.period > this.periodUpperBound) {
            this.periodUpperBound = node.period;
        }

        if (node.period < this.periodLowerBound) {
            this.periodLowerBound = node.period;
        }
    }

    /**
     * getChildren
     */
    public getChildren(): Array<PZotGraphItem> {
        return this.children;
    }
}

export class PZotGraphResource implements Resource {

    protected readonly originalUri: string;
    protected readonly toDispose = new DisposableCollection();
    protected readonly onDidChangeContentsEmitter = new Emitter<void>();

    private operatorRegex = /(?=\()\W\w+|(?=\()\W\W\W/g;
    private items = new Array<PZotGraphItem>();
    
    private periodUpperBound = 0;
    private periodLowerBound = 0;

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
        return this.render();
    }

    protected render(): string {
        return this.engine.render();
    }

    reloadGraph(): any {
        this.engine.reloadGraph();
    }

    /**
    * ParseDependencies
    */
    public parseDocument() {
        try {
            const document = this.workspace.textDocuments.find(document => document.uri === this.originalUri);
            if (document) {
                let text = document.getText();
                console.log("DOC: " + document.getText());

                if (text != null) {
                    console.log(text);
                    let startTrim = text.indexOf("DEPENDENCIES:") + 13;
                    let endTrim = text.indexOf("FORMULA:") - 13;
                    let dep = text.substr(startTrim, endTrim)

                    if (dep != null) {
                        this.parseDependencies(dep);
                        this.calculateTimeBounds();
                        this.loadGraph();
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    private parseDependencies(text: string) {
        let input = text.replace(/\s|[\r\n]+/gm, "");
        let operators = input.match(this.operatorRegex);

        if (operators != null ) {
            operators.forEach(operator => {
                console.log(" Operator :{ " + operator + " } OP Lenght: " + operator.length);
                    
                input = input.substring(operator.length);

                if (operator.match(/\(dep/)) {
                    let deps = input.split("dep");
                    deps.forEach(element => {
                        console.log("dep! : " + element);
                        this.parseDependency(element);

                        input = input.substring(element.length);
                        console.log(" - REMAINS - : { " + input + " }");   
                    });
     
                }

                console.log(operator[0] + " - INPUT: { " + input + " }");        
            });
        }    
    }

    private parseDependency(text: string) {
        let nodes = text.split(")(");
        let mainNode = new PZotGraphItem('');

        nodes.forEach(element => {
            let index = nodes.indexOf(element);

            if (index == 0) {
                mainNode = new PZotGraphItem(element);
            } else {
                mainNode.addChildren(new PZotGraphItem(element))
            }
        });

        this.items.push(mainNode);
    }

    private loadGraph() {
        this.engine.setData(this.items);
        
    }
    
    private calculateTimeBounds() {
        this.items.forEach(node => {
            if (node.periodUpperBound > this.periodUpperBound) {
                this.periodUpperBound = node.periodUpperBound;
            }
    
            if (node.periodLowerBound < this.periodLowerBound) {
                this.periodLowerBound = node.periodLowerBound;
            }
        });
    }

    public clearGraph() {
        this.engine.clear();
    }
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