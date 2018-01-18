"use strict"

var ObjectId = require("mongodb").ObjectId;
require("mongodb-toolkit");
var DLModels = require("dl-models");
var map = DLModels.map;
var MasterYarnType = DLModels.garmentMasterPlan.MasterYarnType;
var BaseManager = require("module-toolkit").BaseManager;
var i18n = require("dl-i18n");
var generateCode = require("../../utils/code-generator");
var SpinningYarnManager = require('../master/spinning-yarn-manager');

module.exports = class MasterYarnTypeManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.garmentMasterPlan.collection.MasterYarnType);
        this.spinningYarnManager = new SpinningYarnManager(db, user);
    }

    _getQuery(paging) {
        var _default = {
            _deleted: false
        },
            pagingFilter = paging.filter || {},
            keywordFilter = {},
            query = {};

        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");
            var codeFilter = {
                "code": {
                    "$regex": regex
                }
            };
            var nameFilter = {
                "name": {
                    "$regex": regex
                }
            };
            var spinningYarnNameFilter = {
                "spinningYarnName": {
                    "$regex": regex
                }
            };
            keywordFilter["$or"] = [codeFilter, nameFilter, spinningYarnNameFilter];
        }
        query["$and"] = [_default, keywordFilter, pagingFilter];
        return query;
    }

    _validate(masterYarnType) {
        var errors = {};
        var valid = masterYarnType;
        // 1. begin: Declare promises.
        var getMasterYarnType = this.collection.singleOrDefault({
            _id: {
                "$ne": new ObjectId(valid._id)
            },
            name: valid.name,
            spinningYarnId:  new ObjectId(valid.spinningYarnId),
            _deleted: false
        });
        
        var getSpinningYarn = valid.spinningYarnId && ObjectId.isValid(valid.spinningYarnId) ? this.spinningYarnManager.getSingleByIdOrDefault(valid.spinningYarnId) : Promise.resolve(null);

        // 2. begin: Validation.
        return Promise.all([getMasterYarnType, getSpinningYarn])
            .then(results => {
                var duplicateMasterYarnType = results[0];
                var _spinningYarn = results[1];

                if(_spinningYarn){
                    valid.spinningYarnId = new ObjectId(_spinningYarn._id);
                    valid.spinningYarnName = _spinningYarn.name;
                    valid.spinningYarnCode = _spinningYarn.code;
                }

                if (duplicateMasterYarnType) {
                    errors["name"] = i18n.__("MasterYarnType.name.isExists:%s with same Spinning Yarn is already exists", i18n.__("MasterYarnType.name._:Name"));
                }

                if (!valid.createdDate || valid.createdDate === "") {
                    errors["createdDate"] = i18n.__("MasterYarnType.createdDate.isRequired:%s is required", i18n.__("MasterYarnType.createdDate._:CreatedDate")); 
                }
                else {
                    valid.createdDate = new Date(valid.createdDate);
                    var today = new Date();
                    if(today < valid.createdDate){
                        errors["createdDate"] = i18n.__("MasterYarnType.createdDate.shouldNotMoreThanToday:%s should not be more than today date", i18n.__("MasterYarnType.createdDate._:CreatedDate")); 
                    }
                }

                if(!valid.name || valid.name === "")
                    errors["name"] = i18n.__("MasterYarnType.name.isRequired:%s is required", i18n.__("MasterYarnType.name._:Name"));

                if(!valid.spinningYarnId || valid.spinningYarnId==='')
                    errors["spinningYarn"] = i18n.__("MasterYarnType.spinningYarn.isRequired:%s is required", i18n.__("MasterYarnType.spinningYarnId._:SpinningYarn"));

                if (Object.getOwnPropertyNames(errors).length > 0) {
                    var ValidationError = require("module-toolkit").ValidationError;
                    return Promise.reject(new ValidationError("data does not pass validation", errors));
                }

                if (!valid.stamp) {
                    valid = new MasterYarnType(valid);
                }

                valid.stamp(this.user.username, "manager");
                return Promise.resolve(valid);
            });
    }

    _beforeInsert(yarnType){
        yarnType.code = !yarnType.code ? generateCode() : yarnType.code;
        yarnType._active = true;

        return Promise.resolve(yarnType);
    }

    _createIndexes() {
        var dateIndex = {
            name: `ix_${map.garmentMasterPlan.collection.MasterPlanYarnType}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        var codeIndex = {
            name: `ix_${map.garmentMasterPlan.collection.MasterPlanYarnType}_code`,
            key: {
                "code": 1
            }
        };

        return this.collection.createIndexes([dateIndex, codeIndex]);
    }
}