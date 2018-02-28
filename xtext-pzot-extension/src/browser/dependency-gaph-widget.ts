import { Resource } from '@theia/core';
import { BaseWidget, Message } from '@theia/core/lib/browser';
import { PZotGraphResource } from './pzot-graph-resource';
import { Widget } from '@phosphor/widgets';

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
                console.log("Widegt content Update");
                this.update();
            }));
        }
        this.activate();
    }

    onActivateRequest(msg: Message): void {
        console.log("Activating Widegt");
        super.onActivateRequest(msg);
        this.resource.readContents().then(html =>
            this.node.innerHTML = html
        ).then( () => { this.update(); });
    }

    onUpdateRequest(msg: Message): void {
        console.log("Widegt Update");
        super.onUpdateRequest(msg);
        
        this.resource.clearGraph();
        this.resource.parseDocument();
        this.resource.renderGraph();
    }

    onResize(msg: Widget.ResizeMessage) {
        console.log("Widegt Resize");
        super.onResize(msg);
        this.resource.layoutGraph();
    }
}