import { ValidationAcceptor, ValidationChecks } from "langium";

import { Document, Entity, TinyDslAstType } from "./generated/ast";

import type { TinyDslServices } from "./tiny-dsl-module";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: TinyDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.TinyDslValidator;
    const checks: ValidationChecks<TinyDslAstType> = {
        Document: [validator.checkDocument_NoDuplicateEntities],
        Entity: [validator.checkEntity_NameStartsWithCapital],
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class TinyDslValidator {
    checkEntity_NameStartsWithCapital(entity: Entity, accept: ValidationAcceptor): void {
        if (entity.name) {
            const firstChar = entity.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept("warning", "Entity name should start with a capital.", { node: entity, property: "name" });
            }
        }
    }
    checkEntity_NoDuplicateMembers(entity: Entity, accept: ValidationAcceptor): void {
        //let duplicates = entity.members.groupBy((el) => el.name);
    }
    checkDocument_NoDuplicateEntities(doc: Document, accept: ValidationAcceptor) {
        let duplicates = doc.entities
            .groupBy((el) => el.name)
            .valuesArray()
            .filter((arr) => arr.length >= 2)
            .flat();
        for (let dup of duplicates) {
            accept("error", `Duplicate entity [${dup.name}]`, { node: dup, property: "name" });
        }
    }
    checkNoDuplicateElements<T>(elements: T[], accept: ValidationAcceptor) {
        //let duplicates = elements.groupBy((el) => el.name);
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
