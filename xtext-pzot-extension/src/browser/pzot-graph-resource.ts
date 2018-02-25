import { injectable, inject } from "inversify";
import { ResourceResolver, Resource, ResourceProvider, DisposableCollection, Emitter, Event } from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { FileSystem } from '@theia/filesystem/lib/common';
import { Workspace } from '@theia/languages/lib/common';
import { PZotUri } from "./pzot-uri";
import { PZotGraphEngine, Edge, Node } from "./pzot-graph-engine";

export class PZotGraphResource implements Resource {

    protected readonly originalUri: string;
    protected readonly toDispose = new DisposableCollection();
    protected readonly onDidChangeContentsEmitter = new Emitter<void>();

    private operatorRegex = /(?=\()\W\w+|(?=\()\W\W\W/;

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
        const document = this.workspace.textDocuments.find(document => document.uri === this.originalUri);
        if (document) {
            console.log("DOC: " + document.getText());
            this.ParseDependencies(document.getText());
            return this.render(document.getText());
        }
        return this.render(await this.originalResource.readContents(options));
    }

    protected render(text: string): string {
        return this.engine.render(text);
    }

    reloadGraph(): any {
        this.engine.reloadGraph();
    }

    /**
    * ParseDependencies
    */
    public ParseDependencies(text: string) {
        try {
            if (text != null) {
                console.log(text);
                let startTrim = text.indexOf("DEPENDENCIES:") + 13;
                let endTrim = text.indexOf("FORMULA:") - 13;
                let dep = text.substr(startTrim, endTrim)

                if (dep != null) {
                    this.ParseDepende(dep);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    private ParseDepende(text: string) {
        let input = text.replace(/\s|[\r\n]+/gm, "");
        let counter = 10
        while (input != "" && counter > 0) {
            let operator = input.match(this.operatorRegex);

            if (operator != null) {
                console.log(" Operator :{ " + operator[0] + " } OP Lenght: " + operator[0].length);
                
                input = input.substring(operator[0].length, input.length);

                if (operator[0].match(/\(dep/)) {
                    console.log("dep!");
                    this.ParseDEPItems(input);
                }

                console.log(operator[0] + " - INPUT: { " + input + " }");
            }

            counter -- ;
        }
    }

    private ParseDEPItems(text: string) {
        let items = text.split(")(");

        items.forEach(element => {
            let index = items.indexOf(element);
            console.log("index: - " + index);
            element = element.replace(/\(|\)/g, '');
            this.engine.AddNode(new Node(element));
            
            if (index != 0) {
                let edge = new Edge(this.engine.GetNode(0), this.engine.GetNode(index));
                this.engine.AddEdge(edge)
                console.log("new edge!: - " + edge);
            }
        });
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