'use strict';

var expect = require( 'chai' ).expect;
var require_helper = require( '../require_helper' );
var JSONSchemaController = require_helper( 'controller' );
var sinon = require( 'sinon' );

function makeError( code, text ) {
    var error = new Error( text );
    error.status_code = code;
    return error;
}

describe( 'Controller', function() {
    describe( 'multiple instances', function() {
        before( function() {
            this.controller1 = new JSONSchemaController();
            this.controller2 = new JSONSchemaController();
        });

        it( 'has a unique name', function() {
            expect( this.controller1.name ).to.not.eql( this.controller2.name );
        });
    });

    describe( 'unititialized controllers', function() {
        before( function() {
            this.controller = new JSONSchemaController();
        });

        it( 'throws an exception when trying to get a controller', function() {
            expect( this.controller.getController.bind( this.controller, {
                makeError: makeError
            }) ).to.throw( 'JSONSchemaController controllers have not been initialized' );
        });
    });

    describe( 'getController', function() {
        before( function() {
            this.controller = new JSONSchemaController();
            this.testControllers = {
                test: {
                    get: () => { return; },
                    formatResponse: () => { return; }
                },
                missingFormatResponse: {
                    get: () => { return; }
                }
            };
            this.controller.controllers = this.testControllers;
        });

        it( 'throws an exception when trying to get an unknown controller', function() {
            expect( this.controller.getController.bind( this.controller, {
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'unknown'
                    },
                    pathItemObject: {
                    }
                }
            }, 'get' ) ).to.throw( 'unknown controller not implemented' );
        });

        it( 'throws an exception when trying to get a controller with an unimplemented method', function() {
            expect( this.controller.getController.bind( this.controller, {
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    },
                    pathItemObject: {
                    }
                }
            }, 'update' ) ).to.throw( 'update not implemented in test controller' );
        });

        it( 'throws an exception when trying to get a controller with an unimplemented formatResponse', function() {
            expect( this.controller.getController.bind( this.controller, {
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingFormatResponse'
                    },
                    pathItemObject: {
                    }
                }
            }, 'get' ) ).to.throw( 'formatResponse not implemented in missingFormatResponse controller' );
        });

        it( 'finds the controller when specified in pathItemObject', function() {
            expect( this.controller.getController({
                makeError: makeError,
                api: {
                    operationObject: {
                    },
                    pathItemObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    }
                }
            }, 'get' ) ).to.eql( this.testControllers.test );
        });

        it( 'finds the controller when specified in operationObject', function() {
            expect( this.controller.getController({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    },
                    pathItemObject: {
                    }
                }
            }, 'get' ) ).to.eql( this.testControllers.test );
        });

        it( 'gives precedence to operationObject', function() {
            expect( this.controller.getController({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    },
                    pathItemObject: {
                        'x-exegesis-jsonschema-controller': 'othertest'
                    }
                }
            }, 'get' ) ).to.eql( this.testControllers.test );
        });
    });

    describe( 'getItem', function() {
        before( function() {
            this.controller = new JSONSchemaController();
            this.testControllers = {
                test: {
                    get: () => { return{ _id: 1 }; },
                    formatResponse: ( rq, item ) => { return{ id: item._id, name: 'testItem' }; }
                },
                missingItem: {
                    get: () => { return null; },
                    formatResponse: () => { return; }
                },
                missingOperation: {
                    formatResponse: () => { return; }
                }
            };
            this.controller.controllers = this.testControllers;
        });

        it( 'throws an exception when controller is missing operation', async function() {
            var error = await this.controller.getItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingOperation'
                    },
                    pathItemObject: {
                    }
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'get not implemented in missingOperation controller' );
            expect( error ).to.have.property( 'status_code', 400 );
        });

        it( 'throws an exception when no item is found', async function() {
            var error = await this.controller.getItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingItem'
                    },
                    pathItemObject: {
                    }
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'Not found' );
            expect( error ).to.have.property( 'status_code', 404 );
        });

        it( 'returns formatted item', async function() {
            var result = await this.controller.getItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    },
                    pathItemObject: {
                    }
                }
            });
            expect( result ).to.eql({ id: 1, name: 'testItem' });
        });
    });

    describe( 'patchItem', function() {
        before( function() {
            this.controller = new JSONSchemaController();
            this.testControllers = {
                test: {
                    update: ( rq ) => { return{ _id: 1, defaultField: ( rq.requestBody || {}).defaultField }; },
                    formatResponse: ( rq, item ) => {
                        return{ id: item._id, name: 'testItem', defaultField: item.defaultField };
                    }
                },
                missingItem: {
                    update: () => { return null; },
                    formatResponse: () => { return; }
                },
                missingOperation: {
                    formatResponse: () => { return; }
                }
            };
            this.controller.controllers = this.testControllers;
        });

        it( 'throws an exception when controller is missing operation', async function() {
            var error = await this.controller.patchItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingOperation'
                    },
                    pathItemObject: {
                    }
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'update not implemented in missingOperation controller' );
            expect( error ).to.have.property( 'status_code', 400 );
        });

        it( 'throws an exception when no item is found', async function() {
            var error = await this.controller.patchItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingItem'
                    },
                    pathItemObject: {
                    }
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'Not found' );
            expect( error ).to.have.property( 'status_code', 404 );
        });

        it( 'returns formatted item', async function() {
            var result = await this.controller.patchItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    },
                    pathItemObject: {
                    }
                }
            });
            expect( result ).to.eql({ id: 1, name: 'testItem', defaultField: undefined });
        });

        it( 'does not applies the empty object in operationObject', async function() {
            var result = await this.controller.patchItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test',
                        'x-exegesis-jsonschema-blankobject': '{ "defaultField": 0 }'
                    },
                    pathItemObject: {
                    }
                }
            });
            expect( result ).to.eql({ id: 1, name: 'testItem', defaultField: undefined });
        });
    });

    describe( 'putItem', function() {
        before( function() {
            this.controller = new JSONSchemaController();
            this.testControllers = {
                test: {
                    update: ( rq ) => { return{ _id: 1, defaultField: rq.requestBody.defaultField }; },
                    formatResponse: ( rq, item ) => {
                        return{ id: item._id, name: 'testItem', defaultField: item.defaultField };
                    }
                },
                missingItem: {
                    update: () => { return null; },
                    formatResponse: () => { return; }
                },
                missingOperation: {
                    formatResponse: () => { return; }
                }
            };
            this.controller.controllers = this.testControllers;
        });

        it( 'throws an exception when controller is missing operation', async function() {
            var error = await this.controller.putItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingOperation'
                    },
                    pathItemObject: {
                    }
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'update not implemented in missingOperation controller' );
            expect( error ).to.have.property( 'status_code', 400 );
        });

        it( 'throws an exception when no item is found', async function() {
            var error = await this.controller.putItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingItem'
                    },
                    pathItemObject: {
                    }
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'Not found' );
            expect( error ).to.have.property( 'status_code', 404 );
        });

        it( 'returns formatted item', async function() {
            var result = await this.controller.putItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    },
                    pathItemObject: {
                    }
                }
            });
            expect( result ).to.eql({ id: 1, name: 'testItem', defaultField: undefined });
        });

        it( 'applies the empty object in operationObject', async function() {
            var result = await this.controller.putItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test',
                        'x-exegesis-jsonschema-blankobject': '{ "defaultField": 0 }'
                    },
                    pathItemObject: {
                    }
                }
            });
            expect( result ).to.eql({ id: 1, name: 'testItem', defaultField: 0 });
        });

        it( 'applies the empty object in pathItemObject', async function() {
            var result = await this.controller.putItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    },
                    pathItemObject: {
                        'x-exegesis-jsonschema-blankobject': '{ "defaultField": 0 }'
                    }
                }
            });
            expect( result ).to.eql({ id: 1, name: 'testItem', defaultField: 0 });
        });
    });

    describe( 'deleteItem', function() {
        before( function() {
            this.controller = new JSONSchemaController();
            this.testControllers = {
                test: {
                    remove: () => { return{ _id: 1 }; },
                    formatResponse: ( rq, item ) => { return{ id: item._id, name: 'testItem' }; }
                },
                missingItem: {
                    remove: () => { return null; },
                    formatResponse: () => { return; }
                },
                missingOperation: {
                    formatResponse: () => { return; }
                }
            };
            this.controller.controllers = this.testControllers;
        });

        it( 'throws an exception when controller is missing operation', async function() {
            var setStatus = sinon.stub().returnsThis();
            var error = await this.controller.deleteItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingOperation'
                    },
                    pathItemObject: {
                    }
                },
                res: {
                    setStatus: setStatus
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'remove not implemented in missingOperation controller' );
            expect( error ).to.have.property( 'status_code', 400 );
            expect( setStatus.called ).to.be.false;
        });

        it( 'throws an exception when object is not found', async function() {
            var setStatus = sinon.stub().returnsThis();
            var error = await this.controller.deleteItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingItem'
                    },
                    pathItemObject: {
                    }
                },
                res: {
                    setStatus: setStatus
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'Not found' );
            expect( error ).to.have.property( 'status_code', 404 );
            expect( setStatus.called ).to.be.false;
        });

        it( 'returns nothing when object is deleted', async function() {
            var setStatus = sinon.stub().returnsThis();
            var result = await this.controller.deleteItem({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    },
                    pathItemObject: {
                    }
                },
                res: {
                    setStatus: setStatus
                }
            });
            expect( result ).to.be.not.ok;
            expect( setStatus.calledOnce ).to.be.true;
            expect( setStatus.firstCall.args ).to.eql( [ 204 ] );
        });
    });

    describe( 'getItems', function() {
        before( function() {
            this.controller = new JSONSchemaController();
            this.testControllers = {
                test: {
                    find: () => { return[ { _id: 1 }, { _id: 2 } ]; },
                    formatResponse: ( rq, item ) => { return{ id: item._id, name: 'testItem' }; }
                },
                emptyList: {
                    find: () => { return[]; },
                    formatResponse: () => { return; }
                },
                missingList: {
                    find: () => { return null; },
                    formatResponse: () => { return; }
                },
                missingOperation: {
                    formatResponse: () => { return; }
                }
            };
            this.controller.controllers = this.testControllers;
        });

        it( 'throws an exception when controller is missing operation', async function() {
            var error = await this.controller.getItems({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingOperation'
                    },
                    pathItemObject: {
                    }
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'find not implemented in missingOperation controller' );
            expect( error ).to.have.property( 'status_code', 400 );
        });

        it( 'throws an exception when no list is found', async function() {
            var error = await this.controller.getItems({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingList'
                    },
                    pathItemObject: {
                    }
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'Not found' );
            expect( error ).to.have.property( 'status_code', 404 );
        });

        it( 'returns formatted items', async function() {
            var result = await this.controller.getItems({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    },
                    pathItemObject: {
                    }
                }
            });
            expect( result ).to.eql( [ { id: 1, name: 'testItem' }, { id: 2, name: 'testItem' } ] );
        });

        it( 'returns empty list of items', async function() {
            var result = await this.controller.getItems({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'emptyList'
                    },
                    pathItemObject: {
                    }
                }
            });
            expect( result ).to.eql( [] );
        });
    });

    describe( 'postItems', function() {
        before( function() {
            this.controller = new JSONSchemaController();
            this.testControllers = {
                test: {
                    create: ( rq ) => { return{ _id: 1, defaultField: rq.requestBody.defaultField }; },
                    formatResponse: ( rq, item ) => {
                        return{ id: item._id, name: 'testItem', defaultField: item.defaultField };
                    }
                },
                missingItem: {
                    create: () => { return null; },
                    formatResponse: () => { return; }
                },
                missingOperation: {
                    formatResponse: () => { return; }
                }
            };
            this.controller.controllers = this.testControllers;
        });

        it( 'throws an exception when controller is missing operation', async function() {
            var error = await this.controller.postItems({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingOperation'
                    },
                    pathItemObject: {
                    }
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'create not implemented in missingOperation controller' );
            expect( error ).to.have.property( 'status_code', 400 );
        });

        it( 'throws an exception when no item is found', async function() {
            var error = await this.controller.postItems({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'missingItem'
                    },
                    pathItemObject: {
                    }
                }
            }).then( () => null, err => err );
            expect( error ).to.be.an( 'Error' );
            expect( error ).to.have.property( 'message', 'Not found' );
            expect( error ).to.have.property( 'status_code', 404 );
        });

        it( 'returns formatted item', async function() {
            var result = await this.controller.postItems({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    },
                    pathItemObject: {
                    }
                }
            });
            expect( result ).to.eql({ id: 1, name: 'testItem', defaultField: undefined });
        });

        it( 'applies the empty object in operationObject', async function() {
            var result = await this.controller.postItems({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test',
                        'x-exegesis-jsonschema-blankobject': '{ "defaultField": 0 }'
                    },
                    pathItemObject: {
                    }
                }
            });
            expect( result ).to.eql({ id: 1, name: 'testItem', defaultField: 0 });
        });

        it( 'applies the empty object in pathItemObject', async function() {
            var result = await this.controller.postItems({
                makeError: makeError,
                api: {
                    operationObject: {
                        'x-exegesis-jsonschema-controller': 'test'
                    },
                    pathItemObject: {
                        'x-exegesis-jsonschema-blankobject': '{ "defaultField": 0 }'
                    }
                }
            });
            expect( result ).to.eql({ id: 1, name: 'testItem', defaultField: 0 });
        });
    });

});
