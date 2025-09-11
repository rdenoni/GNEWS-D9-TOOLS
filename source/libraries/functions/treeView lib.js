/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/*

---------------------------------------------------------------
> 🌳 tree view functions
---------------------------------------------------------------

*/

// Função para remover pastas vazias da árvore de diretórios (recursivamente)
function cleanHierarchy(nodeTree) {
	var branches = nodeTree.items;
	for (var i = branches.length - 1; i >= 0; i--) {
		if (branches[i].type != 'node') continue;
		var wasEmpty = cleanHierarchy(branches[i]);
		if (wasEmpty) {
			nodeTree.remove(branches[i]);
		}
	}
	return nodeTree.items.length == 0 && nodeTree.parent != null;
}

// Otimiza a hierarquia da árvore, combinando pastas com apenas uma subpasta
function optimizeHierarchy(nodeTree) {
	var branches = nodeTree.items;
	for (var i = branches.length - 1; i >= 0; i--) {
		if (branches[i].type != 'node') continue;
		if (branches[i].items.length > 1) {
			optimizeHierarchy(branches[i]);
		} else {
			if (
				branches[i].items.length == 1 &&
				branches[i].items[0].type == 'node'
			) {
				var subfolder = branches[i].items[0];
				branches[i].text += ' / ' + subfolder.text;
				while (subfolder.items.length > 0) {
					var item = subfolder.items[0];
					try {
						var newItem = branches[i].add(item.type, item.text);
						newItem.image = item.image;
						newItem.file = item.file;
						subfolder.remove(0);
					} catch (err) {}
				}
				nodeTree.remove(subfolder);
			}
		}
	}
}

// Cria a hierarquia de arquivos e pastas na árvore da interface do usuário
function createHierarchy(array, node, fileTypes) {
	for (var n = 0; n < array.length; n++) {
		var nodeName = array[n].displayName;
		if (array[n] instanceof Folder) {
			var subArray = array[n].getFiles();
			if (subArray.length > 0) {
				var nodeItem = node.add('node', nodeName);
				if (typeof D9T_FOLDER_AE_ICON !== 'undefined') {
					nodeItem.image = D9T_FOLDER_AE_ICON;
				}
				createHierarchy(subArray, nodeItem, fileTypes);
			}
		} else {
			try {
				if (fileTypes.indexOf(getFileExt(nodeName)) >= 0) {
					var templateItem = node.add('item', nodeName);
					if (typeof D9T_AE_ICON !== 'undefined') {
						templateItem.image = D9T_AE_ICON;
					}
					templateItem.file = array[n];
				}
			} catch (err) {}
		}
	}
}

function buildTree(folder, tree, fileTypes) {
	tree.remove(tree.items[0]);
	var folderContentArray = folder.getFiles();
	var folderNode = tree.add('node', folder.displayName);
	createHierarchy(folderContentArray, folderNode, fileTypes);
	cleanHierarchy(tree);
	optimizeHierarchy(tree);
}

function buildTxtSearchTree(tree, obj, compArray, progressBar) {
	var sKey = obj.sKey; var vis = obj.vis; var matchCase = obj.matchCase; var matchAccent = obj.matchAccent; var invert = !obj.invert;
	if (!matchCase) sKey = sKey.toLowerCase();
	if (!matchAccent) sKey = sKey.replaceSpecialCharacters();
	while (tree.items.length > 0) {
		tree.remove(tree.items[0]);
	}
	progressBar.maxvalue = compArray.length;
	progressBar.value = 0;
	for (i = 0; i < compArray.length; i++) {
		try {
			var comp = compArray[i];
			var compName = limitNameSize(comp.name, 45);
			var compItem = tree.add('node', compName);
			if (typeof compTogIcon !== 'undefined') {
				compItem.image = compTogIcon.light;
			}
			compItem.comp = comp;
			for (var l = 1; l <= comp.numLayers; l++) {
				var txtLayer = comp.layer(l);
				if (!(txtLayer instanceof TextLayer)) continue;
				if (vis && !txtLayer.enabled) continue;
				var matchResult = false;
				var doc = txtLayer.property('ADBE Text Properties').property('ADBE Text Document');
				var refTime = comp.duration < 1 ? 0 : txtLayer.inPoint + (txtLayer.outPoint - txtLayer.inPoint) / 2;
				var layerName = '#' + txtLayer.index + '  ' + limitNameSize(txtLayer.name, 35);
				if (refTime > comp.duration) refTime = comp.duration - comp.frameDuration;
				if (doc.expression != '') comp.time = refTime;
				var sTxt = getTextLayerContent(txtLayer);
				if (doc.value.allCaps) sTxt = sTxt.toUpperCase();
				if (!matchCase) sTxt = sTxt.toLowerCase();
				if (!matchAccent) sTxt = sTxt.replaceSpecialCharacters();
				if (sTxt.match(sKey)) matchResult = true;
				if (matchResult != invert) continue;
				var txtItem = compItem.add('item', layerName);
				txtItem.comp = comp;
				txtItem.refTime = comp.time;
				txtItem.txtLayer = txtLayer;
				if (doc.numKeys > 0) {
					compItem.remove(txtItem);
					for (var k = 1; k <= doc.numKeys; k++) {
						comp.time = doc.keyTime(k);
						sTxt = getTextLayerContent(txtLayer);
						if (doc.value.allCaps) sTxt = sTxt.toUpperCase();
						if (!matchCase) sTxt = sTxt.toLowerCase();
						if (!matchAccent) sTxt = sTxt.replaceSpecialCharacters();
						if (sTxt.match(sKey)) matchResult = true;
						if (matchResult != invert) continue;
						var txtItem = compItem.add('item', layerName);
						txtItem.comp = comp;
						txtItem.refTime = comp.time;
						txtItem.txtLayer = txtLayer;
					}
				}
			}
			progressBar.value++;
		} catch (err) {
			alert(lol + '#FND_019 - comp: ' + comp.name + '\n' + err.message);
		}
	}
	cleanHierarchy(tree);
}

function expandNodes(nodeTree) {
	var count = 0;
	var branches = nodeTree.items;
	nodeTree.expanded = true;
	for (var i = 0; i < branches.length; i++) {
		if (branches[i].type == 'node') count += expandNodes(branches[i]);
		count++;
	}
	return count;
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

function populateTreeFromData(treeNode, dataArray) {
    for (var i = 0; i < dataArray.length; i++) {
        var itemData = dataArray[i];
        if (itemData.type === 'node') {
            var node = treeNode.add('node', itemData.text);
            if (typeof D9T_FOLDER_AE_ICON !== 'undefined') {
                node.image = D9T_FOLDER_AE_ICON;
            }
            if (itemData.children && itemData.children.length > 0) {
                populateTreeFromData(node, itemData.children);
            }
        } else if (itemData.type === 'item') {
            var item = treeNode.add('item', itemData.text);
            if (typeof D9T_AE_ICON !== 'undefined') {
                item.image = D9T_AE_ICON;
            }
            item.filePath = itemData.filePath;
            item.modDate = itemData.modDate;
            item.size = itemData.size;
        }
    }
}

// ALTERAÇÃO: Esta é a versão iterativa e segura que previne o erro "Stack overrun".
function flattenData(dataArray) {
    var flatList = [];
    if (!dataArray) return flatList;
    var nodesToProcess = dataArray.slice(0); 
    while (nodesToProcess.length > 0) {
        var node = nodesToProcess.pop();
        if (!node) continue;
        if (node.type === 'item') {
            flatList.push(node);
        } else if (node.type === 'node' && node.children) {
            for (var i = node.children.length - 1; i >= 0; i--) {
                nodesToProcess.push(node.children[i]);
            }
        }
    }
    return flatList.reverse();
}