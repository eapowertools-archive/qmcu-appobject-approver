(function() {
    "use strict";
    var module = angular.module("QMCUtilities", ["ngDialog"])

    function fetchTableHeaders($http) {
        return $http.get("./objectapprover/data/tableDef.json")
            .then(function(response) {
                return response.data;
            });
    }

    function fetchTableRows($http, type) {
        return $http.get('./objectapprover/getObjects/' + type)
            //return $http.get("data/testData.json")
            .then(function(response) {
                return response.data;
            });
    }

    function approveSheets($http, objects) {

        var objectIds = objects.map(function(object) { return object['objectId']; });
        return $http.post('./objectapprover/approveSheets', objectIds)
            .then(function(response) {
                return response;
            });
    }

    function publishObjects($http, objectIds, command) {

        console.log(objectIds);
        return $http.post("./objectapprover/publish/" + command, objectIds)
            .then(function(response) {
                return response;
            })
    }

    function unapproveSheets($http, objects) {
        var objectIds = objects.map(function(object) { return object['objectId']; });
        return $http.post('./objectapprover/unapproveSheets', objectIds)
            .then(function(response) {
                return response;
            });
    }

    function objectBodyController($scope, $http, ngDialog, qmcuWindowLocationService) {
        var model = this;
        var colNames = [];
        model.columnNames = [];
        model.tableRows = []
        model.outputs = [];
        model.searchSheets = '';
        model.showSheets = false;
        model.showStories = false;
        model.showBookmarks = false;
        model.showDimensions = false;
        model.showMeasures = false;
        model.showMasterObjects = false;
        model.modal = false;
        model.host = qmcuWindowLocationService.host;

        model.$onInit = function() {
            fetchTableHeaders($http).then(function(table) {
                    model.columnNames = table.columns;
                })
                .then(function() {
                    model.toggleSheets();
                });
        };

        model.clearSearch = function() {
            model.searchSheets = "";
        }

        model.highlight = function(string, searchString) {
            console.log(string);
            console.log(searchString);
            /* if(!searchString)
             {
                 //$sce.trustAsHtml(string);
             }
             return $sce.trustAsHtml(string.replace(new RegExp(searchString, "gi"), function(match)
             {
                 return '<span class="lui-texthighlight">' + match + '</span>'
             })) */
        }

        model.tableArrayOps = function(type, show) {
            model.modal = true;
            var resultArray = model.tableRows;
            if (show) {
                fetchTableRows($http, type).then(function(response) {
                    for (var index = 0; index < response.rows.length; index++) {
                        response.rows[index].unshift(false);
                    }
                    model.modal = false;
                    model.tableRows = resultArray.concat(response.rows);

                });
            } else {
                //remove items of type from the model.tablerows
                var purgedArray = model.tableRows.filter(function(item) {
                    return item[2] !== type;
                })
                model.modal = false;
                model.tableRows = purgedArray;
            }
        }

        model.toggleSheets = function() {
            if (!model.showSheets) {
                model.showSheets = true;
            } else {
                model.showSheets = false;
            }
            model.tableArrayOps('sheet', model.showSheets);

        }

        model.toggleStories = function() {
            if (!model.showStories) {
                model.showStories = true;
            } else {
                model.showStories = false;
            }
            model.tableArrayOps('story', model.showStories);

        }

        model.toggleBookmarks = function() {

            if (!model.showBookmarks) {
                model.showBookmarks = true;
            } else {
                model.showBookmarks = false;
            }
            model.tableArrayOps('bookmark', model.showBookmarks);

        }

        model.toggleDimensions = function() {

            if (!model.showDimensions) {
                model.showDimensions = true;

            } else {
                model.showDimensions = false;
            }
            model.tableArrayOps('dimension', model.showDimensions);

        }

        model.toggleMeasures = function() {

            if (!model.showMeasures) {
                model.showMeasures = true;

            } else {
                model.showMeasures = false;
            }
            model.tableArrayOps('measure', model.showMeasures);
        }

        model.toggleMasterObjects = function() {
            if (!model.showMasterObjects) {
                model.showMasterObjects = true;
            } else {
                model.showMasterObjects = false;
            }
            model.tableArrayOps('masterobject', model.showMasterObjects);

        }

        model.approveButtonValid = function() {
            for (var index = 0; index < model.outputs.length; index++) {
                if (model.outputs[index]['approvedState'] == "Not approved") {
                    return true;
                }
            }
            return false;
        }

        model.unapproveButtonValid = function() {
            for (var index = 0; index < model.outputs.length; index++) {
                if (model.outputs[index]['approvedState'] == "Approved") {
                    return true;
                }
            }
            return false;
        }

        model.setValue = function(isChecked, objectType, objectId, approvedState, publishedState) {
            if (isChecked) {
                model.outputs.push({ 'type': objectType, 'objectId': objectId, 'approvedState': approvedState, 'publishedState': publishedState });
            } else {
                var index = model.outputs.indexOf({ 'type': objectType, 'objectId': objectId, 'approvedState': approvedState, 'publishedState': publishedState });
                model.outputs.splice(index, 1);
            }
            console.log(model.outputs);
        };

        function handleApproveUnapproveResponse(response) {
            console.log(response);
            if (response.data.success) {
                model.outputs = [];
                response.data.items.forEach(function(item) {
                    model.tableRows.forEach(function(row, index) {
                        row[0] = false;
                        if (item.id == row[9]) {
                            if (item.approved == true) {
                                model.tableRows[index][4] = "Approved";
                            } else if (item.approved == false) {
                                model.tableRows[index][4] = "Not approved";
                            }
                            if (item.published == true) {
                                model.tableRows[index][5] = "Published";
                            } else if (item.approved == false) {
                                model.tableRows[index][5] = "Not published";
                            }
                        }
                    });
                });
            }
        }

        model.approve = function() {
            var objectsToPublish = [];
            model.outputs.forEach(function(item) {
                if ((item.type == "bookmark" ||
                        item.type == "dimension" ||
                        item.type == "measure" ||
                        item.type == "masterobject") && item.publishedState == "Not published") {
                    objectsToPublish.push(item.objectId);
                }
            })

            if (objectsToPublish.length > 0) {
                publishObjects($http, objectsToPublish, 'publish')
                    .then(function(result) {
                        console.log(result);
                        approveSheets($http, model.outputs)
                            .then(function(response) {
                                handleApproveUnapproveResponse(response);
                                return;
                            }).then(function() {
                                $scope.form.$setPristine();
                                $scope.form.$setUntouched();
                            });;
                    });
            } else {
                approveSheets($http, model.outputs)
                    .then(function(response) {
                        handleApproveUnapproveResponse(response);
                        return;
                    }).then(function() {
                        $scope.form.$setPristine();
                        $scope.form.$setUntouched();

                    });
            }

        };

        model.unapprove = function() {
            var objectsToUnPublish = [];
            model.outputs.forEach(function(item) {
                if ((item.type == "bookmark" ||
                        item.type == "dimension" ||
                        item.type == "measure" ||
                        item.type == "masterobject") && item.publishedState == "Published") {
                    objectsToUnPublish.push(item.objectId);
                }
            })
            if (objectsToUnPublish.length > 0) {
                publishObjects($http, objectsToUnPublish, 'unpublish')
                    .then(function(result) {
                        unapproveSheets($http, model.outputs)
                            .then(function(response) {
                                handleApproveUnapproveResponse(response);
                                return;
                            }).then(function() {
                                $scope.form.$setPristine();
                                $scope.form.$setUntouched();
                            });
                    });
            } else {
                unapproveSheets($http, model.outputs)
                    .then(function(response) {
                        handleApproveUnapproveResponse(response);
                        return;
                    }).then(function() {
                        $scope.form.$setPristine();
                        $scope.form.$setUntouched();
                    });
            }
        };

        model.openHelp = function() {
            ngDialog.open({
                template: "plugins/objectApprover/help-dialog.html",
                className: "help-dialog",
                controller: objectBodyController,
                scope: $scope
            });
        };
    }

    module.component("objectApproverBody", {
        transclude: true,
        templateUrl: "plugins/objectApprover/object-approver-body.html",
        controllerAs: "model",
        controller: ["$scope", "$http", "ngDialog", "qmcuWindowLocationService", objectBodyController]
    });

    module.filter('highlight', function() {
        return function(text, search) {
            if (text && search) {
                text = text.toString();
                search = search.toString();
                return text.replace(new RegExp(search, 'gi'), '<span class="lui-texthighlight">$&</span>');
            } else {
                return text;
            }

        }

    });

}());