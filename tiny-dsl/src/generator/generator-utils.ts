import path from 'path';
import { AstNode, LangiumDocument, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';

interface FilePathData {
    destination: string,
    name: string
}

/**
 * Parses a given array of file names to an array of LangiumDocuments.
 * @param fileNames The file names.
 * @param services The LangiumServices.
 * @returns The array of LangiumDocuments (as Promise).
 */
export function extractDocuments(fileNames: string[], services: LangiumServices): Promise<LangiumDocument>[] {
    return fileNames.map(fileName => {
        const document = services.shared.workspace.LangiumDocuments.getOrCreateDocument(URI.file(path.resolve(fileName)));
        return services.shared.workspace.DocumentBuilder.build([document], { validationChecks: 'all' })
            .then(() => {
                const validationErrors = (document.diagnostics ?? []).filter(e => e.severity === 1);
                if (validationErrors.length > 0) {
                    let errorMsg = 'There are validation errors:\n';
                    for (const validationError of validationErrors) {
                        errorMsg += `line ${validationError.range.start.line + 1}: ${validationError.message} [${document.textDocument.getText(validationError.range)}]`;
                    }
                    return Promise.reject(errorMsg);
                }
                return document;
            })
    });
}

/**
 * Extracts the AstNodes from a given array of file names.
 * @param fileNames The file names.
 * @param services The LangiumServices.
 * @returns An array of AstNodes as a Promise.
 */
export function extractAstNodes<T extends AstNode>(fileNames: string[], services: LangiumServices): Promise<T>[] {
    return extractDocuments(fileNames, services).map(document => document.then(document => document.parseResult?.value as T));
}

export function extractDestinationAndName(filePath: string, destination: string): FilePathData {
    filePath = path.basename(filePath, path.extname(filePath)).replace(/[.-]/g, '');
    return {
        destination: destination ?? path.join(path.dirname(filePath), 'generated'),
        name: path.basename(filePath)
    };
}
