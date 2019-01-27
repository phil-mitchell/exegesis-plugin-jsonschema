'use strict';

var expect = require( 'chai' ).expect;
var require_helper = require( '../require_helper' );
var toOpenAPIComponent = require_helper( 'toOpenAPIComponent' );

describe( 'Component Definitions', function() {
    it( 'returns empty definition for empty schemas', function() {
        var schema = {};
        var component = toOpenAPIComponent( schema );
        expect( component ).to.eql({});
    });

    it( 'does not modify scalar schemas with no unsupported properties', function() {
        var schema = { type: 'string' };
        var component = toOpenAPIComponent( schema );
        expect( component ).to.be.eql( schema );
    });

    it( 'removes non-supported openAPI properties from scalar schema', function() {
        var schema = { type: 'string', '$id': 'myid' };
        var component = toOpenAPIComponent( schema );
        expect( component ).to.be.eql({ type: 'string' });
    });

    it( 'does not modify an object schema with no unsupported properties', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string' }
            }
        };
        var component = toOpenAPIComponent( schema );
        expect( component ).to.eql( schema );
    });

    it( 'removes non-supported openAPI properties from properties of object schema', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string', '$id': 'myid' }
            }
        };
        var component = toOpenAPIComponent( schema );
        expect( component ).to.eql({
            type: 'object',
            properties: {
                name: { type: 'string' }
            }
        });
    });

    it( 'adds URI ref for openAPI sub-schema objects within an object', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string', '$id': 'myid' },
                address: { type: 'object', '$id': 'addressId' }
            }
        };
        var component = toOpenAPIComponent( schema );
        expect( component ).to.eql({
            type: 'object',
            properties: {
                name: { type: 'string' },
                address: { oneOf: [ { type: 'object' }, { type: 'string', format: 'uri' } ] }
            }
        });
    });

    it( 'adds URI ref for openAPI sub-schema arrays within an object', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string', '$id': 'myid' },
                addresses: { type: 'array', items: { type: 'object', '$id': 'addressList' } }
            }
        };
        var component = toOpenAPIComponent( schema );
        expect( component ).to.eql({
            type: 'object',
            properties: {
                name: { type: 'string' },
                addresses: { type: 'array', items: { oneOf: [ { type: 'object' }, { type: 'string', format: 'uri' } ] } }
            }
        });
    });

    it( 'does not modify an array schema with no unsupported properties', function() {
        var schema = {
            type: 'array',
            items: [
                { type: 'string' }
            ]
        };
        var component = toOpenAPIComponent( schema );
        expect( component ).to.eql( schema );
    });

    it( 'removes non-supported openAPI properties from properties of array schema', function() {
        var schema = {
            type: 'array',
            items: [
                { type: 'string', '$id': 'myid' }
            ]
        };
        var component = toOpenAPIComponent( schema );
        expect( component ).to.eql({
            type: 'array',
            items: [
                { type: 'string' }
            ]
        });
    });

    it( 'adds URI ref for openAPI sub-schema objects within an array', function() {
        var schema = {
            type: 'array',
            items: { type: 'object', '$id': 'addressList' }
        };
        var component = toOpenAPIComponent( schema );
        expect( component ).to.eql({
            type: 'array',
            items: {
                oneOf: [ { type: 'object' }, { type: 'string', format: 'uri' } ]
            }
        });
    });
});
