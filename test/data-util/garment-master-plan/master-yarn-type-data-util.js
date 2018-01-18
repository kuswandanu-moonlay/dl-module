"use strict";
var helper = require("../../helper");
var _getSert = require("../getsert");
var MasterYarnTypeManager = require("../../../src/managers/garment-master-plan/master-yarn-type-manager");

var generateCode = require("../../../src/utils/code-generator");
var spinningYarn = require("../master/spinning-yarn-data-util");

class MasterYarnTypeDataUtil {
    getSert(input) {
        var Manager = require("../../../src/managers/garment-master-plan/master-yarn-type-manager");
        return _getSert(input, Manager, (data) => {
            return {
                name: data.name,
                spinningYarnTypeId: data.spinningYarnTypeId,
            };
        });
    }

    getNewData() {
       return Promise.all([ spinningYarn.getTestData() ])
            .then((results) => {
                var _spinningYarn = results[0];
                var date = new Date();
                var code = generateCode();

                var data = {
                    code : code,
                    name : "Benang Wol",
                    _createdDate : date,
                    spinningYarnId : _spinningYarn._id,
                    spinningYarnCode : _spinningYarn.code,
                    spinningYarnName : _spinningYarn.name,
                }

                return Promise.resolve(data);
            });
    }

    getNewTestData() {
        return helper
            .getManager(MasterYarnTypeManager)
            .then((manager) => {
                return this.getNewData().then((data) => {
                    return manager.create(data)
                        .then((id) => {
                            return manager.getSingleById(id)
                        });
                });
            });
    }
}
module.exports = new MasterYarnTypeDataUtil();