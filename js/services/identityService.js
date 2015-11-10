app.factory('identityService', ['$q', 'connectionManagerService', 'userService', function ($q, connectionManagerService, userService) {

    var domain = 'identity',
        cms = connectionManagerService;

    return {
        createUser: function (data) {
            var request = {
                domain: domain,
                event: 'createUser',
                payload: {
                    email: data.email,
                    phone: data.phone,
                    country: data.country,
                    lastName: data.lastName,
                    firstName: data.firstName,
                    company: data.company,
                    position: data.position,
                    password: data.password,
                    invitationCode: data.invitationCode ? data.invitationCode : null
                }
            };

            return cms.sendRequest(request);
        },

        authenticateUser: function (data) {
            var request = {
                domain: domain,
                event: 'authenticateUser',
                payload: {
                    email: data.email,
                    password: data.password
                }
            };

            return cms.sendRequest(request);
        },


        forgotPassword: function (email) {
            var request = {
                domain: "identity",
                event: "forgotPassword",
                payload: {
                    email: email
                }
            };

            return cms.sendRequest(request);
        }
    };
}])