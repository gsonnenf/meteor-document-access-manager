/**
 * Created by Greg on 7/2/2016.
 */

/**
 * Created by Greg on 6/28/2016.
 */
import '/common/framework_accessmanager'

ExampleDocumentCollection = new Mongo.Collection('ExampleDocumentCollection');
ExampleAccessCollection = new Mongo.Collection('ExampleAccessCollection');

exampleAccessManager = new AccessManager({
    documentCollection: ExampleDocumentCollection,
    accessCollection: ExampleAccessCollection,
    options: {autoAssignOwner: true}
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
