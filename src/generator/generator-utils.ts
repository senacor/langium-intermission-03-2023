import { AstNode, LangiumDocument, LangiumServices } from 'langium';
import path from 'path';
import { URI } from 'vscode-uri';

interface FilePathData {
    destination: string;
    name: string;
}

/**
 * Parses a given array of file names to an array of LangiumDocuments.
 * @param fileNames The file names.
 * @param services The LangiumServices.
 * @returns The array of LangiumDocuments (as Promise).
 */
export function extractDocuments(fileNames: string[], services: LangiumServices): Promise<LangiumDocument>[] {
    return fileNames.map((fileName) => {
        const document = services.shared.workspace.LangiumDocuments.getOrCreateDocument(
            URI.file(path.resolve(fileName)),
        );
        return services.shared.workspace.DocumentBuilder.build([document], { validationChecks: 'all' }).then(() => {
            const validationErrors = (document.diagnostics ?? []).filter((e) => e.severity === 1);
            if (validationErrors.length > 0) {
                let errorMsg = 'There are validation errors:\n';
                for (const validationError of validationErrors) {
                    errorMsg += `line ${validationError.range.start.line + 1}: ${
                        validationError.message
                    } [${document.textDocument.getText(validationError.range)}]`;
                }
                return Promise.reject(errorMsg);
            }
            return document;
        });
    });
}

/**
 * Extracts the AstNodes from a given array of file names.
 * @param fileNames The file names.
 * @param services The LangiumServices.
 * @returns An array of AstNodes as a Promise.
 */
export function extractAstNodes<T extends AstNode>(fileNames: string[], services: LangiumServices): Promise<T>[] {
    return extractDocuments(fileNames, services).map((document) =>
        document.then((document) => document.parseResult?.value as T),
    );
}

/**
 * Computes the targed director for code generation based on the path of the given input file, the workspace directory and the destination director (e.g., 'generated')
 * @param fielPath The path of the input file.
 * @param workspaceDir The workspace directory.
 * @param outputDir The output directory within the workspace where to generate the files to.
 */
export function extractDestinationAndName(filePath: string, workspaceDir: string, outputDir: string): FilePathData {
    /* Not the niciest soluition, but works (at least on Windows ...)
     * Assumes that the workspace path is a prefix of the file path and that each file ends with '.tinydsl' */
    filePath = filePath.substring(workspaceDir.length, filePath.length - '.tinydsl'.length);
    const destination = path.join(workspaceDir, outputDir, path.dirname(filePath));
    return {
        destination: destination,
        name: path.basename(filePath),
    };
}
