"use client";

import { useCallback, useState, type SetStateAction } from "react";

type Initializer<S> = S | (() => S);

function resolveInitializer<S>(initializer: Initializer<S>): S {
  return typeof initializer === "function"
    ? (initializer as () => S)()
    : initializer;
}

export function useKeyedState<S>(key: string | number, initializer: Initializer<S>) {
  const [snapshot, setSnapshot] = useState(() => ({
    key,
    value: resolveInitializer(initializer),
  }));

  const value =
    snapshot.key === key ? snapshot.value : resolveInitializer(initializer);

  const setValue = useCallback(
    (update: SetStateAction<S>) => {
      setSnapshot((current) => {
        const base =
          current.key === key ? current.value : resolveInitializer(initializer);
        const nextValue =
          typeof update === "function"
            ? (update as (previous: S) => S)(base)
            : update;

        return {
          key,
          value: nextValue,
        };
      });
    },
    [initializer, key]
  );

  return [value, setValue] as const;
}
