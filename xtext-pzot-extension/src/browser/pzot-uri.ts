import { injectable } from "inversify";
import URI from "@theia/core/lib/common/uri";

@injectable()
export class PZotUri {
    public static schemePrefix = 'pzot.';
    from(pzotUri: URI): URI {
        const scheme = pzotUri.scheme;
        if (!scheme.startsWith(PZotUri.schemePrefix)) {
            throw new Error('The given URI is not a PZot URI, ' + pzotUri);
        }
        return pzotUri.withScheme(scheme.substr(PZotUri.schemePrefix.length));
    }
    to(uri: URI): URI {
        if (uri.path.ext !== '.pzot') {
            throw new Error('The given URI is not a PZot URI, ' + uri);
        }
        return uri.withScheme(PZotUri.schemePrefix + uri.scheme);
    }
}