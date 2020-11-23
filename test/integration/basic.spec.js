'use strict';

var superagent = require( 'superagent' );
var expect = require( 'chai' ).expect;

describe( 'basic schema', function() {
    it( 'can list employees', function( done ) {
        superagent
        .get( 'http://localhost:3000/basic/employees' )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.text ).to.contain( 'employee 1' );
            expect( res.text ).to.contain( 'employee 2' );
            done();
        });
    });
    it( 'can create an employee with all fields', function( done ) {
        superagent
        .post( 'http://localhost:3000/basic/employees' )
        .send({
            firstName: 'Joe',
            lastName: 'Bloggs',
            age: 42
        })
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body ).to.eql({
                id: 555,
                firstName: 'Joe',
                lastName: 'Bloggs',
                age: 42
            });
            done();
        });
    });
    it( 'can create an employee with defaults', function( done ) {
        superagent
        .post( 'http://localhost:3000/basic/employees' )
        .send({
            firstName: 'Joe',
            lastName: 'Bloggs'
        })
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body ).to.eql({
                id: 555,
                firstName: 'Joe',
                lastName: 'Bloggs',
                age: 37
            });
            done();
        });
    });
    it( 'can get specific employee', function( done ) {
        superagent
        .get( 'http://localhost:3000/basic/employees/555' )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body ).to.eql({ id: 555 });
            done();
        });
    });
    it( 'gets an error for getting not-found employee', function( done ) {
        superagent
        .get( 'http://localhost:3000/basic/employees/99' )
        .end( function( e, res ) {
            expect( e ).to.exist;
            expect( res.status ).to.eql( 404 );
            done();
        });
    });
    it( 'can update an employee', function( done ) {
        superagent
        .patch( 'http://localhost:3000/basic/employees/555' )
        .send({
            firstName: 'Fred'
        })
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body ).to.eql({
                id: 555,
                firstName: 'Fred'
            });
            done();
        });
    });
    it( 'gets an error for updating not-found employee', function( done ) {
        superagent
        .patch( 'http://localhost:3000/basic/employees/99' )
        .send({
            firstName: 'Fred'
        })
        .end( function( e, res ) {
            expect( e ).to.exist;
            expect( res.status ).to.eql( 404 );
            done();
        });
    });
    it( 'can replace an employee', function( done ) {
        superagent
        .put( 'http://localhost:3000/basic/employees/555' )
        .send({
            firstName: 'Fred'
        })
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body ).to.eql({
                id: 555,
                firstName: 'Fred',
                lastName: null,
                age: 37
            });
            done();
        });
    });
    it( 'gets an error for replacing not-found employee', function( done ) {
        superagent
        .put( 'http://localhost:3000/basic/employees/99' )
        .send({
            firstName: 'Fred'
        })
        .end( function( e, res ) {
            expect( e ).to.exist;
            expect( res.status ).to.eql( 404 );
            done();
        });
    });
    it( 'can delete an employee', function( done ) {
        superagent
        .delete( 'http://localhost:3000/basic/employees/555' )
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.status ).to.eql( 204 );
            done();
        });
    });
    it( 'gets an error for deleting not-found employee', function( done ) {
        superagent
        .delete( 'http://localhost:3000/basic/employees/99' )
        .end( function( e, res ) {
            expect( e ).to.exist;
            expect( res.status ).to.eql( 404 );
            done();
        });
    });
    it( 'can call an operation on an employee', function( done ) {
        superagent
        .post( 'http://localhost:3000/basic/employees/555/fire()' )
        .send({
            reason: 'Too lazy',
            endDate: '2020-01-02'
        })
        .end( function( e, res ) {
            expect( e ).to.be.null;
            expect( res.body ).to.eql({
                success: true
            });
            done();
        });
    });
});
