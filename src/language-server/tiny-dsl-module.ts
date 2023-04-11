import {
    createDefaultModule,
    createDefaultSharedModule,
    DefaultSharedModuleContext,
    inject,
    LangiumServices,
    LangiumSharedServices,
    Module,
    PartialLangiumServices,
    PartialLangiumSharedServices,
} from 'langium';

import { TinyDslDocumentSymbolProvider } from '../outline/tiny-dsl-document-symbol-provicer';
import { TinyDslScopeComputation } from '../scoping/scope-computation';
import { TinyDslScopeProvider } from '../scoping/scope-provider';
import { TinyDslGeneratedModule, TinyDslGeneratedSharedModule } from './generated/module';
import { TinyDslActionProvider } from './tiny-dsl-actions';
import { TinyDslCompletionProvider } from './tiny-dsl-completions';
import { TinyDslFormatter } from './tiny-dsl-formatter';
import {
    IndexAccess,
    TinyDslIndexManager,
    TinyDslLanguageServer,
    TinyDslWorkspaceSymbolProvider,
    WorkspaceSymbolProvider,
} from './tiny-dsl-services';
import { registerValidationChecks, TinyDslValidator } from './tiny-dsl-validator';

/**
 * Declaration of custom services - add your own service classes here.
 */
export type TinyDslAddedServices = {
    validation: {
        TinyDslValidator: TinyDslValidator;
    };
    workspace: {
        IndexAccess: IndexAccess;
        WorkspaceSymbolProvider: WorkspaceSymbolProvider;
    };
};

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type TinyDslServices = LangiumServices & TinyDslAddedServices;

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const TinyDslModule: Module<TinyDslServices, PartialLangiumServices & TinyDslAddedServices> = {
    validation: {
        TinyDslValidator: (services) => new TinyDslValidator(services),
    },
    references: {
        ScopeComputation: (services) => new TinyDslScopeComputation(services),
        ScopeProvider: (services) => new TinyDslScopeProvider(services),
    },
    lsp: {
        CodeActionProvider: (services) => new TinyDslActionProvider(services),
        CompletionProvider: (services) => new TinyDslCompletionProvider(services),
        DocumentSymbolProvider: (services) => new TinyDslDocumentSymbolProvider(services),
        Formatter: () => new TinyDslFormatter(),
    },
    workspace: {
        IndexAccess: (services) => new IndexAccess(services),
        WorkspaceSymbolProvider: (services) => new TinyDslWorkspaceSymbolProvider(services),
    },
};

export const TinyDslSharedModule: Module<LangiumSharedServices, PartialLangiumSharedServices> = {
    lsp: {
        LanguageServer: (services) => new TinyDslLanguageServer(services),
    },
    workspace: {
        IndexManager: (services) => new TinyDslIndexManager(services),
    },
};

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createTinyDslServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices;
    TinyDsl: TinyDslServices;
} {
    console.log('createServices');
    const shared = inject(createDefaultSharedModule(context), TinyDslGeneratedSharedModule, TinyDslSharedModule);
    const TinyDsl = inject(createDefaultModule({ shared }), TinyDslGeneratedModule, TinyDslModule);
    shared.ServiceRegistry.register(TinyDsl);
    registerValidationChecks(TinyDsl);
    return { shared, TinyDsl };
}
