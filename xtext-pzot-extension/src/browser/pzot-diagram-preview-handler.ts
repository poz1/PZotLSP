import { injectable, inject } from 'inversify';
import { PreviewHandler, RenderContentParams } from '@theia/preview/lib/browser';
import { ThemeService } from '@theia/core/lib/browser/theming';
import URI from "@theia/core/lib/common/uri";

@injectable()
export class PZotDiagramPreviewHandler implements PreviewHandler {

    readonly contentClass: string = 'pzot-preview';

    protected theme: string;

    constructor() {
        this.theme = ThemeService.get().getCurrentTheme().id;
        ThemeService.get().onThemeChange(event => this.theme = event.newTheme.id);
    }

    canHandle(uri: URI): number {
        return uri.path.ext === '.pzot' ? 500 : 0;
    }

    async renderContent(params: RenderContentParams): Promise<HTMLElement | undefined> {
        const contentElement = document.createElement('div');
        contentElement.classList.add(this.contentClass, this.theme);

        const content = "this.useMonochromeTheme(params.content)";
        const url = this.createRequestUrl(content);
        try {
            const response = await fetch(url);
            const renderedContent = await response.text();
            contentElement.innerHTML = renderedContent;
            this.fixSvg(contentElement);
        } catch (error) {
            console.log(error);
            contentElement.classList.add('error');
            contentElement.innerText = `Failed to load diagram`;
        }
        return contentElement;
    }

    protected fixSvg(element: HTMLElement): void {
        const candidates = element.getElementsByTagName('svg');
        if (candidates.length > 0) {
            const svgElement = candidates.item(0);
            if (svgElement) {
                svgElement.removeAttribute('zoomAndPan');
                svgElement.setAttribute('style', 'width: 100%; height: 100%;');
                svgElement.setAttribute('preserveAspectRatio', 'xMinYMin meet');
                const viewBoxValue = svgElement.getAttribute('viewBox') || '';
                const width = svgElement.getAttribute('width') || '';
                const height = svgElement.getAttribute('height') || '';
                svgElement.removeAttribute('height');
                svgElement.removeAttribute('width');
                element.addEventListener('dblclick', mouseEvent => {
                    if (svgElement.getAttribute('viewBox')) {
                        svgElement.removeAttribute('viewBox');
                        svgElement.setAttribute('style', `width: ${width}; height: ${height};`);
                    } else {
                        svgElement.setAttribute('viewBox', viewBoxValue);
                        svgElement.setAttribute('style', 'width: 100%; height: 100%;');
                    }
                });
            }
        }
    }

    protected createRequestUrl(content: string): string {
        const encoded =" plantumlEncoder.encode(content)";
        const serviceUri = new URI("this.preferences[PLANTUML.WEBSERVICE]");
        return serviceUri.withPath(serviceUri.path.join(encoded)).toString();
    }

    // protected useMonochromeTheme(content: string): string {
    //     if (!this.preferences[PLANTUML.MONOCHROME]) {
    //         return content;
    //     }
    //     if (content.indexOf('skinparam') > 0) {
    //         return content;
    //     }
    //     const monochrome = this.theme === 'dark' ? 'reverse' : 'true';
    //     return content.replace('@startuml', `@startuml\nskinparam monochrome ${monochrome}\nskinparam backgroundColor transparent\n`);
    // }

}