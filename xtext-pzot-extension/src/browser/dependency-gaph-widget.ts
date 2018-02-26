import { Resource } from '@theia/core';
import { BaseWidget, Message } from '@theia/core/lib/browser';
import { PZotGraphResource } from './pzot-graph-resource';

export const PZOTGRAPH_WIDGET_CLASS = 'theia-pzot-dependecy-graph-widget';

export class PZotDependencyGraphWidget extends BaseWidget {

    constructor(
        protected readonly resource: PZotGraphResource
    ) {
        super();
        this.addClass(PZOTGRAPH_WIDGET_CLASS);
        this.node.tabIndex = 0;
        this.toDispose.push(resource);
        if (resource.onDidChangeContents) {
            this.toDispose.push(resource.onDidChangeContents(() => {
                this.resource.clearGraph();
                this.resource.parseDocument();
                this.update();
            }));
        }
        this.activate();
    }

    onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.resource.parseDocument();
        this.resource.readContents().then(html =>
            this.node.innerHTML = html
        );
        this.node.focus();
        this.update();
    }

    onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        this.resource.reloadGraph();
    }
}