import { injectable, inject } from "inversify";
import { ResourceResolver, Resource, ResourceProvider, DisposableCollection, Emitter, Event } from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { FileSystem } from '@theia/filesystem/lib/common';
import { Workspace} from '@theia/languages/lib/browser';
import { PZotUri } from "./pzot-uri";
import { PZotGraphLayout } from "./pzot-graph-layout";
import { PZotGraph } from "./pzot-engine/pzot-graph";
import { Logger } from "../debug";

export class PZotGraphResource implements Resource {

    protected readonly originalUri: string;
    protected readonly toDispose = new DisposableCollection();
    protected readonly onDidChangeContentsEmitter = new Emitter<void>();

    public updatingDeps = false;
    private formula = "";

    constructor(
        public readonly uri: URI,
        protected readonly originalResource: Resource,
        protected readonly workspace: Workspace,
        protected readonly engine: PZotGraphLayout
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

    public setGraph(graph:PZotGraph) {
        Logger.log("Changing Graph");
        this.engine.setGraph(graph);
    }

    public renderGraph() {
        Logger.log("Render Request");
        this.engine.renderGraph();
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
                }
            }
            return dep;
        } catch (error) {
            Logger.log(error);
            return "";
        }
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
        return new PZotGraphResource(uri, originalResource, this.workspace, this.getLayout());
    }

    protected layout: PZotGraphLayout | undefined;
    
    protected getLayout(): PZotGraphLayout {
        if (!this.layout) {
            this.layout = new PZotGraphLayout();
        }
        return this.layout;
    }
}