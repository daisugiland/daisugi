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

<sub>\* [Python zen](https://www.python.org/dev/peps/pep-0020/) with slight modifications.</sup>

- Be consistent with existing code.

- Do not use the filename index.ts/index.js.
  The meaning is not so useful.
  NodeJS has special treatment for index name, but other engines like Deno not.

- Comments are code smell, when comment describes what the code is doing.

- Use interfaces over aliases.

- Use named exports.
  To avoid interop problems between [ESM and CJS](https://github.com/rollup/rollup/issues/1961#issuecomment-423037881).

- In general function syntax is preferred, in particular for [top level](https://deno.land/manual@v1.10.3/contributing/style_guide#top-level-functions-should-not-use-arrow-syntax) functions (to avoid TDZ issues, `export const foo = () => {}` function will not be available to be called unless the module where it came from has already been evaluated, otherwise you'll get the temporal dead zone error, happens with circular dependencies. Also hoisting counts). Arrow syntax should be limited to closures.

- Avoid use of abbreviations for naming, be verbose.

- Follow keyToValue or valueByKey for hashmap naming.

- Use uppercase for acronyms, [names are for readability](https://github.com/airbnb/javascript#naming--Acronyms-and-Initialisms), not to appease a computer algorithm. e.g.: XMLHTTPRequest, xmlHTTPRequest, requestIPAddress or dbmxmlParse

- CamelCase for abbreviations: Id[entifier], Exe[cutable], App[lication].

- Kebab-Case for folders.

- CamelCase/PascalCase for files.

- CamelCase for variables.

- UpperCase for string literals or integer literals, used as aliases for “hard-coded” values.

- PascalCase for constructors.

- Name file as export whenever possible. Good for searchability.
