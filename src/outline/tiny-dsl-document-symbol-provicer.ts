import { DefaultDocumentSymbolProvider, LangiumServices } from "langium";
import { SymbolKind } from "vscode-languageserver-types";

export class TinyDslDocumentSymbolProvider extends DefaultDocumentSymbolProvider {

    constructor(services: LangiumServices) {
        super(services);
    }

    protected override getSymbolKind(type: string): SymbolKind {
        switch (type) {
            case 'Import':
                return SymbolKind.Package;
            case 'Entity':
                return SymbolKind.Class;
            case 'Field':
                return SymbolKind.Field;
            case 'Connection':
                return SymbolKind.Method
            default:
                return SymbolKind.Field;
        }
    }
}