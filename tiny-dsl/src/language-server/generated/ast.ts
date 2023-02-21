/******************************************************************************
 * This file was generated by langium-cli 1.1.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

/* eslint-disable */
import { AstNode, AbstractAstReflection, Reference, ReferenceInfo, TypeMetaData } from 'langium';

export interface Greeting extends AstNode {
    readonly $container: Model;
    readonly $type: 'Greeting';
    person: Reference<Person>
}

export const Greeting = 'Greeting';

export function isGreeting(item: unknown): item is Greeting {
    return reflection.isInstance(item, Greeting);
}

export interface Model extends AstNode {
    readonly $type: 'Model';
    greetings: Array<Greeting>
    persons: Array<Person>
}

export const Model = 'Model';

export function isModel(item: unknown): item is Model {
    return reflection.isInstance(item, Model);
}

export interface Person extends AstNode {
    readonly $container: Model;
    readonly $type: 'Person';
    name: string
}

export const Person = 'Person';

export function isPerson(item: unknown): item is Person {
    return reflection.isInstance(item, Person);
}

export interface TinyDslAstType {
    Greeting: Greeting
    Model: Model
    Person: Person
}

export class TinyDslAstReflection extends AbstractAstReflection {

    getAllTypes(): string[] {
        return ['Greeting', 'Model', 'Person'];
    }

    protected override computeIsSubtype(subtype: string, supertype: string): boolean {
        switch (subtype) {
            default: {
                return false;
            }
        }
    }

    getReferenceType(refInfo: ReferenceInfo): string {
        const referenceId = `${refInfo.container.$type}:${refInfo.property}`;
        switch (referenceId) {
            case 'Greeting:person': {
                return Person;
            }
            default: {
                throw new Error(`${referenceId} is not a valid reference id.`);
            }
        }
    }

    getTypeMetaData(type: string): TypeMetaData {
        switch (type) {
            case 'Model': {
                return {
                    name: 'Model',
                    mandatory: [
                        { name: 'greetings', type: 'array' },
                        { name: 'persons', type: 'array' }
                    ]
                };
            }
            default: {
                return {
                    name: type,
                    mandatory: []
                };
            }
        }
    }
}

export const reflection = new TinyDslAstReflection();
