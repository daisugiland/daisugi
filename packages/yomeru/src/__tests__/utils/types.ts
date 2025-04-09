export type Expect<T extends true> = T;
export type ExpectFalse<T extends false> = T;
export type Equal<X, Y> = (<T>() => T extends X
  ? 1
  : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;
export type NotEqual<X, Y> = true extends Equal<X, Y>
  ? false
  : true;

export function checkType<
  _T1 extends true,
  _T2 extends true = true,
  _T3 extends true = true,
  _T4 extends true = true,
>() {}
