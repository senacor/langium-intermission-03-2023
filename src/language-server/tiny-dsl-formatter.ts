import { AbstractFormatter, AstNode, Formatting } from 'langium';

import * as ast from './generated/ast';

export class TinyDslFormatter extends AbstractFormatter {
    protected format(node: AstNode): void {
        if (ast.isEntity(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesClose.prepend(Formatting.newLine());
        } else if (ast.isDocument(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('package').prepend(Formatting.noIndent());
            formatter.properties('package').append(Formatting.newLines(2));
            for (let i = 0; i < node.imports.length; i++) {
                const imp = formatter.node(node.imports[i]);
                imp.prepend(Formatting.noIndent()).append(Formatting.newLines(i < node.imports.length - 1 ? 1 : 2));
            }
            const entities = formatter.nodes(...node.entities);
            entities.prepend(Formatting.noIndent()).append(Formatting.newLines(2));
        }
    }
}
