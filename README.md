# meteor-access-manager

AccessManager is a 'per document' permission library for the Meteor Framework using MongoDB and ECMA6. It allows you to set permissions on documents for each user, role, or arbitrary AccessKey. It has methods for adding, removing and testing for accessKey/Permission sets. It also has query methods for retrieving documents and cursors for accessKey/Permission sets. AccessManager keeps document data and permissions seperate by coordinates a document collection and a parallel permission collection. This allows for deployment on existing collections without database migrations. AccessManager can automatically create permissions records on document insert or lazily create them when permissions are added.


Some Example Usage:
```javascript
//Initialize
ExampleDocumentCollection = new Mongo.Collection('ExampleDocumentCollection');
ExampleAccessCollection = new Mongo.Collection('ExampleAccessCollection');

accessManager = new AccessManager({
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
 accessManager.addPermission( documentId, someOtherUser, 'custom' );
 accessManager.removePermission( documentId, someOtherUser2, permEnum.Modify );
  
//Get document associated with accessKey
var docIdList = accessManager.findDocIdsByAccessKey(  Meteor.userId() );
var ownedDocCursor = getDocCursorByAccessKeyAndPermList( Meteor.userId(),[permEnum.Owner] ); 

// Get access permissions associated with a particulary accessKey
var accessDocs = accessManager.getAccessCursorByAccessKey( role1 );
getAccessCursorByAccessKeyAndPermList( Meteor.userId() , [permEnum.Read,permEnum.Owner] );

