# JavaScript style guide

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

- [JavaScript style guide](#javascript-style-guide)
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
    - [Functions](#functions)
    - [Constructors](#constructors)
    - [Enumerations](#enumerations)
    - [Measures](#measures)
    - [Counts](#counts)
    - [Public modules](#public-modules)
    - [Asynchronous](#asynchronous)
    - [Generators](#generators)
  - [Formatting conventions](#formatting-conventions)
    - [Curly braces](#curly-braces)
    - [Block scopes](#block-scopes)
  - [Programming Practices](#programming-practices)
    - [Exports](#exports)
    - [Functions](#functions-1)
    - [Decorations](#decorations)
    - [Interfaces](#interfaces)
    - [Constructors](#constructors-1)
    - [Monorepos](#monorepos)
    - [Comments](#comments)
    - [Composition](#composition)
  - [Goal](#goal)

## Naming conventions

### Folders and files

  * `kebab-case` for folders.

    > Covers if folder will be extracted to its own package some day. [[+]](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#name)

  * `camelCase` or `PascalCase` for files.

    > Has problems on commiting case-sensitive filename changes with Git. [[+]](https://stackoverflow.com/a/20907647)

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
  * Avoid `index` as a file name.

    > It does not reflect the content of the file.

    > The file can’t live outside of the folder, because breaks the chain between folder name and file name.

    > NodeJS has a special treatment for `index` files, but other engines like Deno don’t.

    ❌  Bad

    ```sh
    .
    └── src/
        └── program-filters/
            ├── isNotOldFilter.js
            ├── hasMonthlyDownloadsFilter.js
            └── index.js
    ```

    ✔️  Good

    ```sh
    .
    └── src/
        └── program-filters/
            ├── isNotOldFilter.js
            ├── hasMonthlyDownloadsFilter.js
            └── programFilters.js
    ```

  * Avoid generic names for folders. Be precise.

    ❌  Bad

    ```sh
    .
    └── src/
        ├── utils/
        ├── config/
        ├── vendors/
        └── helpers/
    ```

    ✔️  Good

    ```sh
    .
    └── src/
        └── program-guards/
        ├── auth/
        └── logger/
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

  * Use **singularPlural** for a list of a single property. [[+]](https://softwareengineering.stackexchange.com/a/344762/401473)

    ✔️  Good

    ```javascript
    const programId = 1;
    const programIds = [1, 2];
    ```

  * Use **pluralOfSingular** for a list of single item.

    ✔️  Good

    ```javascript
    const topicsOfProgram = ['addons'];
    ```

  * Use **pluralOfPlural** for a list of lists.

    ✔️  Good

    ```javascript
    const topicsOfPrograms = ['skins', 'addons'];
    ```

### Variables

  * `camelCase` for variables.

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

  * `UPPERCASE` for acronyms.

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

  * `camelCase` for abbreviations.

    ❌  Bad

    ```javascript
    const programID = 0; // Id[entifier].
    const isEXEFile = true; // Exe[cutable].
    const androidAPPName = 'Zoom'; // App[lication].
    ```

    ✔️  Good

    ```javascript
    const programId = 0; // Id[entifier].
    const isExeFile = true; // Exe[cutable].
    const androidAppName = 'Zoom'; // App[lication].
    ```

### Verbosity

  * Avoid use of abbreviations for naming—be verbose.

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

  * **keyToValue** or **valueByKey** for HashMaps.
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
    const stateToCountiesCount = {
      CA: 58,
    };

    const countiesCountByState = {
      CA: 58,
    };
    ```

### Constants

  * `UPPERCASE` for constants.

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

  * Use `is` or `has` as prefixes. [[+]](https://dev.to/michi/tips-on-naming-boolean-variables-cleaner-code-35ig)

    ❌  Bad

    ```javascript
    const isUsersLoggedIn = true;

    const areUsersLoggedIn = true;
    ```

    ✔️  Good

    ```javascript
    const isEachUserLoggedIn = true;
    ```

  * Use affirmative names.

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

    > Implicit default.

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

### Functions

  * `camelCase` for functions.
  * Recommended use **verbAdjectiveContextOutputHow** pattern, where verb stick to action, adjective act as modifier for a context, and context is the object being interacted with. Adjective, context, output and how are optionals. [[+]](https://caseysoftware.com/blog/useful-naming-conventions)

    ❌  Bad

    ```javascript
    function programGetActiveById(programId) {
      ...
    }
    ```

    ✔️  Good

    ```javascript
    function findActiveProgramById(programId) {
      ...
    }
    ```

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

  * Vocabulary: [[+]](https://docs.oracle.com/javase/tutorial/datetime/overview/naming.html)

| Prefix     | Description                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `to`       | Convert object to another type.                                                                                         |
| `plus`     | Returns a copy object with the amount added.                                                                            |
| `minus`    | Returns a copy object with the amount subtracted.                                                                       |
| `with`     | Return a copy with element target.                                                                                      |
| `of`       | Returns an instance where the factory is primarily validating the input parameters, not converting them.                |
| `from`     | Converts the input parameters to an instance of the target object, which may involve losing information from the input. |
| `parse`    | Parses the input string to produce an instance of the target class.                                                     |
| `format`   | Uses the specified formatter to format the values in the temporal object.                                               |
| `at`       | Combines this object with another.                                                                                      |
| `get`      | Return a part of the state of the object.                                                                               |
| `list`     | Return a collection of part of the state of the object.                                                                 |
| `create`   | Returns a new instance on each invocation.                                                                              |
| `build`    | Returns a new instance where many separate pieces of information are combined in some way.                              |
| `generate` | Returns a new instance where a calculation is used to produce a value from an input.                                    |

### Constructors

  * `PascalCase` for constructors.

    ✔️  Good

    ```javascript
    class GoodGreeter {
      name;

      constructor() {
        this.name = 'hello';
      }
    }
    ```

  * Where appropriate, use a compound word for the naming. The second part of the derived name can be the name of the pattern. [[+]](https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-1.1/4xhs4564(v=vs.71))

    ✔️  Good

    ```javascript
    class GetItemBySlugUseCase {
      constructor() {}
    }
    ```

  * Infer context on naming class methods.

    ❌  Bad

    ```javascript
    class ProgramStore {
      getProgramById(programId) {
        ...
      }
    }
    ```

    ✔️  Good

    ```javascript
    class ProgramStore {
      getById(programId) {
        ...
      }
    }
    ```

### Enumerations

  * `PascalCase` for enumerations and value names. [[+]](https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-1.1/4x252001(v=vs.71)?redirectedfrom=MSDN)
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

### Measures

  * Use measures as suffix.

    ❌  Bad

    ```javascript
    const REQUEST_TIMEOUT = 2000;
    const MIN_COMPRESSION = 64;
    ```

    ✔️  Good

    ```javascript
    const REQUEST_TIMEOUT_MS = 2000;
    const MIN_COMPRESSION_BYTE = 64;
    ```

### Counts

  * Use `count` as suffix to indicate quantity. [[+]](https://stackoverflow.com/a/21345217)

    > `count` is shorter than `numberOf`.

    > `number` is ambiguous. It could be a count, or an index, or some other number.

  * Use `index` as suffix to indicate sequence number `0..n`.

    ❌  Bad

    ```javascript
    const MAX_PROGRAMS = 5;
    const PROGRAM_NUMBER = 2;
    ```

    ✔️  Good

    ```javascript
    const MAX_PROGRAM_COUNT = 5;
    const PROGRAM_INDEX = 2;
    ```

### Public modules

  * Don’t use descriptive names for public modules.

    > Descriptive names are anti-democratic. [[+]](https://hueniversedotcom.wordpress.com/2015/09/10/the-myth-of-descriptive-module-names).

### Asynchronous

  * Use `Sync` suffix for synchronous function when you have asynchronous version of the same function.

    > NodeJS implicit convention. [[+]](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/#comparing-code)

  * Use `when` prefix for variables. [[+]](https://github.com/airbnb/javascript/issues/848#issuecomment-322093859)

    > It sounds like the Promise `then` method.

    > It should mean ‘when this happens’.

    ✔️  Good

    ```javascript
    async function listPrograms() {
      ...
    }

    const whenPrograms = listPrograms();
    const programs = await whenPrograms;
    ```

    ❌  Bad

    ```javascript
    function listPrograms() {
      ...
    }

    async function listProgramsAsync() {
      ...
    }

    const whenPrograms = listProgramsAsync();
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

  * Use `gen` suffix when you have Generator version of the same function.
  * Use `iter` prefix for variables. [[+]](https://docs.python.org/2/library/stdtypes.html#dict.iteritems)

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

### Block scopes

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

## Programming practices

  * Be consistent with existing code.

### Exports

  * Use named exports.

    > To avoid interoperational problems between ES Modules and CommonJS. [[+]](https://github.com/rollup/rollup/issues/1961#issuecomment-423037881)

    ❌  Bad

    ```javascript
    export default class MyClass {
      ...
    }
    ```

    ✔️  Good

    ```javascript
    export class MyClass {
      ...
    }
    ```

### Functions

  * Use function syntax for functions.

    > In general function syntax is preferred, in particular for top level functions (to avoid TDZ issues, `export const foo = () => {}` function will not be available to be called unless the module where it came from has already been evaluated, otherwise you'll get the temporal dead zone error, happens with circular dependencies). [[+]](https://deno.land/manual@v1.10.3/contributing/style_guide#top-level-functions-should-not-use-arrow-syntax)

  * Use arrow functions for callbacks.

    > Arrow syntax should be limited to closures.

### Decorations

  * Avoid use of annotations for decoration.

    > Are executed at time of interpretation, that could create inconvenience when you are injecting dependencies which need be initialized at tame of class instance creation (e.g.: happens on resolving with auto-wire).

    ❌  Bad

    ```javascript
    class MyClass {
      @decorate()
      doStuff() {
        ...
      }
    }
    ```

    ✔️  Good

    ```javascript
    class MyClass {
      constructor() {
        this.doStuff = decorate(doStuff);
      }

      doStuff() {
        ...
      }
    }
    ```

### Interfaces

  * Use interfaces over aliases where possible.

    ❌  Bad

    ```javascript
    type FnAsync = (...args: any[]) => Promise<any>;
    ```

    ✔️  Good

    ```javascript
    interface FnAsync {
      (...args: any[]): Promise<any>;
    }
    ```

### Constructors

  * Use classes if you have more than one method and shared state.

    ❌  Bad

    ```javascript
    class RedisClient {
      constructor(baseURL) {
        ...
      }

      create() {
        ...
      }
    }

    const redisClient = new RedisClient(baseURL);
    const cacheClient = redisClient.create();
    ```

    ✔️  Good

    ```javascript
    function createRedisClientCreator(baseURL) {
      return function createRedisClient() {
        ...
      }
    }

    const createRedisClient = createRedisClientCreator(baseURL);
    const cacheClient = createRedisClient();
    ```

### Monorepos

  * Every package should contain all the needed dependencies.

    > Doing this allows us to cleanly decouple projects (packages) from one another, since you don't have to merge all their dependencies in one huge unmaintainable list. [[+]]((https://yarnpkg.com/features/workspaces#what-does-it-mean-to-be-a-workspace))

### Comments

  * Comments are code smell, when comment describes what the code is doing.

    > From a philosophical point of view, each line of code contains a technical debt for further support. Only the final functionality is the value. And if you can implement it without a single line (of commentary) at all, then everything is perfect. Otherwise, you should always have the **WHY** / **WHY motive** you added it for. Theoretically, this motive should be indicated in the commentary. The **WHAT** question is usually resolved by meaningful of the identifiers of classes, functions and variables. The question **HOW** should be clear from the code itself (also theoretically). [[+]](https://henrikwarne.com/2021/06/15/on-comments-in-code/) [[++]](https://habr.com/ru/post/562938/#comment_23154158)

### Composition

  * Use composition over inheritance.

## Goal

If we start from the fact that programming is a chain of taking decisions, the aim of this guide is to inspirate you and facilitate such decisions.

Following guide is a set of different sources, conveniently linked.
