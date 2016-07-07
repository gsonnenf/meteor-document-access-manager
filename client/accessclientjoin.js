/**
 * Created by Greg on 7/7/2016.
 */


    
export class AccessClientJoin {
    constructor({documentCollection,accessCollection}) {
        this.documentCollection = documentCollection;
        this.accessCollection = accessCollection;
    }

    subscribe({joinPub=null, docPub=null, accessPub=null}, docCallbacks = undefined) {
        if (joinPub) {
            accessPub = joinPub + 'Access';
            docPub = joinPub + 'Document';
        }
        if(!(accessPub && docPub)) throw Error("Subscription needs publication name parameters.");

        this.accessHandle = Meteor.subscribe(accessPub, {
            onReady: ()=> {
                this.documentHandle = Meteor.subscribe(docPub, docCallbacks);
                this.accessCursor = this.accessCollection.find();
                this.accessCursor.observe({
                    added: ()=> { this.documentHandle.stop(); this.documentHandle = Meteor.subscribe(docPub); },
                    removed: ()=> {this.documentHandle.stop(); this.documentHandle = Meteor.subscribe(docPub); }
                });
            }
        });
        //TODO: Close handle on stops etc.
    }
}