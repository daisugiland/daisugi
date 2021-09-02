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
> Although never is often better than _right_ now.</br>
> If the implementation is hard to explain, it's a bad idea.</br>
> If the implementation is easy to explain, it may be a good idea.

<sub>\* Borrowed from [Python zen](https://www.python.org/dev/peps/pep-0020) with slight modifications.</sup>

1. Be consistent with existing code.

3. Comments are code smell, [when comment describes what the code is doing](https://henrikwarne.com/2021/06/15/on-comments-in-code/). From a philosophical point of view, each line of code contains a technical debt for further support. Only the final functionality is the value. And if you can implement it without a single line (of commentary) at all, then everything is perfect. Otherwise, you should always have the [WHY / WHY motive](https://habr.com/ru/post/562938/#comment_23154158) you added it for. Theoretically, this motive should be indicated in the commentary. The WHAT question is usually resolved by meaningful of the identifiers of classes, methods and variables. The question HOW should be clear from the code itself (also theoretically).

4. Use interfaces over aliases.

5. Use named exports. To avoid interop problems between [ESM and CJS](https://github.com/rollup/rollup/issues/1961#issuecomment-423037881).

6. In general function syntax is preferred, in particular for [top level](https://deno.land/manual@v1.10.3/contributing/style_guide#top-level-functions-should-not-use-arrow-syntax) functions (to avoid TDZ issues, `export const foo = () => {}` function will not be available to be called unless the module where it came from has already been evaluated, otherwise you'll get the temporal dead zone error, happens with circular dependencies. Also hoisting counts). Arrow syntax should be limited to closures.

8.  Delimit scope blocks with [curly braces](https://eslint.org/docs/rules/curly#rule-details).

9.  Space between blocks.

11. Do not use decorators by annotation, are executed at time of interpretation, that could create inconvenience when you are injecting dependencies which need be instanciated when is creating class instance (happens for example when you try resolve dependencies via auto-wire).

12. Every package should contain all the needed dependencies. Doing [this](https://yarnpkg.com/features/workspaces#what-does-it-mean-to-be-a-workspace) allows us to cleanly decouple projects (packages) from one another, since you don't have to merge all their dependencies in one huge unmaintainable list.


## Naming conventions

### Folders and files

Rules:
  * Kebab-Case for folders.
    > ✔️ Covers if folder will be extracted to its own package some day. [[+]](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#name)
  * CamelCase/PascalCase for files.
    > ❌ Have problems on renaming case-sensitive files with git.

    ✔️ Good

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

    ❌ Bad

    ```javascript
    // file name: programstore.js

    export class ProgramStore {
      ...
    }
    ```

    ✔️ Good

    ```javascript
    // file name: ProgramStore.js

    export class ProgramStore {
      ...
    }
    ```

  * Files whose exports multiple things, the file name should be kept short, meaningful and easily understandable to others.
  * Avoid index as file name.
    > ✔️ It does not reflect the content of the file.

    > ✔️ The file can`t live outside of the folder, because breaks the chain between folder name + file name.

    > ✔️ NodeJS has special treatment for index file, but other engines like Deno not.

1.  `Variables`: CamelCase for variables.

    ❌ Bad

    ```javascript
    const firstname = 'Benadryl';
    const first_name = 'Benadryl';
    const FIRSTNAME = 'Benadryl';
    const FIRST_NAME = 'Benadryl';
    ```

    ✔️ Good

    ```javascript
    const firstName = 'Benadryl';
    ```

2.  `Acronyms`: Use uppercase for acronyms, [names are for readability](https://github.com/airbnb/javascript#naming--Acronyms-and-Initialisms), not to appease a computer algorithm.

    ❌ Bad

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

    ✔️ Good

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

3.  `Abbreviations`: CamelCase for abbreviations.

    ❌ Bad

    ```javascript
    const programID = 0; // Id[entifier].
    const isEXEFile = true; // Exe[cutable].
    const desktopAPP = 'Zoom'; // App[lication].
    ```

    ✔️ Good

    ```javascript
    const programId = 0; // Id[entifier].
    const isExeFile = true; // Exe[cutable].
    const desktopApp = 'Zoom'; // App[lication].
    ```

4. `Verbosity`: Avoid use of abbreviations for naming, be verbose.

    ❌ Bad

    ```javascript
    const accBalInSaving = 0;
    const dmgPerSec = 100;
    ```

    ✔️ Good

    ```javascript
    const accountBalanceInSavings = 0;
    const damagePerSecond = 100;
    ```

5. `HashMaps`: Follow `keyToValue` or `valueByKey` for hashmap naming.

    ❌ Bad

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

    ✔️ Good

    ```javascript
    const stateToNumberOfCounties = {
      CA: 58,
    };

    const numberOfCountiesByState = {
      CA: 58,
    };
    ```

6.  `Constants`: UpperCase for string literals or integer literals, used as aliases for “hard-coded” values.

    ✔️ Good

    ```javascript
    const SECONDS = 60;
    const MINUTES = 60;
    const HOURS = 24;
    const DAY = SECONDS * MINUTES * HOURS;
    const DAYS_UNTIL_TOMORROW = 1;
    ```

7.  `Constructors`: PascalCase for constructors.

    ✔️ Good

    ```javascript
    class GoodGreeter {
      name;

      constructor() {
        this.name = 'hello';
      }
    }
    ```

8.  `Contextualization`: Do not contextualize the naming of the provided arguments to the methods.

    ❌ Bad

    ```javascript
    function findProgramById(id) {
      ...
    }

    const programId = 'XXXX-XXXX';

    findProgramById(programId);
    ```

    ✔️ Good

    ```javascript
    function findProgramById(programId) {
      ...
    }

    const programId = 'XXXX-XXXX';

    findProgramById(programId);
    ```

9.  `Enumerations`: Do use a singular type name for an [enumeration](https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-1.1/4x252001(v=vs.71)?redirectedfrom=MSDN) (Enumerations are used to represent a fixed number of possible values), unless its values are bit fields. Use PascalCase for Enum types and value names.

    ❌ Bad

    ```javascript
    const codes = {
      notFound: 'NotFound',
      badRequest: 'BadRequest',
    };
    ```

    ✔️ Good

    ```javascript
    const Code = {
      NotFound: 'NotFound',
      BadRequest: 'BadRequest',
    };
    ```

10. `Published packages`: Don`t use descriptive names for published modules. Descriptive names are [anti-democratic](https://hueniversedotcom.wordpress.com/2015/09/10/the-myth-of-descriptive-module-names).

11. The only thing pluralize is collections.

    ✔️ Good

    ```javascript
    customers.forEach((customer) => {
      ...
    });
    ```
