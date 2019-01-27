# exegesis-plugin-jsonschema

[![Run Status](https://api.shippable.com/projects/5c437f657433f60600a12e74/badge?branch=master)]()
[![Coverage Badge](https://api.shippable.com/projects/5c437f657433f60600a12e74/coverageBadge?branch=master)]()
![](https://img.shields.io/github/issues/phil-mitchell/exegesis-plugin-jsonschema.svg)
![](https://img.shields.io/github/license/phil-mitchell/exegesis-plugin-jsonschema.svg)
![](https://img.shields.io/node/v/exegesis-plugin-jsonschema.svg)

## Description

An exegesis plugin to generate CRUD operations based on JSON schema definition.

## Installation

```sh
npm install exegesis-plugin-jsonschema
```

## Example

Add this to your Exegesis options:

```js
const exegesisJSONSchemaPlugin = require( 'exegesis-plugin-jsonschema' );

var jsonShemaPlugin = exegesisJSONSchemaPlugin({});
await jsonSchemaPlugin.addSchema( path.resolve( __dirname, './model/root.json' ) );

options = {
    plugins: [
        jsonSchemaPlugin
    ]
};
```
