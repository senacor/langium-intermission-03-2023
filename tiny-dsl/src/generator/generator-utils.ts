import path from 'path';
import { AstNode, LangiumDocument, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';
import * as vscode from 'vscode';
import { createTinyDslServices } from '../language-server/tiny-dsl-module';
import { generateSqlFile } from './sql-generator';
import { NodeFileSystem } from 'langium/node';
import { Document } from '../language-server/generated/ast';

export function generateSqlForTinyDslFiles() {
    vscode.workspace.findFiles('**/*.tinydsl').then((files) => {
        generateSql(files.map(file => file.fsPath), vscode.workspace.rootPath + '/generated');
        vscode.window.showInformationMessage('Code generation completed');
    }, () => {
        vscode.window.showWarningMessage('No tinydsl files for code generation found.');
    });
}

const generateSql = async (inputFiles: string[], outputDir: string): Promise<void> => {
    const services = createTinyDslServices(NodeFileSystem).TinyDsl;
    const model = await extractAstNodes<Document>(inputFiles, services);
    for (let index = 0; index < model.length; index++) {
        generateSqlFile(model[index], inputFiles[index], outputDir);
    }
};

export async function extractDocument(fileNames: string[], services: LangiumServices): Promise<LangiumDocument[]> {
    return Promise.all(fileNames.map(fileName => {
        const document = services.shared.workspace.LangiumDocuments.getOrCreateDocument(URI.file(path.resolve(fileName)));
        return services.shared.workspace.DocumentBuilder.build([document], { validationChecks: 'all' })
            .then(() => {
                const validationErrors = (document.diagnostics ?? []).filter(e => e.severity === 1);
                if (validationErrors.length > 0) {
                    vscode.window.showErrorMessage('There are validation errors:');
                    for (const validationError of validationErrors) {
                        vscode.window.showErrorMessage(
                            `line ${validationError.range.start.line + 1}: ${validationError.message} [${document.textDocument.getText(validationError.range)}]`
                        );
                    }
                    /* TODO Better error handling? */
                    return document;
                }
                return document;
            });
    }).filter(document => !!document));
}

export async function extractAstNodes<T extends AstNode>(fileNames: string[], services: LangiumServices): Promise<T[]> {
    return (await (extractDocument(fileNames, services))).flatMap(document => document.parseResult?.value as T);
}

interface FilePathData {
    destination: string,
    name: string
}

export function extractDestinationAndName(filePath: string, destination: string | undefined): FilePathData {
    filePath = path.basename(filePath, path.extname(filePath)).replace(/[.-]/g, '');
    return {
        destination: destination ?? path.join(path.dirname(filePath), 'generated'),
        name: path.basename(filePath)
    };
}
