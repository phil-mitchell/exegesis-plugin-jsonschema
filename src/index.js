'use strict';
const semver = require( 'semver' );
const parser = require( 'json-schema-ref-parser' );

const JSONSchemaController = require( './controller' );
const pathGenerator = require( './pathGenerator' );

class JSONSchemaPlugin {
    constructor( apiDoc, options ) {
        this._options = options;

        // Verify the apiDoc is an OpenAPI 3.x.x document, because this plugin
        // doesn't know how to handle anything else.
        if( !apiDoc.openapi ) {
            throw new Error( "OpenAPI definition is missing 'openapi' field" );
        }

        if( !semver.satisfies( apiDoc.openapi, '>=3.0.0 <4.0.0' ) ) {
            throw new Error( `OpenAPI version ${apiDoc.openapi} not supported` );
        }

        this.controller = new JSONSchemaController();

        this._options.schema.forEach( schema => {
            pathGenerator( apiDoc, this.controller.name, schema.schema, schema.baseUrl );
        });
    }

    // Called exactly once, before Exegesis "compiles" the API document.
    // Plugins must not modify apiDoc here.
    preCompile({ options }) {
        options.controllers = options.controllers || {};
        if( options.controllers.hasOwnProperty( this.controller.name ) ) {
            throw new Error( `Controller already added with name ${this.controller.name}` );
        }
        this.controller.controllers = options.controllers;
        options.controllers[this.controller.name] = this.controller;
    }
}

module.exports = function plugin( options ) {
    options = options || {};
    if( !options.schema ) {
        options.schema = [];
    }
    if( !Array.isArray( options.schema ) ) {
        options.schema = [ options.schema ];
    }
    return{
        info: {
            // This should match the name of your npm package.
            name: 'exegesis-plugin-jsonschema'
        },
        options: options,
        makeExegesisPlugin: function makeExegesisPlugin({ apiDoc }) {
            return new JSONSchemaPlugin( apiDoc, this.options );
        },
        addSchema: async function addSchema( schema, baseUrl ) {
            this.options.schema.push({
                baseUrl: baseUrl || '',
                schema: await parser.dereference( schema )
            });
        }
    };
};
