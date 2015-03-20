var message = {"tranId": "215dde92-43a9-4a98-af0d-366bc79af92c","recordLastUpdatedDateTime": "2014-08-27 17:32:52.658834","errors": [],"poolId": "FF7602A","sellerId": "197300000","poolEditStatus": "Not Edited","poolSubmitStatus": "Not Submitted","loanCount": 2,"issueUPB": 320000.00,"sellerCtacName": "Test User10","poolFatalCount": 1,"poolInfoCount": 0,"poolWarnCount": 0,"loanFatalCount": 2,"loanWarnCount": 2,"loanInfoCount": 0,"loanPassedCount": 0,"loansWithFatals": 2,"poolImportDate": "2014-08-15T14:19:15.190","pool": {"pooldetail": {"securityIssueDate": "2014-07-15","securityTradeBookEntryDate": "2013-11-30","poolparameters": {"poolparameter": [{"mbsPoolParameterPassThruRateDivisorNumber": 0.25,"mbspoolParameterMaximumMaturityTerm": 360,"mbsPoolParameterMaximumNoteRateSpreadBasisPointsNumber": 100,"mbspoolParameterTableTypeCode": "FixedRate"}]},"customizedPoolParameterIndicator": "Y","poolParameterServiceAvailabilityIndicator": "Y","mbspoolSuffixIdentifier": "A","mbsinvestorProductPlanIdentifier": "2729","errors": [],"emtpy": {"errors": [{"emtpy": {}}],"value": "3","emtpy": {}},"mbsscheduledRemittancePaymentDayNumber": "18","mbsaccrualStructureTypeCode": "WeightedAverageStructure","mbsamortizationTypeCode": "AdjustableRate","mbsassumableLoanIndicator": "Y","mbsballoonLoanIndicator": "N","mbsinterestOnlyLoanIndicator": "N","mbsinterestRateAndPrincipalandInterestPaymentAdjustmentIndexLeadDaysCount": 30,"mbsinterestRateRoundingPercent": 0.125,"mbsinterestRateRoundingTypeCode": "Nearest","mbsinvestorOwnershipPercent": 100,"mbsissuanceInterestRatePercent": 4.00,"mbsloanMortgageTypeCode": "Conventional","mbsmarginRatePercent": 1.5,"mbsmaximumAccrualRatePercent": 10.50,"mbsminimumAccrualRatePercent": 0.0,"mbspoolIdentifier": "FF7602","mbsstructureTypeCode": "LenderInitiatedMultipleLender"},"poolinvestorfeatures": {"poolinvestorfeature": [{"mbsfutureFeatureCode": "011"}, {"mbsfutureFeatureCode": "049"}, {"mbsfutureFeatureCode": "061"}]},"poolparties": {"documentcustodian": {"documentCustodianIdentifier": "99999398668"},"loanseller": {"sellerName": "FANNIE MAE","sellerPartyRoleIdentifier": "197300000"},"servicer": {"servicerIdentifier": "258410009"}},"uniqueClientPoolIdentifier": "FF7602A"}};

function unflatten(data) {
    // "use strict";
    if (Object(data) !== data || Array.isArray(data)){
        return data;
    }
    var result = {}, cur, prop, idx, last, temp;
    for(var p in data) {
        cur = result, prop = "", last = 0;
        do {
            // idx = p.indexOf(".", last);
            idx = p.indexOf("_", last);
            temp = p.substring(last, idx !== -1 ? idx : undefined);
            cur = cur[prop] || (cur[prop] = (!isNaN(parseInt(temp)) ? [] : {}));
            prop = temp;
            last = idx + 1;
        } while(idx >= 0);
        cur[prop] = data[p];
    }
    return result[""];
}
function flatten(data) {
    var result = {};
    function recurse (cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
             for(var i=0, l=cur.length; i<l; i++)
                 // recurse(cur[i], prop ? prop+"."+i : ""+i);
                 recurse(cur[i], prop ? prop+"_"+i : ""+i);
            if (l == 0){
                result[prop] = [];
            }
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                // recurse(cur[p], prop ? prop+"."+p : p);
                recurse(cur[p], prop ? prop+"_"+p : p);
            }
            if (isEmpty){
                result[prop] = {};
            }
        }
    }
    recurse(data, "");
    return result;
}

var _message = flatten(message);
var message_ = unflatten(_message);

console.log('************************************************************************************************************');
console.log('************************************************************************************************************');
console.log(message);
console.log('************************************************************************************************************');
console.log('************************************************************************************************************');
console.log(_message);
console.log('************************************************************************************************************');
console.log('************************************************************************************************************');
console.log(message_);
console.log('************************************************************************************************************');
console.log('************************************************************************************************************');
console.log(message_.pool.pooldetail.emtpy);
console.log('************************************************************************************************************');
console.log('************************************************************************************************************');
