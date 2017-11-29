'use strict';

angular.module("lifeTableLookup")
    .factory("loadLifeTable", ["$http", ($http) => {

        return (callback) => {
            $http.get("mock/lifeTables.json").then(callback);
        };

    }]);
