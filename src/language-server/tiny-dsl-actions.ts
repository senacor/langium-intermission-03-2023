import {
    AstReflection,
    CodeActionProvider,
    IndexManager,
    LangiumDocument,
    LangiumServices,
    MaybePromise,
} from 'langium';
import { CodeActionKind, Diagnostic } from 'vscode-languageserver';
import { CodeActionParams } from 'vscode-languageserver-protocol';
import { CodeAction, Command } from 'vscode-languageserver-types';

import { Issues } from './tiny-dsl-validator';

export class TinyDslActionProvider implements CodeActionProvider {
    protected readonly reflection: AstReflection;
    protected readonly indexManager: IndexManager;

    constructor(services: LangiumServices) {
        this.reflection = services.shared.AstReflection;
        this.indexManager = services.shared.workspace.IndexManager;
    }

    getCodeActions(document: LangiumDocument, params: CodeActionParams): MaybePromise<Array<Command | CodeAction>> {
        const result: CodeAction[] = [];
        const acceptor = (ca: CodeAction | undefined) => ca && result.push(ca);
        for (const diagnostic of params.context.diagnostics) {
            this.createCodeActions(diagnostic, document, acceptor);
        }
        return result;
    }

    private createCodeActions(
        diagnostic: Diagnostic,
        document: LangiumDocument,
        accept: (ca: CodeAction | undefined) => void,
    ): void {
        switch (diagnostic.code) {
            case Issues.Entity_NameNotCapitalized.code:
                accept(this.makeUpperCase(diagnostic, document));
                break;
        }
        return undefined;
    }

    private makeUpperCase(diagnostic: Diagnostic, document: LangiumDocument): CodeAction {
        const range = {
            start: diagnostic.range.start,
            end: {
                line: diagnostic.range.start.line,
                character: diagnostic.range.start.character + 1,
            },
        };
        return {
            title: 'Change first letter to upper case',
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: true,
            edit: {
                changes: {
                    [document.textDocument.uri]: [
                        {
                            range,
                            newText: document.textDocument.getText(range).toUpperCase(),
                        },
                    ],
                },
            },
        };
    }
}
