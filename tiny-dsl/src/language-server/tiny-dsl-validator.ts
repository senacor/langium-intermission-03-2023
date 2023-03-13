import { ValidationAcceptor, ValidationChecks } from 'langium';
import { TinyDslAstType, Entity } from './generated/ast';
import type { TinyDslServices } from './tiny-dsl-module';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: TinyDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.TinyDslValidator;
    const checks: ValidationChecks<TinyDslAstType> = {
        Entity: validator.checkEntitiesStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class TinyDslValidator {

    checkEntitiesStartsWithCapital(entity: Entity, accept: ValidationAcceptor): void {
        if (entity.name) {
            const firstChar = entity.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Entity name should start with a capital.', { node: entity, property: 'name' });
            }
        }
    }

}
