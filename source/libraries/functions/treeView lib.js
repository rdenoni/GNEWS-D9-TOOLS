/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/*

---------------------------------------------------------------
> 🌳 tree view functions
---------------------------------------------------------------

*/

function populateTreeFromData(treeView, data, parentNode) {
    var container = parentNode || treeView;
    for (var i = 0; i < data.length; i++) {
        var entry = data[i];
        var newItem;

        if (entry.type === 'node') {
            newItem = container.add('node', entry.text);
            if (typeof fldTogIcon !== 'undefined') {
                newItem.image = fldTogIcon.light;
            }
            
            if (entry.children && entry.children.length > 0) {
                populateTreeFromData(treeView, entry.children, newItem);
            }
        } else if (entry.type === 'item') {
            newItem = container.add('item', entry.text);
            if (typeof D9T_AE_ICON !== 'undefined') {
                newItem.image = D9T_AE_ICON;
            }
            
            if(entry.filePath) newItem.filePath = entry.filePath;
            if(entry.size) newItem.size = entry.size;
            if(entry.modDate) newItem.modDate = entry.modDate;
            
            if(entry.filePath) {
                newItem.file = new File(entry.filePath);
            }
        }
    }
}


function findItem(nodeTree, list, searchTxt) {
	var branches = nodeTree.items;
	for (var i = 0; i < branches.length; i++) {
		if (branches[i].type == 'node') {
            findItem(branches[i], list, searchTxt);
        }
		try {
			// --- CORREÇÃO: Usa indexOf para uma busca de subtexto precisa e literal ---
			var itemText = branches[i].text.trim().toUpperCase();
			var searchText = searchTxt.trim().toUpperCase();
			if (typeof String.prototype.replaceSpecialCharacters === 'function') {
				itemText = itemText.replaceSpecialCharacters();
				searchText = searchText.replaceSpecialCharacters();
			}
			if (itemText.indexOf(searchText) > -1) {
				list.push(branches[i]);
			}
		} catch(e) {}
	}
	return list;
}

function expandAllNodes(uiNode) {
    if (!uiNode || !uiNode.items) return;
    for (var i = 0; i < uiNode.items.length; i++) {
        var item = uiNode.items[i];
        if (item.type === 'node') {
            item.expanded = true;
            if (item.items.length > 0) {
                expandAllNodes(item);
            }
        }
    }
}