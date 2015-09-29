var active = false;
var group = '';
module.exports = {
    runDebugger: function (toggle) {
        active = toggle;
    },
    setGroup: function (groupName) {
        group = groupName;
    },
    log: function (label, grouping) {
        if(!grouping) {
            grouping = '';
        }
        if(active) {
            if(grouping.indexOf(group) > -1) {
                console.log(label);
            }
        }
    }
}