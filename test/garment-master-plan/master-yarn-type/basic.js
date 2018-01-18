var options = {
    manager: require("../../../src/managers/garment-master-plan/master-yarn-type-manager"),
    model: require("dl-models").garmentMasterPlan.MasterYarnType,
    util: require("../../data-util/garment-master-plan/master-yarn-type-data-util"),
    validator: require("dl-models").validator.garmentMasterPlan.masterYarnType,
    createDuplicate: false,
    keys:[]
};

var basicTest = require("../../basic-test-factory");
basicTest(options);