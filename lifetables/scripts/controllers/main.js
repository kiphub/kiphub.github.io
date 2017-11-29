'use strict';

angular.module("lifeTableLookup")
.controller("mainCtrl", [ "$scope", "loadLifeTable", ($scope, loadLifeTable) => {

    console.log(typeof loadLifeTable); // undefined

    loadLifeTable.getData((response) => {
        $scope.tables = response.data;
        console.log($scope.tables);
    });

}]);
