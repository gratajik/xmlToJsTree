/**
 *
 * @param xmlData - The xml document.  This will be converted to json and used by the tree
 * @param treeElement - the HTML element that the tree will be generated inside of
 * @param treeConfig - The jsTree configuration json (see JsTree docs)
 * @param funcTitleDecorator - This callback will be called on generating each nodes title.  The XPath to the current
 * node will be passed. The decorator can use that to modify the title
 * @param treeSearchElement - If you want search enabled, pass the HTML element that will be the search box
 * @constructor
 */
function XmlToJsTree(xmlData, treeElement, treeConfig, includeRootSlash, funcTitleDecorator, treeSearchElement) {
    this.xmlData = xmlData;
    this.treeElement = treeElement;
    this.treeConfig = treeConfig

    this.includeRootSlash = includeRootSlash
    this.funcTitleDecorator = funcTitleDecorator
    this.treeSearchElement = treeSearchElement

    this.generate();
}
/* <-------------------- Private Functions --------------------> */
XmlToJsTree.prototype.generate = function () {
    var rootNode = $(this.xmlData).children(':first-child');
    var children = new Array();
    var path = ""

    if(this.includeRootSlash) {
        path = "/" + rootNode[0].nodeName
    }
    else {
        path = rootNode[0].nodeName
    }

    this.vsTraverse($(rootNode), children, path, false);


    var decoration = ""
    if (this.funcTitleDecorator != null) {
        decoration = this.funcTitleDecorator("")
    }

    this.initTree({
        "id": "root_node",
        "text": rootNode[0].nodeName + " " + decoration, "children": children,
        "state": {"opened": true },
        "a_attr": {"path": rootNode[0].nodeName}
    });

    if (this.treeSearchElement != null) {
        var to = false;
        var tree = this.treeElement
        var treeSearchElement = this.treeSearchElement
        $('#jstree_q').keyup(function () {

            if (to) {
                clearTimeout(to);
            }

            to = setTimeout(function () {
                var searchTerm = treeSearchElement.val();

                if (searchTerm.length > 2) {
                    tree.jstree(true).search(searchTerm, false);
                }
            }, 500);
        });
    }
}

XmlToJsTree.prototype.initTree = function (data) {
    this.treeConfig.core.data = data
    this.treeElement.jstree(this.treeConfig);
}

XmlToJsTree.prototype.isArray = function (node) {
    var children = $(node).children();
    if (children.length < 2) { // Arrays have to have more than one element
        return false
    }

    var name = ""

    for (var i = 0; i < children.length; i++) {
        var nodeName = children[i].nodeName

        if (nodeName != name) {
            if (name != "") {
                return false // Arrays have exactly the same node names
            } else {
                name = nodeName
            }
        }
    }

    return true
}

XmlToJsTree.prototype.vsTraverse = function (node, arr, path, parentIsArray) {
    var children = $(node).children();

    for (var i = 0; i < children.length; i++) {
        var nodePath = path
        var seperator = ""
        if (path != "" && path != "/") {
            seperator = "/"
        }

        if (parentIsArray) {
            nodePath = nodePath + "/" + children[i].nodeName + "[" + i + "]"
        }
        else {
            nodePath = nodePath + seperator + children[i].nodeName
        }

        var childrenArray = new Array();
        var arrayInfo = ""
        var isArray = this.isArray(children[i])
        if (isArray) {
            arrayInfo = " (" + $(children[i]).children().length + ")"
        }

        this.vsTraverse(children[i], childrenArray, nodePath, isArray);

        var decoration = ""
        if (this.funcTitleDecorator != null) {
            decoration = this.funcTitleDecorator(nodePath)
        }

        var attributes = this.vsTraverseAtt(children[i], nodePath);
        if (null != attributes) {
            for (x = 0; x < attributes.length; x++) {
                childrenArray.push(attributes[x])
            }
        }


        if (null != children[i].firstChild && 3 == children[i].firstChild.nodeType) {

            if (childrenArray.length > 0) {

                arr.push({"a_attr": {"path": nodePath, "isArray": isArray}, "text": children[i].nodeName + " " + children[i].firstChild.textContent + arrayInfo + decoration, "children": childrenArray, "state": {"opened": false }});
            } else {
                var values = new Array();
                values.push({"a_attr": {"path": nodePath}, "icon": false, "text": "" + children[i].firstChild.textContent});
                arr.push({"a_attr": {"path": nodePath, "isArray": isArray}, "text": children[i].nodeName + arrayInfo + decoration, "children": values, "state": {"opened": false }});
            }

        } else {
            if (childrenArray.length > 0) {
                arr.push({"a_attr": {"path": nodePath, "isArray": isArray}, "text": children[i].nodeName + arrayInfo + decoration, "children": childrenArray, "state": {"opened": false }});
            } else {
                arr.push({"a_attr": {"path": nodePath, "isArray": isArray}, "text": children[i].nodeName + arrayInfo + decoration, "state": {"opened": false }});
            }
        }
    }
}

XmlToJsTree.prototype.vsTraverseAtt = function (node, path) {
    var attributes = null;
    if (null != node.attributes && node.attributes.length > 0) {
        attributes = new Array();
        for (var i = 0; i < node.attributes.length; i++) {
            var decoration = ""
            var pathAttr = path + "/@" + node.attributes[i].nodeName
            if (this.funcTitleDecorator != null) {
                decoration = this.funcTitleDecorator(pathAttr)
            }
            attributes.push({"a_attr": {"path": pathAttr}, "icon": false, "text": "@" + node.attributes[i].nodeName + " = " + node.attributes[i].nodeValue + " " + decoration});
        }
    }

    return attributes;
}
