import { ContainerModule, interfaces } from "inversify";
import { LanguageClientContribution } from '@theia/languages/lib/browser';
import { DslClientContribution } from "./language-contribution";
import { PZotUri } from "./pzot-uri";
import { PZotDependencyGraphOpenHandler } from "./dependency-graph-open-handler";
import { OpenHandler } from "@theia/core/lib/browser";
import { PZotGraphResourceResolver } from "./pzot-graph-resource";
import { ResourceResolver } from "@theia/core";
//import { FileSystemListener } from "./pzot-filesystem-listener";
//import { FileSystem, fileSystemPath } from "@theia/filesystem/lib/common";
//import {  WebSocketConnectionProvider } from "@theia/core/lib/browser";

export default new ContainerModule((bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {
    bind<LanguageClientContribution>(LanguageClientContribution).to(DslClientContribution).inSingletonScope();

    bind(PZotUri).toSelf().inSingletonScope();

    bind(PZotGraphResourceResolver).toSelf().inSingletonScope();
    bind(ResourceResolver).toDynamicValue(ctx => ctx.container.get(PZotGraphResourceResolver)).inSingletonScope();

    bind(PZotDependencyGraphOpenHandler).toSelf().inSingletonScope();
    bind(OpenHandler).toDynamicValue(ctx => ctx.container.get(PZotDependencyGraphOpenHandler)).inSingletonScope();

    // bind(FileSystemListener).toSelf().inSingletonScope();
    // rebind(FileSystem).toDynamicValue(ctx => {
    //     const filesystem = WebSocketConnectionProvider.createProxy<FileSystem>(ctx.container, fileSystemPath);
    //     ctx.container.get(FileSystemListener).listen(filesystem);
    //     return filesystem;
    // }).inSingletonScope();
});

