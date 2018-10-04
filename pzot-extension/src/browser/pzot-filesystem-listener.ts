import { injectable } from "inversify";
//import { ConfirmDialog } from "@theia/core/lib/browser";
import {  FileSystemClient, FileStat } from "@theia/filesystem/lib/common";
//import { FileSystem } from "@theia/filesystem/lib/common";

@injectable()
export class FileSystemListener implements FileSystemClient {
    onDidMove(sourceUri: string, targetUri: string): void {
        console.log("onDidMove: " + sourceUri + " - " + targetUri);
        //throw new Error("Method not implemented.");
    }

    // protected filesystem: FileSystem;
    // listen(filesystem: FileSystem): void {
    //     filesystem.setClient(this);
    //     this.filesystem = filesystem;
    // }

    async shouldOverwrite(file: FileStat, stat: FileStat): Promise<boolean> {
        return false;
    }
}