/**
 * Created by Greg on 6/29/2016.
 */

import '/server/publish_exampleaccessmanager'
import '/common/framework_accessmanager'


describe('AccessManager', function() {
    TestCollection = new Mongo.Collection('TestCollection');
    TestAccessCollection = new Mongo.Collection('TestAccessCollection');
    TestCollection.remove({});
    TestAccessCollection.remove({});
    var permEnum = AccessManager.DefaultPermissionEnum;
    
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

    it('should create a permission documents and check to see the docs were created properly', function () {
        var testDocId = mockStringGenerator('id');
        testAccessManager._insertAccessDocument( testDocId );
        var accessDoc = TestAccessCollection.findOne({documentId: testDocId});
        assert( accessDoc );
        assert( accessDoc.accessKeyList instanceof Array );

        var userKey = mockStringGenerator('key');
        var testDocId2 = mockStringGenerator('id');
        testAccessManager._insertAccessDocumentOwner( testDocId2, userKey );
        var accessDoc2 = TestAccessCollection.findOne({documentId: testDocId2});
        assert( accessDoc2 );
        assert.equal( accessDoc2.accessKeyList[0].accessKey, userKey, );
        assert.include( accessDoc2.accessKeyList[0].permissionList, permEnum.Owner);

    });

    it('tests if a single permission can be inserted and detected using accessManager.has*Permission', function () {
        var testKey = mockStringGenerator('key');
        var testDocId = mockStringGenerator('id');
        var testPerm = mockStringGenerator('testPerm');
        testAccessManager._insertAccessDocument( testDocId );
        testAccessManager.addPermission( testDocId, testKey, testPerm);

        var accessDoc = TestAccessCollection.findOne({documentId: testDocId});
        assert.equal( accessDoc.accessKeyList[0].accessKey, testKey, "key found in db doc" );
        assert.include( accessDoc.accessKeyList[0].permissionList, testPerm, "perm found in db doc");

        var extraPerm = mockStringGenerator('testPerm');
        var failPerm = mockStringGenerator('testPerm');
        var failKey = mockStringGenerator('key');

        assert( testAccessManager.hasPermission( testDocId, testKey, testPerm), "access manager found perm.");
        assert( !testAccessManager.hasPermission( testDocId, failKey,testPerm ), "should deny access on fail parameter.");
        assert( !testAccessManager.hasPermission( testDocId, testKey, failPerm ), "should deny access on fail parameter.");

        assert( testAccessManager.hasAnyPermission( testDocId, testKey, [testPerm]), "access manager found perm.");
        assert( testAccessManager.hasAnyPermission( testDocId, testKey, [testPerm,extraPerm]), "access manager found perm.");
        assert( !testAccessManager.hasAnyPermission( testDocId, failKey, [testPerm]), "should deny access on fail parameter.");
        assert( !testAccessManager.hasAnyPermission( testDocId, testKey, [failPerm]), "should deny access on fail parameter.");

        assert( testAccessManager.hasAllPermission( testDocId, testKey, [testPerm]), "access manager found perm.");

        assert( !testAccessManager.hasAllPermission( testDocId, failKey, [testPerm]), "should deny access on fail parameter.");
        assert( !testAccessManager.hasAllPermission( testDocId, testKey, [failPerm]), "should deny access on fail parameter.");
        assert( !testAccessManager.hasAllPermission( testDocId, testKey, [testPerm,extraPerm]), "should deny access on fail parameter.");
    });

    it('tests if a remove permission is working', function () {
        var testKey = mockStringGenerator('key');
        var testDocId = mockStringGenerator('id');
        var testPerm = mockStringGenerator('testPerm');
        testAccessManager._insertAccessDocument( testDocId );
        testAccessManager.addPermission( testDocId, testKey, testPerm);

        var accessDoc = TestAccessCollection.findOne({documentId: testDocId});
        assert.equal( accessDoc.accessKeyList[0].accessKey, testKey, "key found in db doc" );
        assert.include( accessDoc.accessKeyList[0].permissionList, testPerm, "perm found in db doc");

        var failPerm = mockStringGenerator('testPerm');
        var failKey = mockStringGenerator('key');

        assert( testAccessManager.hasPermission( testDocId, testKey, testPerm), "should find permission.");
        assert( !testAccessManager.hasPermission( testDocId, failKey,testPerm ), "should deny access on fail parameter.");
        assert( !testAccessManager.hasPermission( testDocId, testKey, failPerm ), "should deny access on fail parameter.");

        testAccessManager.removePermission( testDocId, testKey, testPerm);
        
        assert( !testAccessManager.hasPermission( testDocId, testKey, testPerm), "confirms permission removed");

    });

    it('tests if a remove permission works for multiple elements', function () {
        var testKey2 = mockStringGenerator('key');
        var testDocId2 = mockStringGenerator('id');
        var testPermA = mockStringGenerator('testPerm');
        var testPermB = mockStringGenerator('testPerm');
        var testPermC = mockStringGenerator('testPerm');
        testAccessManager._insertAccessDocument( testDocId2 );
        testAccessManager.addPermission( testDocId2, testKey2, testPermA );
        testAccessManager.addPermission( testDocId2, testKey2, testPermB );
        testAccessManager.addPermission( testDocId2, testKey2, testPermC );

        assert( testAccessManager.hasPermission( testDocId2, testKey2, testPermA ), "should find permission.");
        assert( testAccessManager.hasPermission( testDocId2, testKey2, testPermB ), "should find permission.");
        assert( testAccessManager.hasPermission( testDocId2, testKey2, testPermC ), "should find permission.");

        testAccessManager.removePermission( testDocId2, testKey2, testPermB);

        assert( testAccessManager.hasPermission( testDocId2, testKey2, testPermA), "should find permission.");
        assert( !testAccessManager.hasPermission( testDocId2, testKey2, testPermB), "should not find permission.");
        assert( testAccessManager.hasPermission( testDocId2, testKey2, testPermC), "should find permission.");

    });

    it('tests if multiple permission can be inserted and detected using accessManager.has*Permission', function () {
        var testDocId = mockStringGenerator('id');
        var testKey1 = mockStringGenerator('key');
        var testKey2 = mockStringGenerator('key');
        var testPerm1 = mockStringGenerator('testPerm');
        var testPerm2 = mockStringGenerator('testPerm');
        var testPerm3 = mockStringGenerator('testPerm');
        var testPerm4 = mockStringGenerator('testPerm');

        testAccessManager._insertAccessDocument( testDocId );
        testAccessManager.addPermission( testDocId, testKey1, testPerm1);
        testAccessManager.addPermission( testDocId, testKey1, testPerm2);

        testAccessManager.addPermission( testDocId, testKey2, testPerm3);
        testAccessManager.addPermission( testDocId, testKey2, testPerm4);

        //Test key 1 - hasPermission
        assert( testAccessManager.hasPermission( testDocId, testKey1, testPerm1) );
        assert( testAccessManager.hasPermission( testDocId, testKey1, testPerm2) );
        assert( !testAccessManager.hasPermission( testDocId, testKey1, testPerm3) );
        assert( !testAccessManager.hasPermission( testDocId, testKey1, testPerm4) );

        //Test key 2 - hasPermission
        assert( !testAccessManager.hasPermission( testDocId, testKey2, testPerm1) );
        assert( !testAccessManager.hasPermission( testDocId, testKey2, testPerm2) );
        assert( testAccessManager.hasPermission( testDocId, testKey2, testPerm3) );
        assert( testAccessManager.hasPermission( testDocId, testKey2, testPerm4) );

        //Test key 1 - hasAnyPermission
        assert( testAccessManager.hasAnyPermission( testDocId, testKey1, [testPerm1]) );
        assert( testAccessManager.hasAnyPermission( testDocId, testKey1, [testPerm1,testPerm2]) );
        assert( testAccessManager.hasAnyPermission( testDocId, testKey1, [testPerm1,testPerm2,testPerm3]) );
        assert( testAccessManager.hasAnyPermission( testDocId, testKey1, [testPerm2,testPerm3]) );
        assert( !testAccessManager.hasAnyPermission( testDocId, testKey1, [testPerm3]) );

        //Test key 2 - hasAnyPermission
        assert( !testAccessManager.hasAnyPermission( testDocId, testKey2, [testPerm1]) );
        assert( !testAccessManager.hasAnyPermission( testDocId, testKey2, [testPerm1,testPerm2]) );
        assert( testAccessManager.hasAnyPermission( testDocId, testKey2, [testPerm1,testPerm2,testPerm3]) );
        assert( testAccessManager.hasAnyPermission( testDocId, testKey2, [testPerm2,testPerm3]) );
        assert( testAccessManager.hasAnyPermission( testDocId, testKey2, [testPerm3]) );

        //Test key 1 - hasAllPermission
        assert( testAccessManager.hasAllPermission( testDocId, testKey1, [testPerm1]) );
        assert( testAccessManager.hasAllPermission( testDocId, testKey1, [testPerm1,testPerm2]) );
        assert( !testAccessManager.hasAllPermission( testDocId, testKey1, [testPerm1,testPerm2,testPerm3]) );
        assert( !testAccessManager.hasAllPermission( testDocId, testKey1, [testPerm2,testPerm3]) );
        assert( !testAccessManager.hasAllPermission( testDocId, testKey1, [testPerm3]) );

        //Test key 2 - hasAllPermission
        assert( !testAccessManager.hasAllPermission( testDocId, testKey2, [testPerm1]) );
        assert( !testAccessManager.hasAllPermission( testDocId, testKey2, [testPerm1,testPerm2]) );
        assert( !testAccessManager.hasAllPermission( testDocId, testKey2, [testPerm1,testPerm2,testPerm3]) );
        assert( !testAccessManager.hasAllPermission( testDocId, testKey2, [testPerm2,testPerm3]) );
        assert( testAccessManager.hasAllPermission( testDocId, testKey2, [testPerm3]) );

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
        var failPerm = mockStringGenerator('perm');
        testAccessManager._insertAccessDocument( testDocId1 );
        testAccessManager.addPermission( testDocId1, testKey1, testPerm);

        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey1), [testDocId1], "correct key");
        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey2), [], "wrong key");

        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndPermList(testKey1,[testPerm]), [testDocId1], "correct key/correct perm");
        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndPermList(testKey1, [failPerm]), [], "correct key/wrong perm");

        testAccessManager._insertAccessDocument( testDocId2 );
        testAccessManager._insertAccessDocument( testDocId3 );
        testAccessManager.addPermission( testDocId2, testKey1, testPerm);
        testAccessManager.addPermission( testDocId2, testKey2, testPerm);
        testAccessManager.addPermission( testDocId2, testKey3, testPerm);
        testAccessManager.addPermission( testDocId3, testKey3, failPerm);

        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey1), [testDocId1,testDocId2]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey2), [testDocId2]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey3), [testDocId2,testDocId3]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKey(testKey4), []);

        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndPermList(testKey1,[testPerm]), [testDocId1,testDocId2]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndPermList(testKey2,[testPerm]), [testDocId2]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndPermList(testKey3,[testPerm]), [testDocId2]);
        assert.sameMembers(testAccessManager.findDocIdsByAccessKeyAndPermList(testKey4, [testPerm]), []);

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

