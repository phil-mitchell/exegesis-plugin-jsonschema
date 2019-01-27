'use strict';

var expect = require( 'chai' ).expect;
var require_helper = require( '../require_helper' );
var blankObject = require_helper( 'blankObject' );

describe( 'Blank Objects', function() {
    it( 'returns null for empty schemas', function() {
        var schema = {};
        var blank = blankObject( schema );
        expect( blank ).to.be.null;
    });

    it( 'returns null for scalar schemas with no defaults', function() {
        var schema = { type: 'string' };
        var blank = blankObject( schema );
        expect( blank ).to.be.null;
    });

    it( 'returns default for scalar schemas with no defaults', function() {
        var schema = { type: 'string', 'default': 'Test1234' };
        var blank = blankObject( schema );
        expect( blank ).to.eql( 'Test1234' );
    });

    it( 'returns an empty object for object schema with no properties', function() {
        var schema = {
            type: 'object'
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql({});
    });

    it( 'returns an object with only all properties for object schema', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string' },
                address: { type: 'string' }
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql({
            name: null,
            address: null
        });
    });

    it( 'applies default values in objects', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string', 'default': 'Jane Doe' },
                address: { type: 'string' }
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql({
            name: 'Jane Doe',
            address: null
        });
    });

    it( 'constructs nested objects', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string', 'default': 'Jane Doe' },
                address: {
                    type: 'object',
                    properties: {
                        street: { type: 'string' },
                        city: { type: 'string' }
                    }
                }
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql({
            name: 'Jane Doe',
            address: {
                city: null,
                street: null
            }
        });
    });

    it( 'applies defaults to nested objects', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string', 'default': 'Jane Doe' },
                address: {
                    type: 'object',
                    properties: {
                        street: { type: 'string' },
                        city: { type: 'string', 'default': 'Waterloo' }
                    }
                }
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql({
            name: 'Jane Doe',
            address: {
                city: 'Waterloo',
                street: null
            }
        });
    });

    it( 'applies defaults for object type and overrites with property defaults', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string', 'default': 'Jane Doe' },
                address: {
                    type: 'object',
                    'default': {
                        silly: 'putty',
                        street: '123 Fake Street',
                        city: 'Springfield'
                    },
                    properties: {
                        street: { type: 'string' },
                        city: { type: 'string', 'default': 'Waterloo' }
                    }
                }
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql({
            name: 'Jane Doe',
            address: {
                silly: 'putty',
                city: 'Waterloo',
                street: '123 Fake Street'
            }
        });
    });

    it( 'excludes object property with $id', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string' },
                address: {
                    '$id': 'objid',
                    type: 'object',
                    properties: {
                        street: { type: 'string' },
                        city: { type: 'string', 'default': 'Waterloo' }
                    }
                }
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql({
            name: null
        });
    });

    it( 'excludes array property with $id', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string' },
                addresses: {
                    type: 'array',
                    items: {
                        '$id': 'objid'
                    }
                }
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql({
            name: null
        });
    });

    it( 'excludes read-only properties', function() {
        var schema = {
            type: 'object',
            properties: {
                name: { type: 'string' },
                updated: { type: 'string', readOnly: true }
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql({
            name: null
        });
    });

    it( 'returns an empty array for array schema with no items', function() {
        var schema = {
            type: 'array'
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql( [] );
    });

    it( 'returns an empty array for array schema with scalar items', function() {
        var schema = {
            type: 'array',
            items: {
                type: 'string'
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql( [] );
    });

    it( 'returns an empty array for array schema with object items', function() {
        var schema = {
            type: 'array',
            items: {
                type: 'object'
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql( [] );
    });

    it( 'returns an empty array for array schema with array items', function() {
        var schema = {
            type: 'array',
            items: {
                type: 'array'
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql( [] );
    });

    it( 'applies defaults to arrays', function() {
        var schema = {
            type: 'array',
            'default': [ { name: 'Jane Doe' } ],
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            }
        };
        var blank = blankObject( schema );
        expect( blank ).to.eql( [ { name: 'Jane Doe' } ] );
    });
});
