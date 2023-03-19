import {
	AstNode,
	AstNodeDescription,
	AstNodeLocator,
	IndexManager,
	LangiumDocuments,
} from 'langium';

import { TinyDslScopeComputation } from '../scoping/scope-computation';
import { QualifiedName, TinyDslAstType } from './generated/ast';

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
