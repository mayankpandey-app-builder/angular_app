/**
 * Created by bogdan on 6/10/14.
 */
app.directive('dealsQualifiers', function (requestManagerService,errorService, errorModalService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-deals-qualifiers.html',
        link: function (scope, elemn, attr) {

            function checkIfHasName(stages) {
                for (var i = 0; i < stages.length; i += 1) {
                    var missingQualifierLongName = _.filter(stages[i].qualifiers, function (qualifier) {
                        return !qualifier.longName;
                    }).length > 0;
                    if (missingQualifierLongName) {
                        return {
                            missing: 'long name',
                            entity: 'qualifier'
                        };
                    }
                    var missingQualifierShortName = _.filter(stages[i].qualifiers, function (qualifier) {
                        return !qualifier.shortName;
                    }).length > 0;
                    if (missingQualifierShortName) {
                        return {
                            missing: 'short name',
                            entity: 'qualifier'
                        };
                    }
                    var missingMilestoneLongName = _.filter(stages[i].milestones, function (milestone) {
                        return !milestone.longName;
                    }).length > 0;
                    if (missingMilestoneLongName) {
                        return {
                            missing: 'long name',
                            entity: 'milestone'
                        };
                    }
                    var missingMilestoneShortName = _.filter(stages[i].milestones, function (milestone) {
                        return !milestone.shortName;
                    }).length > 0;
                    if (missingMilestoneShortName) {
                        return {
                            missing: 'short name',
                            entity: 'milestone'
                        };
                    }
                }
            }

            scope.updateDeal = function(products, stages, type, parIndex, index){
                var missingField = checkIfHasName(stages);
                if (missingField) {
                    errorModalService.setErrorModal('Oops!', 'You must set a ' + missingField.missing + ' for the ' + missingField.entity + '.');
                    $('#errorModal').modal('show');
                    scope.getDealsConfig();
                    return;
                }
                var requestObj = {
                    event: 'updateOrganizationDealsConfiguration',
                    payload: {
                          products: products,
                          stages: stages
                    }
                };
                console.log('reqq='+JSON.stringify(response))
                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        console.log('ressss='+JSON.stringify(response))
                        if (errorService.validateUserResponse(response)) {
                            scope.products=response.payload.products;
                            scope.stages=response.payload.stages;

                            if (type && parIndex>-1){
                                scope.checkList = scope.stages[parIndex][type][index];
                                scope.checkList['index'] = index;
                                scope.checkList['parentIndex'] = parIndex;
                                scope.checkList['type'] = type;
                            }
                        }
                    });
            }


            scope.removeQualifierMilestone = function(type,index, parentName){

                for (var i=0; i<scope.stages.length; i+=1){
                    if (scope.stages[i].name === parentName){

                        switch (type){
                            case 'qualifier': scope.stages[i].qualifiers.splice(index,1); break;
                            case 'milestone': scope.stages[i].milestones.splice(index,1); break;
                            default: break;
                        }
                    }

                }
                scope.updateDeal(scope.products, scope.stages);

            }


            scope.selectStageQualifier = function(name){
                scope.qualifier.stage = name;
            }

            scope.setStageQualifier = function(qualifier,stage, parent){

                for (var i=0; i<scope.stages.length; i+=1){
                    if (scope.stages[i].name === stage){
                        scope.stages[i].qualifiers.push(qualifier);
                        scope.removeQualifierMilestone('qualifier',parent.$index, parent.$parent.stage.name);
                    }
                }

            }


            scope.addQualifierFct = function(qualifier){
                if (!qualifier || !qualifier.stage) {
                    errorModalService.setErrorModal('Oops!', 'You must select a stage for the new qualifier.');
                    $('#errorModal').modal('show');
                    return;
                }
                if (!qualifier || !qualifier.longName) {
                    errorModalService.setErrorModal('Oops!', 'You must set a long name for the new qualifier.');
                    $('#errorModal').modal('show');
                    return;
                }
                if (!qualifier || !qualifier.shortName) {
                    errorModalService.setErrorModal('Oops!', 'You must set a short name for the new qualifier.');
                    $('#errorModal').modal('show');
                    return;
                }

                for (var i=0; i<scope.stages.length; i+=1){
                    if (scope.stages[i].name === qualifier.stage){
                        scope.stages[i].qualifiers.push(qualifier);
                        scope.qualifier = {};
                        scope.addQualifier=false;
                    }
                }
                scope.updateDeal(scope.products, scope.stages);
            }
        }
    };
});

app.directive('dealsStages', function (requestManagerService,errorService,errorModalService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-deals-stages.html',
        link: function (scope, elemn, attr) {

            scope.getDealsConfig = function(){
                var requestObj = {
                    event: 'organizationDealsConfiguration',
                    payload: {}
                };

                
               requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        console.log("resqq==="+JSON.stringify(response))
                        if (errorService.validateUserResponse(response)) {
                            scope.stages = response.payload.stages;
                            scope.products = response.payload.products;
                        }
                    });
                scope.changeActiveSection('');
                scope.tabs = [];
            }

            scope.addStage = function (value){
               if (scope.stages.length === 6 ){
                   errorModalService.setErrorModal('Add Stages', 'You have reached the maximum number of deal stages.');
                   $('#errorModal').modal('show');
               }else{
                   scope.stages.push({name: value});
               }
            }

            scope.updateStages = function(stages){

                for (var i=0; i<stages.length; i+=1){
                    if (!stages[i].name || stages[i].name.length<1){
                        stages.splice(i,1);
                    }

                }
                scope.updateDeal(scope.products, stages);
            }

            scope.removeStage = function(stage){
                if (scope.stages.length === 1){
                    errorModalService.setErrorModal('Remove Stages', 'You need to have at least 1 stage.');
                    $('#errorModal').modal('show');
                }else{
                    for (var i=0; i<scope.stages.length; i+=1){
                        if (scope.stages[i].name === stage)
                            scope.stages.splice(i,1);
                    }
                    scope.updateDeal(scope.products, scope.stages);
                }


            }

            scope.checklistSection = function(qualifier,type, index, parIndex){
                scope.changeActiveSection('add-checklist');
                scope.checkList=qualifier;
                scope.checkList['index'] = index;
                scope.checkList['parentIndex'] = parIndex;
                scope.checkList['type'] = type;
                if (type === 'milestones'){
                    scope.qualifierSelected=false;
                    scope.milestoneSelected=true;
                }else{
                    scope.milestoneSelected=false;
                    scope.qualifierSelected=true;
                }
            }

            scope.addToChecklist = function(type,value,index){
                var checklist = scope.checkList;
                var thisItem = scope.stages[checklist.parentIndex][checklist['type']][checklist.index].checklistValues;
                switch (type){
                    case 'new':{
                        if (value && value.length>0){
                            thisItem.push(value);
                        }
                    } break;
                    case 'update':{
                        if (value.length === 0){
                            thisItem.splice(index,1);
                        }else{
                            thisItem[index]=value;
                        }
                    } break;
                    default : break;
                }

                scope.updateDeal(scope.products, scope.stages, checklist.type,checklist.parentIndex,checklist.index);

            }

            scope.updateDescription = function(value){
                var checklist = scope.checkList;
                scope.stages[checklist.parentIndex][checklist['type']][checklist.index].explanatoryText = value;

                scope.updateDeal(scope.products, scope.stages);
            }

            scope.changeActiveSection = function (newActiveSection) {
                scope.activeSection = newActiveSection;
            }

            scope.showSection = function() {
                if (scope.activeSection === "") {
                    return "";
                }
                return "html/pages/Admin/detailsSection/_admin-" + scope.activeSection + ".html";
            }

        }
    };
});

app.directive('dealsMilestones', function (errorModalService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-deals-milestones.html',
        link: function (scope, elemn, attr) {

            scope.addMilestoneFct = function(milestone){
                if (!milestone || !milestone.stage) {
                    errorModalService.setErrorModal('Oops!', 'You must select a stage for the new milestone.');
                    $('#errorModal').modal('show');
                    return;
                }
                if (!milestone || !milestone.longName) {
                    errorModalService.setErrorModal('Oops!', 'You must set a long name for the new milestone.');
                    $('#errorModal').modal('show');
                    return;
                }
                if (!milestone || !milestone.shortName) {
                    errorModalService.setErrorModal('Oops!', 'You must set a short name for the new milestone.');
                    $('#errorModal').modal('show');
                    return;
                }
                for (var i=0; i<scope.stages.length; i+=1){
                    if (scope.stages[i].name === milestone.stage){
                        scope.stages[i].milestones.push(milestone);
                        scope.milestone = {};
                        scope.addMilestone=false;
                    }
                }
                scope.updateDeal(scope.products, scope.stages);
            }

            scope.selectStageMilestone = function(name){
                scope.milestone.stage = name;
            }

            scope.setStageMilestone = function(qualifier,stage, parent){

                for (var i=0; i<scope.stages.length; i+=1){
                    if (scope.stages[i].name === stage){
                        scope.stages[i].milestones.push(qualifier);
                        scope.removeQualifierMilestone('milestone',parent.$index, parent.$parent.stage.name);
                    }
                }

            }
        }
    };
});

app.directive('dealsProducts', function (errorModalService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-deals-products.html',
        link: function (scope, elemn, attr) {
            scope.setDraggable = true;

            scope.productsTree = {
                dragStop: function(event) {
                    scope.updateDeal(scope.products, scope.stages);
                }
            }

            scope.deleteProduct = function(parent, index){
                if (!parent){
                    scope.products.splice(index,1);
                } else{
                    for (var i=0; i<scope.products.length; i+=1){
                        if (parent.$modelValue.name == scope.products[i].name){
                            scope.products[i].subProducts.splice(index,1);
                        }
                    }
                }

                scope.updateDeal(scope.products, scope.stages);

            }


            scope.setDraggableFct = function(value){
                scope.setDraggable = value;
            }

            scope.addDealsProduct = function(){
                scope.setDraggable = false;
                var newProd = _.filter(scope.products, function(product){
                   return !product.name;
                }).length>0;

                if(!newProd){
                    scope.products.unshift({});
                }

            }

            scope.addDealsSubProduct = function(index){
                scope.setDraggable = false;
                var newProd = _.filter(scope.products[index].subProducts, function(product){
                   return !product.name;
                }).length>0;

                if(!newProd){
                    scope.products[index].subProducts.unshift({});
                }
            }


            scope.updateProduct = function (products) {
                var returned = false;
                scope.setDraggable = true;
                
                _.forEach(products, function (result) {
                    if (!result.name || result.name === '') {
                        returned = true;
                        errorModalService.setErrorModal('Oops!', 'You must set a name for product.');
                        $('#errorModal').modal('show');
                        return;
                    }else{
                        _.forEachRight(result.subProducts, function (subProd, i) {
                            if (!subProd.name || subProd.name === '') {
                               result.subProducts.splice(i,1);
                            }
                        });
                    }

                });

                if (!returned) {
                    scope.updateDeal(products, scope.stages);
                }else{
                    scope.getDealsConfig();
                }

            }

        }
    };
});