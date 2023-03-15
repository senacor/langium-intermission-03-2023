/**
 * Specic main file to start the LSP server in a VS Code web extension (no dependencies to the file system wanted)
 */

import { startLanguageServer, EmptyFileSystem } from 'langium';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser';
import { createTinyDslServices } from './tiny-dsl-module';

declare const self: DedicatedWorkerGlobalScope;

/* browser specific setup code */
const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

// Inject the shared services and language-specific services
const { shared } = createTinyDslServices({ connection, ...EmptyFileSystem });

// Start the language server with the shared services
startLanguageServer(shared);