import { injectable } from "inversify";
import { ConfirmDialog } from "@theia/core/lib/browser";
import { FileSystem, FileSystemClient, FileStat } from "@theia/filesystem/lib/common";

@injectable()
export class FileSystemListener implements FileSystemClient {

    protected filesystem: FileSystem;
    listen(filesystem: FileSystem): void {
        filesystem.setClient(this);
        this.filesystem = filesystem;
    }

    async shouldOverwrite(file: FileStat, stat: FileStat): Promise<boolean> {
        return false;
    }
}