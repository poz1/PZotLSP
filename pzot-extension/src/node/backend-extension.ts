import { injectable, ContainerModule } from "inversify";
import { BaseLanguageServerContribution, LanguageServerContribution, IConnection } from "@theia/languages/lib/node";
import * as path from 'path';


export default new ContainerModule(bind => {
    bind<LanguageServerContribution>(LanguageServerContribution).to(DSLContribution);
});

@injectable()
class DSLContribution extends BaseLanguageServerContribution {

    readonly id = "pzot";
    readonly name = "PZot";

    start(clientConnection: IConnection): void {
        const jar = path.resolve(__dirname, '../../build/pzot-language-server.jar');

        const command = 'java';
        const args: string[] = [
            '-jar',
            jar
        ];
        const serverConnection = this.createProcessStreamConnection(command, args);
        this.forward(clientConnection, serverConnection);
    }

    protected onDidFailSpawnProcess(error: Error): void {
        super.onDidFailSpawnProcess(error);
        console.error("Error starting PZot language server.", error)
    }

}



