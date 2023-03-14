# Welcome to your Langium VS Code Extension

## What's in the folder

This folder contains all necessary files for your language extension.

* `package.json` - the manifest file in which you declare your language support.
* `language-configuration.json` - the language configuration used in the VS Code editor, defining the tokens that are used for comments and brackets.
* `src/extension.ts` - the main code of the extension, which is responsible for launching a language server and client.
* `src/language-server/tiny-dsl.langium` -  the grammar definition of your language.
* `src/language-server/main.ts` - the entry point of the language server process.
* `src/language-server/tiny-dsl-module.ts` - the dependency injection module of your language implementation. Use this to register overridden and added services.
* `src/language-server/tiny-dsl-validator.ts` - an example validator. You should change it to reflect the semantics of your language.
* `src/cli/index.ts` - the entry point of the command line interface (CLI) of your language.
* `src/cli/generator.ts` - the code generator used by the CLI to write output files from DSL documents.
* `src/cli/cli-util.ts` - utility code for the CLI.
* `examples` - folder containing sample `.tinydsl` files.

## Get up and running straight away

1. Ensure that [Node](https://nodejs.org/en/download/) is installed.
2. Run `npm install` to download all project dependencies.
3. Run `npm run langium:generate` to generate TypeScript code from the grammar definition.
4. Run `npm run build` to compile all TypeScript code.
5. Press `F5` to open a new window with your extension loaded (aka VS Code Debug session).
6. Open a file inside `examples` folder or create a new file with file name suffix `.tinydsl`.
7. Verify that syntax highlighting, validation, completion etc. are working as expected.
8. Run `./bin/cli` to see options for the CLI; `./bin/cli generate <file>` generates code for a given DSL file.

## Make changes

* Run `npm run langium:watch` to have the Langium generator run automatically afer every change of the grammar declaration.
* Run `npm run watch` to have the TypeScript compiler run automatically after every change of the source files.
* You can relaunch the extension from the debug toolbar after making changes to the files listed above.
* You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.

## Debug

1. Make sure that the right launch configuration is enabled:
   * Open VSCode command palette (Windows: `Ctrl+Shift+P`, MacOS: `Cmd-Shift-P`).
   * Type `Show Run and Debug` and press Enter to switch to Debug view.
   * Switch to launch configuration `Debug Extension` in the dropdown menu in the upper left corner.
2. Set breakpoints as you like in any TypeScript file.
3. Press `F5` to run VSCode Debug instance.

## Test

* Add your `**.test.js` file to `test` folder.
* Run `npm test`.
* Alternatively, you can use VS Code extension [Vitest](https://marketplace.visualstudio.com/items?itemName=ZixuanChen.vitest-explorer) to run the tests.

## Install your extension

* To start using your extension with VS Code, copy it into the `<user home>/.vscode/extensions` folder and restart Code.
* To share your extension with the world, read the [VS Code documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) about publishing an extension.

## To Go Further

Documentation about the Langium framework is available at <https://langium.org>.

Langium GitHub-Repository with lots of sample code: <https://github.com/langium/langium>.

### Useful Links

* <https://langium.org/docs/langium-overview/>
* <https://langium.org/docs/grammar-language/>
* <https://langium.org/docs/sematic-model/>
* <https://langium.org/docs/configuration-services/>
* <https://langium.org/docs/document-lifecycle/>
* <https://langium.org/guides/scoping/qualified-name/>
* <https://langium.org/guides/scoping/class-member/>
* <https://langium.org/tutorials/validation/>
* <https://langium.org/tutorials/generation/>
* <https://langium.org/tutorials/building_an_extension/>
* <https://langium.org/tutorials/langium_and_monaco/>
