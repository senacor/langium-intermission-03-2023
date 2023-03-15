import { AstNode, AstNodeDescription, DefaultScopeProvider, findRootNode, LangiumDocument, LangiumServices, ReferenceInfo, Scope, stream, StreamScope } from "langium";
import { Document, Import, isDocument } from "../language-server/generated/ast";


export class TinyDslScopeProvider extends DefaultScopeProvider {

    constructor(services: LangiumServices) {
        super(services);
    }
    
    override getGlobalScope(referenceType: string, _context: ReferenceInfo): Scope {
        let paths = this.getImportedPaths(this.getDoc(_context.container))
        let pathSet = stream(paths).toSet()

        let allDescriptions = this.indexManager.allElements(referenceType)
        let importedDescriptions = allDescriptions
            .filter((ele) => this.isImported(ele, pathSet))
            .map((ele) => this.createAliasedDescription(ele))
            .filter((ele) => !!ele).map((ele)=> ele as AstNodeDescription)

        const fqnElementScope = new StreamScope(allDescriptions)
        const importedElementScope = new StreamScope(importedDescriptions, fqnElementScope)
        return importedElementScope;
    }
    
    private isImported(descr : AstNodeDescription, imports : Set<string>): boolean {
        const qn = descr.name
        return imports.has(qn)
    }

    private createAliasedDescription(descr: AstNodeDescription): AstNodeDescription | undefined {
        const qn = descr.name
        const simpleName = this.getLastSegmentOf(qn)
        if (simpleName) {
            return {
                ...descr,
                name: simpleName
            }
        }
        
        return undefined
    }

    private getDoc(node: AstNode): Document | undefined {
        const root = findRootNode(node)
        if (isDocument(root))
            return root
        return undefined
    }

    private getImports(doc: Document | undefined): Import[]  {
        if (doc) {
            return doc.imports
        }
        return []
    }
    private getImportedPaths(doc: Document | undefined): string[]  {
       return this.getImports(doc)
                .map((imp) => imp.path)
    }
    private getLastSegmentOf(qn: string): string | undefined {
        const segments = qn.split(".")
        if (segments.length > 0)
            return segments[segments.length-1]
        return undefined
    }
    
}
