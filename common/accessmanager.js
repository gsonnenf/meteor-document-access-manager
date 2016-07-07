/**
 * Created by Greg on 6/28/2016.
 */

import {MulticastEvent, Aspect} from '/common/lib/chimerapatterns'

AccessModel = class AccessModel{
    constructor({documentId, accessKey, permissionList }) {
        this.documentId = documentId;
        this.accessKey = accessKey;
        this.permissionList = permissionList;
    }
};

export class AccessManager {
    constructor({documentCollection, accessCollection, options={}}) {
        this.accessCollection = accessCollection;
        this.documentCollection = documentCollection;
        this.documentCursor = documentCollection.find();

        /*** events ***************************************************************************************************/

        this.onDocumentAdded = new MulticastEvent( this, 'onDocumentAdded');
        this.onDocumentModify = new MulticastEvent( this, 'onDocumentModify');
        this.onDocumentRemoved = new MulticastEvent( this, 'onDocumentRemoved');

        this.documentCursor.observe({
            added: ( document )=> { this.onDocumentAdded.callEvent( document ) } ,
            deleted: ( document )=> { this.onDocumentModify.callEvent( document ) },
            removed: ( document )=> { this.onDocumentRemoved.callEvent( document ) },
        });


        this.accessCollection._ensureIndex({ documentId: 1});
        this.accessCollection._ensureIndex({ accessKey: 1});

        //this.accessCollection.rawCollection().ensureIndex({ documentId: 1 });
        //this.accessCollection.rawCollection().ensureIndex({ accessKey: 1 });
        
        /*** event bindings *******************************************************************************************/
       if (options.autoAssignOwner)
            Aspect.onMethodExit(this.documentCollection, 'insert', (documentId, args)=> {
                if (documentId) this.addPermissions(documentId, Meteor.userId(), AccessManager.DefaultPermEnum.Owner );
            });

        if (options.autoDelete) {
            Aspect.onMethodExit(this.documentCollection, 'remove', (isRemoved, docId)=> {
                //TODO: Change to a method where we can see what was deleted.
                //if (isRemoved) console.log( "remove?" + this.accessCollection.remove({documentId: docId}));
                console.log("db.remove called:" + isRemoved);
                console.log(docId);
            });

            this.onDocumentRemoved( (document)=>{
                console.log("DOCUMENT REMOVED: " )
                console.log( document);
                if (document) this.accessCollection.remove({documentId: document._id});
            })
        }
          
        
    }

    //*** Permission management ***************************************************************************************

    hasPermissionAny(documentId, accessKey, permissions) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        return this._hasPermission(documentId, accessKey, {$in: permissions } );
    }

    hasPermissionAll(documentId, accessKey, permissions) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        return this._hasPermission(documentId, accessKey, {$all: permissions } );
    }

    _hasPermission(documentId, accessKey, permissionQuery) {
        return this.accessCollection.findOne({
            documentId: documentId,
            accessKey: accessKey,
            permissionList: permissionQuery
        });
    }
    
    addPermissions(documentId, accessKey, permissions) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        var accessModel = this.accessCollection.findOne({documentId: documentId, accessKey: accessKey});
        if (!accessModel) accessModel = { documentId: documentId, accessKey: accessKey, permissionList: permissions};
        permissions.forEach((permission)=>{
            if (accessModel.permissionList.indexOf(permission) == -1) accessModel.permissionList.push(permission);
        });
        if (accessModel._id) this.accessCollection.update({_id: accessModel._id}, accessModel);
        else this.accessCollection.insert(accessModel);
    }

    removePermissions(documentId, accessKey, permissions) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        var accessModel = this.accessCollection.findOne({documentId: documentId, accessKey: accessKey});
        if (!accessModel) return false;

        permissions.forEach((permission)=> {
            var permIndex = accessModel.permissionList.indexOf(permission);
            if (permIndex == -1) return;
            accessModel.permissionList.splice(permIndex, 1);
        });
        if (accessModel.permissionList.length == 0) this.accessCollection.remove({_id: accessModel._id});
        else  this.accessCollection.update({_id: accessModel._id}, accessModel);
    }


    //*** Queries ****************************************************************************************************

    getAccessCursorByKey(accessKey ) {
        return this.accessCollection.find( { accessKey: accessKey } );
    }

    getAccessCursorByKeyAndPermAny(accessKey, permissions) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        return this.accessCollection.find( {accessKey: accessKey, permissionList: {$in: permissions} } );
    }
    getAccessCursorByKeyAndPermAll(accessKey, permissions) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        return this.accessCollection.find( {accessKey: accessKey, permissionList: {$all: permissions} } );
    }

    //****//
    getDocIdsByKey(accessKey) { return this.getDocIdsByAccessCursor(this.getAccessCursorByKey(accessKey)); }
    getDocIdsByKeyAndPermAny( accessKey,permissions) { return this.getDocIdsByAccessCursor(this.getAccessCursorByKeyAndPermAny(accessKey,permissions)); }
    getDocIdsByKeyAndPermAll( accessKey,permissions) { return this.getDocIdsByAccessCursor(this.getAccessCursorByKeyAndPermAll(accessKey,permissions)); }


    getDocIdsByAccessCursor( accessCursor ) {
        return accessCursor.fetch().map( (element)=>{ return element.documentId });
    }

    getDocCursorFromDocIds( documentIdList ) {
        return this.documentCollection.find( {_id: {$in: documentIdList }} );
    }

    getDocCursorFromAccessCursor( accessCursor ) {
       return this.getDocCursorFromDocIds( this.getDocIdsByAccessCursor(accessCursor));
    }

    /*******Autopublish *****************************************************/
    securePublish(name, accessKey, permissionList) {
        var self = this;
        Meteor.publish(name + "Access", function() {
            var key = (typeof accessKey == "function") ? accessKey.apply(this) : accessKey;
            return self.getAccessCursorByKeyAndPermAny( key, permissionList );
        });

        Meteor.publish(name+'Document', function(){
            var key = (typeof accessKey == "function") ? accessKey.apply(this) : accessKey;
            return self.getDocCursorFromAccessCursor( self.getAccessCursorByKeyAndPermAny( key, permissionList) );
        });
    };
};

AccessManager.DefaultPermEnum = {
    Owner: 'owner',
    Read: 'read',
    Modify: 'modify',
    Delete: 'delete',
    Shared: 'shared',
    Share: 'share',
};

Object.freeze(AccessManager.DefaultPermEnum);


/*
///Low level API code for join
 publishDocCollectionByAccessKey( thisPublish, accessKey ){
 var accessCursor = this.accessCollection.find({ accessKey: accessKey });
 accessCursor.observe({
 added: (accessDoc)=>{ thisPublish.added(
 this.documentCollectionName,
 accessDoc.documentId,
 this.documentCollection.findOne({_id:accessDoc.documentId})
 )},
 removed:(accessDocId)=> {
 var accessDoc = this.accessCollection.findOne({_id:accessDocId});
 if (accessDoc) thisPublish.removed(this.documentCollectionName, accessDoc.documentId )
 }
 });

 }
 */