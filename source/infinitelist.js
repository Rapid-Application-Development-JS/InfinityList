/**
 * @param {Number} index
 * @param {Element} item
 * @constructor
 */
function ItemHolder (index, item) {
	this.index = index;
	this.item = item;
	ItemHolder.prototype = {
		index: -1,
		item: undefined,
		position: 0,
		visible: true
	};
}
/**
 * @param {HTMLElement} container
 * @param {Object} adapter
 * @param {String} direction
 * @constructor
 */
function InfiniteList(container, adapter, direction) {
	if (container instanceof Element === false) {
		throw "Container is not an HTML element";
	}
	if (container.firstElementChild === null) {
		throw "Object's first child element is empty";
	}
	if (!adapter || typeof adapter.getCount !== "function" || typeof adapter.getItem !== "function") {
		throw "Assigned adapter has no support of `getCount` and `getItem` methods";
	}
	direction = (direction + "").toLowerCase();
	if (["h", "v", "horizontal", "vertical"].indexOf(direction) === -1) {
		throw "Wrong scroll direction [" + direction + "]";
	}
	// Assign arguments
	this.adapter = adapter; // {getItem, getItem}
	this.elContainer = container; // HTML Element
	this.elWrapper = container.firstElementChild; // HTML Element
	this.isVertical = direction === "vertical" || direction === "v";
	// Construction part
	this.items = []; // Items in scroll
	this.itemsInvisible = []; // Invisile items
	this.requestAnimationFrameStep = this.requestAnimationFrameStep.bind(this);
	this.onScroll = this.onScroll.bind(this);
	this.refresh = this.refresh.bind(this);
	container.addEventListener("scroll", this.onScroll, false);
	window.addEventListener("resize", this.refresh, false);
	// Create destroy method
	this.destroy = function () {
		container.removeEventListener("scroll", this.onScroll);
		window.removeEventListener("resize", this.refresh);
		this.state.inAnimation = false;
		window.cancelAnimationFrame(this.requestAnimationFrameID);
		this.elWrapper.innerHTML = "";
		this.adapter = null;
		this.elContainer = null;
		this.elWrapper = null;
		this.items = null;
		this.itemsInvisible = null;
		delete this.requestAnimationFrameStep;
		delete this.onScroll;
		delete this.refresh;
	};
	// Update full status
	this.state = {};
	/**
	 * Is animation happening
	 * @type {boolean}
	 */
	this.state.inAnimation = false;
	/**
	 * Heigth or width of item in pixels
	 * @type {Number}
	 */
	this.state.itemSize = 0;
	/**
	 * Height or width of container (Window)
	 * @type {Number}
	 */
	this.state.containerSize = 0;
	/**
	 * Index of element in bottom / right
	 * @type {Number}
	 */
	this.state.lastIndex = -1;
	/**
	 * Top padding from container
	 * @type {Number}
	 */
	this.state.containerPadding = 0;
	this.refresh(true);
}
InfiniteList.prototype = {
	isVertical: undefined,
	onScroll: function () {
		// Stop filling list
		window.cancelAnimationFrame(this.requestAnimationFrameID);
		this.state.inAnimation = false;
		// Give it rest
		this.requestAnimationFrameID = window.requestAnimationFrame(this.requestAnimationFrameStep);
	},
	requestAnimationFrameStep: function () {
		var elementPadCoord = propGet(this.elWrapper.getBoundingClientRect(), this.isVertical ? "top" : "left");
		if (this.state.containerPadding !== elementPadCoord) {
			this.fillList(this.state.containerPadding, elementPadCoord);
			this.state.containerPadding = elementPadCoord;
		}
		// Start new animation iteration
		if (this.state.inAnimation) {
			this.requestAnimationFrameID = window.requestAnimationFrame(this.requestAnimationFrameStep);
		}
	},
	/**
	 * Fill container list with items
	 * @param {Number} lastPos_elPadCoord
	 * @param {Number} newPosition_elPadCoord
	 */
	fillList: function (lastPos_elPadCoord, newPosition_elPadCoord) {
		var index, itemsLength, itemHolder, itemsCount = this.adapter.getCount(), minVisibleIndex, maxVisibleIndex;
		// Mark items as `invisible`
		for (index = 0, itemsLength = this.items.length; index < itemsLength; index += 1) {
			itemHolder = this.items[index];
			if (itemHolder.visible) {
				// Mark on top
				if ((itemHolder.position + this.state.itemSize + newPosition_elPadCoord) < 0) {
					itemHolder.visible = false;
					this.itemsInvisible.push(itemHolder);
				}
				// Mark on bottom
				if ((itemHolder.position + newPosition_elPadCoord) > this.state.containerSize) {
					itemHolder.visible = false;
					this.itemsInvisible.push(itemHolder);
					if (this.state.lastIndex >= itemHolder.index) {
						this.state.lastIndex = itemHolder.index - 1;
					}
				}
			}
		}
		// Find min and max real visible index
		for (index = 0, itemsLength = this.items.length; index < itemsLength; index += 1) {
			itemHolder = this.items[index];
			if (itemHolder.visible) {
				if (minVisibleIndex === undefined || itemHolder.index < minVisibleIndex) {
					minVisibleIndex = itemHolder.index;
				}
				if (maxVisibleIndex === undefined || itemHolder.index > maxVisibleIndex) {
					maxVisibleIndex = itemHolder.index;
				}
			}
		}
		// If we don't have visible items
		if (minVisibleIndex === undefined && maxVisibleIndex === undefined) {
			// Create fake bottom index
			this.state.lastIndex =
				Math.min(Math.floor(Math.abs(-newPosition_elPadCoord / this.state.itemSize)), itemsCount) || -1;
		}
		// Fill bottom part by new items
		while (
		(this.state.lastIndex < itemsCount - 1)
		&&
		(this.state.lastIndex * this.state.itemSize + newPosition_elPadCoord < this.state.containerSize)
			) {
			this.state.lastIndex += 1;
			this.applyItem(this.state.lastIndex);
		}
		// Fill top part with new items
		if (typeof minVisibleIndex === "number") {
			while (minVisibleIndex > 0 && minVisibleIndex * this.state.itemSize + newPosition_elPadCoord > 0) {
				minVisibleIndex -= 1;
				this.applyItem(minVisibleIndex);
			}
		}
		// Hide invisible items
		this.itemsInvisible.forEach(this.hideItem, this);
	},
	/**
	 * Hide item
	 * @param {Object} itemHolder
	 */
	hideItem: function (itemHolder) {
		propSet(itemHolder.item.style, this.isVertical ? "left" : "top" ,"200%");
	},
	/**
	 * Get height or width of item
	 * @return {Number}
	 */
	getItemSize: function () {
		var size, item;
		item = this.adapter.getItem(0, null);
		this.elWrapper.appendChild(item);
		size = propGet(item.getBoundingClientRect(), this.isVertical ? "height": "width");
		this.elWrapper.removeChild(item);
		return size;
	},
	/**
	 * Set item position in container
	 * @param {Object} itemHolder
	 */
	setItemPosition: function (itemHolder) {
		propSet(itemHolder.item.style, this.isVertical ? "top" : "left", itemHolder.position + "px");
		propSet(itemHolder.item.style, this.isVertical ? "left" : "top" , 0);
	},
	/**
	 * Create item holder if not exists
	 * @param {Number} index
	 * @return {Object}
	 */
	createNewItemHolder: function (index) {
		var item = this.adapter.getItem(index, null), itemHolder;
		this.elWrapper.appendChild(item);
		itemHolder = new ItemHolder(index, item);
		this.items.push(itemHolder);
		return itemHolder;
	},
	/**
	 * Apply item to container
	 * @param {Number} index
	 */
	applyItem: function (index) {
		var itemHolder = this.itemsInvisible.pop() || this.createNewItemHolder(index);
		itemHolder.position = index * this.state.itemSize;
		itemHolder.index = index;
		itemHolder.visible = true;
		this.adapter.getItem(itemHolder.index, itemHolder.item);
		this.setItemPosition(itemHolder);
	},
	/**
	 * Refresh scroll
	 * @param {boolean=true} noDelay
	 */
	refresh: function (noDelay) {
		var delay = noDelay ? 0 : 150;
		clearTimeout(this.refreshID);
		this.refreshID = setTimeout(function () {
			// Stop filling
			window.cancelAnimationFrame(this.requestAnimationFrameID);
			this.state.inAnimation = false;
			// Update state
			this.state.containerPadding =
				propGet(this.elWrapper.getBoundingClientRect(), this.isVertical ? "top" : "left");
			this.state.itemSize = this.getItemSize();
			this.state.containerSize = this.elContainer.offsetHeight;
			// Update wrapper size
			propSet(this.elWrapper.style, this.isVertical ? "height" : "width",
				this.state.itemSize * this.adapter.getCount() + "px");
			// Recalculate items positions
			for (var index = 0, itemLength = this.items.length; index < itemLength; index += 1) {
				this.items[index].position = this.items[index].index * this.state.itemSize;
			}
			// Fill list
			this.fillList(this.state.containerPadding, this.state.containerPadding);
		}.bind(this), delay);
	}
};
