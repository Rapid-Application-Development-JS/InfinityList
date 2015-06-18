function propGet(target, key, empty) {
	return key in target ? target[key] : empty;
}

function propSet(target, key, value) {
	target[key] = value;
}
