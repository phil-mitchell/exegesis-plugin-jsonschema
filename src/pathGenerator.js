'use strict';

const blankObject = require( './blankObject' );
const toOpenAPIComponent = require( './toOpenAPIComponent' );

class JSONSchemaPathGenerator {
    constructor( apiDoc, controller, baseUrl ) {
        if( typeof( apiDoc ) !== 'object' ) {
            throw new Error( 'apiDoc object is required' );
        }
        if( typeof( controller ) !== 'string' ) {
            throw new Error( 'controller name is required' );
        }

        apiDoc.paths = apiDoc.paths || {};
        apiDoc.components = apiDoc.components || {};
        apiDoc.components.schemas = apiDoc.components.schemas || {};

        this.apiDoc = apiDoc;
        this.controller = controller;

        this.namespace = ( baseUrl || '' ).replace( /\//g, '.' ) || '';
        this.baseUrl = baseUrl || '';
    }

    toSchemaName( context, schema ) {
        if( !schema.title ) {
            throw new Error( `Missing title in schema: ${ JSON.stringify( schema ) }` );
        }
        if( this.namespace ) {
            return`${this.namespace}::${schema.title}`;
        }
        return schema.title;
    }

    addObjectDefinition( context, schema ) {
        var title = this.toSchemaName( context, schema );
        if( this.apiDoc.components.schemas[title] ) {
            throw new Error( `Duplicate schema with title ${title}` );
        }
        this.apiDoc.components.schemas[title] = toOpenAPIComponent( schema );
    }

    addObjectPath( context, schema ) {
        var localControllerName = schema['exegesis-plugin-jsonschema-controller'];
        if( !localControllerName ) {
            throw new Error( `Schema ${schema.title} is missing exegesis-plugin-jsonschema-controller` );
        }

        var urlPath = ( ( this.baseUrl || '' ) + ( context.urlPath || '' ) ) || '/';
        if( this.apiDoc.paths[urlPath] ) {
            throw new Error( `Duplicate path ${urlPath || '/'} found for schema ${schema.title}` );
        }
        var schemaName = this.toSchemaName( context, schema );

        this.apiDoc.paths[urlPath] = {
            'x-exegesis-controller': this.controller,
            'x-exegesis-jsonschema-controller': localControllerName,
            'x-exegesis-jsonschema-blankobject': JSON.stringify( blankObject( schema ) ),
            'x-exegesis-jsonschema-pathtemplate': context.urlPath || '/',
            get: {
                summary: `Gets a single ${schema.title || 'item'}`,
                operationId: `getItem ${urlPath}`,
                parameters: [].concat( context.pathParams || [] ),
                responses: {
                    '200': {
                        description: `The ${schema.title}`,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: `#/components/schemas/${schemaName}`
                                }
                            }
                        }
                    }
                }
            },
            patch: {
                summary: `Modify a ${schema.title}`,
                operationId: `patchItem ${urlPath}`,
                parameters: [].concat( context.pathParams || [] ),
                requestBody: {
                    description: `The modified ${schema.title} values`,
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: `#/components/schemas/${schemaName}`
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: `The modified ${schema.title}`,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: `#/components/schemas/${schemaName}`
                                }
                            }
                        }
                    }
                }
            },
            put: {
                summary: `Replace a ${schema.title}`,
                operationId: `putItem ${urlPath}`,
                parameters: [].concat( context.pathParams || [] ),
                requestBody: {
                    description: `The new ${schema.title} to replace this one`,
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: `#/components/schemas/${schemaName}`
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: `The replaced ${schema.title}`,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: `#/components/schemas/${schemaName}`
                                }
                            }
                        }
                    }
                }
            }
        };

        if( !schema.readOnly ) {
            this.apiDoc.paths[urlPath]['delete'] = {
                summary: `Delete a ${schema.title}`,
                operationId: `deleteItem ${urlPath}`,
                parameters: [].concat( context.pathParams || [] ),
                responses: {
                    '204': {
                        description: `No content`
                    }
                }
            };
        }
    }

    addCollectionPath( context, schema ) {
        var localControllerName = schema['exegesis-plugin-jsonschema-controller'];
        if( !localControllerName ) {
            throw new Error( `Schema ${schema.title} is missing exegesis-plugin-jsonschema-controller` );
        }

        var urlPath = ( ( this.baseUrl || '' ) + ( context.urlPath || '' ) ) || '/';
        if( this.apiDoc.paths[urlPath || '/'] ) {
            throw new Error( `Duplicate path ${urlPath || '/'} found for schema ${schema.title}` );
        }
        var schemaName = this.toSchemaName( context, schema );

        this.apiDoc.paths[urlPath] = {
            'x-exegesis-controller': this.controller,
            'x-exegesis-jsonschema-controller': localControllerName,
            'x-exegesis-jsonschema-blankobject': JSON.stringify( blankObject( schema ) ),
            'x-exegesis-jsonschema-pathtemplate': context.urlPath || '/',
            get: {
                summary: `Gets a list of ${schema.title}`,
                operationId: `getItems ${urlPath}`,
                parameters: [].concat( context.pathParams || [] ),
                responses: {
                    '200': {
                        description: `The list of ${schema.title}`,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: `#/components/schemas/${schemaName}`
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        if( !schema.readOnly ) {
            this.apiDoc.paths[urlPath].post = {
                summary: `Create a new ${schema.title}`,
                operationId: `postItems ${urlPath}`,
                parameters: [].concat( context.pathParams || [] ),
                requestBody: {
                    description: `The new ${schema.title} to be created`,
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: `#/components/schemas/${schemaName}`
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: `The new ${schema.title}`,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: `#/components/schemas/${schemaName}`
                                }
                            }
                        }
                    }
                }
            };
        }
    }

    processSchema( context, schema, collection, skipPath ) {
        if( collection ) {
            if( !skipPath ) {
                this.addCollectionPath( context, schema );
            }
            this.processSchema( Object.assign({}, context, {
                urlPath: `${context.urlPath || '' }/{pathParam${( context.pathParams || [] ).length}}`,
                pathParams: ( context.pathParams || [] ).concat( [ {
                    'in': 'path',
                    name: `pathParam${( context.pathParams || [] ).length}`,
                    schema: { type: 'integer' },
                    required: true,
                    description: `ID for ${schema.title || 'item' }`
                } ] )
            }), schema, false, !schema.$id );
        } else {
            if( !skipPath ) {
                if( schema.$id ) {
                    this.addObjectDefinition( context, schema );
                }
                this.addObjectPath( context, schema );
            }
            if( schema.properties ) {
                Object.keys( schema.properties ).forEach( name => {
                    let definition = schema.properties[name];
                    if( definition.type === 'array' && definition.items ) {
                        this.processSchema( Object.assign({}, context, {
                            urlPath: `${context.urlPath}/${name}`
                        }), definition.items, true, !definition.items.$id );
                    } else if( definition.type === 'object' || definition.properties ) {
                        this.processSchema( Object.assign({}, context, {
                            urlPath: `${context.urlPath}/${name}`
                        }), definition, false, !definition.$id );
                    }
                });
            }
        }
    }
}

module.exports = function pathGenerator( apiDoc, controller, schema, baseUrl ) {
    if( !schema || ( schema.type !== undefined && schema.type !== 'object' ) || !schema.properties ) {
        throw new Error( 'Root schema must have object type and have properties' );
    }
    var generator = new JSONSchemaPathGenerator( apiDoc, controller, baseUrl );
    return generator.processSchema({ urlPath: '', pathParams: [] }, schema, false, true );
};
