/**
 * Created by Greg on 6/28/2016.
 */
import '/common/collection_exampleaccessmanager'
import '/common/accessmanager'
import '/server/utility_security_server'

exampleAccessManager = new AccessManager({
    documentCollection: ExampleDocumentCollection,
    accessCollection: ExampleAccessCollection,
    options: {autoAssignOwner: true}
});

var permEnum = AccessManager.DefaultPermEnum;

Meteor.publish('allDocumentCollection', function() {
    return ExampleDocumentCollection.find();
});

Meteor.publish( 'allAccessCollection', function(){
    return ExampleAccessCollection.find();
});

Meteor.publish('myDocumentCollection', function() {
    return ExampleDocumentCollection.find();
});

Meteor.publish( 'myAccessCollection', function(permissionList){
    if (permissionList) return exampleAccessManager.getDocCursorByAccessKey( this.userId, permissionList );
    else return exampleAccessManager.getDocCursorByAccessKey( this.userId );
});

Meteor.methods({
    'clearCollections': function() {
        Meteor.users.remove({});
        ExampleDocumentCollection.remove({});
        ExampleAccessCollection.remove({});
    }
});

Meteor.methods({
    createDocument: function(text) {
        return ExampleDocumentCollection.insert({ ownerId: Meteor.userId(), text: text });
    },

    updateDocument: function(documentId, text) {
        if( !exampleAccessManager.hasPermissionAny(documentId, Meteor.userId(), [permEnum.Owner,permEnum.Modify]) ) accessDenied();
        ExampleDocumentCollection.update(documentId, {$set: {text: text} });
        return ExampleDocumentCollection.findOne( documentId );
    },

    removeDocument: function(documentId) {
        if( !exampleAccessManager.hasPermissionAny(documentId, Meteor.userId(), [permEnum.Owner,permEnum.Delete]) ) accessDenied();
        ExampleDocumentCollection.remove(documentId);
    },

    addModifyPermission: function(documentId, userId) {
        if( !exampleAccessManager.hasPermissionAny(documentId, Meteor.userId(), [permEnum.Owner,permEnum.Share]) ) accessDenied();
        exampleAccessManager.addPermissions(documentId, userId, permEnum.Modify);
        return "called";
    },

    removeModifyPermission: function(documentId, userId) {
        if( !exampleAccessManager.hasPermissionAny(documentId, Meteor.userId(), [permEnum.Owner,permEnum.Share]) ) accessDenied();
        exampleAccessManager.addPermissions(documentId, userId, permEnum.Modify);
        return "called";
    }
});


Meteor.users.allow({
    update: ()=>{return true},
    insert: ()=>{return true},
    remove: ()=>{return true},
});

ExampleDocumentCollection.allow({
    update: ()=>{return true},
    insert: ()=>{return true},
    remove: ()=>{return true},
});

ExampleAccessCollection.allow({
    update: ()=>{return true},
    insert: ()=>{return true},
    remove: ()=>{return true},
});