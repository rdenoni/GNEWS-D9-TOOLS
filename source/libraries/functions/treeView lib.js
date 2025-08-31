/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/*

---------------------------------------------------------------
> 🌳 tree view functions
---------------------------------------------------------------

*/

function getFolderStructureAsData(folder, filter) {
    var dataStructure = [];
    if (!folder || !folder.exists) return [];
    var folderContent = folder.getFiles();
    if (folderContent === null) return [];

    folderContent.sort(function (a, b) {
        if (a instanceof Folder && b instanceof File) return -1;
        if (a instanceof File && b instanceof Folder) return 1;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    for (var i = 0; i < folderContent.length; i++) {
        var file = folderContent[i];
        if (file instanceof Folder) {
            var subFiles = getFolderStructureAsData(file, filter);
            if (subFiles.length > 0) {
                dataStructure.push({ type: 'node', name: file.displayName, children: subFiles });
            }
        } else if (file instanceof File) {
            var fileExt = file.name.substr(file.name.lastIndexOf('.')).toLowerCase();
            if (filter.indexOf(fileExt) > -1) {
                dataStructure.push({ type: 'item', name: file.displayName, filePath: file.fsName });
            }
        }
    }
    return dataStructure;
}

function populateTreeFromData(treeView, data, parentNode) {
    var container = parentNode || treeView;
    for (var i = 0; i < data.length; i++) {
        var entry = data[i];
        if (entry.type === 'node') {
            var newNode = container.add('node', entry.name);
            if (typeof fldTogIcon !== 'undefined') {
                newNode.image = fldTogIcon.light;
            }
            if (entry.children && entry.children.length > 0) {
                populateTreeFromData(treeView, entry.children, newNode);
            }
        } else if (entry.type === 'item') {
            var newItem = container.add('item', entry.name);
            if (typeof D9T_AE_ICON !== 'undefined') {
                newItem.image = D9T_AE_ICON;
            }
            newItem.file = new File(entry.filePath);
        }
    }
}

function findItem(nodeTree, list, searchTxt) {
	var branches = nodeTree.items;
	for (var i = 0; i < branches.length; i++) {
		if (branches[i].type == 'node') findItem(branches[i], list, searchTxt);
		if (
			branches[i].text
				.trim()
				.toUpperCase()
				.replaceSpecialCharacters()
				.match(searchTxt)
		) {
			list.push(branches[i]);
		}
	}
	return list;
}

function expandAllNodes(tree) {
    if (!tree || !tree.items) return;
    for (var i = 0; i < tree.items.length; i++) {
        var item = tree.items[i];
        if (item.type === 'node') {
            item.expanded = true;
            if (item.items && item.items.length > 0) {
                expandAllNodes(item);
            }
        }
    }
}