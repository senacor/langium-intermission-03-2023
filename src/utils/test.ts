// Copied from langium/src/test/langium-test.js

/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import {
    AstNode,
    CstNode,
    EmptyFileSystem,
    escapeRegExp,
    findNodeForProperty,
    LangiumDocument,
    LangiumServices,
    Properties,
    SemanticTokensDecoder,
} from 'langium';
import { expect as expectFunction } from 'vitest';
import {
    CancellationTokenSource,
    CompletionItem,
    Diagnostic,
    DiagnosticSeverity,
    DocumentSymbol,
    FormattingOptions,
    MarkupContent,
    Range,
    ReferenceParams,
    SemanticTokensParams,
    SemanticTokenTypes,
    TextDocumentIdentifier,
    TextDocumentPositionParams,
} from 'vscode-languageserver';
import { CodeActionParams } from 'vscode-languageserver-protocol';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CodeAction } from 'vscode-languageserver-types';
import { URI } from 'vscode-uri';

import { Document } from '../language-server/generated/ast';
import { createTinyDslServices } from '../language-server/tiny-dsl-module';

export function parseHelper<T extends AstNode = AstNode>(
    services: LangiumServices,
): (input: string) => Promise<LangiumDocument<T>> {
    const metaData = services.LanguageMetaData;
    const documentBuilder = services.shared.workspace.DocumentBuilder;
    return async (input) => {
        const randomNumber = Math.floor(Math.random() * 10000000) + 1000000;
        const uri = URI.parse(`file:///${randomNumber}${metaData.fileExtensions[0]}`);
        const document = services.shared.workspace.LangiumDocumentFactory.fromString<T>(input, uri);
        services.shared.workspace.LangiumDocuments.addDocument(document);
        await documentBuilder.build([document]);
        return document;
    };
}

function expect(actual: unknown, expected: unknown, message?: string) {
    expectFunction(actual, message).toEqual(expected);
}

export interface ExpectedBase {
    text: string;
    indexMarker?: string;
    rangeStartMarker?: string;
    rangeEndMarker?: string;
}

export interface ExpectedSymbols extends ExpectedBase {
    expectedSymbols: DocumentSymbol[];
}

export const services = createTinyDslServices(EmptyFileSystem);
export const validate = validationHelper<Document>(services.TinyDsl);
export const fix = quickFixHelper<Document>(services.TinyDsl);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Issues (Validation Errors, Warnings, etc.)
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function expectNoIssues<T extends AstNode = AstNode, N extends AstNode = AstNode>(
    validationResult: ValidationResult<T>,
    filter?: ExpectDiagnosticOptions<N>,
) {
    const issues = findIssues<T, N>(validationResult, filter);
    expect(issues.length == 0, true, `Expected no issues, but got: ${toString(validationResult)}`);
}

export function expectIssue<T extends AstNode = AstNode, N extends AstNode = AstNode>(
    validationResult: ValidationResult<T>,
    code: string,
    filter?: ExpectDiagnosticOptions<N>,
): void {
    const issues = findIssues<T, N>(validationResult, { code: code, ...filter });
    expect(
        issues.length > 0,
        true,
        `Missing ${severity(filter) || 'ISSUE'} of type [${code}], only got: ${toString(validationResult)}`,
    );
}

export function expectError<T extends AstNode = AstNode, N extends AstNode = AstNode>(
    validationResult: ValidationResult<T>,
    code: string,
    filter?: ExpectDiagnosticOptionsWithoutContent<N>,
): void {
    expectIssue<T, N>(validationResult, code, { severity: DiagnosticSeverity.Error, ...filter });
}

export function expectWarning<T extends AstNode = AstNode, N extends AstNode = AstNode>(
    validationResult: ValidationResult<T>,
    code: string,
    filter?: ExpectDiagnosticOptionsWithoutContent<N>,
): void {
    expectIssue<T, N>(validationResult, code, { severity: DiagnosticSeverity.Warning, ...filter });
}

export function expectInfo<T extends AstNode = AstNode, N extends AstNode = AstNode>(
    validationResult: ValidationResult<T>,
    code: string,
    filter?: ExpectDiagnosticOptionsWithoutContent<N>,
): void {
    expectIssue<T, N>(validationResult, code, { severity: DiagnosticSeverity.Information, ...filter });
}

export function expectHint<T extends AstNode = AstNode, N extends AstNode = AstNode>(
    validationResult: ValidationResult<T>,
    code: string,
    filter?: ExpectDiagnosticOptionsWithoutContent<N>,
): void {
    expectIssue<T, N>(validationResult, code, { severity: DiagnosticSeverity.Hint, ...filter });
}

function findIssues<T extends AstNode, N extends AstNode>(
    validationResult: ValidationResult<T>,
    options?: ExpectDiagnosticOptions<N>,
): Diagnostic[] {
    if (!options) {
        return validationResult.diagnostics;
    }
    const filters: Array<Predicate<Diagnostic>> = [];
    if ('node' in options && options.node) {
        let cstNode: CstNode | undefined = options.node.$cstNode;
        if (options.property) {
            const name = typeof options.property === 'string' ? options.property : options.property.name;
            const index = typeof options.property === 'string' ? undefined : options.property.index;
            cstNode = findNodeForProperty(cstNode, name, index);
        }
        if (!cstNode) {
            throw new Error('Cannot find the node!');
        }
        const checkRange = options.property ? isRangeEqual : isRangeInside;
        filters.push((d) => checkRange(cstNode!.range, d.range));
    }
    if ('offset' in options) {
        const outer = {
            start: validationResult.document.textDocument.positionAt(options.offset),
            end: validationResult.document.textDocument.positionAt(options.offset + options.length),
        };
        filters.push((d) => isRangeEqual(outer, d.range));
    }
    if ('range' in options) {
        filters.push((d) => isRangeEqual(options.range!, d.range));
    }
    if (options.code) {
        filters.push((d) => d.code === options.code);
    }
    if (options.message) {
        if (typeof options.message === 'string') {
            filters.push((d) => d.message === options.message);
        } else if (options.message instanceof RegExp) {
            const regexp = options.message as RegExp;
            filters.push((d) => regexp.test(d.message));
        }
    }
    if (options.severity) {
        filters.push((d) => d.severity === options.severity);
    }
    return validationResult.diagnostics.filter((diag) => filters.every((holdsFor) => holdsFor(diag)));
}

function toString(result: ValidationResult): string {
    const issues = result.diagnostics;
    return '[\n' + issues.map((issue) => `  ${severity(issue)} (${issue.code}: ${issue.message})`).join('\n') + '\n]';
}

function severity(issue: { severity?: DiagnosticSeverity } | undefined): string | undefined {
    switch (issue?.severity) {
        case DiagnosticSeverity.Error:
            return 'ERROR';
        case DiagnosticSeverity.Warning:
            return 'WARNING';
        case DiagnosticSeverity.Information:
            return 'INFO';
        case DiagnosticSeverity.Hint:
            return 'HINT';
        default:
            return undefined;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Symbols
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function expectSymbols(services: LangiumServices): (input: ExpectedSymbols) => Promise<void> {
    return async (input) => {
        const document = await parseDocument(services, input.text);
        const symbolProvider = services.lsp.DocumentSymbolProvider;
        const symbols = (await symbolProvider?.getSymbols(document, textDocumentParams(document))) ?? [];
        expect(
            symbols.length,
            input.expectedSymbols.length,
            `Expected ${input.expectedSymbols.length} but found ${symbols.length} symbols in document.`,
        );
        for (let i = 0; i < input.expectedSymbols.length; i++) {
            const expected = input.expectedSymbols[i];
            const item = symbols[i];
            if (typeof expected === 'string') {
                expect(item.name, expected);
            } else {
                expect(item, expected);
            }
        }
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Foldings
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function expectFoldings(services: LangiumServices): (input: ExpectedBase) => Promise<void> {
    return async (input) => {
        const { output, ranges } = replaceIndices(input);
        const document = await parseDocument(services, output);
        const foldingRangeProvider = services.lsp.FoldingRangeProvider;
        const foldings = (await foldingRangeProvider?.getFoldingRanges(document, textDocumentParams(document))) ?? [];
        foldings.sort((a, b) => a.startLine - b.startLine);
        expect(foldings.length, ranges.length, `Expected ${ranges.length} but received ${foldings.length} foldings`);
        for (let i = 0; i < ranges.length; i++) {
            const expected = ranges[i];
            const item = foldings[i];
            const expectedStart = document.textDocument.positionAt(expected[0]);
            const expectedEnd = document.textDocument.positionAt(expected[1]);
            expect(
                item.startLine,
                expectedStart.line,
                `Expected folding start at line ${expectedStart.line} but received folding start at line ${item.startLine} instead.`,
            );
            expect(
                item.endLine,
                expectedEnd.line,
                `Expected folding end at line ${expectedEnd.line} but received folding end at line ${item.endLine} instead.`,
            );
        }
    };
}

function textDocumentParams(document: LangiumDocument): { textDocument: TextDocumentIdentifier } {
    return { textDocument: { uri: document.textDocument.uri } };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Completions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface ExpectedCompletion extends ExpectedBase {
    index: number;
    expectedItems: Array<string | CompletionItem>;
}

export function expectCompletion(services: LangiumServices): (completion: ExpectedCompletion) => Promise<void> {
    return async (expectedCompletion) => {
        const { output, indices } = replaceIndices(expectedCompletion);
        const document = await parseDocument(services, output);
        const completionProvider = services.lsp.CompletionProvider;
        const offset = indices[expectedCompletion.index];
        const completions = (await completionProvider?.getCompletion(
            document,
            textDocumentPositionParams(document, offset),
        )) ?? { items: [] };
        const expectedItems = expectedCompletion.expectedItems;
        const items = completions.items.sort((a, b) => a.sortText?.localeCompare(b.sortText || '0') || 0);
        expect(
            items.length,
            expectedItems.length,
            `Expected ${expectedItems.length} but received ${items.length} completion items`,
        );
        for (let i = 0; i < expectedItems.length; i++) {
            const expected = expectedItems[i];
            const completion = items[i];
            if (typeof expected === 'string') {
                expect(completion.label, expected);
            } else {
                expect(completion, expected);
            }
        }
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GoToDefinitions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface ExpectedGoToDefinition extends ExpectedBase {
    index: number;
    rangeIndex: number | number[];
}

export function expectGoToDefinition(
    services: LangiumServices,
): (expectedGoToDefinition: ExpectedGoToDefinition) => Promise<void> {
    return async (expectedGoToDefinition) => {
        const { output, indices, ranges } = replaceIndices(expectedGoToDefinition);
        const document = await parseDocument(services, output);
        const definitionProvider = services.lsp.DefinitionProvider;
        const locationLinks =
            (await definitionProvider?.getDefinition(
                document,
                textDocumentPositionParams(document, indices[expectedGoToDefinition.index]),
            )) ?? [];
        const rangeIndex = expectedGoToDefinition.rangeIndex;
        if (Array.isArray(rangeIndex)) {
            expect(
                locationLinks.length,
                rangeIndex.length,
                `Expected ${rangeIndex.length} definitions but received ${locationLinks.length}`,
            );
            for (const index of rangeIndex) {
                const expectedRange: Range = {
                    start: document.textDocument.positionAt(ranges[index][0]),
                    end: document.textDocument.positionAt(ranges[index][1]),
                };
                const range = locationLinks[0].targetSelectionRange;
                expect(
                    range,
                    expectedRange,
                    `Expected range ${rangeToString(expectedRange)} does not match actual range ${rangeToString(
                        range,
                    )}`,
                );
            }
        } else {
            const expectedRange: Range = {
                start: document.textDocument.positionAt(ranges[rangeIndex][0]),
                end: document.textDocument.positionAt(ranges[rangeIndex][1]),
            };
            expect(locationLinks.length, 1, `Expected a single definition but received ${locationLinks.length}`);
            const range = locationLinks[0].targetSelectionRange;
            expect(
                range,
                expectedRange,
                `Expected range ${rangeToString(expectedRange)} does not match actual range ${rangeToString(range)}`,
            );
        }
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// References
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface ExpectedFindReferences extends ExpectedBase {
    includeDeclaration: boolean;
}

export function expectFindReferences(
    services: LangiumServices,
): (expectedFindReferences: ExpectedFindReferences) => Promise<void> {
    return async (expectedFindReferences) => {
        const { output, indices, ranges } = replaceIndices(expectedFindReferences);
        const document = await parseDocument(services, output);
        const expectedRanges: Range[] = ranges.map((range) => ({
            start: document.textDocument.positionAt(range[0]),
            end: document.textDocument.positionAt(range[1]),
        }));
        const referenceFinder = services.lsp.ReferencesProvider;
        for (const index of indices) {
            const referenceParameters = referenceParams(document, index, expectedFindReferences.includeDeclaration);
            const references = (await referenceFinder?.findReferences(document, referenceParameters)) ?? [];

            expect(
                references.length,
                expectedRanges.length,
                'Found references do not match amount of expected references',
            );
            for (const reference of references) {
                expect(
                    expectedRanges.some((range) => isRangeEqual(range, reference.range)),
                    true,
                    `Found unexpected reference at range ${rangeToString(reference.range)}`,
                );
            }
        }
        clearDocuments(services);
    };
}

function referenceParams(document: LangiumDocument, offset: number, includeDeclaration: boolean): ReferenceParams {
    return {
        textDocument: { uri: document.textDocument.uri },
        position: document.textDocument.positionAt(offset),
        context: { includeDeclaration },
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hovers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface ExpectedHover extends ExpectedBase {
    index: number;
    hover?: string | RegExp;
}

export function expectHover(services: LangiumServices): (expectedHover: ExpectedHover) => Promise<void> {
    return async (expectedHover) => {
        const { output, indices } = replaceIndices(expectedHover);
        const document = await parseDocument(services, output);
        const hoverProvider = services.lsp.HoverProvider;
        const hover = await hoverProvider?.getHoverContent(
            document,
            textDocumentPositionParams(document, indices[expectedHover.index]),
        );
        const hoverContent = hover && MarkupContent.is(hover.contents) ? hover.contents.value : undefined;
        if (typeof expectedHover.hover !== 'object') {
            expect(hoverContent, expectedHover.hover);
        } else {
            const value = hoverContent ?? '';
            expect(
                expectedHover.hover.test(value),
                true,
                `Hover '${value}' does not match regex /${expectedHover.hover.source}/${expectedHover.hover.flags}.`,
            );
        }
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Formatting
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface ExpectFormatting {
    before: string;
    after: string;
    range?: Range;
    options?: FormattingOptions;
}

export function expectFormatting(services: LangiumServices): (expectedFormatting: ExpectFormatting) => Promise<void> {
    const formatter = services.lsp.Formatter;
    if (!formatter) {
        throw new Error(`No formatter registered for language ${services.LanguageMetaData.languageId}`);
    }
    return async (expectedFormatting) => {
        const document = await parseDocument(services, expectedFormatting.before);
        const identifier = { uri: document.uri.toString() };
        const options = expectedFormatting.options ?? {
            insertSpaces: true,
            tabSize: 4,
        };
        const edits = await (expectedFormatting.range
            ? formatter.formatDocumentRange(document, {
                  options,
                  textDocument: identifier,
                  range: expectedFormatting.range,
              })
            : formatter.formatDocument(document, { options, textDocument: identifier }));

        const editedDocument = TextDocument.applyEdits(document.textDocument, edits);
        expect(editedDocument, expectedFormatting.after);
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function textDocumentPositionParams(document: LangiumDocument, offset: number): TextDocumentPositionParams {
    return { textDocument: { uri: document.textDocument.uri }, position: document.textDocument.positionAt(offset) };
}

export async function parseDocument<T extends AstNode = AstNode>(
    services: LangiumServices,
    input: string,
): Promise<LangiumDocument<T>> {
    const document = await parseHelper<T>(services)(input);
    if (!document.parseResult) {
        throw new Error('Could not parse document');
    }
    return document;
}

function replaceIndices(base: ExpectedBase): { output: string; indices: number[]; ranges: Array<[number, number]> } {
    const indices: number[] = [];
    const ranges: Array<[number, number]> = [];
    const rangeStack: number[] = [];
    const indexMarker = base.indexMarker || '<|>';
    const rangeStartMarker = base.rangeStartMarker || '<|';
    const rangeEndMarker = base.rangeEndMarker || '|>';
    const regex = new RegExp(
        `${escapeRegExp(indexMarker)}|${escapeRegExp(rangeStartMarker)}|${escapeRegExp(rangeEndMarker)}`,
    );

    let matched = true;
    let input = base.text;

    while (matched) {
        const regexMatch = regex.exec(input);
        if (regexMatch) {
            const matchedString = regexMatch[0];
            switch (matchedString) {
                case indexMarker:
                    indices.push(regexMatch.index);
                    break;
                case rangeStartMarker:
                    rangeStack.push(regexMatch.index);
                    break;
                case rangeEndMarker: {
                    const rangeStart = rangeStack.pop() || 0;
                    ranges.push([rangeStart, regexMatch.index]);
                    break;
                }
            }
            input = input.substring(0, regexMatch.index) + input.substring(regexMatch.index + matchedString.length);
        } else {
            matched = false;
        }
    }

    return { output: input, indices, ranges: ranges.sort((a, b) => a[0] - b[0]) };
}

export interface ValidationResult<T extends AstNode = AstNode> {
    diagnostics: Diagnostic[];
    document: LangiumDocument<T>;
}

export function validationHelper<T extends AstNode = AstNode>(
    services: LangiumServices,
): (input: string) => Promise<ValidationResult<T>> {
    const parse = parseHelper<T>(services);
    return async (input) => {
        const document = await parse(input);
        return { document, diagnostics: await services.validation.DocumentValidator.validateDocument(document) };
    };
}

export function quickFixHelper<T extends AstNode = AstNode>(
    services: LangiumServices,
): (input: string) => Promise<string> {
    const validate = validationHelper<T>(services);
    return async (input) => {
        const { document, diagnostics } = await validate(input);
        const params: CodeActionParams = {
            textDocument: document.textDocument,
            range: { start: { line: 1, character: 1 }, end: { line: 1, character: 1 } },
            context: { diagnostics },
        };
        const codeActions = await services.lsp.CodeActionProvider?.getCodeActions(document, params);
        const codeAction = codeActions
            ?.filter((ac) => CodeAction.is(ac) && ac.isPreferred)
            .map((ac) => ac as CodeAction)
            .first();
        const changes = codeAction?.edit?.changes || {};
        const edit = (changes[document.textDocument.uri] || [])[0];
        if (edit) {
            TextDocument.update(document.textDocument, [{ range: edit.range, text: edit.newText }], 1);
        }
        return document.textDocument.getText();
    };
}

export type ExpectDiagnosticOptionsWithoutContent<T extends AstNode = AstNode> = ExpectDiagnosticCode &
    (ExpectDiagnosticAstOptions<T> | ExpectDiagnosticRangeOptions | ExpectDiagnosticOffsetOptions);
export type ExpectDiagnosticOptions<T extends AstNode = AstNode> = ExpectDiagnosticContent &
    ExpectDiagnosticOptionsWithoutContent<T>;

export interface ExpectDiagnosticContent {
    message?: string | RegExp;
    severity?: DiagnosticSeverity;
}

export interface ExpectDiagnosticCode {
    code?: string;
}

export interface ExpectDiagnosticAstOptions<T extends AstNode> {
    node?: T;
    property?: Properties<T> | { name: Properties<T>; index?: number };
}

export interface ExpectDiagnosticRangeOptions {
    range: Range;
}

export interface ExpectDiagnosticOffsetOptions {
    offset: number;
    length: number;
}

export type Predicate<T> = (arg: T) => boolean;

function isRangeEqual(lhs: Range, rhs: Range): boolean {
    return (
        lhs.start.character === rhs.start.character &&
        lhs.start.line === rhs.start.line &&
        lhs.end.character === rhs.end.character &&
        lhs.end.line === rhs.end.line
    );
}

function isRangeInside(outer: Range, inner: Range): boolean {
    if (outer.start.line > inner.start.line) return false;
    if (outer.end.line < inner.end.line) return false;
    if (outer.start.line == inner.start.line && outer.start.character > inner.start.character) return false;
    if (outer.end.line == inner.end.line && outer.end.character < inner.end.character) return false;
    return true;
}

function rangeToString(range: Range): string {
    return `${range.start.line}:${range.start.character}--${range.end.line}:${range.end.character}`;
}

export function clearDocuments(services: LangiumServices): Promise<void> {
    const allDocs = services.shared.workspace.LangiumDocuments.all.map((x) => x.uri).toArray();
    return services.shared.workspace.DocumentBuilder.update([], allDocs);
}

export interface DecodedSemanticTokensWithRanges {
    tokens: SemanticTokensDecoder.DecodedSemanticToken[];
    ranges: Array<[number, number]>;
}

export function highlightHelper<T extends AstNode = AstNode>(
    services: LangiumServices,
): (input: string) => Promise<DecodedSemanticTokensWithRanges> {
    const parse = parseHelper<T>(services);
    const tokenProvider = services.lsp.SemanticTokenProvider!;
    return async (text) => {
        const { output: input, ranges } = replaceIndices({
            text,
        });
        const document = await parse(input);
        const params: SemanticTokensParams = { textDocument: { uri: document.textDocument.uri } };
        const tokens = await tokenProvider.semanticHighlight(document, params, new CancellationTokenSource().token);
        return { tokens: SemanticTokensDecoder.decode(tokens, document), ranges };
    };
}

export interface DecodedTokenOptions {
    rangeIndex?: number;
    tokenType: SemanticTokenTypes;
}

export function expectSemanticToken(
    tokensWithRanges: DecodedSemanticTokensWithRanges,
    options: DecodedTokenOptions,
): void {
    const range = tokensWithRanges.ranges[options.rangeIndex || 0];
    const result = tokensWithRanges.tokens.filter((t) => {
        return t.tokenType === options.tokenType && t.offset === range[0] && t.offset + t.text.length === range[1];
    });
    expect(result.length, 1, `Expected one token with the specified options but found ${result.length}`);
}
