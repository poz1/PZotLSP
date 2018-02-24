import { injectable, inject } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { ResourceProvider } from '@theia/core/lib/common';
import { OpenHandler, FrontendApplication } from '@theia/core/lib/browser';
import { PZotUri } from './pzot-uri';
import { PZotDependencyGraphWidget } from './dependency-gaph-widget';

@injectable()
export class PZotDependencyGraphOpenHandler implements OpenHandler {

    readonly id = 'pzot.openGraph';
    readonly label = 'Open Dependency Graph';

    protected widgetSequence = 0;
    protected readonly widgets = new Map<string, Promise<PZotDependencyGraphWidget>>();

    @inject(FrontendApplication)
    protected readonly app: FrontendApplication;

    @inject(PZotUri)
    protected readonly pzotURI: PZotUri;

    @inject(ResourceProvider)
    protected readonly resourceProvider: ResourceProvider;

    canHandle(uri: URI): number {
        try {
            this.pzotURI.to(uri);
            return 50;
        } catch {
            return 0;
        }
    }

    async open(uri: URI): Promise<PZotDependencyGraphWidget | undefined> {
        const widget = await this.getWidget(uri);
        this.app.shell.addWidget(widget, {area: 'main'});
        return widget;
    }

    protected getWidget(uri: URI): Promise<PZotDependencyGraphWidget> {
        const widget = this.widgets.get(uri.toString());
        if (widget) {
            return widget;
        }
        const promise = this.createWidget(uri);
        promise.then(widget => widget.disposed.connect(() =>
            this.widgets.delete(uri.toString())
        ));
        this.widgets.set(uri.toString(), promise);
        return promise;
    }

    protected async createWidget(uri: URI): Promise<PZotDependencyGraphWidget> {
        const pzotUri = this.pzotURI.to(uri);
        const resource = await this.resourceProvider(pzotUri)
        const widget = new PZotDependencyGraphWidget(resource);
        widget.id = `pzot-dependecy-graph-` + this.widgetSequence++;
        widget.title.label = `Dependency Graph of '${uri.path.base}'`;
        widget.title.caption = widget.title.label;
        widget.title.closable = true;
        this.app.shell.addWidget(widget, {area: 'main'});
        return widget;
    }
}