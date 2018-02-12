import { Resource } from '@theia/core';
import { BaseWidget, Message } from '@theia/core/lib/browser';

export const PZOTGRAPH_WIDGET_CLASS = 'theia-pzot-dependecy-graph-widget';

export class PZotDependencyGraphWidget extends BaseWidget {

    constructor(
        protected readonly resource: Resource
    ) {
        super();
        this.addClass(PZOTGRAPH_WIDGET_CLASS);
        this.node.tabIndex = 0;
        this.toDispose.push(resource);
        if (resource.onDidChangeContents) {
            this.toDispose.push(resource.onDidChangeContents(() => this.update()));
        }
        this.update();
    }

    onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
        this.update();
    }

    onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        this.resource.readContents().then(html =>
            this.node.innerHTML = html
        );
    }
}