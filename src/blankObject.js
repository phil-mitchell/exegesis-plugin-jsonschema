'use strict';

const schemaWalker = require( '@cloudflare/json-schema-walker' );

module.exports = function blankObject( schemaRoot ) {
    function preSchema( schema, path, parent ) {
        switch( schema.type ) {
        case'array':
            schema.res = schema.res || [];
            break;
        case'object':
            schema.res = schema.res || {};
            break;
        default:
            schema.res = schema.res || ( schema.properties && {}) || null;
        }

        if( ( schema.type === 'array' && schema.items && schema.items.$id ) ||
            ( parent && ( schema.type === 'object' || schema.properties ) && schema.$id ) ||
            schema.readOnly ) {
            delete schema.items;
            delete schema.properties;
            schema.type = 'string';
            schema.format = 'uri';
            schema.readOnly = true;
        } else if( schema.default !== undefined ) {
            schema.res = schema.default;
        }

        if( schema.type === 'array' ) {
            schema.type = 'string';
            schema.readOnly = true;
            delete schema.items;
        }
        return schema;
    }

    function postSchema( schema, path, parent ) {
        if( parent && !schema.readOnly && parent.type === 'object' ) {
            parent.res[path[path.length-1]] = schema.res || parent.res[path[path.length-1]] || null;
        }
    }

    schemaRoot = JSON.parse( JSON.stringify( schemaRoot ) );
    const vocab = schemaWalker.getVocabulary( schemaRoot, schemaWalker.vocabularies.DRAFT_04 );
    schemaWalker.schemaWalk( schemaRoot, preSchema, postSchema, vocab );
    return schemaRoot.res;
};
