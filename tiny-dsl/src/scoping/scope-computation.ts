import { AstNode, AstNodeDescription, DefaultScopeComputation, findRootNode, LangiumDocument, LangiumServices, PrecomputedScopes, streamAllContents} from "langium";
import { isDocument, isEntity } from "../language-server/generated/ast";


export class TinyDslScopeComputation extends DefaultScopeComputation {

    constructor(services: LangiumServices) {
        super(services);
    }
    
     // Emitting previous implementation for brevity

    /**
     * Export all entities using their FQN
     */
    override async computeExports(document: LangiumDocument): Promise<AstNodeDescription[]> {
        const exportedDescriptions: AstNodeDescription[] = [];
        console.log("A")
        for (const childNode of streamAllContents(document.parseResult.value)) {
            if (isEntity(childNode)) {
                const fullyQualifiedName = this.getQualifiedName(childNode);
                // `descriptions` is our `AstNodeDescriptionProvider` defined in `DefaultScopeComputation`
                // It allows us to easily create descriptions that point to elements using a name.
                exportedDescriptions.push(this.descriptions.createDescription(childNode, fullyQualifiedName, document));
            }
        }
        return exportedDescriptions;
    }

    /**
     * Make Entities visible under their simple name in the document they are defined in.
     */
    override processNode(node: AstNode, document: LangiumDocument, scopes: PrecomputedScopes): void {
        if (isEntity(node)) {
            let doc = findRootNode(node)
    
            if (isDocument(doc)) {
                scopes.add(doc, this.descriptions.createDescription(node, node.name, document));
            }
        }
    }
    

    /**
     * Build a qualified name for a model node
     */
    private getQualifiedName(node: AstNode): string | undefined {
        let doc = findRootNode(node)

        if (isDocument(doc)) {
            if (isEntity(node)) {
                return `${doc.package}/${node.name}`;
            }
        }

        return undefined;
    }

    
}
