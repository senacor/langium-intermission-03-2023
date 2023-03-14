import { DefaultDocumentSymbolProvider, DocumentSymbolProvider } from "langium/src/lsp";
import { LangiumServices } from "langium/src/services";

export class TinyDslDocumentSymbolProvider extends DefaultDocumentSymbolProvider {

    constructor(services: LangiumServices) {
        super(services);
    }
}