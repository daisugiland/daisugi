import 'reflect-metadata';
import { injectable, singleton, container } from 'tsyringe';

let index = 0;

@injectable()
class B {
  constructor() {
    index++;
  }
}

@singleton()
class A {
  constructor(public b: B) {}
}

const a = container.resolve(A);
const a2 = container.resolve(A);
const a3 = container.resolve(A);

console.log(index);
