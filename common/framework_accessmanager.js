/**
 * Created by Greg on 6/28/2016.
 */

import '/common/framework_pattern'
var MulticastEvent = Pattern.Multicast.MulticastEvent;


AccessModel = class AccessModel{
    constructor({documentId, accessList = []}) {
        this.documentId = documentId;
        this.accessKeyList = accessList;
    }
};

AccessKeyModel = class AccessKeyModel {
    constructor({accessKey, permissionList = []}) {
        this.accessKey = accessKey;
        this.permissionList = permissionList;
    }
};

AccessManager = class AccessManager {
    constructor({documentCollection, accessCollection, options={}}) {
        this.accessCollection = accessCollection;
        this.documentCollection = documentCollection;
        this.documentCursor = documentCollection.find();

        /*** events ***************************************************************************************************/

        this.onDocumentAdded = new MulticastEvent( this, 'onDocumentAdded');
        this.onDocumentModify = new MulticastEvent( this, 'onDocumentModify');
        this.onDocumentDelete = new MulticastEvent( this, 'onDocumentDelete');

        this.documentCursor.observe({
            added: ( document )=> { this.onDocumentAdded.callMethods( document ) } ,
            deleted: ( document )=> { this.onDocumentModify.callMethods( document ) },
            removed: ( document )=> { this.onDocumentDelete.callMethods( document ) },
        });

        //this.accessCollection.rawCollection().ensureIndex({documentId: 1});
        //this.accessCollection._ensureIndex({ documentId: 1});
        
        /*** event bindings *******************************************************************************************/
       if (options.autoAssignOwner)
            Pattern.Aspect.onMethodExit(this.documentCollection, 'insert', (documentId, args)=> {
                this._insertAccessDocumentOwner(documentId, Meteor.userId() );
            });
        else if (options.autoCreate)
           Pattern.Aspect.onMethodExit(this.documentCollection, 'insert', (documentId, args)=> {
               this._insertAccessDocument(documentId );
           });

        if (options.autoDelete) this.onDocumentDelete( (document)=> { this._deleteAccessDocument(document._id); });
        
    }

    //*** Permission management ***************************************************************************************
    hasPermission(documentId, accessKey, permission) {
        return this._hasPermission(documentId, accessKey, {$in: [permission] } );
    }

    hasAnyPermission(documentId, accessKey, permissionList) {
        return this._hasPermission(documentId, accessKey, {$in: permissionList } );
    }

    hasAllPermission(documentId, accessKey, permissionList) {
        return this._hasPermission(documentId, accessKey, {$all: permissionList } );
    }
    
    addPermission(documentId, accessKey, permission) {
        var accessModel = this.accessCollection.findOne({documentId: documentId});
        if (!accessModel) throw new Error("No access document found.");
        this._addPermission(accessModel, accessKey, permission);
        this.accessCollection.update({_id: accessModel._id}, accessModel);
    }

    removePermission(documentId, accessKey, permission) {
        var accessModel = this.accessCollection.findOne({documentId: documentId});
        if (!accessModel) throw new Error("No access document found.")
        this._removePermission(accessModel, accessKey, permission);
        this.accessCollection.update({_id: accessModel._id}, accessModel);
    }

    //*** Queries ****************************************************************************************************
    
    findDocIdsByAccessKey (accessKey) {
        var accessModels = this.getAccessCursorByAccessKey(accessKey).fetch();
        return accessModels.map( (element)=>{ return element.documentId });
    }

    findDocIdsByAccessKeyAndPermList ( accessKey,permissionList) {
        var accessModels = this.getAccessCursorByAccessKeyAndPermList(accessKey,permissionList).fetch();
        return accessModels.map( (element)=>{ return element.documentId });
    }

    getDocCursorByAccessKey(accessKey) {
        return this.documentCollection.find( this.findDocIdsByAccessKey( accessKey ) );
    }

    getDocCursorByAccessKeyAndPermList(accessKey,permissionList) {
        return this.documentCollection.find( this.findDocIdsByAccessKeyAndPermList( accessKey,permissionList ) );
    }

    getAccessCursorByAccessKey( accessKey ) {
        return this.accessCollection.find({ accessKeyList:{ $elemMatch:{ accessKey: accessKey } }});
    }

    getAccessCursorByAccessKeyAndPermList( accessKey, permissionList ) {
        return this.accessCollection.find({
            accessKeyList:{
                $elemMatch:{
                    accessKey: accessKey,
                    permissionList: {$in: permissionList }
                }
            }
        })
    }

    /********** document management ***********************************************************************************/

    _insertAccessDocument(documentId ) {
        this.accessCollection.insert({ documentId: documentId, accessKeyList: [] });
    }

    _insertAccessDocumentOwner(documentId, ownerId ) {
        var accessModel = {
            documentId: documentId,
            accessKeyList: [{accessKey: ownerId, permissionList: [AccessManager.DefaultPermissionEnum.Owner]}]
        };
        this.accessCollection.insert(accessModel);
    }

    _deleteAccessDocument( documentId ) {
        this.accessCollection.remove({documentId: documentId});
    }

    /*** permission management ****************************************************************************************/

    _hasPermission(documentId, accessKey, permissionQuery) {
        return this.accessCollection.findOne({
            documentId: documentId,
            accessKeyList:{ $elemMatch:{ accessKey: accessKey, permissionList: permissionQuery } }
        });
    }
    
    _addPermission(accessModel, accessKey, permission) {
        var accessKeyModel = accessModel.accessKeyList.find((element)=> { return element.accessKey == accessKey });
        if (!accessKeyModel){
            accessKeyModel = {accessKey: accessKey, permissionList: [] };
            accessModel.accessKeyList.push( accessKeyModel );
        }
        if (accessKeyModel.permissionList.indexOf(permission) == -1) accessKeyModel.permissionList.push(permission);
    }

    _removePermission(accessModel, accessKey, permission) {
        var keyIndex = accessModel.accessKeyList.findIndex( (element)=> { return element.accessKey == accessKey });
        if (keyIndex == -1) return;
        var accessKeyModel = accessModel.accessKeyList[keyIndex];
        var permIndex = accessKeyModel.permissionList.indexOf(permission);
        if (permIndex != -1) accessKeyModel.permissionList.splice(permIndex, 1);
        if (accessKeyModel.permissionList.length == 0) accessModel.accessKeyList.splice(keyIndex,1);
    }
};

AccessManager.DefaultPermissionEnum = {
    Owner: 'owner',
    Read: 'read',
    Modify: 'modify',
    Delete: 'delete',
    Shared: 'shared',
    Share: 'share',
};

Object.freeze(AccessManager.DefaultPermissionEnum);