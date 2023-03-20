import {
	AbstractFormatter,
	AstNode,
	CstNode,
	Formatting,
	FormattingAction,
	FormattingContext,
	isRootCstNode,
} from 'langium';
import { TextEdit } from 'vscode-languageserver';

import * as ast from './generated/ast';

export class TinyDslFormatter extends AbstractFormatter {
    protected format(node: AstNode): void {
        if (ast.isDocument(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('package').prepend(Formatting.noIndent());
            formatter.properties('package').append(Formatting.newLines(2));
            for (let i = 0; i < node.imports.length; i++) {
                const imp = formatter.node(node.imports[i]);
                imp.prepend(Formatting.noIndent()).append(Formatting.newLines(i < node.imports.length - 1 ? 1 : 2));
            }
        } else if (ast.isEntity(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent({ allowMore: true }));
            bracesClose.prepend(Formatting.newLine()).append(Formatting.newLines(2));
            const fields = node.members.filter((m) => ast.isField(m));
            const conns = node.members.filter((m) => ast.isConnection(m));
            if (fields.length && conns.length) {
                // Insert blank line between fields and connections
                const lastField = fields[fields.length - 1];
                formatter.node(lastField).append(Formatting.newLines(2));
            }
        }
    }

    override createTextEdit(
        a: CstNode | undefined,
        b: CstNode,
        formatting: FormattingAction,
        context: FormattingContext,
    ): TextEdit[] {
        // Fix for no blank lines between entities if they have a docstring on top
        if (b.hidden && b.text.match(/\/[/*]/) && isRootCstNode(b.parent)) {
            b = {
                parent: b.parent,
                text: b.text,
                root: b.root,
                feature: b.feature,
                element: b.element,
                range: b.range,
                offset: b.offset,
                length: b.length,
                end: b.end,
                hidden: false,
            };
        }
        return super.createTextEdit(a, b, formatting, context);
    }
}
