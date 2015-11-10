app.controller('userCtrl', [
    '$scope',
    '$rootScope',
    '$location',
    '$timeout',
    '$cookieStore',
    'errorService',
    'myModalService',
    'errorModalService',
    'utilSrv',
    'validateSrv',
    'salesForceService',
    'requestManagerService',
    '$filter',
    '$http',
    'countriesService',
    function ($scope, $rootScope, $location, $timeout, $cookieStore, errorService, myModalService, errorModalService, utilSrv, validateSrv, salesForceService, requestManagerService, $filter, $http, countriesService) {

        initRootScope();
        initControllerScope();
        initialRequest();

        function initRootScope() {
            $rootScope.tabs = [
                {
                    tabTitle: "Change Password",
                    tabIcon: "icon-outbound",
                    tabCls: "change-password",
                    tabAction: function () {
                        $scope.activeSection = "change-password";
                    }
                },
                {
                    tabTitle: "Log Out",
                    tabIcon: "icon-logoout",
                    tabCls: "logoout",
                    tabAction: function () {
                        myModalService.setModalContent('Logout', 'Are you sure you want to logout?', 'No', 'Yes');
                        $('#myModal').modal('show');
                        myModalService.setModalDeclineAction($scope.dismissModal);
                        myModalService.setModalAcceptAction($scope.logout);
                    }
                },
                {
                    tabTitle: "Change Profile",
                    tabIcon: "icon-changeprofile",
                    tabCls: "changeprofile",
                    tabAction: function () {
                        $scope.getOrganisationsModal();
                    }
                }
            ];
            $rootScope.helpPage = "http://static.iseeit.com/help/setting";
            $rootScope.search = {
                hideSearch: true
            };

            $rootScope.$watch('uploadedImage', function (newVal, oldVal) {
                if (newVal) {
                    var path = $location.path().split('/');
                    var	isUser = path.indexOf('user') > -1;
                    var base64String = newVal.resized.dataURL.split(',')[1];
                    if ($scope.userProfile && $scope.userProfile.basicInfo && isUser) {
                        $scope.userProfile.basicInfo.imageData = base64String;
                        updateBasicDetails(true);
                    }
                }
            });
        }

        function initControllerScope() {
            $scope.userProfile = {};
            $scope.socialNewtorks = [];
            $scope.contactInfo = {};
            $scope.userSocialAccounts = {};
            $scope.basicDetailsData = {};
            $scope.userLoaded = false;
            $scope.validNewPswd = false;
            $scope.validConfirmPswd = false;
            $scope.validOldPswd = false;
            $scope.activeSection = "";
            $scope.validateTel = validateSrv.validateTel;
            $scope.validateEmail = validateSrv.validateEmail;
            $scope.setImage = utilSrv.setImage;
            $scope.countries = countriesService.getCountries();

            $scope.changeActiveSection = changeActiveSection;
            $scope.showSection = showSection;
            $scope.dismissModal = dismissModal;

            $scope.getProfile = getProfile;
            $scope.setSocialNetworksModelFormat = setSocialNetworksModelFormat;
            $scope.setSocialNetworksServerFormat = setSocialNetworksServerFormat;

            $scope.logout = logout;
            $scope.setNewPassword = setNewPassword;
            $scope.validateNewPassword = validateNewPassword;
            $scope.validateConfirmPassword = validateConfirmPassword;
            $scope.verifyOldPswd = verifyOldPswd;

            $scope.updateBasicDetails = updateBasicDetails;
            $scope.updateContactInformation = updateContactInformation;
            $scope.addField = addField;
            $scope.updateUserSocialAccounts = updateUserSocialAccounts;
            $scope.getEA = getEA;

            $scope.linkSalesForce = linkSalesForce;
            $scope.unlinkSalesForce = unlinkSalesForce;
        }

        function initialRequest() {
            if (localStorage['auth']) {
                $scope.isAuthenticated = true;
                $scope.getProfile(localStorage['id']);
            }
            else {
                $scope.isAuthenticated = false;
            }
        }

        function getProfile(data) {
            if (data) {
                var requestObj = {
                    event: 'getProfile',
                    payload: {
                        id: data
                    }
                };

                requestManagerService.membersRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $scope.isAuthenticated = true;
                            $scope.userProfile = response.payload;
                            $scope.userProfile.basicInfo.imageData = $scope.userProfile.basicInfo.imageURL || "images/placeholder_contact-big.png";
                            $scope.userProfile.basicInfo.imageURL = $scope.userProfile.basicInfo.imageData;
                            $scope.userProfile.currentView = "user";
                            $scope.userLoaded = true;
                            $scope.hasName = true;
                            $scope.hasSurname = true;
                            setSocialNetworksModelFormat(response.payload.socialNetworks);
                            sortContactInfo();
                            localStorage['profileImage'] = $scope.userProfile.basicInfo.imageURL || "images/placeholder_contact-big.png";
                        }
                    });
            }

            function sortContactInfo() {
                var mobilePhoneNumber = [],
                    personalPhoneNumber = [],
                    officePhoneNumber = [],
                    emailAddress = [],
                    others = [],
                    contactInfo = $scope.userProfile.contactInformation;

                for (var i = 0; contactInfo && i < contactInfo.length; i++) {
                    if (contactInfo[i].contactType == 'mobilePhoneNumber') {
                        mobilePhoneNumber.push(contactInfo[i]);
                    }
                    else if (contactInfo[i].contactType == 'personalPhoneNumber') {
                        personalPhoneNumber.push(contactInfo[i]);
                    }
                    else if (contactInfo[i].contactType == 'officePhoneNumber') {
                        officePhoneNumber.push(contactInfo[i]);
                    }
                    else if (contactInfo[i].contactType == 'emailAddress') {
                        emailAddress.push(contactInfo[i]);
                    }
                    else {
                        others.push(contactInfo[i]);
                    }
                }
                $scope.userProfile.contactInformation = mobilePhoneNumber.concat(personalPhoneNumber, officePhoneNumber, emailAddress, others);
            }
        }

        function setSocialNetworksModelFormat(data) {
            for (var i = 0; i < data.length; i += 1) {
                $scope.socialNewtorks[data[i].name] = data[i].URL;
                $scope.userSocialAccounts[data[i].name] = data[i].URL;
            }
        }

        function setSocialNetworksServerFormat(userSocialAccountsData) {
            var socialNewtorks = [];

            if (userSocialAccountsData['facebook']) {
                socialNewtorks.push({name: 'facebook', URL: userSocialAccountsData['facebook']});
            }
            if (userSocialAccountsData['linkedIn']) {
                socialNewtorks.push({name: 'linkedIn', URL: userSocialAccountsData['linkedIn']});
            }
            if (userSocialAccountsData['googlePlus']) {
                socialNewtorks.push({name: 'googlePlus', URL: userSocialAccountsData['googlePlus']});
            }
            if (userSocialAccountsData['twitter']) {
                socialNewtorks.push({name: 'twitter', URL: userSocialAccountsData['twitter']});
            }
            return socialNewtorks;
        }

        function dismissModal() {
            angular.element('#myModal').modal('hide');
        }

        function logout() {
            try {
                localStorage.removeItem('authenticated');
                localStorage.removeItem('aux');
                localStorage.removeItem('auth');
                localStorage.removeItem('user');
                localStorage.removeItem('id');
                localStorage.removeItem('nextStep');
                localStorage.removeItem('isAdmin');
                localStorage.removeItem('profileImage');
                $cookieStore.remove('auth');
            }
            catch (e) {
            }
            $location.path('/');
            dismissModal();
        }

        function setNewPassword(changePasswordModel) {
            var valid = $scope.validOldPswd && $scope.validConfirmPswd && $scope.validNewPswd;

            if (valid) {
                var requestObj = {
                    event: 'changePassword',
                    payload: {
                        newPassword: changePasswordModel.newPassword
                    }
                };

                requestManagerService.identityRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            var aux = Base64.decode(localStorage['auth']).split(":");

                            aux[1] = changePasswordModel.newPassword;
                            localStorage['auth'] = Base64.encode(aux[0] + ':' + aux[1] + ':' + aux[2] + ':' + aux[3]);
                            errorModalService.setErrorModal('Success', 'Password succesfully changed!');
                            angular.element('#errorModal').modal('show');
                        }
                    });
            }
        }

        function validateNewPassword(changePassword, pristine) {
            if (pristine) {
                $scope.validNewPswd = false;
                return true;
            }
            if (changePassword && changePassword.length >= 6) {
                $scope.validNewPswd = true;
                return true;
            }
            $scope.validNewPswd = false;
            return false;
        }

        function validateConfirmPassword(changePassword, pristine) {
            if (pristine) {
                $scope.validConfirmPswd = false;
                return true;
            }
            if (changePassword && changePassword.confirmPassword && changePassword.confirmPassword === changePassword.newPassword) {
                $scope.validConfirmPswd = true;
                return true;
            }
            $scope.validConfirmPswd = false;
            return false;
        }

        function verifyOldPswd(oldPswd, pristine) {
            var aux = localStorage['auth'],
                decodedPswd;

            if (aux && oldPswd) {
                decodedPswd = Base64.decode(aux).split(":")[1];
            }
            if (pristine) {
                $scope.validOldPswd = false;
                return true;
            }
            $scope.validOldPswd = (oldPswd === decodedPswd);
            return oldPswd === decodedPswd;
        }

        function changeActiveSection(newActiveSection) {
            $scope.activeSection = newActiveSection;
        }

        function showSection() {
            if ($scope.activeSection === "") {
                return "";
            }
            return "html/pages/User/detailsSection/user_profile-" + $scope.activeSection + ".html";
        }

        function updateBasicDetails(isImage) {
            if (!validateNameAndSurname()) {
                return;
            }
            if (!isImage) {
                delete $scope.userProfile.basicInfo.imageData;
            }

            var requestObj = {
                event: 'updateBasicProfile',
                payload: $scope.userProfile.basicInfo
            };

            requestManagerService.membersRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.userProfile.basicInfo = response.payload;
                        localStorage['profileImage'] = response.payload.imageURL;
                        $scope.hasName = true;
                        $scope.hasSurname = true;
                        $rootScope.$broadcast('topInfoChanged', $scope.userProfile.basicInfo);
                    }
                });

            function validateNameAndSurname() {
                if (!$scope.userProfile.basicInfo.firstName) {
                    $scope.hasName = false;
                }
                if (!$scope.userProfile.basicInfo.lastName) {
                    $scope.hasSurname = false;
                }
                return $scope.hasName && $scope.hasSurname;
            }
        }

        function updateContactInformation(contactInformation) {
            var contactInformation = validateContactInfo(contactInformation);
            var requestObj = {
                event: 'updateContactInformation',
                payload: {
                    contactInformation: contactInformation
                }
            };

            requestManagerService.membersRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.getProfile(localStorage['id']);
                        $scope.userProfile.contactInformation = response.payload.contactInformation;
                    }
                });

            function validateContactInfo(contactInfo) {
                for (var i = 0; contactInfo && i < contactInfo.length; i += 1) {
                    if (!contactInfo[i].contactValue) {
                        contactInfo.splice(i, 1);
                    }
                }
                return contactInfo;
            }
        }

        function addField(array, contactType) {
            array = utilSrv.addDetail(array, contactType);
            $scope.userProfile.currentView = "user";
            $scope.userProfile.contactInformation = array;
        }

        function updateUserSocialAccounts(userSocialAccountsData) {
            for (var prop in userSocialAccountsData) {
                if (!validateSrv.validHttp(userSocialAccountsData[prop]) && userSocialAccountsData[prop]) {
                    userSocialAccountsData[prop] = "http://" + userSocialAccountsData[prop];
                }
            }
            userSocialAccountsData = setSocialNetworksServerFormat(userSocialAccountsData);
            var requestObj = {
                event: 'updateSocialNetworks',
                payload: {
                    socialNetworks: userSocialAccountsData
                }
            };

            requestManagerService.membersRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.userProfile.socialNetworks = response.payload.socialNetworks;
                        $scope.userProfile.currentView = "user"
                        setSocialNetworksModelFormat(response.payload.socialNetworks);
                    }
                });
        }

        /* Start Sales Force Stuff */
        var sf = new salesForceService();
        function linkSalesForce() {
            sf.login();
        }

        function unlinkSalesForce() {
            var requestObj = {
                event: 'updateConnectedProfiles',
                payload: {
                    connectedProfiles: {
                        salesForce: {
                            disconnect: true
                        }
                    }
                }
            };

            requestManagerService.membersRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        getProfile(localStorage['id']);
                    }
                });
        }

        function loginDialogCallback(response) {
            window.salesforce = response;
            if (response && response.access_token) {
                $scope.salesForceInfo = response;
                sf.client.setSessionToken(response.access_token, sf.apiVersion, response.instance_url);
                //sf.client.setRefreshToken(response.refresh_token);
                sf.executeQuery('SELECT user.FirstName, user.LastName FROM user')
                    .then(function (data) {
                        var salesForceInfo = response;
                        localStorage['refresh_token'] = response.refresh_token;
                        localStorage['access_token'] = response.access_token;
                        localStorage['instance_url'] = response.instance_url;
                        var userName = data.records[0].FirstName + ' ' + data.records[0].LastName;
                        salesForceInfo['userName'] = userName;
                        var requestObj = {
                            event: 'updateConnectedProfiles',
                            payload: {
                                connectedProfiles: {
                                    salesForce: salesForceInfo
                                }
                            }
                        };

                        requestManagerService.membersRequest(requestObj)
                            .then(function (response) {
                                if (errorService.validateUserResponse(response)) {
                                    getProfile(localStorage['id']);
                                    if (localStorage['fromSalesForceImport']) {
                                        localStorage.removeItem('fromSalesForceImport');
                                        $location.path('/contacts');
                                    }
                                }
                            });
                    });
            } else {
                console.log("AuthenticationError: No Token");
            }
        }

        if (window.location.hash && window.location.hash.indexOf('access_token') !== -1) {
            var message = decodeURIComponent(window.location.hash.substr(1));
            message = message.substring(message.indexOf('#') + 1, message.length);
            var params = message.split('&'),
                response = {};
            params.forEach(function (param) {
                var splitter = param.split('=');
                response[splitter[0]] = splitter[1];
            });
            loginDialogCallback(response);
        }
        /* End Sales Force Stuff */

        function getEA() {
            var requestObj = {
                event: "configuration",
                payload: {}
            };

            requestManagerService.dealsEARequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        clearEA();
                        var ea = response.payload;
                        $scope.getOrgSettings();
                        $scope.currency = ea.currency;
                        if (ea.yearlyQuota > 0) {
                            $scope.planSection.yearly = true;
                            $scope.yearlyQuota = $filter('customNumber')(ea.yearlyQuota, 2);
                            $scope.hasYQ = true;
                            $scope.yearlyBonusAmount = $filter('customNumber')(ea.yearlyBonusAmount, 2);
                            $scope.quarterlySplit = ea.quarterlySplit;

                            for (var key in $scope.quarterlySplit) {
                                $scope.quarterlySplit[key].target = $filter('customNumber')($scope.quarterlySplit[key].target, 2);
                                $scope.quarterlySplit[key].bonusAmount = $filter('customNumber')($scope.quarterlySplit[key].bonusAmount, 2);
                            }
                            $scope.initPercents();
                        } else {
                            $scope.quarterlySplit = {};
                            $scope.yearlyQuota = null;
                            $scope.planSection.yearly = false;
                            $scope.baselinePercent = null;
                            $scope.hasYQ = false;
                        }

                        if (ea.yearlyBonusAmount && ea.yearlyBonusAmount !== -1 || ea.quarterlySplit.Q1.bonusAmount && ea.quarterlySplit.Q1.bonusAmount !== -1) {
                            $scope.planSection.qBonus = true;
                        } else {
                            $scope.planSection.qBonus = false;
                        }

                        if (ea.variablePay !== -1) {
                            $scope.variablePay = $filter('customNumber')(ea.variablePay, 2);
                            $scope.planSection.variablePay = true;
                            $scope.planSection.rampsKickers = false;
                        } else {
                            $scope.planSection.variablePay = false;
                        }

                        if (ea.baseline > 0) {
                            $scope.baseline = $filter('customNumber')(ea.baseline, 2);
                            $scope.planSection.baseline = true;
                            if ($scope.yearlyQuota && $scope.baseline) {
                                $scope.baselinePercent = $filter('customNumber')(parseFloat($scope.replaceFormatNumber($scope.baseline)) * 100 / parseFloat($scope.replaceFormatNumber($scope.yearlyQuota)), 2);
                            }
                        }

                        if (ea.rampsAndKickers.level1.target !== -1) {
                            $scope.planSection.rampsKickers = true;
                            $scope.rampsAndKickers = ea.rampsAndKickers;
                            $scope.rampsAndKickers.aboveLastLevelCommissionPercentage = $filter('customNumber')($scope.rampsAndKickers.aboveLastLevelCommissionPercentage, 2);

                            for (var key in $scope.rampsAndKickers) {
                                if ($scope.rampsAndKickers[key].target) {
                                    $scope.rampsAndKickers[key].target = $filter('customNumber')($scope.rampsAndKickers[key].target, 2);
                                }
                                if ($scope.rampsAndKickers[key].percent) {
                                    $scope.rampsAndKickers[key].percent = $filter('customNumber')($scope.rampsAndKickers[key].percent, 2);
                                }
                                if ($scope.rampsAndKickers[key].commissionPercentage) {
                                    $scope.rampsAndKickers[key].commissionPercentage = $filter('customNumber')($scope.rampsAndKickers[key].commissionPercentage, 2);
                                }
                            }
                            $scope.initTargetPercents();
                        } else {
                            $scope.rampsAndKickers = {
                                level1: {target: 0},
                                level2: {target: null},
                                level3: {target: null},
                                level4: {target: null}
                            }
                        }
                        $scope.isSaved(true);
                        angular.element('.greyBtn').blur();
                        angular.element('.save-ea').blur();
                    }
                });
        }

        var clearEA = function () {
            $scope.yearlyQuota = $scope.yearlyBonusAmount = $scope.variablePay = $scope.baseline = null;
            $scope.quarterlySplit = $scope.rampsAndKickers = {};
            $scope.planSection.yearly = $scope.planSection.variablePay = $scope.planSection.rampsKickers = $scope.planSection.qBonus = $scope.planSection.baseline = false;
        }

        var loadedOnce = true;
        $rootScope.$on("$locationChangeStart", function (event, next, current) {
            if ($scope.saved === false && loadedOnce) {
                loadedOnce = false;
                if (!confirm("If you leave before submitting your changes will be lost.")) {
                    event.preventDefault();
                }
            }
        });

        var closeEditorWarning = function () {
            return 'If you leave before submitting your changes will be lost.'
        }
        var nothing = function () {
        }

        $scope.$on("EA_IsSAVED", function (event, data) {
            if (data == false) {
                window.onbeforeunload = closeEditorWarning;
            } else {
                window.onbeforeunload = nothing;
            }
        });
        $scope.$on("$destroy", function (event, data) {
            window.onbeforeunload = nothing;
        });

        if ($location.$$url === '/settings-console') {
            $scope.getEA();
            var wrapperStyle = {
                width: '100%',
                minWidth: '1024px'
            };
            var contentStyle = {
                marginLeft: '30px',
                marginTop: '-50px'
            };
            angular.element('.main-wrapper').css(wrapperStyle);
            angular.element('.main-content').css(contentStyle);
            angular.element('#earnings-and-achievements').addClass('in');
        }

        if (localStorage['numberFormattingUS'] == 0) {
            getGeocode();
        }

        if (localStorage['numberFormattingUS'] === 'false') {
            $scope.isLocalEurope = true;
        } else {
            $scope.isLocalEurope = false;
        }

        function getGeocode() {
            var europeanCountries = ['AD', 'AL', 'AT', 'AX', 'BA', 'BE', 'BG', 'BY', 'CH', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FO', 'FR', 'GB', 'GG', 'GI', 'GR', 'HR', 'HU', 'IE', 'IM', 'IS', 'IT', 'JE', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'RU', 'SE', 'SI', 'SJ', 'SK', 'SM', 'UA', 'VA'];
            window.navigator.geolocation.getCurrentPosition(function (position) {
                var userLocation = position.coords;
                var query = encodeURIComponent('select * from geo.placefinder where text="' + userLocation.latitude + ',' + userLocation.longitude + '" and gflags="R"');
//                    var query = encodeURIComponent('select * from geo.placefinder where text="-111.8942634,40.7288257"and gflags="R"');
                var url = 'https://query.yahooapis.com/v1/public/yql?q=' + query + '&format=json&diagnostics=true';
                $http.get(url).then(function (res) {
                    var foundCountry = res.data.query.results.Result.countrycode;
                    if (_.indexOf(europeanCountries, foundCountry) > -1) {
                        localStorage['numberFormattingUS'] = false;
                        $scope.isLocalEurope = true;

                    } else {
                        localStorage['numberFormattingUS'] = true;
                        $scope.isLocalEurope = false;
                    }
                });
            }, function (error) {
                localStorage['numberFormattingUS'] = true;
                $scope.isLocalEurope = false;
            });
        }

        utilSrv.resizeContainer();
    }]);