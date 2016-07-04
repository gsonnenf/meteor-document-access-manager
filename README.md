# meteor-access-manager

This is a 'per document' permissions system for the Meteor Framework using MongoDB and ECMA6. It sets up a permissions database parallel to a document database and allows you to assign permissions for each user, role, or arbitrary access key to limit document access to users with permission.


Some Example Usage:
```javascript
//Initialize
ExampleDocumentCollection = new Mongo.Collection('ExampleDocumentCollection');
ExampleAccessCollection = new Mongo.Collection('ExampleAccessCollection');

exampleAccessManager = new AccessManager({
    documentCollection: ExampleDocumentCollection,
    accessCollection: ExampleAccessCollection,
    options: {autoAssignOwner: true}
});

//Check permission
 var hasAccess = accessManager.hasAnyPermission(documentId, Meteor.userId(), [permEnum.Owner,permEnum.Modify])); 
 var hasAccess = accessManager.hasAllPermission( documentId, 'someReadWriteRole', [permEnum.Read,permEnum.Write]) );
 var hasAccess = accessManager.hasAllPermission( documentId, 'someOtherRole', ['custom1','custom2']) );
 
 //Add Permissions
 accessManager.addPermission( documentId, Meteor.userId(), permEnum.Owner );
 accessManager.addPermission( documentId, someOtherUser, permEnum.Modify );
  
  //Get document associated with accessKey
var docIdList = accessManager.findDocIdsByAccessKey(  Meteor.userId() );
var ownedDocCursor = getDocCursorByAccessKeyAndPermList( Meteor.userId(),[permEnum.Owner]) 
