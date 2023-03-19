import { ValidationAcceptor, ValidationChecks } from 'langium';

import { satisfies } from '../utils/types';
import { Document, Entity, TinyDslAstType } from './generated/ast';
import { IndexAccess } from './tiny-dsl-services';

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

export const Issues = satisfies<Record<string, Issue>>()({
    Document_DuplicateEntities: { code: 'Document.DuplicateEntities', msg: 'Duplicate entity' },
    Entity_DuplicateMembers: { code: 'Entity.DuplicateMembers', msg: 'Duplicate member' },
    Entity_NameNotCapitalized: { code: 'Entity.NameNotCapitalized', msg: 'Entity name should start with a capital.' },
});

/**
 * Implementation of custom validations.
 */
export class TinyDslValidator {
    protected readonly indexAccess: IndexAccess;

    constructor(protected services: TinyDslServices) {
        this.indexAccess = services.workspace.IndexAccess;
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

    checkEntity_NoDuplicateMembers(entity: Entity, accept: ValidationAcceptor): void {
        const issue = Issues.Entity_DuplicateMembers;
        const duplicates = this.findDuplicates(entity.members);
        for (let dup of duplicates) {
            accept('error', `${issue.msg} [${dup.name}]`, { node: dup, property: 'name', code: issue.code });
        }
    }

    checkDocument_NoDuplicateEntities(document: Document, accept: ValidationAcceptor) {
        const issue = Issues.Document_DuplicateEntities;
        const entities = this.indexAccess.searchIndex(Entity);
        const duplicates = this.findDuplicates(entities).filter((desc) => desc.documentUri === document.$document?.uri);
        for (let dup of duplicates) {
            accept('error', `${issue.msg} [${dup.name}]`, { node: dup.node!, property: 'name', code: issue.code });
        }
    }

    findDuplicates<T extends { name: string }>(elements: T[]): T[] {
        return elements
            .groupBy((el) => el.name)
            .valuesArray()
            .filter((arr) => arr.length >= 2)
            .flat();
    }
}

// Extension methods
declare global {
    interface Array<T> {
        first(): T | undefined;
        groupBy<KeyT>(this: T[], key: (element: T) => KeyT): Map<KeyT, T[]>;
    }
    interface Map<K, V> {
        valuesArray(): V[];
    }
}
Array.prototype.first = function () {
    return this.length >= 1 ? this[0] : undefined;
};
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

// Utils
export interface Issue {
    code: string;
    msg: string;
}
