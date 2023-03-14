import { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';

import { Document, Entity, NamedElement, TinyDslAstType } from './generated/ast';

import type { TinyDslServices } from './tiny-dsl-module';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: TinyDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.TinyDslValidator;
    const checks: ValidationChecks<TinyDslAstType> = {
        Document: [validator.checkDocument_NoDuplicateEntities],
        Entity: [validator.checkEntity_NameStartsWithCapital, validator.checkEntity_NoDuplicateMembers],
    };
    registry.register(checks, validator);
}

export interface Issue {
    code: string;
    msg: string;
}

export const Issues: { [key: string]: Issue } = {
    Document_DuplicateEntities: { code: 'Document.DuplicateEntities', msg: 'Duplicate entity' },
    Entity_DuplicateMembers: { code: 'Entity.DuplicateMembers', msg: 'Duplicate member' },
    Entity_NameNotCapitalized: { code: 'Entity.NameNotCapitalized', msg: 'Entity name should start with a capital.' },
};

/**
 * Implementation of custom validations.
 */
export class TinyDslValidator {
    checkDocument_NoDuplicateEntities(document: Document, accept: ValidationAcceptor) {
        this.checkNoDuplicateElements(document.entities, Issues.Document_DuplicateEntities, accept);
    }

    checkEntity_NoDuplicateMembers(entity: Entity, accept: ValidationAcceptor): void {
        this.checkNoDuplicateElements(entity.members, Issues.Entity_DuplicateMembers, accept);
    }

    checkEntity_NameStartsWithCapital(entity: Entity, accept: ValidationAcceptor): void {
        if (entity.name) {
            const firstChar = entity.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', Issues.Entity_NameNotCapitalized.msg, {
                    node: entity,
                    property: 'name',
                    code: Issues.Entity_NameNotCapitalized.code,
                });
            }
        }
    }

    checkNoDuplicateElements(elements: NamedElement[], issue: Issue, accept: ValidationAcceptor) {
        let duplicates = elements
            .groupBy((el) => el.name)
            .valuesArray()
            .filter((arr) => arr.length >= 2)
            .flat();
        for (let dup of duplicates) {
            accept('error', `${issue.msg} [${dup.name}]`, { node: dup, property: 'name', code: issue.code });
        }
    }
}

// Extension methods
declare global {
    interface Array<T> {
        groupBy<KeyT>(this: T[], key: (element: T) => KeyT): Map<KeyT, T[]>;
    }
    interface Map<K, V> {
        valuesArray(): V[];
    }
}
Array.prototype.groupBy = function (keyFn) {
    return this.reduce(function (accumulator: Map<any, any[]>, currentVal) {
        let key = keyFn(currentVal);
        if (!accumulator.get(key)) {
            accumulator.set(key, []);
        }
        accumulator.get(key)!.push(currentVal);
        return accumulator;
    }, new Map<any, any[]>());
};
Map.prototype.valuesArray = function () {
    return Array.from(this.values());
};
