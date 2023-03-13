# Langium TinyDSL

## Installation

* Ensure that [Node](https://nodejs.org/en/download/) is installed.
* Run `npm install` to download all project dependencies.

## How to Use

1. Edit grammar file `src/language-server/tiny-dsl.langium` as you like.
2. Edit Typescript code as you like.
3. Open a Terminal and execute `npm run langium:generate` (compiles Langium Grammar to TypeScript code).
4. Open another Terminal and execute `npm run watch` (compiles TypeScript code to JavaScript code).
5. Make sure that the right launch configuration is enabled:

   * Open VSCode command palette (Windows: `Ctrl+Shift+P`, MacOS: `Cmd-Shift-P`).
   * Type `Show Run and Debug` and press Enter to switch to Debug view.
   * Switch to launch configuration `Debug Extension` in the dropdown menu in the upper left corner.

6. Set breakpoints as you like in any **JavaScript** file in `out` folder (Breakpoints in TypeScript files do not work).
7. Press `F5` to run VSCode Debug instance.
8. In VSCode Debug instance, open folder `tiny-dsl-example`.
9. Open any example `.tinydsl` file and make sure `Tiny DSL` extension is enabled for this file in the bottom right corner.
