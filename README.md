# meteor-access-manager

AccessManager is a document permission system, for the Meteor Framework and Mongodb, used to assign, modify and test permissions for individual documents. 

## Description

AccessManager allows you to set permissions on individual document for userIds, roles, or arbitrary accessKeys. It has query methods for retrieving documents with specific accessKey/permission combinations(e.g. documents a user has modify permissions for). AccessManager uses a parallel Mongo collection for permission storage allowing easy deploys on existing collections(e.g. no need for db migrations). AccessManager can automatically create permissions records on document insert or lazily create them when permissions are needed.

## Some Example Usage:
```javascript
//Initialize
ExampleDocumentCollection = new Mongo.Collection('ExampleDocumentCollection');
ExampleAccessCollection = new Mongo.Collection('ExampleAccessCollection');

accessManager = new AccessManager({
    documentCollection: ExampleDocumentCollection,
    accessCollection: ExampleAccessCollection,
    options: {autoAssignOwner: true}
});
var permEnum = AccessManager.DefaultPermissionEnum;

//Check permission
 var hasAccess = accessManager.hasAnyPermission(documentId, Meteor.userId(), [permEnum.Owner,permEnum.Modify])); 
 var hasAccess = accessManager.hasAllPermission( documentId, 'someReadWriteRole', [permEnum.Read,permEnum.Write]) );
 var hasAccess = accessManager.hasAllPermission( documentId, 'someOtherRole', ['custom1','custom2']) );
 
 //Add Permissions
 accessManager.addPermission( documentId, Meteor.userId(), permEnum.Owner );
 accessManager.addPermission( documentId, someOtherUser, 'custom' );
 accessManager.removePermission( documentId, someOtherUser2, permEnum.Modify );
  
//Get document associated with accessKey, useful for displaying documents a user has permission to read or modify
var docIdList = accessManager.findDocIdsByAccessKey(  Meteor.userId() );
var ownedDocCursor = getDocCursorByAccessKeyAndPermList( Meteor.userId(),[permEnum.Modify] ); 

// Get permissions curosors associated with a particulary accessKey, useful for UI editing of user permissions by owners.
var accessDocs = accessManager.getAccessCursorByAccessKey( role1 );
var accessDocs = accessManager.getAccessCursorByAccessKeyAndPermList( Meteor.userId() , [permEnum.Share,permEnum.Owner] );

