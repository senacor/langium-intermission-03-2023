import fs from 'fs';
import { CompositeGeneratorNode, NL, toString } from 'langium';
import { NodeFileSystem } from 'langium/node';
import path from 'path';
import { Connection, Document, Entity, Field, isConnection, isField } from '../language-server/generated/ast';
import { createTinyDslServices } from '../language-server/tiny-dsl-module';
import { extractAstNodes, extractDestinationAndName } from './generator-utils';
import * as vscode from 'vscode';

/**
 * Generates SQL files for all TinyDSL files within the current workspace.
 */
export function generateSqlForTinyDslFiles() {
    vscode.workspace.findFiles('**/*.tinydsl').then((files) => {
        generateSqlFiles(files.map(file => file.fsPath), vscode.workspace.rootPath || '.', '/generated')
            .map(result => result
                .then(filename => vscode.window.showInformationMessage(`File ${filename} generated`))
                .catch(error => vscode.window.showErrorMessage(error))
            );
    }, () => {
        vscode.window.showWarningMessage('No tinydsl files for code generation found.');
    });
}

/**
 * Generates SQL output for an array of TinyDSL files.
 * @param inputFiles The array of TinyDSL files.
 * @param workspaceDir The workspace directory.
 * @param outputDir The output directory within the workspace where to generate the files to.
 */
export function generateSqlFiles(inputFiles: string[], workspaceDir: string, outputDir: string): Promise<String>[] {
    const services = createTinyDslServices(NodeFileSystem).TinyDsl;
    const models = extractAstNodes<Document>(inputFiles, services);
    return models.map(model$ => {
        const index = models.indexOf(model$);
        return model$.then(model => generateSqlFile(model, inputFiles[index], workspaceDir, outputDir));
    });
};

/**
 * Generates one SQL file for a given Document.
 * @param document  The Document
 * @param filePath The file location.
 * @param workspaceDir The workspace directory.
 * @param outputDir The output directory within the workspace where to generate the files to.
 * @returns The path of the generated output file within the given destination
 */
export function generateSqlFile(document: Document, filePath: string, workspaceDir: string, outputDir: string): string {
    const data = extractDestinationAndName(filePath, workspaceDir, outputDir);
    const generatedFilePath = `${path.join(data.destination, data.name)}.sql`;
    const fileNode = new CompositeGeneratorNode();

    document.entities.forEach(entity => entityToSql(entity, fileNode));

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

/**
 * Generates SQL for one given Entity.
 * @param entity The Entity.
 * @param output The CompositeGeneratorNode to generate the output to.
 */
function entityToSql(entity: Entity, output: CompositeGeneratorNode) {

    output.append(`CREATE TABLE ${entity.name.toLowerCase()} (`, NL);
    output.append(`  ${entity.name.toLowerCase()}_id NUMBER(16, 0) PRIMARY KEY`, NL);

    entity.members
        .filter(member => isField(member))
        .map(field => field as Field)
        .forEach(field => output.append(`  ${field.name.toLowerCase()} ${mapDatatype(field.type.dataType)},`, NL))

    entity.members
        .filter(member => isConnection(member))
        .map(connection => connection as Connection)
        .forEach(connection => {
            output.append(`  /* Relation to Table ${connection.to.ref?.name.toLowerCase()} */`, NL);
            output.append(`  ${connection.name.toLowerCase()}_id NUMBER(16, 0),`, NL);
        })

    output.append(');', NL, NL);
}

/**
 * Maps a Datatype to an SQL type.
 * @param datatype The Datatype.
 * @returns The corresponding SQL type (as a String).
 */
function mapDatatype(datatype: 'Bool' | 'Int' | 'String'): string {
    switch (datatype) {
        case 'Bool':
            return 'NUMBER(1, 0)';
        case 'Int':
            return 'NUMBER(10, 0)';
        case 'String':
        default:
            return 'VARCHAR2(256)';
    }
}
