"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TinyDslValidator = exports.registerValidationChecks = void 0;
/**
 * Register custom validation checks.
 */
function registerValidationChecks(services) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.TinyDslValidator;
    const checks = {
        Entity: validator.checkEntitiesStartsWithCapital
    };
    registry.register(checks, validator);
}
exports.registerValidationChecks = registerValidationChecks;
/**
 * Implementation of custom validations.
 */
class TinyDslValidator {
    checkEntitiesStartsWithCapital(entity, accept) {
        if (entity.name) {
            const firstChar = entity.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Entity name should start with a capital.', { node: entity, property: 'name' });
            }
        }
    }
}
exports.TinyDslValidator = TinyDslValidator;
//# sourceMappingURL=tiny-dsl-validator.js.map