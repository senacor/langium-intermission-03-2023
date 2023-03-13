import path from 'path';
import { AstNode, LangiumDocument, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';
import * as vscode from 'vscode';
import { createTinyDslServices } from '../language-server/tiny-dsl-module';
import { generateSqlFile } from './generator';
import { NodeFileSystem } from 'langium/node';
import { Document } from '../language-server/generated/ast';

export function generateSqlForTinyDslFiles() {
    vscode.workspace.findFiles('**/*.tinydsl').then((files) => {
        files.forEach(file => {
            generateSql(file.fsPath, vscode.workspace.rootPath + '/generated');
        });
        vscode.window.showInformationMessage('Code generation completed');
    }, () => {
        vscode.window.showWarningMessage('No tinydsl files for code generation found.');
    });
}

const generateSql = async (inputFile: string, outputDir: string): Promise<void> => {
    const services = createTinyDslServices(NodeFileSystem).TinyDsl;
    const model = await extractAstNode<Document>(inputFile, services);
    generateSqlFile(model, inputFile, outputDir);
};

export async function extractDocument(fileName: string, services: LangiumServices): Promise<LangiumDocument> {
    const extensions = services.LanguageMetaData.fileExtensions;
    if (!extensions.includes(path.extname(fileName))) {
        vscode.window.showErrorMessage(`Please choose a file with one of these extensions: ${extensions}.`);
        process.exit(1);
    }

    const document = services.shared.workspace.LangiumDocuments.getOrCreateDocument(URI.file(path.resolve(fileName)));
    await services.shared.workspace.DocumentBuilder.build([document], { validationChecks: 'all' });

    const validationErrors = (document.diagnostics ?? []).filter(e => e.severity === 1);
    if (validationErrors.length > 0) {
        vscode.window.showErrorMessage('There are validation errors:');
        for (const validationError of validationErrors) {
            vscode.window.showErrorMessage(
                `line ${validationError.range.start.line + 1}: ${validationError.message} [${document.textDocument.getText(validationError.range)}]`
            );
        }
        process.exit(1);
    }

    return document;
}

export async function extractAstNode<T extends AstNode>(fileName: string, services: LangiumServices): Promise<T> {
    return (await extractDocument(fileName, services)).parseResult?.value as T;
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
