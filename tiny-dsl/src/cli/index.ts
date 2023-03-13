import chalk from 'chalk';
import { Command } from 'commander';
import { Document } from '../language-server/generated/ast';
import { TinyDslLanguageMetaData } from '../language-server/generated/module';
import { createTinyDslServices } from '../language-server/tiny-dsl-module';
import { extractAstNode } from './cli-util';
import { generateSqlFile } from './generator';
import { NodeFileSystem } from 'langium/node';

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createTinyDslServices(NodeFileSystem).TinyDsl;
    const model = await extractAstNode<Document>(fileName, services);
    const generatedFilePath = generateSqlFile(model, fileName, opts.destination);
    console.log(chalk.green(`SQL DDL code generated successfully: ${generatedFilePath}`));
};

export type GenerateOptions = {
    destination?: string;
}

export default function(): void {
    const program = new Command();

    program
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .version(require('../../package.json').version);

    const fileExtensions = TinyDslLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('Generates SQL DDL out of entity specifications')
        .action(generateAction);

    program.parse(process.argv);
}
