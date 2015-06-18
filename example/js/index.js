(function () {
	/**
	 * Helper to generate colors
	 * @type {{_colors: string[], random: Function}}
	 */
	var ColorGen = {
		_colors: [
			"0,153,229", "0,167,142", "2,100,102", "26,214,253", "52,170,220",
			"52,191,73", "82,237,199", "90,212,39", "125,63,152", "135,252,112",
			"155,89,182", "198,68,252", "200,110,223", "207,220,0", "239,77,182",
			"243,236,25", "255,73,129", "255,76,76", "255,94,58", "255,149,0",
			"255,217,0", "55,219,76"
		],
		random: function (opacity) {
			return "rgba(" + ColorGen._colors[Math.floor(Math.random() * ColorGen._colors.length)] + "," + opacity + ")";
		}
	};
	/**
	 * Adapter object
	 * @param {String} direction
	 * @param {Function} onElementCreated
	 * @constructor
	 */
	function Adapter(direction, onElementCreated) {
		this.direction = direction;
		this.onElementCreated = onElementCreated.bind(this) || new Function;
	}
	Adapter.prototype = {
		/**
		 * Get total count of items
		 * @return {number}
		 * @public
		 */
		getCount: function () {
			return 1000;
		},
		/**
		 * Get item as HTMLElement
		 * @param {Number} index
		 * @param {Object} element
		 * @return {HTMLElement|Object}
		 * @public
		 */
		getItem: function (index, element) {
			// Create item element if it doesn"t exist
			if (!element) {
				element = document.createElement("div");
				this.onElementCreated(element);
			}
			// Fill by content
			element.innerHTML = "<div>" + index + "</div>";
			return element;
		}
	};
	// Application initizlization
	var direction = ["vertical", "horizontal"][0];
	var container = document.querySelector(".container");
	container.classList.add(direction);
	var infiniteListStyling = function (element) {
		element.className = "item";
		element.classList.add("item");
		element.classList.add(this.direction);
		element.style.backgroundColor = ColorGen.random(.75);
	};
	var adapter = new Adapter(direction, infiniteListStyling);
	container.list = new RADJS_InfiniteList(container, adapter, direction);
}());
