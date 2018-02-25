import { ContainerModule } from "inversify";
import { LanguageClientContribution } from '@theia/languages/lib/browser';
import { DslClientContribution } from "./language-contribution";
import { PZotUri } from "./pzot-uri";
import { PZotDependencyGraphOpenHandler } from "./dependency-graph-open-handler";
import { OpenHandler } from "@theia/core/lib/browser";
import { PZotGraphResourceResolver } from "./pzot-graph-resource";
import { ResourceResolver } from "@theia/core";

export default new ContainerModule(bind => {
    bind<LanguageClientContribution>(LanguageClientContribution).to(DslClientContribution).inSingletonScope();

    bind(PZotUri).toSelf().inSingletonScope();

    bind(PZotGraphResourceResolver).toSelf().inSingletonScope();
    bind(ResourceResolver).toDynamicValue(ctx => ctx.container.get(PZotGraphResourceResolver)).inSingletonScope();

    bind(PZotDependencyGraphOpenHandler).toSelf().inSingletonScope();
    bind(OpenHandler).toDynamicValue(ctx => ctx.container.get(PZotDependencyGraphOpenHandler)).inSingletonScope();
});

