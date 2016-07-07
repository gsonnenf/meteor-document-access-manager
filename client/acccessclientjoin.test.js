/**
 * Created by Greg on 7/7/2016.
 */

import {AccessClientJoin} from './accessclientjoin'
import {AsyncCallbackListCompleteNotifier} from '/common/lib/chimerapatterns'
import '/common/collections'

describe('AccessClientJoin', function(){

    var account1 = {username: "TestUser1", password: "1234"};
    var account2 = {username: "TestUser2", password: "1234"};

    var mockStringGenerator = function func( text ) {
        if (!func.counter) func.counter = 0;
        if (! text ) text = 'string';
        return text + func.counter++;
    };

    before(function(done){
        this.timeout(10000);
        setTimeout(()=>{
            Meteor.logout(()=>{
                Meteor.call('clearJoinCollections');
                console.log("DATABASE CLEARED");
                done();
            });
        }, 500);

    });

    it('preps database, creates accounts and logs in in user1', function (done) {
        console.log("prepping:");
        var userId1;
        var userId2;

        var notifier2 = new AsyncCallbackListCompleteNotifier();
        Accounts.createUser(account1, notifier2.registerCallback( function(){ userId1 = Meteor.userId();}) );
        Accounts.createUser(account2, notifier2.registerCallback( function(){ userId2 = Meteor.userId();}) );

        notifier2.onCompleted(()=> {
            console.log(userId1);
            console.log(userId2);
            assert.lengthOf(userId1, 17, "userId should be an id");
            assert.lengthOf(userId2, 17, "userId should be an id");
            Meteor.loginWithPassword(account1.username, account1.password, ()=>{console.log('LoggedIn'); done(); });
        });
        notifier2.start();

    });

    it('uses AccessClientJoin to keep document cursor with changing permissions up to date', function(done) {

        var clientJoin = new AccessClientJoin({
            documentCollection:JoinDocumentCollection,
            accessCollection:JoinAccessCollection
        });
        clientJoin.subscribe({joinPub: 'joinExample'},{onReady: done});
    });

    it('Inserts a document and removes a document and ensures cursor is updating', function(done){
        var notifier = new AsyncCallbackListCompleteNotifier();

        var docAdded = notifier.registerCallback((doc)=>{
            console.log(JoinDocumentCollection.find().fetch());
            assert.lengthOf(JoinDocumentCollection.find().fetch(),1,"Doc should have one element inserted");
            Meteor.call('joinRemove',doc);
        });
        var docRemoved = notifier.registerCallback((doc)=>{
            console.log(JoinDocumentCollection.find().fetch());
            assert.lengthOf(JoinDocumentCollection.find().fetch(),0,"Doc should have zero element inserted");
            //TODO: There is a bit of a race condition of checking JoinAccessCollection here.
        });

        var cursor = JoinDocumentCollection.find();
        var cursorHandle = cursor.observe({
            added: docAdded,
            removed: docRemoved
        });

        var cursor2 = JoinAccessCollection.find();
        var cursorHandle2 = cursor2.observe({
            added: notifier.registerCallback( (doc)=>{console.log("added access 1: "+ doc.documentId) ;}),
            removed: notifier.registerCallback( (doc)=>{console.log("removed access 1: " + doc.documentId);})
        });

        notifier.onCompleted(()=>{
            cursorHandle.stop();
            cursorHandle2.stop();
            done();
        });
        notifier.start();

        Meteor.call('joinInsert',{test: true}, notifier.registerEmptyCallback());
    });


    var crossUserDoc;
    it('Inserts a document and strips permission', function(done) {
        console.log("perm test begin:");
        var self = this;
        var notifier = new AsyncCallbackListCompleteNotifier();

        var docAdded = notifier.registerCallback( (doc)=> {
            crossUserDoc = doc;
            console.log(JoinDocumentCollection.find().fetch());
            assert.lengthOf(JoinDocumentCollection.find().fetch(), 1, "Doc should have one element inserted");
            Meteor.call('joinRemovePerm',doc);
        });

        var docRemoved =  notifier.registerCallback( (doc)=>{
            console.log("doc removed called");
            console.log(JoinDocumentCollection.find().fetch());
            assert.lengthOf(JoinDocumentCollection.find().fetch(),0,"User Cursor should have zero element inserted");
            Meteor.call('joinDocAll', notifier.registerCallback( (error,result) =>{ assert.lengthOf(result,1,"Global result should be one");} ));
        });

        var cursor = JoinDocumentCollection.find();
        var cursorHandle = cursor.observe({
            added: docAdded,
            removed: docRemoved
        });

        var cursor2 = JoinAccessCollection.find();
        var cursorHandle2 = cursor2.observe({
            added: notifier.registerCallback( (doc)=>{console.log("added access 2:" + doc.documentId )}),
            removed: notifier.registerCallback( (doc)=>{console.log("removed access2:" + doc.documentId )}),
        });

        notifier.onCompleted( ()=>{
            cursorHandle.stop();
            cursorHandle2.stop();
            done();
        });

        notifier.start();

        Meteor.call('joinInsert',{permTest: 1});
    });

    it('logs in user 2', function (done) {
        Meteor.loginWithPassword(account2.username, account2.password, done);
    });

    it('Checks user2 has no documents, then reassigns ownership of user1 doc.', function (done) {
        console.log(JoinDocumentCollection.find().fetch());
        assert.lengthOf(JoinDocumentCollection.find().fetch(), 0, "Doc should have zero element exposed");
        console.log(JoinAccessCollection.find().fetch());
        assert.lengthOf(JoinAccessCollection.find().fetch(), 0, "Access should have zero element exposed");

        var notifier = new AsyncCallbackListCompleteNotifier();

        var cursorHandle = JoinDocumentCollection.find().observe({
            added: notifier.registerCallback( (doc)=> {console.log("added doc:" + doc._id );} )
        });

        var cursorHandle2 = JoinAccessCollection.find().observe({
            added: notifier.registerCallback( (doc)=>{console.log("added access 3:" + doc.documentId )})
        });

        notifier.onCompleted( ()=>{
            console.log(JoinDocumentCollection.find().fetch());
            console.log(JoinAccessCollection.find().fetch());
            assert.lengthOf(JoinDocumentCollection.find().fetch(), 1, "Doc should have 1 element exposed");
            assert.lengthOf(JoinAccessCollection.find().fetch(), 1, "Access should have 1 element exposed");
            cursorHandle.stop();
            cursorHandle2.stop();
            done();
        });

        notifier.start();

        Meteor.call('joinAddPerm',crossUserDoc );

    });


});
