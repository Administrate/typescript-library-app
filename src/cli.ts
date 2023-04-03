import cli, { InputQuestion } from "inquirer";

interface TypeSafeInput<
  TValidatedInput,
  TName extends string
> extends InputQuestion<{ [name in TName]: TValidatedInput }> {
  type: "input";
  name: TName;
  message: string;
  parse: (input: any) => TValidatedInput;
}

// We don't always need to do anything after the booleanp predicate is true,
// but other times we do need to parse the string to another type.
const identity = <T>(x: T) => x;

export const createInput = <T, N extends string>(
  name: N,
  message: string,
  validate: (input: any) => input is T,
  parse?: (input: any) => T
): TypeSafeInput<T, N> => ({
  type: "input",
  name,
  message,
  validate,
  parse: parse || identity
});

type SimpleObject<TKey extends string, TValue> = { [name in TKey]: TValue };
type SO<TK extends string, TV> = SimpleObject<TK, TV>;

// overloads of up to 4 inputs
export async function prompt<
  T1, TN1 extends string,
  T2, TN2 extends string,
  T3, TN3 extends string,
  T4, TN4 extends string
>(
  i1: TypeSafeInput<T1, TN1>,
  i2: TypeSafeInput<T2, TN2>,
  i3: TypeSafeInput<T3, TN3>,
  i4: TypeSafeInput<T4, TN4>
): Promise<SO<TN1, T1> & SO<TN2, T2> & SO<TN3, T3> & SO<TN4, T4>>;

export async function prompt<
  T1, TN1 extends string,
  T2, TN2 extends string,
  T3, TN3 extends string,
>(
  i1: TypeSafeInput<T1, TN1>,
  i2: TypeSafeInput<T2, TN2>,
  i3: TypeSafeInput<T3, TN3>
): Promise<SO<TN1, T1> & SO<TN2, T2> & SO<TN3, T3>>;

export async function prompt<
  T1, TN1 extends string,
  T2, TN2 extends string,
>(
  i1: TypeSafeInput<T1, TN1>,
  i2: TypeSafeInput<T2, TN2>
): Promise<SO<TN1, T1> & SO<TN2, T2>>;

export async function prompt<
  T1, TN1 extends string,
>(
  i1: TypeSafeInput<T1, TN1>
): Promise<SO<TN1, T1>>;

export async function prompt<T1, TN1 extends string>(...inputs: TypeSafeInput<T1, TN1>[]): Promise<SO<TN1, T1>> {
  const answers = await cli.prompt(inputs);

  return inputs.reduce((accum, curr) => {
    const parsedValue = curr.parse(answers[curr.name]);
    accum[curr.name] = parsedValue;
    return accum;
  }, {} as SO<TN1, T1>);
}

