var app = angular.module('iSEEit', ['ngRoute', 'ngCookies', 'ui.bootstrap', 'infinite-scroll', 'ngTagsInput', 'ui.bootstrap.datetimepicker', 'ui.tree', 'angularTreeview', 'monospaced.elastic','ngDraggable', 'imageupload', 'angulartics', 'angulartics.google.analytics']);

window.routes = {
    "/": {
        templateUrl: 'html/pages/Login-Register/login.html',
        controller: 'identityCtrl',
        requireLogin: false
    },
    "/authenticate": {
        templateUrl: 'html/pages/Login-Register/login.html',
        controller: 'identityCtrl',
        requireLogin: false
    },
    "/dashboard": {
        templateUrl: 'html/pages/Dashboard/dashboard-container.html',
        controller: 'dashboardCtrl',
        requireLogin: true
    },
    "/contacts/:id": {
        templateUrl: 'html/pages/Contact/single-contact-container.html',
        controller: 'contactCtrl',
        requireLogin: false
    },
    "/contacts": {
        templateUrl: 'html/pages/Contact/contacts-container.html',
        controller: 'contactsCtrl',
        requireLogin: false
    },
    "/user": {
        templateUrl: 'html/pages/User/user-container.html',
        controller: 'userCtrl',
        requireLogin: true
    },
    "/leads": {
        templateUrl: 'html/pages/Lead/lead-container.html',
        controller: 'leadsCtrl',
        requireLogin: true
    },
    "/leads/:id": {
        templateUrl: 'html/pages/Lead/single-lead-container.html',
        controller: 'leadCtrl',
        requireLogin: true
    },
    "/companies": {
        templateUrl: 'html/pages/Company/companies-container.html',
        controller: 'companiesCtrl',
        requireLogin: true
    },
    "/companies/:id": {
        templateUrl: 'html/pages/Company/single-company-container.html',
        controller: 'companyCtrl',
        requireLogin: true
    },
    "/deals": {
        templateUrl: 'html/pages/Deal/deals-container.html',
        controller: 'dealsCtrl',
        requireLogin: true
    },
    "/deals/:id": {
        templateUrl: 'html/pages/Deal/single-deal-container.html',
        controller: 'dealCtrl',
        requireLogin: true
    },
    "/tasks":     {
        templateUrl:  'html/pages/Task/tasks-container.html',
        controller:   'tasksCtrl',
        requireLogin: true
    },
    "/tasks/:id": {
        templateUrl:  'html/pages/Task/tasks-container.html',
        controller:   'tasksCtrl',
        requireLogin: true
    },
    "/tasks/:id/meeting-minutes": {
        templateUrl:  'html/pages/Meeting-Minutes/meeting-minutes-container.html',
        controller:   'meetingMinutesCtrl',
        requireLogin: true
    },
    "/tasks/:id/meeting-minutes/:id": {
        templateUrl:  'html/pages/Meeting-Minutes/meeting-minutes-container.html',
        controller:   'meetingMinutesCtrl',
        requireLogin: true
    },
    "/admin": {
        templateUrl: 'html/pages/Admin/admin-container.html',
        controller: 'adminCtrl',
        requireLogin: true
    },
    "/admin-console": {
        templateUrl: 'html/pages/Admin/admin-console-container.html',
        controller: 'adminCtrl',
        requireLogin: false,
        requireSpecialLogin: true
    },
    "/settings-console": {
        templateUrl: 'html/pages/User/settings-console-container.html',
        controller: 'userCtrl',
        requireLogin: false,
        requireSpecialLogin: true
    }
};

app.config(['$routeProvider', '$locationProvider', function ($routeProvider) {
    for (var path in window.routes) {
        $routeProvider.when(path, window.routes[path]);
    }

    $routeProvider.otherwise({redirectTo: '/'});

}]).run(['$rootScope', '$location', '$cookieStore', function ($rootScope, $location, $cookieStore) {
    $rootScope.$on("$routeChangeStart", function (event, next, current) {  
                if(localStorage['authenticateduser']==true ){
                    $rootScope.verticalMenu = 'html/templates/mainMenu.html';
            
                }

    });
}]);

