var extend = require('extend');

var defaultOptions = {
    propName: "links"
};

function hateoas(options) {
    options = extend({}, defaultOptions, options);
    if (!options.baseUrl) {
        throw Error("Missing required argument 'baseUrl'");
    }

    if (options.baseUrl[options.baseUrl.length-1] == "/") {
        options.baseUrl = options.baseUrl.substring(0, options.baseUrl.length-1);
    }

    var linkHandlers = {};
    var collectionLinkHandlers = {};

    function registerLinkHandler(type, handler) {
        if (!linkHandlers[type]) {
            linkHandlers[type] = [];
        }
        linkHandlers[type].push(handler);
    }

    function registerCollectionLinkHandler(type, handler) {
        if (!collectionLinkHandlers[type]) {
            collectionLinkHandlers[type] = [];
        }
        collectionLinkHandlers[type].push(handler);
    }

    function prefix(link) {
        if (!link.length || link[0] !== "/") {
            return link;
        }

        return options.baseUrl + link;
    }

    function getLinksGeneric(handlers, type, data) {
        if (handlers[type]) {
			var args = Array.prototype.slice.call(arguments, 2);
            var links = handlers[type].reduce(function(links, handler) {
				var a = args.concat([type, links]);
                return extend({}, links, handler.apply(this, a));
            }, {});

            return Object.keys(links).reduce(function(prefixedLinks, linkName) {
                prefixedLinks[linkName] = prefix(links[linkName]);
                return prefixedLinks;
            }, {});
        } else {
            return [];
        }
    }

    var getLinks = getLinksGeneric.bind(null, linkHandlers);
    var getCollectionLinks = getLinksGeneric.bind(null, collectionLinkHandlers);

    function linkCollection(type, collection) {
        var result = {
            data: collection.map(link.bind(null, type))
        };
        var args = Array.prototype.slice.call(arguments);
		result[options.propName] = getCollectionLinks.apply(this, args);
        return result;
    }

    function link(type, data) {
        if (Array.isArray(data)) {
			var args = Array.prototype.slice.call(arguments);
            return linkCollection.apply(this, args);
        }

        if (linkHandlers[type]) {
            data[options.propName] = getLinks(type, data);
            return data;
        } else {
            return data;
        }
    }


    return {
        registerLinkHandler: registerLinkHandler,
        registerCollectionLinkHandler: registerCollectionLinkHandler,
        getLinks: getLinks,
        link: link
    };
}

module.exports = hateoas;
