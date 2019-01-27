'use strict';

var expect = require( 'chai' ).expect;
var require_helper = require( '../require_helper' );
var index = require_helper( 'index' );

describe( 'Schema option', function() {
    it( 'creates a default schema as an empty array', function() {
        var plugin = index({});
        expect( plugin.options.schema ).to.eql( [] );
    });

    it( 'creates an array if schema is not an array', function() {
        var plugin = index({ schema: {} });
        expect( plugin.options.schema ).to.eql( [ {} ] );
    });

    it( 'can add a new schema to the list with no baseUrl', async function() {
        var plugin = index();
        expect( plugin.options.schema ).to.eql( [] );
        await plugin.addSchema({});
        expect( plugin.options.schema ).to.eql( [ { baseUrl: '', schema: {} } ] );
    });

    it( 'can add a new schema to the list with a baseUrl', async function() {
        var plugin = index();
        expect( plugin.options.schema ).to.eql( [] );
        await plugin.addSchema({}, '/test/api/base' );
        expect( plugin.options.schema ).to.eql( [ { baseUrl: '/test/api/base', schema: {} } ] );
    });
});

describe( 'JSONSchemaPlugin', function() {
    describe( 'openapi version check', function() {
        before( function() {
            this.plugin = index({});
        });
        it( 'throws an error if there is no openapi', function() {
            expect( this.plugin.makeExegesisPlugin.bind(
                this.plugin, {
                    apiDoc: {
                    }
                }) ).to.throw( "OpenAPI definition is missing 'openapi' field" );
        });
        it( 'throws an error if openapi is too low', function() {
            expect( this.plugin.makeExegesisPlugin.bind(
                this.plugin, {
                    apiDoc: {
                        openapi: '2.0.0'
                    }
                }) ).to.throw( 'OpenAPI version 2.0.0 not supported' );
        });
        it( 'throws an error if openapi is too high', function() {
            expect( this.plugin.makeExegesisPlugin.bind(
                this.plugin, {
                    apiDoc: {
                        openapi: '4.0.0'
                    }
                }) ).to.throw( 'OpenAPI version 4.0.0 not supported' );
        });
    });

    describe( 'preCompile', function() {
        before( function() {
            this.plugin = index({});
        });
        it( 'adds controllers when options have no controllers included', function() {
            var instance = this.plugin.makeExegesisPlugin({
                apiDoc: {
                    openapi: '3.0.0'
                }
            });
            var params = {
                api: {},
                options: {}
            };
            instance.preCompile( params );
            expect( params.options ).to.have.property( 'controllers' );
            expect( params.options.controllers ).to.have.property( instance.controller.name );
            expect( params.options.controllers[instance.controller.name] ).to.eql( instance.controller );
            expect( instance.controller._controllers ).to.eql( params.options.controllers );
        });
        it( 'adds controllers to existing set of controllers', function() {
            var instance = this.plugin.makeExegesisPlugin({
                apiDoc: {
                    openapi: '3.0.0'
                }
            });
            var params = {
                api: {},
                options: {
                    controllers: {
                        testController: {}
                    }
                }
            };
            instance.preCompile( params );
            expect( params.options ).to.have.property( 'controllers' );
            expect( params.options.controllers ).to.have.property( instance.controller.name );
            expect( params.options.controllers[instance.controller.name] ).to.eql( instance.controller );
            expect( instance.controller._controllers ).to.eql( params.options.controllers );
            expect( params.options.controllers ).to.have.property( 'testController' );
            expect( params.options.controllers.testController ).to.eql({});
        });
        it( 'does not overrite existing controllers', function() {
            var instance = this.plugin.makeExegesisPlugin({
                apiDoc: {
                    openapi: '3.0.0'
                }
            });
            var params = {
                api: {},
                options: {
                    controllers: {}
                }
            };
            params.options.controllers[instance.controller.name] = {};

            expect( instance.preCompile.bind( instance, params ) ).to.throw( 'Controller already added' );

            expect( params.options ).to.have.property( 'controllers' );
            expect( params.options.controllers ).to.have.property( instance.controller.name );
            expect( params.options.controllers[instance.controller.name] ).to.not.eql( instance.controller );
            expect( instance.controller._controllers ).to.not.eql( params.options.controllers );
        });
    });
});
