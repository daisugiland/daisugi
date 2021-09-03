# Style guide

> Beautiful is better than ugly.</br>
> Explicit is better than implicit.</br>
> Simple is better than complex.</br>
> Complex is better than complicated.</br>
> Flat is better than nested.</br>
> Sparse is better than dense.</br>
> Readability counts.</br>
> Special cases aren't special enough to break the rules.</br>
> Although practicality beats purity.</br>
> Errors should never pass silently.</br>
> Unless explicitly silenced.</br>
> In the face of ambiguity, refuse the temptation to guess.</br>
> There’s more than one way to do it, but sometimes consistency is not a bad thing either. (TIMTOWTDIBSCINABTE)</br>
> Now is better than never.</br>
> Although later is often better than _right_ now.</br>
> If the implementation is hard to explain, it's a bad idea.</br>
> If the implementation is easy to explain, it may be a good idea.

<sub>\* Borrowed from Python zen with slight modifications. [[+]](https://www.python.org/dev/peps/pep-0020)</sup>

- [Style guide](#style-guide)
  - [Naming conventions](#naming-conventions)
    - [Folders and files](#folders-and-files)
    - [Pluralization](#pluralization)
    - [Variables](#variables)
    - [Acronyms](#acronyms)
    - [Abbreviations](#abbreviations)
    - [Verbosity](#verbosity)
    - [HashMaps](#hashmaps)
    - [Constants](#constants)
    - [Booleans](#booleans)
    - [Constructors](#constructors)
    - [Contextualization](#contextualization)
    - [Enumerations](#enumerations)
    - [Public modules](#public-modules)
    - [Asynchronous](#asynchronous)
    - [Generators](#generators)
  - [Formatting conventions](#formatting-conventions)
    - [Curly braces](#curly-braces)
    - [Blocks](#blocks)
  - [Programming Practices](#programming-practices)

## Naming conventions

### Folders and files

  * Kebab-Case for folders.

    > Covers if folder will be extracted to its own package some day. [[+]](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#name)

  * Camel case or Pascal case for files.

    > Has problems on renaming case-sensitive files with git.

    ✔️  Good

    ```sh
    .
    └── src/
        ├── stores/
        │   ├── program-store/
        │   │   ├── ProgramStore.js
        │   │   └── programs.json
        │   └── TopicStore.js
        ├── use-cases/
        │   └── search-programs/
        │       ├── SearchProgramsUseCase.js
        │       ├── SearchProgramsController.js
        │       └── searchProgramsRoutes.js
        └── app.js
    ```

  * A file that exports only one class, function, or constant should be named for that class, function or constant.

    ❌  Bad

    ```javascript
    // file name: programstore.js

    export class ProgramStore {
      ...
    }
    ```

    ✔️  Good

    ```javascript
    // file name: ProgramStore.js

    export class ProgramStore {
      ...
    }
    ```

  * Files whose exports multiple things, the file name should be kept short, meaningful and easily understandable to others.
  * Avoid index as file name.

    > It does not reflect the content of the file.

    > The file can`t live outside of the folder, because breaks the chain between folder name + file name.

    > NodeJS has special treatment for index file, but other engines like Deno not.

    ❌  Bad

    ```sh
    .
    └── src/
        └── program-filter/
            ├── isNotOldFilter.js
            ├── hasMonthlyDownloadsFilter.js
            └── index.js
    ```

    ✔️  Good

    ```sh
    .
    └── src/
        └── program-filter/
            ├── isNotOldFilter.js
            ├── hasMonthlyDownloadsFilter.js
            └── programFilters.js
    ```

### Pluralization

  * Pluralize only collections.

    ❌  Bad

    ```javascript
    class ProgramsStore {
      constructor() {}
    }
    ```

    ✔️  Good

    ```javascript
    class ProgramStore {
      constructor() {}
    }
    ```

    ✔️  Good

    ```javascript
    customers.forEach((customer) => {
      ...
    });
    ```

### Variables

  * Camel case for variables.

    ❌  Bad

    ```javascript
    const firstname = 'Benadryl';
    const first_name = 'Benadryl';
    const FIRSTNAME = 'Benadryl';
    const FIRST_NAME = 'Benadryl';
    ```

    ✔️  Good

    ```javascript
    const firstName = 'Benadryl';
    ```

### Acronyms

  * Use Uppercase for acronyms.

    > Names are for readability, not to appease a computer algorithm. [[+]](https://github.com/airbnb/javascript#naming--Acronyms-and-Initialisms)

    ❌  Bad

    ```javascript
    const { XMLHttpRequest } = require('...');

    const xmlHttpRequest = { ... };

    function requestIpAddress() {
      ...
    }

    function dbmxmlParse() {
      ...
    }
    ```

    ✔️  Good

    ```javascript
    const { XMLHTTPRequest } = require('...');

    const xmlHTTPRequest = { ... };

    function requestIPAddress() {
      ...
    }

    function dbmXMLParse() {
      ...
    }
    ```

### Abbreviations

  * Camel case for abbreviations.

    ❌  Bad

    ```javascript
    const programID = 0; // Id[entifier].
    const isEXEFile = true; // Exe[cutable].
    const desktopAPP = 'Zoom'; // App[lication].
    ```

    ✔️  Good

    ```javascript
    const programId = 0; // Id[entifier].
    const isExeFile = true; // Exe[cutable].
    const desktopApp = 'Zoom'; // App[lication].
    ```

### Verbosity

  * Avoid use of abbreviations for naming, be verbose.

    ❌  Bad

    ```javascript
    const accBalInSaving = 0;
    const dmgPerSec = 100;
    ```

    ✔️  Good

    ```javascript
    const accountBalanceInSavings = 0;
    const damagePerSecond = 100;
    ```

### HashMaps

  * `keyToValue` or `valueByKey` for hashmaps.
  * No rules for keys naming.

    ❌  Bad

    ```javascript
    const mapStateCounty = {
      CA: 58,
    };

    const numberOfCountiesIn = {
      CA: 58,
    };

    const countyCountOf = {
      CA: 58,
    };
    ```

    ✔️  Good

    ```javascript
    const stateToNumberOfCounties = {
      CA: 58,
    };

    const numberOfCountiesByState = {
      CA: 58,
    };
    ```

### Constants

  * Uppercase for constants.

    > Constants are string or integer literals, used as aliases for “hard-coded” values.

    ✔️  Good

    ```javascript
    const SECONDS = 60;
    const MINUTES = 60;
    const HOURS = 24;
    const DAY = SECONDS * MINUTES * HOURS;
    const DAYS_UNTIL_TOMORROW = 1;
    ```

### Booleans

  * Use is or has as prefix. [[+]](https://dev.to/michi/tips-on-naming-boolean-variables-cleaner-code-35ig)

    ❌  Bad

    ```javascript
    const isUsersLoggedIn = true;

    const areUsersLoggedIn = true;
    ```

    ✔️  Good

    ```javascript
    const isEachUserLoggedIn = true;
    ```

  * Affirmative names.

    ❌  Bad

    ```javascript
    const isNotActive = true;

    if (!isNotActive) {
      ...
    }
    ```

    ✔️  Good

    ```javascript
    const isActive = true;

    if (isActive) {
      ...
    }
    ```

    * Use convenient name when the boolean is optional with negative default value. [[+]](https://www.serendipidata.com/posts/naming-guidelines-for-boolean-variables)

      > Avoid double negatives.

      > Implicit Default.

    ❌  Bad

    ```javascript
    function createWidget(isEnabled = true) {
      ...
    }
    ```

    ✔️  Good

    ```javascript
    function createWidget(isDisabled) {
      ...
    }
    ```

### Constructors

  * Pascal case for constructors.

    ✔️  Good

    ```javascript
    class GoodGreeter {
      name;

      constructor() {
        this.name = 'hello';
      }
    }
    ```

### Contextualization

  * Do not contextualize the naming of the provided arguments to the functions.

    > Easier perform massive find or replace.

    ❌  Bad

    ```javascript
    function findProgramById(id) {
      ...
    }

    const programId = 'XXXX-XXXX';

    findProgramById(programId);
    ```

    ✔️  Good

    ```javascript
    function findProgramById(programId) {
      ...
    }

    const programId = 'XXXX-XXXX';

    findProgramById(programId);
    ```

    ❌  Bad

    ```javascript
    function findProgramById({ id }) {
      ...
    }

    const programId = 'XXXX-XXXX';

    findProgramById({ id: programId });
    ```

    ✔️  Good

    ```javascript
    function findProgramById({ programId }) {
      ...
    }

    const programId = 'XXXX-XXXX';

    findProgramById({ programId });
    ```

  * Where appropriate, use a compound word for the naming. The second part of the derived name should be the name of the context. [[+]](https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-1.1/4xhs4564(v=vs.71))

    ✔️  Good

    ```javascript
    class GetItemBySlugUseCase {
      constructor() {}
    }
    ```

### Enumerations

  * Pascal case for enumerations and value names. [[+]](https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-1.1/4x252001(v=vs.71)?redirectedfrom=MSDN)
  * Singular type name.

    > Enumerations are used to represent a fixed number of possible values.

    ❌  Bad

    ```javascript
    const codes = {
      notFound: 'NotFound',
      badRequest: 'BadRequest',
    };
    ```

    ✔️  Good

    ```javascript
    const Code = {
      NotFound: 'NotFound',
      BadRequest: 'BadRequest',
    };
    ```

### Public modules

  * Don`t use descriptive names for public modules.

    > Descriptive names are anti-democratic. [[+]](https://hueniversedotcom.wordpress.com/2015/09/10/the-myth-of-descriptive-module-names).

### Asynchronous

  * Use Sync suffix for synchronous function when you have asynchronous version of the same function. [[+]](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/#comparing-code)

    > NodeJS implicit convention.

  * Use when prefix for variables. [[+]](https://github.com/airbnb/javascript/issues/848#issuecomment-322093859)

    > It sounds like then. a promise standard word

    > It should mean 'when this happens'

    ✔️  Good

    ```javascript
    async function listPrograms() {
      ...
    }

    const whenPrograms = listPrograms();
    const programs = await whenPrograms;
    ```

    ✔️  Good

    ```javascript
    function listProgramsSync() {
      ...
    }

    async function listPrograms() {
      ...
    }

    const whenPrograms = listPrograms();
    const programs = await whenPrograms;
    ```

### Generators

  * Use Gen suffix when you have Generator version of the same function.
  * Use iter prefix for variables. [[+]](https://docs.python.org/2/library/stdtypes.html#dict.iteritems)

    ❌  Bad

    ```javascript
    function* listProgramsGen() {
      ...
    }

    const iterPrograms = listProgramsGen();
    ```

    ✔️  Good

    ```javascript
    function* listPrograms() {
      ...
    }

    const iterPrograms = listPrograms();
    ```

    ✔️  Good

    ```javascript
    function listPrograms() {
      ...
    }

    function* listProgramsGen() {
      ...
    }

    const iterPrograms = listProgramsGen();
    ```

## Formatting conventions

### Curly braces

  * Delimit scope blocks with curly braces. [[+]](https://eslint.org/docs/rules/curly#rule-details)
  * Opening brace goes on the end of the current line, and the last brace in the new line.

    > Known as egyptian brackets. [[+]](https://blog.codinghorror.com/new-programming-jargon/)

    ❌  Bad

    ```javascript
    if (true) doSomething();
    ```

    ✔️  Good

    ```javascript
    if (true) {
      doSomething();
    }
    ```

### Blocks

  * Space between block scopes.

    ❌  Bad

    ```javascript
    if (true) {
      doSomething();
    }
    if (true) {
      doSomethingElse();
    }
    ```

    ✔️  Good

    ```javascript
    if (true) {
      doSomething();
    }

    if (true) {
      doSomethingElse();
    }
    ```

## Programming Practices

1. Be consistent with existing code.

2.  Comments are code smell, [when comment describes what the code is doing](https://henrikwarne.com/2021/06/15/on-comments-in-code/). From a philosophical point of view, each line of code contains a technical debt for further support. Only the final functionality is the value. And if you can implement it without a single line (of commentary) at all, then everything is perfect. Otherwise, you should always have the [WHY / WHY motive](https://habr.com/ru/post/562938/#comment_23154158) you added it for. Theoretically, this motive should be indicated in the commentary. The WHAT question is usually resolved by meaningful of the identifiers of classes, functions and variables. The question HOW should be clear from the code itself (also theoretically).

3. Use interfaces over aliases.

4. Use named exports. To avoid interop problems between [ESM and CJS](https://github.com/rollup/rollup/issues/1961#issuecomment-423037881).

5. In general function syntax is preferred, in particular for [top level](https://deno.land/manual@v1.10.3/contributing/style_guide#top-level-functions-should-not-use-arrow-syntax) functions (to avoid TDZ issues, `export const foo = () => {}` function will not be available to be called unless the module where it came from has already been evaluated, otherwise you'll get the temporal dead zone error, happens with circular dependencies. Also hoisting counts). Arrow syntax should be limited to closures.

6. Do not use decorators by annotation, are executed at time of interpretation, that could create inconvenience when you are injecting dependencies which need be instanciated when is creating class instance (happens for example when you try resolve dependencies via auto-wire).

7.  Every package should contain all the needed dependencies. Doing [this](https://yarnpkg.com/features/workspaces#what-does-it-mean-to-be-a-workspace) allows us to cleanly decouple projects (packages) from one another, since you don't have to merge all their dependencies in one huge unmaintainable list.