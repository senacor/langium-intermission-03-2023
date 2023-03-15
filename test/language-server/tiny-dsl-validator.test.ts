import { describe, test } from 'vitest';

import { Issues } from '../../src/language-server/tiny-dsl-validator';
import { expectError, expectNoIssues, expectWarning, validate } from '../../src/utils/test';

describe('TinyDslValidator', () => {
    describe('checkDocument', () => {
        test('NoDuplicateEntities', async () => {
            let validation = await validate(`
            package test
            Entity Customer {}`);
            expectNoIssues(validation);

            validation = await validate(`
            package test
            Entity Customer {}
            Entity Customer {}`);
            expectError(validation, Issues.Document_DuplicateEntities.code, {
                node: validation.document.parseResult.value.entities[0],
            });
        });
    });

    describe('checkEntity', () => {
        test('NoDuplicateMembers', async () => {
            let validation = await validate(`
            package test
            Entity Customer {
                String Name
            }`);
            expectNoIssues(validation);

            validation = await validate(`
            package test
            Entity Customer {
                String Name
                Int Name
            }`);
            expectError(validation, Issues.Entity_DuplicateMembers.code, {
                node: validation.document.parseResult.value.entities[0],
            });
        });

        test('NameStartsWithCapital', async () => {
            let validation = await validate(`
            package test
            Entity Customer {
                String Name
            }`);
            expectNoIssues(validation);

            validation = await validate(`
            package test
            Entity customer {
                String Name
            }`);
            expectWarning(validation, Issues.Entity_NameNotCapitalized.code, {
                node: validation.document.parseResult.value.entities[0],
            });
        });
    });
});
