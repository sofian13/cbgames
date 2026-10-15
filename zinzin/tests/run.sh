#!/bin/sh
# Tests unitaires du comptage de la Soirée : bundle esbuild (alias @ → src) puis node.
# Usage : sh zinzin/tests/run.sh
R=$(cd "$(dirname "$0")/../.." && pwd)
OUT=$(mktemp -d)/soiree.test.mjs
"$R/node_modules/.bin/esbuild" "$R/zinzin/tests/soiree.test.ts" --bundle --platform=node --format=esm \
  --alias:@=$R/src --jsx=automatic --log-level=warning --loader:.css=empty \
  --banner:js='const __m=new Map([["zz-premium","1"]]);globalThis.localStorage={getItem:k=>__m.has(k)?__m.get(k):null,setItem:(k,v)=>__m.set(k,String(v)),removeItem:k=>__m.delete(k),clear:()=>__m.clear()};' \
  --outfile="$OUT" && node "$OUT"
