'use strict';

module.exports.isRootSchema = function isRootSchema( schema ) {
    return( !!schema.$schema ) && (
        schema.type === 'object' || schema.type === 'boolean' || schema.type === undefined );
};

module.exports.isSubSchema = function isSubschema( schema ) {
    return( !!schema.$id || !!schema.title ) && (
        schema.type === 'object' || schema.type === 'boolean' || schema.type === undefined );
};
