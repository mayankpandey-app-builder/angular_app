app.controller('contactsCtrl', [
    '$timeout',
    '$rootScope',
    '$scope',
    'myModalService',
    'errorModalService',
    'exportModalService',
    'contactService',
    'organizationsService' ,
    '$location',
    'ContactsList',
    'companyService',
    'requestManagerService',
    'connectionManagerService',
    'errorService',
    'utilSrv',
    '$filter',
    function (
        $timeout,
        $rootScope,
        $scope,
        myModalService,
        errorModalService,
        exportModalService,
        contactService,
        organizationsService,
        $location,
        ContactsList,
        companyService,
        requestManagerService,
        connectionManagerService,
        errorService,
        utilSrv,
        $filter) {
    $rootScope.tabs = [
        {
            tabTitle: "Add New Contact",
            tabIcon: "icon-addcontact-menu",
            tabCls: "add-contact",
            tabAction: function () {
                $rootScope.analyticsContext = 'Contacts';
                $rootScope.analyticsAction = 'Create contact';
                $rootScope.analyticsLabel = 'View';
                $scope.activeSection = "add-contact";
                $scope.resetCreateContactForm()
            }
        }/*,
        {
            tabTitle: "Import Contacts",
            tabIcon: "icon-addcontact-menu",
            tabCls: "import-contact-step1",
            tabAction: function () {
                if ($scope.activeSection === "import-contact-step1") {
                    $scope.activeSection = "";
                } else {
                    $rootScope.analyticsContext = 'Contacts';
                    $rootScope.analyticsAction = 'Import contact';
                    $rootScope.analyticsLabel = 'View';
                    $scope.activeSection = "import-contact-step1";
                }
            }

        },
        {
            tabTitle: "Export Contacts",
            tabIcon: "icon-addcontact-menu",
            tabCls: "export-contact-step1",
            tabAction: function () {
                if ($scope.contacts.items.length > 0) {
                    exportModalService.setModalContent($scope.exportFilters, 'Export '+$scope.contacts.items.length+' Contacts', '', 'Cancel', 'Export', $scope.contacts, $scope.filtersPayload, $scope.sortByFilter)
                    $('#exportModal').modal('show');
                } else {
                    errorModalService.setErrorModal('Export', 'You cannot export ' + $scope.contacts.items.length + " contact.");
                    $('#errorModal').modal('show');
                }
            }
        }*/
    ];

    $rootScope.helpPage = "http://static.iseeit.com/help/contacts";

    $rootScope.subTabs = [
        {
            tabTitle: "Merge Contacts",
            tabIcon: "icon-merge",
            tabCls: "merge-contacts",
            tabAction: function () {
                if (selectedContacts.length === 1 || selectedContacts.length > 2) {
                    errorModalService.setErrorModal('Merge', 'You cannot merge ' + selectedContacts.length + " contact(s).");
                    $('#errorModal').modal('show');
                }
                else{
                    myModalService.setModalContent('Merge', 'Are you sure you want to merge selected contacts?', 'Cancel', 'Merge')
                    $('#myModal').modal('show');
                    myModalService.setModalAcceptAction($scope.mergeContacts);
                }

            }
        },
        {
            tabTitle: "Send Email",
            tabIcon: "icon-email",
            tabCls: "send-email",
            tabAction: function(){
                var warning=false;
                for(var i=0;i<selectedEmails.length; i += 1 )
                {
                    if (selectedEmails[i]==undefined){
                        warning=true;
                    }
                }
                if(selectedEmails.toString() != ''){
                    window.location.href = "mailto:" + selectedEmails.toString();
                    if (warning){
                        errorModalService.setErrorModal('Send email', 'Some of selected contacts does not have email addresses.');
                        $('#errorModal').modal('show');
                    }
                }
                else{
                    errorModalService.setErrorModal('Send email', 'No email was provided');
                    $('#errorModal').modal('show');
                }
            }
        },
        {
            tabTitle: "Delete Contact(s)",
            tabIcon: "icon-delete",
            tabCls: "delete-contacts",
            tabAction: function () {
                $rootScope.analyticsContext = 'Contacts';
                $rootScope.analyticsAction = 'Delete contact';
                $rootScope.analyticsLabel = 'View';
                myModalService.setModalContent('Delete', 'Are you sure you want to delete the selected contact(s)? Any associated tasks will not be deleted.', 'Cancel', 'Delete');
                $('#myModal').modal('show');
                //myModalService.setModalDeclineAction();
                myModalService.setModalAcceptAction($scope.deleteContacts);
            }
        },
        {
            tabTitle: "Refer",
            tabIcon: "icon-referral",
            tabCls: "refer-contact",
            tabAction: function () {
                if (selectedReferrals.length === 0) {
                    errorModalService.setErrorModal('Oops!', 'Please select at least one contact to send a referral to.');
                    $('#errorModal').modal('show');
                }
                else {
                    sendReferrals();
                }
            }
        }
    ];
        $rootScope.search = {
            keyupAction: function(text){
                $scope.searchContactsSuggestions(text);
            },
            searchSelectAction: function (item) {
                if (item.id){
                    $scope.redirectToContact(item.id);
                }
            }
        };

    $scope.newContact = {};

    $scope.resetCreateContactForm = function () {
        $scope.firstnameError = false;
        $scope.lastnameError = false;
        $scope.newContact = {
            firstName: "",
            lastName: "",
            company: "",
            position: "",
            email: "",
            mobileNo: "",
            officeNo: "",
            skypeName: ""
        };
    }

    $scope.searchContactsSuggestions = function(searchText){
        contactService.searchSuggestions(searchText)
            .then(function(response){
                    var results = response.payload.results;
                    if (results.length == 0){
                        $scope.searchSuggestionsList = [{displayValue : 'No contacts found!'}];
                    } else {
                        $scope.searchSuggestionsList = results;
                    }
            })
    }

    $scope.goToFilters = function () {
        $scope.activeSection = "";
        $scope.contacts = new ContactsList($scope.sortByFilter);
    }

    $scope.showConflicts = function () {
        if ($scope.partialMatches > 0) {
            $('#importConflictsModal').modal('show');
        }
        else {
            $scope.salesForceImportContacts = [];
            $scope.importSource = "";
            setSelectedContactsNumber();
            $scope.goToFilters();
        }
    }

    function sendReferrals() {
        var filteredReferralsWithoutEmail = _.filter(selectedReferrals, function (referral) {
            return !referral.email;
        });
        if (filteredReferralsWithoutEmail.length === selectedReferrals.length) {
            errorModalService.setErrorModal('Oops!', 'None of the selected contacts have an email address to send a referral to.');
            $('#errorModal').modal('show');
            return;
        }
        if (filteredReferralsWithoutEmail.length === 0 && selectedReferrals.length > 50) {
            errorModalService.setErrorModal('Oops!', "Please select maximum 50 contacts to send a referral to.");
            $('#errorModal').modal('show');
            return;
        }
        if (filteredReferralsWithoutEmail.length > 0) {
            var message = '';
            if (filteredReferralsWithoutEmail.length === 1) {
                message = filteredReferralsWithoutEmail[0].fullName + " doesn't ";
            }
            else {
                var others = filteredReferralsWithoutEmail.length - 1;
                var plural = others === 1 ? 'other' : 'others';
                message = filteredReferralsWithoutEmail[0].fullName + " and " + others + " " + plural + " don't ";
            }
            message += "have an email address to send a referral to. Emails have not been sent, please select only contacts that have an email address.";
            errorModalService.setErrorModal('Oops!', message);
            $('#errorModal').modal('show');
            return;
        }
        if (filteredReferralsWithoutEmail.length === 0) {
            var referrals = _.map(selectedReferrals, function (referral) {
                return referral.email;
            });
            var requestObj = {
                event: 'bulkReferral',
                payload: {
                    emailAddresses: referrals
                }
            };

            requestManagerService.identityRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        errorModalService.setErrorModal('', "Your referral was sent.");
                        $('#errorModal').modal('show');
                    }
                });
        }
    }

    $scope.goToSecondStep = function () {
        selectedImportedContacts = _.filter($scope.salesForceImportContacts, function (sfi) {
            return sfi.isSelected;
        });
        var payload = [];
        for (var i = 0; i < selectedImportedContacts.length; i += 1) {
            var obj = {
                firstName: selectedImportedContacts[i].FirstName,
                lastName: selectedImportedContacts[i].LastName,
                position: selectedImportedContacts[i].Title,
                department: selectedImportedContacts[i].Department,
                contactInformation: [
                    { contactType: 'officePhoneNumber', contactValue: selectedImportedContacts[i].Phone },
                    { contactType: 'mobilePhoneNumber', contactValue: selectedImportedContacts[i].MobilePhone },
                    { contactType: "emailAddress", contactValue: selectedImportedContacts[i].Email }
                ]
            };
            if (selectedImportedContacts[i].street) {
                obj.contactInformation.push({ contactType: 'street', contactValue: selectedImportedContacts[i].street})
            }
            if (selectedImportedContacts[i].city) {
                obj.contactInformation.push({ contactType: 'city', contactValue: selectedImportedContacts[i].city})
            }
            if (selectedImportedContacts[i].postalCode) {
                obj.contactInformation.push({ contactType: 'postalCode', contactValue: selectedImportedContacts[i].postalCode})
            }
            if (selectedImportedContacts[i].state) {
                obj.contactInformation.push({ contactType: 'state', contactValue: selectedImportedContacts[i].state})
            }
            if (selectedImportedContacts[i].country) {
                obj['country'] = selectedImportedContacts[i].country;
            }
            if (selectedImportedContacts[i].imageData) {
                obj['imageData'] = selectedImportedContacts[i].imageData;
            }
            payload.push(obj);
        }
        contactService.createBatchContacts(payload)
            .then(function (response) {
                $scope.partialMatches = 0;
                $scope.exactMatches = 0;
                if (response.payload.conflicts && response.payload.conflicts.length > 0) {
                    $scope.partialMatches = 0;
                    $scope.exactMatches = 0;
                    for (var i = 0; i < response.payload.conflicts.length; i += 1) {
                        if (response.payload.conflicts[i].partialMatch) {
                            $scope.partialMatches += 1;
                        }
                        else {
                            $scope.exactMatches += 1;
                        }
                    }
                    $scope.conflicts = response.payload.conflicts;
                    getEmailFromConflict();
                    $scope.conflictsNumber = $scope.conflicts.length;
                    $scope.newConctacts = payload.length - $scope.conflictsNumber;
                    $scope.activeSection = "import-summary";
                }
                else {
                    $scope.newConctacts = payload.length;
                    $scope.goToSummary();
                }
            });
    }

    var getEmailFromConflict = function () {
        for (var i = 0; i < $scope.conflicts.length; i += 1) {
            for (var j = 0; j < $scope.conflicts[i].new.contactInformation.length; j += 1) {
                if ($scope.conflicts[i].new.contactInformation[j].contactType === 'emailAddress') {
                    $scope.conflicts[i].new['emailAddress'] = $scope.conflicts[i].new.contactInformation[j].contactValue;
                }
            }
            for (var j = 0; j < $scope.conflicts[i].old.contactInformation.length; j += 1) {
                if ($scope.conflicts[i].old.contactInformation[j].contactType === 'emailAddress') {
                    $scope.conflicts[i].old['emailAddress'] = $scope.conflicts[i].old.contactInformation[j].contactValue;
                }
            }
        }
    }

    $scope.goToSummary = function () {
        $scope.activeSection = "import-summary";
    }

    var getConflictPosition = function (conflict) {
        for (var i = 0; i < $scope.selectedConflictsForMerge.length; i += 1) {
            if ($scope.selectedConflictsForMerge[i].contactData === conflict.contactData) {
                return i;
            }
        }
        return -1;
    }

    $scope.selectConflictNew = function (conflict, conflictIndex) {
        var newConflict = {
            contactData: conflict.new,
            merge: false
        };
        var newConflictPosition = getConflictPosition(newConflict);
        var checkboxValue = $('#merge-conflicts-source li:eq(' + conflictIndex + ')').find('input[type=checkbox]').prop('checked');
        if (newConflictPosition === -1) {
            $scope.selectedConflictsForMerge.push(newConflict);
            $('#merge-conflicts li:eq(' + conflictIndex + ') > div').removeClass('selected');
            $('#merge-conflicts-source li:eq(' + conflictIndex + ')').find('input[type=checkbox]').prop('checked', checkboxValue);
        }
        else {
            $('#merge-conflicts li:eq(' + conflictIndex + ') > div').removeClass('selected');
            $('#merge-conflicts-source li:eq(' + conflictIndex + ')').find('input[type=checkbox]').prop('checked', checkboxValue);
            $scope.selectedConflictsForMerge.splice(newConflictPosition, 1);
        }
    }

    var getOldConflictPosition = function (conflict) {
        for (var i = 0; i < $scope.selectedConflictsForMerge.length; i += 1) {
            if ($scope.selectedConflictsForMerge[i].oldContactId === conflict.oldContactId) {
                return i;
            }
        }
        return -1;
    }
    $scope.selectConflictOld = function (conflict, conflictIndex) {
        var oldConflict = {
            contactData: conflict.old,
            merge: false,
            oldContactId: conflict.old.id,
            delete: true
        };
        var oldConflictPosition = getOldConflictPosition(oldConflict);
        var checkboxValue = $('#merge-conflicts-iseeit li:eq(' + conflictIndex + ')').find('input[type=checkbox]').prop('checked');
        if (oldConflictPosition === -1) {
            $scope.selectedConflictsForMerge.push(oldConflict);
            $('#merge-conflicts li:eq(' + conflictIndex + ') > div').removeClass('selected');
            $('#merge-conflicts-iseeit li:eq(' + conflictIndex + ')').find('input[type=checkbox]').prop('checked', checkboxValue);
        }
        else {
            $('#merge-conflicts li:eq(' + conflictIndex + ') > div').removeClass('selected');
            $('#merge-conflicts-iseeit li:eq(' + conflictIndex + ')').find('input[type=checkbox]').prop('checked', checkboxValue);
            $scope.selectedConflictsForMerge.splice(oldConflictPosition, 1);
        }
    }

    $scope.selectedConflictsForMerge = [];
    $scope.selectConflictForMerge = function (conflict, conflictIndex) {
        var mergedConflict = {
            contactData: conflict.new,
            merge: true,
            oldContactId: conflict.old.id
        };

        if ($('#merge-conflicts li:eq(' + conflictIndex + ') > div').hasClass('selected')) {
            $('#merge-conflicts li:eq(' + conflictIndex + ') > div').removeClass('selected');
            $('#merge-conflicts-iseeit li:eq(' + conflictIndex + ')').removeClass('selected');
            $('#merge-conflicts-iseeit li:eq(' + conflictIndex + ')').find('input[type=checkbox]').prop('checked', false);
            $('#merge-conflicts-source li:eq(' + conflictIndex + ')').removeClass('selected');
            $('#merge-conflicts-source li:eq(' + conflictIndex + ')').find('input[type=checkbox]').prop('checked', false);
        }
        else {
            $('#merge-conflicts li:eq(' + conflictIndex + ') > div').addClass('selected');
            $('#merge-conflicts-iseeit li:eq(' + conflictIndex + ')').addClass('selected');
            $('#merge-conflicts-iseeit li:eq(' + conflictIndex + ')').find('input[type=checkbox]').prop('checked', true);
            $('#merge-conflicts-source li:eq(' + conflictIndex + ')').addClass('selected');
            $('#merge-conflicts-source li:eq(' + conflictIndex + ')').find('input[type=checkbox]').prop('checked', true);
        }
        var conflictPosition = getConflictPosition(mergedConflict);
        if (conflictPosition !== -1) {
            if ($scope.selectedConflictsForMerge[conflictPosition].oldContactId) {
                $scope.selectedConflictsForMerge.splice(conflictPosition, 1);
            }
            else {
                $scope.selectedConflictsForMerge[conflictPosition] = mergedConflict;
            }
        }
        else {
            $scope.selectedConflictsForMerge.push(mergedConflict);
        }
    }

    $scope.importConflicts = function () {
        for (var i = 0; i < $scope.selectedConflictsForMerge.length; i += 1) {
            if ($scope.selectedConflictsForMerge[i].delete) {
                $scope.selectedConflictsForMerge.splice(i, 1);
            }
        }
        contactService.manageConflicts($scope.selectedConflictsForMerge)
            .then(function (response) {
                $('#importConflictsModal').modal('hide');
                $scope.salesForceImportContacts = [];
                $scope.importSource = "";
                setSelectedContactsNumber();
                var filtersPayload = getContactsListFiltersPayload();
                $scope.contacts = new ContactsList($scope.sortByFilter, filtersPayload);
                $scope.goToFilters();
            });
    }

    var is_selected = false;
    var selectedContacts = [];
    var selectedEmails = [];
    var selectedReferrals = [];
    $scope.selectCard = function (card, $event) {

        $($event.target).parents('.check-uncheck').toggleClass('selected');
        $($event.target).parents('.check-uncheck').next().toggleClass('selected');

        if (is_selected === false) {
            $('#main-actions').toggleClass('unselected');
            $('#sub-actions').toggleClass('selected');
            is_selected = true;
        }

        if ($(":checkbox:checked").length === 0) {
            $('#main-actions').removeClass('unselected');
            $('#sub-actions').removeClass('selected');
            is_selected = false;

        }
        var contactPosition = getSelectedContactPosition(card.contact.id);
        if (contactPosition !== -1) {
            selectedContacts.splice(contactPosition, 1);
            selectedEmails.splice(contactPosition, 1);
            selectedReferrals.splice(contactPosition, 1);
        }
        else {
            selectedContacts.push(card.contact.id);
            selectedEmails.push(card.contact.email);
            selectedReferrals.push(card.contact);

        }
    }

    $scope.selectAll = function () {
        $('.general-card .check-uncheck').addClass('selected');
        $('.general-card .inner-box').addClass('selected');

        $('.check-uncheck input:checkbox').each(function() { //loop through each checkbox
            this.checked = true;  //select all checkboxes with class "checkbox1"
        });

        $('.icon-checkbox_empty').css('display','none');
        $('.icon-checkbox').css('display','block');

        /* reset actions menus */
        $('#main-actions').addClass('unselected');
        $('#sub-actions').addClass('selected');
        is_selected = true;
        getContactsIdFromContactsList();
    }

    var getContactsIdFromContactsList = function () {
        for (var i = 0; i < $scope.contacts.items.length; i += 1) {
            selectedContacts.push($scope.contacts.items[i].id);
            selectedReferrals.push($scope.contacts.items[i]);
        }
        return selectedContacts;
    }

    $scope.unselectAll = function () {
        $('input:checkbox').removeAttr('checked');
        $('.general-card .check-uncheck').removeClass('selected');
        $('.general-card .inner-box').removeClass('selected');

        is_selected = false;

        /* reset actions menus */
        $('#main-actions').removeClass('unselected');
        $('#sub-actions').removeClass('selected');
        selectedContacts = [];
        selectedEmails = [];
        selectedReferrals = [];
    }

    $scope.mergeContacts = function () {
        if (selectedContacts.length === 2) {
            contactService.mergeContacts(selectedContacts)
                .then(function (response) {
                    selectedContacts = [];
                    $('#myModal').modal('hide');
                    var filtersPayload = getContactsListFiltersPayload();
                    $scope.contacts = new ContactsList($scope.sortByFilter, filtersPayload);
                });
        }
    }

    var getSelectedContactPosition = function (contactId) {
        for (var i = 0; i < selectedContacts.length; i += 1) {
            if (selectedContacts[i] === contactId) {
                return i;
            }
        }
        return -1;
    }

    $scope.activeSection = "";
    $scope.changeActiveSection = function(newActiveSection){
        $scope.activeSection = newActiveSection;
    }

    $scope.showSection = function () {
        if ($scope.activeSection === "") {
            return "html/pages/Contact/detailsSection/contact-filters.html";
        }
        utilSrv.resizeContainer();
        return "html/pages/Contact/detailsSection/contact_" + $scope.activeSection + ".html";
    }

    $scope.startsWith = function(filterValue, viewValue) {
        return filterValue.substr(0, viewValue.length).toLowerCase() == viewValue.toLowerCase();
    }

    $scope.setError = function (errorName, value) {
        $scope[errorName] = value;
    }

    $scope.addContact = function (newContact) {
        if (!newContact.firstName) {
            $scope.firstnameError = true;
        }
        if (!newContact.lastName) {
            $scope.lastnameError = true;
        }
        if (!newContact.firstName || !newContact.lastName) {
            return;
        }

        var contactInformation = [
            {
                contactType: "emailAddress",
                contactValue: newContact.email
            },
            {
                contactType: "mobilePhoneNumber",
                contactValue: newContact.mobileNo
            },
            {
                contactType: "officePhoneNumber",
                contactValue: newContact.officeNo
            },
            {
                contactType: "skypeName",
                contactValue: newContact.skypeName
            }
        ];
        newContact.contactInformation = contactInformation;
        contactService.addContact(newContact)
            .then(function (response) {
                $scope.contacts = new ContactsList($scope.sortByFilter);
                $scope.changeActiveSection('');
            });
    }

    $scope.getInitialData = function () {
        var data = {
            skip:0,
            limit:50
        }
        
        contactService.getContactsList(data).
        then(function (response) {
            console.log('hiiiiii'+JSON.stringify(response));
            $scope.contacts = response;
        })
    };


    $scope.filterContact = function(data) {
        $scope.contacts = data.payload;
        console.log('hiwithhello'+JSON.stringify(data));
    }

    var getShortHierarchicalPosition = function (position) {
        switch (position) {
            case 'C-Level':
                return 'C';
            case 'Director':
                return 'D';
            case 'Team Leader':
                return 'TL';
            case 'Individual Contributor':
                return 'IC';
        }
    }

    $scope.getInitialData();

    $scope.companiesSearchSuggestions = function(searchText){
        if (searchText){
            companyService.searchSuggestions(searchText)
                .then(function(response){
                        $scope.contactCompanies = response.payload.results;
                })
        }
    }

    $scope.allFilters = [];
    $scope.filterList = [];
    $scope.sortByFilter = 'lastInteraction';
    $scope.selectedCompany = undefined;
    $scope.companyFilters = [];
    $scope.companyAppliedFilters = [];
    $scope.selectedCountry = undefined;
    $scope.countryFilters = [];
    $scope.countryAppliedFilters = [];
    $scope.businessFilters = [];
    $scope.positionFilters = [];
    $scope.businessAppliedFilters = [];
    $scope.industryAppliedFilters = [];
    $scope.industryFilters = [];
    $scope.interestFilters = [];
    $scope.dateFilters = [];
    $scope.dateAppliedFilters = [];
    $scope.date = [];
    $scope.interestAppliedFilters = [];
    $scope.newsletterFilters = [];
    $scope.newsletterAppliedFilters = [];
    $scope.positionAppliedFilters = [];

    var checkIfIsInFilters = function (filterType, filterName) {
        for (var i = 0; i < $scope[filterType].length; i += 1) {
            if ($scope[filterType][i] === filterName) {
                return i;
            }
        }
        return -1;
    }

    var checkIfIsInAllFilters = function (filterType, filterName) {
        for (var i = 0; i < $scope[filterType].length; i += 1) {
            if ($scope[filterType][i]['name'] === filterName) {
                return i;
            }
        }
        return -1;
    }

    $scope.contactsSortBy = function(type){
        $scope.sortByFilter = type;
        var filtersPayload = getContactsListFiltersPayload();
        $scope.contacts = new ContactsList($scope.sortByFilter,filtersPayload);
    }

    $scope.selectFilter = function (filterType, filterName, selectedModel) {
        if (checkIfIsInFilters(filterType, filterName) === -1){
            $scope[filterType].push(filterName);

            var type_temp=filterType.replace(/([A-Z])/g, ' $1');
            var filter_type = type_temp.substr(0,type_temp.indexOf(' '));
            var display_name = filter_type[0].toUpperCase() + filter_type.slice(1);
            $scope.applyFilter(filter_type, filterName, display_name);
        }
        $scope[selectedModel] = '';
    }

    $scope.applyFilter = function (filterType, filterName, displayName) {
        if(filterType === 'date'){
            $scope.dateAppliedFilters=[];
            _.forEach($scope.allFilters, function(result,index){
                if(result.type === 'date'){
                    $scope.allFilters.splice(index,1);
                }
            });
        }

        var appliedFilterPosition = checkIfIsInFilters(filterType + 'AppliedFilters', filterName);
        var allAppliedFilterPosition = checkIfIsInAllFilters('allFilters', filterName);
        if (appliedFilterPosition === -1) {
            $scope[filterType + 'AppliedFilters'].push(filterName);
            if (allAppliedFilterPosition === -1){
                $scope.allFilters.push({displayName: displayName, name: filterName, type: filterType});
                $scope.filterList[filterName] = true;
            }
        }
        else {
            $scope[filterType + 'AppliedFilters'].splice(appliedFilterPosition, 1);
            if (allAppliedFilterPosition !== -1){
                $scope.allFilters.splice(allAppliedFilterPosition, 1);
            }
        }
        $scope.filtersPayload = getContactsListFiltersPayload();
        $scope.contacts = new ContactsList($scope.sortByFilter, $scope.filtersPayload);
    }

    var getContactsListFiltersPayload = function () {
        var filtersPayload = {};
        if ($scope.companyAppliedFilters.length > 0) {
            filtersPayload['companies'] = $scope.companyAppliedFilters;
        }
        if ($scope.countryAppliedFilters.length > 0) {
            filtersPayload['countries'] = $scope.countryAppliedFilters;
        }
        if ($scope.positionAppliedFilters.length > 0) {
            filtersPayload['positionLevels'] = $scope.positionAppliedFilters;
        }
        if ($scope.businessAppliedFilters.length > 0) {
            filtersPayload['business'] = $scope.businessAppliedFilters;
        }
        if ($scope.newsletterAppliedFilters.length > 0) {
            filtersPayload['newsletter'] = $scope.newsletterAppliedFilters;
        }
        if ($scope.industryAppliedFilters.length > 0) {
            filtersPayload['industries'] = $scope.industryAppliedFilters;
        }
        if ($scope.interestAppliedFilters.length > 0) {
            filtersPayload['solutionAreas'] = $scope.interestAppliedFilters;
        }
        if ($scope.dateAppliedFilters.length > 0) {
            var temp_date = new Date($scope.dateAppliedFilters[0]);
            var date = new Date(temp_date.getFullYear(), temp_date.getMonth(), temp_date.getDate(), 0, 0, 0);
            var localTime = date.getTime();
            var localOffset = date.getTimezoneOffset() * 60000;
            filtersPayload['date'] = localTime - localOffset;
        }
        return filtersPayload;
    }

    $scope.clearAllFilters = function () {
        $scope.companyAppliedFilters = [];
        $scope.countryAppliedFilters = [];
        $scope.businessAppliedFilters = [];
        $scope.industryAppliedFilters = [];
        $scope.positionAppliedFilters = [];
        $scope.newsletterAppliedFilters = [];
        $scope.interestAppliedFilters = [];
        $scope.allFilters = [];
        $scope.filterList = [];
        $scope.dateFilters = [];
        $scope.dateAppliedFilters = [];
        $scope.date = [];
        $scope.companyFilters = [];
        $scope.newsletterFilters = [];
        $scope.industryFilters = [];
        $scope.countryFilters = [];
        $scope.positionFilters = [];
        $scope.businessFilters = [];
        uncheckAll();
        $scope.contacts = new ContactsList($scope.sortByFilter);
    }

    var uncheckAll = function(){
        angular.element('input:checkbox').removeAttr('checked');
        if(angular.element('input:radio[name=sortBy]')){
            return;
        }else{
        angular.element('input:radio').removeAttr('checked');
        }
    }

    $scope.removeFilter = function (filterType, filterName) {
        if (filterType !== 'position') {
            var removeFilterAtPosition = checkIfIsInFilters(filterType + 'Filters', filterName);
        }
        if (filterType === 'date') {
            $scope.date = [];
        }
        var removeFilterAtPositionFromApplied = checkIfIsInFilters(filterType + 'AppliedFilters', filterName);
        var removeFilterAtPositionFromAll = checkIfIsInAllFilters('allFilters', filterName);
        if (removeFilterAtPositionFromApplied !== -1) {
            if (filterType !== 'position') {
                $scope[filterType + 'Filters'].splice(removeFilterAtPosition, 1);
            }
            $scope[filterType + 'AppliedFilters'].splice(removeFilterAtPositionFromApplied, 1);
            $scope['allFilters'].splice(removeFilterAtPositionFromAll, 1);
            $scope.filterList[filterName]=false;
        }
        var filtersPayload = getContactsListFiltersPayload();
        $scope.contacts = new ContactsList($scope.sortByFilter,filtersPayload);
    }

    $scope.redirectToContact = function(contactId) {
        $location.url("/contacts/" + contactId.toString());
    }

    $scope.deleteContacts = function(){
        var requestObj = {
            event: "deleteContacts",
            payload: {
                contactsToDelete: selectedContacts
            }
        };
        requestManagerService.contactsRequest(requestObj)
            .then(function(response){
                $('#myModal').modal('hide');
                if (response.payload.contacts.length > 0) {
                    $scope.forceDeleteData = response.payload.contacts;
                    showForceDeleteModal();
                }
                else {
                    selectedContacts=[];
                    selectedEmails=[];
                    $('#main-actions').removeClass('unselected');
                    $('#sub-actions').removeClass('selected');
                    is_selected = false;
                    var filtersPayload = getContactsListFiltersPayload();
                    $scope.contacts = new ContactsList($scope.sortByFilter, filtersPayload);
                }
            });
    }

    function showForceDeleteModal () {
        myModalService.setModalContent('Oops!', 'Some contacts are linked to at least 1 lead. By deleting these contacts you are also deleting the leads associated with them, for you and your colleagues. Are you sure you want to continue?', 'Cancel', 'Delete');
        $('#myModal').modal('show');
        myModalService.setModalDeclineAction($scope.dismissModal);
        myModalService.setModalAcceptAction($scope.forceDeleteContact);
    }

    $scope.forceDeleteContact = function () {
        if ($scope.forceDeleteData) {
            var requestObj = {
                event:   "forceDeleteContacts",
                payload: {
                    contacts: $scope.forceDeleteData
                }
            };
            $('#myModal').modal('hide');
            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    $('#main-actions').removeClass('unselected');
                    $('#sub-actions').removeClass('selected');
                    is_selected = false;
                    var filtersPayload = getContactsListFiltersPayload();
                    $scope.contacts = new ContactsList($scope.sortByFilter, filtersPayload);
                });
        }
    }

    $scope.dismissModal = function () {
        $('#myModal').modal('hide');
        $scope.forceDeleteData = null;
    }

    //Validations
    //idateEmail;
    $scope.validate = function(field,pristine){
        if(pristine) {
            return true;
        } else if(field){
            return true;
        }
        return false;
    }

    $scope.importFromSalesForce = function () {
        var sf = new salesForceService();
        sf.client.setSessionToken(localStorage['access_token'], sf.apiVersion, localStorage['instance_url']);
        sf.executeQuery('SELECT FirstName, LastName, Phone, Email, MobilePhone, Title, Department from contact')
            .then(function (data) {
                for (var i = 0; i < data.records.length; i += 1) {
                    data.records[i].FullName = data.records[i].FirstName + ' ' + data.records[i].LastName;
                    data.records[i].imageURL = 'images/placeholder_contact-big.png';
                }
                $scope.importSource = "SalesForce";
                $scope.selectedContactsNumber = 0;
                $scope.salesForceImportContacts = data.records;
            }, function (err) {
                myModalService.setModalContent('SalesForce Import', 'Your SalesForce login session has expired. Please re-connect to it from your profile.', 'Cancel', 'Ok')
                $('#myModal').modal('show');
                myModalService.setModalAcceptAction(goToUserSettings);
            });
    }

    var goToUserSettings = function () {
        localStorage['fromSalesForceImport'] = true;
        var sf = new salesForceService();
        sf.login();
        $('#myModal').modal('hide');
    }

    var selectedImportedContacts = [];

    $scope.selectContact = function (card, $event) {
        $($event.target).parents('li').toggleClass('selected');
        card.contact.isSelected = !card.contact.isSelected;
        setSelectedContactsNumber();
    }

    var setSelectedContactsNumber = function () {
        $scope.selectedContactsNumber = _.filter($scope.salesForceImportContacts, function (sfi) {
            return sfi.isSelected;
        }).length;;
        $scope.allSelected = $scope.salesForceImportContacts.length === $scope.selectedContactsNumber;
    }

    $scope.selectAllImportedContacts = function () {
        $('.check-uncheck-imported input:checkbox').each(function() {
            this.checked = true;
            $(this).parents('li').toggleClass('selected');
        });
        is_selected = true;

        _.forEach($scope.salesForceImportContacts, function (sfi) {
            sfi.isSelected = true;
        });
        setSelectedContactsNumber();
    }

    $scope.unselectAllImportedContacts = function () {
        $('.check-uncheck-imported input:checkbox').each(function() {
            this.checked = false;
            $(this).parents('li').removeClass('selected');
        });
        is_selected = false;

        _.forEach($scope.salesForceImportContacts, function (sfi) {
            sfi.isSelected = false;
        });
        setSelectedContactsNumber();
    }

    $scope.importedContactsFilter = [];

    $scope.selectContactSuggestion = function (filterName) {
        var pos = -1;
        for (var i = 0; i < $scope.salesForceImportContacts.length; i += 1) {
            if ($scope.salesForceImportContacts[i].Email === filterName.Email) {
                pos = i;
                break;
            }
        }
        if (pos !== -1) {
            selectedImportedContacts.push(filterName);
            $scope.selectedContactsNumber = selectedImportedContacts.length;
            $('.check-uncheck-imported:eq(' + pos + ')').parents('li').toggleClass('selected');
            $('.check-uncheck-imported:eq(' + pos + ')').find('input[type=checkbox]').attr('checked', 'checked');
        }
    }

    $scope.loadVCard = function () {
        var fileReader = new FileReader();

        fileReader.onload = function() {
            $scope.$apply(function () {
                $scope.importSource = "vCard";
                $scope.salesForceImportContacts = vCardParser.parse(fileReader.result);
                _.forEach($scope.salesForceImportContacts, function (sfi) {
                    sfi.isSelected = false;
                });
                $scope.selectedContactsNumber = 0;
            });
        }

        fileReader.readAsText(document.getElementById('importVCard').files[0]);
    }
    if (window.location.hash && window.location.hash.indexOf('access_token') !== -1) {
        $scope.activeSection = 'import-contact-step1';
    }

    $scope.validateLetters = utilSrv.validateLetters;
    utilSrv.resizeContainer();
}]);

app.factory('ContactsList',['$rootScope','$http','requestManagerService', 'errorService',function($rootScope, $http, requestManagerService, errorService) {
    var ContactsList = function(sortBy, filters) {
        this.items = [];
        this.busy = false;
        this.isEnd = false;
        this.after = '';
        this.payload = {
            skip: 0,
            limit: 54,
            sortBy: sortBy
        };
        if (filters) {
            this.payload['filters'] = filters;
        }
        this.nextPage();
    }

    var getShortHierarchicalPosition = function (position) {
        switch (position) {
            case 'C-Level':
                return 'C';
            case 'Director':
                return 'D';
            case 'Team Leader':
                return 'TL';
            case 'Individual Contributor':
                return 'IC';
        }
    }

    ContactsList.prototype.nextPage = function() {
        if (this.busy) return;
        this.busy = true;
        var requestObj = {
            event: 'getContacts',
            payload: this.payload
        }
        requestManagerService.contactsRequest(requestObj)
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                    var items = response.payload.results;
                    for (var i = 0; i < items.length; i += 1) {
                        items[i].hierarchicalPosition = getShortHierarchicalPosition(items[i].hierarchicalPosition);
                        this.items.push(items[i]);
                    }
                    this.payload.skip += items.length;
                    if (items.length === 0)
                        this.isEnd = true;
                    else
                        this.busy = false;
                }
            }.bind(this));
    }

    return ContactsList;
}]);
