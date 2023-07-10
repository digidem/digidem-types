## @digidem/types

Typescript type definitions for untyped modules, for internal use prior to
publishing on DefinitelyTyped

## Usage

```sh
npm install @digidem/types
```

Then edit `tsconfig.json` to point `typeRoots` to
`node_modules/@digidem/types/vendor` e.g.

```json
{
  "compilerOptions": {
    "typeRoots": ["node_modules/@digidem/types/vendor", "node_modules/@types"]
  }
}
```
