/**
 * Created by Greg on 7/2/2016.
 *
 * Version: 1.0.0
 */

import "/common/collections"
import {AsyncCallbackListCompleteNotifier} from '/common/lib/chimerapatterns'


describe('exampleAccessManager',function() {

    var account1 = {username: "TestUser1", password: "1234"};
    var account2 = {username: "TestUser2", password: "1234"};
    
    var mockStringGenerator = function func( text ) {
        if (!func.counter) func.counter = 0;
        if (! text ) text = 'string';
        return text + func.counter++;
    };


    before(function(done){
        Meteor.logout();
        this.timeout(10000);
        setTimeout(done, 5000);
    });

    it('preps database, would be in before, but need to wait for server code to finish', function (done) {
        var notifier = new AsyncCallbackListCompleteNotifier();
        Meteor.call('clearCollections', notifier.registerEmptyCallback() );
        Meteor.subscribe('allDocumentCollection', notifier.registerEmptyCallback() );
        Meteor.subscribe('allAccessCollection', notifier.registerEmptyCallback() );

        notifier.onCompleted( done );
        notifier.start();
    });

    var userId1;
    var userId2;
    it('creates mock user accounts and ensures they were added', function (done) {
        var notifier = new AsyncCallbackListCompleteNotifier();
        Accounts.createUser(account1, notifier.registerCallback( function(){ userId1 = Meteor.userId();}) );
        Accounts.createUser(account2, notifier.registerCallback( function(){ userId2 = Meteor.userId();}) );

        notifier.onCompleted(()=> {
            console.log(userId1);
            console.log(userId2);
            assert.lengthOf(userId1, 17, "userId should be an id");
            assert.lengthOf(userId2, 17, "userId should be an id");
            done();
        });
        notifier.start();
    });

    var docId1;
    it('logs in user 1', function (done) {
        Meteor.loginWithPassword(account1.username, account1.password, done);
    });

    it('creates a document as user 1', function (done) {
        var text = mockStringGenerator(Meteor.user().username + '-create:');
        Meteor.call('createDocument', text, function (error, documentId) {
            docId1 = documentId;
            console.log("user1:doc1:Create");
            console.log(error);
            console.log(documentId);
            assert(documentId, "document should be created");
            done();
        });
    });

    it('should succeed in modify document as user1', function (done) {
        var text = mockStringGenerator(Meteor.user().username + '-modify:');
        Meteor.call('updateDocument', docId1, text, function (error, document) {
            console.log("user1:doc1:Modify");
            console.log(error);
            console.log(document);
            assert.equal(document.text, text, "text should be changed");
            done();
        });
    });

    it('logs in user 2', function (done) {
        Meteor.loginWithPassword(account2.username, account2.password, done);
    });

    it('should fail to modify document as user2', function (done) {
        Meteor.call('updateDocument', docId1, "changed document text", function (error, documentId) {
            console.log("user2:doc1:Modify");
            console.log(error);
            console.log(documentId);
            assert.equal(error.error, 403, "should throw an access deny error.");
            done();
        });
    });

    it('user2 should fail to add his own permissions to user1 doc', function(done){
        Meteor.call('addModifyPermission', docId1, Meteor.userId(), function (error, documentId) {
            console.log("user2:doc1:Add Perm");
            console.log(error);
            console.log(documentId);
            assert.equal(error.error, 403, "should throw an access deny error.");
            done();

        });
    });

    it('logs in user 1 again', function (done) {
        Meteor.loginWithPassword(account1.username, account1.password, done);
    });

    it('gives user2 modify rights on its document', function(done){
        Meteor.call('addModifyPermission', docId1, userId2, function (error, documentId) {
            console.log("user1:doc1:Add Perm");
            console.log(error);
            console.log(documentId);
            assert.isUndefined(error, "No error was thrown");
            done();
        });
    });

    it('logs in user 2 again', function (done) {
        Meteor.loginWithPassword(account2.username, account2.password, done);
    });

    it('user2 should success in modifiying document because he now has permissions', function(done){
        var text = mockStringGenerator(Meteor.user().username + '-modify:');
        Meteor.call('updateDocument', docId1, text, function (error, document) {
            console.log("user2:doc1:Modify");
            console.log(error);
            console.log(document);
            assert.equal(document.text, text, "text should be changed");
            done();
        });
    });
});

