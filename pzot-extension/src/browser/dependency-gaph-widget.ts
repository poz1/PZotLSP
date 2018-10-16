import { BaseWidget, Message } from '@theia/core/lib/browser';
import { PZotGraphResource } from './pzot-graph-resource';
import { Widget } from '@phosphor/widgets';
import { PZotGraph } from './pzot-engine/pzot-graph';
import { Logger } from '../debug';

export const PZOTGRAPH_WIDGET_CLASS = 'theia-pzot-dependecy-graph-widget';

export class PZotDependencyGraphWidget extends BaseWidget {

    constructor(protected readonly resource: PZotGraphResource) 
    {
        super();
        this.addClass(PZOTGRAPH_WIDGET_CLASS);
        this.node.tabIndex = 0;
        this.toDispose.push(resource);
        if (resource.onDidChangeContents) {
            this.toDispose.push(resource.onDidChangeContents(() => {
                Logger.log("Widegt content Update");
                //Fires onUpdateRequest
                this.update();
            }));
        }
        //Fires onActivateRequest
        this.activate();
    }

    onActivateRequest(msg: Message): void {
        Logger.log("Activating PZot Graph");
        super.onActivateRequest(msg);
        this.resource.readContents().then(html =>
            this.node.innerHTML = html
        ).then( () => { this.update(); });
    }

    onUpdateRequest(msg: Message): void {
        Logger.log("Updating wodget content to: " + msg);
        super.onUpdateRequest(msg);
        
        //this.resource.clearGraph();
        let dep = this.resource.parseDocument();
        this.resource.renderGraph(new PZotGraph(dep));
    }

    onResize(msg: Widget.ResizeMessage) {
        Logger.log("Widegt Resize");
        super.onResize(msg);
        this.resource.layoutGraph();
    }
}