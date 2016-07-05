/**
 * Created by Greg on 6/29/2016.
 */

import '/server/publish_exampleaccessmanager'
import '/common/accessmanager'


describe('AccessManager', function() {
    TestCollection = new Mongo.Collection('TestCollection');
    TestAccessCollection = new Mongo.Collection('TestAccessCollection');
    TestCollection.remove({});
    TestAccessCollection.remove({});
    var permEnum = AccessManager.DefaultPermEnum;
    
    var testAccessManager;
   
    var mockStringGenerator = function func( text ) {
        if (!func.counter) func.counter = 0;
        if (! text ) text = 'string';
        return text + func.counter++;
    };


    after(function() {
        TestCollection.remove({});
        TestAccessCollection.remove({});
        TestCollection.rawCollection().drop();
        TestAccessCollection.rawCollection().drop();

    });


    it('should create an access manager', function() {
        testAccessManager = new AccessManager({
            documentCollection: TestCollection,
            accessCollection: TestAccessCollection
        });
        assert(testAccessManager);
    });

    it('should create a permission document with owner perm and check to see that it was created properly', function () {
        var testDocId = mockStringGenerator('id');
        var testKey = mockStringGenerator('key');
        testAccessManager.addPermissions( testDocId, testKey, permEnum.Owner  );
        var accessDoc = TestAccessCollection.findOne({documentId: testDocId});
        assert( accessDoc );
        assert.equal( accessDoc.accessKey, testKey, "accesskey is set" );
        assert.equal( accessDoc.documentId, testDocId, "documentId is set");
        assert.sameMembers( accessDoc.permissionList, [permEnum.Owner], "documentId is set");
    });

    it('tests if a single permission can be inserted and detected using accessManager.has*Permission', function () {
        var testKey = mockStringGenerator('key');
        var testDocId = mockStringGenerator('id');
        var testPerm = mockStringGenerator('testPerm');
        testAccessManager.addPermissions( testDocId, testKey, testPerm);

        var extraPerm = mockStringGenerator('testPerm');
        var failPerm = mockStringGenerator('testPerm');
        var failKey = mockStringGenerator('key');

        assert( testAccessManager.hasPermissionAny( testDocId, testKey, testPerm), "should grant access");
        assert( testAccessManager.hasPermissionAny( testDocId, testKey, [testPerm]), "should grant access");
        assert( testAccessManager.hasPermissionAny( testDocId, testKey, [testPerm,extraPerm]), "should grant access");

        assert( !testAccessManager.hasPermissionAny( testDocId, failKey, [testPerm]), "should deny access");
        assert( !testAccessManager.hasPermissionAny( testDocId, testKey, [failPerm]), "should deny access");


        assert( testAccessManager.hasPermissionAll( testDocId, testKey, testPerm), "should grant access");
        assert( testAccessManager.hasPermissionAll( testDocId, testKey, [testPerm]), "should grant access");

        assert( !testAccessManager.hasPermissionAll( testDocId, failKey, [testPerm]), "should deny access");
        assert( !testAccessManager.hasPermissionAll( testDocId, testKey, [failPerm]), "should deny access");
        assert( !testAccessManager.hasPermissionAll( testDocId, testKey, [testPerm,extraPerm]), "should deny access");
    });

    it('tests if a remove permission is working', function () {
        var testKey = mockStringGenerator('key');
        var testDocId = mockStringGenerator('id');
        var testPerm = mockStringGenerator('testPerm');
        testAccessManager.addPermissions( testDocId, testKey, testPerm);
        var accessDoc = TestAccessCollection.findOne({documentId: testDocId});
        assert.equal( accessDoc.accessKey, testKey, "key found in db doc" );
        assert.sameMembers( accessDoc.permissionList, [testPerm], "perm found in db doc");

        var failPerm = mockStringGenerator('testPerm');

        assert( testAccessManager.hasPermissionAny( testDocId, testKey, testPerm), "should find permission.");
        assert( !testAccessManager.hasPermissionAny( testDocId, testKey, failPerm ), "should deny access on fail parameter.");
        testAccessManager.removePermissions( testDocId, testKey, testPerm );
        assert.equal( testAccessManager.hasPermissionAny( testDocId, testKey, testPerm), null, "confirms permission removed");

    });

    it('tests if a remove permission works for multiple elements', function () {
        var testKey2 = mockStringGenerator('key');
        var testDocId2 = mockStringGenerator('id');
        var testPermA = mockStringGenerator('testPerm');
        var testPermB = mockStringGenerator('testPerm');
        var testPermC = mockStringGenerator('testPerm');

        testAccessManager.addPermissions( testDocId2, testKey2, testPermA );
        testAccessManager.addPermissions( testDocId2, testKey2, testPermB );
        testAccessManager.addPermissions( testDocId2, testKey2, testPermC );

        assert( testAccessManager.hasPermissionAny( testDocId2, testKey2, testPermA ), "should find permission.");
        assert( testAccessManager.hasPermissionAny( testDocId2, testKey2, testPermB ), "should find permission.");
        assert( testAccessManager.hasPermissionAny( testDocId2, testKey2, testPermC ), "should find permission.");

        testAccessManager.removePermissions( testDocId2, testKey2, testPermB);

        assert( testAccessManager.hasPermissionAny( testDocId2, testKey2, testPermA), "should find permission.");
        assert( !testAccessManager.hasPermissionAny( testDocId2, testKey2, testPermB), "should not find permission.");
        assert( testAccessManager.hasPermissionAny( testDocId2, testKey2, testPermC), "should find permission.");

    });

    it('tests if multiple permission can be inserted and detected using accessManager.has*Permission', function () {
        var testDocId = mockStringGenerator('id');
        var testKey1 = mockStringGenerator('key');
        var testKey2 = mockStringGenerator('key');
        var testPerm1 = mockStringGenerator('testPerm');
        var testPerm2 = mockStringGenerator('testPerm');
        var testPerm3 = mockStringGenerator('testPerm');
        var testPerm4 = mockStringGenerator('testPerm');

        testAccessManager.addPermissions( testDocId, testKey1, testPerm1);
        testAccessManager.addPermissions( testDocId, testKey1, testPerm2);

        testAccessManager.addPermissions( testDocId, testKey2, testPerm3);
        testAccessManager.addPermissions( testDocId, testKey2, testPerm4);

        //Test key 1 - hasPermissionAny
        assert( testAccessManager.hasPermissionAny( testDocId, testKey1, testPerm1) );
        assert( testAccessManager.hasPermissionAny( testDocId, testKey1, testPerm2) );
        assert( !testAccessManager.hasPermissionAny( testDocId, testKey1, testPerm3) );
        assert( !testAccessManager.hasPermissionAny( testDocId, testKey1, testPerm4) );

        assert( testAccessManager.hasPermissionAny( testDocId, testKey1, [testPerm1]) );
        assert( testAccessManager.hasPermissionAny( testDocId, testKey1, [testPerm1,testPerm2]) );
        assert( testAccessManager.hasPermissionAny( testDocId, testKey1, [testPerm1,testPerm2,testPerm3]) );
        assert( testAccessManager.hasPermissionAny( testDocId, testKey1, [testPerm2,testPerm3]) );
        assert( !testAccessManager.hasPermissionAny( testDocId, testKey1, [testPerm3]) );

        //Test key 2 - hasPermissionAny
        assert( !testAccessManager.hasPermissionAny( testDocId, testKey2, testPerm1) );
        assert( !testAccessManager.hasPermissionAny( testDocId, testKey2, testPerm2) );
        assert( testAccessManager.hasPermissionAny( testDocId, testKey2, testPerm3) );
        assert( testAccessManager.hasPermissionAny( testDocId, testKey2, testPerm4) );

        assert( !testAccessManager.hasPermissionAny( testDocId, testKey2, [testPerm1]) );
        assert( !testAccessManager.hasPermissionAny( testDocId, testKey2, [testPerm1,testPerm2]) );
        assert( testAccessManager.hasPermissionAny( testDocId, testKey2, [testPerm1,testPerm2,testPerm3]) );
        assert( testAccessManager.hasPermissionAny( testDocId, testKey2, [testPerm2,testPerm3]) );
        assert( testAccessManager.hasPermissionAny( testDocId, testKey2, [testPerm3]) );

        //Test key 1 - hasPermissionAll
        assert( testAccessManager.hasPermissionAll( testDocId, testKey1, [testPerm1]) );
        assert( testAccessManager.hasPermissionAll( testDocId, testKey1, [testPerm1,testPerm2]) );
        assert( !testAccessManager.hasPermissionAll( testDocId, testKey1, [testPerm1,testPerm2,testPerm3]) );
        assert( !testAccessManager.hasPermissionAll( testDocId, testKey1, [testPerm2,testPerm3]) );
        assert( !testAccessManager.hasPermissionAll( testDocId, testKey1, [testPerm3]) );

        //Test key 2 - hasPermissionAll
        assert( !testAccessManager.hasPermissionAll( testDocId, testKey2, [testPerm1]) );
        assert( !testAccessManager.hasPermissionAll( testDocId, testKey2, [testPerm1,testPerm2]) );
        assert( !testAccessManager.hasPermissionAll( testDocId, testKey2, [testPerm1,testPerm2,testPerm3]) );
        assert( !testAccessManager.hasPermissionAll( testDocId, testKey2, [testPerm2,testPerm3]) );
        assert( testAccessManager.hasPermissionAll( testDocId, testKey2, [testPerm3]) );

    });

    it('should fetch all access documents for a specific accessKey', function(){
        TestAccessCollection.remove({});
        var testKey1 = mockStringGenerator('key');
        var testKey2 = mockStringGenerator('key');
        var testKey3 = mockStringGenerator('key');
        var testKey4 = mockStringGenerator('key');

        var testDocId1 = mockStringGenerator('id');
        var testDocId2 = mockStringGenerator('id');
        var testDocId3 = mockStringGenerator('id');
        var testPerm = mockStringGenerator('perm');
        var testPerm2 = mockStringGenerator('perm');
        var testPerm3 = mockStringGenerator('perm');


        testAccessManager.addPermissions( testDocId1, testKey1, testPerm);

        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey1), [testDocId1], "correct key");
        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey2), [], "wrong key");

        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndAnyPerm(testKey1,[testPerm]), [testDocId1], "correct key/correct perm");
        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndAnyPerm(testKey1, [testPerm2]), [], "correct key/wrong perm");

        testAccessManager.addPermissions( testDocId2, testKey1, testPerm);
        testAccessManager.addPermissions( testDocId2, testKey2, testPerm);
        testAccessManager.addPermissions( testDocId2, testKey3, testPerm);
        testAccessManager.addPermissions( testDocId3, testKey3, testPerm2);
        testAccessManager.addPermissions( testDocId3, testKey3, testPerm2);
        testAccessManager.addPermissions( testDocId3, testKey3, testPerm3);

        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey1), [testDocId1,testDocId2]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey2), [testDocId2]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey3), [testDocId2,testDocId3]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey4), []);

        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndAnyPerm(testKey1,[testPerm]), [testDocId1,testDocId2]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndAnyPerm(testKey2,[testPerm]), [testDocId2]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndAnyPerm(testKey3,[testPerm]), [testDocId2]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndAnyPerm(testKey4, [testPerm]), []);

        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndAllPerm(testKey3,[testPerm]), [testDocId2]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndAllPerm(testKey3,[testPerm2,testPerm3]), [testDocId3]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndAnyPerm(testKey4, [testPerm,testPerm2,testPerm3]), []);

    });


/*
    it('tests access time for 1k documents insertion', function () {
        mockStringGenerator.counter = 0;
        TestAccessCollection.remove({});
        var testPerm1 = mockStringGenerator('testPerm');
        var testPerm2 = mockStringGenerator('testPerm');
        var testPerm3 = mockStringGenerator('testPerm');
        var testPerm4 = mockStringGenerator('testPerm');

        this.timeout(100000);
        for (let i = 1000; i > 0; i--) {
            let docId = mockStringGenerator('id');
            let testKey = mockStringGenerator('testKey');

            testAccessManager._insertAccessDocument(docId);
            testAccessManager.addPermission(docId, testKey, testPerm1);
            testAccessManager.addPermission(docId, testKey, testPerm2);
        }
    });

    it('tests access time for 100 documents search', function () {
        mockStringGenerator.counter = 0;
        var testPerm1 = mockStringGenerator('testPerm');
        var testPerm2 = mockStringGenerator('testPerm');
        var testPerm3 = mockStringGenerator('testPerm');
        var testPerm4 = mockStringGenerator('testPerm');

        this.timeout(30000);
        for (let i = 100; i > 0; i--) {
            let docId = mockStringGenerator('id');
            let testKey = mockStringGenerator('testKey');
            assert( testAccessManager.hasPermission(docId, testKey, testPerm1) );
        }
    });
*/


});

