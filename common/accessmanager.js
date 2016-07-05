/**
 * Created by Greg on 6/28/2016.
 */

import '/common/chimerapatterns'
var MulticastEvent = Pattern.Multicast.MulticastEvent;


AccessModel = class AccessModel{
    constructor({documentId, accessKey, permissionList }) {
        this.documentId = documentId;
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


        this.accessCollection._ensureIndex({ documentId: 1});
        this.accessCollection._ensureIndex({ accessKey: 1});

        //this.accessCollection.rawCollection().ensureIndex({ documentId: 1 });
        //this.accessCollection.rawCollection().ensureIndex({ accessKey: 1 });
        
        /*** event bindings *******************************************************************************************/
       if (options.autoAssignOwner)
            Pattern.Aspect.onMethodExit(this.documentCollection, 'insert', (documentId, args)=> {
                this.addPermissions(documentId, Meteor.userId(), AccessManager.DefaultPermEnum.Owner );
            });

        if (options.autoDelete) this.onDocumentDelete( (document)=> { this.accessCollection.remove({documentId: document._id}); });
        
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

    getAccessCursorByAccessKey( accessKey ) {
        return this.accessCollection.find( { accessKey: accessKey } );
    }

    getAccessCursorByAccessKeyAndAnyPerm(accessKey,permissions) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        return this.accessCollection.find( {accessKey: accessKey, permissionList: {$in: permissions} } );
    }

    getAccessCursorByAccessKeyAndAllPerm(accessKey,permissions) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        return this.accessCollection.find( {accessKey: accessKey, permissionList: {$all: permissions} } );
    }

    getDocCursorByAccessKey( accessKey ) {
        var accessModels = this.accessCollection.find({ accessKey: accessKey });
        this.documentCollection.find( accessModels.map( (element)=>{ return element.documentId }) );
    }

    getDocCursorByAccessKeyAndAnyPerm(accessKey,permissions) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        var accessModels = this.accessCollection.find(
            { accessKey: accessKey, permissionList: {$in: permissions } }, {fields:{ documentId: 1, _id: 0 }}).fetch();
        this.documentCollection.find( accessModels.map( (element)=>{ return element.documentId }) );
    }

    getDocCursorByAccessKeyAndAllPerm(accessKey,permissions) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        var accessModels = this.accessCollection.find(
            { accessKey: accessKey, permissionList: {$all: permissions } }, {fields:{ documentId: 1, _id: 0 }}).fetch();
        this.documentCollection.find( accessModels.map( (element)=>{ return element.documentId }) );
    }

    findDocIdsByAccessKey (accessKey) {
        var accessModels = this.accessCollection.find( { accessKey: accessKey },{fields:{ documentId: 1, _id: 0 }}).fetch();
        console.log(accessModels);
        return accessModels.map( (element)=>{ return element.documentId });
    }

    findDocIdsByAccessKeyAndAnyPerm ( accessKey, permissions ) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        var accessModels = this.accessCollection.find(
            { accessKey: accessKey, permissionList: {$in: permissions } }, {fields:{ documentId: 1, _id: 0 }}).fetch();
        return accessModels.map( (element)=>{ return element.documentId });
    }

    findDocIdsByAccessKeyAndAllPerm ( accessKey, permissions ) {
        if (!(permissions instanceof Array)) permissions = [permissions];
        var accessModels = this.accessCollection.find(
            { accessKey: accessKey, permissionList: {$all: permissions } }, {fields:{ documentId: 1, _id: 0 }}).fetch();
        return accessModels.map( (element)=>{ return element.documentId });
    }

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