import fs from 'fs';
import { CompositeGeneratorNode, NL, toString } from 'langium';
import path from 'path';
import { Connection, Document, Entity, Field, isConnection, isField } from '../language-server/generated/ast';
import { extractDestinationAndName } from '../cli/cli-util';

export function generateSqlFile(document: Document, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.sql`;
    const fileNode = new CompositeGeneratorNode();

    document.entities.forEach(entity => entityToOutput(entity, fileNode));

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

function entityToOutput(entity: Entity, output: CompositeGeneratorNode) {

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
