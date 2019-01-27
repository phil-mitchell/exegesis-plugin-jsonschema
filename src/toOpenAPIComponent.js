'use strict';

const toOpenAPI = require( 'json-schema-to-openapi-schema' );
const schemaWalker = require( '@cloudflare/json-schema-walker' );
const utils = require( './utils' );

function addRefToSchema( schema, path, parent ) {
    if( parent && utils.isSubSchema( schema ) ) {
        if( path[path.length-2] === 'properties' ) {
            parent.properties[path[path.length-1]] = { oneOf: [ schema, { type: 'string', format: 'uri' } ] };
        } else if( path[path.length-1] === 'items' ) {
            parent.items = { oneOf: [ schema, { type: 'string', format: 'uri' } ] };
        }
    }
    delete schema['x-toOpenAPISchema-isSubSchema'];
    delete schema['default'];
}

function trimDefinition( schema ) {
    schema = JSON.parse( JSON.stringify( schema ) );
    const vocab = schemaWalker.getVocabulary( schema, schemaWalker.vocabularies.DRAFT_04 );
    schemaWalker.schemaWalk( schema, null, addRefToSchema, vocab );
    return schema;
}

module.exports = function( schema ) {
    return toOpenAPI( trimDefinition( schema ) );
};
