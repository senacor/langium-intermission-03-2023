import * as path from 'path';
import * as vscode from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
} from 'vscode-languageclient/node';

import {
	deleteSqlForDslFile,
	generateSqlForAllTinyDslFiles,
	generateSqlForDslFile,
} from './generator/sql-generator';

let client: LanguageClient;

export type GenerateOptions = {
    destination?: string;
};

// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext): void {
    client = startLanguageClient(context);

    registerSqlGenerationCommand(context);
    registerAutoSqlGenerationOnFileChanges(context);

    /* Register SymbolProvider for code outline. */
    // context.subscriptions.push(
    //     vscode.languages.registerDocumentSymbolProvider(
    //         {scheme: "file", language: "tiny-dsl"},
    //         new DeprecatedTinyDslDocumentSymbolProvider()
    //     )
    // );
}

function registerSqlGenerationCommand(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('tinydsl.generateSql', () => generateSqlForAllTinyDslFiles());
    context.subscriptions.push(disposable);
    return disposable;
}

function registerAutoSqlGenerationOnFileChanges(context: vscode.ExtensionContext) {
    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.tinydsl');
    let disposable = fileSystemWatcher.onDidCreate((uri) => generateSqlForDslFile(uri.fsPath));
    context.subscriptions.push(disposable);
    disposable = fileSystemWatcher.onDidChange((uri) => generateSqlForDslFile(uri.fsPath));
    context.subscriptions.push(disposable);
    disposable = fileSystemWatcher.onDidDelete((uri) => deleteSqlForDslFile(uri.fsPath));
    context.subscriptions.push(disposable);
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
    if (client) {
        return client.stop();
    }
    return undefined;
}

function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
    const serverModule = context.asAbsolutePath(path.join('out', 'language-server', 'main'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = {
        execArgv: [
            '--nolazy',
            `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`,
        ],
    };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
    };

    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.tinydsl');
    context.subscriptions.push(fileSystemWatcher);

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'tiny-dsl' }],
        synchronize: {
            // Notify the server about file changes to files contained in the workspace
            fileEvents: fileSystemWatcher,
        },
    };

    // Create the language client and start the client.
    const client = new LanguageClient('tiny-dsl', 'Tiny DSL', serverOptions, clientOptions);

    // Start the client. This will also launch the server
    client.start();
    return client;
}
