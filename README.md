# TinyDSL - Example Langium DSL plugable to VS Code as Desktop and Web extension

## What's in the folder

This folder contains all necessary files for the Tiny DSL language extension.

* `package.json` - the manifest file in which language support is declared.
* `language-configuration.json` - the language configuration used in the VS Code editor, defining the tokens that are used for comments and brackets.
* `src/extension.ts` - the main code of the extension, which is responsible for launching a language server and client.
* `src/web/extension.ts` - does the same when using the extension as a web extension for running VS code within a web browser
* `src/language-server/tiny-dsl.langium` -  the grammar definition of the Tiny DSL language.
* `src/language-server/main.ts` - the entry point of the language server process.
* `src/language-server/tiny-dsl-module.ts` - the dependency injection module the Tiny DSL language implementation. Use this to register overridden and added services.
* `src/language-server/tiny-dsl-validator.ts` - the Tiny DSL example validator.
* `src/generator.ts` - an SQL code generator, generating SQL DDL scripts from Tiny DSL files
* `examples` - folder containing sample `.tinydsl` files.

## Get up and running straight away

1. Ensure that [Node](https://nodejs.org/en/download/) is installed.
2. Run `npm install` to download all project dependencies.
3. Run `npm run langium:generate` to generate TypeScript code from the grammar definition.
4. Run `npm run build` to compile all TypeScript code.
5. Press `F5` to open a new window with your extension loaded (aka VS Code Debug session).
6. Open a file inside `examples` folder or create a new file with file name suffix `.tinydsl`.
7. Verify that syntax highlighting, validation, completion etc. are working as expected.
8. Example SQL files are generated after saving any `.tinydsl`-Files (or can be triggered manually via the menu of the `.tyndsl`-Editor).

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

## Web-based Development

* VS Code extensions can be deployed as web extensions as well
* Run `npm run compile-web` to compile the TinyDSL as a web-based extension.
* Set the `$extensionFolderPath` variable to your workspace location (e.g., `$extensionFolderPath='C:\Dev\Langium\langium-intermission-02-2023'`).
* Run `npx @vscode/test-web --extensionDevelopmentPath=$extensionFolderPath` to run VS Code as a local server at port 3000
* Go to your browser and open <http://localhost:3000/>

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
* <https://code.visualstudio.com/api/extension-guides/web-extensions>
