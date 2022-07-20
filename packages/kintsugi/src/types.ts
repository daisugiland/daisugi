export interface Fn {
  (...args: any[]): any;
}

export interface AsyncFn {
  (...args: any[]): Promise<any>;
}
