'use strict';

const controllerBaseName = 'exegesis-plugin-jsonschema-';
var count = 0;

module.exports = class JSONSchemaController {
    constructor() {
        this._controllers = null;
        this._name = controllerBaseName + count++;
    }

    get name() {
        return this._name;
    }

    set controllers( value ) {
        if( this._controllers ) {
            throw new Error( 'Controller was already initialized' );
        }
        this._controllers = value;
    }

    resolvePath( reqContext ) {
        reqContext.requestObjectPath = ( reqContext.api.pathItemObject['x-exegesis-jsonschema-pathtemplate'] || '' ).split( '/' ).map( item => {
            var match = item.match( /^\{(.*)\}$/ );
            if( match ) {
                return reqContext.params.path[match[1]];
            }
            return item;
        });
    }

    getController( reqContext, operation ) {
        if( !this._controllers ) {
            throw reqContext.makeError( 500, 'JSONSchemaController controllers have not been initialized' );
        }

        var controllerName = reqContext.api.operationObject['x-exegesis-jsonschema-controller'] ||
            reqContext.api.pathItemObject['x-exegesis-jsonschema-controller'];

        var controller = this._controllers[controllerName];

        if( !controller ) {
            throw reqContext.makeError( 400, `${controllerName} controller not implemented` );
        }

        if( typeof( controller[operation] ) !== 'function' ) {
            throw reqContext.makeError( 400, `${operation} not implemented in ${controllerName} controller` );
        }

        if( typeof( controller.formatResponse ) !== 'function' ) {
            throw reqContext.makeError( 400, `formatResponse not implemented in ${controllerName} controller` );
        }

        return controller;
    }

    getBlankObject( reqContext ) {
        return JSON.parse( reqContext.api.operationObject['x-exegesis-jsonschema-blankobject'] ||
                           reqContext.api.pathItemObject['x-exegesis-jsonschema-blankobject'] || '{}' );
    }

    async getItem( reqContext ) {
        var controller = this.getController( reqContext, 'get' );
        this.resolvePath( reqContext );
        var item = await controller.get( reqContext );

        if( !item ) {
            throw reqContext.makeError( 404, 'Not found' );
        }

        return controller.formatResponse( reqContext, item );
    }

    async patchItem( reqContext ) {
        var controller = this.getController( reqContext, 'update' );
        this.resolvePath( reqContext );
        var item = await controller.update( reqContext );

        if( !item ) {
            throw reqContext.makeError( 404, 'Not found' );
        }

        return await controller.formatResponse( reqContext, item );
    }

    async putItem( reqContext ) {
        var controller = this.getController( reqContext, 'update' );
        this.resolvePath( reqContext );

        reqContext.requestBody = Object.assign(
            this.getBlankObject( reqContext ),
            reqContext.requestBody );
        var item = await controller.update( reqContext );

        if( !item ) {
            throw reqContext.makeError( 404, 'Not found' );
        }

        return await controller.formatResponse( reqContext, item );
    }

    async deleteItem( reqContext ) {
        var controller = this.getController( reqContext, 'remove' );
        this.resolvePath( reqContext );

        var item = await controller.remove( reqContext );

        if( !item ) {
            throw reqContext.makeError( 404, 'Not found' );
        }

        reqContext.res.setStatus( 204 );
    }

    async getItems( reqContext ) {
        var controller = this.getController( reqContext, 'find' );
        this.resolvePath( reqContext );
        var items = await controller.find( reqContext );

        if( !items ) {
            throw reqContext.makeError( 404, 'Not found' );
        }

        if( !Array.isArray( items ) ) {
            throw reqContext.makeError( 500, 'find must return an array' );
        }
        items = items.map( async( item ) => { return controller.formatResponse( reqContext, item ); });
        return Promise.all( items );
    }

    async postItems( reqContext ) {
        var controller = this.getController( reqContext, 'create' );
        this.resolvePath( reqContext );

        reqContext.requestBody = Object.assign(
            this.getBlankObject( reqContext ),
            reqContext.requestBody );

        var item = await controller.create( reqContext );

        if( !item ) {
            throw reqContext.makeError( 404, 'Not found' );
        }

        return await controller.formatResponse( reqContext, item );
    }

    async callOperation( reqContext ) {
        var controller = this.getController( reqContext, 'callOperation' );
        this.resolvePath( reqContext );

        reqContext.requestBody = Object.assign(
            this.getBlankObject( reqContext ),
            reqContext.requestBody );

        var item = await controller.callOperation( reqContext );

        if( !item ) {
            throw reqContext.makeError( 404, 'Not found' );
        }

        return await controller.formatResponse( reqContext, item );
    }

};
