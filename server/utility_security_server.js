AccessDeniedError = new Meteor.Error(403, "Access Denied.");

accessDenied = ()=> {
    console.log("Access Denied");
    throw new Meteor.Error(403, "Access Denied.");
};
