import { ValidationAcceptor, ValidationChecks } from 'langium';
import { TinyDslAstType, Person } from './generated/ast';
import type { TinyDslServices } from './tiny-dsl-module';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: TinyDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.TinyDslValidator;
    const checks: ValidationChecks<TinyDslAstType> = {
        Person: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class TinyDslValidator {

    checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
        if (person.name) {
            const firstChar = person.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
            }
        }
    }

}
