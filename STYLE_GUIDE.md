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

<sub>\* [Python zen](https://www.python.org/dev/peps/pep-0020) with slight modifications.</sup>

1. Be consistent with existing code.

2. Do not use the filename index.ts/index.js.
   The meaning is not so useful.
   NodeJS has special treatment for index name, but other engines like Deno not.

3. Comments are code smell, when comment describes what the code is doing.

4. Use interfaces over aliases.

5. Use named exports.
   To avoid interop problems between [ESM and CJS](https://github.com/rollup/rollup/issues/1961#issuecomment-423037881).

6. In general function syntax is preferred, in particular for [top level](https://deno.land/manual@v1.10.3/contributing/style_guide#top-level-functions-should-not-use-arrow-syntax) functions (to avoid TDZ issues, `export const foo = () => {}` function will not be available to be called unless the module where it came from has already been evaluated, otherwise you'll get the temporal dead zone error, happens with circular dependencies. Also hoisting counts). Arrow syntax should be limited to closures.

7. Avoid use of abbreviations for naming, be verbose.

8. Follow keyToValue or valueByKey for hashmap naming.

9. Use uppercase for acronyms, [names are for readability](https://github.com/airbnb/javascript#naming--Acronyms-and-Initialisms), not to appease a computer algorithm. e.g.: XMLHTTPRequest, xmlHTTPRequest, requestIPAddress or dbmxmlParse

10. CamelCase for abbreviations: Id[entifier], Exe[cutable], App[lication].

11. Kebab-Case for folders.

12. CamelCase/PascalCase for files.

13. CamelCase for variables.

14. UpperCase for string literals or integer literals, used as aliases for “hard-coded” values.

15. PascalCase for constructors.

16. Name file as export whenever possible. Good for searchability.

17. Don`t use descriptive names for modules. Descriptive names are [anti-democratic](https://hueniversedotcom.wordpress.com/2015/09/10/the-myth-of-descriptive-module-names).
