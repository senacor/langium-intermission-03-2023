import { createLangiumGrammarServices, EmptyFileSystem, GrammarAST } from 'langium';
import {
    clearDocuments,
    expectError,
    expectIssue,
    expectNoIssues,
    expectWarning,
    parseHelper,
    validationHelper,
    ValidationResult,
} from 'langium/lib/test';
import { afterEach, assert, beforeAll, describe, expect, test } from 'vitest';
import { DiagnosticSeverity } from 'vscode-languageserver';

import { Document, Entity, Member } from '../../src/language-server/generated/ast';
import { createTinyDslServices } from '../../src/language-server/tiny-dsl-module';
import { Issues } from '../../src/language-server/tiny-dsl-validator';

const services = createTinyDslServices(EmptyFileSystem);
const parse = parseHelper(services.TinyDsl);
const locator = services.TinyDsl.workspace.AstNodeLocator;
const validate = validationHelper<Document>(services.TinyDsl);

test('Math.sqrt()', () => {
    expect(Math.sqrt(4)).toBe(2);
    expect(Math.sqrt(144)).toBe(12);
    expect(Math.sqrt(2)).toBe(Math.SQRT2);
});

// describe('TinyDSL Validator', () => {
//     describe('checkEntity', () => {
//         test('NameStartsWithCapital', async () => {
//             const validationResult = await validate(`
//             Entity Kunde {
//                 String Name
//                 Bool Alter
//             }`);

//             // should get a warning when basing declared types on inferred types
//             expectError(validationResult, /Extending an inferred type is discouraged./, {
//                 node: validationResult.document.parseResult.value.entities[0],
//                 property: 'name',
//             });
//         });
//     });
// });
