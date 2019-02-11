'use strict';

var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var require_helper = require( '../require_helper' );
var pathGenerator = require_helper( 'pathGenerator', true );

var JSONSchemaPathGenerator = pathGenerator.__get__( 'JSONSchemaPathGenerator' );

describe( 'JSONSchemaPathGenerator', function() {
    describe( 'constructor', function() {
        it( 'requires an apiDoc', function() {
            var cons = function() { new JSONSchemaPathGenerator(); };
            expect( cons ).to.throw( 'apiDoc object is required' );
        });

        it( 'requires a controller', function() {
            var cons = function() { new JSONSchemaPathGenerator({}); };
            expect( cons ).to.throw( 'controller name is required' );
        });

        it( 'saves apiDoc and controller and baseUrl in the instance', function() {
            var apiDoc = { testDoc: 'doc' };
            var controller = 'testController';
            var inst = new JSONSchemaPathGenerator( apiDoc, controller );
            expect( inst.controller ).to.eql( controller );
            expect( inst.apiDoc ).to.eql( apiDoc );
            expect( inst.apiDoc ).to.eql({ testDoc: 'doc', paths: {}, components: { schemas: {} } });
            expect( inst.baseUrl ).to.eql( '' );
            expect( inst.namespace ).to.eql( '' );
        });

        it( 'preserves existing values in apiDoc', function() {
            var apiDoc = { 'testDoc': 'doc', paths: { '/test': {} }, components: { 'a': 'b', schemas: { 'c': 'd' } } };
            var controller = 'testController';
            var inst = new JSONSchemaPathGenerator( apiDoc, controller );
            expect( inst.controller ).to.eql( controller );
            expect( inst.apiDoc ).to.eql( apiDoc );
            expect( inst.apiDoc ).to.eql({ 'testDoc': 'doc', paths: { '/test': {} }, components: { 'a': 'b', schemas: { 'c': 'd' } } });
        });

        it( 'uses provided baseUrl', function() {
            var apiDoc = { 'testDoc': 'doc' };
            var controller = 'testController';
            var inst = new JSONSchemaPathGenerator( apiDoc, controller, '/boo/urns' );
            expect( inst.baseUrl ).to.eql( '/boo/urns' );
            expect( inst.namespace ).to.eql( '.boo.urns' );
        });
    });

    describe( 'addObjectDefinition', function() {
        beforeEach( function() {
            this.inst = new JSONSchemaPathGenerator({}, 'testController' );
        });
        it( 'requires schema to have a title', function() {
            expect( this.inst.addObjectDefinition.bind( this.inst, {}, {}) ).to.throw( 'Missing title in schema' );
        });
        it( 'rejects duplicate schemas is not allowed', function() {
            var schema = {
                title: 'testSchema'
            };
            this.inst.addObjectDefinition({}, schema );
            expect( this.inst.addObjectDefinition.bind( this.inst, {}, schema ) ).to.throw( 'Duplicate schema with title testSchema' );
        });
        it( 'adds schema definition to the apiDoc', function() {
            var schema = {
                title: 'testSchema',
                properties: {
                    testProperty: { type: 'string' }
                }
            };
            this.inst.addObjectDefinition({}, schema );
            expect( this.inst.apiDoc.components.schemas.testSchema ).to.eql({
                title: 'testSchema',
                properties: {
                    testProperty: { type: 'string' }
                }
            });
        });
        it( 'adds namespaced schema definition to the apiDoc', function() {
            var schema = {
                title: 'testSchema',
                properties: {
                    testProperty: { type: 'string' }
                }
            };
            this.inst.namespace = 'test1';
            this.inst.addObjectDefinition({}, schema );
            expect( this.inst.apiDoc.components.schemas[ 'test1::testSchema' ] ).to.eql({
                title: 'testSchema',
                properties: {
                    testProperty: { type: 'string' }
                }
            });
        });
        it( 'converts JSONSchema to OpenAPI', function() {
            var schema = {
                title: 'testSchema',
                properties: {
                    testProperty: { type: 'string', '$id': 'myid' }
                }
            };
            this.inst.addObjectDefinition({}, schema );
            expect( this.inst.apiDoc.components.schemas.testSchema ).to.eql({
                title: 'testSchema',
                properties: {
                    testProperty: { type: 'string' }
                }
            });
        });
        it( 'adds URI ref for OpenAPI sub-schema objects', function() {
            var schema = {
                title: 'testSchema',
                properties: {
                    testProperty: { type: 'string', '$id': 'myid' },
                    address: { type: 'object', '$id': 'addressId' }
                }
            };
            this.inst.addObjectDefinition({}, schema );
            expect( this.inst.apiDoc.components.schemas.testSchema ).to.eql({
                title: 'testSchema',
                properties: {
                    testProperty: { type: 'string' },
                    address: { oneOf: [ { type: 'object' }, { type: 'string', format: 'uri' } ] }
                }
            });
        });
    });

    describe( 'addObjectPath', function() {
        beforeEach( function() {
            this.inst = new JSONSchemaPathGenerator({}, 'testController' );
        });
        it( 'requires a controller name', function() {
            expect( this.inst.addObjectPath.bind( this.inst, {}, { title: 'testSchema' }) ).to.throw(
                'Schema testSchema is missing exegesis-plugin-jsonschema-controller' );
        });
        it( 'uses provided path', function() {
            this.inst.addObjectPath({ urlPath: '/foo/bar' }, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/foo/bar'] ).to.be.an( 'object' );
            expect( this.inst.apiDoc.paths['/foo/bar']['x-exegesis-jsonschema-pathbase'] ).to.eql( '' );
            expect( this.inst.apiDoc.paths['/foo/bar']['x-exegesis-jsonschema-pathtemplate'] ).to.eql( '/foo/bar' );
        });
        it( 'includes baseUrl', function() {
            this.inst.baseUrl = '/api';
            this.inst.addObjectPath({ urlPath: '/foo/bar' }, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/api/foo/bar'] ).to.be.an( 'object' );
            expect( this.inst.apiDoc.paths['/api/foo/bar']['x-exegesis-jsonschema-pathbase'] ).to.eql( '/api' );
            expect( this.inst.apiDoc.paths['/api/foo/bar']['x-exegesis-jsonschema-pathtemplate'] ).to.eql( '/foo/bar' );
        });
        it( 'does not allow duplicate paths', function() {
            var context = { urlPath: '/foo/bar' };
            var schema = { title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' };
            this.inst.addObjectPath( context, schema );
            expect( this.inst.addObjectPath.bind( this.inst, context, schema ) ).to.throw(
                'Duplicate path /foo/bar found for schema testSchema' );
        });
        it( 'uses root path if none is provided', function() {
            this.inst.addObjectPath({}, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'] ).to.be.an( 'object' );
        });
        it( 'applies the plugin controller properties', function() {
            this.inst.addObjectPath({}, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/']['x-exegesis-controller'] ).to.eql( this.inst.controller );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-jsonschema-controller'] ).to.eql( 'schemaController' );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-jsonschema-blankobject'] ).to.eql( 'null' );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-jsonschema-pathtemplate'] ).to.eql( '/' );
        });
        it( 'applies the blank object property', function() {
            var schema = {
                title: 'testSchema',
                'exegesis-plugin-jsonschema-controller': 'schemaController',
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
            this.inst.addObjectPath({}, schema );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-controller'] ).to.eql( this.inst.controller );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-jsonschema-controller'] ).to.eql( 'schemaController' );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-jsonschema-blankobject'] ).to.eql( JSON.stringify({
                name: 'Jane Doe',
                address: { street: null, city: null }
            }) );
        });
        it( 'adds the GET method', function() {
            this.inst.addObjectPath({}, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'].get ).to.eql({
                summary: 'Gets a single testSchema',
                operationId: 'getItem /',
                parameters: [],
                responses: {
                    200: {
                        description: 'The testSchema',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/testSchema'
                                }
                            }
                        }
                    }
                }
            });
        });
        it( 'adds the PATCH method', function() {
            this.inst.addObjectPath({}, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'].patch ).to.eql({
                summary: 'Modify a testSchema',
                operationId: 'patchItem /',
                parameters: [],
                requestBody: {
                    description: 'The modified testSchema values',
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/testSchema'
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'The modified testSchema',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/testSchema'
                                }
                            }
                        }
                    }
                }
            });
        });
        it( 'adds the PUT method', function() {
            this.inst.addObjectPath({}, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'].put ).to.eql({
                summary: 'Replace a testSchema',
                operationId: 'putItem /',
                parameters: [],
                requestBody: {
                    description: 'The new testSchema to replace this one',
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/testSchema'
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'The replaced testSchema',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/testSchema'
                                }
                            }
                        }
                    }
                }
            });
        });
        it( 'adds the DELETE method', function() {
            this.inst.addObjectPath({}, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'].delete ).to.eql({
                summary: 'Delete a testSchema',
                operationId: 'deleteItem /',
                parameters: [],
                responses: {
                    204: {
                        description: 'No content'
                    }
                }
            });
        });
        it( 'does not add the DELETE method for readOnly schemas', function() {
            this.inst.addObjectPath({}, {
                readOnly: true, title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'].delete ).to.not.exist;
        });
        it( 'adds the path parameters from the context to each method', function() {
            this.inst.addObjectPath({ pathParams: [ { 'in': 'path', name: 'test1' }, { 'in': 'path', name: 'test2' } ] }, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'].get.parameters ).to.eql(
                [ { 'in': 'path', name: 'test1' }, { 'in': 'path', name: 'test2' } ] );
            expect( this.inst.apiDoc.paths['/'].patch.parameters ).to.eql(
                [ { 'in': 'path', name: 'test1' }, { 'in': 'path', name: 'test2' } ] );
            expect( this.inst.apiDoc.paths['/'].put.parameters ).to.eql(
                [ { 'in': 'path', name: 'test1' }, { 'in': 'path', name: 'test2' } ] );
            expect( this.inst.apiDoc.paths['/'].delete.parameters ).to.eql(
                [ { 'in': 'path', name: 'test1' }, { 'in': 'path', name: 'test2' } ] );
        });
    });

    describe( 'addCollectionPath', function() {
        beforeEach( function() {
            this.inst = new JSONSchemaPathGenerator({}, 'testController' );
        });
        it( 'requires a controller name', function() {
            expect( this.inst.addCollectionPath.bind( this.inst, {}, { title: 'testSchema' }) ).to.throw(
                'Schema testSchema is missing exegesis-plugin-jsonschema-controller' );
        });
        it( 'uses provided path', function() {
            this.inst.addCollectionPath({ urlPath: '/foo/bar' }, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/foo/bar'] ).to.be.an( 'object' );
            expect( this.inst.apiDoc.paths['/foo/bar']['x-exegesis-jsonschema-pathbase'] ).to.eql( '' );
            expect( this.inst.apiDoc.paths['/foo/bar']['x-exegesis-jsonschema-pathtemplate'] ).to.eql( '/foo/bar' );
        });
        it( 'includes baseUrl', function() {
            this.inst.baseUrl = '/api';
            this.inst.addCollectionPath({ urlPath: '/foo/bar' }, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/api/foo/bar'] ).to.be.an( 'object' );
            expect( this.inst.apiDoc.paths['/api/foo/bar']['x-exegesis-jsonschema-pathbase'] ).to.eql( '/api' );
            expect( this.inst.apiDoc.paths['/api/foo/bar']['x-exegesis-jsonschema-pathtemplate'] ).to.eql( '/foo/bar' );
        });
        it( 'does not allow duplicate paths', function() {
            var context = { urlPath: '/foo/bar' };
            var schema = { title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' };
            this.inst.addCollectionPath( context, schema );
            expect( this.inst.addCollectionPath.bind( this.inst, context, schema ) ).to.throw(
                'Duplicate path /foo/bar found for schema testSchema' );
        });
        it( 'uses root path if none is provided', function() {
            this.inst.addCollectionPath({}, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'] ).to.be.an( 'object' );
        });
        it( 'applies the plugin controller properties', function() {
            this.inst.addCollectionPath({}, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/']['x-exegesis-controller'] ).to.eql( this.inst.controller );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-jsonschema-controller'] ).to.eql( 'schemaController' );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-jsonschema-blankobject'] ).to.eql( 'null' );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-jsonschema-pathtemplate'] ).to.eql( '/' );
        });
        it( 'applies the blank object property', function() {
            var schema = {
                title: 'testSchema',
                'exegesis-plugin-jsonschema-controller': 'schemaController',
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
            this.inst.addCollectionPath({}, schema );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-controller'] ).to.eql( this.inst.controller );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-jsonschema-controller'] ).to.eql( 'schemaController' );
            expect( this.inst.apiDoc.paths['/']['x-exegesis-jsonschema-blankobject'] ).to.eql( JSON.stringify({
                name: 'Jane Doe',
                address: { street: null, city: null }
            }) );
        });
        it( 'adds the GET method', function() {
            this.inst.addCollectionPath({}, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'].get ).to.eql({
                summary: 'Gets a list of testSchema',
                operationId: 'getItems /',
                parameters: [],
                responses: {
                    200: {
                        description: 'The list of testSchema',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/testSchema'
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });
        it( 'adds the POST method', function() {
            this.inst.addCollectionPath({}, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'].post ).to.eql({
                summary: 'Create a new testSchema',
                operationId: 'postItems /',
                parameters: [],
                requestBody: {
                    description: 'The new testSchema to be created',
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/testSchema'
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'The new testSchema',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/testSchema'
                                }
                            }
                        }
                    }
                }
            });
        });
        it( 'does not add the POST method for readOnly schemas', function() {
            this.inst.addCollectionPath({}, {
                readOnly: true, title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'].post ).to.not.exist;
        });
        it( 'adds the path parameters from the context to each method', function() {
            this.inst.addCollectionPath({ pathParams: [ { 'in': 'path', name: 'test1' }, { 'in': 'path', name: 'test2' } ] }, {
                title: 'testSchema', 'exegesis-plugin-jsonschema-controller': 'schemaController' });
            expect( this.inst.apiDoc.paths['/'].get.parameters ).to.eql(
                [ { 'in': 'path', name: 'test1' }, { 'in': 'path', name: 'test2' } ] );
            expect( this.inst.apiDoc.paths['/'].post.parameters ).to.eql(
                [ { 'in': 'path', name: 'test1' }, { 'in': 'path', name: 'test2' } ] );
        });
    });

    describe( 'processSchema', function() {
        beforeEach( function() {
            this.inst = new JSONSchemaPathGenerator({}, 'testController' );
            this.inst.addCollectionPath = sinon.stub();
            this.inst.addObjectPath = sinon.stub();
            this.inst.addObjectDefinition = sinon.stub();
        });

        it( 'does not add collection path for the root schema', function() {
            this.inst.processSchema({}, {
                $id: '/foo'
            }, true, true );
            expect( this.inst.addCollectionPath.called ).to.be.false;
            expect( this.inst.addObjectDefinition.called ).to.be.true;
            expect( this.inst.addObjectDefinition.firstCall.args ).to.eql( [ { urlPath: '/{pathParam0}', pathParams: [ {
                'in': 'path',
                name: `pathParam0`,
                schema: { type: 'integer' },
                required: true,
                description: `ID for item`
            } ] }, { $id: '/foo' } ] );
            expect( this.inst.addObjectPath.calledOnce ).to.be.true;
            expect( this.inst.addObjectPath.firstCall.args ).to.eql( [ { urlPath: '/{pathParam0}', pathParams: [ {
                'in': 'path',
                name: `pathParam0`,
                schema: { type: 'integer' },
                required: true,
                description: `ID for item`
            } ] }, { $id: '/foo' } ] );
        });

        it( 'adds collection path for the non-root schema', function() {
            this.inst.processSchema({ urlPath: '/foo' }, { title: 'testSchema', '$id': '/foo' }, true, false );
            expect( this.inst.addCollectionPath.calledOnce ).to.be.true;
            expect( this.inst.addCollectionPath.firstCall.args ).to.eql( [ { urlPath: '/foo' }, { title: 'testSchema', $id: '/foo' } ] );
            expect( this.inst.addObjectDefinition.calledOnce ).to.be.true;
            expect( this.inst.addObjectDefinition.firstCall.args ).to.eql( [ { urlPath: '/foo/{pathParam0}', pathParams: [ {
                'in': 'path',
                name: `pathParam0`,
                schema: { type: 'integer' },
                required: true,
                description: `ID for testSchema`
            } ] }, { title: 'testSchema', $id: '/foo' } ] );
            expect( this.inst.addObjectPath.calledOnce ).to.be.true;
            expect( this.inst.addObjectPath.firstCall.args ).to.eql( [ { urlPath: '/foo/{pathParam0}', pathParams: [ {
                'in': 'path',
                name: `pathParam0`,
                schema: { type: 'integer' },
                required: true,
                description: `ID for testSchema`
            } ] }, { title: 'testSchema', $id: '/foo' } ] );
        });

        it( 'does not add object path or definition for the root schema', function() {
            this.inst.processSchema({}, {
                '$id': '/foo'
            }, false, true );
            expect( this.inst.addCollectionPath.called ).to.be.false;
            expect( this.inst.addObjectDefinition.called ).to.be.false;
            expect( this.inst.addObjectPath.called ).to.be.false;
        });

        it( 'adds object path but not definition for non-root schema without $id', function() {
            this.inst.processSchema({ urlPath: '/foo' }, { title: 'testSchema' }, false, false );
            expect( this.inst.addCollectionPath.called ).to.be.false;
            expect( this.inst.addObjectDefinition.called ).to.be.false;
            expect( this.inst.addObjectPath.calledOnce ).to.be.true;
            expect( this.inst.addObjectPath.firstCall.args ).to.eql( [ {
                urlPath: '/foo'
            }, {
                title: 'testSchema'
            } ] );
        });

        it( 'adds object path and definition for non-root schema with $id', function() {
            this.inst.processSchema({ urlPath: '/foo' }, { title: 'testSchema', '$id': '/foobar' }, false, false );
            expect( this.inst.addCollectionPath.called ).to.be.false;
            expect( this.inst.addObjectDefinition.calledOnce ).to.be.true;
            expect( this.inst.addObjectDefinition.firstCall.args ).to.eql( [ {
                urlPath: '/foo'
            }, {
                title: 'testSchema', '$id': '/foobar'
            } ] );
            expect( this.inst.addObjectPath.calledOnce ).to.be.true;
            expect( this.inst.addObjectPath.firstCall.args ).to.eql( [ {
                urlPath: '/foo'
            }, {
                title: 'testSchema', '$id': '/foobar'
            } ] );
        });

        it( 'does not add path for properties without $id', function() {
            var context = { urlPath: '/foo' };
            var schema = {
                title: 'testSchema',
                properties: {
                    'arrayProperty': {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                test: { type: 'string' }
                            }
                        }
                    },
                    'objectProperty': {
                        type: 'object',
                        properties: {
                            test: { type: 'string' }
                        }
                    }
                }
            };
            this.inst.processSchema( Object.assign({}, context ), Object.assign({}, schema ), false, false );
            expect( this.inst.addCollectionPath.called ).to.be.false;
            expect( this.inst.addObjectDefinition.called ).to.be.false;
            expect( this.inst.addObjectPath.calledOnce ).to.be.true;
            expect( this.inst.addObjectPath.firstCall.args ).to.eql( [ context, schema ] );
        });

        it( 'adds path for collection for array properties with $id', function() {
            var context = { urlPath: '/foo' };
            var schema = {
                title: 'testSchema',
                properties: {
                    'arrayProperty': {
                        type: 'array',
                        items: {
                            type: 'object',
                            $id: '/test1',
                            title: 'subcollection',
                            properties: {
                                test: { type: 'string' }
                            }
                        }
                    },
                    'objectProperty': {
                        type: 'object',
                        properties: {
                            test: { type: 'string' }
                        }
                    }
                }
            };
            this.inst.processSchema( Object.assign({}, context ), Object.assign({}, schema ), false, false );
            expect( this.inst.addCollectionPath.calledOnce ).to.be.true;
            expect( this.inst.addCollectionPath.firstCall.args ).to.eql( [ {
                urlPath: '/foo/arrayProperty'
            }, schema.properties.arrayProperty.items ] );
            expect( this.inst.addObjectDefinition.calledOnce ).to.be.true;
            expect( this.inst.addObjectDefinition.firstCall.args ).to.eql( [ {
                urlPath: '/foo/arrayProperty/{pathParam0}',
                pathParams: [ {
                    'in': 'path',
                    name: `pathParam0`,
                    schema: { type: 'integer' },
                    required: true,
                    description: `ID for subcollection`
                } ]
            }, schema.properties.arrayProperty.items ] );
            expect( this.inst.addObjectPath.callCount ).to.eql( 2 );
            expect( this.inst.addObjectPath.firstCall.args ).to.eql( [ context, schema ] );
            expect( this.inst.addObjectPath.secondCall.args ).to.eql( [ {
                urlPath: '/foo/arrayProperty/{pathParam0}',
                pathParams: [ {
                    'in': 'path',
                    name: `pathParam0`,
                    schema: { type: 'integer' },
                    required: true,
                    description: `ID for subcollection`
                } ]
            }, schema.properties.arrayProperty.items ] );
        });

        it( 'adds path for object nested within array items with $id', function() {
            var context = { urlPath: '/foo' };
            var schema = {
                title: 'testSchema',
                properties: {
                    'arrayProperty': {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                nestedObjectProperty: {
                                    type: 'object',
                                    $id: '/test1',
                                    title: 'subcollection',
                                    properties: {
                                        test: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    'objectProperty': {
                        type: 'object',
                        properties: {
                            test: { type: 'string' }
                        }
                    }
                }
            };
            this.inst.processSchema( Object.assign({}, context ), Object.assign({}, schema ), false, false );
            expect( this.inst.addCollectionPath.called ).to.be.false;
            expect( this.inst.addObjectDefinition.calledOnce ).to.be.true;
            expect( this.inst.addObjectDefinition.firstCall.args ).to.eql( [ {
                urlPath: '/foo/arrayProperty/{pathParam0}/nestedObjectProperty',
                pathParams: [ {
                    'in': 'path',
                    name: `pathParam0`,
                    schema: { type: 'integer' },
                    required: true,
                    description: `ID for item`
                } ]
            }, schema.properties.arrayProperty.items.properties.nestedObjectProperty ] );
            expect( this.inst.addObjectPath.callCount ).to.eql( 2 );
            expect( this.inst.addObjectPath.firstCall.args ).to.eql( [ context, schema ] );
            expect( this.inst.addObjectPath.secondCall.args ).to.eql( [ {
                urlPath: '/foo/arrayProperty/{pathParam0}/nestedObjectProperty',
                pathParams: [ {
                    'in': 'path',
                    name: `pathParam0`,
                    schema: { type: 'integer' },
                    required: true,
                    description: `ID for item`
                } ]
            }, schema.properties.arrayProperty.items.properties.nestedObjectProperty ] );
        });

        it( 'adds path for object properties with $id', function() {
            var context = { urlPath: '/foo' };
            var schema = {
                title: 'testSchema',
                properties: {
                    'arrayProperty': {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                test: { type: 'string' }
                            }
                        }
                    },
                    'objectProperty': {
                        type: 'object',
                        $id: '/myobject',
                        title: 'subobject',
                        properties: {
                            test: { type: 'string' }
                        }
                    }
                }
            };
            this.inst.processSchema( Object.assign({}, context ), Object.assign({}, schema ), false, false );
            expect( this.inst.addCollectionPath.called ).to.be.false;
            expect( this.inst.addObjectDefinition.calledOnce ).to.be.true;
            expect( this.inst.addObjectDefinition.firstCall.args ).to.eql( [ {
                urlPath: '/foo/objectProperty'
            }, schema.properties.objectProperty ] );

            expect( this.inst.addObjectPath.callCount ).to.eql( 2 );
            expect( this.inst.addObjectPath.firstCall.args ).to.eql( [ context, schema ] );
            expect( this.inst.addObjectPath.secondCall.args ).to.eql( [ {
                urlPath: '/foo/objectProperty'
            }, schema.properties.objectProperty ] );
        });

        it( 'adds path for object properties with nested object properties with $id', function() {
            var context = { urlPath: '/foo' };
            var schema = {
                title: 'testSchema',
                properties: {
                    arrayProperty: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                test: { type: 'string' }
                            }
                        }
                    },
                    objectProperty: {
                        type: 'object',
                        properties: {
                            nestedObjectProperty: {
                                type: 'object',
                                $id: '/myobject',
                                title: 'subobject',
                                properties: {
                                    test: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            };
            this.inst.processSchema( Object.assign({}, context ), Object.assign({}, schema ), false, false );
            expect( this.inst.addCollectionPath.called ).to.be.false;
            expect( this.inst.addObjectDefinition.calledOnce ).to.be.true;
            expect( this.inst.addObjectDefinition.firstCall.args ).to.eql( [ {
                urlPath: '/foo/objectProperty/nestedObjectProperty'
            }, schema.properties.objectProperty.properties.nestedObjectProperty ] );

            expect( this.inst.addObjectPath.callCount ).to.eql( 2 );
            expect( this.inst.addObjectPath.firstCall.args ).to.eql( [ context, schema ] );
            expect( this.inst.addObjectPath.secondCall.args ).to.eql( [ {
                urlPath: '/foo/objectProperty/nestedObjectProperty'
            }, schema.properties.objectProperty.properties.nestedObjectProperty ] );
        });
    });
});

describe( 'pathGenerator', function() {
    beforeEach( function() {
        var self = this;
        this.JSONSchemaPathGenerator = class StubPathGenerator {
            constructor() {
                this.args = Array.prototype.slice.call( arguments );
                self.inst = this;
                this.processSchema = sinon.stub();
            }
        };
        this.restorePathGenerator = pathGenerator.__set__( 'JSONSchemaPathGenerator', this.JSONSchemaPathGenerator );
    });
    afterEach( function() {
        this.restorePathGenerator();
    });

    it( 'should check that root schema has valid type', function() {
        var apiDoc = { a: 'a' };
        var controller = { b: 'b' };
        var schema = { type: 'array', properties: {} };
        expect( pathGenerator.bind( null, apiDoc, controller, schema ) ).to.throw( 'Root schema must have object type and have properties' );
        expect( this.inst ).to.not.exist;
    });

    it( 'should check that root schema has properties', function() {
        var apiDoc = { a: 'a' };
        var controller = { b: 'b' };
        var schema = { type: 'object' };
        expect( pathGenerator.bind( null, apiDoc, controller, schema ) ).to.throw( 'Root schema must have object type and have properties' );
        expect( this.inst ).to.not.exist;
    });

    it( 'should use provided parameters', function() {
        var apiDoc = { a: 'a' };
        var controller = { b: 'b' };
        var schema = { type: 'object', properties: {} };
        pathGenerator( apiDoc, controller, schema, '/boo/urns' );
        expect( this.inst.args ).to.eql( [ apiDoc, controller, '/boo/urns' ] );
        expect( this.inst.processSchema.calledOnce ).to.be.true;
        expect( this.inst.processSchema.firstCall.args ).to.eql(
            [ { urlPath: '', pathParams: [] }, schema, false, true ]
        );
    });
});
