import * as vscode from 'vscode';
import * as path from 'path';
import {
    LanguageClientOptions, ServerOptions, TransportKind
} from 'vscode-languageclient/node';
import { LanguageClient } from 'vscode-languageclient/browser';
// import { deleteSqlForDslFile, generateSqlForAllTinyDslFiles, generateSqlForDslFile } from './../generator/sql-generator';

let client: LanguageClient;

export type GenerateOptions = {
    destination?: string;
}

// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext): void {

    const disposable = vscode.commands.registerCommand('tinydsl.generateSql', () => {
        vscode.window.showInformationMessage('Hello World from helloworld-web-sample in a web extension host!');
    });

    context.subscriptions.push(disposable);
    startLanguageClientForWeb(context);

    // registerSqlGenerationCommand(context);
    // registerAutoSqlGenerationOnFileChanges(context);

    /* Register SymbolProvider for code outline. */
    // context.subscriptions.push(
    //     vscode.languages.registerDocumentSymbolProvider(
    //         {scheme: "file", language: "tiny-dsl"}, 
    //         new DeprecatedTinyDslDocumentSymbolProvider()
    //     )
    // );
}

// function registerSqlGenerationCommand(context: vscode.ExtensionContext) {
//     let disposable = vscode.commands.registerCommand('tinydsl.generateSql', () => generateSqlForAllTinyDslFiles());
//     context.subscriptions.push(disposable);
//     return disposable;
// }

// function registerAutoSqlGenerationOnFileChanges(context: vscode.ExtensionContext) {
//     const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.tinydsl');
//     let disposable = fileSystemWatcher.onDidCreate((uri) => generateSqlForDslFile(uri.fsPath));
//     context.subscriptions.push(disposable);
//     disposable = fileSystemWatcher.onDidChange((uri) => generateSqlForDslFile(uri.fsPath));
//     context.subscriptions.push(disposable);
//     disposable = fileSystemWatcher.onDidDelete((uri) => deleteSqlForDslFile(uri.fsPath));
//     context.subscriptions.push(disposable);
// }

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
    if (client) {
        return client.stop();
    }
    return undefined;
}

function startLanguageClientForWeb(context: vscode.ExtensionContext) {
    /* 
     * all except the code to create the language client in not browser specific
     * and could be shared with a regular (Node) extension
     */
    const documentSelector = [{ language: 'plaintext' }];

    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.tinydsl');
    context.subscriptions.push(fileSystemWatcher);

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'tiny-dsl' }],
        synchronize: {
            // Notify the server about file changes to files contained in the workspace
            fileEvents: fileSystemWatcher
        }
    };

    client = createWorkerLanguageClient(context, clientOptions);
    client.start();
}

function createWorkerLanguageClient(context: vscode.ExtensionContext, clientOptions: LanguageClientOptions) {
    // Create a worker. The worker main file implements the language server.
    const serverMain = vscode.Uri.joinPath(context.extensionUri, 'dist/server/main.js');
    const worker = new Worker(serverMain.toString(true));

    // create the language server client to communicate with the server running in the worker
    return new LanguageClient(
        'tiny-dsl',
        'Tiny DSL',
        clientOptions,
        worker
    );
}
