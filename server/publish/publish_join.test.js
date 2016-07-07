/**
 * Created by Greg on 7/7/2016.
 */


import {AccessManager} from '/common/accessmanager'
import '/common/collections'

joinAccessManager = new AccessManager({
    documentCollection: JoinDocumentCollection,
    accessCollection: JoinAccessCollection,
    options: {autoAssignOwner: true, autoDelete:true}
});

var permEnum = AccessManager.DefaultPermEnum;


joinAccessManager.securePublish('joinExample', function(){ return this.userId }, [permEnum.Owner,permEnum.Read,permEnum.Modify]);

Meteor.methods({
    'clearJoinCollections': function() {
        console.log("DATABASE CLEARED, JOIN TESTS STARTED");
        console.log(Meteor.userId());
        console.log(Meteor.user())
        Meteor.users.remove({});
        JoinDocumentCollection.remove({});
        JoinAccessCollection.remove({});


    },
    'joinInsert': function(doc) {
        JoinDocumentCollection.insert(doc);
    },
    'joinRemove': function(doc) {
        JoinDocumentCollection.remove(doc._id);
    },
    'joinRemovePerm': function(doc) {
        console.log("Removed Key: " + Meteor.userId());
        joinAccessManager.removePermissions(doc._id, Meteor.userId(), permEnum.Owner );
    },
    'joinAddPerm': function(doc){
        console.log("Added Key: " + Meteor.userId());
        joinAccessManager.addPermissions(doc._id, Meteor.userId(), permEnum.Owner );
    },

    joinAccessAll: function() {
        return JoinAccessCollection.find().fetch();
    },

    joinDocAll: function() {
        return JoinDocumentCollection.find().fetch();
    }
});


/*
Meteor.publish('joinAccess', function() {
    var accessCursor = joinAccessManager.getAccessCursorByKeyAndPermAny( this.userId, [permEnum.Owner,permEnum.Read,permEnum.Modify]);
    return accessCursor;
});

Meteor.publish( 'joinDocs', function(){
    var accessCursor = joinAccessManager.getAccessCursorByKeyAndPermAny( this.userId, [permEnum.Owner,permEnum.Read,permEnum.Modify]);
    return joinAccessManager.getDocCursorFromAccessCursor( accessCursor );
});
*/