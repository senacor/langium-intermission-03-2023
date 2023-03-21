import { AstNode } from 'langium';
import { NodeFileSystem } from 'langium/node';
import * as vscode from 'vscode';
import { Range } from 'vscode-languageclient';

import { extractAstNodes } from '../generator/generator-utils';
import {
	Document,
	Entity,
	Field,
	isField,
} from '../language-server/generated/ast';
import { createTinyDslServices } from '../language-server/tiny-dsl-module';

export class DeprecatedTinyDslDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    private format(cmd: string): string {
        return cmd
            .substr(1)
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase());
    }

    public provideDocumentSymbols(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken,
    ): Promise<vscode.DocumentSymbol[]> {
        return new Promise((resolve, _reject) => {
            const symbols: vscode.DocumentSymbol[] = [];

            const inputFiles = [document.fileName];
            const services = createTinyDslServices(NodeFileSystem).TinyDsl;
            const models = extractAstNodes<Document>(inputFiles, services);

            return models[0]
                .then((model) => model.entities.forEach((entity) => symbols.push(this.mapEntity(entity))))
                .then((_nodes) => resolve(symbols));
        });
    }

    mapEntity(entity: Entity) {
        const range = this.getRange(entity);
        const symbol = this.createDocumentSymbol(entity.name, 'Entity', vscode.SymbolKind.Class, range);

        const fieldSymbols = entity.members
            .filter((member) => isField(member))
            .map((field) => this.mapField(field as Field));
        symbol.children = fieldSymbols;

        return symbol;
    }

    mapField(field: Field) {
        const range = this.getRange(field);
        const symbol = this.createDocumentSymbol(field.name, 'Field', vscode.SymbolKind.Field, range);
        return symbol;
    }

    getRange(node: AstNode): Range {
        return (
            node.$cstNode?.range || {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 0 },
            }
        );
    }

    createDocumentSymbol(name: string, type: string, kind: vscode.SymbolKind, range: Range): vscode.DocumentSymbol {
        return new vscode.DocumentSymbol(
            name,
            type,
            vscode.SymbolKind.Class,
            this.mapRange(range),
            this.mapRange(range),
        );
    }

    mapRange(range: Range): vscode.Range {
        return new vscode.Range(
            new vscode.Position(range.start.line, range.start.character),
            new vscode.Position(range.end.line, range.end.character),
        );
    }
}
