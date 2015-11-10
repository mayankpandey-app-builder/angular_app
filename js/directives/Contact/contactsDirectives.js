app.directive('contactFilters', function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Contact/detailsSection/contact-filters.html'
    };
});

app.directive('contactInfo', function () {
    return {
        restrict:    'E',
        replace:     true,
        templateUrl: 'html/pages/Contact/_contact-info.html',
        link:        function (scope, elemn, attr) {
            scope.contact.fullName = scope.contact.firstName.displayValue + ' ' + scope.contact.lastName;
            scope.contact.imageURL = scope.contact.imageURL || 'images/placeholder_contact-photo.png';
            for (var i = 0; i < scope.contact.contactInformation.length; i += 1) {
                if (scope.contact.contactInformation[i].contactType === 'mobilePhoneNumber') {
                    scope.contact.mobileNo = scope.contact.contactInformation[i].contactValue;
                }
                if (scope.contact.contactInformation[i].contactType === 'emailAddress') {
                    scope.contact.email = scope.contact.contactInformation[i].contactValue;
                }
            }
        }
    };
});