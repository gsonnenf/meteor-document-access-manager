/**
 * Created by Greg on 6/29/2016.
 */

/*
import "/server/collections"
import './accessmanager'
import '/server/utility_security_server'

describe('AccessManager', function() {
    describe('methodTest', function() {
        TestCollection.remove({});
        TestAccessCollection.remove({});
       

        it('should create an access document for test document', function() {

            var ownerId = 'userId1';
            var nonOwnerId = 'userId2';
            Meteor.userId = function () { return ownerId};

            var text = "valid";
            var docId = Meteor.call('createDocument', text );
            assert.equal( TestCollection.findOne({_id: docId}).text, text);

            var accessDoc = TestAccessCollection.findOne({documentId: docId});
            assert( accessDoc );
            assert.equal( accessDoc.accessKeyList[0].accessKey, ownerId );
            assert.include( accessDoc.accessKeyList[0].permissionList, permEnum.Owner);
            /*
            var text2 = "valid 2";
            Meteor.call('changeDocument', docId, text2 );
            assert.equal( TestCollection.findOne({_id: docId}).text, text2 );

            Meteor.userId = function () { return nonOwnerId };
            var text3 = "invalid";
            expect( function(){ Meteor.call('changeDocument', docId, text3 ); }).to.throw( Error, 403);
            assert.equal( TestCollection.findOne({_id: docId}).text, text2 );

            Meteor.call('removeDocument', docId );
            assert.equal( TestCollection.findOne( {_id: docId} ).text, text2 );

            Meteor.userId = function () { return ownerId };
            Meteor.call('removeDocument', docId );
            assert.equal( TestCollection.findOne( {_id: docId} ), null );

        });

        it('should return -1 when the value is not present', function () {
            assert.equal(-1, [1, 2, 3].indexOf(5));
            assert.equal(-1, [1, 2, 3].indexOf(0));
        });
    });
});

    */