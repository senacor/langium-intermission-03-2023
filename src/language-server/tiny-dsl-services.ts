import {
    AstNode,
    AstNodeDescription,
    AstNodeLocator,
    DefaultIndexManager,
    DefaultLanguageServer,
    IndexManager,
    LangiumDocument,
    LangiumDocuments,
    MaybePromise,
} from 'langium';
import {
    CancellationToken,
    InitializeParams,
    InitializeResult,
    SymbolKind,
    WorkspaceSymbol,
    WorkspaceSymbolParams,
} from 'vscode-languageserver';
import { URI } from 'vscode-uri';

import { TinyDslScopeComputation } from '../scoping/scope-computation';
import { Document, QualifiedName, TinyDslAstType } from './generated/ast';

import type { TinyDslServices } from './tiny-dsl-module';
/**
 * Service that allows to retrieve AstNodes from the IndexManager.
 */
export class IndexAccess {
    protected readonly documents: LangiumDocuments;
    protected readonly indexManager: IndexManager;
    protected readonly astNodeLocator: AstNodeLocator;
    protected readonly scopeComputation: TinyDslScopeComputation;

    constructor(protected services: TinyDslServices) {
        this.documents = services.shared.workspace.LangiumDocuments;
        this.indexManager = services.shared.workspace.IndexManager;
        this.astNodeLocator = services.workspace.AstNodeLocator;
        this.scopeComputation = services.references.ScopeComputation as TinyDslScopeComputation;
    }

    /**
     * Find all elements available in the global scope matching the given type and name.
     * @param fromNode The node from where you are looking for other nodes.
     * @param type The requested node type.
     * @param name The requested node name.
     * @returns Found AstNodes.
     */
    searchIndex(type: keyof TinyDslAstType, name?: QualifiedName): AstNodeDescription[] {
        return this.indexManager
            .allElements(type)
            .map((desc) => {
                return { ...desc, node: this.loadAstNode(desc) };
            })
            .filter((desc) => name === undefined || desc.name === name)
            .toArray();
    }

    getQualifiedName(node: AstNode): QualifiedName | undefined {
        return this.scopeComputation.getQualifiedName(node);
    }

    protected loadAstNode(nodeDescription: AstNodeDescription): AstNode | undefined {
        if (nodeDescription.node) {
            return nodeDescription.node;
        }
        const doc = this.documents.getOrCreateDocument(nodeDescription.documentUri);
        return this.astNodeLocator.getAstNode(doc.parseResult.value, nodeDescription.path);
    }
}

export class TinyDslIndexManager extends DefaultIndexManager {
    override isAffected(document: LangiumDocument, changed: URI): boolean {
        if (super.isAffected(document, changed)) {
            return true;
        }
        // The document is also affected if it lies inside the same package
        const thisDocument = document.parseResult.value as Document;
        const otherDocument = this.langiumDocuments().getOrCreateDocument(changed).parseResult.value as Document;
        return thisDocument.package === otherDocument.package;
    }
}

export class TinyDslLanguageServer extends DefaultLanguageServer {
    override buildInitializeResult(_params: InitializeParams): InitializeResult {
        const result = super.buildInitializeResult(_params);
        result.capabilities.workspaceSymbolProvider = true;
        return result;
    }
}

export interface WorkspaceSymbolProvider {
    provideSymbols(
        params: WorkspaceSymbolParams,
        cancelToken?: CancellationToken,
    ): MaybePromise<WorkspaceSymbol[] | undefined>;
}

export class TinyDslWorkspaceSymbolProvider implements WorkspaceSymbolProvider {
    constructor(protected services: TinyDslServices) {
        services.shared.lsp.Connection!.onWorkspaceSymbol((params: any, token: any) =>
            this.provideSymbols(params, token),
        );
    }

    provideSymbols(_params: WorkspaceSymbolParams, _cancelToken?: CancellationToken) {
        const result: WorkspaceSymbol[] = [];
        for (const element of this.services.shared.workspace.IndexManager.allElements()) {
            result.push({
                name: element.name,
                kind: getSymbolKind(element.type),
                location: {
                    uri: element.documentUri.toString(),
                },
            });
        }
        return result;
    }
}

export function getSymbolKind(type: string): SymbolKind {
    switch (type) {
        case 'Import':
            return SymbolKind.Package;
        case 'Entity':
            return SymbolKind.Class;
        case 'Field':
            return SymbolKind.Field;
        case 'Connection':
            return SymbolKind.Method;
        default:
            return SymbolKind.Field;
    }
}
