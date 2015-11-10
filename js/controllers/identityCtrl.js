app.controller('identityCtrl', ['requestManagerService',
    'errorService',
    '$scope',
    '$location',
    '$rootScope',
    'validateSrv',
    'countriesService',
    function (requestManagerService, errorService, $scope, $location, $rootScope, validateSrv, countriesService) {

        initControllerScope();
        initialRequest();

        function initControllerScope() {
            $scope.register = {};
            $scope.passwordStrength = "";
            $scope.showOrganizations = false;
            $scope.loginSubmit = false;
            $scope.registerSubmit = false;
            $scope.agreed = false;

            $scope.typeNumber = /^[0-9]+$/;
            $scope.typePhone = /^[+-.() \d]+$/;
            $scope.typeWord = /^[a-zA-Z ]+$/;

            $scope.validateEmail = validateSrv.validateEmail;
            $scope.isValidField = validateSrv.isValidField;
            $scope.getValidationCls = validateSrv.getValidationCls;
            $scope.countries = countriesService.getCountries();

            $scope.goToView = goToView;
            $scope.proceedFromDemoModal = proceedFromDemoModal;
            $scope.changeHeight = changeHeight;
            $scope.setNextStep = setNextStep;
            $scope.getNextStep = getNextStep;
            $scope.getAuthenticated = getAuthenticated;
            $scope.login = login;
            $scope.getOrgSettings = getOrgSettings;
            $scope.setOrganisation = setOrganisation;
            $scope.agreeWithTerms = agreeWithTerms;
            $scope.submitRegister = submitRegister;
            $scope.showPswdStrength = showPswdStrength;
            $scope.resetPath = resetTaskId;
        }

        function initialRequest() {
            if (localStorage['numberFormattingUS'] === 'false') {
                $scope.isLocalEurope = true;
            } else {
                $scope.isLocalEurope = false;
            }

            loadUserData();
        }

        function goToView(viewName) {
            $location.path(viewName);
        }

        function changeHeight() {
            var nextStep = localStorage['nextStep'] ? JSON.parse(localStorage['nextStep']) : false;

            return {
                "height-100": !nextStep,
                "height-auto": nextStep
            };
        }

        function loadUserData() {
            var nextStep = localStorage['nextStep'];

            $scope.nextStep = nextStep ? JSON.parse(nextStep) : false;
            localStorage['nextStep'] = $scope.nextStep;
        }

        function setNextStep($nextStepVal, registerData) {
            $scope.nextStep = $nextStepVal;
            localStorage['nextStep'] = $nextStepVal;
            if (registerData && registerData.email) {
                $scope.register2['test2'].$setViewValue(
                    $scope.register2['test2'].$modelValue
                );
            }
            if (registerData && registerData.firstName) {
                $scope.register2['firstName'].$setViewValue(
                    $scope.register2['firstName'].$modelValue
                );
            }
            if (registerData && registerData.lastName) {
                $scope.register2['lastName'].$setViewValue(
                    $scope.register2['lastName'].$modelValue
                );
            }
            $scope.register = registerData;
            if (!$nextStepVal) {
                $scope.registerSubmit = false;
                $scope.register = {};
                $scope.register1.$setPristine();
            }
        }

        function getNextStep() {
            return $scope.nextStep;
        }

        function getAuthenticated() {
            return $scope.authenticated;
        }

        function login(loginData, loginForm) {
            $scope.$broadcast("autofill:update");
            $scope.loginSubmit = true;

            if (!localStorage['numberFormattingUS']) {
                localStorage['numberFormattingUS'] = 0;
            }

            var requestObj = {
                event: 'authenticateUser',
                payload: loginData
            };

            if (loginData && loginForm.$valid) {
                 
                requestManagerService.identityRequest(requestObj)
                    .then(function (response) {

                           console.log('show data'+JSON.stringify(response));
                            var authData = response.payload;
                            localStorage.setItem('access token', JSON.stringify(authData.token));
                            $scope.authenticated = true;
                            localStorage['authenticated'] = true;  
                            $scope.loginData = loginData;

                            localStorage.setItem('usertype', JSON.stringify(authData.reply[0].usertype[0].value));


                     
                            if($scope.authenticated == true) {
                                if(authData.reply[0].usertype[0].value==1){
                               $scope.authenticateduser = true;
                                localStorage['authenticateduser'] = true; 
                               // window.location= '#/dashboard';
                                goToView('/dashboard');
                                //$location.path("#/dashboard", true)
                                $scope.isAdmin = true;
                                 $rootScope.verticalMenu = 'html/templates/mainMenu.html';

                            }
                            else{
                                $scope.authenticateduser = false;
                                 $scope.isAdmin = false;

                            }

                            }

                           // $scope.organisations = authData.organizationInformation;

                            /*if ($scope.organisations.length > 1) {
                                $scope.showOrganizations = true;
                            }
                            else {
                                setOrganisation($scope.organisations[0], loginData);
                            }*/
                        
                    });
            }
        }

        function proceedFromDemoModal() {
            $('#sandboxModal').modal('hide');
            goToView('/dashboard');
        }

        function getOrgSettings() {
            var requestObj = {
                event: "memberSettings",
                payload: {}

            }
           
            
            requestManagerService.organizationsRequest(requestObj)
                .then(function (response) {
                    console.log('wewe' +response);
                    if (errorService.validateUserResponse(response)) {
                        $rootScope.isAdmin = response.payload.isAdmin;
                        localStorage['isAdmin'] = $rootScope.isAdmin;
                        getProfile(localStorage['id']);

                        if ($scope.isSandboxed) {
                            $('#sandboxModal').modal('show');
                        }
                        else {
                            goToView('/dashboard');
                        }
                    }
                });
        };

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
                            localStorage['profileImage'] = response.payload.basicInfo.imageURL || "images/placeholder_contact-big.png";
                            localStorage['user'] = response.payload.basicInfo.firstName + ' ' + response.payload.basicInfo.lastName ;
                            $rootScope.$broadcast('topInfoChanged', response.payload.basicInfo);
                        }
                    });
            };
        }

        function setOrganisation(organisationInfo, userInfo) {
            localStorage['user'] = organisationInfo.memberFirstName + " " + organisationInfo.memberLastName;
            localStorage['auth'] = Base64.encode(userInfo.email + ":" + userInfo.password + ":" + organisationInfo.memberId + ":" + organisationInfo.organizationId);
            localStorage['id'] = organisationInfo.memberId;
            getOrgSettings();
        }

        function agreeWithTerms() {
            $scope.agreed = !$scope.agreed;
        }

        function submitRegister(registerData, formValidation) {
            $scope.registerSubmit = true;
            var regMail = RegExp(/[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}/),
                regWord = RegExp("^[a-zA-Z ]+$");
            if (registerData.email && registerData.firstName && registerData.lastName) {
                var emailValidation = evaluateInputField(registerData.email, regMail);
                var firstNameValidation = evaluateInputField(registerData.firstName, regWord);
                var lastNameValidation = evaluateInputField(registerData.lastName, regWord);
            }
            var validSpecial = emailValidation && firstNameValidation && lastNameValidation;

            if (registerData && formValidation.$valid && $scope.agreed && validSpecial) {
                var requestObj = {
                    event: 'createUser',
                    payload: registerData
                };

                requestManagerService.identityRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            var authData = response.payload;
                            $scope.authenticated = true;
                            $scope.isSandboxed = true;
                            var findDemoIndex = _.findIndex(authData.organizationInformation, function (org) {
                                return org.isSandboxed;
                            });
                            if (!findDemoIndex) {
                                findDemoIndex = 0;
                                $scope.isSandboxed = false;
                            }

                            localStorage['authenticated'] = true;
                            localStorage['id'] = authData.organizationInformation[findDemoIndex].memberId;
                            localStorage['user'] = registerData.firstName + " " + registerData.lastName;
                            localStorage['auth'] = Base64.encode(registerData.email + ":" + registerData.password + ":" + authData.organizationInformation[findDemoIndex].memberId + ":" + authData.organizationInformation[findDemoIndex].organizationId);
                            getOrgSettings();
                        }
                    });
            }

            function evaluateInputField(inputValue, expression) {
                return inputValue && expression.test(inputValue);
            }
        }

        function showPswdStrength(input) {
            var regNumber = RegExp(/\d+/),
                regSpec = RegExp(/[!@#$&*]+/),
                regWord = RegExp(/^[a-zA-Z ]+$/),
                strength = 0;

            if (input && input.length > 5) {
                if (regNumber.test(input) || regSpec.test(input)) {
                    strength += 2;
                }
                if (regWord.test(input)) {
                    strength++;
                }
                if (strength > 2) {
                    $scope.passwordStrength = "Strong";
                    return "strongPswd";
                }
                if (strength == 2) {
                    $scope.passwordStrength = "Medium";
                    return "mediumPswd";
                }
                if (strength == 1) {
                    $scope.passwordStrength = "Weak";
                    return "weakPswd";
                }
            } else {
                $scope.passwordStrength = "";
                return "";
            }
        }

        function resetTaskId(){
            $location.path("/task", false);
        }
        
    }]);