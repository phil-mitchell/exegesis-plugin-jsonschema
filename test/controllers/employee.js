'use strict';

module.exports = class EmployeeController {
    static async find() {
        return[ 'employee 1', 'employee 2' ];
    }

    static async create( context ) {
        return Object.assign({ id: 555 }, context.requestBody );
    }

    static async get( context ) {
        var reqId = context.requestObjectPath[context.requestObjectPath.length-1];
        if( reqId === 555 ) {
            return({ id: reqId });
        }
        return null;
    }

    static async update( context ) {
        var reqId = context.requestObjectPath[context.requestObjectPath.length-1];
        if( reqId === 555 ) {
            return( Object.assign({ id: context.requestObjectPath[context.requestObjectPath.length-1] }, context.requestBody ) );
        }
        return null;
    }

    static async remove( context ) {
        var reqId = context.requestObjectPath[context.requestObjectPath.length-1];
        if( reqId === 555 ) {
            return({ id: reqId });
        }
        return null;
    }

    static async formatResponse( context, item ) {
        return item;
    }
};
